ALTER TABLE accounts ADD COLUMN login_credentials JSONB DEFAULT '{}'::jsonb;
