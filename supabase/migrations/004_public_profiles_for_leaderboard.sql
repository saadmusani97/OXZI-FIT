-- Allow authenticated users to read profile rows so social surfaces like the leaderboard
-- can display names and avatars. This is broader than ideal for production, but it unblocks
-- the current client-side app architecture.
CREATE POLICY "profiles_select_all_authenticated" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);
