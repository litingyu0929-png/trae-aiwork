-- Create ai_learning_stats table
CREATE TABLE IF NOT EXISTS public.ai_learning_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL UNIQUE,
    deleted_count INTEGER DEFAULT 0,
    added_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now()
);

-- Add original_content to work_tasks
ALTER TABLE public.work_tasks ADD COLUMN IF NOT EXISTS original_content TEXT;

-- Add comment
COMMENT ON TABLE public.ai_learning_stats IS 'Tracks words that are frequently deleted or added by users for AI learning';
