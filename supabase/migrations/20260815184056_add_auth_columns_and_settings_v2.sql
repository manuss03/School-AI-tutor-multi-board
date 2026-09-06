/*
# Add multi-user auth support: user_id columns + per-user LLM settings

Converts the AI Tutor app from single-tenant (no auth) to multi-user (authenticated) mode.
Existing rows get user_id set to nullable first, then NOT NULL after data migration.

## New Table: user_settings
- user_id FK to auth.users ON DELETE CASCADE, UNIQUE
- provider, model, api_key — per-user AI copilot configuration

## Modified Tables
- user_profiles: + user_id (DEFAULT auth.uid())
- chat_messages: + user_id (DEFAULT auth.uid())
- quiz_sessions: + user_id (DEFAULT auth.uid())

## Security
All RLS policies switched from anon-accessible to authenticated owner-scoped.
*/

-- 1. Add user_id columns to existing tables (nullable first since old rows exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'user_id') THEN
    ALTER TABLE user_profiles ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'user_id') THEN
    ALTER TABLE chat_messages ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_sessions' AND column_name = 'user_id') THEN
    ALTER TABLE quiz_sessions ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Delete orphaned old rows that have no user_id (from the pre-auth single-tenant era)
DELETE FROM user_profiles WHERE user_id IS NULL;
DELETE FROM chat_messages WHERE user_id IS NULL;
DELETE FROM quiz_sessions WHERE user_id IS NULL;

-- 3. Now set NOT NULL with DEFAULT auth.uid()
ALTER TABLE user_profiles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE user_profiles ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE chat_messages ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE chat_messages ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE quiz_sessions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE quiz_sessions ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 4. Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'openai' CHECK (provider IN ('openai', 'anthropic')),
  model text NOT NULL DEFAULT 'gpt-4o-mini',
  api_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_settings" ON user_settings;
CREATE POLICY "select_own_settings" ON user_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_settings" ON user_settings;
CREATE POLICY "insert_own_settings" ON user_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_settings" ON user_settings;
CREATE POLICY "update_own_settings" ON user_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_settings" ON user_settings;
CREATE POLICY "delete_own_settings" ON user_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 5. Replace user_profiles policies (drop old anon, add authenticated owner-scoped)
DROP POLICY IF EXISTS "anon_select_user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "anon_insert_user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "anon_update_user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "anon_delete_user_profiles" ON user_profiles;

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profile" ON user_profiles;
CREATE POLICY "delete_own_profile" ON user_profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 6. Replace chat_messages policies
DROP POLICY IF EXISTS "anon_select_chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "anon_insert_chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "anon_delete_chat_messages" ON chat_messages;

DROP POLICY IF EXISTS "select_own_messages" ON chat_messages;
CREATE POLICY "select_own_messages" ON chat_messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_messages" ON chat_messages;
CREATE POLICY "insert_own_messages" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_messages" ON chat_messages;
CREATE POLICY "delete_own_messages" ON chat_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 7. Replace quiz_sessions policies
DROP POLICY IF EXISTS "anon_select_quiz_sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "anon_insert_quiz_sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "anon_update_quiz_sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "anon_delete_quiz_sessions" ON quiz_sessions;

DROP POLICY IF EXISTS "select_own_quizzes" ON quiz_sessions;
CREATE POLICY "select_own_quizzes" ON quiz_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_quizzes" ON quiz_sessions;
CREATE POLICY "insert_own_quizzes" ON quiz_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_quizzes" ON quiz_sessions;
CREATE POLICY "update_own_quizzes" ON quiz_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Indexes for user_id queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id);
