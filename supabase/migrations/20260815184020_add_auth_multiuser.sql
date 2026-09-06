/*
# Add multi-user auth support: user_id columns + per-user LLM settings

## Summary
Converts the AI Tutor app from single-tenant (no auth) to multi-user (authenticated) mode.
Each user's data — profile, chat history, quiz sessions, and LLM API key settings — is now
scoped to that user via Row Level Security ownership checks.

## Changes

### 1. New Table: user_settings
Stores each user's AI provider configuration (provider, model, encrypted API key).
- id (uuid PK)
- user_id (uuid, NOT NULL, DEFAULT auth.uid(), FK to auth.users ON DELETE CASCADE)
- provider (text: 'openai' | 'anthropic')
- model (text)
- api_key (text) — the user's OpenAI/Anthropic API key
- created_at, updated_at (timestamps)
Only the owner can read/write their own settings row.

### 2. Modified Table: user_profiles
- Added column: user_id (uuid, NOT NULL, DEFAULT auth.uid(), FK to auth.users ON DELETE CASCADE)
This scopes each student's onboarding profile to their account.

### 3. Modified Table: chat_messages
- Added column: user_id (uuid, NOT NULL, DEFAULT auth.uid(), FK to auth.users ON DELETE CASCADE)
Each conversation message is owned by the user who sent it.

### 4. Modified Table: quiz_sessions
- Added column: user_id (uuid, NOT NULL, DEFAULT auth.uid(), FK to auth.users ON DELETE CASCADE)
Each quiz/test session is owned by the user who took it.

### 5. Security — RLS Policy Changes
All tables now use authenticated-only, owner-scoped RLS policies:
- user_profiles: SELECT/INSERT/UPDATE/DELETE WHERE auth.uid() = user_id
- chat_messages: SELECT/INSERT/DELETE WHERE auth.uid() = user_id
- quiz_sessions: SELECT/INSERT/UPDATE WHERE auth.uid() = user_id
- user_settings: SELECT/INSERT/UPDATE/DELETE WHERE auth.uid() = user_id

The old anon-accessible policies are dropped and replaced with authenticated owner-scoped ones.

### Important Notes
1. user_id columns default to auth.uid() so inserts that omit user_id still satisfy WITH CHECK.
2. ON DELETE CASCADE ensures all user data is removed if the auth account is deleted.
3. Each user has at most one settings row and one profile row (enforced by unique constraint).
4. The old profile-id-based localStorage lookup is replaced by auth session-based loading.
*/
