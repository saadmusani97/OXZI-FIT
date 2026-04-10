import { TouchableOpacity, View, Text, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ExerciseDBItem } from '../../lib/exerciseDb'

interface ExerciseCardProps {
  exercise: ExerciseDBItem
  onPress: () => void
}

export default function ExerciseCard({ exercise, onPress }: ExerciseCardProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center bg-zinc-900 rounded-2xl p-4 mb-3"
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {exercise.gifUrl ? (
          <Image source={{ uri: exercise.gifUrl }} style={{ width: 56, height: 56 }} resizeMode="cover" />
        ) : (
          <Ionicons name="barbell-outline" size={28} color="#f97316" />
        )}
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-white font-semibold text-base capitalize" numberOfLines={1}>
          {exercise.name}
        </Text>
        <View className="flex-row gap-2 mt-1 flex-wrap">
          <View className="bg-orange-500/20 rounded-full px-2 py-0.5">
            <Text className="text-orange-400 text-xs capitalize">{exercise.bodyPart}</Text>
          </View>
          <View className="bg-zinc-700 rounded-full px-2 py-0.5">
            <Text className="text-zinc-300 text-xs capitalize">{exercise.target}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#71717a" />
    </TouchableOpacity>
  )
}
