-- Fix TTS audio storage bucket policies
-- The previous policy only allowed INSERT, but upsert requires UPDATE
-- Also need to explicitly allow anon role

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Authenticated insert access for tts-audio" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for tts-audio" ON storage.objects;

-- Allow anyone to read from tts-audio bucket
CREATE POLICY "Anyone can read tts-audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tts-audio');

-- Allow anyone to upload to tts-audio bucket
CREATE POLICY "Anyone can upload tts-audio"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'tts-audio');

-- Allow anyone to update files in tts-audio bucket (needed for upsert)
CREATE POLICY "Anyone can update tts-audio"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'tts-audio')
WITH CHECK (bucket_id = 'tts-audio');

-- Allow anyone to delete files in tts-audio bucket
CREATE POLICY "Anyone can delete tts-audio"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'tts-audio');
