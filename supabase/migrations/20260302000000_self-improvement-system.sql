-- ============================================
-- SISTEMA DE AUTO-MELHORIA
-- Migration: Self-improvement feedback loop tables
-- ============================================

-- Enum: Feedback types
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

-- Enum: Improvement status lifecycle
CREATE TYPE public.improvement_status AS ENUM (
  'PROPOSED',
  'APPROVED',
  'APPLIED',
  'REVERTED',
  'REJECTED'
);

-- Enum: What the improvement targets
CREATE TYPE public.improvement_target AS ENUM (
  'SYSTEM_PROMPT',
  'AGENT_TEMPLATE',
  'SQUAD_TEMPLATE',
  'GENERATION_TEMPLATE',
  'VALIDATION_RULE',
  'ORCHESTRATION_PATTERN',
  'UI_DEFAULT'
);

-- Feedback entries: captures every interaction event
CREATE TABLE public.feedback_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.wizard_sessions(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  type public.feedback_type NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  score FLOAT,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_type_created ON public.feedback_entries(type, created_at);
CREATE INDEX idx_feedback_session ON public.feedback_entries(session_id);
CREATE INDEX idx_feedback_project ON public.feedback_entries(project_id);

ALTER TABLE public.feedback_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback" ON public.feedback_entries FOR SELECT
  USING (
    session_id IN (SELECT id FROM public.wizard_sessions WHERE user_id = auth.uid())
    OR project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create feedback" ON public.feedback_entries FOR INSERT
  WITH CHECK (true);

-- Quality metrics: aggregated periodic measurements
CREATE TABLE public.quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value FLOAT NOT NULL,
  sample_size INT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  dimensions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quality_metric_name ON public.quality_metrics(metric_name, period_start);

ALTER TABLE public.quality_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view metrics" ON public.quality_metrics FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert metrics" ON public.quality_metrics FOR INSERT
  WITH CHECK (true);

-- Improvements: proposed and tracked changes
CREATE TABLE public.improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target public.improvement_target NOT NULL,
  target_id TEXT,
  description TEXT NOT NULL,
  before_value TEXT NOT NULL DEFAULT '',
  after_value TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  status public.improvement_status NOT NULL DEFAULT 'PROPOSED',
  confidence FLOAT NOT NULL DEFAULT 0,
  impact_score FLOAT,
  applied_at TIMESTAMPTZ,
  reverted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_improvement_target_status ON public.improvements(target, status);
CREATE INDEX idx_improvement_status_confidence ON public.improvements(status, confidence);

ALTER TABLE public.improvements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view improvements" ON public.improvements FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage improvements" ON public.improvements FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Generation audits: detailed records of each generation attempt
CREATE TABLE public.generation_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  generated_files JSONB NOT NULL DEFAULT '[]',
  validation_result JSONB NOT NULL DEFAULT '{}',
  install_test JSONB,
  file_count INT NOT NULL DEFAULT 0,
  total_size_bytes INT NOT NULL DEFAULT 0,
  generation_time_ms INT NOT NULL DEFAULT 0,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  errors JSONB NOT NULL DEFAULT '[]',
  warnings JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_generation_audit_valid ON public.generation_audits(is_valid, created_at);
CREATE INDEX idx_generation_audit_project ON public.generation_audits(project_id);

ALTER TABLE public.generation_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audits" ON public.generation_audits FOR SELECT
  USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can create audits" ON public.generation_audits FOR INSERT
  WITH CHECK (true);

-- Trigger for improvements updated_at
CREATE TRIGGER update_improvements_updated_at
  BEFORE UPDATE ON public.improvements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
