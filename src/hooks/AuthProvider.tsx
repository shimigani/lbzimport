import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return error || !data ? null : (data as Profile)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function init() {
      const { data } = await supabase.auth.getSession()
      if (!active) return
      const currentUser = data.session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        setProfile(await fetchProfile(currentUser.id))
      }
      if (active) setLoading(false)
    }

    void init()

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        setLoading(true)
        void fetchProfile(currentUser.id).then((prof) => {
          if (!active) return
          setProfile(prof)
          setLoading(false)
        })
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}