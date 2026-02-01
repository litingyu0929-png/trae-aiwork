ALTER TABLE assets ADD COLUMN persona_id UUID REFERENCES personas(id);
