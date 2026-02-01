-- Update assets visibility check constraint to include 'shared'
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_visibility_check;

ALTER TABLE assets ADD CONSTRAINT assets_visibility_check 
  CHECK (visibility IN ('private', 'public', 'team', 'shared'));
