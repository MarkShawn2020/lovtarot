-- Create user_profiles table for personalized tarot readings
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  age_range text CHECK (age_range IN ('18-25', '26-35', '36-45', '46+')),
  relationship_status text CHECK (relationship_status IN ('single', 'dating', 'married', 'complicated')),
  occupation text CHECK (occupation IN ('student', 'employed', 'freelance', 'other')),
  current_focus text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
