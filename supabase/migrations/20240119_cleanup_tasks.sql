-- Clean up daily tasks for Persona "運彩老吳"
DELETE FROM daily_tasks
WHERE persona_id = (SELECT id FROM personas WHERE name = '運彩老吳');
