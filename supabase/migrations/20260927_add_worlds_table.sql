-- Create worlds table
CREATE TABLE IF NOT EXISTS worlds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_number INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add world_id to modules
ALTER TABLE modules ADD COLUMN IF NOT EXISTS world_id UUID REFERENCES worlds(id) ON DELETE SET NULL;

-- RLS policies for worlds
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read worlds" ON worlds FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage worlds" ON worlds FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Update RLS for modules
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read modules" ON modules;
CREATE POLICY "Authenticated users can read modules" ON modules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage modules" ON modules FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Update RLS for lessons
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read lessons" ON lessons;
CREATE POLICY "Authenticated users can read lessons" ON lessons FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage lessons" ON lessons FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
