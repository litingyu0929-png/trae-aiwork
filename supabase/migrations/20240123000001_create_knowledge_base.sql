-- Create knowledge_base table
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments for clarity
COMMENT ON TABLE public.knowledge_base IS 'Stores custom phrases and knowledge for AI generation';
COMMENT ON COLUMN public.knowledge_base.category IS 'Category of the phrase (e.g., sales, faq, lifestyle)';
COMMENT ON COLUMN public.knowledge_base.content IS 'The actual text content';

-- Enable RLS (optional but good practice, though we might not have auth set up fully for this demo)
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access for now (since we are in dev mode)
CREATE POLICY "Allow all access" ON public.knowledge_base FOR ALL USING (true) WITH CHECK (true);
