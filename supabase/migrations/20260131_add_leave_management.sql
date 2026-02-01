
-- Create leave_applications table
CREATE TABLE IF NOT EXISTS leave_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'personal', 'official', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL CHECK (total_days > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_leave_applications_user_id ON leave_applications(user_id);
CREATE INDEX idx_leave_applications_status ON leave_applications(status);
CREATE INDEX idx_leave_applications_dates ON leave_applications(start_date, end_date);

-- Enable RLS
ALTER TABLE leave_applications ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own applications
CREATE POLICY "Users can view own leave applications" ON leave_applications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own applications
CREATE POLICY "Users can insert own leave applications" ON leave_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins and Team Leaders can view all applications (Simplified for now, ideally strictly hierarchical)
CREATE POLICY "Admins and Team Leaders can view all applications" ON leave_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'team_leader')
        )
    );

-- Admins and Team Leaders can update applications (approve/reject)
CREATE POLICY "Admins and Team Leaders can update applications" ON leave_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'team_leader')
        )
    );
