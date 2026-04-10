import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setError('')
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    router.replace('/(tabs)')
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-black"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-12">
          <Text className="text-orange-500 text-4xl font-black tracking-widest">OXZIFIT</Text>
          <Text className="text-zinc-400 text-sm mt-1">Your fitness journey starts here</Text>
        </View>

        <View className="gap-4">
          <TextInput
            className="bg-zinc-800 text-white rounded-xl px-4 py-4 text-base"
            placeholder="Email"
            placeholderTextColor="#71717a"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            className="bg-zinc-800 text-white rounded-xl px-4 py-4 text-base"
            placeholder="Password"
            placeholderTextColor="#71717a"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        {error !== '' && (
          <Text className="text-red-500 text-sm mt-3">{error}</Text>
        )}

        <TouchableOpacity
          className={`bg-orange-500 rounded-xl py-4 mt-6 ${loading ? 'opacity-50' : ''}`}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-center text-base">
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-6 items-center"
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text className="text-zinc-400 text-sm">
            {"Don't have an account?"}{' '}
            <Text className="text-orange-500 font-semibold">Sign up</Text>
          </Text>
        </TouchableOpacity>

        {__DEV__ && (
          <TouchableOpacity
            className="mt-8 border border-zinc-700 rounded-xl py-3 items-center"
            onPress={() => router.push('/(auth)/onboarding' as never)}
            activeOpacity={0.8}
          >
            <Text className="text-zinc-500 text-xs font-semibold">🛠 DEV: View Onboarding</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}
