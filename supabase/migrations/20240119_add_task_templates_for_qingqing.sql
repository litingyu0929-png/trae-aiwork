-- Phase 6.4: Add task templates for "菜鳥代理・晴晴"

-- 1. Get Persona ID
WITH target_persona AS (
  SELECT id FROM personas WHERE name = '菜鳥代理・晴晴' LIMIT 1
)
-- 2. Insert Templates
INSERT INTO task_templates (persona_id, task_type, time_slot, sequence, frequency, enabled)
SELECT 
  id, 
  '早安碎念', 
  '08:30', 
  1, 
  'weekday', 
  true
FROM target_persona
UNION ALL
SELECT 
  id, 
  '工作觀察', 
  '18:00', 
  2, 
  'daily', 
  true
FROM target_persona
ON CONFLICT DO NOTHING;
