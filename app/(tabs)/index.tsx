import { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { router } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { useSteps } from '../../hooks/useSteps'
import { fetchStepInsights, type StepInsights, updateProfileStepStreak } from '../../lib/stepInsights'

const QUICK_ACTIONS = [
  { icon: 'barbell-outline' as const, label: 'Workout', route: '/(tabs)/exercises' },
  { icon: 'camera-outline' as const, label: 'Cal AI', route: '/(tabs)/calories' },
  { icon: 'map-outline' as const, label: 'Track', route: '/(tabs)/track' },
  { icon: 'trophy-outline' as const, label: 'Ranks', route: '/(tabs)/leaderboard' },
]

const TIPS = [
  'Stretching after workouts improves your sleep quality.',
  'Drinking water before meals helps control calorie intake.',
  'Walking 10,000 steps burns approximately 400 calories.',
  'Rest days are just as important as workout days.',
  'Protein helps repair muscles after exercise.',
]

function GlassCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <BlurView intensity={18} tint="dark" style={[{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' }, style]}>
      <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: 20 }}>
        {children}
      </View>
    </BlurView>
  )
}

interface DashboardData {
  todayCalories: number
  todayWorkouts: number
  todayMeals: { food_name: string; calories: number; logged_at: string }[]
  myRank: number | null
  myPoints: number
  stepInsights: StepInsights | null
}

export default function HomeScreen() {
  const { profile, session, clearAuth, setProfile } = useAuthStore()
  const { steps, distanceKm, caloriesBurned, progress, dailyGoal, status, refresh: refreshSteps } = useSteps()
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<DashboardData>({
    todayCalories: 0,
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
  const tip = TIPS[new Date().getDay() % TIPS.length]

  const fetchDashboard = useCallback(async () => {
    if (!session?.user?.id) return
    const today = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().toISOString().slice(0, 7)
    const stepGoal = profile?.daily_step_goal ?? 10000

    const [mealsRes, workoutsRes, leaderboardRes, rankRes, stepInsights] = await Promise.all([
      supabase
        .from('meals')
        .select('food_name, calories, logged_at')
        .eq('user_id', session.user.id)
        .gte('logged_at', `${today}T00:00:00`)
        .order('logged_at', { ascending: false }),
      supabase
        .from('workouts')
        .select('id', { count: 'exact' })
        .eq('user_id', session.user.id)
        .gte('completed_at', `${today}T00:00:00`),
      supabase
        .from('leaderboard_entries')
        .select('total_points')
        .eq('user_id', session.user.id)
        .eq('month', currentMonth)
        .single(),
      supabase
        .from('leaderboard_entries')
        .select('user_id')
        .eq('month', currentMonth)
        .order('total_points', { ascending: false }),
      fetchStepInsights(session.user.id, stepGoal),
    ])

    const meals = (mealsRes.data ?? []) as { food_name: string; calories: number; logged_at: string }[]
    const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0)
    const rankList = (rankRes.data ?? []) as { user_id: string }[]
    const myRankIdx = rankList.findIndex(e => e.user_id === session.user.id)

    if (profile && stepInsights.currentStreak !== profile.streak_count) {
      const updatedProfile = await updateProfileStepStreak(session.user.id, stepInsights.currentStreak)
      if (updatedProfile) setProfile(updatedProfile)
    }

    setData({
      todayCalories: totalCalories,
      todayWorkouts: workoutsRes.count ?? 0,
      todayMeals: meals.slice(0, 3),
      myRank: myRankIdx >= 0 ? myRankIdx + 1 : null,
      myPoints: leaderboardRes.data?.total_points ?? 0,
      stepInsights,
    })
    setLoading(false)
  }, [profile, session?.user?.id, setProfile])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  useEffect(() => {
    const reachedMilestones = [25, 50, 75, 100].filter(milestone => progress * 100 >= milestone)

    if (!milestonesInitializedRef.current && steps === 0) return

    if (!milestonesInitializedRef.current) {
      seenMilestonesRef.current = new Set(reachedMilestones)
      milestonesInitializedRef.current = true
      return
    }

    if (progress === 0) {
      seenMilestonesRef.current.clear()
      return
    }

    const nextMilestone = reachedMilestones.find(milestone => !seenMilestonesRef.current.has(milestone))
    if (!nextMilestone) return

    seenMilestonesRef.current.add(nextMilestone)
    setStepMilestone(nextMilestone)
    if (nextMilestone === 100) {
      fetchDashboard()
    }
    const timeout = setTimeout(() => setStepMilestone(null), 3500)
    return () => clearTimeout(timeout)
  }, [fetchDashboard, progress, steps])

  async function onRefresh() {
    setRefreshing(true)
    await Promise.all([refreshSteps(), fetchDashboard()])
    setRefreshing(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    clearAuth()
    router.replace('/(auth)/login')
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dailyCalGoal = profile?.daily_calorie_goal ?? 2000
  const streakCount = data.stepInsights?.currentStreak ?? profile?.streak_count ?? 0

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#0a0a0f', '#0f0a1a', '#1a0a0f']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ position: 'absolute', top: -80, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(249,115,22,0.15)' }} />
      <View style={{ position: 'absolute', top: 200, left: -80, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(139,92,246,0.1)' }} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" colors={['#f97316']} />}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginBottom: 24 }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="hand-right-outline" size={14} color="rgba(255,255,255,0.5)" />
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>{greeting}</Text>
              </View>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 }}>
                {profile?.full_name?.split(' ')[0] ?? 'Athlete'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="log-out-outline" size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          <GlassCard style={{ marginBottom: 16 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 4 }}>Daily Step Goal</Text>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 12 }}>
              {steps.toLocaleString()} <Text style={{ fontSize: 16, fontWeight: '400', color: 'rgba(255,255,255,0.4)' }}>/ {dailyGoal.toLocaleString()}</Text>
            </Text>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, height: 8, marginBottom: 8 }}>
              <View style={{ backgroundColor: progress >= 1 ? '#22c55e' : '#f97316', borderRadius: 8, height: 8, width: `${Math.min(Math.round(progress * 100), 100)}%` }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                {Math.round(progress * 100)}% complete · {distanceKm.toFixed(2)} km
              </Text>
              <Text style={{ color: status === 'active' ? '#22c55e' : '#ef4444', fontSize: 10, fontWeight: '600' }}>
                {status === 'active' ? '● Live' : status === 'loading' ? '● Loading' : '● Needs APK'}
              </Text>
            </View>
          </GlassCard>

          {stepMilestone && (
            <View style={{ backgroundColor: 'rgba(34,197,94,0.14)', borderColor: 'rgba(34,197,94,0.35)', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="footsteps" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{stepMilestone}% step goal hit</Text>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 }}>{steps.toLocaleString()} steps today</Text>
              </View>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity key={action.label} onPress={() => router.push(action.route as never)} style={{ flex: 1, alignItems: 'center', gap: 8 }} activeOpacity={0.7}>
                <BlurView intensity={18} tint="dark" style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', width: 56, height: 56 }}>
                  <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={action.icon} size={22} color="#f97316" />
                  </View>
                </BlurView>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500' }}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator color="#f97316" style={{ marginVertical: 20 }} />
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <GlassCard style={{ flex: 1 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>Calories Today</Text>
                  <Text style={{ color: '#f97316', fontSize: 22, fontWeight: '900' }}>{data.todayCalories}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 }}>/ {dailyCalGoal} kcal</Text>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 4, marginTop: 8 }}>
                    <View style={{ backgroundColor: '#f97316', borderRadius: 4, height: 4, width: `${Math.min((data.todayCalories / dailyCalGoal) * 100, 100)}%` }} />
                  </View>
                </GlassCard>
                <GlassCard style={{ flex: 1 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>Workouts Today</Text>
                  <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{data.todayWorkouts}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 }}>sessions</Text>
                  <Ionicons name="barbell-outline" size={24} color="rgba(249,115,22,0.3)" style={{ marginTop: 8 }} />
                </GlassCard>
                <GlassCard style={{ flex: 1 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>My Rank</Text>
                  <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{data.myRank ? `#${data.myRank}` : '—'}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 }}>{data.myPoints} pts</Text>
                  <Ionicons name="trophy-outline" size={24} color="rgba(249,115,22,0.3)" style={{ marginTop: 8 }} />
                </GlassCard>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <GlassCard style={{ flex: 1 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>Steps Burned</Text>
                  <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{Math.round(caloriesBurned)}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 }}>kcal from steps</Text>
                </GlassCard>
                <GlassCard style={{ flex: 1 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>Streak</Text>
                  <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{streakCount}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Ionicons name="flame-outline" size={12} color="rgba(255,255,255,0.3)" />
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>days active</Text>
                  </View>
                </GlassCard>
                <GlassCard style={{ flex: 1 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>Distance</Text>
                  <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{distanceKm.toFixed(2)}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 }}>km today</Text>
                </GlassCard>
              </View>

              {data.stepInsights && (
                <GlassCard style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Step Summary</Text>
                    <Text style={{ color: '#f97316', fontSize: 12, fontWeight: '700' }}>{data.stepInsights.weekAverage.toLocaleString()} daily avg</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                    {[
                      { label: '7 days', value: data.stepInsights.weekSteps.toLocaleString() },
                      { label: 'Month', value: data.stepInsights.monthSteps.toLocaleString() },
                      { label: 'Best', value: data.stepInsights.bestDaySteps.toLocaleString() },
                    ].map(item => (
                      <View key={item.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12 }}>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{item.value}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 3 }}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 76 }}>
                    {data.stepInsights.recentDays.map(day => (
                      <View key={day.date} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <View style={{ width: '100%', height: 46, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'flex-end', overflow: 'hidden' }}>
                          <View style={{ height: `${Math.max(day.progress * 100, 4)}%`, backgroundColor: day.goalReached ? '#22c55e' : '#f97316', borderRadius: 6 }} />
                        </View>
                        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: day.goalReached ? '800' : '500' }}>{day.label}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 12 }}>{data.stepInsights.activeDaysThisMonth} active days this month</Text>
                </GlassCard>
              )}

              {data.todayMeals.length > 0 && (
                <GlassCard style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Recent Meals</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/calories')}>
                      <Text style={{ color: '#f97316', fontSize: 12, fontWeight: '600' }}>See all →</Text>
                    </TouchableOpacity>
                  </View>
                  {data.todayMeals.map((meal, i) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: i < data.todayMeals.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                      <Text style={{ color: '#fff', fontSize: 14, flex: 1 }} numberOfLines={1}>{meal.food_name}</Text>
                      <Text style={{ color: '#f97316', fontSize: 13, fontWeight: '700', marginLeft: 8 }}>{meal.calories} kcal</Text>
                    </View>
                  ))}
                </GlassCard>
              )}

              {data.todayMeals.length === 0 && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/calories')} activeOpacity={0.8}>
                  <GlassCard style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(249,115,22,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="camera-outline" size={20} color="#f97316" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>No meals logged today</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>Tap to scan your first meal →</Text>
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              )}
            </>
          )}

          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="bulb-outline" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 2 }}>TIP OF THE DAY</Text>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500', lineHeight: 18 }}>{tip}</Text>
              </View>
            </View>
          </GlassCard>

        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
