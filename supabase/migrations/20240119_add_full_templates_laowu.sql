-- Phase 8.3: Add full task templates for "運彩老吳"

-- 1. Get Persona ID
WITH target_persona AS (
  SELECT id FROM personas WHERE name = '運彩老吳' LIMIT 1
)
-- 2. Insert Templates
INSERT INTO task_templates (persona_id, task_type, time_slot, sequence, frequency, rule)
SELECT id, 'post_lifestyle', '09:00', 0, 'daily', '{}' FROM target_persona
UNION ALL
SELECT id, 'post_sport_preview', '17:30', 0, 'match_day', '{"sport": "nba"}' FROM target_persona
UNION ALL
SELECT id, 'post_sport_result', '20:00', 0, 'daily', '{}' FROM target_persona
UNION ALL
SELECT id, 'post_sport_preview', '21:30', 0, 'weekday', '{}' FROM target_persona
UNION ALL
SELECT id, 'reply_dm', '10:00', 0, 'daily', '{}' FROM target_persona
UNION ALL
SELECT id, 'reply_dm', '14:00', 0, 'daily', '{}' FROM target_persona
UNION ALL
SELECT id, 'reply_dm', '18:00', 0, 'daily', '{}' FROM target_persona
UNION ALL
SELECT id, 'reply_dm', '22:00', 0, 'daily', '{}' FROM target_persona
ON CONFLICT DO NOTHING;
