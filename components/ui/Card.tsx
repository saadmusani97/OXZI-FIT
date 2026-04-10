import { View } from 'react-native'
import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export default function Card({ children, className }: CardProps) {
  return (
    <View className={`bg-zinc-900 rounded-2xl p-4 ${className ?? ''}`}>
      {children}
    </View>
  )
}
