
-- Create user_spotify_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_spotify_data (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    top_tracks JSONB,
    top_artists JSONB,
    playlists JSONB,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_spotify_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read own spotify data" ON user_spotify_data;
DROP POLICY IF EXISTS "Users can insert own spotify data" ON user_spotify_data;
DROP POLICY IF EXISTS "Users can update own spotify data" ON user_spotify_data;
DROP POLICY IF EXISTS "Users can delete own spotify data" ON user_spotify_data;

-- Create proper RLS policies
CREATE POLICY "Users can read own spotify data" 
    ON user_spotify_data FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spotify data" 
    ON user_spotify_data FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spotify data" 
    ON user_spotify_data FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own spotify data" 
    ON user_spotify_data FOR DELETE 
    USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_spotify_data_user_id ON user_spotify_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_spotify_data_synced_at ON user_spotify_data(synced_at DESC);

-- Verify RLS is enabled (should return true)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_spotify_data';

-- Verify policies exist (should return 4 rows)
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_spotify_data';
