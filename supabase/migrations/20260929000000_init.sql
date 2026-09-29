-- =============================================================================
-- PEMILU — initial schema
-- Tables, row level security, RPC functions, and Realtime publication.
--
-- Secrecy rule: "who voted" (voters.status) and "what was chosen" (tally) are
-- never linked. There are no per-vote rows, timestamps, or session ids.
-- All writes go through the security-definer functions at the bottom.
--
-- Lock order used by every function (prevents deadlocks):
--   election -> booths -> booth_assignments -> voters -> tally -> public_turnout
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table public.election (
  id         int primary key default 1 check (id = 1),
  name       text not null,
  status     text not null default 'belum_dibuka'
             check (status in ('belum_dibuka', 'dibuka', 'ditutup')),
  opened_at  timestamptz,
  closed_at  timestamptz
);

create table public.candidates (
  id            uuid primary key default gen_random_uuid(),
  nomor_urut    int not null unique,
  ketua_nama    text not null,
  wakil_nama    text not null,
  visi          text not null,
  misi          text[] not null default '{}',
  accent_color  text not null,
  photo_url     text
);

-- Per-candidate counts. No client access at all; only the functions below touch it.
create table public.tally (
  candidate_id  uuid primary key references public.candidates on delete cascade,
  vote_count    int not null default 0 check (vote_count >= 0)
);

-- DPT (daftar pemilih tetap).
create table public.voters (
  id      uuid primary key default gen_random_uuid(),
  nis     text not null unique,            -- Nomor Induk Siswa
  nama    text not null,
  status  text not null default 'belum' check (status in ('belum', 'di_bilik', 'sudah'))
);

create table public.booths (
  id           int primary key,
  label        text not null,
  status       text not null default 'terkunci' check (status in ('terkunci', 'terbuka')),
  unlocked_at  timestamptz
);

-- Which voter is currently inside which booth. The row is deleted the moment
-- the vote is cast or the booth is cancelled.
create table public.booth_assignments (
  booth_id  int primary key references public.booths on delete cascade,
  voter_id  uuid not null unique references public.voters on delete cascade
);

-- Public mirror of turnout. Updated by the functions; Realtime enabled.
create table public.public_turnout (
  id           int primary key default 1 check (id = 1),
  total_dpt    int not null default 0,
  voted_count  int not null default 0,
  status       text not null default 'belum_dibuka'
               check (status in ('belum_dibuka', 'dibuka', 'ditutup'))
);

-- Public results. EMPTY until voting closes; filled from tally on close.
create table public.public_results (
  candidate_id  uuid primary key references public.candidates on delete cascade,
  vote_count    int not null
);

create table public.staff_roles (
  user_id  uuid primary key references auth.users on delete cascade,
  role     text not null check (role in ('panitia', 'bilik'))
);


-- -----------------------------------------------------------------------------
-- Role helpers
-- -----------------------------------------------------------------------------

-- Internal helpers live in a schema that the Data API does not expose.
create schema if not exists private;

-- The caller's staff role ('panitia' | 'bilik'), or null. Used by RLS policies
-- and by the frontend (supabase.rpc('my_role')) for redirects.
create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.staff_roles where user_id = auth.uid()
$$;

create or replace function private.require_role(required text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Silakan masuk terlebih dahulu';
  end if;
  if public.my_role() is distinct from required then
    raise exception 'Akses ditolak';
  end if;
end;
$$;


-- -----------------------------------------------------------------------------
-- Privileges + Row Level Security
-- Grants are explicit so the result doesn't depend on project defaults.
-- -----------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
revoke all on schema private from public, anon, authenticated;

grant select on public.election, public.candidates, public.public_turnout, public.public_results
  to anon, authenticated;
grant select on public.voters, public.booths, public.booth_assignments, public.staff_roles
  to authenticated;
-- public.tally: no grants at all.

alter table public.election          enable row level security;
alter table public.candidates        enable row level security;
alter table public.tally             enable row level security;
alter table public.voters            enable row level security;
alter table public.booths            enable row level security;
alter table public.booth_assignments enable row level security;
alter table public.public_turnout    enable row level security;
alter table public.public_results    enable row level security;
alter table public.staff_roles       enable row level security;

create policy "Everyone can read the election"
  on public.election for select to anon, authenticated using (true);

create policy "Everyone can read candidates"
  on public.candidates for select to anon, authenticated using (true);

create policy "Everyone can read turnout"
  on public.public_turnout for select to anon, authenticated using (true);

create policy "Everyone can read published results"
  on public.public_results for select to anon, authenticated using (true);

create policy "Panitia can read voters"
  on public.voters for select to authenticated
  using ((select public.my_role()) = 'panitia');

create policy "Panitia can read booth assignments"
  on public.booth_assignments for select to authenticated
  using ((select public.my_role()) = 'panitia');

create policy "Staff can read booths"
  on public.booths for select to authenticated
  using ((select public.my_role()) in ('panitia', 'bilik'));

create policy "Staff can read their own role"
  on public.staff_roles for select to authenticated
  using (user_id = (select auth.uid()));

-- public.tally: RLS enabled with no policies = no rows for any client role.


-- -----------------------------------------------------------------------------
-- RPC functions
-- Error messages are short Indonesian strings the UI can show directly.
-- Note: Supabase rejects UPDATE/DELETE without a WHERE clause coming through
-- the API (pg-safeupdate), even inside functions, hence the "where true".
-- -----------------------------------------------------------------------------

-- belum_dibuka -> dibuka, or dibuka -> ditutup. Closing publishes the results.
create or replace function public.set_election_status(new_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
begin
  perform private.require_role('panitia');

  select status into current_status from public.election where id = 1 for update;

  if new_status = 'dibuka' then
    if current_status <> 'belum_dibuka' then
      raise exception 'Pemungutan suara sudah pernah dibuka';
    end if;
    update public.election set status = 'dibuka', opened_at = now() where id = 1;

  elsif new_status = 'ditutup' then
    if current_status = 'belum_dibuka' then
      raise exception 'Pemungutan suara belum dibuka';
    elsif current_status = 'ditutup' then
      raise exception 'Pemungutan suara sudah ditutup';
    end if;
    -- Lock every booth so none can be unlocked while we check.
    perform 1 from public.booths for update;
    if exists (select 1 from public.booths where status = 'terbuka') then
      raise exception 'Masih ada bilik yang terbuka. Selesaikan atau batalkan dulu.';
    end if;
    update public.election set status = 'ditutup', closed_at = now() where id = 1;
    insert into public.public_results (candidate_id, vote_count)
      select candidate_id, vote_count from public.tally
      on conflict (candidate_id) do update set vote_count = excluded.vote_count;

  else
    raise exception 'Status tidak valid';
  end if;

  update public.public_turnout set status = new_status where id = 1;
end;
$$;


create or replace function public.assign_voter_to_booth(p_voter_id uuid, p_booth_id int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  election_status text;
  booth_status text;
  voter_status text;
begin
  perform private.require_role('panitia');

  select status into election_status from public.election where id = 1 for share;
  if election_status = 'belum_dibuka' then
    raise exception 'Pemungutan suara belum dibuka';
  elsif election_status = 'ditutup' then
    raise exception 'Pemungutan suara sudah ditutup';
  end if;

  select status into booth_status from public.booths where id = p_booth_id for update;
  if not found then
    raise exception 'Bilik tidak ditemukan';
  elsif booth_status = 'terbuka' then
    raise exception 'Bilik sedang digunakan';
  end if;

  select status into voter_status from public.voters where id = p_voter_id for update;
  if not found then
    raise exception 'Pemilih tidak ditemukan';
  elsif voter_status = 'di_bilik' then
    raise exception 'Pemilih sedang berada di bilik';
  elsif voter_status = 'sudah' then
    raise exception 'Pemilih sudah menggunakan hak suaranya';
  end if;

  update public.booths set status = 'terbuka', unlocked_at = now() where id = p_booth_id;
  insert into public.booth_assignments (booth_id, voter_id) values (p_booth_id, p_voter_id);
  update public.voters set status = 'di_bilik' where id = p_voter_id;
end;
$$;


-- Locks an unlocked booth again and returns its voter to 'belum'. Adds no vote.
create or replace function public.cancel_booth(p_booth_id int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  booth_status text;
  assigned_voter uuid;
begin
  perform private.require_role('panitia');

  select status into booth_status from public.booths where id = p_booth_id for update;
  if not found then
    raise exception 'Bilik tidak ditemukan';
  elsif booth_status = 'terkunci' then
    raise exception 'Bilik sudah terkunci';
  end if;

  delete from public.booth_assignments where booth_id = p_booth_id
    returning voter_id into assigned_voter;
  if assigned_voter is not null then
    update public.voters set status = 'belum' where id = assigned_voter and status = 'di_bilik';
  end if;
  update public.booths set status = 'terkunci', unlocked_at = null where id = p_booth_id;
end;
$$;


-- Records one vote from an unlocked booth. Returns nothing (never any counts).
create or replace function public.cast_vote(p_booth_id int, p_candidate_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  election_status text;
  booth_status text;
  assigned_voter uuid;
begin
  perform private.require_role('bilik');

  select status into election_status from public.election where id = 1 for share;
  if election_status = 'belum_dibuka' then
    raise exception 'Pemungutan suara belum dibuka';
  elsif election_status = 'ditutup' then
    raise exception 'Pemungutan suara sudah ditutup';
  end if;

  -- Serializes double taps: the second call waits here, then sees 'terkunci'.
  select status into booth_status from public.booths where id = p_booth_id for update;
  if not found then
    raise exception 'Bilik tidak ditemukan';
  elsif booth_status = 'terkunci' then
    raise exception 'Bilik sedang terkunci';
  end if;

  if not exists (select 1 from public.tally where candidate_id = p_candidate_id) then
    raise exception 'Pasangan calon tidak valid';
  end if;

  delete from public.booth_assignments where booth_id = p_booth_id
    returning voter_id into assigned_voter;
  if assigned_voter is null then
    raise exception 'Tidak ada pemilih di bilik ini. Hubungi panitia.';
  end if;

  update public.voters set status = 'sudah' where id = assigned_voter and status = 'di_bilik';
  if not found then
    raise exception 'Pemilih sudah menggunakan hak suaranya';
  end if;

  update public.tally set vote_count = vote_count + 1 where candidate_id = p_candidate_id;
  update public.booths set status = 'terkunci', unlocked_at = null where id = p_booth_id;
  update public.public_turnout set voted_count = voted_count + 1 where id = 1;
end;
$$;


-- Totals only, never per-candidate counts.
create or replace function public.get_integrity()
returns table (voters_sudah int, tally_total int, turnout_count int, ok boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_role('panitia');

  return query
    with totals as (
      select
        (select count(*)::int from public.voters where status = 'sudah') as v,
        (select coalesce(sum(vote_count), 0)::int from public.tally) as t,
        (select voted_count from public.public_turnout where id = 1) as p
    )
    select v, t, p, (v = t and t = p) from totals;
end;
$$;


-- Demo tool: back to the initial state (keeps the DPT, candidates, and booths).
create or replace function public.demo_reset()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_role('panitia');

  perform 1 from public.election where id = 1 for update;
  perform 1 from public.booths for update;

  delete from public.booth_assignments where true;
  update public.booths set status = 'terkunci', unlocked_at = null where true;
  update public.voters set status = 'belum' where status <> 'belum';
  update public.tally set vote_count = 0 where true;
  delete from public.public_results where true;
  update public.election set status = 'belum_dibuka', opened_at = null, closed_at = null where id = 1;
  update public.public_turnout
    set status = 'belum_dibuka',
        voted_count = 0,
        total_dpt = (select count(*) from public.voters)
    where id = 1;
end;
$$;


-- Demo tool: casts up to n random votes for random 'belum' voters, with the
-- same bookkeeping as cast_vote (no booth involved). Returns how many were cast.
create or replace function public.demo_simulate(n int)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  election_status text;
  picked_voter uuid;
  chosen uuid;
  cast_count int := 0;
begin
  perform private.require_role('panitia');

  if n is null or n < 1 or n > 1000 then
    raise exception 'Jumlah pemilih harus antara 1 dan 1000';
  end if;

  select status into election_status from public.election where id = 1 for share;
  if election_status <> 'dibuka' then
    raise exception 'Pemungutan suara belum dibuka';
  end if;

  for picked_voter in
    select id from public.voters where status = 'belum'
    order by random() limit n
    for update skip locked
  loop
    select candidate_id into chosen from public.tally order by random() limit 1;
    update public.voters set status = 'sudah' where id = picked_voter;
    update public.tally set vote_count = vote_count + 1 where candidate_id = chosen;
    cast_count := cast_count + 1;
  end loop;

  update public.public_turnout set voted_count = voted_count + cast_count where id = 1;
  return cast_count;
end;
$$;


-- Functions are callable by signed-in users only; each checks the role itself.
revoke all on all functions in schema public from public, anon;
grant execute on function
  public.my_role(),
  public.set_election_status(text),
  public.assign_voter_to_booth(uuid, int),
  public.cancel_booth(int),
  public.cast_vote(int, uuid),
  public.get_integrity(),
  public.demo_reset(),
  public.demo_simulate(int)
to authenticated;


-- -----------------------------------------------------------------------------
-- Realtime
-- postgres_changes respects RLS, so booth events only reach panitia/bilik.
-- -----------------------------------------------------------------------------

alter publication supabase_realtime
  add table public.public_turnout, public.public_results, public.booths;
