import type { ActivityType, TrackingCoordinate } from './backgroundFitness'

export interface ActivitySummary {
  routeId?: string
  activityType: ActivityType
  startedAt: string
  endedAt: string
  distanceKm: number
  durationSeconds: number
  movingTimeSeconds: number
  averageSpeedKmh: number
  maxSpeedKmh: number
  paceMinPerKm: number
  elevationGainM: number
  maxElevationM: number | null
  coordinates: TrackingCoordinate[]
}

interface RoutePointLike {
  lat: number
  lng: number
  timestamp?: number
  speedKmh?: number
  accuracy?: number | null
}

export function formatDistance(distanceKm: number): string {
  return `${distanceKm.toFixed(2)} km`
}

export function formatSpeed(speedKmh: number): string {
  return `${speedKmh.toFixed(1)} km/h`
}

export function formatPace(paceMinPerKm: number): string {
  if (!Number.isFinite(paceMinPerKm) || paceMinPerKm <= 0) return '--'

  const minutes = Math.floor(paceMinPerKm)
  const seconds = Math.round((paceMinPerKm - minutes) * 60)
  const normalizedMinutes = seconds === 60 ? minutes + 1 : minutes
  const normalizedSeconds = seconds === 60 ? 0 : seconds

  return `${normalizedMinutes}:${String(normalizedSeconds).padStart(2, '0')} /km`
}

export function formatElevation(meters: number | null): string {
  if (meters === null || !Number.isFinite(meters)) return '--'
  return `${Math.round(meters)} m`
}

export function getAverageSpeed(distanceKm: number, durationSeconds: number): number {
  if (distanceKm <= 0 || durationSeconds <= 0) return 0
  return distanceKm / (durationSeconds / 3600)
}

export function getPace(distanceKm: number, durationSeconds: number): number {
  if (distanceKm <= 0 || durationSeconds <= 0) return 0
  return durationSeconds / 60 / distanceKm
}

export function getRouteCenter(coordinates: TrackingCoordinate[]): TrackingCoordinate {
  const fallback = coordinates[coordinates.length - 1] ?? { latitude: 37.7749, longitude: -122.4194, timestamp: Date.now() }
  if (coordinates.length === 0) return fallback

  const bounds = coordinates.reduce(
    (acc, point) => ({
      minLat: Math.min(acc.minLat, point.latitude),
      maxLat: Math.max(acc.maxLat, point.latitude),
      minLng: Math.min(acc.minLng, point.longitude),
      maxLng: Math.max(acc.maxLng, point.longitude),
    }),
    {
      minLat: coordinates[0].latitude,
      maxLat: coordinates[0].latitude,
      minLng: coordinates[0].longitude,
      maxLng: coordinates[0].longitude,
    }
  )

  return {
    latitude: (bounds.minLat + bounds.maxLat) / 2,
    longitude: (bounds.minLng + bounds.maxLng) / 2,
    timestamp: fallback.timestamp,
  }
}

export function toTrackingCoordinates(points: RoutePointLike[]): TrackingCoordinate[] {
  return points.map((point, index) => ({
    latitude: point.lat,
    longitude: point.lng,
    timestamp: point.timestamp ?? index,
    speedKmh: point.speedKmh,
    accuracy: point.accuracy,
  }))
}

export function buildRouteShapePath(
  coordinates: TrackingCoordinate[],
  width = 320,
  height = 320,
  padding = 24
): string {
  if (coordinates.length < 2) return ''

  const lats = coordinates.map(point => point.latitude)
  const lngs = coordinates.map(point => point.longitude)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const latRange = maxLat - minLat || 0.0001
  const lngRange = maxLng - minLng || 0.0001
  const scale = Math.min((width - padding * 2) / lngRange, (height - padding * 2) / latRange)
  const offsetX = (width - lngRange * scale) / 2
  const offsetY = (height - latRange * scale) / 2

  return coordinates
    .map((point, index) => {
      const x = offsetX + (point.longitude - minLng) * scale
      const y = offsetY + (maxLat - point.latitude) * scale
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

export function deriveActivitySummary(params: {
  routeId?: string
  activityType: ActivityType
  startedAt: string
  endedAt: string
  distanceKm: number
  durationSeconds: number
  coordinates: TrackingCoordinate[]
}): ActivitySummary {
  const { coordinates, distanceKm, durationSeconds } = params
  const maxSpeedKmh = coordinates.reduce((max, point, index) => {
    if (typeof point.speedKmh === 'number' && Number.isFinite(point.speedKmh)) {
      return Math.max(max, point.speedKmh)
    }

    const previous = coordinates[index - 1]
    if (!previous) return max

    const elapsedSeconds = Math.max(0, (point.timestamp - previous.timestamp) / 1000)
    if (elapsedSeconds === 0) return max

    const segmentDistanceKm = haversineDistanceKm(previous, point)
    return Math.max(max, segmentDistanceKm / (elapsedSeconds / 3600))
  }, 0)

  const movingTimeSeconds = coordinates.reduce((total, point, index) => {
    if (index === 0) return total
    const previous = coordinates[index - 1]
    const elapsedSeconds = Math.max(0, (point.timestamp - previous.timestamp) / 1000)
    const speedKmh = point.speedKmh ?? (elapsedSeconds > 0 ? haversineDistanceKm(previous, point) / (elapsedSeconds / 3600) : 0)
    if (speedKmh < 0.75) return total
    return total + elapsedSeconds
  }, 0)

  return {
    routeId: params.routeId,
    activityType: params.activityType,
    startedAt: params.startedAt,
    endedAt: params.endedAt,
    distanceKm,
    durationSeconds,
    movingTimeSeconds: movingTimeSeconds || durationSeconds,
    averageSpeedKmh: getAverageSpeed(distanceKm, durationSeconds),
    maxSpeedKmh,
    paceMinPerKm: getPace(distanceKm, durationSeconds),
    elevationGainM: 0,
    maxElevationM: null,
    coordinates,
  }
}

function haversineDistanceKm(a: TrackingCoordinate, b: TrackingCoordinate): number {
  const R = 6371
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180
  const lat1 = (a.latitude * Math.PI) / 180
  const lat2 = (b.latitude * Math.PI) / 180
  const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}
