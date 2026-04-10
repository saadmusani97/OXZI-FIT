import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

interface Stats {
  totalWorkouts: number
  totalMeals: number
  totalRoutes: number
  totalSteps: number
  totalKm: number
}

function GlassPanel({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <BlurView intensity={45} tint="light" style={[{ borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.78)' }, style]}>
      <View style={{ backgroundColor: 'rgba(255,255,255,0.58)', padding: 18 }}>
        {children}
      </View>
    </BlurView>
  )
}

function LiquidIconButton({
  icon,
  label,
  onPress,
  color = '#f97316',
}: {
  icon: IoniconName
  label: string
  onPress: () => void
  color?: string
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.86} style={{ flex: 1 }}>
      <BlurView intensity={42} tint="light" style={{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.76)' }}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.48)', alignItems: 'center', paddingVertical: 16, gap: 10 }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: `${color}16`, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <Text style={{ color: '#7c2d12', fontSize: 12, fontWeight: '800' }}>{label}</Text>
        </View>
      </BlurView>
    </TouchableOpacity>
  )
}

function MetricCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: IoniconName
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <GlassPanel style={{ flex: 1 }}>
      <View style={{ gap: 8 }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: accent ? 'rgba(249,115,22,0.16)' : 'rgba(255,255,255,0.44)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={18} color={accent ? '#f97316' : '#c2410c'} />
        </View>
        <Text style={{ color: '#111827', fontSize: 22, fontWeight: '900' }}>{value}</Text>
        <Text style={{ color: '#9a3412', fontSize: 12, fontWeight: '700' }}>{label}</Text>
      </View>
    </GlassPanel>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: IoniconName
  label: string
  value: string
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(249,115,22,0.08)' }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(249,115,22,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Ionicons name={icon} size={16} color="#f97316" />
      </View>
      <Text style={{ flex: 1, color: '#9a3412', fontSize: 14 }}>{label}</Text>
      <Text style={{ color: '#111827', fontSize: 14, fontWeight: '800', textTransform: 'capitalize' }}>{value}</Text>
    </View>
  )
}

export default function ProfileScreen() {
  const { session, profile, clearAuth } = useAuthStore()
  const [stats, setStats] = useState<Stats>({ totalWorkouts: 0, totalMeals: 0, totalRoutes: 0, totalSteps: 0, totalKm: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [myPoints, setMyPoints] = useState(0)
  const [myRank, setMyRank] = useState<number | null>(null)

  const fetchStats = useCallback(async () => {
    if (!session?.user?.id) return
    setLoading(true)

    const [workouts, meals, routes, steps, leaderboard, rankData] = await Promise.all([
      supabase.from('workouts').select('id', { count: 'exact' }).eq('user_id', session.user.id),
      supabase.from('meals').select('id', { count: 'exact' }).eq('user_id', session.user.id),
      supabase.from('routes').select('distance_km').eq('user_id', session.user.id),
      supabase.from('daily_steps').select('steps').eq('user_id', session.user.id),
      supabase.from('leaderboard_entries').select('total_points').eq('user_id', session.user.id).eq('month', new Date().toISOString().slice(0, 7)).single(),
      supabase.from('leaderboard_entries').select('user_id').eq('month', new Date().toISOString().slice(0, 7)).order('total_points', { ascending: false }),
    ])

    const totalKm = (routes.data ?? []).reduce((sum: number, route: { distance_km: number }) => sum + route.distance_km, 0)
    const totalSteps = (steps.data ?? []).reduce((sum: number, day: { steps: number }) => sum + day.steps, 0)

    setStats({
      totalWorkouts: workouts.count ?? 0,
      totalMeals: meals.count ?? 0,
      totalRoutes: (routes.data ?? []).length,
      totalSteps,
      totalKm,
    })
    setMyPoints(leaderboard.data?.total_points ?? 0)

    const rank = (rankData.data ?? []).findIndex((entry: { user_id: string }) => entry.user_id === session.user.id) + 1
    setMyRank(rank > 0 ? rank : null)
    setLoading(false)
  }, [session?.user?.id])

  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  async function onRefresh() {
    setRefreshing(true)
    await fetchStats()
    setRefreshing(false)
  }

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          clearAuth()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
    : 'OX'

  const fitnessGoalLabel = profile?.fitness_goal?.replace(/_/g, ' ') ?? 'Goal not set'
  const activityLevelLabel = profile?.activity_level?.replace(/_/g, ' ') ?? 'Not set'

  return (
    <View style={{ flex: 1, backgroundColor: '#fff7f0' }}>
      <LinearGradient colors={['#fffdf8', '#fff5ea', '#fff0e0']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ position: 'absolute', top: -70, right: -20, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(249,115,22,0.12)' }} />
      <View style={{ position: 'absolute', top: 280, left: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(251,146,60,0.08)' }} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" colors={['#f97316']} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginTop: 16, marginBottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#7c2d12', fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>Account Center</Text>
              <Text style={{ color: '#111827', fontSize: 32, fontWeight: '900', marginTop: 6 }}>Profile</Text>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ width: 86, height: 86, borderRadius: 43, backgroundColor: 'rgba(249,115,22,0.15)', borderWidth: 1.5, borderColor: 'rgba(249,115,22,0.28)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#f97316', fontSize: 30, fontWeight: '900' }}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#111827', fontSize: 24, fontWeight: '900' }}>{profile?.full_name ?? 'Athlete'}</Text>
                <Text style={{ color: '#9a3412', fontSize: 13, marginTop: 4 }}>{session?.user?.email ?? 'No email'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <BlurView intensity={35} tint="light" style={{ borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)' }}>
                    <View style={{ paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.46)' }}>
                      <Ionicons name="flag-outline" size={12} color="#f97316" />
                      <Text style={{ color: '#7c2d12', fontSize: 12, fontWeight: '800', textTransform: 'capitalize' }}>{fitnessGoalLabel}</Text>
                    </View>
                  </BlurView>
                  <BlurView intensity={35} tint="light" style={{ borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)' }}>
                    <View style={{ paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.46)' }}>
                      <Ionicons name="pulse-outline" size={12} color="#f97316" />
                      <Text style={{ color: '#7c2d12', fontSize: 12, fontWeight: '800', textTransform: 'capitalize' }}>{activityLevelLabel}</Text>
                    </View>
                  </BlurView>
                </View>
              </View>
            </View>
          </GlassPanel>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
            <MetricCard icon="trophy-outline" label="Monthly Points" value={myPoints.toString()} accent />
            <MetricCard icon="podium-outline" label="Current Rank" value={myRank ? `#${myRank}` : 'Unranked'} />
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
            <LiquidIconButton icon="create-outline" label="Edit Goals" onPress={() => router.push('/(auth)/onboarding')} />
            <LiquidIconButton icon="map-outline" label="Track Route" onPress={() => router.push('/(tabs)/track' as never)} />
            <LiquidIconButton icon="trophy-outline" label="Rankings" onPress={() => router.push('/(tabs)/leaderboard' as never)} />
          </View>

          {loading ? (
            <ActivityIndicator color="#f97316" style={{ marginTop: 80 }} />
          ) : (
            <>
              <GlassPanel style={{ marginBottom: 18 }}>
                <Text style={{ color: '#111827', fontSize: 18, fontWeight: '900', marginBottom: 14 }}>Performance Snapshot</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                  <MetricCard icon="footsteps-outline" label="All Steps" value={stats.totalSteps.toLocaleString()} accent />
                  <MetricCard icon="trail-sign-outline" label="Distance" value={`${stats.totalKm.toFixed(1)} km`} />
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <MetricCard icon="barbell-outline" label="Workouts" value={stats.totalWorkouts.toString()} />
                  <MetricCard icon="restaurant-outline" label="Meals Logged" value={stats.totalMeals.toString()} />
                </View>
                <View style={{ marginTop: 12 }}>
                  <MetricCard icon="map-outline" label="Saved Routes" value={stats.totalRoutes.toString()} />
                </View>
              </GlassPanel>

              <GlassPanel style={{ marginBottom: 18 }}>
                <Text style={{ color: '#111827', fontSize: 18, fontWeight: '900', marginBottom: 6 }}>Body and Preferences</Text>
                <Text style={{ color: '#9a3412', fontSize: 13, marginBottom: 10 }}>Core profile values used across tracking, goals, and insights.</Text>
                <DetailRow icon="resize-outline" label="Height" value={profile?.height_cm ? `${profile.height_cm} cm` : 'Not set'} />
                <DetailRow icon="body-outline" label="Weight" value={profile?.weight_kg ? `${profile.weight_kg} kg` : 'Not set'} />
                <DetailRow icon="walk-outline" label="Daily Step Goal" value={profile?.daily_step_goal?.toLocaleString() ?? '10,000'} />
                <DetailRow icon="nutrition-outline" label="Daily Calorie Goal" value={profile?.daily_calorie_goal ? `${profile.daily_calorie_goal} kcal` : '2,000 kcal'} />
                <DetailRow icon="restaurant-outline" label="Dietary Preference" value={profile?.dietary_preference || 'Not set'} />
                <DetailRow icon="flame-outline" label="Streak" value={`${profile?.streak_count ?? 0} days`} />
              </GlassPanel>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
