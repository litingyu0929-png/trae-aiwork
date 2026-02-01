-- Phase 6.2: Add staff_persona_assignments and other needed columns

-- Create staff_persona_assignments table if not exists
CREATE TABLE IF NOT EXISTS staff_persona_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id TEXT NOT NULL,
  persona_id UUID REFERENCES personas(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, persona_id)
);

-- Add notes column to daily_tasks if not exists
ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS post_url TEXT;

-- Seed some assignment for demo
INSERT INTO staff_persona_assignments (staff_id, persona_id)
SELECT 'demo-staff-id', id FROM personas WHERE name = '運彩老吳'
ON CONFLICT DO NOTHING;
