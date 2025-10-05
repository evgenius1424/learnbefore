-- Basic database schema for Learnbefore app
-- Run this in your Supabase SQL editor to set up the tables

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Words table
CREATE TABLE IF NOT EXISTS words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  translation TEXT,
  meaning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to access their own data
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (auth.uid()::text = user_id);

-- Policies for words (accessible through message ownership)
CREATE POLICY "Users can view words for their messages" ON words
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = words.message_id
      AND messages.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert words for their messages" ON words
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = words.message_id
      AND messages.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update words for their messages" ON words
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = words.message_id
      AND messages.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete words for their messages" ON words
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = words.message_id
      AND messages.user_id = auth.uid()::text
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_words_message_id ON words(message_id);