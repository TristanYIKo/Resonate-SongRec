-- Supabase Schema for Music Recommender App
-- Run this in your Supabase SQL editor after setting up Spotify OAuth

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table: stores user profile information from Spotify
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    spotify_id TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Spotify tokens table: stores OAuth tokens for API access
CREATE TABLE IF NOT EXISTS spotify_tokens (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scope TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE spotify_tokens ENABLE ROW LEVEL SECURITY;

-- Users can read their own tokens
CREATE POLICY "Users can read own tokens" ON spotify_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert own tokens" ON spotify_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own tokens" ON spotify_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- User tracks table: stores user's listening history and audio features
CREATE TABLE IF NOT EXISTS user_tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    spotify_track_id TEXT NOT NULL,
    name TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    danceability REAL,
    energy REAL,
    valence REAL,
    tempo REAL,
    acousticness REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, spotify_track_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_tracks_user_id ON user_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tracks_spotify_track_id ON user_tracks(spotify_track_id);

-- Enable Row Level Security
ALTER TABLE user_tracks ENABLE ROW LEVEL SECURITY;

-- Users can read their own tracks
CREATE POLICY "Users can read own tracks" ON user_tracks
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own tracks
CREATE POLICY "Users can insert own tracks" ON user_tracks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tracks
CREATE POLICY "Users can update own tracks" ON user_tracks
    FOR UPDATE USING (auth.uid() = user_id);

-- Recommendations table: stores generated recommendations
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    spotify_track_id TEXT NOT NULL,
    score REAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Users can read their own recommendations
CREATE POLICY "Users can read own recommendations" ON recommendations
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own recommendations
CREATE POLICY "Users can insert own recommendations" ON recommendations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own recommendations
CREATE POLICY "Users can delete own recommendations" ON recommendations
    FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update spotify_tokens updated_at
CREATE TRIGGER update_spotify_tokens_updated_at
    BEFORE UPDATE ON spotify_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
