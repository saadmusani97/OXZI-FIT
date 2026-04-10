import { useState } from 'react'
import { View, Image, ActivityIndicator, Text } from 'react-native'

interface ExerciseAnimationProps {
  gifUrl: string
  size?: number
}

export default function ExerciseAnimation({ gifUrl, size = 300 }: ExerciseAnimationProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <View style={{ width: size, height: size, backgroundColor: '#18181b', borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {!loaded && !error && <ActivityIndicator color="#f97316" size="large" />}
      {error ? (
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 48 }}>🏋️</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>No image available</Text>
        </View>
      ) : (
        <Image
          source={{ uri: gifUrl }}
          style={{ width: size, height: size, opacity: loaded ? 1 : 0 }}
          resizeMode="contain"
          onLoad={() => setLoaded(true)}
          onError={() => { setError(true); setLoaded(true) }}
        />
      )}
    </View>
  )
}
