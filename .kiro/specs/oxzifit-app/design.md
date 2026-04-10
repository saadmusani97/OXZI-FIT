# OXZIFIT — Technical Design Document

## Overview

OXZIFIT is a React Native + Expo mobile application that unifies fitness tracking, AI-powered nutrition scanning, GPS route tracking with territory conquest, and social gamification into a single app. The three core pillars are:

1. **FITNESS** — Exercise library (ExerciseDB API animated GIFs + react-native-body-highlighter SVG muscle diagrams)
2. **CAL AI** — Food photo scanning via OpenAI GPT-4o Vision through Supabase Edge Functions
3. **STRAVA-STYLE TRACKING** — GPS route tracking + territory conquest map + pedometer steps

The app targets fitness enthusiasts who want a unified, gamified, and socially competitive experience without juggling multiple apps.

### Key Design Principles

- All AI API keys live exclusively in Supabase Edge Functions — never exposed to the client
- Every feature must work in Expo Go (no custom native builds for MVP)
- Zustand manages ephemeral client state; React Query manages server state with caching
- Supabase RLS enforces data isolation at the database layer
- ExerciseDB API data is fetched once and cached client-side for sub-500ms filtering

---

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        OXZIFIT Mobile App                        │
│                   (React Native + Expo SDK 52)                   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Expo Router │  │   Zustand    │  │    React Query       │   │
│  │ (Navigation) │  │ (UI / Local) │  │  (Server State)      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │expo-     │ │expo-     │ │expo-     │ │react-native-maps   │  │
│  │sensors   │ │location  │ │camera    │ │+ @turf/turf        │  │
│  │Pedometer │ │GPS       │ │Cal AI    │ │Territory Engine    │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    HTTPS / Realtime WS
                              │
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase                                  │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │  Auth    │ │PostgreSQL│ │ Storage  │ │  Edge Functions    │  │
│  │(sessions)│ │(RLS)     │ │(photos)  │ │  (AI proxy)        │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              Supabase Realtime                            │    │
│  │         (leaderboard live updates)                        │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                           HTTPS
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      External APIs                                │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  ExerciseDB API  │  │  OpenAI GPT-4o   │  │ Open Food     │  │
│  │  (exercisedb.dev)│  │  Vision + Text   │  │ Facts API     │  │
│  └──────────────────┘  └──────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Navigation Architecture (Expo Router)

```
app/
├── _layout.tsx                  ← Root layout: auth gate, session restore
├── index.tsx                    ← Redirect: auth check → (auth) or (tabs)
├── (auth)/
│   ├── _layout.tsx              ← Stack navigator for auth screens
│   ├── login.tsx
│   ├── signup.tsx
│   └── onboarding.tsx           ← Multi-step onboarding (5+ screens)
├── (tabs)/
│   ├── _layout.tsx              ← Bottom tab navigator (5 tabs)
│   ├── index.tsx                ← Home Dashboard
│   ├── exercises.tsx            ← Exercise Library
│   ├── calories.tsx             ← Cal AI Scanner + Meal Log
│   ├── track.tsx                ← GPS Route Tracking + Steps
│   ├── leaderboard.tsx          ← Leaderboard + Friends
│   └── profile.tsx              ← Profile + Achievements + Settings
├── exercise/
│   └── [id].tsx                 ← Exercise Detail (GIF + Muscle Highlighter)
├── meal/
│   └── [id].tsx                 ← Meal Detail + Swap Suggestion
├── route/
│   └── [id].tsx                 ← Route Detail (Polyline map + stats)
├── compare/
│   └── [friendId].tsx           ← Friend Comparison (PUBG-style)
└── chat/
    └── index.tsx                ← AI Trainer Chat
```

The root `_layout.tsx` checks `authStore.session` on mount. If no session, it redirects to `/(auth)/login`. If session exists but `profile.onboarding_completed === false`, it redirects to `/(auth)/onboarding`. Otherwise it renders the `(tabs)` navigator.

---

## Components and Interfaces

### Component Tree

```
components/
├── ui/
│   ├── Button.tsx               ← Primary/secondary/ghost variants
│   ├── Card.tsx                 ← Base card container
│   ├── ProgressBar.tsx          ← Animated reanimated progress bar
│   ├── CircularProgress.tsx     ← Step counter ring
│   └── StatBadge.tsx            ← Win/loss indicator chip
├── exercises/
│   ├── ExerciseCard.tsx         ← List item: name, muscle tags, thumbnail
│   ├── ExerciseAnimation.tsx    ← Renders gifUrl in Image component
│   └── MuscleHighlighter.tsx    ← Wraps react-native-body-highlighter
├── calories/
│   ├── FoodScanner.tsx          ← Camera + gallery picker + barcode mode
│   ├── NutritionDisplay.tsx     ← Animated macro bars (reanimated)
│   ├── MealCard.tsx             ← Logged meal list item
│   └── MealGradeChip.tsx        ← A+/A/B/C/D grade badge
├── tracking/
│   ├── RouteMap.tsx             ← MapView + Polyline overlay
│   ├── TerritoryMap.tsx         ← MapView + Polygon overlays
│   ├── StepCounter.tsx          ← CircularProgress + Lottie goal animation
│   └── RouteStatsBar.tsx        ← Duration / distance / pace display
├── leaderboard/
│   ├── PodiumTop3.tsx           ← Visually distinct top-3 podium
│   ├── LeaderboardRow.tsx       ← Rank + avatar + name + points
│   └── FriendCompareRow.tsx     ← Side-by-side stat with win/loss chip
├── streak/
│   ├── StreakCounter.tsx        ← Fire icon + day count
│   └── StreakCelebration.tsx    ← Lottie milestone animation
├── onboarding/
│   ├── OnboardingStep.tsx       ← Single step wrapper with reanimated slide
│   └── StepIndicator.tsx        ← Dot progress indicator
└── territory/
    └── TerritoryPolygon.tsx     ← Single polygon overlay with opacity logic
```

### Key Component Interfaces

```typescript
// MuscleHighlighter
interface MuscleHighlighterProps {
  muscles: string[];           // primary muscles (highlighted color 1)
  musclesSecondary?: string[]; // secondary muscles (highlighted color 2)
  mode?: 'front' | 'back';
  onToggleView?: () => void;
}

// RouteMap
interface RouteMapProps {
  coordinates: Coordinate[];
  isRecording?: boolean;
  friendTerritories?: TerritoryClaim[];
}

// NutritionDisplay
interface NutritionDisplayProps {
  meal: Pick<Meal, 'calories' | 'protein_g' | 'fat_g' | 'carbs_g' | 'fiber_g'>;
  dailyGoals: { calories: number; protein_g: number; fat_g: number; carbs_g: number };
}

// FoodScanner
interface FoodScannerProps {
  onScanComplete: (result: NutritionScanResult) => void;
  onError: (message: string) => void;
}

// LeaderboardRow
interface LeaderboardRowProps {
  entry: LeaderboardEntry & { profile: Pick<Profile, 'full_name' | 'avatar_url'> };
  rank: number;
  isCurrentUser: boolean;
}
```

---

## Data Models

### Database Schema (Supabase PostgreSQL)

All tables are defined in `supabase/migrations/001_initial_schema.sql`. Key tables:

| Table | Purpose |
|-------|---------|
| `profiles` | Extends `auth.users` with biometrics, goals, streak, onboarding flag |
| `exercises` | Seeded exercise catalog (ExerciseDB data + local seed) |
| `workouts` | User exercise logs: sets, reps, weight, duration |
| `meals` | Cal AI food logs: macros, image_url, ai_confidence, meal_type |
| `routes` | GPS routes: coordinates JSONB, distance, duration, activity_type |
| `daily_steps` | Daily step aggregation: steps, distance_km, calories_burned |
| `leaderboard_entries` | Monthly points breakdown per user (UNIQUE user_id + month) |
| `friendships` | Bidirectional friend graph with status: pending/accepted/blocked |
| `achievements` | Achievement catalog (seeded) |
| `user_achievements` | Unlocked achievements per user |
| `territory_claims` | Convex hull polygons from completed routes |
| `challenges` | Head-to-head activity competitions |
| `chat_messages` | AI Trainer Chat history (role: user/assistant) |
| `fitness_scores` | Daily Fitness Score snapshots (300–850) |
| `streak_freezes` | Purchased streak freeze tokens |
| `activity_feed` | Social feed events |

### TypeScript Domain Types

All types are defined in `types/database.ts`. Key additions needed:

```typescript
// Nutrition scan result from Edge Function
interface NutritionScanResult {
  food_name: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  portion_size: string;
  confidence: number;  // 0–1
}

// Meal grade computation result
type MealGrade = 'A+' | 'A' | 'B' | 'C' | 'D';

interface MealGradeResult {
  grade: MealGrade;
  proteinRatio: number;  // protein_g / calories
  fatRatio: number;      // fat_g / calories
}

// Territory opacity computation
interface TerritoryRenderData {
  polygon: Coordinate[];
  opacity: number;       // 0.1–0.8, proportional to visit_count
  isOwn: boolean;
  isFriend: boolean;
}

// Fitness Score breakdown
interface FitnessScoreBreakdown {
  total: number;         // 300–850
  workoutComponent: number;
  stepsComponent: number;
  mealComponent: number;
  routeComponent: number;
}

// Report Card aggregate
interface ReportCardData {
  weekStart: string;
  weekEnd: string;
  totalSteps: number;
  totalCalories: number;
  workoutsCompleted: number;
  totalKm: number;
  currentStreak: number;
  fitnessScore: number;
  musclesTrainedThisWeek: string[];
}
```

---

## Supabase Edge Functions Design

### 1. `ai-food-scan` — Cal AI Nutrition Analyzer

**Path:** `supabase/functions/ai-food-scan/index.ts`

**Trigger:** POST from client with base64-encoded image

**Request body:**
```typescript
{ image_base64: string; mime_type: 'image/jpeg' | 'image/png' }
```

**Response body:**
```typescript
{
  food_name: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  portion_size: string;
  confidence: number;
  error?: string;
}
```

**Internal flow:**
1. Validate JWT from `Authorization` header via Supabase Auth
2. Construct GPT-4o Vision prompt requesting structured JSON with all required nutrition fields
3. Call `https://api.openai.com/v1/chat/completions` with `gpt-4o` model, image in `image_url` content block
4. Parse and validate JSON response — if any required field is missing, return `{ error: 'incomplete_response' }`
5. Return structured nutrition data to client

**Security:** `OPENAI_API_KEY` is a Supabase secret, never in response or logs.

---

### 2. `ai-trainer-chat` — AI Personal Trainer

**Path:** `supabase/functions/ai-trainer-chat/index.ts`

**Trigger:** POST from client with message + user context

**Request body:**
```typescript
{
  message: string;
  context: {
    profile: Pick<Profile, 'fitness_goal' | 'activity_level' | 'dietary_preference' | 'weight_kg' | 'height_cm'>;
    recentMeals: Meal[];       // last 7 days
    recentWorkouts: Workout[]; // last 7 days
    currentStreak: number;
    dailyGoals: { calories: number; protein_g: number };
  };
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}
```

**Internal flow:**
1. Validate JWT
2. Build system prompt with user context (goal, level, dietary preference, recent activity)
3. Append conversation history + new user message
4. Call GPT-4o with `max_tokens: 500`
5. Return assistant response text

---

### 3. `meal-swap` — Smart Meal Swap Suggestion

**Path:** `supabase/functions/meal-swap/index.ts`

**Trigger:** POST when a meal receives grade C or D

**Request body:**
```typescript
{
  meal: Pick<Meal, 'food_name' | 'calories' | 'protein_g' | 'fat_g' | 'carbs_g'>;
  userGoal: Profile['fitness_goal'];
  dailyCalorieGoal: number;
}
```

**Response body:**
```typescript
{
  alternative_name: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}
```

---

## State Management

### Zustand Stores (client state)

```typescript
// stores/authStore.ts
interface AuthStore {
  session: Session | null;
  profile: Profile | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  clearAuth: () => void;
}

// stores/trackingStore.ts
interface TrackingStore {
  isRecording: boolean;
  coordinates: Coordinate[];
  elapsedSeconds: number;
  distanceKm: number;
  currentPace: number;
  activityType: 'run' | 'walk' | 'cycle';
  startRecording: (type: 'run' | 'walk' | 'cycle') => void;
  addCoordinate: (coord: Coordinate) => void;
  stopRecording: () => Coordinate[];
  reset: () => void;
}

// stores/stepStore.ts (new)
interface StepStore {
  todaySteps: number;
  goalReached: boolean;
  setSteps: (steps: number) => void;
}

// stores/calAiStore.ts (new)
interface CalAiStore {
  pendingScan: NutritionScanResult | null;
  setPendingScan: (result: NutritionScanResult | null) => void;
}
```

### React Query Keys and Hooks

```typescript
// Query key factory
const queryKeys = {
  exercises: () => ['exercises'],
  exerciseById: (id: number) => ['exercises', id],
  meals: (date: string) => ['meals', date],
  routes: () => ['routes'],
  routeById: (id: string) => ['routes', id],
  leaderboard: (month: string) => ['leaderboard', month],
  friendsLeaderboard: (month: string) => ['leaderboard', 'friends', month],
  profile: (userId: string) => ['profile', userId],
  territory: (userId: string) => ['territory', userId],
  chatHistory: () => ['chat'],
  fitnessScores: (userId: string) => ['fitnessScores', userId],
  weeklySteps: (userId: string) => ['weeklySteps', userId],
};

// Key hooks
// hooks/useExercises.ts  — fetches + caches ExerciseDB data, exposes filter fn
// hooks/useCalAi.ts      — manages scan flow, calls Edge Function
// hooks/useRouteTracker.ts — wraps trackingStore + expo-location
// hooks/useSteps.ts      — wraps expo-sensors Pedometer
// hooks/useLeaderboard.ts — React Query + Supabase Realtime subscription
// hooks/useTerritory.ts  — fetches own + friend territories
// hooks/useStreak.ts     — reads/updates streak from profiles table
// hooks/useFitnessScore.ts — computes and persists daily score
```

---

## Key Algorithms

### 1. Haversine Distance Formula

Used in `lib/utils.ts` to compute GPS route distance from coordinate pairs.

```
R = 6371 km (Earth radius)
Δlat = lat2 - lat1 (radians)
Δlng = lng2 - lng1 (radians)
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)
c = 2 × atan2(√a, √(1−a))
distance = R × c
```

Total route distance = sum of Haversine distances between consecutive coordinate pairs.

### 2. Territory Convex Hull (via @turf/turf)

After a route is saved, the Territory Engine:
1. Extracts `[lng, lat]` pairs from the route's `coordinates` JSONB array
2. Creates a GeoJSON `FeatureCollection` of `Point` features
3. Calls `turf.convex(featureCollection)` to compute the convex hull polygon
4. Computes area via `turf.area(convexHull)` → converts m² to km²
5. Upserts into `territory_claims` with the polygon JSONB and `area_sq_meters`

**Opacity calculation for repeated visits:**
```
opacity = min(0.1 + (visit_count - 1) × 0.1, 0.8)
```
Visit count 1 → opacity 0.1, visit count 8+ → opacity 0.8 (capped).

### 3. Fitness Score Formula

```
score = clamp(
  300 + (workout_points × 0.4) + (steps_points × 0.3) + (meal_points × 0.2) + (route_points × 0.1),
  300,
  850
)
```

Where each `*_points` value is the user's accumulated points in that category for the current month.

### 4. Points Engine Rules

| Activity | Points |
|----------|--------|
| 1,000 steps | 1 pt |
| Completed workout | 10 pts |
| Logged meal | 5 pts |
| 1 km of route | 1 pt |
| Consecutive streak day | 5 pts bonus |

Implemented in `lib/pointsEngine.ts` as pure functions. The `recalculate_leaderboard` PostgreSQL function (in migration 002) recomputes totals server-side on demand.

### 5. Meal Grade Algorithm

```
proteinRatio = protein_g / calories        // higher is better
fatRatio = fat_g / calories                // lower is better

grade:
  A+: proteinRatio >= 0.15 AND fatRatio <= 0.25
  A:  proteinRatio >= 0.12 AND fatRatio <= 0.30
  B:  proteinRatio >= 0.08 AND fatRatio <= 0.40
  C:  proteinRatio >= 0.05 OR  fatRatio <= 0.50
  D:  otherwise
```

Grades C and D trigger the Smart Meal Swap Edge Function call.

### 6. Step-Derived Metrics

```
distance_km = steps × 0.000762   (76.2 cm average stride)
calories_burned = steps × 0.04   (approximate kcal per step)
```

Both are pure functions in `lib/utils.ts`.

---

## Data Flow Diagrams

### Cal AI Scan Flow

```
User taps "Scan Food"
        │
        ▼
FoodScanner component
  ├── Camera capture (expo-camera)
  └── Gallery pick (expo-image-picker)
        │
        ▼
base64-encode image (client)
        │
        ▼
POST /functions/v1/ai-food-scan
  { image_base64, mime_type }
  + Authorization: Bearer <supabase_jwt>
        │
        ▼
Edge Function: ai-food-scan
  1. Verify JWT
  2. Build GPT-4o Vision prompt
  3. POST → OpenAI API (OPENAI_API_KEY secret)
  4. Parse JSON response
  5. Validate required fields
        │
        ├── Missing fields → { error: 'incomplete_response' }
        │         │
        │         ▼
        │   App shows "Could not identify food. Please try a clearer photo."
        │
        └── Success → NutritionScanResult
                  │
                  ▼
        calAiStore.setPendingScan(result)
                  │
                  ▼
        NutritionDisplay (animated macro bars)
                  │
                  ▼
        User confirms meal
                  │
                  ▼
        supabase.from('meals').insert(...)
        + Points Engine: +5 pts
        + Meal Grade calculation
                  │
                  ├── Grade C/D → POST /functions/v1/meal-swap
                  │              → Display swap suggestion
                  │
                  └── Update leaderboard_entries (upsert)
```

### Route Tracking Flow

```
User taps "Start" (selects run/walk/cycle)
        │
        ▼
expo-location.requestForegroundPermissionsAsync()
  ├── Denied → Show error, disable Start
  └── Granted → trackingStore.startRecording()
                  │
                  ▼
        expo-location.watchPositionAsync(
          { accuracy: High, timeInterval: 5000 }
        )
                  │
                  ▼ (every 5s)
        trackingStore.addCoordinate({ lat, lng, timestamp })
        + Haversine distance update
        + Pace calculation (distance / elapsed minutes)
        + RouteMap Polyline re-render
                  │
        User taps "Stop"
                  │
                  ▼
        trackingStore.stopRecording() → coordinates[]
                  │
                  ▼
        supabase.from('routes').insert({
          activity_type, distance_km, duration_seconds,
          coordinates, started_at, ended_at
        })
                  │
                  ▼
        Territory Engine (client-side, post-save)
          turf.convex(coordinates) → polygon
          turf.area(polygon) → area_sq_meters
          supabase.from('territory_claims').upsert(...)
                  │
                  ▼
        Points Engine: +1 pt per km
        leaderboard_entries upsert
                  │
                  ▼
        Navigate to route/[id] detail screen
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Coordinate Serialization Round-Trip

*For any* valid array of `{ lat, lng, timestamp }` coordinate objects, serializing the array to JSON and then deserializing it back should produce an array of equal length where each element has identical `lat`, `lng`, and `timestamp` values to the original.

**Validates: Requirements 16.1, 16.2, 16.3**

---

### Property 2: Territory Polygon Serialization Round-Trip

*For any* valid GeoJSON Polygon geometry object, serializing it to JSON and then deserializing it should produce a polygon with coordinate arrays identical to the original.

**Validates: Requirements 16.4, 16.5**

---

### Property 3: Step-Derived Metrics Follow Their Formulas

*For any* non-negative integer step count `n`, the computed `distance_km` must equal `n × 0.000762` and the computed `calories_burned` must equal `n × 0.04`, both rounded to 2 decimal places.

**Validates: Requirements 5.5, 5.6**

---

### Property 4: Points Engine Correctness

*For any* combination of step count, workout count, meal count, route distance (km), and streak days, the total points computed by the Points Engine must equal `floor(steps/1000) + (workouts × 10) + (meals × 5) + floor(km) + (streakDays × 5)`.

**Validates: Requirements 8.1, 8.2**

---

### Property 5: Fitness Score Formula and Bounds

*For any* set of monthly point values (workout_points, steps_points, meal_points, route_points), the Fitness Score must equal `clamp(300 + workout_points×0.4 + steps_points×0.3 + meal_points×0.2 + route_points×0.1, 300, 850)`. The score must never be below 300 or above 850.

**Validates: Requirements 11.5**

---

### Property 6: Haversine Distance Non-Negativity and Symmetry

*For any* two GPS coordinates A and B, the Haversine distance from A to B must equal the Haversine distance from B to A (symmetry), and must be ≥ 0 (non-negativity). For identical coordinates, the distance must be 0.

**Validates: Requirements 6.3**

---

### Property 7: Exercise Filter Returns Only Matching Results

*For any* exercise list and any search query (by name, muscle group, or equipment), every exercise in the filtered result must satisfy the search predicate, and no exercise satisfying the predicate must be absent from the result.

**Validates: Requirements 3.2**

---

### Property 8: Convex Hull Contains All Route Points

*For any* route coordinate array with at least 3 distinct points, the convex hull polygon computed by `@turf/turf` must contain all original coordinate points (i.e., every point lies on or inside the polygon boundary).

**Validates: Requirements 7.1**

---

### Property 9: Territory Opacity Proportional to Visit Count and Capped

*For any* visit count `v ≥ 1`, the computed territory polygon opacity must equal `min(0.1 + (v - 1) × 0.1, 0.8)`. The opacity must never exceed 0.8 regardless of visit count.

**Validates: Requirements 7.3**

---

### Property 10: Streak State Machine Correctness

*For any* sequence of calendar days, the streak count after processing the sequence must equal the length of the longest suffix of consecutive active days ending at the most recent day. If the most recent day is inactive and no freeze/shield is held, the streak must be 0.

**Validates: Requirements 9.1, 9.3**

---

### Property 11: Streak Freeze Limit Enforced

*For any* user holding 2 active (unused) streak freezes, attempting to purchase a third freeze must be rejected and the user's point balance must remain unchanged.

**Validates: Requirements 9.4**

---

### Property 12: Daily Nutrition Totals Equal Sum of Logged Meals

*For any* set of meals logged on a given day, the displayed daily totals for calories, protein_g, fat_g, and carbs_g must each equal the arithmetic sum of the corresponding field across all meals logged that day. The remaining gap for each macro must equal `dailyGoal - total`.

**Validates: Requirements 4.8, 15.4**

---

### Property 13: Meal Grade Determinism

*For any* meal with defined `calories`, `protein_g`, and `fat_g` values, the computed grade must be deterministic: the same inputs always produce the same grade, and the grade must follow the defined protein-ratio / fat-ratio thresholds.

**Validates: Requirements 15.1**

---

### Property 14: Nutrition Response Validation Rejects Incomplete Data

*For any* JSON response from the Nutrition_Analyzer Edge Function that is missing one or more of the required fields (`food_name`, `calories`, `protein_g`, `fat_g`, `carbs_g`), the client must not save the meal to the database and must display the retry error message.

**Validates: Requirements 16.6, 4.7**

---

### Property 15: Leaderboard Ordering Invariant

*For any* set of leaderboard entries for a given month, the entries returned by the leaderboard query must be sorted in descending order by `total_points`, and the top-10 slice must contain exactly the 10 entries with the highest point totals (or all entries if fewer than 10 exist).

**Validates: Requirements 8.3**

---

### Property 16: Friends Leaderboard Filters to Friends Only

*For any* user and their accepted friends list, every entry in the friends leaderboard view must correspond to either the current user or a user in their accepted friends list. No entry from outside this set must appear.

**Validates: Requirements 8.6**

---

### Property 17: Friend Stat Comparison Win/Loss Correctness

*For any* two users A and B and any of the 6 stat categories (points, steps, workouts, meals, km, streak), the win/loss indicator for user A must show "win" if and only if A's value strictly exceeds B's value in that category.

**Validates: Requirements 8.7, 10.5**

---

### Property 18: Profile Update Round-Trip

*For any* valid profile field update (name, height, weight, goal, activity level, dietary preference, step goal, calorie goal), saving the update to Supabase and then fetching the profile must return the updated values.

**Validates: Requirements 11.2**

---

### Property 19: Achievement Unlock Threshold Correctness

*For any* achievement with a defined `requirement_type` and `requirement_value`, a user whose cumulative stat for that type meets or exceeds the requirement value must have the achievement unlocked, and a user whose stat is strictly below the threshold must not have it unlocked.

**Validates: Requirements 11.4**

---

### Property 20: Report Card Aggregation Correctness

*For any* 7-day window, the Report Card's aggregated `totalSteps`, `totalCalories`, `workoutsCompleted`, and `totalKm` must each equal the sum of the corresponding daily values across all 7 days in the window.

**Validates: Requirements 13.1**

---

### Property 21: RLS Data Isolation

*For any* two distinct authenticated users A and B, user A must not be able to read or write rows in `workouts`, `meals`, `routes`, `daily_steps`, `chat_messages`, or `fitness_scores` where `user_id = B.id`.

**Validates: Requirements 2.7**

---

### Property 22: Chat Message Persistence Round-Trip

*For any* chat message (role + content), saving it to `chat_messages` and then fetching the user's chat history must include a message with identical role and content.

**Validates: Requirements 14.5**

---

## Error Handling

### Network / Supabase Errors

All React Query hooks use `onError` callbacks that dispatch to a global toast notification system. Errors are categorized:

| Error Type | User-Facing Message | Recovery |
|-----------|---------------------|----------|
| Auth session expired | "Session expired. Please log in again." | Redirect to login |
| Network timeout | "Connection issue. Check your internet." | Retry button |
| Supabase RLS violation | "You don't have permission to do that." | Silent log |
| Duplicate email on signup | "An account with this email already exists." | Show on form |
| Invalid credentials | "Invalid email or password." | Show on form |

### Cal AI Errors

| Condition | Message | Action |
|-----------|---------|--------|
| Non-food image detected | "Could not identify food. Please try a clearer photo." | Allow retake |
| Edge Function timeout | "Scan timed out. Please try again." | Allow retry |
| Missing required fields in response | "Could not identify food. Please try a clearer photo." | Allow retake |
| Barcode not found in Open Food Facts | Silent fallback to GPT-4o Vision scan | Automatic |

### GPS / Location Errors

| Condition | Message | Action |
|-----------|---------|--------|
| Permission denied | "Location permission is required for route tracking." | Disable Start button |
| GPS signal lost mid-route | "GPS signal lost. Route may be incomplete." | Continue recording, mark gap |
| Device does not support Pedometer | "Step tracking is not available on this device." | Hide step counter widget |

### Onboarding Validation

Required fields: full_name, age, gender, height_cm, weight_kg, fitness_goal, activity_level, dietary_preference, daily_step_goal, daily_calorie_goal.

If any required field is empty when the user attempts to advance, an inline validation message appears below the field and navigation is blocked. The `StepIndicator` does not advance.

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:

- **Unit tests** catch concrete bugs with specific examples, edge cases, and integration points
- **Property tests** verify universal correctness across all valid inputs via randomization

### Unit Tests (specific examples and edge cases)

Focus areas:
- Onboarding step count is ≥ 5 (example)
- Onboarding skipped when `onboarding_completed = true` (example)
- Correct error messages for duplicate email and invalid credentials (examples)
- Barcode lookup falls back to vision scan on 404 (example)
- Step goal celebration triggers at exactly `steps >= dailyStepGoal` (example)
- Location permission denial disables Start button (example)
- Streak milestone awards Streak Shield at days 7, 30, 60, 100 (example)
- Quick-reply chips contain all 4 required options (example)
- Fitness Score trend chart contains exactly 7 data points (example)
- Swap suggestion is triggered for grades C and D, not A+/A/B (example)

### Property-Based Tests

**Library:** `fast-check` (TypeScript-native, works with Jest/Vitest)

**Configuration:** Minimum 100 runs per property (`numRuns: 100` in `fc.assert`).

Each property test must include a comment tag in the format:
`// Feature: oxzifit-app, Property {N}: {property_text}`

**Property test file locations:**

| Property | Test File |
|----------|-----------|
| 1 — Coordinate serialization round-trip | `__tests__/serialization.test.ts` |
| 2 — Territory polygon serialization round-trip | `__tests__/serialization.test.ts` |
| 3 — Step-derived metrics formulas | `__tests__/stepMetrics.test.ts` |
| 4 — Points Engine correctness | `__tests__/pointsEngine.test.ts` |
| 5 — Fitness Score formula and bounds | `__tests__/fitnessScore.test.ts` |
| 6 — Haversine symmetry and non-negativity | `__tests__/haversine.test.ts` |
| 7 — Exercise filter correctness | `__tests__/exerciseFilter.test.ts` |
| 8 — Convex hull contains all route points | `__tests__/territory.test.ts` |
| 9 — Territory opacity proportional and capped | `__tests__/territory.test.ts` |
| 10 — Streak state machine correctness | `__tests__/streak.test.ts` |
| 11 — Streak freeze limit enforced | `__tests__/streak.test.ts` |
| 12 — Daily nutrition totals and gaps | `__tests__/nutrition.test.ts` |
| 13 — Meal grade determinism | `__tests__/mealGrade.test.ts` |
| 14 — Nutrition response validation | `__tests__/calAi.test.ts` |
| 15 — Leaderboard ordering invariant | `__tests__/leaderboard.test.ts` |
| 16 — Friends leaderboard filters correctly | `__tests__/leaderboard.test.ts` |
| 17 — Friend stat comparison win/loss | `__tests__/friendCompare.test.ts` |
| 18 — Profile update round-trip | `__tests__/profile.test.ts` |
| 19 — Achievement unlock threshold | `__tests__/achievements.test.ts` |
| 20 — Report card aggregation | `__tests__/reportCard.test.ts` |
| 21 — RLS data isolation | `__tests__/rls.test.ts` (integration) |
| 22 — Chat message persistence round-trip | `__tests__/chat.test.ts` |

### Example Property Test (Property 3)

```typescript
// Feature: oxzifit-app, Property 3: step-derived metrics follow their formulas
import * as fc from 'fast-check';
import { calculateStepDistance, calculateStepCalories } from '../lib/utils';

test('step distance and calories follow their formulas', () => {
  fc.assert(
    fc.property(fc.integer({ min: 0, max: 1_000_000 }), (steps) => {
      const distance = calculateStepDistance(steps);
      const calories = calculateStepCalories(steps);
      expect(distance).toBeCloseTo(steps * 0.000762, 2);
      expect(calories).toBeCloseTo(steps * 0.04, 2);
    }),
    { numRuns: 100 }
  );
});
```

### Example Property Test (Property 5)

```typescript
// Feature: oxzifit-app, Property 5: fitness score formula and bounds
import * as fc from 'fast-check';
import { calculateFitnessScore } from '../lib/fitnessScore';

test('fitness score is always between 300 and 850', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 10000 }),
      fc.integer({ min: 0, max: 10000 }),
      fc.integer({ min: 0, max: 10000 }),
      fc.integer({ min: 0, max: 10000 }),
      (workoutPts, stepsPts, mealPts, routePts) => {
        const score = calculateFitnessScore({ workoutPts, stepsPts, mealPts, routePts });
        expect(score).toBeGreaterThanOrEqual(300);
        expect(score).toBeLessThanOrEqual(850);
        const expected = Math.min(850, Math.max(300,
          300 + workoutPts * 0.4 + stepsPts * 0.3 + mealPts * 0.2 + routePts * 0.1
        ));
        expect(score).toBeCloseTo(expected, 1);
      }
    ),
    { numRuns: 100 }
  );
});
```
