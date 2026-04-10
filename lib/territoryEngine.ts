import * as turf from '@turf/turf'
import { Coordinate, GeoJSONPolygon } from '../types/database'

export function computeConvexHull(coords: Coordinate[]): GeoJSONPolygon | null {
  if (coords.length < 3) return null
  const points = turf.featureCollection(
    coords.map(c => turf.point([c.lng, c.lat]))
  )
  const hull = turf.convex(points)
  if (!hull) return null
  return hull.geometry as GeoJSONPolygon
}

export function computeAreaSqKm(polygon: GeoJSONPolygon): number {
  const feature = turf.feature(polygon)
  const areaSqMeters = turf.area(feature)
  return areaSqMeters / 1_000_000
}

export function computeTerritoryOpacity(visitCount: number): number {
  return Math.min(0.1 + (visitCount - 1) * 0.1, 0.8)
}

export function serializePolygon(polygon: GeoJSONPolygon): string {
  return JSON.stringify(polygon)
}

export function deserializePolygon(json: string): GeoJSONPolygon {
  return JSON.parse(json) as GeoJSONPolygon
}
