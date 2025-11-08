# Database Setup for Listening History

## You need to run this SQL in your Supabase SQL Editor:

1. Go to https://supabase.com/dashboard
2. Select your project: cmooatsolqckgdpacolr
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the SQL from `web/supabase/migrations/create_listening_history.sql`
6. Click "Run" to execute

The SQL will create:
- A `listening_history` table to store monthly listening data
- Proper indexes for performance
- Row Level Security policies so users can only see their own data

## Table Structure:
- `user_id`: Links to the authenticated user
- `year`: Year (e.g., 2025)
- `month`: Month number (1-12)
- `hours`: Total listening hours for that month
- `track_count`: Number of tracks played
- `created_at` / `updated_at`: Timestamps

The unique constraint on (user_id, year, month) ensures we don't have duplicate entries.

## How it works:
1. When you visit the dashboard, it fetches your stored listening history
2. It also fetches your recent Spotify activity
3. For the current month, it updates the database with fresh data
4. Past months show the stored historical data
5. This way, your listening history accumulates over time!
