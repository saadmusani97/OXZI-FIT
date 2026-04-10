import { useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { Profile } from '../types/database'

export function useAuth() {
  const { session, profile, setSession, setProfile, setHydrated, clearAuth } = useAuthStore()

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) setProfile(data as Profile)
    setHydrated(true)
  }, [setProfile, setHydrated])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setHydrated(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        clearAuth()
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, setSession, setHydrated, clearAuth])

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return { data, error }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    clearAuth()
  }

  async function updateProfile(updates: Partial<Profile>) {
    const userId = session?.user?.id
    if (!userId) return { error: 'No user' }
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    if (!error && data) setProfile(data as Profile)
    return { data, error }
  }

  return {
    session,
    user: session?.user ?? null,
    profile,
    isLoading: false,
    signUp,
    signIn,
    signOut,
    updateProfile,
    fetchProfile,
  }
}
