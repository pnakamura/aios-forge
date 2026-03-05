
-- 1. Create skills table
CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  inputs jsonb NOT NULL DEFAULT '[]'::jsonb,
  outputs jsonb NOT NULL DEFAULT '[]'::jsonb,
  prompt text NOT NULL DEFAULT '',
  examples jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create workflows_library table
CREATE TABLE public.workflows_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  squad_id uuid REFERENCES public.squads(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL DEFAULT '',
  pattern text NOT NULL DEFAULT 'sequential',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  triggers jsonb NOT NULL DEFAULT '[]'::jsonb,
  outputs jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create library_favorites table
CREATE TABLE public.library_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, entity_type, entity_id)
);

-- 4. Add columns to agents
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS usage_count integer NOT NULL DEFAULT 0;

-- 5. Add columns to squads
ALTER TABLE public.squads
  ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS usage_count integer NOT NULL DEFAULT 0;

-- 6. RLS for skills
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage skills via project"
  ON public.skills FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = skills.project_id AND projects.user_id = auth.uid()));

-- 7. RLS for workflows_library
ALTER TABLE public.workflows_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage workflows via project"
  ON public.workflows_library FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = workflows_library.project_id AND projects.user_id = auth.uid()));

-- 8. RLS for library_favorites
ALTER TABLE public.library_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own favorites"
  ON public.library_favorites FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- 9. Updated_at triggers
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflows_library_updated_at BEFORE UPDATE ON public.workflows_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
