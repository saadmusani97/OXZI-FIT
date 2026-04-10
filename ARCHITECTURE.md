# OXZIFIT - Architecture & Tech Stack

## Project Overview
OXZIFIT is an all-in-one fitness application combining:
- **Exercise Library** with 3D muscle highlighting
- **Cal AI** (food photo → nutrition detection)
- **Route Tracking** (built-from-scratch GPS tracking with maps)
- **Steps Tracking** (built-from-scratch pedometer)
- **Leaderboard & Social** (competitive ranking)
- **Territory Map** (claim running areas like Pokémon GO)
- **Duolingo-Style Streaks** (gamification with streak freezes)
- **AI Trainer Chat** (GPT-4o fitness assistant)
- **Smart Meal Swap** (healthier food alternatives after scan)
- **Fitness Credit Score** (universal fitness discipline score)
- **AI Injury Prediction** (preventive health intelligence)

---

## Tech Stack

### Core Framework
| Layer | Technology | Why |
|-------|-----------|-----|
| **Mobile App** | React Native + Expo (SDK 52+) | Cross-platform iOS/Android, your preference |
| **Language** | TypeScript (strict mode) | Type safety, future-proof |
| **Navigation** | Expo Router (file-based) | Native navigation, deep linking |
| **State Management** | Zustand + React Query | Lightweight, server state + client state |
| **Styling** | NativeWind (Tailwind for RN) | Fast prototyping, consistent design |
| **Backend** | Supabase | Auth, DB, Storage, Edge Functions - all in one |

### Backend (Supabase)
| Service | Use Case |
|---------|----------|
| **Supabase Auth** | User authentication (email, Google, Apple) |
| **Supabase DB (PostgreSQL)** | Users, workouts, meals, routes, leaderboard |
| **Supabase Storage** | User photos, exercise assets |
| **Supabase Edge Functions** | AI API proxy, leaderboard cron |
| **Supabase Realtime** | Live leaderboard updates |

---

## Feature-by-Feature Tech Decisions

### 1. Cal AI - Food Nutrition Detection

**Recommended Approach: OpenAI GPT-4o Vision API**

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **OpenAI GPT-4o Vision** (RECOMMENDED) | Best accuracy, structured JSON output, easy integration, detects ALL nutrition | Paid API (~$0.01/image) | $5 free credits on signup |
| **LogMeal API** | Purpose-built for food, free tier (1000 req/mo) | Limited nutrition data | Free tier available |
| **CalorieScan (YOLOv8+SAM+MiDaS)** | Open source, self-hostable | Needs server, less accurate | Free |
| **FatSecret Image Recognition** | Good API | Paid, limited free tier | Freemium |

**Implementation Flow:**
```
Camera/Photo → Base64 encode → Supabase Edge Function → OpenAI GPT-4o Vision
→ JSON response {food, calories, protein, fat, carbs, portion_size}
→ Store in Supabase DB → Display with 3D visualization
```

**Why OpenAI GPT-4o Vision:**
- Single API call returns structured nutrition data
- No need for separate food detection + nutrition lookup
- Understands Indian/international cuisines
- Returns JSON directly: `{ "food": "biryani", "calories": 450, "protein": 22, "fat": 18, "carbs": 52 }`
- Free $5 credits on new accounts (~500 food scans)

**Backup Free Option:** LogMeal API (1000 free requests/month)

---

### 2. Exercise Library with 3D Muscle Highlighting

**Recommended: react-native-body-highlighter + static 3D exercise GIFs**

| Component | Technology | Notes |
|-----------|-----------|-------|
| **Muscle Highlighter** | `react-native-body-highlighter` (199★, MIT) | SVG-based, works perfectly in Expo, highlights muscle groups per exercise |
| **3D Exercise Models** | Lottie animations OR pre-rendered GIFs from GymVisual | Avoid GLB/GLTF in RN (broken in Expo Go) |
| **Exercise Database** | Supabase DB with pre-seeded 1000+ exercises | Free exercise data from wger.de API |

**Why NOT React Three Fiber for exercises:**
- GLB/GLTF loading is broken in Expo Go (multiple GitHub issues)
- Too heavy for a hackathon timeline
- SVG muscle highlighting + Lottie animations achieve 90% of the visual impact

**Exercise Data Source (Free):**
- **wger.de API** - Open source exercise database with 2000+ exercises
- **ExerciseDB** (via RapidAPI free tier) - 1300+ exercises with muscle groups

**Muscle Highlighting Library:**
```bash
npm install react-native-body-highlighter
```
- 400+ muscle groups
- Color-coded intensity (how much muscle is used)
- Front + back body view
- Works perfectly in Expo

---

### 3. Steps Tracking

**Recommended: expo-sensors Pedometer + Google Health Connect (Android) + Apple HealthKit (iOS)**

| Platform | Solution | Notes |
|----------|----------|-------|
| **iOS** | Apple HealthKit via `expo-health-kit` | Native step counter |
| **Android** | Google Health Connect via `react-native-health-connect` | Replaces Google Fit |
| **Fallback** | `expo-sensors` Pedometer | Basic accelerometer-based counting |

**Implementation:**
```
Expo Pedometer (background) → Step count → Supabase DB
→ Daily/weekly/monthly aggregation → Leaderboard points
```

**Key Libraries:**
- `expo-sensors` (Pedometer) - built into Expo
- `react-native-health-connect` - Android Health Connect
- `expo-health-kit` - iOS HealthKit

**Important Notes:**
- Google Fit API is deprecated → use Health Connect instead
- Background step tracking requires EAS Build (not Expo Go)
- For hackathon demo: use `expo-sensors` Pedometer (works in Expo Go)

---

### 4. Route Tracking (Built From Scratch)

**Recommended: react-native-maps + expo-location + Supabase**

| Component | Technology | Notes |
|-----------|-----------|-------|
| **Maps** | `react-native-maps` (Google Maps / Apple Maps) | Free tier, native performance |
| **GPS Tracking** | `expo-location` (background location) | Foreground + background tracking |
| **Route Storage** | Supabase DB (JSONB coordinates) | Store lat/lng arrays as JSONB |
| **Route Visualization** | Polyline on MapView | Draw user's path on map |
| **3D Area Coverage** | Polygon overlay on map | Visual boundary of area covered |
| **Distance Calculation** | Haversine formula (custom) | Accurate GPS distance |
| **Pace Tracking** | Custom calculation | Real-time pace per km |

**Route Tracking Flow:**
```
Start Run → expo-location watchPositionAsync() →
Store coordinates in array →
Draw Polyline on MapView →
Calculate distance via Haversine formula →
Save route JSONB to Supabase →
Display polygon of covered area on map
```

**For 3D Route Visualization:**
- Use `react-native-maps` Polygon overlay with semi-transparent fill
- Shows the "area the user ruled" on the map
- Optional: elevation data from Google Elevation API (free tier: 2500 req/day)

---

### 5. 3D Nutrition Visualization (AR-style)

**Recommended: Lottie animations + Animated bars (NOT AR)**

| Approach | Technology | Feasibility |
|----------|-----------|-------------|
| **Animated Nutrition Bars** | Lottie + React Native Animated | High - works everywhere |
| **3D Nutrition Pills** | `react-native-reanimated` + custom shapes | Medium |
| **AR Food Scanner** | ViroReact (React Native AR) | Low - complex, hackathon unrealistic |

**Why skip AR for hackathon:**
- ARKit/ARCore require custom native builds
- Too much setup for 3-day hackathon
- Animated 3D-style bars achieve similar visual impact

**Alternative: 3D Food Visualization**
- Use Lottie animations with food/nutrition themes
- Animated protein/fat/carb bars with `react-native-reanimated`
- 3D-style progress rings using `react-native-circular-progress`

---

### 6. Onboarding Flow

**Recommended: Custom onboarding with `react-native-reanimated`**

| Component | Technology |
|-----------|-----------|
| **Multi-step Form** | Custom screens with Expo Router |
| **Animations** | `react-native-reanimated` + `react-native-gesture-handler` |
| **User Data Collected** | Age, gender, height, weight, fitness goal, activity level, dietary preferences |
| **Storage** | Supabase Auth (user_metadata) + profiles table |

**Data to Collect:**
```
- Name, Age, Gender
- Height (cm), Weight (kg)
- Fitness Goal: lose weight / gain muscle / maintain / endurance
- Activity Level: sedentary / light / moderate / active / very active
- Dietary Preference: veg / non-veg / vegan / keto
- Daily Step Goal
- Daily Calorie Goal
- Preferred Workout Types
- Experience Level: beginner / intermediate / advanced
```

---

### Leaderboard & Social System

**Recommended: Supabase Realtime + Custom Leaderboard**

| Component | Technology |
|-----------|-----------|
| **Leaderboard** | Supabase DB with points system |
| **Real-time Updates** | Supabase Realtime subscriptions |
| **Friend Comparison** | Supabase DB (friends table + comparison view) |
| **Achievements** | Supabase DB (achievements + unlock logic) |
| **Monthly Rewards** | Supabase Edge Function (cron job) |

**Points System:**
```
Steps: 1 point per 1000 steps
Workouts: 10 points per workout completed
Meal Logging: 5 points per meal logged
Route Tracking: 1 point per km ran/cycled
Streaks: 5 bonus points per consecutive day
```

**Leaderboard Schema:**
```sql
leaderboard_entries:
  - user_id (FK)
  - month (YYYY-MM)
  - total_points
  - steps_points
  - workout_points
  - meal_points
  - route_points
  - streak_points
  - rank (computed)

achievements:
  - id
  - name (e.g., "First 10K Steps", "Marathon Runner")
  - description
  - icon_url
  - points_required

user_achievements:
  - user_id (FK)
  - achievement_id (FK)
  - unlocked_at

friend_comparisons:
  - user_id_1 (FK)
  - user_id_2 (FK)
  - comparison_data (JSONB)
  - winner_user_id
```

---

## Hackathon Standout Features

These features differentiate OXZIFIT from every other fitness app at the hackathon.

### 8. Territory Map

Like Pokémon GO but for running. Every time a user runs/walks a route, they **claim that area on the map**. Over time, the map fills with colored territory showing everywhere they've been.

| Component | Technology | Notes |
|-----------|-----------|-------|
| **Territory Storage** | Supabase DB (JSONB polygon data) | Store claimed area boundaries |
| **Map Visualization** | `react-native-maps` Polygon overlays | Semi-transparent colored zones |
| **Territory Calculation** | Convex hull algorithm | Simplify route polygon to boundary |
| **Color Intensity** | Opacity based on visit count | More visits = darker color |
| **Friend Territory** | Overlay friend territories | Compete for map ownership |

**Implementation:**
```
Complete route → Extract coordinates →
Generate convex hull polygon →
Store in Supabase territory_claims table →
Render as Polygon overlay on MapView →
Color intensity = visit count for that area
```

**Why it wins:** No fitness app does this. Visually jaw-dropping in a demo.

---

### 9. Duolingo-Style Streak System

Gamification system modeled after Duolingo's proven engagement model.

| Feature | Description |
|---------|-------------|
| **Daily Streak** | Consecutive days with any activity (workout, steps, meal log) |
| **Streak Freeze** | Spend earned points to protect a missed day (max 2 freezes) |
| **Streak Shield** | Earned at 7-day, 30-day milestones |
| **Double XP Days** | Random days with 2x point multiplier |
| **Streak Leaderboard** | Rank friends by streak length |
| **Celebration Animations** | Lottie confetti + fire animations on milestones |

**Streak Rules:**
```
- Log ANY activity (workout, meal, steps, route) = streak maintained
- Miss midnight without activity = streak broken
- Streak Freeze: costs 50 points, protects 1 missed day
- Streak Shield: free protection earned at milestones
- Double XP: random 1-2 days per week
```

---

### 10. AI Trainer Chat

In-app chatbot powered by GPT-4o that acts as a personal trainer.

| Capability | Example Prompt |
|-----------|---------------|
| **Fitness Q&A** | "What should I eat after leg day?" |
| **Data Review** | "How was my nutrition this week?" (reads your meals) |
| **Workout Generation** | "Give me a 30-min chest workout with dumbbells" |
| **Motivation** | "I don't feel like working out today" |
| **Meal Suggestions** | "I need 40g more protein today, what should I eat?" |

**Implementation:**
```
User types message → Supabase Edge Function →
OpenAI GPT-4o with user context (profile, recent meals, workouts, streak) →
Personalized response → Display in chat UI
```

**Context sent to GPT-4o:**
- User profile (goal, level, dietary preference)
- Last 7 days of meals + nutrition totals
- Last 7 days of workouts
- Current streak
- Daily goals vs actuals

---

### 11. Smart Meal Swap

After scanning food with Cal AI, the app suggests healthier alternatives.

| Feature | Description |
|---------|-------------|
| **Meal Rating** | A+ to D grade based on macros vs daily goals |
| **Swap Suggestions** | Healthier alternative with similar taste |
| **Gap Analysis** | "You need 45g more protein today" |
| **Next Meal Suggestion** | "For dinner, eat grilled chicken salad" |

**Example Flow:**
```
Scan: Burger (650 cal, 30g protein, 35g fat, 50g carbs)
→ Rating: C+ (high fat, low protein)
→ Swap: Grilled chicken wrap (380 cal, 42g protein, 12g fat, 35g carbs)
→ You still need: 25g protein, 8g fiber today
```

---

### 12. Animated Shareable Report Card

Weekly auto-generated animated summary card for social media.

| Data Point | Visualization |
|-----------|---------------|
| Total Steps | Animated counter + progress ring |
| Calories Tracked | Pie chart (protein/fat/carbs) |
| Workouts Completed | Muscle heatmap of trained areas |
| Routes Covered | Mini territory map |
| Streak | Fire animation with day count |
| Fitness Credit Score | Gauge with trend arrow |
| Rank Among Friends | Position with comparison |

**Tech:** Lottie animations + `react-native-view-shot` for screenshot → share to Instagram Stories.

---

### 13. Food Barcode Scanner

Scan packaged food barcodes for instant nutrition data.

| Component | Technology |
|-----------|-----------|
| **Barcode Scanner** | `expo-camera` with barcode mode |
| **Nutrition API** | Open Food Facts API (free, 3M+ products) |
| **Data Storage** | Supabase meals table |

**Flow:**
```
Camera scan barcode → Get product code →
Open Food Facts API lookup →
Return nutrition per serving →
User confirms + logs to meals table
```

**API:** https://world.openfoodfacts.org/api/v2/product/{barcode}.json (100% free, no key needed)

---

### 14. Live Workout Challenges

Real-time head-to-head step/activity competitions.

| Feature | Technology |
|---------|-----------|
| **Challenge Creation** | Supabase DB (challenges table) |
| **Live Updates** | Supabase Realtime subscriptions |
| **Notifications** | Push notification when opponent takes lead |
| **Auto-Winner** | Supabase Edge Function (cron at challenge end) |

**Challenge Types:**
- Step count race (24 hours)
- Workout count race (7 days)
- Distance race (7 days)
- Calorie burn race (3 days)

---

## Database Schema (Supabase PostgreSQL)

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  height_cm DECIMAL,
  weight_kg DECIMAL,
  fitness_goal TEXT,
  activity_level TEXT,
  dietary_preference TEXT,
  daily_step_goal INTEGER DEFAULT 10000,
  daily_calorie_goal INTEGER DEFAULT 2000,
  experience_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises
CREATE TABLE exercises (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  muscle_groups TEXT[], -- ['chest', 'triceps', 'shoulders']
  difficulty TEXT,
  equipment TEXT,
  instructions TEXT[],
  animation_url TEXT,
  image_url TEXT,
  category TEXT
);

-- Workouts
CREATE TABLE workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  exercise_id INTEGER REFERENCES exercises(id),
  sets INTEGER,
  reps INTEGER,
  weight_kg DECIMAL,
  duration_seconds INTEGER,
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meals (Cal AI results)
CREATE TABLE meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  food_name TEXT NOT NULL,
  calories DECIMAL,
  protein_g DECIMAL,
  fat_g DECIMAL,
  carbs_g DECIMAL,
  fiber_g DECIMAL,
  portion_size TEXT,
  image_url TEXT,
  ai_confidence DECIMAL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routes (GPS tracking)
CREATE TABLE routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  activity_type TEXT CHECK (activity_type IN ('run', 'walk', 'cycle')),
  distance_km DECIMAL,
  duration_seconds INTEGER,
  elevation_gain_m DECIMAL,
  coordinates JSONB, -- [{lat, lng, timestamp}, ...]
  polyline TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Steps (daily aggregation)
CREATE TABLE daily_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  date DATE NOT NULL,
  steps INTEGER DEFAULT 0,
  distance_km DECIMAL,
  calories_burned DECIMAL,
  active_minutes INTEGER,
  UNIQUE(user_id, date)
);

-- Leaderboard
CREATE TABLE leaderboard_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  month TEXT NOT NULL, -- '2026-04'
  total_points INTEGER DEFAULT 0,
  steps_points INTEGER DEFAULT 0,
  workout_points INTEGER DEFAULT 0,
  meal_points INTEGER DEFAULT 0,
  route_points INTEGER DEFAULT 0,
  streak_points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Friends
CREATE TABLE friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  friend_id UUID REFERENCES profiles(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Achievements
CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  category TEXT,
  requirement_type TEXT, -- 'steps', 'workouts', 'meals', 'routes', 'streak'
  requirement_value INTEGER
);

CREATE TABLE user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  achievement_id INTEGER REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Activity Feed (social feature)
CREATE TABLE activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  activity_type TEXT CHECK (activity_type IN ('workout', 'meal', 'route', 'steps', 'achievement')),
  activity_id UUID,
  description TEXT,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Folder Structure

```
OXZI-FIT/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── index.tsx             # Home/Dashboard
│   │   ├── exercises.tsx         # Exercise library
│   │   ├── calories.tsx          # Cal AI scanner
│   │   ├── track.tsx             # GPS route tracking
│   │   ├── leaderboard.tsx       # Leaderboard
│   │   └── profile.tsx           # Profile & settings
│   ├── exercise/
│   │   └── [id].tsx              # Exercise detail
│   ├── meal/
│   │   └── [id].tsx              # Meal detail
│   ├── route/
│   │   └── [id].tsx              # Route detail
│   ├── compare/
│   │   └── [friendId].tsx        # Friend comparison
│   └── _layout.tsx               # Root layout
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── ProgressBar.tsx
│   ├── exercises/
│   │   ├── MuscleHighlighter.tsx
│   │   ├── ExerciseCard.tsx
│   │   └── ExerciseAnimation.tsx
│   ├── calories/
│   │   ├── FoodScanner.tsx
│   │   ├── NutritionBar.tsx
│   │   └── MealCard.tsx
│   ├── tracking/
│   │   ├── RouteMap.tsx
│   │   ├── StepCounter.tsx
│   │   └── StatsCard.tsx
│   ├── leaderboard/
│   │   ├── LeaderboardList.tsx
│   │   ├── TopThree.tsx
│   │   └── FriendCompare.tsx
│   └── onboarding/
│       ├── StepIndicator.tsx
│       └── OnboardingSlide.tsx
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── openai.ts                 # OpenAI API client
│   └── utils.ts                  # Helper functions
├── hooks/
│   ├── useAuth.ts
│   ├── useSteps.ts
│   ├── useLocation.ts
│   ├── useCalories.ts
│   └── useLeaderboard.ts
├── stores/
│   ├── authStore.ts              # Zustand auth state
│   ├── workoutStore.ts
│   └── trackingStore.ts
├── types/
│   ├── database.ts               # Supabase generated types
│   ├── exercise.ts
│   ├── meal.ts
│   ├── route.ts
│   └── user.ts
├── assets/
│   ├── animations/               # Lottie files
│   ├── images/
│   └── exercises/                # Exercise GIFs/animations
├── supabase/
│   ├── migrations/               # SQL migrations
│   └── functions/                # Edge Functions
│       ├── ai-food-scan/         # OpenAI proxy for food detection
│       └── leaderboard-update/   # Monthly leaderboard cron
├── app.json
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── babel.config.js
```

---

## Environment Variables (.env)

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# OpenAI (used in Edge Functions only, NOT exposed to client)
OPENAI_API_KEY=sk-...

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

---

## Free Resources & APIs

### Exercise Data
| Source | URL | Free Tier |
|--------|-----|-----------|
| **wger.de** | https://wger.de/api/v2/ | Unlimited, open source |
| **ExerciseDB** | https://rapidapi.com/ | 100 req/day free |
| **MuscleWiki API** | https://musclewiki.com/ | Free exercise GIFs |

### Food Data
| Source | URL | Free Tier |
|--------|-----|-----------|
| **OpenAI GPT-4o** | https://platform.openai.com | $5 free credits |
| **LogMeal** | https://logmeal.com/api/ | 1000 req/month |
| **FatSecret** | https://platform.fatsecret.com | 500 req/day |
| **Edamam** | https://developer.edamam.com/ | 100 req/min |

### 3D Assets
| Source | URL | Free Tier |
|--------|-----|-----------|
| **IconScout 3D** | https://iconscout.com/3d-illustrations | Some free |
| **GymVisual** | https://gymvisual.com/ | Some free GIFs |
| **ReadyPlayerMe** | https://readyplayer.me/ | Free 3D avatars |
| **LottieFiles** | https://lottiefiles.com/ | Free animations |

### Health APIs
| Source | URL | Platform |
|--------|-----|----------|
| **Google Health Connect** | `react-native-health-connect` | Android |
| **Apple HealthKit** | `expo-health-kit` | iOS |
| **Expo Pedometer** | `expo-sensors` | Both |

---

## Hackathon MVP Scope (3 Days)

### Day 1: Foundation
- [ ] Expo project setup with TypeScript
- [ ] Supabase setup (auth + DB schema)
- [ ] Onboarding flow (5 screens)
- [ ] Auth (login/signup)
- [ ] Basic tab navigation

### Day 2: Core Features
- [ ] Exercise library with muscle highlighter
- [ ] Cal AI food scanner (OpenAI Vision)
- [ ] Steps tracking (Expo Pedometer)
- [ ] Basic route tracking (GPS)

### Day 3: Social & Polish
- [ ] Leaderboard with points
- [ ] Friend comparison
- [ ] Profile page with stats
- [ ] UI polish & animations
- [ ] Testing & demo prep

---

## Production Additions (Post-Hackathon)
- Background step sync via Health Connect/HealthKit
- Push notifications for achievements
- Monthly leaderboard rewards system
- Social feed & workout sharing
- AI workout plan generation
- Apple Watch / Wear OS companion app
- Wearable device integrations

---

## Production-Level Features (No Fitness App Does These)

These features are unique to OXZIFIT and do not exist in Strava, MyFitnessPal, Fitbit, Whoop, or any other fitness app.

### P1. AI Injury Prediction Engine

No fitness app predicts injuries. They all react after you're hurt.

| Data Tracked | Risk Signal |
|-------------|-------------|
| Workout volume per muscle group | Overtraining single muscle |
| Push/pull ratio | Muscular imbalance |
| Training frequency | Insufficient recovery |
| Exercise progression | Too much too soon |

**How it works:**
- Analyze workout history per muscle group over 7/14/30 day windows
- Calculate imbalance ratios (e.g., chest volume / back volume)
- Detect patterns: "You've trained chest 4x this week but back only 1x"
- Alert: "Your shoulder injury risk is HIGH. Add 2 back exercises."
- Uses OpenAI to explain WHY and suggest corrective exercises

**Risk Score (0-100):**
```
0-30: Low risk (balanced training)
31-60: Medium risk (minor imbalances detected)
61-80: High risk (significant imbalance or overtraining)
81-100: Critical (immediate rest recommended)
```

**Why nobody does this:** Requires combining exercise logging + muscle group analysis + pattern recognition. Most apps just count reps.

---

### P2. Population Nutrition Intelligence

When thousands of users scan food with Cal AI, you have **real nutrition data nobody else has.**

| Insight | Description |
|---------|-------------|
| **Regional Nutrition Map** | Average macros by city/region |
| **Age Group Analysis** | Nutrition patterns by age bracket |
| **Diet Comparison** | Veg vs non-veg vs keto average intake |
| **Deficiency Alerts** | "78% of users in your city are protein deficient" |
| **Weekly Trends** | How nutrition changes across the week |

**Data Pipeline:**
```
User food scans (anonymized) →
Supabase Edge Function aggregation →
Weekly/monthly analytics tables →
In-app nutrition intelligence dashboard
```

**Why nobody does this:** Cal AI is new. First app with mass food scan data owns this space. Think of it as a **nutrition census** built from real data, not surveys. Potential for public health partnerships.

---

### P3. Adaptive Workout Engine Based on Recovery

Whoop tracks recovery. Nike Run Club plans runs. Nobody combines them intelligently.

| Input | Output |
|-------|--------|
| Yesterday's workout intensity | Today's workout intensity cap |
| 7-day step average | Activity baseline |
| Sleep data (Health Connect) | Recovery score |
| Streak length | Motivation adjustment |

**Daily Recovery Score (0-100):**
```
- Sleep quality (0-30 points)
- Recent workout load (0-30 points)
- Step consistency (0-20 points)
- Nutrition logging (0-20 points)
```

**Adaptive Suggestions:**
```
Recovery 0-30: "Rest day. Try 10-min yoga."
Recovery 31-60: "Light workout. 20-min walk + stretching."
Recovery 61-80: "Good to go. Normal workout intensity."
Recovery 81-100: "Peak performance. Push harder today."
```

**Why nobody does this:** Existing apps either track recovery OR suggest workouts. None use recovery to dynamically generate the next workout.

---

### P4. Fitness Credit Score

Like a credit score but for fitness consistency. Single universal number.

| Factor | Points Impact |
|--------|-------------|
| Workout completed | +5 |
| Step goal reached | +3 |
| Meal logged | +2 |
| Route completed | +5 |
| 3+ inactive days | -10 |
| Streak milestone | +15 |

**Score Range: 300-850**
```
300-499: Beginner (just started)
500-649: Developing (building habits)
650-749: Consistent (strong habits)
750-849: Elite (top 10%)
850: Perfect (legendary)
```

**Features:**
- Shareable score card with trend chart
- Friends can see each other's scores (social motivation)
- Weekly score history graph
- Score breakdown by category (steps, workouts, meals, routes)

**Why nobody does this:** Gamification exists (streaks, badges) but nobody quantifies fitness into a single universal score like a credit rating.

---

### P5. Nutrient Gap Engine

After scanning meals all day, the app tells you EXACTLY what you're missing.

| Time | Insight |
|------|---------|
| **After each meal** | Meal rating + remaining daily budget |
| **End of day** | Nutrient gaps + food suggestions |
| **Weekly summary** | Consistent deficiencies + fixes |

**Example Output:**
```
End of day report:
- Calories: 1,800 / 2,200 (under by 400)
- Protein: 65g / 120g (MISSING 55g)
- Fiber: 8g / 25g (MISSING 17g)
- Fat: On target

Suggestion: Eat 200g chicken breast (62g protein) + 2 apples (8g fiber)
```

**Weekly Deficiency Heat Map:**
- Visual grid: nutrients vs days
- Red = deficient, Green = met, Yellow = close
- Shows patterns: "You've been deficient in iron 4 of 7 days"

**Why nobody does this:** MyFitnessPal logs food but never tells you what you're MISSING or what specific foods to eat to fix it.

---

### P6. Social Fitness Challenges with Stakes

Not just leaderboards — real competitions with consequences.

| Feature | Description |
|---------|-------------|
| **Challenge Creation** | "Whoever walks fewer steps this week buys coffee" |
| **Accept/Decline** | Handshake animation with acceptance |
| **Live Tracking** | Both users see each other's progress |
| **Auto-Winner** | System declares winner at deadline |
| **Loser Badge** | Funny shaming badge on profile |
| **Monthly Tournament** | Bracket-style tournament with prizes |

**Challenge Types:**
- Steps race (daily/weekly)
- Workout count race
- Distance race
- Calorie burn race
- Streak battle (who maintains longer)

**Why nobody does this:** Strava has segments but no head-to-head with stakes. This creates real social motivation through accountability.

---

### P7. AI Form Coach via Camera

Use the phone camera to check exercise form in real-time.

| Component | Technology |
|-----------|-----------|
| **Pose Estimation** | MediaPipe Pose (Google, free) |
| **Form Analysis** | Custom angle calculations |
| **Real-time Feedback** | Audio + visual cues |
| **Form Score** | 0-100 per exercise |

**Supported Exercises (initial):**
- Squat (knee angle, back angle, depth)
- Push-up (elbow angle, body alignment)
- Lunge (knee alignment, depth)
- Plank (hip alignment, body straightness)

**Feedback Examples:**
```
"Keep your back straight"
"Go deeper on your squat"
"Knees going too far forward"
"Great form! 95/100"
```

**Post-Workout:**
- Form score per exercise
- Improvement tips
- Form score history chart (track improvement over weeks)

**Tech Stack:**
```
expo-camera (video feed) → MediaPipe Pose (landmarks) →
Custom angle calculation → Audio feedback (expo-speech) →
Form score → Supabase storage
```

**Why nobody does this:** Apps that do this charge $50+/month (Freeletics AI Coach). You can do it free with MediaPipe.

---

### P8. Wearable Health Insights (Production)

Advanced health metrics from wearable device data.

| Metric | Source | Insight |
|--------|--------|---------|
| Heart Rate | Health Connect / HealthKit | Resting HR trend, workout zones |
| Sleep | Health Connect / HealthKit | Sleep quality score, recovery impact |
| Blood Oxygen | Health Connect / HealthKit | Fitness level indicator |
| Stress Level | Health Connect / HealthKit | Recovery adjustment |
| Body Temperature | Health Connect / HealthKit | Illness detection |

---

## Key Technical Decisions Summary

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| **Cal AI Model** | OpenAI GPT-4o Vision | Best accuracy, structured output, $5 free |
| **Muscle Highlighter** | react-native-body-highlighter | 199★, SVG-based, Expo compatible |
| **3D Exercise Models** | Lottie + GIFs | GLB broken in Expo Go |
| **Steps Tracking** | expo-sensors Pedometer | Works in Expo Go, no native build needed |
| **Route Tracking** | react-native-maps + expo-location | Free, native performance |
| **Nutrition Viz** | Lottie + Animated bars | Skip AR for hackathon speed |
| **Leaderboard** | Supabase Realtime | Live updates, no extra infra |
| **State Management** | Zustand + React Query | Simple, effective, minimal boilerplate |
