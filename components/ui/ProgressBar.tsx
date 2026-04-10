import { View } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'

interface ProgressBarProps {
  progress: number
  color?: string
  height?: number
  className?: string
}

export default function ProgressBar({ progress, color = '#f97316', height = 8, className }: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress))

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${clampedProgress * 100}%` as `${number}%`, { duration: 500 }),
  }))

  return (
    <View
      className={`bg-zinc-800 rounded-full overflow-hidden ${className ?? ''}`}
      style={{ height }}
    >
      <Animated.View
        style={[{ height, backgroundColor: color, borderRadius: height / 2 }, animatedStyle]}
      />
    </View>
  )
}
