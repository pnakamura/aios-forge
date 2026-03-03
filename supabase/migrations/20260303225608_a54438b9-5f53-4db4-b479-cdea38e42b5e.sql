
-- Enum types for self-improvement system
CREATE TYPE public.feedback_type AS ENUM (
  'WIZARD_STEP_COMPLETION',
  'AGENT_SELECTION',
  'AGENT_CUSTOMIZATION',
  'SQUAD_CREATION',
  'GENERATION_SUCCESS',
  'GENERATION_FAILURE',
  'EXPORT_SUCCESS',
  'EXPORT_FAILURE',
  'VALIDATION_RESULT',
  'USER_RATING',
  'INSTALLATION_TEST',
  'PROMPT_EFFECTIVENESS'
);

CREATE TYPE public.improvement_status AS ENUM (
  'PROPOSED',
  'APPROVED',
  'APPLIED',
  'REVERTED',
  'REJECTED'
);

CREATE TYPE public.improvement_target AS ENUM (
  'SYSTEM_PROMPT',
  'AGENT_TEMPLATE',
  'SQUAD_TEMPLATE',
  'GENERATION_TEMPLATE',
  'VALIDATION_RULE',
  'ORCHESTRATION_PATTERN',
  'UI_DEFAULT'
);

-- 1. feedback_entries
CREATE TABLE public.feedback_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.wizard_sessions(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  type public.feedback_type NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  score FLOAT,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_entries_type_created ON public.feedback_entries(type, created_at);
CREATE INDEX idx_feedback_entries_session ON public.feedback_entries(session_id);
CREATE INDEX idx_feedback_entries_project ON public.feedback_entries(project_id);

ALTER TABLE public.feedback_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback via session"
  ON public.feedback_entries FOR INSERT TO authenticated
  WITH CHECK (
    session_id IS NULL
    OR EXISTS (SELECT 1 FROM public.wizard_sessions ws WHERE ws.id = feedback_entries.session_id AND ws.user_id = auth.uid())
  );

CREATE POLICY "Users can view own feedback"
  ON public.feedback_entries FOR SELECT TO authenticated
  USING (
    session_id IS NULL
    OR EXISTS (SELECT 1 FROM public.wizard_sessions ws WHERE ws.id = feedback_entries.session_id AND ws.user_id = auth.uid())
  );

-- 2. generation_audits
CREATE TABLE public.generation_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  generated_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  validation_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  install_test JSONB,
  file_count INT NOT NULL DEFAULT 0,
  total_size_bytes INT NOT NULL DEFAULT 0,
  generation_time_ms INT NOT NULL DEFAULT 0,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_generation_audits_valid ON public.generation_audits(is_valid, created_at);
CREATE INDEX idx_generation_audits_project ON public.generation_audits(project_id);

ALTER TABLE public.generation_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage audits via project"
  ON public.generation_audits FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = generation_audits.project_id AND p.user_id = auth.uid()));

-- 3. quality_metrics
CREATE TABLE public.quality_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value FLOAT NOT NULL,
  sample_size INT NOT NULL DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  dimensions JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_quality_metrics_name_period ON public.quality_metrics(metric_name, period_start);

ALTER TABLE public.quality_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read metrics"
  ON public.quality_metrics FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert metrics"
  ON public.quality_metrics FOR INSERT TO authenticated
  WITH CHECK (true);

-- 4. improvements
CREATE TABLE public.improvements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target public.improvement_target NOT NULL,
  target_id TEXT,
  description TEXT NOT NULL,
  before_value TEXT NOT NULL DEFAULT '',
  after_value TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  status public.improvement_status NOT NULL DEFAULT 'PROPOSED',
  confidence FLOAT NOT NULL DEFAULT 0,
  impact_score FLOAT,
  applied_at TIMESTAMP WITH TIME ZONE,
  reverted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_improvements_target_status ON public.improvements(target, status);
CREATE INDEX idx_improvements_status_confidence ON public.improvements(status, confidence);

ALTER TABLE public.improvements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read improvements"
  ON public.improvements FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert improvements"
  ON public.improvements FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update improvements"
  ON public.improvements FOR UPDATE TO authenticated
  USING (true);

-- Add updated_at trigger to improvements
CREATE TRIGGER update_improvements_updated_at
  BEFORE UPDATE ON public.improvements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
