import AsyncStorage from '@react-native-async-storage/async-storage'
import * as TaskManager from 'expo-task-manager'
import * as Location from 'expo-location'
import { Pedometer } from 'expo-sensors'
import { Platform } from 'react-native'
import { calculateStepCalories, calculateStepDistance, haversineDistance } from './utils'
import { supabase } from './supabase'

export const BACKGROUND_FITNESS_TASK = 'OXZIFIT_BACKGROUND_FITNESS_TASK'
const TRACKING_STATE_KEY = '@oxzifit/background_tracking_state'
const MIN_GPS_ACCURACY_METERS = 5
const MAX_GPS_ACCURACY_METERS = 20
const GPS_PROCESS_NOISE_METERS_PER_SECOND = 3
const MIN_ROUTE_SEGMENT_KM = 0.002
const BACKGROUND_STEP_SYNC_INTERVAL_MS = 30000
const MAX_ROUTE_COORDINATES = 5000
const TRACKING_RESUME_WINDOW_MS = 6 * 60 * 60 * 1000

export type ActivityType = 'run' | 'walk' | 'cycle'

export interface TrackingCoordinate {
  latitude: number
  longitude: number
  timestamp: number
  accuracy?: number | null
  speedKmh?: number
}

export interface TrackingSnapshot {
  userId: string
  activityType: ActivityType
  startedAt: string
  coordinates: TrackingCoordinate[]
  distanceKm: number
  elapsedSeconds: number
  updatedAt: string
}

interface RawTrackingState {
  userId: string
  activityType: ActivityType
  startedAt: string
  coordinates: TrackingCoordinate[]
  distanceKm: number
  gpsFilter?: GPSFilterState | null
  lastStepSyncedAt?: number
  updatedAt: string
}

interface GPSFilterState {
  latitude: number
  longitude: number
  variance: number
  timestamp: number
}

interface PermissionState {
  foreground: boolean
  background: boolean
  motion: boolean
}

function getElapsedSeconds(startedAt: string): number {
  const started = new Date(startedAt).getTime()
  if (Number.isNaN(started)) return 0
  return Math.max(0, Math.floor((Date.now() - started) / 1000))
}

function getMaxSpeedKmh(activityType: ActivityType): number {
  if (activityType === 'walk') return 12
  if (activityType === 'cycle') return 80
  return 35
}

function isRecentTrackingState(state: RawTrackingState): boolean {
  const started = new Date(state.startedAt).getTime()
  if (Number.isNaN(started)) return false
  return Date.now() - started <= TRACKING_RESUME_WINDOW_MS
}

function thinCoordinates(coordinates: TrackingCoordinate[]): TrackingCoordinate[] {
  if (coordinates.length <= MAX_ROUTE_COORDINATES) return coordinates

  const thinned = coordinates.filter((_, index) => index === 0 || index === coordinates.length - 1 || index % 2 === 0)
  if (thinned.length <= MAX_ROUTE_COORDINATES) return thinned
  return thinCoordinates(thinned)
}

function smoothLocation(
  latitude: number,
  longitude: number,
  accuracy: number,
  timestamp: number,
  state: GPSFilterState | null
): { latitude: number; longitude: number; state: GPSFilterState } {
  const normalizedAccuracy = Math.max(accuracy, MIN_GPS_ACCURACY_METERS)

  if (!state) {
    return {
      latitude,
      longitude,
      state: {
        latitude,
        longitude,
        variance: normalizedAccuracy * normalizedAccuracy,
        timestamp,
      },
    }
  }

  let variance = state.variance
  const elapsedMs = timestamp - state.timestamp
  if (elapsedMs > 0) {
    variance += (elapsedMs * GPS_PROCESS_NOISE_METERS_PER_SECOND * GPS_PROCESS_NOISE_METERS_PER_SECOND) / 1000
  }

  const kalmanGain = variance / (variance + normalizedAccuracy * normalizedAccuracy)
  const nextLatitude = state.latitude + kalmanGain * (latitude - state.latitude)
  const nextLongitude = state.longitude + kalmanGain * (longitude - state.longitude)
  const nextVariance = (1 - kalmanGain) * variance

  return {
    latitude: nextLatitude,
    longitude: nextLongitude,
    state: {
      latitude: nextLatitude,
      longitude: nextLongitude,
      variance: nextVariance,
      timestamp,
    },
  }
}

async function readTrackingStateAsync(): Promise<RawTrackingState | null> {
  const raw = await AsyncStorage.getItem(TRACKING_STATE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as RawTrackingState
  } catch {
    await AsyncStorage.removeItem(TRACKING_STATE_KEY)
    return null
  }
}

async function writeTrackingStateAsync(state: RawTrackingState): Promise<void> {
  await AsyncStorage.setItem(TRACKING_STATE_KEY, JSON.stringify(state))
}

async function syncDailyStepsForUserAsync(state: RawTrackingState): Promise<RawTrackingState> {
  const lastStepSyncedAt = state.lastStepSyncedAt ?? 0
  if (Date.now() - lastStepSyncedAt < BACKGROUND_STEP_SYNC_INTERVAL_MS) return state

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)

  try {
    const { steps } = await Pedometer.getStepCountAsync(startOfDay, now)
    const today = now.toISOString().split('T')[0]

    const { error } = await supabase.from('daily_steps').upsert(
      {
        user_id: state.userId,
        date: today,
        steps,
        distance_km: calculateStepDistance(steps),
        calories_burned: calculateStepCalories(steps),
      },
      { onConflict: 'user_id,date' }
    )

    if (error) {
      console.warn('Background step save error:', error.message)
      return state
    }
    return { ...state, lastStepSyncedAt: Date.now() }
  } catch (error) {
    console.warn('Background step sync error:', error)
    return state
  }
}

function appendLocations(state: RawTrackingState, locations: Location.LocationObject[]): RawTrackingState {
  const nextCoordinates = [...state.coordinates]
  let nextDistanceKm = state.distanceKm
  let nextFilter = state.gpsFilter ?? null

  for (const location of locations) {
    const accuracy = location.coords.accuracy
    if (accuracy === null || accuracy > MAX_GPS_ACCURACY_METERS) continue

    const smoothed = smoothLocation(
      location.coords.latitude,
      location.coords.longitude,
      accuracy,
      location.timestamp,
      nextFilter
    )

    const point: TrackingCoordinate = {
      latitude: smoothed.latitude,
      longitude: smoothed.longitude,
      timestamp: location.timestamp,
      accuracy,
    }

    const last = nextCoordinates[nextCoordinates.length - 1]
    if (!last) {
      nextFilter = smoothed.state
      nextCoordinates.push(point)
      continue
    }

    const segmentKm = haversineDistance(
      { lat: last.latitude, lng: last.longitude, timestamp: last.timestamp },
      { lat: point.latitude, lng: point.longitude, timestamp: point.timestamp }
    )
    const elapsedHours = Math.max((point.timestamp - last.timestamp) / 3600000, 0)
    const speedKmh = elapsedHours > 0 ? segmentKm / elapsedHours : 0

    if (speedKmh > getMaxSpeedKmh(state.activityType)) continue

    nextFilter = smoothed.state
    if (segmentKm >= MIN_ROUTE_SEGMENT_KM) {
      point.speedKmh = speedKmh
      nextDistanceKm += segmentKm
      nextCoordinates.push(point)
    }
  }

  return {
    ...state,
    coordinates: thinCoordinates(nextCoordinates),
    distanceKm: nextDistanceKm,
    gpsFilter: nextFilter,
    updatedAt: new Date().toISOString(),
  }
}

if (Platform.OS !== 'web' && !TaskManager.isTaskDefined(BACKGROUND_FITNESS_TASK)) {
  TaskManager.defineTask<{ locations?: Location.LocationObject[] }>(BACKGROUND_FITNESS_TASK, async ({ data, error }) => {
    if (error) {
      console.warn('Background fitness task error:', error.message)
      return
    }

    const locations = data?.locations ?? []
    if (locations.length === 0) return

    const state = await readTrackingStateAsync()
    if (!state) return

    const nextState = appendLocations(state, locations)
    const syncedState = await syncDailyStepsForUserAsync(nextState)
    await writeTrackingStateAsync(syncedState)
  })
}

export async function checkBackgroundFitnessPermissionsAsync(): Promise<PermissionState> {
  if (Platform.OS === 'web') {
    return { foreground: false, background: false, motion: false }
  }

  const fg = await Location.getForegroundPermissionsAsync()
  const bg = await Location.getBackgroundPermissionsAsync()

  let motionGranted = true
  try {
    const motion = await Pedometer.getPermissionsAsync()
    motionGranted = motion.granted
  } catch {
    motionGranted = true
  }

  return {
    foreground: fg.granted,
    background: bg.granted,
    motion: motionGranted,
  }
}

export async function requestBackgroundFitnessPermissionsAsync(): Promise<PermissionState> {
  if (Platform.OS === 'web') {
    return { foreground: false, background: false, motion: false }
  }

  const fg = await Location.requestForegroundPermissionsAsync()
  const bg = fg.granted ? await Location.requestBackgroundPermissionsAsync() : await Location.getBackgroundPermissionsAsync()

  let motionGranted = true
  try {
    const motion = await Pedometer.requestPermissionsAsync()
    motionGranted = motion.granted
  } catch {
    motionGranted = true
  }

  return {
    foreground: fg.granted,
    background: bg.granted,
    motion: motionGranted,
  }
}

export async function isBackgroundFitnessTrackingActiveAsync(): Promise<boolean> {
  if (Platform.OS === 'web') return false

  try {
    return await Location.hasStartedLocationUpdatesAsync(BACKGROUND_FITNESS_TASK)
  } catch {
    return false
  }
}

export async function getBackgroundTrackingSnapshotAsync(): Promise<TrackingSnapshot | null> {
  const state = await readTrackingStateAsync()
  if (!state) return null

  return {
    ...state,
    elapsedSeconds: getElapsedSeconds(state.startedAt),
  }
}

export async function clearBackgroundTrackingStateAsync(): Promise<void> {
  await AsyncStorage.removeItem(TRACKING_STATE_KEY)
}

export async function startBackgroundFitnessTrackingAsync(params: {
  userId: string
  activityType: ActivityType
}): Promise<TrackingSnapshot | null> {
  if (Platform.OS === 'web') return null

  const active = await isBackgroundFitnessTrackingActiveAsync()
  const existingState = await readTrackingStateAsync()
  if (existingState?.userId === params.userId && existingState.coordinates.length > 0 && isRecentTrackingState(existingState)) {
    if (!active) {
      await Location.startLocationUpdatesAsync(BACKGROUND_FITNESS_TASK, getLocationUpdateOptions())
    }
    return {
      ...existingState,
      elapsedSeconds: getElapsedSeconds(existingState.startedAt),
    }
  }

  if (active) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_FITNESS_TASK)
  }
  if (existingState && !isRecentTrackingState(existingState)) {
    await clearBackgroundTrackingStateAsync()
  }

  const startedAt = new Date().toISOString()
  let initialCoordinates: TrackingCoordinate[] = []
  let initialFilter: GPSFilterState | null = null

  try {
    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    const accuracy = current.coords.accuracy
    if (accuracy !== null && accuracy <= MAX_GPS_ACCURACY_METERS) {
      const smoothed = smoothLocation(
        current.coords.latitude,
        current.coords.longitude,
        accuracy,
        current.timestamp,
        null
      )
      initialFilter = smoothed.state
      initialCoordinates = [{
        latitude: smoothed.latitude,
        longitude: smoothed.longitude,
        timestamp: current.timestamp,
        accuracy,
      }]
    }
  } catch {
    initialCoordinates = []
  }

  const state: RawTrackingState = {
    userId: params.userId,
    activityType: params.activityType,
    startedAt,
    coordinates: initialCoordinates,
    distanceKm: 0,
    gpsFilter: initialFilter,
    lastStepSyncedAt: 0,
    updatedAt: startedAt,
  }

  await writeTrackingStateAsync(state)
  await Location.startLocationUpdatesAsync(BACKGROUND_FITNESS_TASK, getLocationUpdateOptions())

  return {
    ...state,
    elapsedSeconds: 0,
  }
}

function getLocationUpdateOptions(): Location.LocationTaskOptions {
  return {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10000,
    distanceInterval: 10,
    activityType: Location.ActivityType.Fitness,
    pausesUpdatesAutomatically: true,
    foregroundService: {
      notificationTitle: 'OXZIFIT tracking active',
      notificationBody: 'Route and steps are being collected in background',
      notificationColor: '#f97316',
    },
  }
}

export async function stopBackgroundFitnessTrackingAsync(): Promise<void> {
  if (Platform.OS === 'web') return

  const active = await isBackgroundFitnessTrackingActiveAsync()
  if (!active) return
  await Location.stopLocationUpdatesAsync(BACKGROUND_FITNESS_TASK)
}
