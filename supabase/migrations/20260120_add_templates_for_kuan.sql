-- Migration: Add Persona "電子阿寬" and Task Templates
-- Type: Harvesting (收割型)
-- Tasks: post_casino, reply_dm

DO $$
DECLARE
  v_persona_id UUID;
BEGIN
  -- 1. 取得或建立 Persona ID
  SELECT id INTO v_persona_id FROM personas WHERE name = '電子阿寬';
  
  IF v_persona_id IS NULL THEN
    INSERT INTO personas (
      name, 
      matrix_type, 
      public_positioning, 
      risk_level_max, 
      description,
      tone
    )
    VALUES (
      '電子阿寬', 
      'harvesting', 
      '電子遊戲專家', 
      1, 
      '專注於電子遊戲與百家樂的分析與分享，風格犀利直接',
      '專業、自信、略帶嘲諷'
    )
    RETURNING id INTO v_persona_id;
    
    RAISE NOTICE 'Created new persona: 電子阿寬';
  ELSE
    RAISE NOTICE 'Found existing persona: 電子阿寬';
  END IF;

  -- 2. 新增任務模板 (若不存在)
  
  -- (1) post_casino (下午 15:00)
  IF NOT EXISTS (SELECT 1 FROM task_templates WHERE persona_id = v_persona_id AND task_type = 'post_casino' AND time_slot = '15:00') THEN
    INSERT INTO task_templates (persona_id, task_type, time_slot, sequence, frequency, rule, enabled)
    VALUES (v_persona_id, 'post_casino', '15:00', 0, 'daily', '{}', true);
  END IF;

  -- (2) reply_dm (中午 12:00)
  IF NOT EXISTS (SELECT 1 FROM task_templates WHERE persona_id = v_persona_id AND task_type = 'reply_dm' AND time_slot = '12:00') THEN
    INSERT INTO task_templates (persona_id, task_type, time_slot, sequence, frequency, rule, enabled)
    VALUES (v_persona_id, 'reply_dm', '12:00', 0, 'daily', '{}', true);
  END IF;

  -- (3) reply_dm (晚上 20:00)
  IF NOT EXISTS (SELECT 1 FROM task_templates WHERE persona_id = v_persona_id AND task_type = 'reply_dm' AND time_slot = '20:00') THEN
    INSERT INTO task_templates (persona_id, task_type, time_slot, sequence, frequency, rule, enabled)
    VALUES (v_persona_id, 'reply_dm', '20:00', 0, 'daily', '{}', true);
  END IF;

END $$;
