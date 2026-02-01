-- Add original_content to contents table
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS original_content TEXT;

-- Create ai_learning_stats table
CREATE TABLE IF NOT EXISTS public.ai_learning_stats (
    term TEXT PRIMARY KEY,
    deletion_count INTEGER DEFAULT 0,
    addition_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.ai_learning_stats IS 'Tracks keywords added or removed by users to refine AI generation';

-- Enable RLS
ALTER TABLE public.ai_learning_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.ai_learning_stats FOR ALL USING (true) WITH CHECK (true);
