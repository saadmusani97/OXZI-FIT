import React from 'react'
import { View } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'

interface OnboardingStepProps {
  children: React.ReactNode
  visible: boolean
}

export default function OnboardingStep({ children, visible }: OnboardingStepProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(visible ? 1 : 0, { duration: 250 }),
  }))

  if (!visible) {
    return <View style={{ height: 0, overflow: 'hidden' }}>{children}</View>
  }

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  )
}
