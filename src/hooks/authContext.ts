import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types'

export type SignInResult = { error: string | null }

export type AuthContextValue = {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<SignInResult>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)