import { View } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <AnimatedDot key={index} active={index === currentStep} />
      ))}
    </View>
  )
}

function AnimatedDot({ active }: { active: boolean }) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(active ? 24 : 8, { duration: 300 }),
  }))

  return (
    <Animated.View
      style={animatedStyle}
      className={`h-2 rounded-full ${active ? 'bg-orange-500' : 'bg-zinc-700'}`}
    />
  )
}
