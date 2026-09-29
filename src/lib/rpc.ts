import { errorMessage } from './errors'
import { getSupabase } from './supabase'

/** Calls a database function; throws an Error with a UI-ready Indonesian message. */
export async function callRpc<T = void>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabase().rpc(fn, args)
  if (error) throw new Error(errorMessage(error))
  return data as T
}
