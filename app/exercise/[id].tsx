import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useExercises } from '../../hooks/useExercises'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import ExerciseAnimation from '../../components/exercises/ExerciseAnimation'
import MuscleHighlighter from '../../components/exercises/MuscleHighlighter'

interface LogForm {
  sets: string
  reps: string
  weight_kg: string
  duration_seconds: string
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { session } = useAuthStore()
  const { data: exercises = [], isLoading } = useExercises()

  const exercise = exercises.find((ex) => ex.id === id)

  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<LogForm>({
    sets: '',
    reps: '',
    weight_kg: '',
    duration_seconds: '',
  })

  async function handleLog() {
    if (!session?.user?.id || !exercise) return
    if (!form.sets || !form.reps) {
      Alert.alert('Required', 'Please enter sets and reps.')
      return
    }

    setSaving(true)
    const { error } = await supabase.from('workouts').insert({
      user_id: session.user.id,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      sets: parseInt(form.sets, 10),
      reps: parseInt(form.reps, 10),
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      duration_seconds: form.duration_seconds ? parseInt(form.duration_seconds, 10) : null,
      completed_at: new Date().toISOString(),
    })
    setSaving(false)

    if (error) {
      Alert.alert('Error', 'Failed to save workout. Please try again.')
    } else {
      setModalVisible(false)
      setForm({ sets: '', reps: '', weight_kg: '', duration_seconds: '' })
      Alert.alert('Logged!', `${exercise.name} saved to your workouts.`)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#f97316" size="large" />
      </SafeAreaView>
    )
  }

  if (!exercise) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
        <Text className="text-zinc-400 text-base">Exercise not found.</Text>
        <TouchableOpacity className="mt-4" onPress={() => router.back()}>
          <Text className="text-orange-500 font-semibold">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Text className="text-orange-500 text-lg font-semibold">‹ Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="items-center mb-6">
          <ExerciseAnimation gifUrl={exercise.gifUrl} size={300} />
        </View>

        <Text className="text-white text-2xl font-bold capitalize mb-3">{exercise.name}</Text>

        <View className="flex-row flex-wrap gap-2 mb-6">
          <View className="bg-orange-500/20 rounded-full px-3 py-1">
            <Text className="text-orange-400 text-sm capitalize">{exercise.bodyPart}</Text>
          </View>
          <View className="bg-zinc-700 rounded-full px-3 py-1">
            <Text className="text-zinc-300 text-sm capitalize">{exercise.equipment}</Text>
          </View>
          <View className="bg-zinc-800 rounded-full px-3 py-1">
            <Text className="text-zinc-300 text-sm capitalize">{exercise.target}</Text>
          </View>
        </View>

        <View className="mb-6">
          <MuscleHighlighter
            muscles={[exercise.target]}
            musclesSecondary={exercise.secondaryMuscles}
          />
        </View>

        <View className="mb-6">
          <Text className="text-white text-lg font-bold mb-3">Instructions</Text>
          {exercise.instructions.map((step, index) => (
            <View key={index} className="flex-row mb-3">
              <View className="w-7 h-7 rounded-full bg-orange-500 items-center justify-center mr-3 mt-0.5 shrink-0">
                <Text className="text-white text-xs font-bold">{index + 1}</Text>
              </View>
              <Text className="text-zinc-300 text-sm leading-5 flex-1">{step}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          className="bg-orange-500 rounded-2xl py-4 items-center"
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-base">Log Workout</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
        >
          <View className="bg-zinc-950 rounded-t-3xl px-6 pt-6 pb-10">
            <View className="w-10 h-1 bg-zinc-700 rounded-full self-center mb-6" />
            <Text className="text-white text-xl font-bold mb-1 capitalize">{exercise.name}</Text>
            <Text className="text-zinc-500 text-sm mb-6">Log your set</Text>

            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-zinc-400 text-xs mb-1">Sets *</Text>
                <TextInput
                  className="bg-zinc-900 text-white rounded-xl px-4 py-3 text-base"
                  placeholder="3"
                  placeholderTextColor="#52525b"
                  keyboardType="number-pad"
                  value={form.sets}
                  onChangeText={(v) => setForm((f) => ({ ...f, sets: v }))}
                />
              </View>
              <View className="flex-1">
                <Text className="text-zinc-400 text-xs mb-1">Reps *</Text>
                <TextInput
                  className="bg-zinc-900 text-white rounded-xl px-4 py-3 text-base"
                  placeholder="10"
                  placeholderTextColor="#52525b"
                  keyboardType="number-pad"
                  value={form.reps}
                  onChangeText={(v) => setForm((f) => ({ ...f, reps: v }))}
                />
              </View>
            </View>

            <View className="flex-row gap-4 mb-6">
              <View className="flex-1">
                <Text className="text-zinc-400 text-xs mb-1">Weight (kg)</Text>
                <TextInput
                  className="bg-zinc-900 text-white rounded-xl px-4 py-3 text-base"
                  placeholder="Optional"
                  placeholderTextColor="#52525b"
                  keyboardType="decimal-pad"
                  value={form.weight_kg}
                  onChangeText={(v) => setForm((f) => ({ ...f, weight_kg: v }))}
                />
              </View>
              <View className="flex-1">
                <Text className="text-zinc-400 text-xs mb-1">Duration (sec)</Text>
                <TextInput
                  className="bg-zinc-900 text-white rounded-xl px-4 py-3 text-base"
                  placeholder="Optional"
                  placeholderTextColor="#52525b"
                  keyboardType="number-pad"
                  value={form.duration_seconds}
                  onChangeText={(v) => setForm((f) => ({ ...f, duration_seconds: v }))}
                />
              </View>
            </View>

            <TouchableOpacity
              className={`bg-orange-500 rounded-2xl py-4 items-center mb-3 ${saving ? 'opacity-60' : ''}`}
              onPress={handleLog}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Save Workout</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="py-3 items-center"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-zinc-500 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}
