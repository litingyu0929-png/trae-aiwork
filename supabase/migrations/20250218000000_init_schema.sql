-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'team_leader', 'staff')) DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create accounts table
CREATE TABLE public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT CHECK (platform IN ('instagram', 'threads', 'tiktok', 'xiaohongshu', 'rss', 'web')),
  account_name TEXT NOT NULL,
  account_handle TEXT,
  status TEXT CHECK (status IN ('active', 'banned', 'verification_needed')) DEFAULT 'active',
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for accounts
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Create assets table
CREATE TABLE public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('image', 'video', 'text')),
  source_platform TEXT,
  content_url TEXT,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  tags TEXT[],
  status TEXT CHECK (status IN ('new', 'adopted', 'archived')) DEFAULT 'new',
  adopted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Create contents table
CREATE TABLE public.contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.assets(id),
  persona TEXT,
  content_text TEXT,
  status TEXT CHECK (status IN ('draft', 'scheduled', 'published')) DEFAULT 'draft',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for contents
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

-- Create interactions table (CRM)
CREATE TABLE public.interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id),
  customer_id TEXT,
  stage TEXT CHECK (stage IN ('cold', 'contacted', 'warmed_up', 'intent', 'deal', 'repurchase')),
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for interactions
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- RLS Policies (Simplified for now to allow development)
-- Profiles: Everyone can read, users can update their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Accounts: Authenticated users can read/write
CREATE POLICY "Authenticated users can view accounts" ON public.accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert accounts" ON public.accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update accounts" ON public.accounts FOR UPDATE TO authenticated USING (true);

-- Assets: Authenticated users can read/write
CREATE POLICY "Authenticated users can view assets" ON public.assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert assets" ON public.assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update assets" ON public.assets FOR UPDATE TO authenticated USING (true);

-- Contents: Authenticated users can read/write
CREATE POLICY "Authenticated users can view contents" ON public.contents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert contents" ON public.contents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update contents" ON public.contents FOR UPDATE TO authenticated USING (true);

-- Interactions: Authenticated users can read/write
CREATE POLICY "Authenticated users can view interactions" ON public.interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert interactions" ON public.interactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update interactions" ON public.interactions FOR UPDATE TO authenticated USING (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'staff');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
