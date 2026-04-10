# Implementation Plan: OXZIFIT

## Overview

Incremental build from infrastructure → auth → features → polish. Each task wires into the previous, ending with a fully integrated app. TypeScript strict mode throughout; all API calls via `lib/` layer; Zustand for client state, React Query for server state.

## Tasks

- [x] 1. Project setup — dependencies, env, and config
  - Install all required packages: `@supabase/supabase-js`, `zustand`, `@tanstack/react-query`, `nativewind`, `react-native-body-highlighter`, `expo-sensors`, `expo-location`, `react-native-maps`, `react-native-reanimated`, `lottie-react-native`, `expo-camera`, `expo-image-picker`, `@turf/turf`, `react-native-view-shot`, `expo-sharing`, `fast-check`
  - Create `.env.example` with `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - Verify `tsconfig.json` has `strict: true`
  - _Requirements: 2.1, 4.4, 14.6_

- [x] 2. Database schema migrations
  - [x] 2.1 Create `supabase/migrations/001_initial_schema.sql` with all tables: `profiles`, `workouts`, `meals`, `routes`, `daily_steps`, `leaderboard_entries`, `friendships`, `achievements`, `user_achievements`, `territory_claims`, `chat_messages`, `fitness_scores`, `streak_freezes`, `activity_feed`
    - Include all columns per design doc data models
    - Add `onboarding_completed boolean DEFAULT false` to `profiles`
    - _Requirements: 1.3, 2.7, 3.7, 4.6, 5.4, 6.4, 7.1, 8.2, 9.4, 10.2, 11.4, 14.5_
  - [x] 2.2 Create `supabase/migrations/002_rls_policies.sql` with RLS policies
    - Enable RLS on all user-data tables
    - Policy: users can only SELECT/INSERT/UPDATE/DELETE rows where `user_id = auth.uid()`
    - Friendships: users can read rows where they are `user_id` or `friend_id`
    - Leaderboard: all authenticated users can SELECT; only own rows for INSERT/UPDATE
    - Achievements catalog: all authenticated users can SELECT
    - _Requirements: 2.7_
  - [x] 2.3 Create `supabase/migrations/003_seed_achievements.sql` seeding the achievements catalog
    - Include: first workout, first route, first meal scan, 7-day streak, 30-day streak, 10k steps, 100k steps, 10 routes
    - _Requirements: 11.3, 11.4_

- [x] 3. Core infrastructure — types, Supabase client, utilities
  - [x] 3.1 Create `types/database.ts` with all TypeScript interfaces
    - `Profile`, `Workout`, `Meal`, `Route`, `DailySteps`, `LeaderboardEntry`, `Friendship`, `Achievement`, `UserAchievement`, `TerritoryClaim`, `ChatMessage`, `FitnessScore`, `StreakFreeze`
    - `Coordinate`, `NutritionScanResult`, `MealGrade`, `MealGradeResult`, `TerritoryRenderData`, `FitnessScoreBreakdown`, `ReportCardData`
    - _Requirements: 16.1, 16.2_
  - [x] 3.2 Create `lib/supabase.ts` — initialize Supabase client with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
    - _Requirements: 2.1, 2.5_
  - [x] 3.3 Create `lib/utils.ts` with pure utility functions
    - `haversineDistance(a: Coordinate, b: Coordinate): number`
    - `calculateRouteDistance(coords: Coordinate[]): number`
    - `calculateStepDistance(steps: number): number` — `steps × 0.000762`
    - `calculateStepCalories(steps: number): number` — `steps × 0.04`
    - `calculatePace(distanceKm: number, elapsedSeconds: number): number`
    - `serializeCoordinates(coords: Coordinate[]): string`
    - `deserializeCoordinates(json: string): Coordinate[]`
    - _Requirements: 5.5, 5.6, 6.3, 16.1, 16.2_
  - [x] 3.4 Create `lib/pointsEngine.ts` with pure points calculation functions
    - `calculateStepPoints(steps: number): number` — `floor(steps/1000)`
    - `calculateRoutePoints(km: number): number` — `floor(km)`
    - `calculateTotalPoints(steps, workouts, meals, km, streakDays): number`
    - _Requirements: 8.1_
  - [x] 3.5 Create `lib/fitnessScore.ts` with `calculateFitnessScore` function
    - Implements: `clamp(300 + workoutPts×0.4 + stepsPts×0.3 + mealPts×0.2 + routePts×0.1, 300, 850)`
    - _Requirements: 11.5_
  - [x] 3.6 Create `lib/mealGrade.ts` with `calculateMealGrade(calories, protein_g, fat_g): MealGradeResult`
    - Implements the protein-ratio / fat-ratio threshold algorithm from design
    - _Requirements: 15.1_
  - [x] 3.7 Create `lib/territoryEngine.ts` with territory computation functions
    - `computeConvexHull(coords: Coordinate[]): GeoJSON.Polygon | null` using `@turf/turf`
    - `computeAreaSqKm(polygon: GeoJSON.Polygon): number`
    - `computeTerritoryOpacity(visitCount: number): number` — `min(0.1 + (v-1)×0.1, 0.8)`
    - `serializePolygon(polygon: GeoJSON.Polygon): string`
    - `deserializePolygon(json: string): GeoJSON.Polygon`
    - _Requirements: 7.1, 7.3, 16.4, 16.5_

- [x] 4. Zustand stores
  - [x] 4.1 Create `stores/authStore.ts` — `session`, `profile`, `setSession`, `setProfile`, `clearAuth`
    - _Requirements: 2.5, 2.6_
  - [x] 4.2 Create `stores/trackingStore.ts` — `isRecording`, `coordinates`, `elapsedSeconds`, `distanceKm`, `currentPace`, `activityType`, `startRecording`, `addCoordinate`, `stopRecording`, `reset`
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 4.3 Create `stores/stepStore.ts` — `todaySteps`, `goalReached`, `setSteps`
    - _Requirements: 5.1, 5.2_
  - [x] 4.4 Create `stores/calAiStore.ts` — `pendingScan`, `setPendingScan`
    - _Requirements: 4.2_

- [x] 5. Base UI components
  - [x] 5.1 Create `components/ui/Button.tsx` — primary/secondary/ghost variants with NativeWind styling
    - _Requirements: 1.2_
  - [x] 5.2 Create `components/ui/Card.tsx` — base card container
  - [x] 5.3 Create `components/ui/ProgressBar.tsx` — animated with `react-native-reanimated`
    - _Requirements: 4.5_
  - [x] 5.4 Create `components/ui/CircularProgress.tsx` — step counter ring with animated fill
    - _Requirements: 5.2_
  - [x] 5.5 Create `components/ui/StatBadge.tsx` — win/loss indicator chip (green/red)
    - _Requirements: 8.7, 10.5_

- [x] 6. Root navigation layout and auth gate
  - [x] 6.1 Create `app/_layout.tsx` — root layout that initializes Supabase auth listener, restores session from AsyncStorage, sets `authStore`, and redirects: no session → `/(auth)/login`, session + `onboarding_completed=false` → `/(auth)/onboarding`, otherwise → `/(tabs)`
    - _Requirements: 1.5, 2.5_
  - [x] 6.2 Create `app/index.tsx` — redirect component that reads `authStore` and navigates accordingly
    - _Requirements: 1.5, 2.5_
  - [x] 6.3 Create `app/(auth)/_layout.tsx` — Stack navigator for auth screens
  - [x] 6.4 Create `app/(tabs)/_layout.tsx` — Bottom tab navigator with 5 tabs: Home, Exercises, Cal AI, Track, Leaderboard, Profile
    - _Requirements: 12.1_

- [x] 7. Authentication screens
  - [x] 7.1 Create `app/(auth)/login.tsx` — email + password form, calls `supabase.auth.signInWithPassword`, shows "Invalid email or password." on failure, navigates to `(tabs)` on success
    - _Requirements: 2.2, 2.4_
  - [x] 7.2 Create `app/(auth)/signup.tsx` — email + password + confirm password form, calls `supabase.auth.signUp`, shows "An account with this email already exists." on duplicate, navigates to onboarding on success
    - _Requirements: 2.1, 2.3_

- [x] 8. Onboarding flow
  - [x] 8.1 Create `components/onboarding/StepIndicator.tsx` — dot progress indicator showing current step out of total
    - _Requirements: 1.2_
  - [x] 8.2 Create `components/onboarding/OnboardingStep.tsx` — single step wrapper with `react-native-reanimated` slide/fade transition completing within 300ms
    - _Requirements: 1.2_
  - [x] 8.3 Create `app/(auth)/onboarding.tsx` — 5-step flow collecting: (1) full name + age + gender, (2) height + weight, (3) fitness goal (lose weight / gain muscle / maintain weight / improve endurance), (4) activity level (sedentary / lightly active / moderately active / very active / extremely active) + dietary preference, (5) daily step goal + daily calorie goal
    - Inline validation on each step — block advance if required field empty
    - On final submit: `supabase.from('profiles').upsert(...)` with all fields + `onboarding_completed: true`, then navigate to `/(tabs)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7_

- [x] 9. Checkpoint — core infrastructure complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Exercise library
  - [x] 10.1 Create `lib/exerciseDb.ts` — fetch all exercises from ExerciseDB API (`https://exercisedb.dev/api/v2/exercises?limit=1500`), cache response in memory/AsyncStorage
    - _Requirements: 3.1_
  - [x] 10.2 Create `hooks/useExercises.ts` — React Query hook wrapping `lib/exerciseDb.ts`, exposes `filterExercises(query, muscle?, equipment?)` using client-side filtering on cached data
    - _Requirements: 3.2_
  - [x] 10.3 Create `components/exercises/ExerciseCard.tsx` — list item showing exercise name, muscle tags, and thumbnail
    - _Requirements: 3.1_
  - [x] 10.4 Create `components/exercises/ExerciseAnimation.tsx` — renders `gifUrl` via `Image` component with loading state
    - _Requirements: 3.3, 3.4_
  - [x] 10.5 Create `components/exercises/MuscleHighlighter.tsx` — wraps `react-native-body-highlighter`, accepts `muscles`, `musclesSecondary`, `mode` ('front'|'back'), `onToggleView`; renders front/back SVG body diagram with distinct highlight colors
    - _Requirements: 3.5, 3.6_
  - [x] 10.6 Create `app/(tabs)/exercises.tsx` — searchable/filterable exercise list using `useExercises`, renders `ExerciseCard` items, navigates to `exercise/[id]` on tap
    - _Requirements: 3.1, 3.2_
  - [x] 10.7 Create `app/exercise/[id].tsx` — exercise detail screen: `ExerciseAnimation` (GIF), name, targeted muscles, body part, equipment, step-by-step instructions, `MuscleHighlighter` with toggle, "Log Workout" button that saves to `supabase.from('workouts').insert(...)` with exercise_id, sets, reps, weight_kg, duration_seconds, completed_at
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7_
  - [ ]* 10.8 Write property test for exercise filter correctness
    - **Property 7: Exercise filter returns only matching results**
    - **Validates: Requirements 3.2**
    - File: `__tests__/exerciseFilter.test.ts`

- [ ] 11. Cal AI — food scanner and meal log
  - [ ] 11.1 Create `supabase/functions/ai-food-scan/index.ts` — Edge Function: validate JWT, build GPT-4o Vision prompt, call OpenAI API with `OPENAI_API_KEY` secret, parse + validate required fields (`food_name`, `calories`, `protein_g`, `fat_g`, `carbs_g`), return `NutritionScanResult` or `{ error: 'incomplete_response' }`
    - _Requirements: 4.3, 4.4, 16.6_
  - [ ] 11.2 Create `lib/calAi.ts` — `scanFood(imageBase64: string, mimeType: string): Promise<NutritionScanResult>` calling the Edge Function; `lookupBarcode(barcode: string)` calling Open Food Facts API with fallback to vision scan on 404
    - _Requirements: 4.2, 4.9, 4.10_
  - [ ] 11.3 Create `hooks/useCalAi.ts` — manages scan flow: base64-encode image, call `lib/calAi.ts`, update `calAiStore`, handle errors with user-facing messages
    - _Requirements: 4.2, 4.7_
  - [ ] 11.4 Create `components/calories/FoodScanner.tsx` — camera capture (expo-camera) + gallery picker (expo-image-picker) + barcode scan mode; calls `onScanComplete` or `onError`
    - _Requirements: 4.1, 4.9_
  - [ ] 11.5 Create `components/calories/NutritionDisplay.tsx` — animated macro progress bars (protein, fat, carbs, fiber) using `react-native-reanimated`, shows values vs daily goals
    - _Requirements: 4.5_
  - [ ] 11.6 Create `components/calories/MealGradeChip.tsx` — A+/A/B/C/D badge with color coding
    - _Requirements: 15.1_
  - [ ] 11.7 Create `components/calories/MealCard.tsx` — logged meal list item showing food name, calories, macros, grade chip, meal type, time
    - _Requirements: 4.8_
  - [ ] 11.8 Create `supabase/functions/meal-swap/index.ts` — Edge Function: receive meal + userGoal + dailyCalorieGoal, call GPT-4o to generate healthier alternative, return `{ alternative_name, calories, protein_g, fat_g, carbs_g }`
    - _Requirements: 15.2, 15.3_
  - [ ] 11.9 Create `app/(tabs)/calories.tsx` — Cal AI screen: `FoodScanner` at top, `NutritionDisplay` after scan, confirm button saves meal to `supabase.from('meals').insert(...)`, triggers grade calculation, triggers meal-swap Edge Function if grade C/D, daily meal log below showing all today's meals with running macro totals and nutrient gap summary
    - _Requirements: 4.1, 4.2, 4.5, 4.6, 4.7, 4.8, 15.1, 15.2, 15.4_
  - [ ] 11.10 Create `app/meal/[id].tsx` — meal detail screen showing full nutrition, grade, swap suggestion if applicable
    - _Requirements: 15.3_
  - [ ]* 11.11 Write property test for nutrition response validation
    - **Property 14: Nutrition response validation rejects incomplete data**
    - **Validates: Requirements 16.6, 4.7**
    - File: `__tests__/calAi.test.ts`
  - [ ]* 11.12 Write property test for daily nutrition totals
    - **Property 12: Daily nutrition totals equal sum of logged meals**
    - **Validates: Requirements 4.8, 15.4**
    - File: `__tests__/nutrition.test.ts`
  - [ ]* 11.13 Write property test for meal grade determinism
    - **Property 13: Meal grade determinism**
    - **Validates: Requirements 15.1**
    - File: `__tests__/mealGrade.test.ts`

- [ ] 12. Steps tracking
  - [ ] 12.1 Create `hooks/useSteps.ts` — wraps `expo-sensors` Pedometer: subscribe to step updates, update `stepStore`, check device support, trigger midnight save to `supabase.from('daily_steps').insert(...)` with steps, distance_km, calories_burned
    - _Requirements: 5.1, 5.4, 5.8_
  - [ ] 12.2 Create `components/tracking/StepCounter.tsx` — `CircularProgress` ring showing steps vs goal, Lottie celebration animation when goal reached, hides widget if Pedometer unsupported
    - _Requirements: 5.2, 5.3, 5.8_
  - [ ]* 12.3 Write property tests for step-derived metrics
    - **Property 3: Step-derived metrics follow their formulas**
    - **Validates: Requirements 5.5, 5.6**
    - File: `__tests__/stepMetrics.test.ts`

- [ ] 13. GPS route tracking
  - [ ] 13.1 Create `hooks/useRouteTracker.ts` — wraps `trackingStore` + `expo-location`: `requestForegroundPermissionsAsync`, `watchPositionAsync` at 5s intervals, add coordinates to store, compute Haversine distance + pace each update, stop and return coordinates array
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ] 13.2 Create `components/tracking/RouteStatsBar.tsx` — displays elapsed duration (HH:MM:SS), distance km, pace min/km, updating every second via `setInterval`
    - _Requirements: 6.3_
  - [ ] 13.3 Create `components/tracking/RouteMap.tsx` — `react-native-maps` MapView with Polyline overlay of current/past coordinates, updates in real time during recording
    - _Requirements: 6.2_
  - [ ] 13.4 Create `app/(tabs)/track.tsx` — track screen: activity type selector (run/walk/cycle), Start/Stop button, `RouteMap`, `RouteStatsBar`, permission error state, past routes list showing activity type + distance + duration + date, navigates to `route/[id]` on tap
    - _Requirements: 6.1, 6.4, 6.5, 6.6_
  - [ ] 13.5 On route save in `app/(tabs)/track.tsx`: insert to `supabase.from('routes').insert(...)`, then call `lib/territoryEngine.ts` to compute convex hull + area, upsert to `territory_claims`, award route points via `lib/pointsEngine.ts`, upsert `leaderboard_entries`
    - _Requirements: 6.4, 7.1, 8.1, 8.2_
  - [ ] 13.6 Create `app/route/[id].tsx` — route detail screen: full Polyline on MapView, distance, duration, pace, date, activity type
    - _Requirements: 6.7_
  - [ ]* 13.7 Write property tests for Haversine distance
    - **Property 6: Haversine distance non-negativity and symmetry**
    - **Validates: Requirements 6.3**
    - File: `__tests__/haversine.test.ts`
  - [ ]* 13.8 Write property tests for coordinate serialization round-trip
    - **Property 1: Coordinate serialization round-trip**
    - **Validates: Requirements 16.1, 16.2, 16.3**
    - File: `__tests__/serialization.test.ts`

- [ ] 14. Territory conquest map
  - [ ] 14.1 Create `hooks/useTerritory.ts` — React Query hook fetching own territory claims + friend territory claims from Supabase, deserializes polygon JSONB
    - _Requirements: 7.2, 7.4_
  - [ ] 14.2 Create `components/territory/TerritoryPolygon.tsx` — single Polygon overlay on MapView with opacity from `computeTerritoryOpacity(visitCount)`, distinct colors for own vs friend territories, blended color for overlapping regions
    - _Requirements: 7.2, 7.3, 7.4, 7.6_
  - [ ] 14.3 Create `components/tracking/TerritoryMap.tsx` — MapView rendering all `TerritoryPolygon` overlays for own + friend territories, displays total claimed area in km²
    - _Requirements: 7.2, 7.4, 7.5_
  - [ ]* 14.4 Write property tests for territory polygon serialization
    - **Property 2: Territory polygon serialization round-trip**
    - **Validates: Requirements 16.4, 16.5**
    - File: `__tests__/serialization.test.ts`
  - [ ]* 14.5 Write property tests for convex hull and territory opacity
    - **Property 8: Convex hull contains all route points**
    - **Property 9: Territory opacity proportional and capped**
    - **Validates: Requirements 7.1, 7.3**
    - File: `__tests__/territory.test.ts`

- [ ] 15. Checkpoint — tracking features complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Streak system
  - [ ] 16.1 Create `hooks/useStreak.ts` — reads streak from `profiles`, checks if today has any logged activity (workout/meal/steps/route), increments streak, handles milestone detection (7/30/60/100 days), checks/applies streak freeze on missed day
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [ ] 16.2 Create `components/streak/StreakCounter.tsx` — fire icon + day count display
    - _Requirements: 9.5_
  - [ ] 16.3 Create `components/streak/StreakCelebration.tsx` — Lottie milestone animation triggered at 7/30/60/100 day milestones, awards Streak Shield
    - _Requirements: 9.2_
  - [ ]* 16.4 Write property tests for streak state machine
    - **Property 10: Streak state machine correctness**
    - **Property 11: Streak freeze limit enforced**
    - **Validates: Requirements 9.1, 9.3, 9.4**
    - File: `__tests__/streak.test.ts`

- [ ] 17. Points engine and leaderboard
  - [ ] 17.1 Create `hooks/useLeaderboard.ts` — React Query hook fetching top-10 global leaderboard for current month + current user's rank; Supabase Realtime subscription for live updates; friends leaderboard filtered view
    - _Requirements: 8.3, 8.4, 8.5, 8.6_
  - [ ] 17.2 Create `components/leaderboard/PodiumTop3.tsx` — visually distinct podium layout for ranks 1/2/3 with avatar, name, points
    - _Requirements: 8.3_
  - [ ] 17.3 Create `components/leaderboard/LeaderboardRow.tsx` — rank + avatar + name + points row
    - _Requirements: 8.3, 8.5_
  - [ ] 17.4 Create `app/(tabs)/leaderboard.tsx` — leaderboard screen: `PodiumTop3` for top 3, `LeaderboardRow` list for ranks 4–10, current user's rank/points pinned at bottom, toggle between Global and Friends views, "Monthly Champion" badge on previous month's top 3 profiles
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 8.8_
  - [ ]* 17.5 Write property tests for points engine
    - **Property 4: Points engine correctness**
    - **Validates: Requirements 8.1, 8.2**
    - File: `__tests__/pointsEngine.test.ts`
  - [ ]* 17.6 Write property tests for leaderboard ordering and friends filter
    - **Property 15: Leaderboard ordering invariant**
    - **Property 16: Friends leaderboard filters to friends only**
    - **Validates: Requirements 8.3, 8.6**
    - File: `__tests__/leaderboard.test.ts`

- [ ] 18. Friend system and comparison
  - [ ] 18.1 Create `lib/friends.ts` — `searchUserByEmail`, `sendFriendRequest`, `acceptFriendRequest`, `declineFriendRequest`, `getFriends`, `getPendingRequests`
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [ ] 18.2 Create `components/leaderboard/FriendCompareRow.tsx` — side-by-side stat row with `StatBadge` win/loss chip per category
    - _Requirements: 8.7, 10.5_
  - [ ] 18.3 Create `app/compare/[friendId].tsx` — PUBG-style friend comparison screen: side-by-side stats for points, steps, workouts, meals, km, streak with win/loss indicator per category
    - _Requirements: 8.7, 10.5_
  - [ ]* 18.4 Write property test for friend stat comparison win/loss correctness
    - **Property 17: Friend stat comparison win/loss correctness**
    - **Validates: Requirements 8.7, 10.5**
    - File: `__tests__/friendCompare.test.ts`

- [ ] 19. User profile and achievements
  - [ ] 19.1 Create `hooks/useFitnessScore.ts` — computes daily Fitness Score using `lib/fitnessScore.ts`, persists to `fitness_scores` table, fetches 7-day history for trend chart
    - _Requirements: 11.5, 11.6_
  - [ ] 19.2 Create `lib/achievements.ts` — `checkAndUnlockAchievements(userId, stats)`: queries `achievements` catalog, compares against `user_achievements`, inserts newly unlocked achievements, awards associated points
    - _Requirements: 11.4_
  - [ ] 19.3 Create `app/(tabs)/profile.tsx` — profile screen: avatar, full name, Fitness Score, streak counter, total stats (workouts/steps/km/meals), achievements gallery (unlocked with date + locked as greyed placeholders), Fitness Score 7-day trend chart, pending friend requests with accept/decline, edit profile button, logout button
    - _Requirements: 11.1, 11.2, 11.3, 9.5, 10.4, 2.6_
  - [ ] 19.4 Wire achievement unlock into workout save, meal save, route save, and streak milestone handlers — call `lib/achievements.ts`, show Lottie unlock animation on new achievement
    - _Requirements: 11.4_
  - [ ]* 19.5 Write property tests for fitness score formula and bounds
    - **Property 5: Fitness score formula and bounds**
    - **Validates: Requirements 11.5**
    - File: `__tests__/fitnessScore.test.ts`
  - [ ]* 19.6 Write property test for achievement unlock threshold correctness
    - **Property 19: Achievement unlock threshold correctness**
    - **Validates: Requirements 11.4**
    - File: `__tests__/achievements.test.ts`
  - [ ]* 19.7 Write property test for profile update round-trip
    - **Property 18: Profile update round-trip**
    - **Validates: Requirements 11.2**
    - File: `__tests__/profile.test.ts`

- [ ] 20. Home dashboard
  - [ ] 20.1 Create `app/(tabs)/index.tsx` — home screen: today's step count widget (`StepCounter`), today's calories consumed, today's workout count, current streak (`StreakCounter`), quick action buttons (Scan Food → calories tab, Start Route → track tab, Browse Exercises → exercises tab), 3 most recent meals for today, current leaderboard rank, 7-day step history bar chart, pull-to-refresh refreshing all React Query data
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 5.7_

- [ ] 21. Checkpoint — all main features complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 22. AI Trainer Chat
  - [ ] 22.1 Create `supabase/functions/ai-trainer-chat/index.ts` — Edge Function: validate JWT, build system prompt with user context (profile, recent meals, recent workouts, streak), append conversation history + new message, call GPT-4o with `max_tokens: 500`, return assistant response text
    - _Requirements: 14.1, 14.2, 14.6_
  - [ ] 22.2 Create `lib/chat.ts` — `sendChatMessage(message, context, history)` calling the Edge Function; `getChatHistory(userId)` from Supabase; `saveChatMessage(role, content)` to `chat_messages`
    - _Requirements: 14.1, 14.5_
  - [ ] 22.3 Create `app/chat/index.tsx` — chat screen: chat bubble UI (user right / assistant left), most recent message visible without scrolling, quick-reply chips ("Suggest a workout", "Review my nutrition", "I need motivation", "What should I eat next?"), message input + send button, loads chat history from Supabase on mount, saves each message pair to `chat_messages`
    - _Requirements: 14.3, 14.4, 14.5_
  - [ ]* 22.4 Write property test for chat message persistence round-trip
    - **Property 22: Chat message persistence round-trip**
    - **Validates: Requirements 14.5**
    - File: `__tests__/chat.test.ts`

- [ ] 23. Shareable Report Card
  - [ ] 23.1 Create `lib/reportCard.ts` — `aggregateReportCardData(userId): Promise<ReportCardData>` fetching 7-day totals for steps, calories, workouts, km, streak, fitness score, and muscles trained — all from locally cached/Supabase data, no extra server round-trip
    - _Requirements: 13.1, 13.4_
  - [ ] 23.2 Create a `ReportCard` component (inline in profile or dedicated screen) — animated card using Lottie + `react-native-reanimated` displaying all 7-day stats, muscle heatmap (`MuscleHighlighter`), mini territory map; "Share" button captures via `react-native-view-shot` and opens native share sheet via `expo-sharing`
    - _Requirements: 13.2, 13.3_
  - [ ]* 23.3 Write property test for report card aggregation correctness
    - **Property 20: Report card aggregation correctness**
    - **Validates: Requirements 13.1**
    - File: `__tests__/reportCard.test.ts`

- [ ] 24. Workout history muscle heatmap
  - [ ] 24.1 Create `hooks/useWorkoutHistory.ts` — React Query hook fetching workouts for a given time period, aggregates muscle group training frequency
    - _Requirements: 3.8_
  - [ ] 24.2 Wire cumulative muscle heatmap into the profile screen — `MuscleHighlighter` rendering all muscles trained in selected period with color intensity proportional to training frequency
    - _Requirements: 3.8_

- [ ] 25. Remaining property-based tests
  - [ ]* 25.1 Write property test for RLS data isolation (integration)
    - **Property 21: RLS data isolation**
    - **Validates: Requirements 2.7**
    - File: `__tests__/rls.test.ts`

- [ ] 26. Final checkpoint — full integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests use `fast-check` with `numRuns: 100`; each test file includes the comment tag `// Feature: oxzifit-app, Property {N}: {property_text}`
- Unit tests and property tests are complementary — both are needed for full coverage
- All AI API keys (`OPENAI_API_KEY`) live exclusively in Supabase Edge Functions — never in client code
- Every feature must work in Expo Go (no custom native builds)
