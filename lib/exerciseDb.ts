import AsyncStorage from '@react-native-async-storage/async-storage'

export interface ExerciseDBItem {
  id: string
  name: string
  bodyPart: string
  equipment: string
  gifUrl: string
  target: string
  secondaryMuscles: string[]
  instructions: string[]
}

interface WgerExercise {
  id: number
  category?: { name?: string }
  equipment?: { name?: string }[]
  muscles?: { name_en?: string }[]
  muscles_secondary?: { name_en?: string }[]
  images?: { image?: string }[]
  translations?: { language: number; name?: string; description?: string }[]
}


const CACHE_KEY = 'oxzifit:exercise-cache'
const CACHE_TTL = 24 * 60 * 60 * 1000

let memoryCache: ExerciseDBItem[] | null = null

export async function fetchExercises(): Promise<ExerciseDBItem[]> {
  if (memoryCache) return memoryCache

  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_TTL) {
        memoryCache = data
        return data
      }
    }
  } catch {}

  const allExercises: ExerciseDBItem[] = []
  let url: string | null = 'https://wger.de/api/v2/exerciseinfo/?format=json&language=2&limit=100&offset=0'

  while (url && allExercises.length < 300) {
    const response: Response = await fetch(url)
    if (!response.ok) throw new Error(`Exercise API error: ${response.status}`)
    const json: { results?: WgerExercise[]; next?: string | null } = await response.json()

    for (const ex of (json.results ?? [])) {
      const translations = ex.translations ?? []
      const englishTrans = translations.find((t) => t.language === 2 && typeof t.name === 'string' && t.name.trim().length > 0)
      const name = englishTrans?.name?.trim()
      if (!name) continue

      const description = englishTrans?.description ?? ''
      const instructions = description
        ? description.replace(/<[^>]*>/g, '').split('.').filter((s: string) => s.trim().length > 10).slice(0, 6)
        : ['Perform the exercise with proper form.']

      const images = ex.images ?? []
      const gifUrl = images[0]?.image ?? ''

      allExercises.push({
        id: String(ex.id),
        name,
        bodyPart: ex.category?.name?.toLowerCase() ?? 'general',
        equipment: ex.equipment?.[0]?.name?.toLowerCase() ?? 'bodyweight',
        gifUrl,
        target: ex.muscles?.[0]?.name_en?.toLowerCase() || ex.category?.name?.toLowerCase() || 'general',
        secondaryMuscles: (ex.muscles_secondary ?? []).map((m) => m.name_en?.toLowerCase() ?? '').filter(Boolean),
        instructions,
      })
    }

    url = allExercises.length < 300 ? (json.next ?? null) : null
  }

  const exercises = allExercises

  memoryCache = exercises
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: exercises, timestamp: Date.now() }))
  } catch {}

  return exercises
}

export function filterExercises(
  exercises: ExerciseDBItem[],
  query: string,
  muscle?: string,
  equipment?: string
): ExerciseDBItem[] {
  const q = query.toLowerCase().trim()
  return exercises.filter((ex) => {
    const name = (ex.name ?? '').toLowerCase()
    const target = (ex.target ?? '').toLowerCase()
    const equip = (ex.equipment ?? '').toLowerCase()
    const secondary = (ex.secondaryMuscles ?? []).map(m => (m ?? '').toLowerCase())

    const matchesQuery = !q || name.includes(q) || target.includes(q)
    const matchesMuscle = !muscle || target === muscle.toLowerCase() || secondary.some(m => m === muscle.toLowerCase())
    const matchesEquipment = !equipment || equip === equipment.toLowerCase()
    return matchesQuery && matchesMuscle && matchesEquipment
  })
}
