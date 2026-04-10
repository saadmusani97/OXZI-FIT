import { View } from 'react-native'
import React from 'react'
import Svg, { Circle } from 'react-native-svg'
import Animated, { useAnimatedProps, withTiming } from 'react-native-reanimated'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface CircularProgressProps {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
  children?: React.ReactNode
}

export default function CircularProgress({
  progress,
  size = 120,
  strokeWidth = 10,
  color = '#f97316',
  children,
}: CircularProgressProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const cx = size / 2
  const cy = size / 2

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: withTiming(circumference * (1 - clampedProgress), { duration: 600 }),
  }))

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="#27272a"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      {children}
    </View>
  )
}
