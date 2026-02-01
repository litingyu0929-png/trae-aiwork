-- Phase 6: Daily Task System

-- 任務模板
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  persona_id UUID REFERENCES personas(id),
  task_type TEXT NOT NULL, -- post, comment, reply
  time_slot TEXT NOT NULL, -- morning, afternoon, evening
  sequence INTEGER DEFAULT 0,
  frequency TEXT DEFAULT 'daily',
  rule JSONB, -- e.g. {"topic": "analysis", "constraints": []}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 今日任務
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  persona_id UUID REFERENCES personas(id),
  task_type TEXT NOT NULL,
  task_date DATE NOT NULL,
  scheduled_time TIME NOT NULL, -- e.g. '09:00:00'
  time_slot TEXT,
  sequence INTEGER DEFAULT 0,
  asset_id UUID REFERENCES assets(id),
  content_text TEXT,
  status TEXT DEFAULT 'pending', -- pending, in_progress, generated, published
  created_at TIMESTAMPTZ DEFAULT NOW(),
  generated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  UNIQUE(persona_id, task_date, time_slot, sequence)
);

-- Seed a template for testing if persona exists
INSERT INTO task_templates (persona_id, task_type, time_slot, sequence, frequency, rule)
SELECT id, 'post', 'morning', 1, 'daily', '{"topic": "market_overview"}'::jsonb
FROM personas
WHERE name = '運彩老吳'
ON CONFLICT DO NOTHING;

INSERT INTO task_templates (persona_id, task_type, time_slot, sequence, frequency, rule)
SELECT id, 'post', 'evening', 2, 'daily', '{"topic": "game_prediction"}'::jsonb
FROM personas
WHERE name = '運彩老吳'
ON CONFLICT DO NOTHING;
