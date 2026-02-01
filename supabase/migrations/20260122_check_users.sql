-- Check for existing users to use as a valid owner_id
SELECT id, email FROM auth.users LIMIT 5;
