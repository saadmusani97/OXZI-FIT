import { useEffect, useState, useCallback } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { Pedometer } from 'expo-sensors'
import { useStepStore } from '../stores/stepStore'
import { useAuthStore } from '../stores/authStore'
import { calculateStepDistance, calculateStepCalories } from '../lib/utils'
import { supabase } from '../lib/supabase'

export type StepStatus = 'loading' | 'unavailable' | 'denied' | 'active'

const LIVE_STEP_CONFIRMATION_COUNT = 3
const MIN_LIVE_STEPS_PER_MINUTE = 40
const MAX_LIVE_STEPS_PER_MINUTE = 220
const STEP_SYNC_INTERVAL_MS = 15000
const STEP_SAVE_INTERVAL_MS = 30000

let runtimeStatus: StepStatus = 'loading'
let liveSteps = 0
let watchStepCount = 0 as number | null
let watchStepCountAt = 0
let lastSyncAt = 0
let syncInFlight: Promise<number | null> | null = null
let lastSavedAt = 0
let lastSavedSteps: number | null = null
let liveStepHandling = false
let pendingLiveSteps: number | null = null
let pedometerSubscription: { remove: () => void } | null = null
let syncInterval: ReturnType<typeof setInterval> | null = null
let appStateSubscription: { remove: () => void } | null = null
let runtimeStarted = false
let runtimeStartPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach(listener => listener())
}

function setRuntimeStatus(status: StepStatus) {
  runtimeStatus = status
  notifyListeners()
}

function getDailyGoal() {
  return useAuthStore.getState().profile?.daily_step_goal ?? 10000
}

function getUserId() {
  return useAuthStore.getState().session?.user?.id ?? null
}

function commitSteps(steps: number) {
  const normalizedSteps = Math.max(0, Math.floor(steps))
  liveSteps = normalizedSteps
  const { setSteps, setGoalReached } = useStepStore.getState()
  setSteps(normalizedSteps)
  setGoalReached(normalizedSteps >= getDailyGoal())
  notifyListeners()
  return normalizedSteps
}

function isReasonableStepCadence(stepDelta: number, elapsedMs: number) {
  if (stepDelta <= 0 || elapsedMs <= 0) return false
  const stepsPerMinute = stepDelta / (elapsedMs / 60000)
  return stepsPerMinute >= MIN_LIVE_STEPS_PER_MINUTE && stepsPerMinute <= MAX_LIVE_STEPS_PER_MINUTE
}

async function saveSteps(steps: number, force = false) {
  const userId = getUserId()
  if (!userId) return false

  const now = Date.now()
  if (!force && lastSavedSteps === steps) return true
  if (!force && now - lastSavedAt < STEP_SAVE_INTERVAL_MS) return true

  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase.from('daily_steps').upsert(
    {
      user_id: userId,
      date: today,
      steps,
      distance_km: calculateStepDistance(steps),
      calories_burned: calculateStepCalories(steps),
    },
    { onConflict: 'user_id,date' }
  )

  if (error) {
    console.warn('Step save error:', error.message)
    return false
  }

  lastSavedAt = now
  lastSavedSteps = steps
  return true
}

async function syncTodaySteps(forceSave = true): Promise<number | null> {
  if (syncInFlight) {
    return syncInFlight
  }

  syncInFlight = (async () => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    try {
      const { steps } = await Pedometer.getStepCountAsync(startOfDay, now)
      lastSyncAt = Date.now()
      const committedSteps = commitSteps(steps)
      await saveSteps(committedSteps, forceSave)
      return committedSteps
    } catch (error) {
      console.warn('Step fetch error:', error)
      return null
    } finally {
      syncInFlight = null
    }
  })()

  return syncInFlight
}

async function loadSavedSteps() {
  const userId = getUserId()
  if (!userId) return null

  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('daily_steps')
    .select('steps')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()

  if (error) {
    console.warn('Stored step fetch error:', error.message)
    return null
  }

  if (!data) return null
  return commitSteps(data.steps)
}

async function ensurePermissionsAndSync() {
  setRuntimeStatus('loading')

  const { granted } = await Pedometer.requestPermissionsAsync()
  if (!granted) {
    setRuntimeStatus('denied')
    return false
  }

  const available = await Pedometer.isAvailableAsync()
  if (!available) {
    setRuntimeStatus('unavailable')
    return false
  }

  setRuntimeStatus('active')
  const steps = await syncTodaySteps()
  if (steps === null) {
    const savedSteps = await loadSavedSteps()
    if (savedSteps === null) {
      commitSteps(liveSteps)
    }
  }
  return true
}

async function processLiveStepCount(steps: number) {
  const rawSteps = Math.max(0, Math.floor(steps))
  const now = Date.now()

  if (watchStepCount === null || rawSteps <= watchStepCount) {
    watchStepCount = rawSteps
    watchStepCountAt = now
    return
  }

  const stepDelta = rawSteps - watchStepCount
  const elapsedMs = now - watchStepCountAt

  if (stepDelta < LIVE_STEP_CONFIRMATION_COUNT) {
    if (elapsedMs >= (LIVE_STEP_CONFIRMATION_COUNT / MIN_LIVE_STEPS_PER_MINUTE) * 60000) {
      watchStepCount = rawSteps
      watchStepCountAt = now
    }
    return
  }

  if (!isReasonableStepCadence(stepDelta, elapsedMs)) {
    watchStepCount = rawSteps
    watchStepCountAt = now
    return
  }

  const nextSteps = commitSteps(liveSteps + stepDelta)
  watchStepCount = rawSteps
  watchStepCountAt = now
  await saveSteps(nextSteps)

  if (now - lastSyncAt >= STEP_SYNC_INTERVAL_MS) {
    await syncTodaySteps(false)
  }
}

async function handleLiveStepCount(steps: number) {
  pendingLiveSteps = steps
  if (liveStepHandling) return

  liveStepHandling = true
  try {
    while (pendingLiveSteps !== null) {
      const nextSteps = pendingLiveSteps
      pendingLiveSteps = null
      await processLiveStepCount(nextSteps)
    }
  } finally {
    liveStepHandling = false
  }
}

function resetLiveWatcherState() {
  watchStepCount = null
  watchStepCountAt = 0
}

function stopLiveTracking() {
  pedometerSubscription?.remove()
  pedometerSubscription = null
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}

function startLiveTracking() {
  if (pedometerSubscription || runtimeStatus !== 'active') return

  resetLiveWatcherState()
  pedometerSubscription = Pedometer.watchStepCount(result => {
    void handleLiveStepCount(result.steps)
  })
  syncInterval = setInterval(() => {
    void syncTodaySteps(false)
  }, STEP_SYNC_INTERVAL_MS)
}

async function handleAppStateChange(nextState: AppStateStatus) {
  if (nextState !== 'active') return

  const isReady = await ensurePermissionsAndSync()
  if (isReady) {
    startLiveTracking()
  }
}

async function ensureRuntimeStarted() {
  if (runtimeStarted) {
    if (!appStateSubscription) {
      appStateSubscription = AppState.addEventListener('change', state => {
        void handleAppStateChange(state)
      })
    }
    return
  }

  if (runtimeStartPromise) {
    return runtimeStartPromise
  }

  runtimeStartPromise = (async () => {
    if (!appStateSubscription) {
      appStateSubscription = AppState.addEventListener('change', state => {
        void handleAppStateChange(state)
      })
    }

    const isReady = await ensurePermissionsAndSync()
    if (isReady) {
      startLiveTracking()
    } else {
      stopLiveTracking()
    }

    runtimeStarted = true
    runtimeStartPromise = null
  })()

  return runtimeStartPromise
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useSteps() {
  const { todaySteps, goalReached } = useStepStore()
  const { profile, session } = useAuthStore()
  const [status, setStatus] = useState<StepStatus>(runtimeStatus)

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setStatus(runtimeStatus)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    const dailyGoal = profile?.daily_step_goal ?? 10000
    useStepStore.getState().setGoalReached(useStepStore.getState().todaySteps >= dailyGoal)
  }, [profile?.daily_step_goal])

  useEffect(() => {
    if (!session?.user?.id) return
    void ensureRuntimeStarted()
  }, [session?.user?.id])

  const refresh = useCallback(async () => {
    const isReady = await ensurePermissionsAndSync()
    if (isReady) {
      startLiveTracking()
    }
    return isReady
  }, [])

  const dailyGoal = profile?.daily_step_goal ?? 10000

  return {
    steps: todaySteps,
    goalReached,
    distanceKm: calculateStepDistance(todaySteps),
    caloriesBurned: calculateStepCalories(todaySteps),
    dailyGoal,
    progress: Math.min(todaySteps / dailyGoal, 1),
    status,
    refresh,
  }
}
