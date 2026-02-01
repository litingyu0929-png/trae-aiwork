-- Phase 6.1: Daily Task System Updates

-- Add enabled column to task_templates
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- Update existing templates to have time format for time_slot
UPDATE task_templates 
SET time_slot = '09:00' 
WHERE time_slot = 'morning';

UPDATE task_templates 
SET time_slot = '20:00' 
WHERE time_slot = 'evening';

UPDATE task_templates 
SET time_slot = '14:00' 
WHERE time_slot = 'afternoon';
