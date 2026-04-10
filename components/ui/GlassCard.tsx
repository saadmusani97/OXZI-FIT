import { View, ViewStyle } from 'react-native'
import { BlurView } from 'expo-blur'

interface GlassCardProps {
  children: React.ReactNode
  style?: ViewStyle
  intensity?: number
}

export default function GlassCard({ children, style, intensity = 20 }: GlassCardProps) {
  return (
    <BlurView
      intensity={intensity}
      tint="dark"
      style={[{
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
      }, style]}
    >
      <View style={{
        backgroundColor: 'rgba(255,255,255,0.07)',
        padding: 20,
        flex: 1,
      }}>
        {children}
      </View>
    </BlurView>
  )
}
