/**
 * @agent     SelfImproveTypes
 * @persona   Tipos do sistema de auto-melhoria continua
 * @context   Tipos compartilhados entre feedback-collector, analysis-engine e evolution-engine
 */

export type FeedbackType =
  | 'WIZARD_STEP_COMPLETION'
  | 'AGENT_SELECTION'
  | 'AGENT_CUSTOMIZATION'
  | 'SQUAD_CREATION'
  | 'GENERATION_SUCCESS'
  | 'GENERATION_FAILURE'
  | 'EXPORT_SUCCESS'
  | 'EXPORT_FAILURE'
  | 'VALIDATION_RESULT'
  | 'USER_RATING'
  | 'INSTALLATION_TEST'
  | 'PROMPT_EFFECTIVENESS';

export type ImprovementStatus =
  | 'PROPOSED'
  | 'APPROVED'
  | 'APPLIED'
  | 'REVERTED'
  | 'REJECTED';

export type ImprovementTarget =
  | 'SYSTEM_PROMPT'
  | 'AGENT_TEMPLATE'
  | 'SQUAD_TEMPLATE'
  | 'GENERATION_TEMPLATE'
  | 'VALIDATION_RULE'
  | 'ORCHESTRATION_PATTERN'
  | 'UI_DEFAULT';

export interface FeedbackEntry {
  id?: string;
  session_id?: string;
  project_id?: string;
  type: FeedbackType;
  data: Record<string, unknown>;
  score?: number;
  context?: Record<string, unknown>;
  created_at?: string;
}

export interface QualityMetric {
  id?: string;
  metric_name: string;
  metric_value: number;
  sample_size: number;
  period_start: string;
  period_end: string;
  dimensions?: Record<string, unknown>;
  created_at?: string;
}

export interface Improvement {
  id?: string;
  target: ImprovementTarget;
  target_id?: string;
  description: string;
  before_value: string;
  after_value: string;
  reason: string;
  status: ImprovementStatus;
  confidence: number;
  impact_score?: number;
  applied_at?: string;
  reverted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GenerationAudit {
  id?: string;
  project_id: string;
  generated_files: Array<{ path: string; hash?: string }>;
  validation_result: {
    errors: Array<{ file: string; rule: string; message: string }>;
    warnings: Array<{ file: string; rule: string; message: string }>;
  };
  install_test?: Record<string, unknown>;
  file_count: number;
  total_size_bytes: number;
  generation_time_ms: number;
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  created_at?: string;
}

export interface FeedbackOptions {
  session_id?: string;
  project_id?: string;
  score?: number;
  context?: Record<string, unknown>;
}

export interface AnalysisResult {
  metric: string;
  currentValue: number;
  trend: 'improving' | 'stable' | 'declining';
  sampleSize: number;
  insights: string[];
  suggestedImprovements: SuggestedImprovement[];
}

export interface SuggestedImprovement {
  target: ImprovementTarget;
  targetId?: string;
  description: string;
  confidence: number;
  reason: string;
}

export interface EvolutionCycleResult {
  analysisResults: AnalysisResult[];
  proposedImprovements: number;
  totalFeedbackEntries: number;
}

export interface ImpactMeasurement {
  [metricName: string]: {
    before: number;
    after: number;
    delta: number;
  };
}
