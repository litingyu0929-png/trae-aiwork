-- Add onboarding_status to accounts
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS onboarding_status text DEFAULT 'assigned' 
CHECK (onboarding_status IN ('assigned', 'notified', 'binding', 'setting_persona', 'completed'));

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    content jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
    created_at timestamptz DEFAULT now()
);

-- Add is_template to personas
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false;

-- Add RLS policies for notifications (simplified for now)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
ON notifications FOR SELECT 
USING (auth.uid() = recipient_id);

CREATE POLICY "System or Admins can insert notifications" 
ON notifications FOR INSERT 
WITH CHECK (true); -- ideally restrict this

CREATE POLICY "Users can update their own notifications" 
ON notifications FOR UPDATE 
USING (auth.uid() = recipient_id);
