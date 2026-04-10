import { useState } from 'react'
import { View, TouchableOpacity, Text } from 'react-native'
import BodyHighlighter, { BodyPart } from 'react-native-body-highlighter'

interface MuscleHighlighterProps {
  muscles: string[]
  musclesSecondary?: string[]
}

const MUSCLE_MAP: Record<string, string> = {
  'chest': 'chest',
  'upper chest': 'chest',
  'lower chest': 'chest',
  'abs': 'abs',
  'abdominals': 'abs',
  'biceps': 'biceps',
  'biceps brachii': 'biceps',
  'triceps': 'triceps',
  'triceps brachii': 'triceps',
  'forearms': 'forearm',
  'forearm': 'forearm',
  'shoulders': 'deltoids',
  'delts': 'deltoids',
  'deltoids': 'deltoids',
  'front deltoids': 'deltoids',
  'lats': 'back-deltoids',
  'latissimus dorsi': 'back-deltoids',
  'upper back': 'trapezius',
  'traps': 'trapezius',
  'trapezius': 'trapezius',
  'lower back': 'lower-back',
  'spine': 'lower-back',
  'glutes': 'gluteal',
  'gluteus maximus': 'gluteal',
  'quads': 'quadriceps',
  'quadriceps': 'quadriceps',
  'hamstrings': 'hamstring',
  'hamstring': 'hamstring',
  'calves': 'calves',
  'calf': 'calves',
  'adductors': 'adductor',
  'abductors': 'abductor',
}

function mapMuscles(muscles: string[], intensity: number): BodyPart[] {
  return muscles
    .map(m => MUSCLE_MAP[m.toLowerCase()])
    .filter((slug): slug is string => Boolean(slug))
    .map(slug => ({ slug, intensity } as BodyPart))
}

export default function MuscleHighlighter({ muscles, musclesSecondary = [] }: MuscleHighlighterProps) {
  const [side, setSide] = useState<'front' | 'back'>('front')

  const bodyParts: BodyPart[] = [
    ...mapMuscles(muscles, 2),
    ...mapMuscles(musclesSecondary, 1),
  ]

  return (
    <View className="items-center">
      <BodyHighlighter
        data={bodyParts}
        side={side}
        scale={1.2}
        colors={['#3f3f46', '#f97316']}
      />
      <View className="flex-row gap-3 mt-3">
        <TouchableOpacity
          className={`px-4 py-2 rounded-full ${side === 'front' ? 'bg-orange-500' : 'bg-zinc-800'}`}
          onPress={() => setSide('front')}
        >
          <Text className={`text-sm font-semibold ${side === 'front' ? 'text-white' : 'text-zinc-400'}`}>Front</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`px-4 py-2 rounded-full ${side === 'back' ? 'bg-orange-500' : 'bg-zinc-800'}`}
          onPress={() => setSide('back')}
        >
          <Text className={`text-sm font-semibold ${side === 'back' ? 'text-white' : 'text-zinc-400'}`}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
