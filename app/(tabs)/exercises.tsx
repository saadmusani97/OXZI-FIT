import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, FlatList, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useFilteredExercises } from '../../hooks/useExercises'
import ExerciseCard from '../../components/exercises/ExerciseCard'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'

const BODY_PARTS = [
  { label: 'All', value: 'all' },
  { label: '💪 Arms', value: 'upper arms' },
  { label: '🏋️ Chest', value: 'chest' },
  { label: '🔙 Back', value: 'back' },
  { label: '🦵 Legs', value: 'upper legs' },
  { label: '🔺 Shoulders', value: 'shoulders' },
  { label: '🎯 Core', value: 'waist' },
  { label: '🦵 Calves', value: 'lower legs' },
]

interface RecentWorkout {
  id: string
  exercise_name: string
  sets: number
  reps: number
  weight_kg: number | null
  completed_at: string
}

export default function ExercisesScreen() {
  const router = useRouter()
  const { session } = useAuthStore()
  const [query, setQuery] = useState('')
  const [selectedPart, setSelectedPart] = useState<string | undefined>(undefined)
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([])
  const [tab, setTab] = useState<'browse' | 'history'>('browse')

  const muscle = selectedPart === 'all' || !selectedPart ? undefined : selectedPart
  const { data: exercises, isLoading, error } = useFilteredExercises(query, muscle)

  const fetchRecentWorkouts = useCallback(async () => {
    if (!session?.user?.id) return
    const { data } = await supabase
      .from('workouts')
      .select('id, exercise_name, sets, reps, weight_kg, completed_at')
      .eq('user_id', session.user.id)
      .order('completed_at', { ascending: false })
      .limit(20)
    setRecentWorkouts((data as RecentWorkout[]) ?? [])
  }, [session?.user?.id])

  useEffect(() => { fetchRecentWorkouts() }, [fetchRecentWorkouts])

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#0a0a0f', '#0f0a1a', '#0a0f0a']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 16 }}>Exercises 🏋️</Text>

          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 4, marginBottom: 16 }}>
            {(['browse', 'history'] as const).map(t => (
              <TouchableOpacity key={t} onPress={() => setTab(t)} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: tab === t ? '#f97316' : 'transparent', alignItems: 'center' }} activeOpacity={0.8}>
                <Text style={{ color: tab === t ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 14, textTransform: 'capitalize' }}>{t === 'browse' ? '🔍 Browse' : '📋 History'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'browse' && (
            <>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.4)" />
                <TextInput
                  style={{ flex: 1, color: '#fff', paddingVertical: 12, paddingHorizontal: 10, fontSize: 15 }}
                  placeholder="Search exercises..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={query}
                  onChangeText={setQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {BODY_PARTS.map(part => {
                    const isActive = part.value === 'all' ? !selectedPart : selectedPart === part.value
                    return (
                      <TouchableOpacity
                        key={part.value}
                        onPress={() => setSelectedPart(part.value === 'all' ? undefined : part.value)}
                        style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: isActive ? '#f97316' : 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: isActive ? '#f97316' : 'rgba(255,255,255,0.1)' }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' }}>{part.label}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </ScrollView>
            </>
          )}
        </View>

        {tab === 'browse' ? (
          isLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <ActivityIndicator color="#f97316" size="large" />
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Loading 1500+ exercises...</Text>
            </View>
          ) : error ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 }}>
              <Ionicons name="wifi-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, textAlign: 'center' }}>Failed to load exercises</Text>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center' }}>Check your internet connection and try again</Text>
            </View>
          ) : (
            <FlatList
              data={exercises}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <ExerciseCard exercise={item} onPress={() => router.push(`/exercise/${item.id}` as never)} />
              )}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 }}>
                  <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.2)" />
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>No exercises found</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Try a different search or filter</Text>
                </View>
              }
              ListHeaderComponent={
                exercises.length > 0 ? (
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginBottom: 12 }}>{exercises.length} exercises found</Text>
                ) : null
              }
            />
          )
        ) : (
          <FlatList
            data={recentWorkouts}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 }}>
                <Ionicons name="barbell-outline" size={48} color="rgba(255,255,255,0.2)" />
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>No workouts logged yet</Text>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Browse exercises and log your first workout</Text>
                <TouchableOpacity onPress={() => setTab('browse')} style={{ backgroundColor: '#f97316', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Browse Exercises</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <BlurView intensity={15} tint="dark" style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 10 }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(249,115,22,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="barbell-outline" size={20} color="#f97316" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, textTransform: 'capitalize' }}>{item.exercise_name}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
                      {item.sets} sets × {item.reps} reps{item.weight_kg ? ` · ${item.weight_kg}kg` : ''}
                    </Text>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                    {new Date(item.completed_at).toLocaleDateString()}
                  </Text>
                </View>
              </BlurView>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  )
}
