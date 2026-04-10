import '../global.css'
import '../lib/backgroundFitness'
import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { Profile } from '../types/database'
import { useSteps, resetStepRuntime } from '../hooks/useSteps'

const queryClient = new QueryClient()

function StepTrackerBootstrap() {
  useSteps()
  return null
}

export default function RootLayout() {
  const { session, setSession, setProfile, clearAuth, setHydrated, hydrated } = useAuthStore()

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) { setHydrated(true); return }
        setSession(session)
        if (session) {
          try {
            const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
            if (data) setProfile(data as Profile)
          } finally {
            setHydrated(true)
          }
        } else {
          setHydrated(true)
        }
      } catch {
        setHydrated(true)
      }
    }
    void initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setProfile(data as Profile)
          })
      } else {
        clearAuth()
        setHydrated(true)
        resetStepRuntime()
      }
    })

    return () => subscription.unsubscribe()
  }, [clearAuth, setHydrated, setProfile, setSession])

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#f97316" size="large" />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        {session ? <StepTrackerBootstrap /> : null}
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
