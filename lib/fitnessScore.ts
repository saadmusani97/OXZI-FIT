import { FitnessScoreBreakdown } from '../types/database'

interface ScoreParams {
  workoutPts: number
  stepsPts: number
  mealPts: number
  routePts: number
}

export function calculateFitnessScore(params: ScoreParams): FitnessScoreBreakdown {
  const { workoutPts, stepsPts, mealPts, routePts } = params
  const raw = 300 + workoutPts * 0.4 + stepsPts * 0.3 + mealPts * 0.2 + routePts * 0.1
  const total = Math.min(850, Math.max(300, Math.round(raw)))
  return {
    total,
    workoutComponent: Math.round(workoutPts * 0.4),
    stepsComponent: Math.round(stepsPts * 0.3),
    mealComponent: Math.round(mealPts * 0.2),
    routeComponent: Math.round(routePts * 0.1),
  }
}
