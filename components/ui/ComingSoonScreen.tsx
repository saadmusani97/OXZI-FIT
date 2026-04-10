import { View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

export default function ComingSoonScreen({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: IoniconName
}) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff7f0' }}>
      <LinearGradient colors={['#fffdf9', '#fff4ea', '#fff0e0']} style={{ position: 'absolute', inset: 0 }} />
      <View style={{ position: 'absolute', top: -70, right: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(249,115,22,0.12)' }} />
      <View style={{ position: 'absolute', bottom: -90, left: -50, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(251,146,60,0.12)' }} />

      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20 }}>
        <View style={{ paddingTop: 10 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.84}
            style={{ alignSelf: 'flex-start' }}
          >
            <BlurView intensity={40} tint="light" style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.75)' }}>
              <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.55)' }}>
                <Ionicons name="chevron-back" size={22} color="#ea580c" />
              </View>
            </BlurView>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <BlurView intensity={55} tint="light" style={{ borderRadius: 36, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', width: '100%' }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.58)', padding: 28, alignItems: 'center' }}>
              <View style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: 'rgba(249,115,22,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Ionicons name={icon} size={34} color="#f97316" />
              </View>
              <Text style={{ color: '#111827', fontSize: 28, fontWeight: '900', textAlign: 'center' }}>{title}</Text>
              <Text style={{ color: '#7c2d12', fontSize: 15, lineHeight: 22, marginTop: 10, textAlign: 'center' }}>{description}</Text>
            </View>
          </BlurView>
        </View>
      </SafeAreaView>
    </View>
  )
}
