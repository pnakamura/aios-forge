
-- Add working copy columns to agents
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published',
ADD COLUMN IF NOT EXISTS version text NOT NULL DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS changelog jsonb NOT NULL DEFAULT '[]',
ADD COLUMN IF NOT EXISTS published_at timestamptz,
ADD COLUMN IF NOT EXISTS created_in_library boolean NOT NULL DEFAULT false;

-- Add working copy columns to skills
ALTER TABLE public.skills
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published',
ADD COLUMN IF NOT EXISTS version text NOT NULL DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS changelog jsonb NOT NULL DEFAULT '[]',
ADD COLUMN IF NOT EXISTS published_at timestamptz,
ADD COLUMN IF NOT EXISTS created_in_library boolean NOT NULL DEFAULT false;

-- Add working copy columns to squads
ALTER TABLE public.squads
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published',
ADD COLUMN IF NOT EXISTS version text NOT NULL DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.squads(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS changelog jsonb NOT NULL DEFAULT '[]',
ADD COLUMN IF NOT EXISTS published_at timestamptz,
ADD COLUMN IF NOT EXISTS created_in_library boolean NOT NULL DEFAULT false;

-- Add working copy columns to workflows_library
ALTER TABLE public.workflows_library
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published',
ADD COLUMN IF NOT EXISTS version text NOT NULL DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.workflows_library(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS changelog jsonb NOT NULL DEFAULT '[]',
ADD COLUMN IF NOT EXISTS published_at timestamptz,
ADD COLUMN IF NOT EXISTS created_in_library boolean NOT NULL DEFAULT false;

-- Create library_editor_sessions table
CREATE TABLE public.library_editor_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  ai_messages jsonb NOT NULL DEFAULT '[]',
  ai_context jsonb NOT NULL DEFAULT '{}',
  last_saved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, entity_type, entity_id)
);

-- Enable RLS
ALTER TABLE public.library_editor_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policy: user manages own sessions
CREATE POLICY "Users can manage own editor sessions"
ON public.library_editor_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_library_editor_sessions_updated_at
  BEFORE UPDATE ON public.library_editor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
