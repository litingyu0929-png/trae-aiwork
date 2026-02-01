-- Phase 9: Logging System
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  level TEXT NOT NULL, -- 'info', 'warn', 'error', 'action'
  action_type TEXT NOT NULL, -- 'auto_generate', 'manual_update', 'login', etc.
  user_id UUID, -- NULL for system actions
  details JSONB DEFAULT '{}', -- Affected IDs, diffs, etc.
  ip_address TEXT,
  status_code INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster querying
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_action_type ON system_logs(action_type);
