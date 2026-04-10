-- 002_rls_policies.sql
-- OXZIFIT: Row Level Security policies

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- workouts
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workouts_select_own" ON workouts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "workouts_insert_own" ON workouts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "workouts_update_own" ON workouts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "workouts_delete_own" ON workouts
  FOR DELETE USING (user_id = auth.uid());

-- meals
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meals_select_own" ON meals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "meals_insert_own" ON meals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "meals_update_own" ON meals
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "meals_delete_own" ON meals
  FOR DELETE USING (user_id = auth.uid());

-- routes
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "routes_select_own" ON routes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "routes_insert_own" ON routes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "routes_update_own" ON routes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "routes_delete_own" ON routes
  FOR DELETE USING (user_id = auth.uid());

-- daily_steps
ALTER TABLE daily_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_steps_select_own" ON daily_steps
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "daily_steps_insert_own" ON daily_steps
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_steps_update_own" ON daily_steps
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "daily_steps_delete_own" ON daily_steps
  FOR DELETE USING (user_id = auth.uid());

-- leaderboard_entries
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaderboard_entries_select_all" ON leaderboard_entries
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "leaderboard_entries_insert_own" ON leaderboard_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "leaderboard_entries_update_own" ON leaderboard_entries
  FOR UPDATE USING (user_id = auth.uid());

-- friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friendships_select_participant" ON friendships
  FOR SELECT USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friendships_insert_own" ON friendships
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "friendships_update_participant" ON friendships
  FOR UPDATE USING (user_id = auth.uid() OR friend_id = auth.uid());

-- achievements (read-only catalog)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements_select_all" ON achievements
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_achievements_select_own" ON user_achievements
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_achievements_insert_own" ON user_achievements
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- territory_claims
ALTER TABLE territory_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "territory_claims_select_all_authenticated" ON territory_claims
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "territory_claims_insert_own" ON territory_claims
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "territory_claims_update_own" ON territory_claims
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "territory_claims_delete_own" ON territory_claims
  FOR DELETE USING (user_id = auth.uid());

-- chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_select_own" ON chat_messages
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "chat_messages_insert_own" ON chat_messages
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- fitness_scores
ALTER TABLE fitness_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fitness_scores_select_own" ON fitness_scores
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "fitness_scores_insert_own" ON fitness_scores
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "fitness_scores_update_own" ON fitness_scores
  FOR UPDATE USING (user_id = auth.uid());

-- streak_freezes
ALTER TABLE streak_freezes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streak_freezes_select_own" ON streak_freezes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "streak_freezes_insert_own" ON streak_freezes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "streak_freezes_update_own" ON streak_freezes
  FOR UPDATE USING (user_id = auth.uid());

-- activity_feed
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_feed_select_own" ON activity_feed
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "activity_feed_insert_own" ON activity_feed
  FOR INSERT WITH CHECK (user_id = auth.uid());
