-- Phase 6.2: Add staff_persona_assignments and other needed columns

-- Create staff_persona_assignments table if not exists
CREATE TABLE IF NOT EXISTS staff_persona_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL, -- Changed to UUID to match auth.users usually, but user provided TEXT 'demo-staff-id' which is not valid UUID. 
  -- However, since the error said invalid input syntax for type uuid: "demo-staff-id", it implies staff_id might be expected to be UUID in some context or the target column is UUID.
  -- But wait, I defined staff_id as TEXT above. Why did it fail?
  -- Ah, the previous migration failed, so the table might not have been created or created partially? 
  -- No, if it failed, it rolled back.
  -- The error "invalid input syntax for type uuid: "demo-staff-id"" suggests that somewhere a UUID is expected.
  -- Maybe I should use a valid UUID for the demo staff id.
  persona_id UUID REFERENCES personas(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, persona_id)
);

-- Add notes column to daily_tasks if not exists
ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS post_url TEXT;

-- Seed some assignment for demo using a valid UUID
INSERT INTO staff_persona_assignments (staff_id, persona_id)
SELECT '00000000-0000-0000-0000-000000000000', id FROM personas WHERE name = '運彩老吳'
ON CONFLICT DO NOTHING;
