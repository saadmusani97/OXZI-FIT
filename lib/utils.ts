import { Coordinate } from '../types/database'

export function haversineDistance(a: Coordinate, b: Coordinate): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}

export function calculateRouteDistance(coords: Coordinate[]): number {
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    total += haversineDistance(coords[i - 1], coords[i])
  }
  return total
}

export function calculateStepDistance(steps: number): number {
  return parseFloat((steps * 0.000762).toFixed(6))
}

export function calculateStepCalories(steps: number): number {
  return parseFloat((steps * 0.04).toFixed(2))
}

export function calculatePace(distanceKm: number, elapsedSeconds: number): number {
  if (distanceKm === 0) return 0
  return elapsedSeconds / 60 / distanceKm
}

export function serializeCoordinates(coords: Coordinate[]): string {
  return JSON.stringify(coords)
}

export function deserializeCoordinates(json: string): Coordinate[] {
  return JSON.parse(json) as Coordinate[]
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

export function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}
