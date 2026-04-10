import { Redirect } from 'expo-router'
import { useAuthStore } from '../stores/authStore'

export default function Index() {
  const { session, profile, hydrated } = useAuthStore()

  if (!hydrated) return null

  if (!session) return <Redirect href="/(auth)/login" />
  if (profile && !profile.onboarding_completed) return <Redirect href="/(auth)/onboarding" />
  return <Redirect href="/(tabs)" />
}
