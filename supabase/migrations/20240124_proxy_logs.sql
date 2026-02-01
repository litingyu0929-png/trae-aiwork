-- Create proxy_logs table to track impersonation/proxy events
CREATE TABLE IF NOT EXISTS proxy_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    proxy_user_id uuid REFERENCES profiles(id), -- The user performing the action (e.g. Admin)
    target_user_id uuid REFERENCES profiles(id), -- The user being impersonated
    action_type text NOT NULL, -- 'bind', 'unbind'
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE proxy_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert logs (or restrict to admins/leaders if preferred)
CREATE POLICY "Users can insert proxy logs" 
ON proxy_logs FOR INSERT 
WITH CHECK (auth.uid() = proxy_user_id);

-- Allow admins to view logs
CREATE POLICY "Admins can view proxy logs" 
ON proxy_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'team_leader')
  )
);
