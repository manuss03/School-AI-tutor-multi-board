/*
# Expand user_settings provider constraint

Updates the CHECK constraint on user_settings.provider to allow additional
AI providers: perplexity, groq, gemini, mistral, openrouter.

## Modified Table: user_settings
- provider CHECK constraint updated to include 7 providers total.
- No data loss — only the constraint is widened.
*/

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_provider_check;

ALTER TABLE user_settings ADD CONSTRAINT user_settings_provider_check
  CHECK (provider IN ('openai', 'anthropic', 'perplexity', 'groq', 'gemini', 'mistral', 'openrouter'));
