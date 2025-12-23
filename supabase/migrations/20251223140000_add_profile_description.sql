-- Add description field to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS description text;
