import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import type { Profile } from '../../types/database'

const TOTAL_STEPS = 5
type FitnessGoal = NonNullable<Profile['fitness_goal']>
type ActivityLevel = NonNullable<Profile['activity_level']>
type Gender = 'Male' | 'Female' | 'Other'
type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const FITNESS_GOALS: { label: string; icon: IoniconName; value: FitnessGoal }[] = [
  { label: 'Lose Weight', icon: 'flame-outline', value: 'lose_weight' },
  { label: 'Gain Muscle', icon: 'barbell-outline', value: 'gain_muscle' },
  { label: 'Maintain Weight', icon: 'scale-outline', value: 'maintain_weight' },
  { label: 'Improve Endurance', icon: 'speedometer-outline', value: 'improve_endurance' },
]

const ACTIVITY_LEVELS: { label: string; value: ActivityLevel }[] = [
  { label: 'Sedentary', value: 'sedentary' },
  { label: 'Lightly Active', value: 'lightly_active' },
  { label: 'Moderately Active', value: 'moderately_active' },
  { label: 'Very Active', value: 'very_active' },
  { label: 'Extremely Active', value: 'extremely_active' },
]

const GENDERS: Gender[] = ['Male', 'Female', 'Other']

export default function OnboardingScreen() {
  const { session, setProfile } = useAuthStore()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal | ''>('')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>('')
  const [dietaryPreference, setDietaryPreference] = useState('')
  const [dailyStepGoal, setDailyStepGoal] = useState('10000')
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState('2000')


  async function handleFinish() {
    setLoading(true)
    let userId = session?.user?.id
    if (!userId) {
      const { data } = await supabase.auth.getSession()
      userId = data.session?.user?.id
    }
    if (!userId) {
      Alert.alert('Session expired', 'Please log in again.')
      setLoading(false)
      router.replace('/(auth)/login')
      return
    }
    const { data: saved, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName || null,
        age: age ? parseInt(age, 10) : null,
        gender: gender || null,
        height_cm: heightCm ? parseFloat(heightCm) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        fitness_goal: (fitnessGoal || null) as FitnessGoal | null,
        activity_level: (activityLevel || null) as ActivityLevel | null,
        dietary_preference: dietaryPreference || null,
        daily_step_goal: dailyStepGoal ? parseInt(dailyStepGoal, 10) : 10000,
        daily_calorie_goal: dailyCalorieGoal ? parseInt(dailyCalorieGoal, 10) : 2000,
        onboarding_completed: true,
      })
      .select()
      .single()
    if (error) {
      Alert.alert('Error ' + error.code, error.message)
      setLoading(false)
      return
    }
    if (saved) setProfile(saved as Profile)
    router.replace('/(tabs)')
  }

  const s = { backgroundColor: '#27272a', color: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 12 } as const

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#000' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: '#f97316', fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: 4, marginBottom: 8 }}>Synra</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={{ height: 8, borderRadius: 4, backgroundColor: i === step ? '#f97316' : '#3f3f46', width: i === step ? 24 : 8 }} />
          ))}
        </View>
        <Text style={{ color: '#71717a', fontSize: 12, textAlign: 'center', marginBottom: 32 }}>Step {step + 1} of {TOTAL_STEPS}</Text>


        {step === 0 && (
          <View>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Personal Info</Text>
            <TextInput style={s} placeholder="Full Name" placeholderTextColor="#71717a" value={fullName} onChangeText={setFullName} />
            <TextInput style={s} placeholder="Age" placeholderTextColor="#71717a" value={age} onChangeText={setAge} keyboardType="numeric" />
            <Text style={{ color: '#71717a', fontSize: 14, marginBottom: 8 }}>Gender</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              {GENDERS.map(g => (
                <TouchableOpacity key={g} style={{ flex: 1, paddingVertical: 12, borderRadius: 999, backgroundColor: gender === g ? '#f97316' : '#27272a', borderWidth: 1, borderColor: gender === g ? '#f97316' : '#3f3f46' }} onPress={() => setGender(g)} activeOpacity={0.8}>
                  <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: '600', color: gender === g ? '#fff' : '#71717a' }}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Body Metrics</Text>
            <TextInput style={s} placeholder="Height (cm)" placeholderTextColor="#71717a" value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" />
            <TextInput style={s} placeholder="Weight (kg)" placeholderTextColor="#71717a" value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" />
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Fitness Goal</Text>
            {FITNESS_GOALS.map(goal => (
              <TouchableOpacity key={goal.value} style={{ backgroundColor: '#27272a', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 2, borderColor: fitnessGoal === goal.value ? '#f97316' : 'transparent', marginBottom: 10 }} onPress={() => setFitnessGoal(goal.value)} activeOpacity={0.8}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name={goal.icon} size={18} color={fitnessGoal === goal.value ? '#f97316' : '#fff'} />
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{goal.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Activity and Diet</Text>
            <Text style={{ color: '#71717a', fontSize: 14, marginBottom: 8 }}>Activity Level</Text>
            {ACTIVITY_LEVELS.map(level => (
              <TouchableOpacity key={level.value} style={{ backgroundColor: '#27272a', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 2, borderColor: activityLevel === level.value ? '#f97316' : 'transparent', marginBottom: 8 }} onPress={() => setActivityLevel(level.value)} activeOpacity={0.8}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: activityLevel === level.value ? '#f97316' : '#fff' }}>{level.label}</Text>
              </TouchableOpacity>
            ))}
            <TextInput style={s} placeholder="Dietary preference (e.g. Vegan)" placeholderTextColor="#71717a" value={dietaryPreference} onChangeText={setDietaryPreference} />
          </View>
        )}

        {step === 4 && (
          <View>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Daily Goals</Text>
            <Text style={{ color: '#71717a', fontSize: 14, marginBottom: 8 }}>Daily Step Goal</Text>
            <TextInput style={s} placeholder="10000" placeholderTextColor="#71717a" value={dailyStepGoal} onChangeText={setDailyStepGoal} keyboardType="numeric" />
            <Text style={{ color: '#71717a', fontSize: 14, marginBottom: 8 }}>Daily Calorie Goal</Text>
            <TextInput style={s} placeholder="2000" placeholderTextColor="#71717a" value={dailyCalorieGoal} onChangeText={setDailyCalorieGoal} keyboardType="numeric" />
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 32 }}>
          {step > 0 && (
            <TouchableOpacity style={{ flex: 1, backgroundColor: '#27272a', borderRadius: 12, paddingVertical: 16 }} onPress={() => setStep(s => s - 1)} activeOpacity={0.8}>
              <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>Back</Text>
            </TouchableOpacity>
          )}
          {step < TOTAL_STEPS - 1 ? (
            <TouchableOpacity style={{ flex: 1, backgroundColor: '#f97316', borderRadius: 12, paddingVertical: 16 }} onPress={() => setStep(s => s + 1)} activeOpacity={0.8}>
              <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={{ flex: 1, backgroundColor: '#f97316', borderRadius: 12, paddingVertical: 16, opacity: loading ? 0.5 : 1 }} onPress={handleFinish} disabled={loading} activeOpacity={0.8}>
              <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>{loading ? 'Saving...' : 'Finish'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
