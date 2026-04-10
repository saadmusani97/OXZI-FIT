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
  { label: 'Arms', value: 'upper arms' },
  { label: 'Chest', value: 'chest' },
  { label: 'Back', value: 'back' },
  { label: 'Legs', value: 'upper legs' },
  { label: 'Shoulders', value: 'shoulders' },
  { label: 'Core', value: 'waist' },
  { label: 'Calves', value: 'lower legs' },
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
    if (!session?.user?.id) {
      setRecentWorkouts([])
      return
    }
    const { data } = await supabase
      .from('workouts')
      .select('id, exercise_name, sets, reps, weight_kg, completed_at')
      .eq('user_id', session.user.id)
      .order('completed_at', { ascending: false })
      .limit(20)
    setRecentWorkouts((data as RecentWorkout[]) ?? [])
  }, [session?.user?.id])

  useEffect(() => {
    if (tab !== 'history') return
    void fetchRecentWorkouts()
  }, [fetchRecentWorkouts, tab])

  return (
    <View style={{ flex: 1, backgroundColor: '#fff7f0' }}>
      <LinearGradient colors={['#fffdf8', '#fff5ea', '#fff0e0']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ position: 'absolute', top: -70, right: -20, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(249,115,22,0.12)' }} />
      <View style={{ position: 'absolute', top: 280, left: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(251,146,60,0.08)' }} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ marginBottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#7c2d12', fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>Exercise Library</Text>
              <Text style={{ color: '#111827', fontSize: 32, fontWeight: '900', marginTop: 6 }}>Exercises</Text>
            </View>
            <BlurView intensity={40} tint="light" style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.75)' }}>
              <View style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.45)' }}>
                <Ionicons name="barbell-outline" size={18} color="#f97316" />
              </View>
            </BlurView>
          </View>

          <BlurView intensity={45} tint="light" style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.78)', marginBottom: 14 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.58)', flexDirection: 'row', padding: 4 }}>
              {(['browse', 'history'] as const).map(t => (
                <TouchableOpacity key={t} onPress={() => setTab(t)} style={{ flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: tab === t ? '#f97316' : 'transparent', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }} activeOpacity={0.8}>
                  <Ionicons name={t === 'browse' ? 'search-outline' : 'list-outline'} size={14} color={tab === t ? '#fff' : '#9a3412'} />
                  <Text style={{ color: tab === t ? '#fff' : '#9a3412', fontWeight: '800', fontSize: 13 }}>{t === 'browse' ? 'Browse' : 'History'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>

          {tab === 'browse' && (
            <>
              <BlurView intensity={45} tint="light" style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.78)', marginBottom: 12 }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.58)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
                  <Ionicons name="search-outline" size={18} color="#9a3412" />
                  <TextInput
                    style={{ flex: 1, color: '#111827', paddingVertical: 12, paddingHorizontal: 10, fontSize: 15 }}
                    placeholder="Search exercises..."
                    placeholderTextColor="#9a3412"
                    value={query}
                    onChangeText={setQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                      <Ionicons name="close-circle" size={18} color="#9a3412" />
                    </TouchableOpacity>
                  )}
                </View>
              </BlurView>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {BODY_PARTS.map(part => {
                    const isActive = part.value === 'all' ? !selectedPart : selectedPart === part.value
                    return (
                      <TouchableOpacity
                        key={part.value}
                        onPress={() => setSelectedPart(part.value === 'all' ? undefined : part.value)}
                        style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: isActive ? '#f97316' : 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: isActive ? '#f97316' : 'rgba(249,115,22,0.2)' }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ color: isActive ? '#fff' : '#7c2d12', fontSize: 13, fontWeight: '700' }}>{part.label}</Text>
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
              <Text style={{ color: '#9a3412', fontSize: 14 }}>Loading 1500+ exercises...</Text>
            </View>
          ) : error ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 }}>
              <Ionicons name="wifi-outline" size={48} color="rgba(249,115,22,0.3)" />
              <Text style={{ color: '#111827', fontSize: 16, textAlign: 'center', fontWeight: '700' }}>Failed to load exercises</Text>
              <Text style={{ color: '#9a3412', fontSize: 13, textAlign: 'center' }}>Check your internet connection and try again</Text>
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
                  <Ionicons name="search-outline" size={48} color="rgba(249,115,22,0.3)" />
                  <Text style={{ color: '#111827', fontSize: 16, fontWeight: '700' }}>No exercises found</Text>
                  <Text style={{ color: '#9a3412', fontSize: 13 }}>Try a different search or filter</Text>
                </View>
              }
              ListHeaderComponent={
                exercises.length > 0 ? (
                  <Text style={{ color: '#9a3412', fontSize: 12, fontWeight: '700', marginBottom: 12 }}>{exercises.length} exercises found</Text>
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
                <Ionicons name="barbell-outline" size={48} color="rgba(249,115,22,0.3)" />
                <Text style={{ color: '#111827', fontSize: 16, fontWeight: '700' }}>No workouts logged yet</Text>
                <Text style={{ color: '#9a3412', fontSize: 13 }}>Browse exercises and log your first workout</Text>
                <TouchableOpacity onPress={() => setTab('browse')} style={{ backgroundColor: '#f97316', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 }}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Browse Exercises</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <BlurView intensity={45} tint="light" style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.78)', marginBottom: 10 }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.58)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(249,115,22,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="barbell-outline" size={20} color="#f97316" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#111827', fontWeight: '800', fontSize: 15, textTransform: 'capitalize' }}>{item.exercise_name}</Text>
                    <Text style={{ color: '#9a3412', fontSize: 12, marginTop: 2 }}>
                      {item.sets} sets × {item.reps} reps{item.weight_kg ? ` · ${item.weight_kg}kg` : ''}
                    </Text>
                  </View>
                  <Text style={{ color: '#9a3412', fontSize: 11, fontWeight: '700' }}>
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
