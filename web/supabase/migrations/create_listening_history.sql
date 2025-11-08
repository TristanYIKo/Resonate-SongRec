-- Create listening_history table to store monthly listening data
CREATE TABLE IF NOT EXISTS listening_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  hours DECIMAL(10, 2) NOT NULL DEFAULT 0,
  track_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_listening_history_user_year_month 
ON listening_history(user_id, year, month);

-- Enable Row Level Security
ALTER TABLE listening_history ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own listening history
CREATE POLICY "Users can view their own listening history"
ON listening_history
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy: Users can insert their own listening history
CREATE POLICY "Users can insert their own listening history"
ON listening_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own listening history
CREATE POLICY "Users can update their own listening history"
ON listening_history
FOR UPDATE
USING (auth.uid() = user_id);

-- Create policy: Users can delete their own listening history
CREATE POLICY "Users can delete their own listening history"
ON listening_history
FOR DELETE
USING (auth.uid() = user_id);
