import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function SignupScreen() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup() {
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const { data, error: authError } = await supabase.auth.signUp({ email, password })

    if (authError) {
      setLoading(false)
      if (authError.message.toLowerCase().includes('already')) {
        setError('An account with this email already exists.')
      } else {
        setError(authError.message)
      }
      return
    }

    const user = data.user
    if (user) {
      await supabase.from('profiles').insert({
        id: user.id,
        full_name: fullName,
        onboarding_completed: false,
      })
    }

    setLoading(false)
    router.replace('/(auth)/onboarding')
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-black"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-12">
          <Text className="text-orange-500 text-4xl font-black tracking-widest">OXZIFIT</Text>
          <Text className="text-zinc-400 text-sm mt-1">Create your account</Text>
        </View>

        <View className="gap-4">
          <TextInput
            className="bg-zinc-800 text-white rounded-xl px-4 py-4 text-base"
            placeholder="Full Name"
            placeholderTextColor="#71717a"
            value={fullName}
            onChangeText={setFullName}
            autoComplete="name"
          />
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
            autoComplete="new-password"
          />
          <TextInput
            className="bg-zinc-800 text-white rounded-xl px-4 py-4 text-base"
            placeholder="Confirm Password"
            placeholderTextColor="#71717a"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="new-password"
          />
        </View>

        {error !== '' && (
          <Text className="text-red-500 text-sm mt-3">{error}</Text>
        )}

        <TouchableOpacity
          className={`bg-orange-500 rounded-xl py-4 mt-6 ${loading ? 'opacity-50' : ''}`}
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-center text-base">
            {loading ? 'Creating account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-6 items-center"
          onPress={() => router.push('/(auth)/login')}
        >
          <Text className="text-zinc-400 text-sm">
            Already have an account?{' '}
            <Text className="text-orange-500 font-semibold">Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
