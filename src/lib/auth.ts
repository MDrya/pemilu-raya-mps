import type { User } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'
import type { StaffRole } from './types'

export type AuthState =
  | { status: 'loading' }
  | { status: 'signed_out' }
  | { status: 'signed_in'; user: User; role: StaffRole | null; roleError: string | null }

export interface AuthContextValue {
  auth: AuthState
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}

/** Home route for each staff role. */
export const AREA_BY_ROLE: Record<StaffRole, string> = {
  panitia: '/panitia',
  bilik: '/bilik',
}
