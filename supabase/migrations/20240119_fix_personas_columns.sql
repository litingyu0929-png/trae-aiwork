-- Fix missing columns in personas table
ALTER TABLE public.personas 
ADD COLUMN IF NOT EXISTS mbti TEXT,
ADD COLUMN IF NOT EXISTS public_positioning TEXT,
ADD COLUMN IF NOT EXISTS primary_role TEXT,
ADD COLUMN IF NOT EXISTS title TEXT;
