import { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { BlurView } from 'expo-blur'
import { captureRef } from 'react-native-view-shot'
import { useActivityShareStore } from '../stores/activityShareStore'
import { formatDistance, formatPace } from '../lib/routeMetrics'
import { formatDuration } from '../lib/utils'
import { shareImage } from '../lib/socialShare'

export default function ActivityARScreen() {
  const router = useRouter()
  const [permission, requestPermission] = useCameraPermissions()
  const [sharing, setSharing] = useState(false)
  const captureViewRef = useRef<View>(null)
  const { summary } = useActivityShareStore()

  if (!summary) {
    return <Redirect href="/(tabs)/track" />
  }

  async function handleCapture() {
    if (!permission?.granted) {
      const result = await requestPermission()
      if (!result.granted) {
        Alert.alert('Camera required', 'Camera access is needed for the overlay mode.')
        return
      }
    }

    try {
      setSharing(true)
      const uri = await captureRef(captureViewRef, {
        format: 'png',
        quality: 1,
      })
      await shareImage(uri, 'system')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to capture the overlay.'
      Alert.alert('Capture error', message)
    } finally {
      setSharing(false)
    }
  }

  return (
    <View ref={captureViewRef} collapsable={false} style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView style={{ flex: 1 }} facing="back" />

      <View style={{ position: 'absolute', top: 64, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.82}>
          <BlurView intensity={20} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
            <View style={{ padding: 10 }}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </View>
          </BlurView>
        </TouchableOpacity>

        <BlurView intensity={20} tint="dark" style={{ borderRadius: 18, overflow: 'hidden' }}>
          <View style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>
              AR Overlay
            </Text>
          </View>
        </BlurView>
      </View>

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 42, gap: 16 }}>
        <BlurView intensity={22} tint="dark" style={{ borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <View style={{ backgroundColor: 'rgba(0,0,0,0.45)', padding: 18, gap: 14 }}>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
              {summary.activityType}
            </Text>
            <Text style={{ color: '#fff', fontSize: 30, fontWeight: '900' }}>{formatDistance(summary.distanceKm)}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <OverlayMetric label="Pace" value={formatPace(summary.paceMinPerKm)} />
              <OverlayMetric label="Time" value={formatDuration(summary.durationSeconds)} />
              <OverlayMetric label="Speed" value={`${summary.averageSpeedKmh.toFixed(1)} km/h`} />
            </View>
          </View>
        </BlurView>

        <TouchableOpacity
          onPress={handleCapture}
          disabled={sharing}
          activeOpacity={0.82}
          style={{ backgroundColor: '#f97316', borderRadius: 22, paddingVertical: 18, alignItems: 'center', opacity: sharing ? 0.55 : 1 }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>
            {sharing ? 'Capturing...' : 'Capture Overlay'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function OverlayMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 12, gap: 8 }}>
      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Text>
      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{value}</Text>
    </View>
  )
}
