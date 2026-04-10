import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import OSMMap from '../components/tracking/OSMMap'
import { useActivityShareStore } from '../stores/activityShareStore'
import { formatDuration } from '../lib/utils'
import { formatDistance, formatElevation, formatPace, formatSpeed, getRouteCenter } from '../lib/routeMetrics'

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <BlurView intensity={20} tint="dark" style={{ flex: 1, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
      <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: 16, gap: 8 }}>
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Text>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>{value}</Text>
      </View>
    </BlurView>
  )
}

export default function ActivitySummaryScreen() {
  const router = useRouter()
  const { summary } = useActivityShareStore()

  if (!summary) {
    return <Redirect href="/(tabs)/track" />
  }

  const center = getRouteCenter(summary.coordinates)
  const mapRoute = summary.coordinates.map(point => ({
    latitude: point.latitude,
    longitude: point.longitude,
    timestamp: point.timestamp,
    speedKmh: point.speedKmh,
  }))

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 64, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.82}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>Activity Summary</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        <BlurView intensity={22} tint="dark" style={{ borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 18 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: 20, gap: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
              {summary.activityType}
            </Text>
            <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900' }}>{formatDistance(summary.distanceKm)}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              {new Date(summary.startedAt).toLocaleString()}
            </Text>
          </View>
        </BlurView>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <MetricCard label="Distance" value={formatDistance(summary.distanceKm)} />
          <MetricCard label="Elevation Gain" value={formatElevation(summary.elevationGainM)} />
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <MetricCard label="Moving Time" value={formatDuration(summary.movingTimeSeconds)} />
          <MetricCard label="Avg Speed" value={formatSpeed(summary.averageSpeedKmh)} />
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
          <MetricCard label="Max Elevation" value={formatElevation(summary.maxElevationM)} />
          <MetricCard label="Max Speed" value={formatSpeed(summary.maxSpeedKmh)} />
        </View>

        <BlurView intensity={20} tint="dark" style={{ borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 18 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', padding: 16 }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 12 }}>Route Preview</Text>
            <View style={{ height: 260, borderRadius: 20, overflow: 'hidden' }}>
              <OSMMap center={center} route={mapRoute} mapType="standard" showPointsOfInterest />
            </View>
          </View>
        </BlurView>

        <BlurView intensity={20} tint="dark" style={{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: 16, gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.push('/activity-share-card' as never)}
              activeOpacity={0.82}
              style={{ backgroundColor: '#f97316', borderRadius: 18, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>
                Share Card
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/activity-ar' as never)}
              activeOpacity={0.82}
              style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 18, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                Open Camera Overlay
              </Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center', paddingTop: 4 }}>
              <Text style={{ color: 'rgba(255,255,255,0.42)', fontSize: 12 }}>
                Pace: {formatPace(summary.paceMinPerKm)}
              </Text>
            </View>
          </View>
        </BlurView>
      </ScrollView>
    </View>
  )
}
