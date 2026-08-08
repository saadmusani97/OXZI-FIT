import { View, Text } from 'react-native'
import type { ActivitySummary } from '../../lib/routeMetrics'
import { formatDistance, formatPace, formatSpeed } from '../../lib/routeMetrics'
import { formatDuration } from '../../lib/utils'
import RouteShape from './RouteShape'

interface ActivityShareCardProps {
  summary: ActivitySummary
}

export default function ActivityShareCard({ summary }: ActivityShareCardProps) {
  return (
    <View
      style={{
        backgroundColor: '#050505',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 24,
        gap: 24,
      }}
    >
      <View style={{ gap: 8 }}>
        <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
          Synra {summary.activityType}
        </Text>
        <Text style={{ color: '#fff', fontSize: 32, fontWeight: '900' }}>
          {formatDistance(summary.distanceKm)}
        </Text>
      </View>

      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}>
        <RouteShape coordinates={summary.coordinates} />
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <StatBlock label="Pace" value={formatPace(summary.paceMinPerKm)} />
        <StatBlock label="Time" value={formatDuration(summary.durationSeconds)} />
        <StatBlock label="Speed" value={formatSpeed(summary.averageSpeedKmh)} />
      </View>
    </View>
  )
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 18,
        paddingVertical: 16,
        paddingHorizontal: 14,
        gap: 8,
      }}
    >
      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </Text>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
        {value}
      </Text>
    </View>
  )
}
