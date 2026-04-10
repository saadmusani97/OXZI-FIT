import { supabase } from './supabase'
import type { ActivityType, TrackingCoordinate } from './backgroundFitness'

export interface SavedRoute {
  id: string
  activity_type: ActivityType
  distance_km: number
  duration_seconds: number
  coordinates: {
    lat: number
    lng: number
    timestamp?: number
    speedKmh?: number
    accuracy?: number | null
  }[]
  started_at: string
  ended_at: string
}

export async function fetchRecentRoutes(userId: string, limit = 10): Promise<SavedRoute[]> {
  const { data, error } = await supabase
    .from('routes')
    .select('id, activity_type, distance_km, duration_seconds, coordinates, started_at, ended_at')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return (data as SavedRoute[]) ?? []
}

export async function saveRoute(params: {
  userId: string
  activityType: ActivityType
  distanceKm: number
  durationSeconds: number
  coordinates: TrackingCoordinate[]
  startedAt: string
  endedAt: string
}): Promise<SavedRoute> {
  const { data, error } = await supabase
    .from('routes')
    .insert({
      user_id: params.userId,
      activity_type: params.activityType,
      distance_km: params.distanceKm,
      duration_seconds: params.durationSeconds,
      coordinates: params.coordinates.map(point => ({
        lat: point.latitude,
        lng: point.longitude,
        timestamp: point.timestamp,
        speedKmh: point.speedKmh,
        accuracy: point.accuracy,
      })),
      started_at: params.startedAt,
      ended_at: params.endedAt,
    })
    .select('id, activity_type, distance_km, duration_seconds, coordinates, started_at, ended_at')
    .single()

  if (error) {
    throw error
  }

  return data as SavedRoute
}
