# AGENTS.md

## Project: OXZIFIT
All-in-one fitness app: exercises, Cal AI food scanner, route tracking, steps counter, leaderboard.

## Tech Stack
- React Native + Expo (SDK 52+), TypeScript (strict mode)
- Expo Router (file-based navigation)
- Supabase (Auth, PostgreSQL, Storage, Edge Functions, Realtime)
- Zustand + React Query (state management)
- NativeWind (Tailwind CSS for React Native)

## File Structure Convention
```
app/              → Screens (Expo Router file-based routing)
components/       → Reusable UI components (PascalCase)
hooks/            → Custom hooks (camelCase, use* prefix)
stores/           → Zustand stores (camelCase, *Store suffix)
lib/              → API clients, utilities
types/            → TypeScript type definitions
assets/           → Static assets (images, animations, fonts)
supabase/         → Migrations and Edge Functions
```

## Code Style
- TypeScript strict mode, no `any` types
- Functional components with hooks only
- All components use `export default`
- File naming: PascalCase for components, camelCase for utilities
- Use NativeWind classes for styling (Tailwind syntax)
- No comments in code unless explicitly asked
- All API calls go through `lib/` layer, never directly in components

## Key Libraries (DO NOT change these)
- `react-native-body-highlighter` for muscle visualization
- `expo-sensors` Pedometer for steps tracking
- `react-native-maps` + `expo-location` for GPS tracking
- `react-native-reanimated` for animations
- `lottie-react-native` for complex animations
- OpenAI GPT-4o Vision via Supabase Edge Functions for Cal AI
- `zustand` for client state, `@tanstack/react-query` for server state

## Do NOT Use
- React Three Fiber / GLB models (broken in Expo Go)
- AR libraries (ARKit/ARCore) for hackathon scope
- Google Fit API (deprecated, use Health Connect instead)
- Redux (use Zustand instead)

## Environment Variables
- `EXPO_PUBLIC_*` prefix for client-side env vars
- `OPENAI_API_KEY` only in Edge Functions (server-side), NEVER expose to client
- See `.env.example` for full list

## Supabase Conventions
- All DB queries use Row Level Security (RLS) policies
- Auth required for all routes except login/signup
- Use `supabase.from('table').select()` pattern
- Edge Functions in `supabase/functions/` for server-side logic

## Testing
- Run `npx expo lint` before commits
- Run `npx tsc --noEmit` for type checking
- Test on both iOS and Android before marking task complete

## Hackathon Rules
- MVP first, polish later
- If a feature takes >4 hours, simplify it
- Every feature must work in Expo Go (no custom native builds)
- Prioritize visual impact for demo
