-- SiteScope Database Migration
-- Run this to add the alert_emails column to existing sites table

-- Add alert_emails column to sites table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sites' AND column_name = 'alert_emails'
    ) THEN
        ALTER TABLE sites ADD COLUMN alert_emails TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added alert_emails column to sites table';
    ELSE
        RAISE NOTICE 'alert_emails column already exists in sites table';
    END IF;
END $$;

-- Update existing sites to have empty alert_emails array if NULL
UPDATE sites SET alert_emails = '{}' WHERE alert_emails IS NULL;

-- Add alert_emails column to users table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'alert_emails') THEN
        ALTER TABLE users ADD COLUMN alert_emails JSONB DEFAULT '[]';
        RAISE NOTICE 'Added alert_emails column to users table';
    ELSE
        RAISE NOTICE 'alert_emails column already exists in users table';
    END IF;
END $$;

-- Fix existing alert_emails column if it's TEXT[] instead of JSONB
DO $$
BEGIN
    -- Check if the column exists and is TEXT[] type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'alert_emails' 
               AND data_type = 'ARRAY') THEN
        
        -- Drop the existing column and recreate as JSONB
        ALTER TABLE users DROP COLUMN alert_emails;
        ALTER TABLE users ADD COLUMN alert_emails JSONB DEFAULT '[]';
        RAISE NOTICE 'Recreated alert_emails column as JSONB type';
    END IF;
END $$;

-- Update existing users to have empty alert_emails array if NULL
UPDATE users SET alert_emails = '[]'::jsonb WHERE alert_emails IS NULL;

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_site_logs_site_id ON site_logs(site_id);
CREATE INDEX IF NOT EXISTS idx_site_logs_checked_at ON site_logs(checked_at);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);

-- Verify the migration
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sites' 
ORDER BY ordinal_position;
