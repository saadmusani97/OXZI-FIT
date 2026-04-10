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

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const QUICK_ACTIONS: { icon: IoniconName; label: string; route: string }[] = [
  { icon: 'barbell-outline', label: 'Workout', route: '/(tabs)/exercises' },
  { icon: 'camera-outline', label: 'Cal AI', route: '/(tabs)/calories' },
  { icon: 'map-outline', label: 'Track', route: '/(tabs)/track' },
  { icon: 'trophy-outline', label: 'Ranks', route: '/(tabs)/leaderboard' },
]

const TIPS = [
  'Stretching after workouts improves your sleep quality.',
  'Drinking water before meals helps control calorie intake.',
  'Walking 10,000 steps burns approximately 400 calories.',
  'Rest days are just as important as workout days.',
  'Protein helps repair muscles after exercise.',
]

function GlassPanel({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <BlurView intensity={45} tint="light" style={[{ borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.78)' }, style]}>
      <View style={{ backgroundColor: 'rgba(255,255,255,0.58)', padding: 18 }}>
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
      todayCalories: totalCalories,
      todayWorkouts: workoutsRes.count ?? 0,
      todayMeals: meals.slice(0, 3),
      myRank,
      myPoints,
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
    if (progress === 0) { seenMilestonesRef.current.clear(); return }
    const nextMilestone = reachedMilestones.find(milestone => !seenMilestonesRef.current.has(milestone))
    if (!nextMilestone) return
    seenMilestonesRef.current.add(nextMilestone)
    setStepMilestone(nextMilestone)
    if (nextMilestone === 100) fetchDashboard()
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
    <View style={{ flex: 1, backgroundColor: '#fff7f0' }}>
      <LinearGradient colors={['#fffdf8', '#fff5ea', '#fff0e0']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ position: 'absolute', top: -70, right: -20, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(249,115,22,0.12)' }} />
      <View style={{ position: 'absolute', top: 280, left: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(251,146,60,0.08)' }} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" colors={['#f97316']} />}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 16, marginBottom: 18 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="hand-right-outline" size={13} color="#9a3412" />
                <Text style={{ color: '#9a3412', fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>{greeting}</Text>
              </View>
              <Text style={{ color: '#111827', fontSize: 32, fontWeight: '900', marginTop: 6 }}>
                {profile?.full_name?.split(' ')[0] ?? 'Athlete'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleLogout} activeOpacity={0.86}>
              <BlurView intensity={40} tint="light" style={{ borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.78)' }}>
                <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.48)' }}>
                  <Ionicons name="log-out-outline" size={20} color="#ea580c" />
                </View>
              </BlurView>
            </TouchableOpacity>
          </View>

          <GlassPanel style={{ marginBottom: 18 }}>
            <Text style={{ color: '#9a3412', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Daily Step Goal</Text>
            <Text style={{ color: '#111827', fontSize: 28, fontWeight: '900', marginBottom: 12 }}>
              {steps.toLocaleString()} <Text style={{ fontSize: 16, fontWeight: '400', color: '#9a3412' }}>/ {dailyGoal.toLocaleString()}</Text>
            </Text>
            <View style={{ backgroundColor: 'rgba(249,115,22,0.12)', borderRadius: 8, height: 8, marginBottom: 8 }}>
              <View style={{ backgroundColor: progress >= 1 ? '#22c55e' : '#f97316', borderRadius: 8, height: 8, width: `${Math.min(Math.round(progress * 100), 100)}%` }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#9a3412', fontSize: 12 }}>
                {Math.round(progress * 100)}% complete · {distanceKm.toFixed(2)} km
              </Text>
              <Text style={{ color: status === 'active' ? '#22c55e' : '#ef4444', fontSize: 10, fontWeight: '700' }}>
                {status === 'active' ? '● Live' : status === 'loading' ? '● Loading' : '● Needs APK'}
              </Text>
            </View>
          </GlassPanel>

          {stepMilestone && (
            <GlassPanel style={{ marginBottom: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(34,197,94,0.16)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="footsteps" size={20} color="#22c55e" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#111827', fontSize: 14, fontWeight: '800' }}>{stepMilestone}% step goal hit</Text>
                  <Text style={{ color: '#9a3412', fontSize: 12, marginTop: 2 }}>{steps.toLocaleString()} steps today</Text>
                </View>
              </View>
            </GlassPanel>
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity key={action.label} onPress={() => router.push(action.route as never)} style={{ flex: 1, alignItems: 'center', gap: 8 }} activeOpacity={0.7}>
                <BlurView intensity={42} tint="light" style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.76)', width: 56, height: 56 }}>
                  <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.48)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={action.icon} size={22} color="#f97316" />
                  </View>
                </BlurView>
                <Text style={{ color: '#7c2d12', fontSize: 11, fontWeight: '700' }}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator color="#f97316" style={{ marginVertical: 20 }} />
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                <GlassPanel style={{ flex: 1 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(249,115,22,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Ionicons name="flame-outline" size={18} color="#f97316" />
                  </View>
                  <Text style={{ color: '#111827', fontSize: 22, fontWeight: '900' }}>{data.todayCalories}</Text>
                  <Text style={{ color: '#9a3412', fontSize: 11, fontWeight: '700', marginTop: 2 }}>/ {dailyCalGoal} kcal</Text>
                  <View style={{ backgroundColor: 'rgba(249,115,22,0.12)', borderRadius: 4, height: 4, marginTop: 8 }}>
                    <View style={{ backgroundColor: '#f97316', borderRadius: 4, height: 4, width: `${Math.min((data.todayCalories / dailyCalGoal) * 100, 100)}%` }} />
                  </View>
                </GlassPanel>
                <GlassPanel style={{ flex: 1 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.44)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Ionicons name="barbell-outline" size={18} color="#c2410c" />
                  </View>
                  <Text style={{ color: '#111827', fontSize: 22, fontWeight: '900' }}>{data.todayWorkouts}</Text>
                  <Text style={{ color: '#9a3412', fontSize: 11, fontWeight: '700', marginTop: 2 }}>workouts</Text>
                </GlassPanel>
                <GlassPanel style={{ flex: 1 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.44)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Ionicons name="trophy-outline" size={18} color="#c2410c" />
                  </View>
                  <Text style={{ color: '#111827', fontSize: 22, fontWeight: '900' }}>{data.myRank ? `#${data.myRank}` : '—'}</Text>
                  <Text style={{ color: '#9a3412', fontSize: 11, fontWeight: '700', marginTop: 2 }}>{data.myPoints} pts</Text>
                </GlassPanel>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                <GlassPanel style={{ flex: 1 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.44)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Ionicons name="footsteps-outline" size={18} color="#c2410c" />
                  </View>
                  <Text style={{ color: '#111827', fontSize: 22, fontWeight: '900' }}>{Math.round(caloriesBurned)}</Text>
                  <Text style={{ color: '#9a3412', fontSize: 11, fontWeight: '700', marginTop: 2 }}>kcal steps</Text>
                </GlassPanel>
                <GlassPanel style={{ flex: 1 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(249,115,22,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Ionicons name="flame-outline" size={18} color="#f97316" />
                  </View>
                  <Text style={{ color: '#111827', fontSize: 22, fontWeight: '900' }}>{streakCount}</Text>
                  <Text style={{ color: '#9a3412', fontSize: 11, fontWeight: '700', marginTop: 2 }}>day streak</Text>
                </GlassPanel>
                <GlassPanel style={{ flex: 1 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.44)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Ionicons name="trail-sign-outline" size={18} color="#c2410c" />
                  </View>
                  <Text style={{ color: '#111827', fontSize: 22, fontWeight: '900' }}>{distanceKm.toFixed(2)}</Text>
                  <Text style={{ color: '#9a3412', fontSize: 11, fontWeight: '700', marginTop: 2 }}>km today</Text>
                </GlassPanel>
              </View>

              {data.stepInsights && (
                <GlassPanel style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <Text style={{ color: '#111827', fontSize: 16, fontWeight: '900' }}>Step Summary</Text>
                    <Text style={{ color: '#f97316', fontSize: 12, fontWeight: '700' }}>{data.stepInsights.weekAverage.toLocaleString()} daily avg</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                    {[
                      { label: '7 days', value: data.stepInsights.weekSteps.toLocaleString() },
                      { label: 'Month', value: data.stepInsights.monthSteps.toLocaleString() },
                      { label: 'Best', value: data.stepInsights.bestDaySteps.toLocaleString() },
                    ].map(item => (
                      <View key={item.label} style={{ flex: 1, backgroundColor: 'rgba(249,115,22,0.08)', borderRadius: 12, padding: 12 }}>
                        <Text style={{ color: '#111827', fontSize: 16, fontWeight: '900' }}>{item.value}</Text>
                        <Text style={{ color: '#9a3412', fontSize: 10, marginTop: 3 }}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 76 }}>
                    {data.stepInsights.recentDays.map(day => (
                      <View key={day.date} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <View style={{ width: '100%', height: 46, borderRadius: 6, backgroundColor: 'rgba(249,115,22,0.1)', justifyContent: 'flex-end', overflow: 'hidden' }}>
                          <View style={{ height: `${Math.max(day.progress * 100, 4)}%`, backgroundColor: day.goalReached ? '#22c55e' : '#f97316', borderRadius: 6 }} />
                        </View>
                        <Text style={{ color: '#9a3412', fontSize: 10, fontWeight: day.goalReached ? '800' : '500' }}>{day.label}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={{ color: '#9a3412', fontSize: 11, marginTop: 12 }}>{data.stepInsights.activeDaysThisMonth} active days this month</Text>
                </GlassPanel>
              )}

              {data.todayMeals.length > 0 && (
                <GlassPanel style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: '#111827', fontSize: 15, fontWeight: '900' }}>Recent Meals</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/calories')}>
                      <Text style={{ color: '#f97316', fontSize: 12, fontWeight: '700' }}>See all</Text>
                    </TouchableOpacity>
                  </View>
                  {data.todayMeals.map((meal, i) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i < data.todayMeals.length - 1 ? 1 : 0, borderBottomColor: 'rgba(249,115,22,0.08)' }}>
                      <Text style={{ color: '#111827', fontSize: 14, flex: 1 }} numberOfLines={1}>{meal.food_name}</Text>
                      <Text style={{ color: '#f97316', fontSize: 13, fontWeight: '800', marginLeft: 8 }}>{meal.calories} kcal</Text>
                    </View>
                  ))}
                </GlassPanel>
              )}

              {data.todayMeals.length === 0 && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/calories')} activeOpacity={0.8}>
                  <GlassPanel style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(249,115,22,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="camera-outline" size={20} color="#f97316" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#111827', fontSize: 14, fontWeight: '700' }}>No meals logged today</Text>
                        <Text style={{ color: '#9a3412', fontSize: 12, marginTop: 2 }}>Tap to scan your first meal</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#9a3412" />
                    </View>
                  </GlassPanel>
                </TouchableOpacity>
              )}
            </>
          )}

          <GlassPanel>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(249,115,22,0.16)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="bulb-outline" size={20} color="#f97316" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#9a3412', fontSize: 11, fontWeight: '800', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.8 }}>Tip of the day</Text>
                <Text style={{ color: '#111827', fontSize: 13, fontWeight: '500', lineHeight: 18 }}>{tip}</Text>
              </View>
            </View>
          </GlassPanel>

        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
