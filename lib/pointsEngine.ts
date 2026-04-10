import { PointsBreakdown } from '../types/database'

export function calculateStepPoints(steps: number): number {
  return Math.floor(steps / 1000)
}

export function calculateWorkoutPoints(workoutCount: number): number {
  return workoutCount * 10
}

export function calculateMealPoints(mealCount: number): number {
  return mealCount * 5
}

export function calculateRoutePoints(km: number): number {
  return Math.floor(km)
}

export function calculateStreakPoints(streakDays: number): number {
  return streakDays * 5
}

export function calculateTotalPoints(params: {
  steps: number
  workouts: number
  meals: number
  km: number
  streakDays: number
}): PointsBreakdown {
  const stepPoints = calculateStepPoints(params.steps)
  const workoutPoints = calculateWorkoutPoints(params.workouts)
  const mealPoints = calculateMealPoints(params.meals)
  const routePoints = calculateRoutePoints(params.km)
  const streakPoints = calculateStreakPoints(params.streakDays)
  return {
    stepPoints,
    workoutPoints,
    mealPoints,
    routePoints,
    streakPoints,
    total: stepPoints + workoutPoints + mealPoints + routePoints + streakPoints,
  }
}
