-- 1. personas 表
CREATE TABLE IF NOT EXISTS public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT,
  mbti TEXT,
  public_positioning TEXT,
  primary_role TEXT,
  tone TEXT,
  task_profile JSONB DEFAULT '{}'::jsonb,
  derived_domains TEXT[] DEFAULT '{}',
  asset_type_whitelist TEXT[] DEFAULT '{}',
  risk_level_max INTEGER CHECK (risk_level_max >= 1 AND risk_level_max <= 5) DEFAULT 1,
  role_category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. assets 表 (更新欄位)
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS sub_category TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS raw_content TEXT,
ADD COLUMN IF NOT EXISTS processed_content TEXT,
ADD COLUMN IF NOT EXISTS risk_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS fingerprint TEXT;

-- 3. staff_persona_assignments 表
CREATE TABLE IF NOT EXISTS public.staff_persona_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.profiles(id),
  persona_id UUID NOT NULL REFERENCES public.personas(id),
  account_id UUID REFERENCES public.accounts(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. work_tasks 表
CREATE TABLE IF NOT EXISTS public.work_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID REFERENCES public.personas(id),
  assigned_asset_id UUID REFERENCES public.assets(id),
  staff_id UUID REFERENCES public.profiles(id),
  account_id UUID REFERENCES public.accounts(id),
  platform TEXT,
  content_text TEXT,
  status TEXT DEFAULT 'pending_publish',
  post_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
