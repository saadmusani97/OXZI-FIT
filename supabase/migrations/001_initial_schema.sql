-- 001_initial_schema.sql
-- OXZIFIT: Initial database schema

-- profiles: extends auth.users
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  age integer,
  gender text,
  height_cm numeric,
  weight_kg numeric,
  fitness_goal text,
  activity_level text,
  dietary_preference text,
  daily_step_goal integer DEFAULT 10000,
  daily_calorie_goal integer DEFAULT 2000,
  streak_count integer DEFAULT 0,
  streak_shield boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- workouts: exercise logs
CREATE TABLE workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id text NOT NULL,
  exercise_name text NOT NULL,
  sets integer,
  reps integer,
  weight_kg numeric,
  duration_seconds integer,
  completed_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- meals: Cal AI food logs
CREATE TABLE meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name text NOT NULL,
  calories numeric NOT NULL,
  protein_g numeric NOT NULL,
  fat_g numeric NOT NULL,
  carbs_g numeric NOT NULL,
  fiber_g numeric,
  portion_size text,
  image_url text,
  ai_confidence numeric,
  meal_type text CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  logged_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- routes: GPS routes with coordinates JSONB
CREATE TABLE routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('run', 'walk', 'cycle')),
  distance_km numeric NOT NULL,
  duration_seconds integer NOT NULL,
  coordinates jsonb NOT NULL DEFAULT '[]',
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- daily_steps: daily step aggregation
CREATE TABLE daily_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  steps integer NOT NULL DEFAULT 0,
  distance_km numeric,
  calories_burned numeric,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

-- leaderboard_entries: monthly points per user
CREATE TABLE leaderboard_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month text NOT NULL,
  total_points integer NOT NULL DEFAULT 0,
  step_points integer NOT NULL DEFAULT 0,
  workout_points integer NOT NULL DEFAULT 0,
  meal_points integer NOT NULL DEFAULT 0,
  route_points integer NOT NULL DEFAULT 0,
  streak_points integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, month)
);

-- friendships: friend graph
CREATE TABLE friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- achievements: catalog
CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  points_reward integer NOT NULL DEFAULT 0,
  icon text,
  created_at timestamptz DEFAULT now()
);

-- user_achievements: unlocked achievements per user
CREATE TABLE user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

-- territory_claims: convex hull polygons from routes
CREATE TABLE territory_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id uuid REFERENCES routes(id) ON DELETE SET NULL,
  polygon jsonb NOT NULL,
  area_sq_meters numeric,
  visit_count integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- chat_messages: AI trainer chat history
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- fitness_scores: daily score snapshots (300-850)
CREATE TABLE fitness_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

-- streak_freezes: purchased streak freeze tokens
CREATE TABLE streak_freezes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- activity_feed: social feed events
CREATE TABLE activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER territory_claims_updated_at
  BEFORE UPDATE ON territory_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER leaderboard_entries_updated_at
  BEFORE UPDATE ON leaderboard_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
