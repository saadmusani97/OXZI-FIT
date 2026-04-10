# TECHSTACK.md - OXZIFIT Technology Stack

## Core Framework

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | React Native | 0.76+ | Cross-platform mobile (iOS + Android) |
| **Platform** | Expo | SDK 52+ | Managed workflow, OTA updates, native APIs |
| **Language** | TypeScript | 5.3+ | Type safety, IDE support, fewer bugs |
| **Navigation** | Expo Router | 4.x | File-based routing, deep linking, type-safe |
| **Styling** | NativeWind | 4.x | Tailwind CSS for React Native |

## Backend & Database

| Service | Technology | Purpose |
|---------|-----------|---------|
| **BaaS** | Supabase | Full backend: auth, DB, storage, functions, realtime |
| **Database** | PostgreSQL (Supabase) | Relational DB, JSONB support, full-text search |
| **Auth** | Supabase Auth | Email/password, Google, Apple OAuth |
| **Storage** | Supabase Storage | User photos, exercise assets, food images |
| **Serverless** | Supabase Edge Functions | AI proxy, leaderboard cron jobs |
| **Realtime** | Supabase Realtime | Live leaderboard updates, friend activity |

## State Management

| Library | Purpose | Usage |
|---------|---------|-------|
| **Zustand** | Client state | Auth state, UI state, local preferences |
| **@tanstack/react-query** | Server state | API calls, caching, background refetch |
| **AsyncStorage** | Persistence | Auth tokens, offline cache |

## UI & Animation

| Library | Purpose | Usage |
|---------|---------|-------|
| **NativeWind** | Styling | Tailwind utility classes for RN |
| **react-native-reanimated** | Animations | Page transitions, micro-interactions |
| **react-native-gesture-handler** | Gestures | Swipe, pinch, drag interactions |
| **lottie-react-native** | Complex animations | Exercise demos, empty states, loading |
| **react-native-svg** | SVG rendering | Muscle body highlighter |
| **react-native-circular-progress** | Progress rings | Step counter, calorie goals |
| **react-native-maps** | Maps | Route tracking, GPS visualization |

## AI & ML

| Service | Purpose | Integration |
|---------|---------|-------------|
| **OpenAI GPT-4o Vision** | Food → nutrition detection | Supabase Edge Function proxy |
| **OpenAI GPT-4o Text** | AI Trainer Chat, Injury Prediction, Meal Swap | Supabase Edge Function proxy |
| **MediaPipe Pose** | Real-time exercise form checking | Client-side (post-hackathon) |
| **Backup: LogMeal API** | Food recognition (free tier) | Direct API call |

## Health & Sensors

| Library | Platform | Purpose |
|---------|----------|---------|
| **expo-sensors** (Pedometer) | Both | Step counting (background) |
| **expo-location** | Both | GPS tracking for routes |
| **expo-camera** | Both | Food photo capture + barcode scanner |
| **expo-image-picker** | Both | Gallery food photo selection |
| **react-native-health-connect** | Android | Health Connect integration (production) |
| **expo-health-kit** | iOS | HealthKit integration (production) |

## Gamification & Social

| Library | Purpose | Usage |
|---------|---------|-------|
| **lottie-react-native** | Streak celebrations, confetti | Milestone animations |
| **react-native-reanimated** | Territory map animations | Smooth polygon transitions |
| **react-native-view-shot** | Shareable report card screenshots | Share to social media |
| **expo-sharing** | Native share sheet | Share report cards |
| **expo-speech** | AI Form Coach audio feedback | Real-time form cues |

## Third-Party APIs

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **wger.de API** | Exercise database (2000+ exercises) | Unlimited |
| **ExerciseDB** | Exercise data with muscle groups | 100 req/day |
| **Google Maps API** | Map rendering | $200/month free credit |
| **Open Food Facts** | Barcode → nutrition data (3M+ products) | Unlimited, no key |

## Dev Tooling

| Tool | Purpose |
|------|---------|
| **Expo CLI** | Project management, build, run |
| **EAS Build** | Production builds (post-hackathon) |
| **EAS Update** | OTA updates (post-hackathon) |
| **Expo Dev Client** | Custom native builds if needed |
| **TypeScript** | Type checking (`npx tsc --noEmit`) |
| **ESLint** | Linting (`npx expo lint`) |

---

## Installation Commands

```bash
# Create project
npx create-expo-app@latest OXZIFIT --template blank-typescript

# Core
npm install expo-router expo-linking expo-constants expo-asset

# Supabase
npm install @supabase/supabase-js
npm install @react-native-async-storage/async-storage

# State management
npm install zustand @tanstack/react-query

# UI & styling
npm install nativewind tailwindcss
npm install react-native-reanimated react-native-gesture-handler
npm install react-native-svg
npm install lottie-react-native
npm install react-native-circular-progress

# Maps & location
npm install react-native-maps
npm install expo-location

# Camera & media
npm install expo-camera expo-image-picker

# Health & sensors
npm install expo-sensors

# Muscle highlighter
npm install react-native-body-highlighter

# Sharing & social
npm install expo-sharing
npm install expo-speech

# Territory map calculations
npm install @turf/turf

# Navigation icons
npm install @expo/vector-icons

# Type definitions
npm install -D @types/react @types/react-native
```

---

## Supabase Setup Steps

1. **Create project** at https://supabase.com
2. **Get credentials**: Project URL + anon key from Settings → API
3. **Run migrations**: Execute the SQL from ARCHITECTURE.md in SQL Editor
4. **Set up RLS**: Enable Row Level Security on all tables
5. **Create Edge Function** for OpenAI proxy:
   ```bash
   supabase functions new ai-food-scan
   ```
6. **Set secrets**:
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-...
   ```

---

## Environment Variables

```env
# .env (gitignored)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Server-side only (in Supabase Edge Functions secrets)
OPENAI_API_KEY=sk-...

# Optional
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

---

## Free Tier Limits Summary

| Service | Free Limit | Enough for Hackathon? |
|---------|-----------|----------------------|
| Supabase | 500MB DB, 1GB storage, 50k monthly users | Yes |
| OpenAI GPT-4o | $5 credits (~500 food scans) | Yes |
| LogMeal | 1000 requests/month | Yes (backup) |
| Google Maps | $200/month credit | Yes |
| wger.de | Unlimited | Yes |
| Expo | Unlimited (managed workflow) | Yes |

---

## Hackathon Constraints

1. **No custom native builds** — everything must work in Expo Go
2. **No GLB/GLTF 3D models** — use Lottie animations + SVG instead
3. **No AR** — use animated 3D-style UI instead
4. **No Google Fit API** — use expo-sensors Pedometer
5. **Minimize API costs** — cache results, use free tiers

---

## Feature → Tech Mapping

| Feature | Hackathon? | Key Libraries/APIs |
|---------|-----------|-------------------|
| Exercise Library + Muscle Highlighter | Yes | `react-native-body-highlighter`, wger.de |
| Cal AI Food Scanner | Yes | `expo-camera`, OpenAI GPT-4o Vision |
| Steps Tracking | Yes | `expo-sensors` Pedometer |
| Route Tracking (GPS) | Yes | `react-native-maps`, `expo-location` |
| Territory Map | Yes | `react-native-maps` Polygon, `@turf/turf` |
| Duolingo Streak System | Yes | Supabase DB, Lottie animations |
| AI Trainer Chat | Yes | OpenAI GPT-4o Text, Supabase Edge Function |
| Smart Meal Swap | Yes | OpenAI GPT-4o Text (nutrition analysis) |
| Shareable Report Card | Yes | Lottie, `react-native-view-shot`, `expo-sharing` |
| Food Barcode Scanner | Yes | `expo-camera` barcode mode, Open Food Facts API |
| Live Workout Challenges | Yes | Supabase Realtime subscriptions |
| Fitness Credit Score | Yes | Supabase DB, custom scoring logic |
| AI Injury Prediction | Production | OpenAI GPT-4o, workout history analysis |
| Population Nutrition | Production | Aggregated Cal AI scan data |
| Adaptive Workout Engine | Production | Health Connect, recovery scoring |
| Nutrient Gap Engine | Production | Meal data aggregation, OpenAI |
| Social Challenges with Stakes | Production | Supabase Realtime, push notifications |
| AI Form Coach | Production | MediaPipe Pose, `expo-camera` video |
| Wearable Health Insights | Production | Health Connect / HealthKit
