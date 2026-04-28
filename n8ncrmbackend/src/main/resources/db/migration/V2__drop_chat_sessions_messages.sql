-- Issue #11: Remove the unused 'messages' JSONB column from chat_sessions.
-- Messages are stored in the separate chat_messages table; this column is dead weight.
ALTER TABLE chat_sessions DROP COLUMN IF EXISTS messages;
