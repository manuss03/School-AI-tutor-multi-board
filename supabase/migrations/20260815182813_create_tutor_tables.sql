/*
# Create AI Tutor tables (single-tenant, no auth)

1. New Tables
- `user_profiles`: stores the student's onboarding selections (board, region, city, class, subject).
  - id (uuid PK), board (text), region (text), city (text), class_level (text), subject (text),
    created_at, updated_at.
- `chat_messages`: stores conversation history between the student and the AI tutor.
  - id (uuid PK), profile_id (FK -> user_profiles), role (text: 'user'|'assistant'), content (text), mode (text: 'learn'|'test'), created_at.
- `quiz_sessions`: stores a generated quiz/test and its results.
  - id (uuid PK), profile_id (FK -> user_profiles), subject (text), topic (text), quiz_type (text: 'quiz'|'mock_exam'),
    questions (jsonb), answers (jsonb), score (int), total (int), feedback (jsonb), status (text: 'in_progress'|'completed'), created_at, completed_at.
2. Security
- Enable RLS on all tables.
- Allow anon + authenticated CRUD (single-tenant, intentionally public/shared data).
3. Notes
- All questions and answers stored as JSONB for flexibility (MCQ, short answer, etc.).
- Feedback stored as JSONB (per-question feedback + overall improvement suggestions).
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board text NOT NULL,
  region text NOT NULL,
  city text NOT NULL,
  class_level text NOT NULL,
  subject text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_user_profiles" ON user_profiles;
CREATE POLICY "anon_select_user_profiles" ON user_profiles FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_user_profiles" ON user_profiles;
CREATE POLICY "anon_insert_user_profiles" ON user_profiles FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_user_profiles" ON user_profiles;
CREATE POLICY "anon_update_user_profiles" ON user_profiles FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_user_profiles" ON user_profiles;
CREATE POLICY "anon_delete_user_profiles" ON user_profiles FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  mode text NOT NULL DEFAULT 'learn' CHECK (mode IN ('learn', 'test')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_chat_messages" ON chat_messages;
CREATE POLICY "anon_select_chat_messages" ON chat_messages FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_chat_messages" ON chat_messages;
CREATE POLICY "anon_insert_chat_messages" ON chat_messages FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_chat_messages" ON chat_messages;
CREATE POLICY "anon_delete_chat_messages" ON chat_messages FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  topic text NOT NULL,
  quiz_type text NOT NULL DEFAULT 'quiz' CHECK (quiz_type IN ('quiz', 'mock_exam')),
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  score int NOT NULL DEFAULT 0,
  total int NOT NULL DEFAULT 0,
  feedback jsonb,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_quiz_sessions" ON quiz_sessions;
CREATE POLICY "anon_select_quiz_sessions" ON quiz_sessions FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_quiz_sessions" ON quiz_sessions;
CREATE POLICY "anon_insert_quiz_sessions" ON quiz_sessions FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_quiz_sessions" ON quiz_sessions;
CREATE POLICY "anon_update_quiz_sessions" ON quiz_sessions FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_quiz_sessions" ON quiz_sessions;
CREATE POLICY "anon_delete_quiz_sessions" ON quiz_sessions FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_chat_messages_profile_id ON chat_messages(profile_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_profile_id ON quiz_sessions(profile_id);
