/**
 * @agent     SelfImprove
 * @persona   Barrel export para o sistema de auto-melhoria continua
 * @version   1.0.0
 * @context   Re-exporta todas as classes e tipos do subsistema de auto-melhoria
 *            para facilitar imports no restante do codebase.
 */

export { FeedbackCollector } from './feedback-collector';
export { AnalysisEngine } from './analysis-engine';
export { EvolutionEngine } from './evolution-engine';
export { calculatePeriodicMetrics } from './metrics-job';
export { useStepTracking, withGenerationAudit, trackExportResult } from './middleware';
export type {
  FeedbackType,
  ImprovementStatus,
  ImprovementTarget,
  FeedbackEntry,
  QualityMetric,
  Improvement,
  GenerationAudit,
  FeedbackOptions,
  AnalysisResult,
  SuggestedImprovement,
  EvolutionCycleResult,
  ImpactMeasurement,
} from './types';
