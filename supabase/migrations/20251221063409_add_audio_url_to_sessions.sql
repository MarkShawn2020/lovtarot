-- Add audio_url column to store TTS audio cache
ALTER TABLE tarot_sessions ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Create storage bucket for TTS audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('tts-audio', 'tts-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to tts-audio bucket
CREATE POLICY "Public read access for tts-audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'tts-audio');

-- Allow authenticated insert to tts-audio bucket
CREATE POLICY "Authenticated insert access for tts-audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tts-audio');
