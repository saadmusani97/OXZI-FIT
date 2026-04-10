import { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { useRouter, Redirect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import ViewShot, { captureRef } from 'react-native-view-shot'
import { BlurView } from 'expo-blur'
import ActivityShareCard from '../components/tracking/ActivityShareCard'
import { useActivityShareStore } from '../stores/activityShareStore'
import { shareImage } from '../lib/socialShare'

export default function ActivityShareCardScreen() {
  const router = useRouter()
  const cardRef = useRef<View>(null)
  const { summary } = useActivityShareStore()
  const [sharing, setSharing] = useState(false)

  if (!summary) {
    return <Redirect href="/(tabs)/track" />
  }

  async function handleShare(target: 'instagram' | 'whatsapp' | 'system') {
    try {
      setSharing(true)
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
      })
      await shareImage(uri, target)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to share the card.'
      Alert.alert('Share error', message)
    } finally {
      setSharing(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 64, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.82}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>Share Card</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        <ViewShot style={{ borderRadius: 28 }} options={{ format: 'png', quality: 1 }}>
          <View ref={cardRef} collapsable={false}>
            <ActivityShareCard summary={summary} />
          </View>
        </ViewShot>

        <BlurView intensity={22} tint="dark" style={{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginTop: 18 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: 16, gap: 12 }}>
            <ActionButton label={sharing ? 'Sharing...' : 'Instagram Stories'} icon="logo-instagram" onPress={() => handleShare('instagram')} disabled={sharing} primary />
            <ActionButton label={sharing ? 'Sharing...' : 'WhatsApp'} icon="logo-whatsapp" onPress={() => handleShare('whatsapp')} disabled={sharing} />
            <ActionButton label={sharing ? 'Sharing...' : 'More Options'} icon="share-social-outline" onPress={() => handleShare('system')} disabled={sharing} />
          </View>
        </BlurView>
      </ScrollView>
    </View>
  )
}

function ActionButton({
  label,
  icon,
  onPress,
  disabled,
  primary,
}: {
  label: string
  icon: React.ComponentProps<typeof Ionicons>['name']
  onPress: () => void
  disabled?: boolean
  primary?: boolean
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.82}
      style={{
        borderRadius: 18,
        paddingVertical: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: primary ? '#f97316' : 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: primary ? '#fb923c' : 'rgba(255,255,255,0.1)',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{label}</Text>
    </TouchableOpacity>
  )
}
