
-- Enum types
CREATE TYPE public.orchestration_pattern AS ENUM (
  'SEQUENTIAL_PIPELINE', 'PARALLEL_SWARM', 'HIERARCHICAL', 
  'WATCHDOG', 'COLLABORATIVE', 'TASK_FIRST'
);

CREATE TYPE public.integration_type AS ENUM (
  'N8N', 'CLAUDE_API', 'MCP_SERVER', 'NOTION', 'MIRO', 'OPENAI_API'
);

CREATE TYPE public.integration_status AS ENUM (
  'CONFIGURED', 'TESTED', 'FAILED'
);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL DEFAULT 'software',
  orchestration_pattern public.orchestration_pattern NOT NULL DEFAULT 'TASK_FIRST',
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Agents table
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  role TEXT NOT NULL,
  system_prompt TEXT NOT NULL DEFAULT '',
  llm_model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  commands JSONB NOT NULL DEFAULT '[]',
  tools JSONB NOT NULL DEFAULT '[]',
  skills JSONB NOT NULL DEFAULT '[]',
  visibility TEXT NOT NULL DEFAULT 'full',
  is_custom BOOLEAN NOT NULL DEFAULT false,
  definition_md TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, slug)
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage agents via project" ON public.agents FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = agents.project_id AND user_id = auth.uid()));

-- Squads table
CREATE TABLE public.squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  manifest_yaml TEXT NOT NULL DEFAULT '',
  tasks JSONB NOT NULL DEFAULT '[]',
  workflows JSONB NOT NULL DEFAULT '[]',
  agent_ids JSONB NOT NULL DEFAULT '[]',
  is_validated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, slug)
);

ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage squads via project" ON public.squads FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = squads.project_id AND user_id = auth.uid()));

-- Integrations table
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type public.integration_type NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  status public.integration_status NOT NULL DEFAULT 'CONFIGURED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, type)
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage integrations via project" ON public.integrations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = integrations.project_id AND user_id = auth.uid()));

-- Wizard sessions table
CREATE TABLE public.wizard_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  current_step INT NOT NULL DEFAULT 1,
  wizard_state JSONB NOT NULL DEFAULT '{}',
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wizard_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions" ON public.wizard_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Generated files table (for persistence)
CREATE TABLE public.generated_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'other',
  compliance_status TEXT NOT NULL DEFAULT 'pending',
  compliance_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage generated files via project" ON public.generated_files FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = generated_files.project_id AND user_id = auth.uid()));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_squads_updated_at BEFORE UPDATE ON public.squads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.wizard_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_generated_files_updated_at BEFORE UPDATE ON public.generated_files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
