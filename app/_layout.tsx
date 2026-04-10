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
import { useSteps } from '../hooks/useSteps'

const queryClient = new QueryClient()

function StepTrackerBootstrap() {
  useSteps()
  return null
}

export default function RootLayout() {
  const { session, setSession, setProfile, clearAuth, setHydrated, hydrated } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setProfile(data as Profile)
            setHydrated(true)
          })
      } else {
        setHydrated(true)
      }
    })

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
