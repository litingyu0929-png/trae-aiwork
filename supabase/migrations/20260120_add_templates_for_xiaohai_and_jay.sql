-- Add task templates for new personas: XiaoHai and Jay

-- 1. XiaoHai (脆友小海) - Anxious, FOMO, Trendy
WITH xiaohai AS (
  SELECT id FROM personas WHERE name LIKE '脆友小海%' LIMIT 1
)
INSERT INTO task_templates (persona_id, task_type, time_slot, sequence, frequency, rule)
SELECT id, 'morning_anxiety', '08:30', 1, 'daily', '{"topic": "morning_commute_anxiety", "tone": "anxious"}'::jsonb FROM xiaohai
UNION ALL
SELECT id, 'trend_following', '12:30', 2, 'weekday', '{"topic": "viral_topic_reaction", "tone": "curious"}'::jsonb FROM xiaohai
UNION ALL
SELECT id, 'evening_question', '20:00', 3, 'daily', '{"topic": "random_question_for_engagement", "tone": "seeking_validation"}'::jsonb FROM xiaohai
ON CONFLICT DO NOTHING;

-- 2. Jay (小資阿傑) - Tired Staff, Sports Fan
WITH jay AS (
  SELECT id FROM personas WHERE name LIKE '小資阿傑%' LIMIT 1
)
INSERT INTO task_templates (persona_id, task_type, time_slot, sequence, frequency, rule)
SELECT id, 'work_complaint', '09:00', 1, 'weekday', '{"topic": "want_to_go_home", "tone": "tired"}'::jsonb FROM jay
UNION ALL
SELECT id, 'dinner_vibe', '18:30', 2, 'weekday', '{"topic": "off_work_food", "tone": "relieved"}'::jsonb FROM jay
UNION ALL
SELECT id, 'sports_watch', '21:00', 3, 'daily', '{"topic": "watching_game", "tone": "excited_or_disappointed"}'::jsonb FROM jay
ON CONFLICT DO NOTHING;
