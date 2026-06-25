import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, FlatList, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
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
    <View style={{ flex: 1, backgroundColor: '#0E0E0E' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ marginBottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>Exercise Library</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '900', marginTop: 6 }}>Exercises</Text>
            </View>
            <BlurView intensity={30} tint="dark" style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}>
              <View style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(28,28,30,0.85)' }}>
                <Ionicons name="barbell-outline" size={18} color="#F66C3F" />
              </View>
            </BlurView>
          </View>

          <BlurView intensity={30} tint="dark" style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 14 }}>
            <View style={{ backgroundColor: 'rgba(28,28,30,0.85)', flexDirection: 'row', padding: 4 }}>
              {(['browse', 'history'] as const).map(t => (
                <TouchableOpacity key={t} onPress={() => setTab(t)} style={{ flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: tab === t ? '#F66C3F' : 'transparent', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }} activeOpacity={0.8}>
                  <Ionicons name={t === 'browse' ? 'search-outline' : 'list-outline'} size={14} color={tab === t ? '#fff' : 'rgba(255,255,255,0.5)'} />
                  <Text style={{ color: tab === t ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: '800', fontSize: 13 }}>{t === 'browse' ? 'Browse' : 'History'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>

          {tab === 'browse' && (
            <>
              <BlurView intensity={30} tint="dark" style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 12 }}>
                <View style={{ backgroundColor: 'rgba(28,28,30,0.85)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
                  <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.5)" />
                  <TextInput
                    style={{ flex: 1, color: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 10, fontSize: 15 }}
                    placeholder="Search exercises..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={query}
                    onChangeText={setQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                      <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
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
                        style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: isActive ? '#F66C3F' : 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: isActive ? '#F66C3F' : 'rgba(255,255,255,0.1)' }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700' }}>{part.label}</Text>
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
              <ActivityIndicator color="#F66C3F" size="large" />
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Loading 1500+ exercises...</Text>
            </View>
          ) : error ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 }}>
              <Ionicons name="wifi-outline" size={48} color="rgba(246,108,63,0.3)" />
              <Text style={{ color: '#FFFFFF', fontSize: 16, textAlign: 'center', fontWeight: '700' }}>Failed to load exercises</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' }}>Check your internet connection and try again</Text>
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
                  <Ionicons name="search-outline" size={48} color="rgba(246,108,63,0.3)" />
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>No exercises found</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Try a different search or filter</Text>
                </View>
              }
              ListHeaderComponent={
                exercises.length > 0 ? (
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', marginBottom: 12 }}>{exercises.length} exercises found</Text>
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
                <Ionicons name="barbell-outline" size={48} color="rgba(246,108,63,0.3)" />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>No workouts logged yet</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Browse exercises and log your first workout</Text>
                <TouchableOpacity onPress={() => setTab('browse')} style={{ backgroundColor: '#F66C3F', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 }}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Browse Exercises</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <BlurView intensity={30} tint="dark" style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 10 }}>
                <View style={{ backgroundColor: '#28292D', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(246,108,63,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="barbell-outline" size={20} color="#F66C3F" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15, textTransform: 'capitalize' }}>{item.exercise_name}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
                      {item.sets} sets × {item.reps} reps{item.weight_kg ? ` · ${item.weight_kg}kg` : ''}
                    </Text>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700' }}>
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
