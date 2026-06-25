-- Run this entire file in Supabase SQL Editor to set up all tables

-- =====================
-- 001: INITIAL SCHEMA
-- =====================

CREATE TABLE IF NOT EXISTS profiles (
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

CREATE TABLE IF NOT EXISTS workouts (
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

CREATE TABLE IF NOT EXISTS meals (
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

CREATE TABLE IF NOT EXISTS routes (
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

CREATE TABLE IF NOT EXISTS daily_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  steps integer NOT NULL DEFAULT 0,
  distance_km numeric,
  calories_burned numeric,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
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

CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  points_reward integer NOT NULL DEFAULT 0,
  icon text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS territory_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id uuid REFERENCES routes(id) ON DELETE SET NULL,
  polygon jsonb NOT NULL,
  area_sq_meters numeric,
  visit_count integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fitness_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS streak_freezes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS friendships_updated_at ON friendships;
CREATE TRIGGER friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS territory_claims_updated_at ON territory_claims;
CREATE TRIGGER territory_claims_updated_at
  BEFORE UPDATE ON territory_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS leaderboard_entries_updated_at ON leaderboard_entries;
CREATE TRIGGER leaderboard_entries_updated_at
  BEFORE UPDATE ON leaderboard_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- 002: RLS POLICIES
-- =====================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE territory_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_freezes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_select_own') THEN
    CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_insert_own') THEN
    CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_update_own') THEN
    CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='workouts' AND policyname='workouts_select_own') THEN
    CREATE POLICY "workouts_select_own" ON workouts FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='workouts' AND policyname='workouts_insert_own') THEN
    CREATE POLICY "workouts_insert_own" ON workouts FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='workouts' AND policyname='workouts_update_own') THEN
    CREATE POLICY "workouts_update_own" ON workouts FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='workouts' AND policyname='workouts_delete_own') THEN
    CREATE POLICY "workouts_delete_own" ON workouts FOR DELETE USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='meals' AND policyname='meals_select_own') THEN
    CREATE POLICY "meals_select_own" ON meals FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='meals' AND policyname='meals_insert_own') THEN
    CREATE POLICY "meals_insert_own" ON meals FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='meals' AND policyname='meals_update_own') THEN
    CREATE POLICY "meals_update_own" ON meals FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='meals' AND policyname='meals_delete_own') THEN
    CREATE POLICY "meals_delete_own" ON meals FOR DELETE USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='routes' AND policyname='routes_select_own') THEN
    CREATE POLICY "routes_select_own" ON routes FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='routes' AND policyname='routes_insert_own') THEN
    CREATE POLICY "routes_insert_own" ON routes FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='routes' AND policyname='routes_update_own') THEN
    CREATE POLICY "routes_update_own" ON routes FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='routes' AND policyname='routes_delete_own') THEN
    CREATE POLICY "routes_delete_own" ON routes FOR DELETE USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_steps' AND policyname='daily_steps_select_own') THEN
    CREATE POLICY "daily_steps_select_own" ON daily_steps FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_steps' AND policyname='daily_steps_insert_own') THEN
    CREATE POLICY "daily_steps_insert_own" ON daily_steps FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_steps' AND policyname='daily_steps_update_own') THEN
    CREATE POLICY "daily_steps_update_own" ON daily_steps FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_steps' AND policyname='daily_steps_delete_own') THEN
    CREATE POLICY "daily_steps_delete_own" ON daily_steps FOR DELETE USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='leaderboard_entries' AND policyname='leaderboard_entries_select_all') THEN
    CREATE POLICY "leaderboard_entries_select_all" ON leaderboard_entries FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='leaderboard_entries' AND policyname='leaderboard_entries_insert_own') THEN
    CREATE POLICY "leaderboard_entries_insert_own" ON leaderboard_entries FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='leaderboard_entries' AND policyname='leaderboard_entries_update_own') THEN
    CREATE POLICY "leaderboard_entries_update_own" ON leaderboard_entries FOR UPDATE USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='friendships' AND policyname='friendships_select_participant') THEN
    CREATE POLICY "friendships_select_participant" ON friendships FOR SELECT USING (user_id = auth.uid() OR friend_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='friendships' AND policyname='friendships_insert_own') THEN
    CREATE POLICY "friendships_insert_own" ON friendships FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='friendships' AND policyname='friendships_update_participant') THEN
    CREATE POLICY "friendships_update_participant" ON friendships FOR UPDATE USING (user_id = auth.uid() OR friend_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='achievements' AND policyname='achievements_select_all') THEN
    CREATE POLICY "achievements_select_all" ON achievements FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_achievements' AND policyname='user_achievements_select_own') THEN
    CREATE POLICY "user_achievements_select_own" ON user_achievements FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_achievements' AND policyname='user_achievements_insert_own') THEN
    CREATE POLICY "user_achievements_insert_own" ON user_achievements FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='territory_claims' AND policyname='territory_claims_select_all_authenticated') THEN
    CREATE POLICY "territory_claims_select_all_authenticated" ON territory_claims FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='territory_claims' AND policyname='territory_claims_insert_own') THEN
    CREATE POLICY "territory_claims_insert_own" ON territory_claims FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='territory_claims' AND policyname='territory_claims_update_own') THEN
    CREATE POLICY "territory_claims_update_own" ON territory_claims FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='territory_claims' AND policyname='territory_claims_delete_own') THEN
    CREATE POLICY "territory_claims_delete_own" ON territory_claims FOR DELETE USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_messages' AND policyname='chat_messages_select_own') THEN
    CREATE POLICY "chat_messages_select_own" ON chat_messages FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_messages' AND policyname='chat_messages_insert_own') THEN
    CREATE POLICY "chat_messages_insert_own" ON chat_messages FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='fitness_scores' AND policyname='fitness_scores_select_own') THEN
    CREATE POLICY "fitness_scores_select_own" ON fitness_scores FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='fitness_scores' AND policyname='fitness_scores_insert_own') THEN
    CREATE POLICY "fitness_scores_insert_own" ON fitness_scores FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='fitness_scores' AND policyname='fitness_scores_update_own') THEN
    CREATE POLICY "fitness_scores_update_own" ON fitness_scores FOR UPDATE USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='streak_freezes' AND policyname='streak_freezes_select_own') THEN
    CREATE POLICY "streak_freezes_select_own" ON streak_freezes FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='streak_freezes' AND policyname='streak_freezes_insert_own') THEN
    CREATE POLICY "streak_freezes_insert_own" ON streak_freezes FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='streak_freezes' AND policyname='streak_freezes_update_own') THEN
    CREATE POLICY "streak_freezes_update_own" ON streak_freezes FOR UPDATE USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='activity_feed' AND policyname='activity_feed_select_own') THEN
    CREATE POLICY "activity_feed_select_own" ON activity_feed FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='activity_feed' AND policyname='activity_feed_insert_own') THEN
    CREATE POLICY "activity_feed_insert_own" ON activity_feed FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- =====================
-- 003: SEED ACHIEVEMENTS
-- =====================

INSERT INTO achievements (name, description, requirement_type, requirement_value, points_reward, icon)
SELECT * FROM (VALUES
  ('First Steps',      'Log your first workout',         'workouts_count', 1,      10,  '🏋️'),
  ('Road Warrior',     'Complete your first route',      'routes_count',   1,      10,  '🛣️'),
  ('Food Scanner',     'Scan your first meal',           'meals_count',    1,      10,  '📷'),
  ('Week Warrior',     'Maintain a 7-day streak',        'streak_days',    7,      50,  '🔥'),
  ('Monthly Champion', 'Maintain a 30-day streak',       'streak_days',    30,     200, '🏆'),
  ('Step Master',      'Walk 10,000 steps in a day',     'daily_steps',    10000,  25,  '👟'),
  ('Century Steps',    'Walk 100,000 total steps',       'total_steps',    100000, 100, '💯'),
  ('Explorer',         'Complete 10 routes',             'routes_count',   10,     75,  '🗺️'),
  ('Nutrition Nerd',   'Log 50 meals',                   'meals_count',    50,     50,  '🥗'),
  ('Iron Will',        'Complete 50 workouts',           'workouts_count', 50,     150, '💪')
) AS v(name, description, requirement_type, requirement_value, points_reward, icon)
WHERE NOT EXISTS (SELECT 1 FROM achievements LIMIT 1);

-- =====================
-- 004: PUBLIC PROFILES VIEW
-- =====================

CREATE OR REPLACE VIEW public_profiles AS
  SELECT id, full_name, avatar_url FROM profiles;

GRANT SELECT ON public_profiles TO anon, authenticated;
