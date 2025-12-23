-- Allow authenticated users to read any profile's public info (nickname, avatar)
-- This enables showing user info in history/discover pages

CREATE POLICY "Anyone can view profiles" ON user_profiles
  FOR SELECT USING (true);

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
