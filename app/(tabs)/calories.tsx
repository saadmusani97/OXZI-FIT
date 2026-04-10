import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, Image,
  Alert, Animated, Dimensions, Modal, StatusBar, TextInput
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { scanFoodImage, pickImageFromGallery, takePhoto, NutritionResult, IngredientResult } from '../../lib/calAi'
import { calculateMealGrade } from '../../lib/mealGrade'

const { height: SH } = Dimensions.get('window')

interface Meal {
  id: string
  food_name: string
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  fiber_g: number
  meal_type: string
  logged_at: string
  image_url: string | null
}

const SCAN_STEPS = [
  'Separating ingredients',
  'Breaking down macros',
  'Searching nutrition database',
  'Finalizing results',
]

const GRADE_COLORS: Record<string, string> = {
  'A+': '#22c55e', A: '#4ade80', B: '#facc15', C: '#fb923c', D: '#ef4444',
}

function CircularProgress({ progress }: { progress: number }) {
  const size = 140
  const stroke = 5
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: stroke, borderColor: 'rgba(255,255,255,0.2)',
      }} />
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: stroke, borderColor: '#fff',
        borderTopColor: progress > 0.25 ? '#fff' : 'transparent',
        borderRightColor: progress > 0.5 ? '#fff' : 'transparent',
        borderBottomColor: progress > 0.75 ? '#fff' : 'transparent',
        transform: [{ rotate: '-90deg' }],
      }} />
      <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800' }}>
        {Math.round(progress * 100)}%
      </Text>
    </View>
  )
}

function ScanOverlay({ image, progress, completedSteps }: {
  image: string; progress: number; completedSteps: number
}) {
  return (
    <View style={{ flex: 1 }}>
      <Image source={{ uri: image }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
      <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.45)' }} />
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <CircularProgress progress={progress} />
        <View style={{ marginTop: 28, width: '100%', gap: 12 }}>
          {SCAN_STEPS.map((step, i) => {
            const done = i < completedSteps
            const active = i === completedSteps
            return (
              <View key={step} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: done || active ? 1 : 0.35 }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  borderWidth: 2, borderColor: done ? '#fff' : 'rgba(255,255,255,0.6)',
                  backgroundColor: done ? '#fff' : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {done && <Ionicons name="checkmark" size={13} color="#000" />}
                </View>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: done ? '700' : '400' }}>{step}</Text>
              </View>
            )
          })}
        </View>
      </SafeAreaView>
    </View>
  )
}

function CameraSheet({ visible, onClose, onScan }: {
  visible: boolean; onClose: () => void; onScan: (src: 'camera' | 'gallery') => void
}) {
  const slideAnim = useRef(new Animated.Value(SH)).current
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : SH,
      useNativeDriver: true,
      tension: 65, friction: 11,
    }).start()
  }, [visible, slideAnim])

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <BlurView intensity={40} tint="dark" style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }}>
            <View style={{ backgroundColor: 'rgba(15,15,20,0.85)', padding: 28, paddingBottom: 48 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 24 }} />
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 6 }}>Scan Food</Text>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 28 }}>
                Take a photo or pick from gallery to get instant nutrition facts
              </Text>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <TouchableOpacity
                  onPress={() => { onClose(); setTimeout(() => onScan('camera'), 300) }}
                  style={{ flex: 1, backgroundColor: '#f97316', borderRadius: 20, paddingVertical: 20, alignItems: 'center', gap: 10 }}
                  activeOpacity={0.85}
                >
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="camera" size={26} color="#fff" />
                  </View>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { onClose(); setTimeout(() => onScan('gallery'), 300) }}
                  style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, paddingVertical: 20, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
                  activeOpacity={0.85}
                >
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(249,115,22,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="images" size={26} color="#f97316" />
                  </View>
                  <Text style={{ color: '#f97316', fontWeight: '700', fontSize: 15 }}>Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  )
}

function NutritionCard({ result, image, onRetake, onSave, saving }: {
  result: NutritionResult; image: string | null; onRetake: () => void; onSave: (r: NutritionResult) => void; saving: boolean
}) {
  const [ingredients, setIngredients] = useState<IngredientResult[]>(
    result.ingredients.length > 0 ? result.ingredients : []
  )

  function scaleIngredient(ing: IngredientResult, newGrams: number): IngredientResult {
    return {
      ...ing,
      quantity_g: newGrams,
      calories: Math.round(ing.calories_per_100g * newGrams / 100),
      protein_g: Math.round((ing.protein_g / (ing.quantity_g || 100)) * newGrams * 10) / 10,
      fat_g: Math.round((ing.fat_g / (ing.quantity_g || 100)) * newGrams * 10) / 10,
      carbs_g: Math.round((ing.carbs_g / (ing.quantity_g || 100)) * newGrams * 10) / 10,
      fiber_g: Math.round((ing.fiber_g / (ing.quantity_g || 100)) * newGrams * 10) / 10,
      portion_size: `${ing.food_name} (${newGrams}g)`,
    }
  }

  function adjustGrams(index: number, delta: number) {
    setIngredients(prev => prev.map((ing, i) => {
      if (i !== index) return ing
      const newG = Math.max(10, (ing.quantity_g || 100) + delta)
      return scaleIngredient(ing, newG)
    }))
  }

  function handleGramInput(index: number, val: string) {
    const g = parseInt(val)
    if (!isNaN(g) && g > 0) {
      setIngredients(prev => prev.map((ing, i) => i === index ? scaleIngredient(ing, g) : ing))
    }
  }

  const totalCal = ingredients.reduce((s, i) => s + i.calories, 0) || result.calories
  const totalP = ingredients.reduce((s, i) => s + i.protein_g, 0) || result.protein_g
  const totalC = ingredients.reduce((s, i) => s + i.carbs_g, 0) || result.carbs_g
  const totalF = ingredients.reduce((s, i) => s + i.fat_g, 0) || result.fat_g

  const adjustedResult: NutritionResult = {
    ...result,
    calories: totalCal,
    protein_g: Math.round(totalP * 10) / 10,
    carbs_g: Math.round(totalC * 10) / 10,
    fat_g: Math.round(totalF * 10) / 10,
    ingredients,
  }

  const grade = calculateMealGrade(totalCal, totalP, totalF).grade
  const gradeColor = GRADE_COLORS[grade] ?? '#22c55e'

  const macros = [
    { label: 'Carbs', value: Math.round(totalC * 10) / 10, color: '#f97316' },
    { label: 'Fat', value: Math.round(totalF * 10) / 10, color: '#a855f7' },
    { label: 'Protein', value: Math.round(totalP * 10) / 10, color: '#3b82f6' },
  ]

  const totalSodium = ingredients.reduce((s, i) => s + (i.sodium_mg ?? 0), 0) || result.sodium_mg
  const totalSugar = ingredients.reduce((s, i) => s + (i.sugar_g ?? 0), 0) || result.sugar_g

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f0' }}>
      {image && (
        <Image source={{ uri: image }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
      )}
      <View style={{ flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <Text style={{ color: '#888', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 }}>Meal</Text>
            <TouchableOpacity onPress={onRetake}>
              <Ionicons name="create-outline" size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: gradeColor + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: gradeColor, fontWeight: '800', fontSize: 16 }}>{grade}</Text>
            </View>
            <View>
              <Text style={{ color: '#111', fontSize: 30, fontWeight: '900', lineHeight: 34 }}>{totalCal}</Text>
              <Text style={{ color: '#888', fontSize: 14 }}>Calories total</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 20, marginBottom: 8 }}>
            {macros.map(m => (
              <View key={m.label}>
                <Text style={{ color: m.color, fontSize: 17, fontWeight: '800' }}>{m.value}g</Text>
                <Text style={{ color: '#888', fontSize: 13 }}>{m.label}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 20, marginTop: 4, marginBottom: 4 }}>
            <View>
              <Text style={{ color: '#111', fontSize: 14, fontWeight: '700' }}>{Math.round(totalSodium)}mg</Text>
              <Text style={{ color: '#aaa', fontSize: 12 }}>Sodium</Text>
            </View>
            <View>
              <Text style={{ color: '#111', fontSize: 14, fontWeight: '700' }}>{Math.round(totalSugar * 10) / 10}g</Text>
              <Text style={{ color: '#aaa', fontSize: 12 }}>Sugar</Text>
            </View>
            {result.cuisine_type ? (
              <View style={{ marginLeft: 'auto' }}>
                <Text style={{ color: '#f97316', fontSize: 12, fontWeight: '700', backgroundColor: '#fff5ee', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>{result.cuisine_type}</Text>
              </View>
            ) : null}
          </View>

          <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 20 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ color: '#111', fontSize: 17, fontWeight: '800' }}>Ingredients</Text>
            <Text style={{ color: '#aaa', fontSize: 12 }}>Tap g to edit quantity</Text>
          </View>

          <View style={{ gap: 16, marginTop: 10 }}>
            {ingredients.length > 0 ? ingredients.map((ing, i) => (
              <View key={i} style={{ borderBottomWidth: i < ingredients.length - 1 ? 1 : 0, borderBottomColor: '#f0f0f0', paddingBottom: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <Text style={{ color: '#111', fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 }}>{ing.food_name}</Text>
                  <Text style={{ color: '#555', fontSize: 15, fontWeight: '600' }}>{ing.calories} cal</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: '#aaa', fontSize: 12 }}>
                      P:{ing.protein_g}g · C:{ing.carbs_g}g · F:{ing.fat_g}g
                    </Text>
                    {ing.cooking_method ? (
                      <Text style={{ color: '#f97316', fontSize: 11, marginTop: 3 }}>{ing.cooking_method}{ing.confidence ? ` · ${Math.round(ing.confidence * 100)}% confident` : ''}</Text>
                    ) : null}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => adjustGrams(i, -10)}
                      style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="remove" size={14} color="#555" />
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f7f7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <TextInput
                        value={String(ing.quantity_g || 100)}
                        onChangeText={v => handleGramInput(i, v)}
                        keyboardType="numeric"
                        style={{ color: '#111', fontSize: 14, fontWeight: '700', minWidth: 32, textAlign: 'center' }}
                      />
                      <Text style={{ color: '#aaa', fontSize: 12, marginLeft: 2 }}>g</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => adjustGrams(i, 10)}
                      style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="add" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )) : (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#111', fontSize: 15, fontWeight: '600' }}>{result.food_name}</Text>
                <Text style={{ color: '#555', fontSize: 15, fontWeight: '600' }}>{result.calories} cal</Text>
              </View>
            )}
          </View>

          {(result.analysis_notes || (result.hidden_ingredients_assumed?.length > 0)) && (
            <View style={{ marginTop: 20, backgroundColor: '#fffbf5', borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: '#f97316' }}>
              {result.hidden_ingredients_assumed?.length > 0 && (
                <Text style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>
                  Assumed: {result.hidden_ingredients_assumed.join(', ')}
                </Text>
              )}
              {result.analysis_notes ? (
                <Text style={{ color: '#aaa', fontSize: 12, fontStyle: 'italic' }}>{result.analysis_notes}</Text>
              ) : null}
            </View>
          )}
        </ScrollView>

        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12, backgroundColor: '#fff' }}>
          <TouchableOpacity
            onPress={() => onSave(adjustedResult)}
            disabled={saving}
            style={{ backgroundColor: '#111', borderRadius: 16, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, opacity: saving ? 0.6 : 1 }}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default function CaloriesScreen() {
  const { session, profile } = useAuthStore()
  const [sheetVisible, setSheetVisible] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scannedImage, setScannedImage] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [completedSteps, setCompletedSteps] = useState(0)
  const [result, setResult] = useState<NutritionResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [meals, setMeals] = useState<Meal[]>([])
  const [loadingMeals, setLoadingMeals] = useState(true)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const dailyCalGoal = profile?.daily_calorie_goal ?? 2000
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0)
  const totalProtein = meals.reduce((sum, m) => sum + m.protein_g, 0)
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs_g, 0)
  const totalFat = meals.reduce((sum, m) => sum + m.fat_g, 0)

  const fetchTodayMeals = useCallback(async () => {
    if (!session?.user?.id) return
    setLoadingMeals(true)
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('meals').select('*')
      .eq('user_id', session.user.id)
      .gte('logged_at', `${today}T00:00:00`)
      .order('logged_at', { ascending: false })
    setMeals((data as Meal[]) ?? [])
    setLoadingMeals(false)
  }, [session?.user?.id])

  useEffect(() => { fetchTodayMeals() }, [fetchTodayMeals])

  function startProgressAnimation() {
    setScanProgress(0)
    setCompletedSteps(0)
    let p = 0
    progressRef.current = setInterval(() => {
      p += 0.012
      if (p >= 0.98) { p = 0.98; clearInterval(progressRef.current!) }
      setScanProgress(p)
      setCompletedSteps(Math.floor(p * SCAN_STEPS.length))
    }, 80)
  }

  function stopProgressAnimation(success: boolean) {
    if (progressRef.current) clearInterval(progressRef.current)
    if (success) {
      setScanProgress(1)
      setCompletedSteps(SCAN_STEPS.length)
    }
  }

  async function handleScan(source: 'camera' | 'gallery') {
    const uri = source === 'camera' ? await takePhoto() : await pickImageFromGallery()
    if (!uri) return
    setScannedImage(uri)
    setResult(null)
    setScanning(true)
    startProgressAnimation()
    try {
      const nutrition = await scanFoodImage(uri)
      stopProgressAnimation(true)
      await new Promise(r => setTimeout(r, 600))
      setResult(nutrition)
    } catch (e) {
      stopProgressAnimation(false)
      const msg = e instanceof Error ? e.message : JSON.stringify(e)
      Alert.alert('Scan Failed', msg)
      setScannedImage(null)
    } finally {
      setScanning(false)
    }
  }

  async function handleSaveMeal(adjusted?: NutritionResult) {
    const data = adjusted ?? result
    if (!data || !session?.user?.id) return
    setSaving(true)
    const { error } = await supabase.from('meals').insert({
      user_id: session.user.id,
      food_name: data.food_name,
      calories: data.calories,
      protein_g: data.protein_g,
      fat_g: data.fat_g,
      carbs_g: data.carbs_g,
      fiber_g: data.fiber_g,
      portion_size: data.portion_size,
      ai_confidence: data.confidence,
      meal_type: 'snack',
      logged_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) { Alert.alert('Error', error.message); return }
    setResult(null)
    setScannedImage(null)
    fetchTodayMeals()
  }

  if (scanning && scannedImage) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <ScanOverlay image={scannedImage} progress={scanProgress} completedSteps={completedSteps} />
      </View>
    )
  }

  if (result && scannedImage) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 }}>
            <TouchableOpacity onPress={() => { setResult(null); setScannedImage(null) }} style={{ marginRight: 12 }}>
              <Ionicons name="chevron-back" size={24} color="#111" />
            </TouchableOpacity>
            <Text style={{ color: '#111', fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center', marginRight: 36 }}>Cal AI</Text>
          </View>
          <NutritionCard
            result={result}
            image={scannedImage}
            onRetake={() => { setResult(null); setScannedImage(null) }}
            onSave={handleSaveMeal}
            saving={saving}
          />
        </SafeAreaView>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#0a0a0f', '#0a0f0a', '#0f0a1a']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ position: 'absolute', top: -60, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(34,197,94,0.1)' }} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16, marginBottom: 24 }}>
            <View>
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800' }}>Cal AI 📷</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 2 }}>Scan your food for instant nutrition</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setSheetVisible(true)}
            activeOpacity={0.88}
            style={{ marginBottom: 20 }}
          >
            <LinearGradient
              colors={['#f97316', '#ea580c']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16 }}
            >
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="camera" size={30} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Scan a Meal</Text>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 3 }}>AI-powered nutrition analysis</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
          </TouchableOpacity>

          <BlurView intensity={18} tint="dark" style={{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 20 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 20 }}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 16 }}>{"Today's Nutrition"}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#f97316', fontSize: 22, fontWeight: '900' }}>{totalCalories}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>/ {dailyCalGoal} kcal</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#3b82f6', fontSize: 18, fontWeight: '800' }}>{Math.round(totalProtein)}g</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>protein</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#f97316', fontSize: 18, fontWeight: '800' }}>{Math.round(totalCarbs)}g</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>carbs</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#a855f7', fontSize: 18, fontWeight: '800' }}>{Math.round(totalFat)}g</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>fat</Text>
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, height: 8 }}>
                <View style={{ backgroundColor: '#f97316', borderRadius: 8, height: 8, width: `${Math.min(totalCalories / dailyCalGoal, 1) * 100}%` }} />
              </View>
            </View>
          </BlurView>

          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 }}>{"Today's Meals"}</Text>

          {loadingMeals ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Ionicons name="restaurant-outline" size={32} color="rgba(255,255,255,0.2)" />
            </View>
          ) : meals.length === 0 ? (
            <BlurView intensity={15} tint="dark" style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', padding: 32, alignItems: 'center', gap: 10 }}>
                <Ionicons name="restaurant-outline" size={36} color="rgba(255,255,255,0.2)" />
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center' }}>No meals logged today{'\n'}Scan your first meal 🍽️</Text>
              </View>
            </BlurView>
          ) : (
            meals.map(meal => {
              const grade = calculateMealGrade(meal.calories, meal.protein_g, meal.fat_g).grade
              const gc = GRADE_COLORS[grade] ?? '#22c55e'
              return (
                <BlurView key={meal.id} intensity={15} tint="dark" style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 10 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: gc + '22', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: gc }}>{grade}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{meal.food_name}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
                        {meal.calories} kcal · P:{meal.protein_g}g · C:{meal.carbs_g}g · F:{meal.fat_g}g
                      </Text>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                      {new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </BlurView>
              )
            })
          )}

        </ScrollView>
      </SafeAreaView>

      <CameraSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onScan={handleScan}
      />
    </View>
  )
}
