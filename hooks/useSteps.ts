import { useCallback, useEffect, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { Pedometer } from 'expo-sensors'
import { useStepStore } from '../stores/stepStore'
import { useAuthStore } from '../stores/authStore'
import { calculateStepCalories, calculateStepDistance } from '../lib/utils'
import { supabase } from '../lib/supabase'

export type StepStatus = 'loading' | 'unavailable' | 'denied' | 'active'

const STEP_SYNC_INTERVAL_MS = 300000
const STEP_SAVE_INTERVAL_MS = 300000

let runtimeStatus: StepStatus = 'loading'
let syncInFlight: Promise<number | null> | null = null
let pollInterval: ReturnType<typeof setInterval> | null = null
let appStateSubscription: { remove: () => void } | null = null
let runtimeStarted = false
let runtimeStartPromise: Promise<void> | null = null
let lastSavedAt = 0
let lastSavedSteps: number | null = null
const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach(listener => listener())
}

function setRuntimeStatus(status: StepStatus) {
  runtimeStatus = status
  notifyListeners()
}

function getUserId() {
  return useAuthStore.getState().session?.user?.id ?? null
}

function getDailyGoal() {
  return useAuthStore.getState().profile?.daily_step_goal ?? 10000
}

function commitSteps(steps: number) {
  const normalizedSteps = Math.max(0, Math.floor(steps))
  const { setSteps, setGoalReached } = useStepStore.getState()
  setSteps(normalizedSteps)
  setGoalReached(normalizedSteps >= getDailyGoal())
  notifyListeners()
  return normalizedSteps
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

async function syncTodaySteps(forceSave = false): Promise<number | null> {
  if (syncInFlight) return syncInFlight

  syncInFlight = (async () => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)

    try {
      const { steps } = await Pedometer.getStepCountAsync(startOfDay, now)
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

async function ensurePermissionsAndSync() {
  setRuntimeStatus('loading')

  try {
    const available = await Pedometer.isAvailableAsync()
    if (!available) {
      setRuntimeStatus('unavailable')
      return false
    }

    const { granted } = await Pedometer.requestPermissionsAsync()
    if (!granted) {
      setRuntimeStatus('denied')
      const savedSteps = await loadSavedSteps()
      if (savedSteps === null) {
        commitSteps(0)
      }
      return false
    }

    setRuntimeStatus('active')
    const steps = await syncTodaySteps(true)
    if (steps === null) {
      const savedSteps = await loadSavedSteps()
      if (savedSteps === null) {
        commitSteps(0)
      }
    }
    return true
  } catch (error) {
    console.warn('Step permission error:', error)
    setRuntimeStatus('unavailable')
    const savedSteps = await loadSavedSteps()
    if (savedSteps === null) {
      commitSteps(0)
    }
    return false
  }
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

function startPolling() {
  if (pollInterval || runtimeStatus !== 'active') return

  pollInterval = setInterval(() => {
    void syncTodaySteps()
  }, STEP_SYNC_INTERVAL_MS)
}

async function handleAppStateChange(nextState: AppStateStatus) {
  if (nextState !== 'active') return

  const isReady = await ensurePermissionsAndSync()
  if (isReady) {
    startPolling()
  } else {
    stopPolling()
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

  if (runtimeStartPromise) return runtimeStartPromise

  runtimeStartPromise = (async () => {
    if (!appStateSubscription) {
      appStateSubscription = AppState.addEventListener('change', state => {
        void handleAppStateChange(state)
      })
    }

    const isReady = await ensurePermissionsAndSync()
    if (isReady) {
      startPolling()
    } else {
      stopPolling()
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

export function resetStepRuntime() {
  stopPolling()
  appStateSubscription?.remove()
  appStateSubscription = null
  runtimeStarted = false
  runtimeStartPromise = null
  syncInFlight = null
  lastSavedAt = 0
  lastSavedSteps = null
  runtimeStatus = 'loading'
  useStepStore.getState().setSteps(0)
  useStepStore.getState().setGoalReached(false)
  notifyListeners()
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
      startPolling()
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
