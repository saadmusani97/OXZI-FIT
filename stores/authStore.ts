import { create } from 'zustand'
import { Session } from '@supabase/supabase-js'
import { Profile } from '../types/database'

interface AuthStore {
  session: Session | null
  profile: Profile | null
  hydrated: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setHydrated: (hydrated: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  profile: null,
  hydrated: false,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setHydrated: (hydrated) => set({ hydrated }),
  clearAuth: () => set((state) => ({ session: null, profile: null, hydrated: state.hydrated })),
}))
