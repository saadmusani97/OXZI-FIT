export interface Profile {
  id: string
  full_name: string | null
  age: number | null
  gender: string | null
  height_cm: number | null
  weight_kg: number | null
  fitness_goal: 'lose_weight' | 'gain_muscle' | 'maintain_weight' | 'improve_endurance' | null
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active' | null
  dietary_preference: string | null
  daily_step_goal: number
  daily_calorie_goal: number
  streak_count: number
  streak_shield: boolean
  onboarding_completed: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Workout {
  id: string
  user_id: string
  exercise_id: string
  exercise_name: string
  sets: number | null
  reps: number | null
  weight_kg: number | null
  duration_seconds: number | null
  completed_at: string
  created_at: string
}

export interface Meal {
  id: string
  user_id: string
  food_name: string
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  fiber_g: number | null
  portion_size: string | null
  image_url: string | null
  ai_confidence: number | null
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null
  logged_at: string
  created_at: string
}

export interface Route {
  id: string
  user_id: string
  activity_type: 'run' | 'walk' | 'cycle'
  distance_km: number
  duration_seconds: number
  coordinates: Coordinate[]
  started_at: string
  ended_at: string
  created_at: string
}

export interface DailySteps {
  id: string
  user_id: string
  date: string
  steps: number
  distance_km: number | null
  calories_burned: number | null
  created_at: string
}

export interface LeaderboardEntry {
  id: string
  user_id: string
  month: string
  total_points: number
  step_points: number
  workout_points: number
  meal_points: number
  route_points: number
  streak_points: number
  updated_at: string
}

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  requirement_type: string
  requirement_value: number
  points_reward: number
  icon: string | null
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
}

export interface TerritoryClaim {
  id: string
  user_id: string
  route_id: string | null
  polygon: GeoJSONPolygon
  area_sq_meters: number | null
  visit_count: number
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface FitnessScore {
  id: string
  user_id: string
  score: number
  date: string
  created_at: string
}

export interface StreakFreeze {
  id: string
  user_id: string
  used: boolean
  created_at: string
}

export interface ActivityFeed {
  id: string
  user_id: string
  event_type: string
  payload: Record<string, unknown>
  created_at: string
}

export interface Coordinate {
  lat: number
  lng: number
  timestamp: number
}

export interface GeoJSONPolygon {
  type: 'Polygon'
  coordinates: number[][][]
}

export interface NutritionScanResult {
  food_name: string
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  fiber_g: number
  portion_size: string
  confidence: number
}

export type MealGrade = 'A+' | 'A' | 'B' | 'C' | 'D'

export interface MealGradeResult {
  grade: MealGrade
  proteinRatio: number
  fatRatio: number
}

export interface TerritoryRenderData {
  polygon: Coordinate[]
  opacity: number
  isOwn: boolean
  isFriend: boolean
}

export interface FitnessScoreBreakdown {
  total: number
  workoutComponent: number
  stepsComponent: number
  mealComponent: number
  routeComponent: number
}

export interface ReportCardData {
  weekStart: string
  weekEnd: string
  totalSteps: number
  totalCalories: number
  workoutsCompleted: number
  totalKm: number
  currentStreak: number
  fitnessScore: number
  musclesTrainedThisWeek: string[]
}

export interface PointsBreakdown {
  stepPoints: number
  workoutPoints: number
  mealPoints: number
  routePoints: number
  streakPoints: number
  total: number
}
