import { DailySteps, Profile } from '../types/database'
import { supabase } from './supabase'

export interface StepSummaryDay {
  date: string
  label: string
  steps: number
  goalReached: boolean
  progress: number
}

export interface StepInsights {
  currentStreak: number
  weekSteps: number
  weekAverage: number
  monthSteps: number
  activeDaysThisMonth: number
  bestDaySteps: number
  recentDays: StepSummaryDay[]
}

type StepRow = Pick<DailySteps, 'date' | 'steps'>

const DAY_MS = 24 * 60 * 60 * 1000

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function shiftDateKey(dateKey: string, dayOffset: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  return getDateKey(new Date(date.getTime() + dayOffset * DAY_MS))
}

function getRecentDateKeys(days: number, todayKey = getDateKey(new Date())): string[] {
  return Array.from({ length: days }, (_, index) => shiftDateKey(todayKey, index - days + 1))
}

function getDayLabel(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)
}

export function calculateCurrentStepStreak(rows: StepRow[], dailyGoal: number, todayKey = getDateKey(new Date())): number {
  const stepsByDate = new Map(rows.map(row => [row.date, row.steps]))
  let cursor = (stepsByDate.get(todayKey) ?? 0) >= dailyGoal ? todayKey : shiftDateKey(todayKey, -1)
  let streak = 0

  while ((stepsByDate.get(cursor) ?? 0) >= dailyGoal) {
    streak += 1
    cursor = shiftDateKey(cursor, -1)
  }

  return streak
}

export function buildStepInsights(rows: StepRow[], dailyGoal: number, todayKey = getDateKey(new Date())): StepInsights {
  const stepsByDate = new Map(rows.map(row => [row.date, row.steps]))
  const weekKeys = getRecentDateKeys(7, todayKey)
  const monthKey = todayKey.slice(0, 7)
  const monthRows = rows.filter(row => row.date.startsWith(monthKey))
  const recentDays = weekKeys.map(date => {
    const steps = stepsByDate.get(date) ?? 0
    return {
      date,
      label: getDayLabel(date),
      steps,
      goalReached: steps >= dailyGoal,
      progress: Math.min(steps / dailyGoal, 1),
    }
  })
  const weekSteps = recentDays.reduce((sum, day) => sum + day.steps, 0)
  const monthSteps = monthRows.reduce((sum, day) => sum + day.steps, 0)
  const bestDaySteps = monthRows.reduce((best, day) => Math.max(best, day.steps), 0)
  const activeDaysThisMonth = monthRows.filter(day => day.steps > 0).length

  return {
    currentStreak: calculateCurrentStepStreak(rows, dailyGoal, todayKey),
    weekSteps,
    weekAverage: Math.round(weekSteps / 7),
    monthSteps,
    activeDaysThisMonth,
    bestDaySteps,
    recentDays,
  }
}

export async function fetchStepInsights(userId: string, dailyGoal: number): Promise<StepInsights> {
  const todayKey = getDateKey(new Date())
  const since = shiftDateKey(todayKey, -90)
  const { data, error } = await supabase
    .from('daily_steps')
    .select('date, steps')
    .eq('user_id', userId)
    .gte('date', since)
    .order('date', { ascending: true })

  if (error) {
    console.warn('Step insights fetch error:', error.message)
    return buildStepInsights([], dailyGoal, todayKey)
  }

  return buildStepInsights((data ?? []) as StepRow[], dailyGoal, todayKey)
}

export async function updateProfileStepStreak(userId: string, currentStreak: number): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ streak_count: currentStreak })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) {
    console.warn('Step streak update error:', error.message)
    return null
  }

  return data as Profile
}
