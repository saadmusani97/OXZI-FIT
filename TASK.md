# TASK.md - OXZIFIT Hackathon MVP

## Status Legend
- `[ ]` = Pending
- `[~]` = In Progress
- `[x]` = Completed
- `[!]` = Blocked

---

## Day 1: Foundation & Auth

### Project Setup
- [x] Research & architecture planning
- [ ] Initialize Expo project with TypeScript
- [ ] Install core dependencies
  - `npx create-expo-app@latest OXZIFIT --template blank-typescript`
  - `npm install nativewind tailwindcss`
  - `npm install @supabase/supabase-js`
  - `npm install zustand @tanstack/react-query`
  - `npm install expo-router expo-linking expo-constants`
  - `npm install react-native-reanimated react-native-gesture-handler`
- [ ] Configure NativeWind (tailwind.config.js + babel.config.js)
- [ ] Set up Expo Router file-based navigation
- [ ] Create `.env` file with Supabase credentials
- [ ] Set up folder structure (app/, components/, hooks/, stores/, lib/, types/)

### Supabase Backend
- [ ] Create Supabase project
- [ ] Run SQL migrations (profiles, exercises, meals, routes, daily_steps, leaderboard_entries, friendships, achievements, user_achievements, activity_feed)
- [ ] Set up Row Level Security (RLS) policies
- [ ] Create Supabase client in `lib/supabase.ts`
- [ ] Seed exercises table with sample data from wger.de API

### Authentication
- [ ] Create login screen (`app/(auth)/login.tsx`)
- [ ] Create signup screen (`app/(auth)/signup.tsx`)
- [ ] Implement Supabase auth (email/password)
- [ ] Create auth store (`stores/authStore.ts`)
- [ ] Auth guard for protected routes
- [ ] Session persistence with AsyncStorage

### Onboarding Flow
- [ ] Create onboarding screens (`app/(auth)/onboarding.tsx`)
- [ ] Step 1: Personal info (name, age, gender)
- [ ] Step 2: Body metrics (height, weight)
- [ ] Step 3: Fitness goal (lose/gain/maintain/endurance)
- [ ] Step 4: Activity level (sedentary → very active)
- [ ] Step 5: Dietary preference & daily goals
- [ ] Save onboarding data to Supabase profiles table
- [ ] Smooth animations between steps (react-native-reanimated)

### Tab Navigation
- [ ] Create tab layout (`app/(tabs)/_layout.tsx`)
- [ ] Home tab icon + screen stub
- [ ] Exercises tab icon + screen stub
- [ ] Calories tab icon + screen stub
- [ ] Track tab icon + screen stub
- [ ] Leaderboard tab icon + screen stub
- [ ] Profile tab icon + screen stub

---

## Day 2: Core Features

### Exercise Library
- [ ] Create exercises screen (`app/(tabs)/exercises.tsx`)
- [ ] Exercise list with search & filter by muscle group
- [ ] Exercise card component (`components/exercises/ExerciseCard.tsx`)
- [ ] Exercise detail screen (`app/exercise/[id].tsx`)
- [ ] Muscle highlighter component (`components/exercises/MuscleHighlighter.tsx`)
  - Use `react-native-body-highlighter`
  - Front + back body view toggle
  - Color-coded by intensity
- [ ] Exercise animation/GIF display
- [ ] Fetch exercises from Supabase DB

### Cal AI Food Scanner
- [ ] Create calories screen (`app/(tabs)/calories.tsx`)
- [ ] Camera integration (`expo-camera`)
- [ ] Photo picker from gallery (`expo-image-picker`)
- [ ] Food scanner component (`components/calories/FoodScanner.tsx`)
- [ ] Supabase Edge Function for OpenAI GPT-4o Vision proxy
  - Input: base64 image
  - Output: `{ food_name, calories, protein_g, fat_g, carbs_g, fiber_g, portion_size, confidence }`
- [ ] Nutrition bar visualization (`components/calories/NutritionBar.tsx`)
- [ ] Meal card component (`components/calories/MealCard.tsx`)
- [ ] Save meal to Supabase meals table
- [ ] Daily meal log with total calories

### Steps Tracking
- [ ] Create steps widget on home screen
- [ ] Step counter component (`components/tracking/StepCounter.tsx`)
- [ ] Use `expo-sensors` Pedometer for real-time step count
- [ ] Circular progress animation for step goal
- [ ] Save daily steps to Supabase daily_steps table
- [ ] Weekly step history chart
- [ ] Distance and calories burned calculation

### Route Tracking (Built From Scratch - GPS)
- [ ] Create track screen (`app/(tabs)/track.tsx`)
- [ ] Map view component (`components/tracking/RouteMap.tsx`)
  - `react-native-maps` with Google Maps provider
- [ ] Location permissions handling (`expo-location`)
- [ ] Start/stop run tracking
- [ ] Real-time polyline drawing on map
- [ ] Distance calculation (Haversine formula)
- [ ] Pace and duration tracking
- [ ] Polygon overlay showing covered area
- [ ] Save route to Supabase routes table
- [ ] Route history list

### Territory Map
- [ ] Install `@turf/turf` for polygon calculations
- [ ] Territory claims table in Supabase
- [ ] Generate territory polygon from completed route (convex hull)
- [ ] Render claimed territories as Polygon overlays on map
- [ ] Color intensity based on visit count (opacity)
- [ ] Show friend territories on map (different colors)
- [ ] Territory stats (total area claimed, rank among friends)

### Duolingo Streak System
- [ ] Streak calculation logic (any daily activity = streak maintained)
- [ ] Streak counter with fire animation (Lottie)
- [ ] Streak Freeze mechanic (costs 50 points, max 2)
- [ ] Streak Shield at milestones (7-day, 30-day)
- [ ] Double XP days (random 1-2x per week)
- [ ] Streak leaderboard among friends
- [ ] Celebration animations on milestone (confetti Lottie)

### AI Trainer Chat
- [ ] Chat UI screen (`app/chat.tsx`)
- [ ] Supabase Edge Function for OpenAI GPT-4o proxy
- [ ] Build user context (profile, meals, workouts, streak)
- [ ] Chat message storage (Supabase chat_messages table)
- [ ] Quick suggestion chips ("Suggest a workout", "Review my meals")
- [ ] Streaming responses for real-time feel

### Smart Meal Swap
- [ ] Meal rating algorithm (A+ to D based on macros)
- [ ] OpenAI prompt for swap suggestions
- [ ] Swap suggestion UI on meal detail screen
- [ ] Nutrient gap display ("You need 45g more protein")
- [ ] Next meal suggestion based on remaining daily budget

### Shareable Report Card
- [ ] Weekly stats aggregation function
- [ ] Animated report card component (Lottie + reanimated)
- [ ] Muscle heatmap of week's trained areas
- [ ] Territory mini-map snapshot
- [ ] Fitness Credit Score display
- [ ] Screenshot capture (`react-native-view-shot`)
- [ ] Share to Instagram Stories (`expo-sharing`)

### Food Barcode Scanner
- [ ] Install `expo-camera` barcode scanning mode
- [ ] Open Food Facts API integration (`lib/openFoodFacts.ts`)
- [ ] Barcode scanner component (`components/calories/BarcodeScanner.tsx`)
- [ ] Product nutrition display
- [ ] Confirm + log to meals table
- [ ] Fallback: manual entry if product not found

### Fitness Credit Score
- [ ] Score calculation algorithm in `lib/fitnessScore.ts`
- [ ] Score history table in Supabase
- [ ] Score card component with gauge visualization
- [ ] Score breakdown by category
- [ ] Friends score comparison
- [ ] Weekly score trend chart

### Live Workout Challenges
- [ ] Challenges table in Supabase
- [ ] Create challenge screen
- [ ] Challenge invitation (friend selection)
- [ ] Real-time progress sync (Supabase Realtime)
- [ ] Live leaderboard during challenge
- [ ] Push notification on opponent progress
- [ ] Auto-winner declaration at deadline
- [ ] Loser badge display

---

## Day 3: Social, Polish & Demo

### Leaderboard
- [ ] Create leaderboard screen (`app/(tabs)/leaderboard.tsx`)
- [ ] Top 3 podium display (`components/leaderboard/TopThree.tsx`)
- [ ] Full leaderboard list (`components/leaderboard/LeaderboardList.tsx`)
- [ ] Points calculation logic
  - Steps: 1pt per 1000 steps
  - Workouts: 10pts per workout
  - Meals: 5pts per meal logged
  - Routes: 1pt per km
  - Streak: 5pts per consecutive day
- [ ] Real-time leaderboard updates (Supabase Realtime)
- [ ] Monthly leaderboard view
- [ ] User rank display

### Friend Comparison
- [ ] Add friend functionality (search by email)
- [ ] Friend request accept/reject
- [ ] Friend comparison screen (`app/compare/[friendId].tsx`)
- [ ] Side-by-side stats comparison
- [ ] Win/loss result display
- [ ] Achievements comparison

### Profile & Settings
- [ ] Profile screen (`app/(tabs)/profile.tsx`)
- [ ] User stats summary (total steps, workouts, meals logged)
- [ ] Edit profile (name, goals, metrics)
- [ ] Achievements gallery
- [ ] Settings (notifications, units, goals)

### Home Dashboard
- [ ] Home screen (`app/(tabs)/index.tsx`)
- [ ] Daily summary cards (steps, calories, workouts)
- [ ] Today's meals quick view
- [ ] Weekly progress chart
- [ ] Quick action buttons (scan food, start run, view exercises)
- [ ] Streak counter display

### UI Polish & Animations
- [ ] Consistent color scheme and typography
- [ ] Loading states and skeleton screens
- [ ] Pull-to-refresh on lists
- [ ] Smooth page transitions
- [ ] Haptic feedback on key interactions
- [ ] Lottie animations for empty states
- [ ] App icon and splash screen

### Testing & Demo Prep
- [ ] Type check: `npx tsc --noEmit`
- [ ] Lint check: `npx expo lint`
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Prepare demo script
- [ ] Record demo video (backup)

---

## Post-Hackathon (Production)
- [ ] Background step sync (Health Connect / HealthKit)
- [ ] Push notifications for achievements
- [ ] Monthly leaderboard rewards system
- [ ] Social feed & workout sharing
- [ ] AI workout plan generation
- [ ] Apple Watch / Wear OS companion app
- [ ] EAS Build & App Store submission

---

## Current Focus
> **START HERE:** Initialize Expo project and install dependencies (Day 1 setup)
