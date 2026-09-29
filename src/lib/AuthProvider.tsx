import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthState } from './auth'
import { errorMessage } from './errors'
import { getSupabase, isSupabaseConfigured } from './supabase'
import type { StaffRole } from './types'

interface RoleResult {
  userId: string
  role: StaffRole | null
  error: string | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // undefined = still reading the stored session.
  const [session, setSession] = useState<Session | null | undefined>(
    isSupabaseConfigured ? undefined : null,
  )
  const [role, setRole] = useState<RoleResult | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const supabase = getSupabase()
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    // Keep this callback synchronous: supabase-js warns against awaiting inside it.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    getSupabase()
      .rpc('my_role')
      .then(({ data, error }) => {
        if (cancelled) return
        setRole({
          userId,
          role: error ? null : ((data as StaffRole | null) ?? null),
          error: error ? errorMessage(error) : null,
        })
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const auth: AuthState = useMemo(() => {
    if (session === undefined) return { status: 'loading' }
    if (session === null) return { status: 'signed_out' }
    // Session known but its role not fetched yet.
    if (role?.userId !== session.user.id) return { status: 'loading' }
    return { status: 'signed_in', user: session.user, role: role.role, roleError: role.error }
  }, [session, role])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password })
    if (error) throw new Error(errorMessage(error))
  }, [])

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut()
  }, [])

  const value = useMemo(() => ({ auth, signIn, signOut }), [auth, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

