ALTER TABLE accounts ADD COLUMN persona_id UUID REFERENCES personas(id);
