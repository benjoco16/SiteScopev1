-- Fix alert_emails column type from TEXT[] to JSONB
-- Run this directly in your PostgreSQL database

-- Step 1: Drop the existing alert_emails column
ALTER TABLE users DROP COLUMN IF EXISTS alert_emails;

-- Step 2: Add alert_emails as JSONB column
ALTER TABLE users ADD COLUMN alert_emails JSONB DEFAULT '[]'::jsonb;

-- Step 3: Verify the change
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'alert_emails';

-- Step 4: Test with a sample update
UPDATE users 
SET alert_emails = '["test@example.com", "admin@example.com"]'::jsonb 
WHERE id = (SELECT id FROM users LIMIT 1)
RETURNING id, alert_emails;
