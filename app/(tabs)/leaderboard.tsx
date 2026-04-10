import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'

type Scope = 'global' | 'friends'
type IoniconName = React.ComponentProps<typeof Ionicons>['name']

interface LeaderboardRow {
  user_id: string
  total_points: number
  step_points: number
  workout_points: number
  meal_points: number
  route_points: number
}

interface PublicProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
}

interface LeaderboardEntry extends LeaderboardRow {
  profile: PublicProfile | null
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

function LiquidIcon({
  icon,
  color = '#f97316',
  size = 18,
}: {
  icon: IoniconName
  color?: string
  size?: number
}) {
  return (
    <BlurView intensity={40} tint="light" style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.75)' }}>
      <View style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.45)' }}>
        <Ionicons name={icon} size={size} color={color} />
      </View>
    </BlurView>
  )
}

function LeaderChip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.86} style={{ flex: 1 }}>
      <BlurView intensity={40} tint="light" style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: active ? 'rgba(249,115,22,0.35)' : 'rgba(255,255,255,0.68)' }}>
        <View style={{ backgroundColor: active ? 'rgba(249,115,22,0.92)' : 'rgba(255,255,255,0.45)', paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ color: active ? '#fff' : '#7c2d12', fontSize: 13, fontWeight: '800', textTransform: 'capitalize' }}>{label}</Text>
        </View>
      </BlurView>
    </TouchableOpacity>
  )
}

function AvatarBubble({ name, rank }: { name: string; rank?: number }) {
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const color = rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#f97316' : '#ea580c'

  return (
    <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: `${color}18`, borderWidth: 1.5, borderColor: `${color}55`, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color, fontSize: 20, fontWeight: '900' }}>{initials}</Text>
    </View>
  )
}

function formatMonthLabel(month: string) {
  const date = new Date(`${month}-01T00:00:00`)
  return date.toLocaleString('default', { month: 'long', year: 'numeric' })
}

export default function LeaderboardScreen() {
  const { session } = useAuthStore()
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([])
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [scope, setScope] = useState<Scope>('global')
  const currentMonth = new Date().toISOString().slice(0, 7)

  const entries = useMemo(() => {
    if (scope === 'global') return allEntries
    return allEntries.filter(row => friendIds.has(row.user_id))
  }, [allEntries, friendIds, scope])

  const fetchLeaderboard = useCallback(async () => {
    if (!session?.user?.id) {
      setAllEntries([])
      setLoading(false)
      return
    }

    setLoading(true)

    const [leaderboardRes, friendshipsRes] = await Promise.all([
      supabase
        .from('leaderboard_entries')
        .select('user_id, total_points, step_points, workout_points, meal_points, route_points')
        .eq('month', currentMonth)
        .order('total_points', { ascending: false })
        .limit(50),
      supabase
        .from('friendships')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`),
    ])

    const leaderboardRows = (leaderboardRes.data ?? []) as LeaderboardRow[]

    const ids = new Set<string>([session.user.id])
    for (const friendship of friendshipsRes.data ?? []) {
      const counterpart = friendship.user_id === session.user.id ? friendship.friend_id : friendship.user_id
      if (counterpart) ids.add(counterpart)
    }
    setFriendIds(ids)

    if (leaderboardRows.length === 0) {
      setAllEntries([])
      setLoading(false)
      return
    }

    const userIds = [...new Set(leaderboardRows.map(row => row.user_id))]
    const profilesRes = await supabase
      .from('public_profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds)

    const profileMap = new Map<string, PublicProfile>(
      ((profilesRes.data ?? []) as PublicProfile[]).map(profile => [profile.id, profile])
    )

    setAllEntries(
      leaderboardRows.map(row => ({
        ...row,
        profile: profileMap.get(row.user_id) ?? null,
      }))
    )
    setLoading(false)
  }, [currentMonth, session?.user?.id])

  useEffect(() => {
    void fetchLeaderboard()
  }, [fetchLeaderboard])

  async function onRefresh() {
    setRefreshing(true)
    await fetchLeaderboard()
    setRefreshing(false)
  }

  const podium = entries.slice(0, 3)
  const others = entries.slice(3)
  const myRank = entries.findIndex(entry => entry.user_id === session?.user?.id) + 1
  const myEntry = entries.find(entry => entry.user_id === session?.user?.id) ?? null

  const podiumOrder = useMemo(() => {
    const second = podium[1]
    const first = podium[0]
    const third = podium[2]
    return [second, first, third].filter(Boolean) as LeaderboardEntry[]
  }, [podium])

  return (
    <View style={{ flex: 1, backgroundColor: '#fff7f0' }}>
      <LinearGradient colors={['#fffdf8', '#fff5ea', '#fff0e3']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ position: 'absolute', top: -70, right: -30, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(249,115,22,0.12)' }} />
      <View style={{ position: 'absolute', top: 240, left: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(251,146,60,0.1)' }} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" colors={['#f97316']} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginTop: 16, marginBottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={{ color: '#7c2d12', fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>Performance Board</Text>
              <Text style={{ color: '#111827', fontSize: 31, fontWeight: '900', marginTop: 6 }}>Leaderboard</Text>
              <Text style={{ color: '#9a3412', fontSize: 14, marginTop: 6 }}>{formatMonthLabel(currentMonth)}</Text>
            </View>
            <LiquidIcon icon="trophy-outline" size={22} />
          </View>

          <GlassPanel style={{ marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <LeaderChip label="global" active={scope === 'global'} onPress={() => setScope('global')} />
              <LeaderChip label="friends" active={scope === 'friends'} onPress={() => setScope('friends')} />
            </View>
          </GlassPanel>

          {loading ? (
            <ActivityIndicator color="#f97316" size="large" style={{ marginTop: 80 }} />
          ) : entries.length === 0 ? (
            <GlassPanel>
              <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                <LiquidIcon icon="sparkles-outline" />
                <Text style={{ color: '#111827', fontSize: 18, fontWeight: '800', marginTop: 14 }}>No leaderboard entries yet</Text>
                <Text style={{ color: '#9a3412', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                  Start logging steps, meals, workouts, and routes to populate the monthly rankings.
                </Text>
              </View>
            </GlassPanel>
          ) : (
            <>
              <GlassPanel style={{ marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: '#111827', fontSize: 18, fontWeight: '900' }}>Top Performers</Text>
                  <Text style={{ color: '#9a3412', fontSize: 12, fontWeight: '700' }}>Top {entries.length}</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
                  {podiumOrder.map(entry => {
                    const rank = podium.findIndex(item => item.user_id === entry.user_id) + 1
                    const isWinner = rank === 1
                    const height = isWinner ? 176 : rank === 2 ? 148 : 136
                    const name = entry.profile?.full_name ?? 'Athlete'

                    return (
                      <View key={entry.user_id} style={{ flex: 1, alignItems: 'center' }}>
                        <AvatarBubble name={name} rank={rank} />
                        <Text style={{ color: '#111827', fontSize: 13, fontWeight: '800', marginTop: 10 }} numberOfLines={1}>
                          {name.split(' ')[0]}
                        </Text>
                        <Text style={{ color: '#f97316', fontSize: 13, fontWeight: '900', marginTop: 4 }}>{entry.total_points} pts</Text>
                        <View style={{ width: '100%', height, marginTop: 12, borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.78)' }}>
                          <LinearGradient colors={isWinner ? ['#fb923c', '#f97316'] : ['#fff5ec', '#ffe3cf']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons
                              name={rank === 1 ? 'trophy' : rank === 2 ? 'medal-outline' : 'ribbon-outline'}
                              size={isWinner ? 34 : 26}
                              color={isWinner ? '#fff' : '#f97316'}
                            />
                            <Text style={{ color: isWinner ? '#fff' : '#c2410c', fontSize: 28, fontWeight: '900', marginTop: 8 }}>#{rank}</Text>
                          </LinearGradient>
                        </View>
                      </View>
                    )
                  })}
                </View>
              </GlassPanel>

              <View style={{ gap: 10 }}>
                {others.map((entry, index) => {
                  const rank = index + 4
                  const isMe = entry.user_id === session?.user?.id
                  const name = entry.profile?.full_name ?? 'Athlete'
                  return (
                    <GlassPanel key={entry.user_id}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Text style={{ width: 28, color: '#9a3412', fontSize: 14, fontWeight: '900' }}>#{rank}</Text>
                        <AvatarBubble name={name} />
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ color: isMe ? '#f97316' : '#111827', fontSize: 15, fontWeight: '900' }}>{name}</Text>
                            {isMe ? <Text style={{ color: '#f97316', fontSize: 11, fontWeight: '800' }}>YOU</Text> : null}
                          </View>
                          <Text style={{ color: '#9a3412', fontSize: 12, marginTop: 4 }}>
                            Steps {entry.step_points} · Workouts {entry.workout_points} · Meals {entry.meal_points} · Routes {entry.route_points}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: '#111827', fontSize: 17, fontWeight: '900' }}>{entry.total_points}</Text>
                          <Text style={{ color: '#9a3412', fontSize: 11, fontWeight: '700' }}>points</Text>
                        </View>
                      </View>
                    </GlassPanel>
                  )
                })}
              </View>

              {myEntry && myRank > 3 ? (
                <GlassPanel style={{ marginTop: 18 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <LiquidIcon icon="person-outline" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#111827', fontSize: 15, fontWeight: '900' }}>Your standing</Text>
                      <Text style={{ color: '#9a3412', fontSize: 13, marginTop: 2 }}>Rank #{myRank} in the current view</Text>
                    </View>
                    <Text style={{ color: '#f97316', fontSize: 18, fontWeight: '900' }}>{myEntry.total_points}</Text>
                  </View>
                </GlassPanel>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
