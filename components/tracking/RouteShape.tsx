import Svg, { Path } from 'react-native-svg'
import type { TrackingCoordinate } from '../../lib/backgroundFitness'
import { buildRouteShapePath } from '../../lib/routeMetrics'

interface RouteShapeProps {
  coordinates: TrackingCoordinate[]
  width?: number
  height?: number
  stroke?: string
  strokeWidth?: number
}

export default function RouteShape({
  coordinates,
  width = 320,
  height = 320,
  stroke = '#f97316',
  strokeWidth = 4,
}: RouteShapeProps) {
  let path = ''

  try {
    path = buildRouteShapePath(coordinates, width, height, 24)
  } catch {
    return null
  }

  if (!path) {
    return null
  }

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Path d={path} stroke="rgba(249,115,22,0.22)" strokeWidth={strokeWidth * 3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={path} stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
