import * as ImagePicker from 'expo-image-picker'
import { readAsStringAsync } from 'expo-file-system/legacy'
import { supabase } from './supabase'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface IngredientResult {
  food_name: string
  quantity_amount: number
  quantity_unit: string
  quantity_g: number
  calories_per_100g: number
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  fiber_g: number
  sodium_mg: number
  sugar_g: number
  portion_size: string
  cooking_method: string
  confidence: number
}

export interface NutritionResult {
  food_name: string
  cuisine_type: string
  meal_type: string
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  fiber_g: number
  sodium_mg: number
  sugar_g: number
  portion_size: string
  confidence: number
  cooking_method_detected: string
  hidden_ingredients_assumed: string[]
  ingredients: IngredientResult[]
  analysis_notes: string
}

async function imageToBase64(uri: string): Promise<string> {
  const base64 = await readAsStringAsync(uri, { encoding: 'base64' })
  return base64
}

async function requestNutritionAnalysis(base64: string, prompt: string) {
  const { data, error } = await supabase.functions.invoke('scan-food', {
    body: { base64, prompt },
  })

  if (!error) {
    return data
  }

  const publicGroqKey = process.env.EXPO_PUBLIC_GROQ_API_KEY
  if (!publicGroqKey) {
    throw new Error(`Scan function error: ${error.message}`)
  }

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${publicGroqKey}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2048,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Scan function error: ${error.message}. Groq fallback failed: ${response.status} ${body}`)
  }

  return await response.json()
}

export async function scanFoodImage(imageUri: string): Promise<NutritionResult> {
  const base64 = await imageToBase64(imageUri)

  const prompt = `You are an elite AI nutritionist with expert-level food vision analysis. Your goal is to extract maximum nutritional accuracy from any food image — including complex, layered, mixed, or culturally specific dishes.

## PHASE 1 — SCENE UNDERSTANDING (reason before classifying)
Before identifying anything, mentally answer:
- What type of meal is this? (breakfast / lunch / dinner / snack / beverage)
- What cuisine style? (Indian, Chinese, Western, street food, homemade, restaurant, etc.)
- What is the serving context? (plate, bowl, tiffin, thali, takeaway box, hand-held)
- Is this a single dish or a multi-item spread?
- Are there any hidden/occluded ingredients likely present based on context?

## PHASE 2 — DISH DECOMPOSITION RULES
Apply these rules strictly:

### Layered & Mixed Dishes (biryani, pasta, curry rice, sandwiches, wraps, burgers)
- Mentally "deconstruct" the dish into its base components
- Estimate the ratio of each layer (e.g., biryani = 60% rice, 25% chicken, 10% gravy, 5% fried onions/spices)
- Account for hidden ingredients (e.g., ghee in biryani, butter in dals, oil absorbed in frying)

### Indian Food Specific Rules
- Dal/lentils: always estimate cooking oil/ghee used (typically 1–2 tsp per serving = 5–10g fat)
- Curries: account for base gravy (onion, tomato, oil); estimate ~30–50g gravy per serving
- Roti/chapati: 1 medium = ~30–35g; 1 paratha = ~60–80g; 1 puri = ~35–45g
- Rice: cooked white rice 1 cup = ~180g; biryani rice absorbs fat — add ~5–10% extra calories
- Thali: identify EACH bowl/katori separately; estimate steel katori = ~150ml capacity
- Idli (1 piece = ~40g), dosa (1 = ~80–100g batter), vada (1 = ~45–55g)
- Street food: assume liberal oil usage unless clearly baked/grilled

### Quantity Estimation References
- Standard dinner plate diameter = 26–28cm
- Side plate / quarter plate = 18–20cm
- Steel thali = 30–32cm
- Katori/small bowl = 100–150ml
- Large bowl = 300–400ml
- 1 medium egg = 50g | 1 large egg = 60g
- 1 slice bread (standard) = 25–30g
- 1 cup cooked rice = 180g | 1 cup raw rice = 185g
- 1 medium roti = 30–35g
- 1 medium banana = 120g | 1 medium apple = 180g | 1 medium mango = 200g
- 1 tbsp oil = 14g | 1 tsp ghee = 5g
- For frying: estimate ~10–15% oil absorption for shallow fry, ~15–20% for deep fry
- Use food height + plate coverage to triangulate volume → weight

### Beverages
- Chai with milk (standard cup ~150ml): ~60–80 kcal if sweetened
- Cold drinks, juices: read label if visible; otherwise estimate per 250ml serving
- Lassi: ~200ml serving, estimate sweet vs salted

### Cooking Method Detection
Identify and adjust nutrition based on:
- Raw / Steamed / Boiled → base nutrition only
- Sautéed / Stir-fried → add ~5–10g oil per serving
- Deep fried → add ~15–25% extra fat calories
- Grilled / Tandoor → minimal added fat
- With visible butter/ghee on top → add 5–10g per visible dollop

## PHASE 3 — IDENTIFICATION RULES
- Identify EVERY distinct visible ingredient — skip nothing
- Be maximally specific: "paneer butter masala" not "curry", "tandoori chicken leg" not "chicken", "jeera rice" not "rice"
- If a sauce/chutney/raita is visible as a side, include it
- If you see garnish (coriander, lemon wedge, onion rings), include as trace ingredients
- If any ingredient is ambiguous, provide your best classification and reflect it in confidence score
- Detect portion multiplicity: "2 rotis", "3 idlis", "half a plate of rice"

## PHASE 4 — NUTRITION CALCULATION
- Calculate per-ingredient based on quantity_g
- Sum all ingredients for totals
- Use standard USDA / IFCT (Indian Food Composition Table) values
- For restaurant/commercial food: add 10–20% to fat estimates (restaurants use more oil)
- Always provide calories_per_100g for user recalibration

## OUTPUT FORMAT
Return ONLY valid JSON. No markdown. No explanation. No text outside the JSON.

{
  "food_name": "descriptive name of the full meal",
  "cuisine_type": "e.g. Indian / Chinese / Western / Mixed",
  "meal_type": "breakfast / lunch / dinner / snack / beverage",
  "calories": <total kcal>,
  "protein_g": <total>,
  "fat_g": <total>,
  "carbs_g": <total>,
  "fiber_g": <total>,
  "sodium_mg": <estimated total>,
  "sugar_g": <estimated total>,
  "portion_size": "human-readable full plate description e.g. 'Full thali (~680g)'",
  "confidence": <0.0–1.0 overall>,
  "cooking_method_detected": "e.g. deep fried / steamed / grilled / mixed",
  "hidden_ingredients_assumed": ["ghee in dal", "oil in curry base"],
  "ingredients": [
    {
      "food_name": "specific food name",
      "quantity_amount": <number>,
      "quantity_unit": "pieces / g / ml / slices / cups / tbsp",
      "quantity_g": <estimated grams>,
      "calories_per_100g": <number>,
      "calories": <number>,
      "protein_g": <number>,
      "fat_g": <number>,
      "carbs_g": <number>,
      "fiber_g": <number>,
      "sodium_mg": <number>,
      "sugar_g": <number>,
      "portion_size": "human readable e.g. '2 medium rotis (65g)'",
      "cooking_method": "boiled / fried / raw / grilled / baked",
      "confidence": <0.0–1.0 per ingredient>
    }
  ],
  "analysis_notes": "brief note on any assumptions made or low-confidence areas"
}`

  const data = await requestNutritionAnalysis(base64, prompt)

  const text = (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content ?? ''

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`No JSON in response: ${text}`)

  let jsonStr = jsonMatch[0]
  try {
    const result = JSON.parse(jsonStr) as NutritionResult
    if (!result.ingredients) result.ingredients = []
    if (!result.hidden_ingredients_assumed) result.hidden_ingredients_assumed = []
    return result
  } catch {
    const truncationFix = jsonStr
      .replace(/,\s*$/, '')
      .replace(/,\s*\]/, ']')
      .replace(/,\s*\}/, '}')
    try {
      const result = JSON.parse(truncationFix) as NutritionResult
      if (!result.ingredients) result.ingredients = []
      if (!result.hidden_ingredients_assumed) result.hidden_ingredients_assumed = []
      return result
    } catch {
      throw new Error(`Failed to parse AI response. Try again with a clearer photo.`)
    }
  }
}

export async function pickImageFromGallery(): Promise<string | null> {
  const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!granted) return null

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    base64: false,
  })

  if (result.canceled) return null
  return result.assets[0].uri
}

export async function takePhoto(): Promise<string | null> {
  const { granted } = await ImagePicker.requestCameraPermissionsAsync()
  if (!granted) return null

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
    base64: false,
  })

  if (result.canceled) return null
  return result.assets[0].uri
}
