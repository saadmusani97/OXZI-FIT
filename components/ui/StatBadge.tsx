import { View, Text } from 'react-native'

interface StatBadgeProps {
  result: 'win' | 'loss' | 'tie'
  className?: string
}

export default function StatBadge({ result, className }: StatBadgeProps) {
  const styles = {
    win: { container: 'bg-green-500/20', text: 'text-green-400', label: 'WIN' },
    loss: { container: 'bg-red-500/20', text: 'text-red-400', label: 'LOSS' },
    tie: { container: 'bg-zinc-700', text: 'text-zinc-400', label: 'TIE' },
  }

  const { container, text, label } = styles[result]

  return (
    <View className={`${container} rounded-full px-2 py-0.5 ${className ?? ''}`}>
      <Text className={`${text} text-xs font-bold`}>{label}</Text>
    </View>
  )
}
