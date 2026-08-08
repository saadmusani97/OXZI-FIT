import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface ConnectionErrorProps {
  message?: string
  onRetry?: () => void
  retrying?: boolean
}

export default function ConnectionError({
  message = 'No internet connection. Please check your network and try again.',
  onRetry,
  retrying = false,
}: ConnectionErrorProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0E0E0E',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: 'rgba(246,108,63,0.12)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Ionicons name="cloud-offline-outline" size={36} color="#F66C3F" />
      </View>

      <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginBottom: 8, textAlign: 'center' }}>
        Connection lost
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
        {message}
      </Text>

      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          disabled={retrying}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#F66C3F',
            borderRadius: 50,
            paddingVertical: 12,
            paddingHorizontal: 28,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            opacity: retrying ? 0.6 : 1,
          }}
        >
          {retrying ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="refresh-outline" size={18} color="#fff" />
          )}
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
            {retrying ? 'Retrying...' : 'Retry'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
