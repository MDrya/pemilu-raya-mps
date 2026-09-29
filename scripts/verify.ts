// End-to-end verification against the real Supabase project (the test checklist).
// Signs in as anon, panitia, and bilik, runs a full election, and checks every
// database-level rule, including truly concurrent votes and Realtime payloads.
//
//   npm run verify            (asks for the two staff passwords)
//   npm run verify -- --yes   (skip the reset confirmation)
//
// Optional env vars: PANITIA_EMAIL, PANITIA_PASSWORD, BILIK_EMAIL, BILIK_PASSWORD.
// ⚠️ Resets the election at the start and again at the end (demo_reset).

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createInterface } from 'node:readline/promises'

process.loadEnvFile('.env.local')
const URL = process.env.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_ANON_KEY
if (!URL || !KEY) throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing in .env.local')

const newClient = () => createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } })

// ---------------------------------------------------------------- prompts ---

async function ask(question: string) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(question)
  rl.close()
  return answer.trim()
}

function askHidden(question: string): Promise<string> {
  process.stdout.write(question)
  const stdin = process.stdin
  if (!stdin.isTTY) return ask('')
  return new Promise((resolve) => {
    let value = ''
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n' || ch === '\u0004') {
          stdin.setRawMode(false)
          stdin.pause()
          stdin.off('data', onData)
          process.stdout.write('\n')
          resolve(value)
          return
        }
        if (ch === '\u0003') process.exit(130)
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1)
        else value += ch
      }
    }
    stdin.on('data', onData)
  })
}

// ---------------------------------------------------------------- helpers ---

const results: { name: string; ok: boolean; detail?: string }[] = []

async function check(name: string, fn: () => Promise<string | void>) {
  try {
    const detail = await fn()
    results.push({ name, ok: true, detail: detail || undefined })
    console.log(`  \x1b[32m✓\x1b[0m ${name}${detail ? `  \x1b[2m→ ${detail}\x1b[0m` : ''}`)
  } catch (e) {
    results.push({ name, ok: false, detail: (e as Error).message })
    console.log(`  \x1b[31m✗ ${name}\n      ${(e as Error).message}\x1b[0m`)
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

async function rpc<T = unknown>(client: SupabaseClient, fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await client.rpc(fn, args)
  if (error) throw new Error(error.message)
  return data as T
}

/** Resolves with the error message; fails if the call succeeds or says something else. */
async function rejects(call: Promise<unknown>, expected: string) {
  try {
    await call
  } catch (e) {
    const message = (e as Error).message
    assert(message.includes(expected), `expected "${expected}", got "${message}"`)
    return message
  }
  throw new Error(`expected failure "${expected}", but it succeeded`)
}

async function waitFor(predicate: () => boolean, what: string, ms = 8000) {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`)
    await new Promise((r) => setTimeout(r, 100))
  }
  return `${Date.now() - start} ms`
}

// ------------------------------------------------------------------- main ---

const autoYes = process.argv.includes('--yes')
console.log('\nPEMILU verification against', URL)
console.log('⚠️  This resets the election (all votes cleared) at the start and at the end.')
if (!autoYes && !/^y(es)?$/i.test(await ask('Continue? (y/N) '))) process.exit(0)

const panitiaEmail = process.env.PANITIA_EMAIL ?? 'panitia@demo.local'
const bilikEmail = process.env.BILIK_EMAIL ?? 'bilik@demo.local'
const panitiaPassword = process.env.PANITIA_PASSWORD ?? (await askHidden(`Password for ${panitiaEmail}: `))
const bilikPassword = process.env.BILIK_PASSWORD ?? (await askHidden(`Password for ${bilikEmail}: `))

const anon = newClient()
const panitia = newClient()
const bilik = newClient()

console.log('\nSign-in')
await check('panitia signs in with role panitia', async () => {
  const { error } = await panitia.auth.signInWithPassword({ email: panitiaEmail, password: panitiaPassword })
  if (error) throw new Error(error.message)
  assert((await rpc(panitia, 'my_role')) === 'panitia', 'role is not panitia')
})
await check('bilik signs in with role bilik', async () => {
  const { error } = await bilik.auth.signInWithPassword({ email: bilikEmail, password: bilikPassword })
  if (error) throw new Error(error.message)
  assert((await rpc(bilik, 'my_role')) === 'bilik', 'role is not bilik')
})
if (results.some((r) => !r.ok)) {
  console.log('\nCannot continue without both staff accounts.')
  process.exit(1)
}

const integrity = async () =>
  (await panitia.rpc('get_integrity').single()).data as {
    voters_sudah: number
    tally_total: number
    turnout_count: number
    ok: boolean
  }
const turnout = async () =>
  (await anon.from('public_turnout').select('total_dpt, voted_count, status').single()).data as {
    total_dpt: number
    voted_count: number
    status: string
  }
const expectIntegrity = async (n: number) => {
  const i = await integrity()
  assert(i.ok && i.voters_sudah === n && i.tally_total === n && i.turnout_count === n, `integrity ${JSON.stringify(i)}, expected ${n} everywhere`)
  return `${n} = ${n} = ${n}`
}
const boothStatus = async (id: number) =>
  ((await bilik.from('booths').select('status').eq('id', id).single()).data as { status: string }).status
const voterStatus = async (id: string) =>
  ((await panitia.from('voters').select('status').eq('id', id).single()).data as { status: string }).status

console.log('\nReset')
await check('demo_reset → clean starting state', async () => {
  await rpc(panitia, 'demo_reset')
  const t = await turnout()
  assert(t.voted_count === 0 && t.status === 'belum_dibuka', `turnout ${JSON.stringify(t)}`)
  return `${await expectIntegrity(0)}, DPT ${t.total_dpt}`
})

console.log('\n#11 Anonymous access')
for (const table of ['tally', 'voters', 'booth_assignments', 'booths', 'staff_roles']) {
  await check(`anon cannot read ${table}`, async () => {
    const { data, error } = await anon.from(table).select('*').limit(1)
    assert(error || (data?.length ?? 0) === 0, `anon read ${data?.length} row(s)`)
    return error?.message ?? 'no rows'
  })
}
await check('anon cannot call cast_vote / demo_reset', async () => {
  await rejects(rpc(anon, 'cast_vote', { p_booth_id: 1, p_candidate_id: crypto.randomUUID() }), 'permission denied')
  await rejects(rpc(anon, 'demo_reset'), 'permission denied')
})
await check('bilik cannot read voters or tally', async () => {
  const v = await bilik.from('voters').select('id').limit(1)
  assert((v.data?.length ?? 0) === 0, 'bilik read voters')
  const t = await bilik.from('tally').select('*').limit(1)
  assert(t.error, 'bilik read tally')
})

// Realtime listeners: what the public page and the booth device receive.
type Event = { at: number; table: string; row: Record<string, unknown> }
const publicEvents: Event[] = []
const boothEvents: Event[] = []
const subscribe = (client: SupabaseClient, name: string, tables: string[], sink: Event[]) =>
  new Promise<void>((resolve, reject) => {
    let channel = client.channel(`${name}-${crypto.randomUUID()}`)
    for (const table of tables) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) =>
        sink.push({ at: Date.now(), table, row: { ...(payload.new as object), ...(payload.old as object) } }),
      )
    }
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve()
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(new Error(`realtime ${status}`))
    })
  })

console.log('\nRealtime')
await check('public + booth devices subscribe to Realtime', async () => {
  await subscribe(anon, 'public', ['public_turnout', 'public_results'], publicEvents)
  bilik.realtime.setAuth((await bilik.auth.getSession()).data.session!.access_token)
  await subscribe(bilik, 'booth', ['booths'], boothEvents)
})

const { data: candidateRows } = await anon.from('candidates').select('*').order('nomor_urut')
const candidates = (candidateRows ?? []) as { id: string; nomor_urut: number }[]
const { data: voterRows } = await panitia.from('voters').select('id').eq('status', 'belum').order('nis').limit(5)
const [v0, v1, v2, v3] = ((voterRows ?? []) as { id: string }[]).map((v) => v.id)

console.log('\nVoting open')
await check('panitia opens voting; public page is told live', async () => {
  await rpc(panitia, 'set_election_status', { new_status: 'dibuka' })
  return await waitFor(() => publicEvents.some((e) => e.row.status === 'dibuka'), 'public status event')
})
await check('#3 locked booth cannot vote (direct call)', () =>
  rejects(rpc(bilik, 'cast_vote', { p_booth_id: 1, p_candidate_id: candidates[0].id }), 'Bilik sedang terkunci'),
)
await check('panitia unlocks Bilik 1; booth device is told live', async () => {
  await rpc(panitia, 'assign_voter_to_booth', { p_voter_id: v0, p_booth_id: 1 })
  return await waitFor(() => boothEvents.some((e) => e.row.id === 1 && e.row.status === 'terbuka'), 'booth unlock event')
})
await check('#12 (data side) booth state re-read shows terbuka', async () => {
  assert((await boothStatus(1)) === 'terbuka', 'booth 1 not terbuka')
})
await check('#4 voter in booth cannot be assigned again', () =>
  rejects(rpc(panitia, 'assign_voter_to_booth', { p_voter_id: v0, p_booth_id: 2 }), 'sedang berada di bilik'),
)
await check('#8 voting cannot close while a booth is unlocked', () =>
  rejects(rpc(panitia, 'set_election_status', { new_status: 'ditutup' }), 'Masih ada bilik yang terbuka'),
)
await check('#2 no per-candidate numbers in public responses while open', async () => {
  const r = await anon.from('public_results').select('*')
  assert(same(r.data, []), `public_results returned ${JSON.stringify(r.data)}`)
  const t = await anon.from('public_turnout').select('*').single()
  assert(same(Object.keys(t.data ?? {}).sort(), ['id', 'status', 'total_dpt', 'voted_count']), `turnout keys ${Object.keys(t.data ?? {})}`)
  const c = await anon.from('candidates').select('*').limit(1).single()
  assert(!Object.keys(c.data ?? {}).some((k) => /vote|count|tally/i.test(k)), 'candidate row has a count field')
  return 'public_results = [], turnout has totals only'
})
await check('#5 double tap records exactly one vote', async () => {
  const calls = await Promise.allSettled([
    rpc(bilik, 'cast_vote', { p_booth_id: 1, p_candidate_id: candidates[0].id }),
    rpc(bilik, 'cast_vote', { p_booth_id: 1, p_candidate_id: candidates[0].id }),
  ])
  const ok = calls.filter((c) => c.status === 'fulfilled').length
  assert(ok === 1, `${ok} of 2 simultaneous calls succeeded`)
  const failed = calls.find((c) => c.status === 'rejected') as PromiseRejectedResult
  assert(String(failed.reason.message).includes('Bilik sedang terkunci'), `2nd call said: ${failed.reason.message}`)
  assert((await boothStatus(1)) === 'terkunci', 'booth did not re-lock')
  return await expectIntegrity(1)
})
await check('#4 voter who already voted cannot be assigned', () =>
  rejects(rpc(panitia, 'assign_voter_to_booth', { p_voter_id: v0, p_booth_id: 1 }), 'sudah menggunakan hak suaranya'),
)
await check('#7 cancel returns voter to Belum Memilih, adds no vote', async () => {
  await rpc(panitia, 'assign_voter_to_booth', { p_voter_id: v1, p_booth_id: 2 })
  await rpc(panitia, 'cancel_booth', { p_booth_id: 2 })
  assert((await voterStatus(v1)) === 'belum', 'voter not back to belum')
  assert((await boothStatus(2)) === 'terkunci', 'booth 2 not locked')
  return await expectIntegrity(1)
})
await check('#6 three booths voting at the same moment all count', async () => {
  await rpc(panitia, 'assign_voter_to_booth', { p_voter_id: v1, p_booth_id: 1 })
  await rpc(panitia, 'assign_voter_to_booth', { p_voter_id: v2, p_booth_id: 2 })
  await rpc(panitia, 'assign_voter_to_booth', { p_voter_id: v3, p_booth_id: 3 })
  await Promise.all([1, 2, 3].map((b) => rpc(bilik, 'cast_vote', { p_booth_id: b, p_candidate_id: candidates[b - 1].id })))
  return await expectIntegrity(4)
})
await check('#10 demo_simulate(150) keeps integrity green; results stay hidden', async () => {
  const cast = await rpc<number>(panitia, 'demo_simulate', { n: 150 })
  assert(cast === 150, `simulated ${cast}`)
  const r = await anon.from('public_results').select('*')
  assert(same(r.data, []), 'public_results not empty')
  return await expectIntegrity(154)
})

console.log('\nClosing')
const closedAt = Date.now()
await check('#9 close publishes results; totals match turnout', async () => {
  await rpc(panitia, 'set_election_status', { new_status: 'ditutup' })
  const r = (await anon.from('public_results').select('candidate_id, vote_count')).data as { vote_count: number }[]
  const sum = r.reduce((s, x) => s + x.vote_count, 0)
  const t = await turnout()
  assert(r.length === candidates.length, `${r.length} result rows`)
  assert(sum === t.voted_count && t.status === 'ditutup', `sum ${sum} vs turnout ${t.voted_count} (${t.status})`)
  return `${r.map((x) => x.vote_count).join(' + ')} = ${sum}`
})
await check('#9 results reach the public page live', () =>
  waitFor(() => publicEvents.some((e) => e.table === 'public_results'), 'public_results event'),
)
await check('#9 booths reject votes after close', () =>
  rejects(rpc(bilik, 'cast_vote', { p_booth_id: 1, p_candidate_id: candidates[0].id }), 'sudah ditutup'),
)
await check('#2 no per-candidate Realtime payload before close', async () => {
  const early = publicEvents.filter((e) => e.table === 'public_results' && e.at < closedAt)
  assert(early.length === 0, `${early.length} results event(s) before close`)
  const leaky = publicEvents.filter((e) => e.table === 'public_turnout' && Object.keys(e.row).some((k) => /tally|candidate/i.test(k)))
  assert(leaky.length === 0, 'turnout payload carried candidate data')
  return `${publicEvents.length} public events inspected`
})
await check('#10 integrity still green after close', () => expectIntegrity(154))

console.log('\nReset')
await check('#13 demo_reset returns everything to the initial state', async () => {
  await rpc(panitia, 'demo_reset')
  const t = await turnout()
  assert(t.voted_count === 0 && t.status === 'belum_dibuka', `turnout ${JSON.stringify(t)}`)
  const r = await anon.from('public_results').select('*')
  assert(same(r.data, []), 'public_results not empty')
  const open = await panitia.from('booths').select('id').eq('status', 'terbuka')
  assert(open.data?.length === 0, 'a booth is still open')
  const notBelum = await panitia.from('voters').select('id', { count: 'exact', head: true }).neq('status', 'belum')
  assert(notBelum.count === 0, `${notBelum.count} voters not belum`)
  return await expectIntegrity(0)
})

// ------------------------------------------------------------------ report ---

const failed = results.filter((r) => !r.ok)
console.log(
  `\n${failed.length === 0 ? '\x1b[32m' : '\x1b[31m'}${results.length - failed.length}/${results.length} checks passed\x1b[0m`,
)
await Promise.all([panitia.auth.signOut(), bilik.auth.signOut()])
await Promise.all([anon.removeAllChannels(), bilik.removeAllChannels()])
process.exit(failed.length === 0 ? 0 : 1)
