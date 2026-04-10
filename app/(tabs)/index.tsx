import { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { useSteps } from '../../hooks/useSteps'
import { fetchStepInsights, type StepInsights, updateProfileStepStreak } from '../../lib/stepInsights'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const { width: SW } = Dimensions.get('window')
const RING_SIZE = SW * 0.52
const STROKE = 16

const QUICK_ACTIONS: { icon: IoniconName; label: string; route: string }[] = [
  { icon: 'barbell-outline', label: 'Workout', route: '/(tabs)/exercises' },
  { icon: 'restaurant-outline', label: 'Meal', route: '/(tabs)/calories' },
  { icon: 'map-outline', label: 'Track', route: '/(tabs)/track' },
  { icon: 'trophy-outline', label: 'Ranks', route: '/(tabs)/leaderboard' },
]

function RingProgress({ progress }: { progress: number }) {
  const p = Math.min(Math.max(progress, 0), 1)
  const pct = Math.round(p * 100)
  const innerSize = RING_SIZE - STROKE * 2

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Track */}
      <View style={{ position: 'absolute', width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, borderWidth: STROKE, borderColor: '#f0ece8' }} />

      {/* Progress arc — left half */}
      <View style={{ position: 'absolute', width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: 0, top: 0, width: RING_SIZE / 2, height: RING_SIZE, overflow: 'hidden' }}>
          <View style={{
            position: 'absolute', left: 0, top: 0,
            width: RING_SIZE, height: RING_SIZE,
            borderRadius: RING_SIZE / 2,
            borderWidth: STROKE,
            borderColor: p > 0.5 ? '#c2410c' : 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: 'transparent',
            transform: [{ rotate: `${Math.min(p * 360, 180) - 180}deg` }],
          }} />
        </View>
        <View style={{ position: 'absolute', right: 0, top: 0, width: RING_SIZE / 2, height: RING_SIZE, overflow: 'hidden' }}>
          <View style={{
            position: 'absolute', right: 0, top: 0,
            width: RING_SIZE, height: RING_SIZE,
            borderRadius: RING_SIZE / 2,
            borderWidth: STROKE,
            borderColor: p > 0 ? '#c2410c' : 'transparent',
            borderLeftColor: 'transparent',
            borderTopColor: 'transparent',
            transform: [{ rotate: `${Math.max(p * 360 - 180, 0)}deg` }],
          }} />
        </View>
      </View>

      {/* Inner content */}
      <View style={{ width: innerSize, height: innerSize, borderRadius: innerSize / 2, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(194,65,12,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="flame" size={22} color="#c2410c" />
        </View>
        <Text style={{ color: '#111827', fontSize: 24, fontWeight: '900', marginTop: 4 }}>{pct}%</Text>
        <Text style={{ color: '#9a7b6e', fontSize: 11, fontWeight: '700' }}>of goal</Text>
      </View>
    </View>
  )
}

interface DashboardData {
  todayMealCalories: number
  todayWorkouts: number
  todayMeals: { food_name: string; calories: number; logged_at: string }[]
  myRank: number | null
  myPoints: number
  stepInsights: StepInsights | null
}

export default function HomeScreen() {
  const { profile, session, setProfile } = useAuthStore()
  const { steps, distanceKm, caloriesBurned, progress, status, refresh: refreshSteps } = useSteps()
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<DashboardData>({
    todayMealCalories: 0,
    todayWorkouts: 0,
    todayMeals: [],
    myRank: null,
    myPoints: 0,
    stepInsights: null,
  })
  const [loading, setLoading] = useState(true)
  const [stepMilestone, setStepMilestone] = useState<number | null>(null)
  const seenMilestonesRef = useRef<Set<number>>(new Set())
  const milestonesInitializedRef = useRef(false)

  const fetchDashboard = useCallback(async () => {
    if (!session?.user?.id) return
    try {
      const today = new Date().toISOString().split('T')[0]
      const currentMonth = new Date().toISOString().slice(0, 7)
      const stepGoal = profile?.daily_step_goal ?? 10000

      const [mealsRes, workoutsRes, leaderboardRes, stepInsights] = await Promise.all([
        supabase.from('meals').select('food_name, calories, logged_at').eq('user_id', session.user.id).gte('logged_at', `${today}T00:00:00`).order('logged_at', { ascending: false }),
        supabase.from('workouts').select('id', { count: 'exact' }).eq('user_id', session.user.id).gte('completed_at', `${today}T00:00:00`),
        supabase.from('leaderboard_entries').select('total_points').eq('user_id', session.user.id).eq('month', currentMonth).single(),
        fetchStepInsights(session.user.id, stepGoal),
      ])

      const meals = (mealsRes.data ?? []) as { food_name: string; calories: number; logged_at: string }[]
      const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0)
      const myPoints = leaderboardRes.data?.total_points ?? 0
      const rankRes = await supabase
        .from('leaderboard_entries')
        .select('user_id', { count: 'exact', head: true })
        .eq('month', currentMonth)
        .gt('total_points', myPoints)
      const myRank = rankRes.error ? null : (rankRes.count ?? 0) + 1

      if (profile && stepInsights.currentStreak !== profile.streak_count) {
        const updatedProfile = await updateProfileStepStreak(session.user.id, stepInsights.currentStreak)
        if (updatedProfile) setProfile(updatedProfile)
      }

      setData({
        todayMealCalories: totalCalories,
        todayWorkouts: workoutsRes.count ?? 0,
        todayMeals: meals.slice(0, 3),
        myRank,
        myPoints,
        stepInsights,
      })
    } catch (error) {
      console.warn('Home dashboard error:', error)
      setData({
        todayMealCalories: 0,
        todayWorkouts: 0,
        todayMeals: [],
        myRank: null,
        myPoints: 0,
        stepInsights: null,
      })
    } finally {
      setLoading(false)
    }
  }, [profile, session?.user?.id, setProfile])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  useEffect(() => {
    const reachedMilestones = [25, 50, 75, 100].filter(m => progress * 100 >= m)
    if (!milestonesInitializedRef.current && steps === 0) return
    if (!milestonesInitializedRef.current) {
      seenMilestonesRef.current = new Set(reachedMilestones)
      milestonesInitializedRef.current = true
      return
    }
    if (progress === 0) { seenMilestonesRef.current.clear(); return }
    const next = reachedMilestones.find(m => !seenMilestonesRef.current.has(m))
    if (!next) return
    seenMilestonesRef.current.add(next)
    setStepMilestone(next)
    if (next === 100) fetchDashboard()
    const t = setTimeout(() => setStepMilestone(null), 3500)
    return () => clearTimeout(t)
  }, [fetchDashboard, progress, steps])

  async function onRefresh() {
    setRefreshing(true)
    await Promise.all([refreshSteps(), fetchDashboard()])
    setRefreshing(false)
  }

  const dailyCalGoal = profile?.daily_calorie_goal ?? 2000
  const mealProgress = Math.min(data.todayMealCalories / dailyCalGoal, 1)
  const streakCount = data.stepInsights?.currentStreak ?? profile?.streak_count ?? 0
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Athlete'
  const activeMinutes = data.todayWorkouts * 30

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f3f0' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c2410c" colors={['#c2410c']} />}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingTop: 16, marginBottom: 6 }}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#c2410c', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="flame" size={22} color="#fff" />
            </View>
            <Text style={{ color: '#111827', fontSize: 15, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' }}>OXZIFIT</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/leaderboard' as never)} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
              <Ionicons name="notifications-outline" size={20} color="#111827" />
              {data.myRank && data.myRank <= 10 && (
                <View style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#c2410c' }} />
              )}
            </TouchableOpacity>
          </View>

          {/* Welcome */}
          <View style={{ paddingHorizontal: 22, marginBottom: 24, marginTop: 10 }}>
            <Text style={{ color: '#111827', fontSize: 32, fontWeight: '900', lineHeight: 38 }}>Welcome back,{'\n'}{firstName}</Text>
            <Text style={{ color: '#9a7b6e', fontSize: 14, marginTop: 6 }}>
              {status === 'active' ? 'Your tracker is live.' : 'Your Sanctuary is ready.'}
            </Text>
          </View>

          {/* Energy Card */}
          <View style={{ marginHorizontal: 22, backgroundColor: '#fff', borderRadius: 28, padding: 24, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 }}>
            <Text style={{ color: '#c2410c', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 }}>Step Burn</Text>
            <Text style={{ color: '#111827', fontSize: 44, fontWeight: '900', textAlign: 'center', letterSpacing: -1 }}>
              {Math.round(caloriesBurned).toLocaleString()}
            </Text>
            <Text style={{ color: '#9a7b6e', fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
              {steps.toLocaleString()} steps today
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/calories' as never)}
              style={{ backgroundColor: '#c2410c', borderRadius: 50, paddingVertical: 14, alignItems: 'center', marginBottom: 28 }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Open Meal Log</Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <RingProgress progress={progress} />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 22, marginBottom: 28 }}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity key={action.label} onPress={() => router.push(action.route as never)} style={{ alignItems: 'center', gap: 8 }} activeOpacity={0.75}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 2 }}>
                  <Ionicons name={action.icon} size={22} color="#111827" />
                </View>
                <Text style={{ color: '#6b5e58', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Daily Vitals */}
          <View style={{ paddingHorizontal: 22, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ color: '#111827', fontSize: 20, fontWeight: '900' }}>Daily Vitals</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/profile' as never)}>
                <Text style={{ color: '#c2410c', fontSize: 13, fontWeight: '800' }}>VIEW ALL</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color="#c2410c" style={{ marginVertical: 20 }} />
            ) : (
              <>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                  <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 22, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(194,65,12,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <Ionicons name="walk-outline" size={18} color="#c2410c" />
                    </View>
                    <Text style={{ color: '#111827', fontSize: 26, fontWeight: '900' }}>{steps.toLocaleString()}</Text>
                    <Text style={{ color: '#9a7b6e', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>Steps</Text>
                    <View style={{ backgroundColor: '#f0ece8', borderRadius: 4, height: 4, marginTop: 10 }}>
                      <View style={{ backgroundColor: '#c2410c', borderRadius: 4, height: 4, width: `${Math.min(progress * 100, 100)}%` }} />
                    </View>
                  </View>

                  <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 22, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(194,65,12,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <Ionicons name="timer-outline" size={18} color="#c2410c" />
                    </View>
                    <Text style={{ color: '#111827', fontSize: 26, fontWeight: '900' }}>{activeMinutes}</Text>
                    <Text style={{ color: '#9a7b6e', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>Active Min</Text>
                    <View style={{ backgroundColor: '#f0ece8', borderRadius: 4, height: 4, marginTop: 10 }}>
                      <View style={{ backgroundColor: '#c2410c', borderRadius: 4, height: 4, width: `${Math.min((activeMinutes / 60) * 100, 100)}%` }} />
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                  <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 22, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(194,65,12,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <Ionicons name="trail-sign-outline" size={18} color="#c2410c" />
                    </View>
                    <Text style={{ color: '#111827', fontSize: 26, fontWeight: '900' }}>{distanceKm.toFixed(1)}</Text>
                    <Text style={{ color: '#9a7b6e', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>km Today</Text>
                  </View>

                  <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 22, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(194,65,12,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <Ionicons name="flame-outline" size={18} color="#c2410c" />
                    </View>
                    <Text style={{ color: '#111827', fontSize: 26, fontWeight: '900' }}>{streakCount}</Text>
                    <Text style={{ color: '#9a7b6e', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>Day Streak</Text>
                  </View>
                </View>

                {stepMilestone && (
                  <View style={{ backgroundColor: '#fff', borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#22c55e' }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(34,197,94,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#111827', fontSize: 14, fontWeight: '800' }}>{stepMilestone}% step goal reached</Text>
                      <Text style={{ color: '#9a7b6e', fontSize: 12, marginTop: 2 }}>{steps.toLocaleString()} steps so far today</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Coach Insight */}
          <View style={{ marginHorizontal: 22 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(194,65,12,0.1)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ionicons name="bulb-outline" size={22} color="#c2410c" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#111827', fontSize: 14, fontWeight: '900', marginBottom: 4 }}>OXZIFIT Coach Insight</Text>
                <Text style={{ color: '#6b5e58', fontSize: 13, lineHeight: 20 }}>
                  {Math.round(mealProgress * 100) < 50
                    ? `Great start, ${firstName}! You're ${Math.round(mealProgress * 100)}% to your daily meal goal. Keep logging meals to stay on track.`
                    : Math.round(mealProgress * 100) < 90
                    ? `Good progress, ${firstName}! You're ${Math.round(mealProgress * 100)}% to your daily meal goal. A quick 15-minute walk will help your balance.`
                    : `Excellent work, ${firstName}! You've nearly hit your daily meal goal. Rest up and recover well.`}
                </Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
