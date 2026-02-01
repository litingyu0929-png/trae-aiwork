-- Add raw_data column to personas table to store the original JSON
ALTER TABLE public.personas 
ADD COLUMN IF NOT EXISTS raw_data JSONB;
