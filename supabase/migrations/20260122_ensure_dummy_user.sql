-- Ensure a dummy user exists for development purposes
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'test_user@example.com',
  'dummy_password_hash',
  now(),
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Also ensure this user is in public.profiles
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'test_user@example.com',
  'Test User',
  'staff'
)
ON CONFLICT (id) DO NOTHING;
