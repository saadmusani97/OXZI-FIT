import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Share as NativeShare } from 'react-native'
import type { ViewStyle } from 'react-native'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import type { WebView } from 'react-native-webview'
import { useAuthStore } from '../../stores/authStore'
import { useActivityShareStore } from '../../stores/activityShareStore'
import { formatDuration } from '../../lib/utils'
import OSMMap from '../../components/tracking/OSMMap'
import {
  type ActivityType,
  type TrackingCoordinate,
  type TrackingSnapshot,
  clearBackgroundTrackingStateAsync,
  checkBackgroundFitnessPermissionsAsync,
  getBackgroundTrackingSnapshotAsync,
  isBackgroundFitnessTrackingActiveAsync,
  requestBackgroundFitnessPermissionsAsync,
  startBackgroundFitnessTrackingAsync,
  stopBackgroundFitnessTrackingAsync,
} from '../../lib/backgroundFitness'
import { fetchRecentRoutes, saveRoute, type SavedRoute } from '../../lib/routes'
import { deriveActivitySummary, getAverageSpeed, toTrackingCoordinates } from '../../lib/routeMetrics'

type TrackingPhase = 'idle' | 'recording' | 'paused'
type MapType = 'standard' | 'satellite' | 'hybrid'
type IoniconName = React.ComponentProps<typeof Ionicons>['name']

function GlassCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <BlurView intensity={24} tint="dark" style={[{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }, style]}>
      <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: 16 }}>
        {children}
      </View>
    </BlurView>
  )
}

function StatItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
      <Text style={{ color: accent ? '#f97316' : '#fff', fontSize: 24, fontWeight: '900' }}>{value}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Text>
    </View>
  )
}

function ControlButton({
  label,
  icon,
  onPress,
  disabled,
  variant,
}: {
  label: string
  icon: IoniconName
  onPress: () => void
  disabled?: boolean
  variant: 'primary' | 'secondary' | 'danger'
}) {
  const backgroundColor = variant === 'primary' ? '#f97316' : variant === 'danger' ? '#ef4444' : 'rgba(255,255,255,0.08)'
  const borderColor = variant === 'primary' ? '#fb923c' : variant === 'danger' ? '#f87171' : 'rgba(255,255,255,0.12)'

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.82}
      style={{
        flex: 1,
        borderRadius: 22,
        paddingVertical: 16,
        paddingHorizontal: 14,
        backgroundColor,
        borderWidth: 1,
        borderColor,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Ionicons name={icon} size={22} color="#fff" />
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Text>
    </TouchableOpacity>
  )
}

function ActionChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string
  icon: IoniconName
  active?: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={{
        flex: 1,
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 12,
        alignItems: 'center',
        gap: 8,
        backgroundColor: active ? 'rgba(249,115,22,0.18)' : 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: active ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.08)',
      }}
    >
      <Ionicons name={icon} size={20} color={active ? '#f97316' : '#fff'} />
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' }}>{label}</Text>
    </TouchableOpacity>
  )
}

function getGpsStatus(accuracy: number | null): { icon: IoniconName; label: string; color: string } {
  if (accuracy === null) {
    return { icon: 'locate-outline', label: 'GPS Pending', color: '#a1a1aa' }
  }

  if (accuracy <= 8) {
    return { icon: 'locate', label: 'GPS Strong', color: '#22c55e' }
  }

  if (accuracy <= 16) {
    return { icon: 'radio-outline', label: 'GPS Fair', color: '#facc15' }
  }

  return { icon: 'warning-outline', label: 'GPS Weak', color: '#f97316' }
}

export default function TrackScreen() {
  const router = useRouter()
  const { session } = useAuthStore()
  const { setSummary } = useActivityShareStore()
  const webViewRef = useRef<WebView>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [phase, setPhase] = useState<TrackingPhase>('idle')
  const [coordinates, setCoordinates] = useState<TrackingCoordinate[]>([])
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number }>({
    latitude: 37.7749,
    longitude: -122.4194,
  })
  const [locationReady, setLocationReady] = useState(false)
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [distanceKm, setDistanceKm] = useState(0)
  const [activityType, setActivityType] = useState<ActivityType>('run')
  const [saving, setSaving] = useState(false)
  const [routes, setRoutes] = useState<SavedRoute[]>([])
  const [loadingRoutes, setLoadingRoutes] = useState(true)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [mapType, setMapType] = useState<MapType>('standard')
  const [showPointsOfInterest, setShowPointsOfInterest] = useState(true)
  const [shareLiveLocation, setShareLiveLocation] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const isRecording = phase === 'recording'
  const isPaused = phase === 'paused'
  const averageSpeed = useMemo(() => getAverageSpeed(distanceKm, elapsed), [distanceKm, elapsed])
  const gpsStatus = getGpsStatus(gpsAccuracy)
  const activityIcons: Record<ActivityType, IoniconName> = {
    run: 'speedometer-outline',
    walk: 'walk-outline',
    cycle: 'bicycle-outline',
  }
  const mapRoute = useMemo(
    () => coordinates.map(point => ({ latitude: point.latitude, longitude: point.longitude, timestamp: point.timestamp, speedKmh: point.speedKmh })),
    [coordinates]
  )

  const fetchRoutesList = useCallback(async () => {
    if (!session?.user?.id) {
      setRoutes([])
      setLoadingRoutes(false)
      return
    }

    setLoadingRoutes(true)
    try {
      const data = await fetchRecentRoutes(session.user.id, 10)
      setRoutes(data)
    } catch (error) {
      console.warn(error)
      setRoutes([])
    } finally {
      setLoadingRoutes(false)
    }
  }, [session?.user?.id])

  const applySnapshot = useCallback((snapshot: TrackingSnapshot) => {
    setCoordinates(snapshot.coordinates)
    setDistanceKm(snapshot.distanceKm)
    setElapsed(snapshot.elapsedSeconds)
    setActivityType(snapshot.activityType)

    const last = snapshot.coordinates[snapshot.coordinates.length - 1]
    if (last) {
      setCurrentLocation({ latitude: last.latitude, longitude: last.longitude })
      setGpsAccuracy(last.accuracy ?? null)
      setLocationReady(true)
    }
  }, [])

  const loadCurrentLocation = useCallback(async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
      setGpsAccuracy(loc.coords.accuracy ?? null)
      setLocationReady(true)
    } catch {}
  }, [])

  const refreshTrackingSnapshot = useCallback(async () => {
    const snapshot = await getBackgroundTrackingSnapshotAsync()
    if (!snapshot) return
    applySnapshot(snapshot)
  }, [applySnapshot])

  const syncPermissions = useCallback(async () => {
    const perms = await checkBackgroundFitnessPermissionsAsync()
    const granted = perms.foreground && perms.background
    setPermissionGranted(granted)

    if (perms.foreground) {
      await loadCurrentLocation()
    }
  }, [loadCurrentLocation])

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([syncPermissions(), fetchRoutesList()])
      const active = await isBackgroundFitnessTrackingActiveAsync()
      const snapshot = await getBackgroundTrackingSnapshotAsync()

      if (snapshot) {
        applySnapshot(snapshot)
      }

      if (active) {
        setPhase('recording')
      } else if (snapshot && snapshot.coordinates.length > 0) {
        setPhase('paused')
      } else {
        setPhase('idle')
      }
    }

    initialize()

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [applySnapshot, fetchRoutesList, syncPermissions])

  useEffect(() => {
    if (!isRecording) {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }

    refreshTrackingSnapshot()
    pollRef.current = setInterval(() => {
      refreshTrackingSnapshot()
    }, 2000)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [isRecording, refreshTrackingSnapshot])

  const requestPermission = useCallback(async () => {
    const perms = await requestBackgroundFitnessPermissionsAsync()
    const granted = perms.foreground && perms.background
    setPermissionGranted(granted)

    if (!granted) {
      Alert.alert('Permission Required', 'Foreground and background location are required to keep tracking active while the app is minimized.')
      return false
    }

    await loadCurrentLocation()
    return true
  }, [loadCurrentLocation])

  const handleStart = useCallback(async () => {
    if (!session?.user?.id) {
      Alert.alert('Sign in required', 'Please login to start tracking.')
      return
    }

    if (!permissionGranted) {
      const grantedNow = await requestPermission()
      if (!grantedNow) return
    }

    try {
      setSaving(true)
      const snapshot = await startBackgroundFitnessTrackingAsync({
        userId: session.user.id,
        activityType,
      })

      if (snapshot) {
        applySnapshot(snapshot)
      } else {
        setCoordinates([])
        setDistanceKm(0)
        setElapsed(0)
      }

      setPhase('recording')
      webViewRef.current?.injectJavaScript('window.recenter();true;')
    } catch (error) {
      Alert.alert('Start error', 'Unable to start tracking.')
      console.warn(error)
    } finally {
      setSaving(false)
    }
  }, [activityType, applySnapshot, permissionGranted, requestPermission, session?.user?.id])

  const handlePause = useCallback(async () => {
    try {
      setSaving(true)
      await stopBackgroundFitnessTrackingAsync()
      await refreshTrackingSnapshot()
      setPhase('paused')
    } catch (error) {
      Alert.alert('Pause error', 'Unable to pause tracking right now.')
      console.warn(error)
    } finally {
      setSaving(false)
    }
  }, [refreshTrackingSnapshot])

  const handleStop = useCallback(async () => {
    try {
      setSaving(true)
      await stopBackgroundFitnessTrackingAsync()
      const snapshot = await getBackgroundTrackingSnapshotAsync()

      if (!snapshot || snapshot.coordinates.length < 2 || !session?.user?.id) {
        await clearBackgroundTrackingStateAsync()
        setCoordinates([])
        setDistanceKm(0)
        setElapsed(0)
        setPhase('idle')
        Alert.alert('Too short', 'Route needs at least 2 GPS points.')
        return
      }

      const endedAt = new Date().toISOString()
      const savedRoute = await saveRoute({
        userId: session.user.id,
        activityType: snapshot.activityType,
        distanceKm: snapshot.distanceKm,
        durationSeconds: snapshot.elapsedSeconds,
        coordinates: snapshot.coordinates,
        startedAt: snapshot.startedAt,
        endedAt,
      })

      const summary = deriveActivitySummary({
        routeId: savedRoute.id,
        activityType: snapshot.activityType,
        startedAt: snapshot.startedAt,
        endedAt,
        distanceKm: snapshot.distanceKm,
        durationSeconds: snapshot.elapsedSeconds,
        coordinates: snapshot.coordinates,
      })

      setSummary(summary)
      await clearBackgroundTrackingStateAsync()
      setCoordinates([])
      setDistanceKm(0)
      setElapsed(0)
      setPhase('idle')
      await fetchRoutesList()
      router.push('/activity-summary' as never)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to stop tracking cleanly.'
      Alert.alert('Stop error', message)
      console.warn(error)
    } finally {
      setSaving(false)
    }
  }, [fetchRoutesList, router, session?.user?.id, setSummary])

  const openSavedRoute = useCallback((route: SavedRoute) => {
    const summary = deriveActivitySummary({
      routeId: route.id,
      activityType: route.activity_type,
      startedAt: route.started_at,
      endedAt: route.ended_at,
      distanceKm: route.distance_km,
      durationSeconds: route.duration_seconds,
      coordinates: toTrackingCoordinates(route.coordinates),
    })
    setSummary(summary)
    router.push('/activity-summary' as never)
  }, [router, setSummary])

  const handleShareLiveLocation = useCallback(async () => {
    const nextValue = !shareLiveLocation
    setShareLiveLocation(nextValue)

    if (!nextValue) {
      return
    }

    const message = `Track me live on OXZIFIT: https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`

    try {
      await NativeShare.share({ message })
    } catch (error) {
      console.warn(error)
    }
  }, [currentLocation.latitude, currentLocation.longitude, shareLiveLocation])

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ height: isRecording || isPaused ? '56%' : '46%' }}>
        <OSMMap
          center={currentLocation}
          route={mapRoute}
          style={{ flex: 1 }}
          mapRef={webViewRef}
          mapType={mapType}
          showPointsOfInterest={showPointsOfInterest}
        />

        <View style={{ position: 'absolute', top: 18, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <BlurView intensity={22} tint="dark" style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <Ionicons name={gpsStatus.icon} size={16} color={gpsStatus.color} />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{gpsStatus.label}</Text>
              {gpsAccuracy !== null && (
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '700' }}>
                  {Math.round(gpsAccuracy)}m
                </Text>
              )}
            </View>
          </BlurView>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <BlurView intensity={22} tint="dark" style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <View style={{ paddingHorizontal: 12, paddingVertical: 9, backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1.2 }}>N</Text>
              </View>
            </BlurView>
            <TouchableOpacity
              onPress={() => {
                webViewRef.current?.injectJavaScript('window.recenter();true;')
              }}
              style={{ backgroundColor: '#f97316', borderRadius: 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
              activeOpacity={0.82}
            >
              <Ionicons name="locate" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {!locationReady && (
          <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center' }}>
            <TouchableOpacity onPress={requestPermission} style={{ backgroundColor: '#f97316', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 11, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Ionicons name="location" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Enable background location</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        <GlassCard style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>Recording</Text>
            <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: isRecording ? 'rgba(34,197,94,0.15)' : isPaused ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.06)' }}>
              <Text style={{ color: isRecording ? '#22c55e' : isPaused ? '#facc15' : 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {isRecording ? 'Live' : isPaused ? 'Paused' : 'Ready'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <StatItem label="Time" value={formatDuration(elapsed)} />
            <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <StatItem label="Distance" value={distanceKm.toFixed(2)} accent />
            <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <StatItem label="Speed" value={averageSpeed > 0 ? averageSpeed.toFixed(1) : '--'} />
          </View>
        </GlassCard>

        <GlassCard style={{ marginBottom: 16 }}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 12 }}>Activity</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['run', 'walk', 'cycle'] as const).map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => setActivityType(type)}
                disabled={phase !== 'idle'}
                activeOpacity={0.82}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 18,
                  backgroundColor: activityType === type ? '#f97316' : 'rgba(255,255,255,0.06)',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: activityType === type ? '#fb923c' : 'rgba(255,255,255,0.1)',
                  opacity: phase !== 'idle' && activityType !== type ? 0.55 : 1,
                }}
              >
                <Ionicons name={activityIcons[type]} size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', marginTop: 4, textTransform: 'capitalize' }}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <ControlButton
            label={isPaused ? 'Resume' : 'Start'}
            icon={isPaused ? 'play' : 'play-circle'}
            onPress={handleStart}
            disabled={saving || isRecording}
            variant="primary"
          />
          <ControlButton
            label="Pause"
            icon="pause-circle"
            onPress={handlePause}
            disabled={saving || !isRecording}
            variant="secondary"
          />
          <ControlButton
            label="Stop"
            icon="stop-circle"
            onPress={handleStop}
            disabled={saving || phase === 'idle'}
            variant="danger"
          />
        </View>

        {saving && (
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <ActivityIndicator color="#f97316" />
          </View>
        )}

        <GlassCard style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <View>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Session Tools</Text>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 4 }}>Sharing, sensors, and map layers</Text>
            </View>
            <TouchableOpacity onPress={() => setShowSettings(value => !value)} activeOpacity={0.82}>
              <Ionicons name={showSettings ? 'chevron-up' : 'chevron-down'} size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ActionChip label="Share live location" icon="paper-plane-outline" active={shareLiveLocation} onPress={handleShareLiveLocation} />
            <ActionChip
              label="Add sensor"
              icon="watch-outline"
              onPress={() => Alert.alert('Sensors', 'External sensor pairing can slot in here next. The recording flow is ready for it.')}
            />
            <ActionChip label="Settings" icon="options-outline" active={showSettings} onPress={() => setShowSettings(value => !value)} />
          </View>

          {showSettings && (
            <View style={{ marginTop: 16, gap: 14 }}>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Map type
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['standard', 'satellite', 'hybrid'] as const).map(type => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setMapType(type)}
                      activeOpacity={0.82}
                      style={{
                        flex: 1,
                        borderRadius: 16,
                        paddingVertical: 12,
                        alignItems: 'center',
                        backgroundColor: mapType === type ? '#f97316' : 'rgba(255,255,255,0.05)',
                        borderWidth: 1,
                        borderColor: mapType === type ? '#fb923c' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', textTransform: 'capitalize' }}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowPointsOfInterest(value => !value)}
                activeOpacity={0.82}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 18,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="business-outline" size={18} color="#fff" />
                  <View>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Points of Interest</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>
                      {showPointsOfInterest ? 'Labels and places visible' : 'Cleaner route-first map'}
                    </Text>
                  </View>
                </View>
                <Ionicons name={showPointsOfInterest ? 'toggle' : 'toggle-outline'} size={34} color={showPointsOfInterest ? '#f97316' : 'rgba(255,255,255,0.35)'} />
              </TouchableOpacity>
            </View>
          )}
        </GlassCard>

        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 12 }}>Recent Routes</Text>

        {loadingRoutes ? (
          <ActivityIndicator color="#f97316" />
        ) : routes.length === 0 ? (
          <GlassCard>
            <Text style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', fontSize: 14 }}>No routes yet. Start your first session.</Text>
          </GlassCard>
        ) : (
          routes.map(route => (
            <TouchableOpacity key={route.id} onPress={() => openSavedRoute(route)} activeOpacity={0.84}>
              <BlurView intensity={18} tint="dark" style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 10 }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(249,115,22,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={activityIcons[route.activity_type]} size={20} color="#f97316" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15, textTransform: 'capitalize' }}>{route.activity_type}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.42)', fontSize: 12, marginTop: 2 }}>
                      {route.distance_km.toFixed(2)} km · {formatDuration(route.duration_seconds)} · {route.distance_km > 0 ? `${(route.duration_seconds / 60 / route.distance_km).toFixed(1)} min/km` : 'pace pending'}
                    </Text>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                    {new Date(route.started_at).toLocaleDateString()}
                  </Text>
                </View>
              </BlurView>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  )
}
