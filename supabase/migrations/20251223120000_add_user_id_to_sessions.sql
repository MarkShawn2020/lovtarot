-- Add user_id column to tarot_sessions
ALTER TABLE tarot_sessions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tarot_sessions_user_id ON tarot_sessions(user_id);
