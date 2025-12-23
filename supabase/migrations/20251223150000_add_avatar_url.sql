-- Add avatar_url to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own avatar
DO $$ BEGIN
  CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow authenticated users to update their own avatar
DO $$ BEGIN
  CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow anyone to read avatars
DO $$ BEGIN
  CREATE POLICY "Anyone can read avatars" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
