-- 核心人設欄位
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS core_value TEXT;

-- 語言風格
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS speech_style JSONB;
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS catchphrases TEXT[];

-- 風控限制
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS constraints JSONB;

-- Few-shot 範例
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS example_dialog TEXT;

-- 人設類型
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS persona_type TEXT;

-- 額外性格標籤
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS personality_traits TEXT[];
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS knowledge_base JSONB;
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS age_range TEXT;
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS schema_version TEXT DEFAULT '1.0';
