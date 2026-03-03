/**
 * @agent     FeedbackCollector
 * @persona   Servico central de coleta de feedback em todos os pontos de interacao
 * @version   1.0.0
 * @context   Cada metodo captura um tipo especifico de evento com dados estruturados.
 *            Integrado nos componentes do wizard, gerador e API routes.
 */

import { supabase } from '@/integrations/supabase/client';
import type { FeedbackType, FeedbackOptions } from './types';

export class FeedbackCollector {

  /**
   * Chamado quando usuario completa (ou abandona) um step do wizard.
   */
  static async trackWizardStep(
    step: number,
    completed: boolean,
    timeSpentMs: number,
    options: FeedbackOptions = {},
  ): Promise<void> {
    try {
      await (supabase as any).from('feedback_entries').insert({
        type: 'WIZARD_STEP_COMPLETION' as FeedbackType,
        data: { step, completed, timeSpentMs },
        score: completed ? 1.0 : 0.0,
        session_id: options.session_id || null,
        project_id: options.project_id || null,
        context: options.context || null,
      });
    } catch (err) {
      console.warn('[FeedbackCollector] Failed to track wizard step:', err);
    }
  }

  /**
   * Chamado quando agente e selecionado ou removido do projeto.
   */
  static async trackAgentSelection(
    agentSlug: string,
    action: 'added' | 'removed' | 'customized',
    customizations?: Record<string, unknown>,
    options: FeedbackOptions = {},
  ): Promise<void> {
    try {
      const type: FeedbackType = action === 'customized'
        ? 'AGENT_CUSTOMIZATION'
        : 'AGENT_SELECTION';

      await (supabase as any).from('feedback_entries').insert({
        type,
        data: { agentSlug, action, customizations: customizations || null },
        score: action === 'removed' ? 0.3 : 1.0,
        session_id: options.session_id || null,
        project_id: options.project_id || null,
        context: options.context || null,
      });
    } catch (err) {
      console.warn('[FeedbackCollector] Failed to track agent selection:', err);
    }
  }

  /**
   * Chamado apos tentativa de geracao de projeto.
   * Registra tanto em feedback_entries quanto em generation_audits.
   */
  static async trackGeneration(
    projectId: string | undefined,
    success: boolean,
    details: {
      fileCount: number;
      totalSizeBytes: number;
      generationTimeMs: number;
      errors: string[];
      warnings: string[];
    },
  ): Promise<void> {
    try {
      const type: FeedbackType = success
        ? 'GENERATION_SUCCESS'
        : 'GENERATION_FAILURE';

      await (supabase as any).from('feedback_entries').insert({
        type,
        project_id: projectId || null,
        data: details,
        score: success ? 1.0 : 0.0,
        context: { errorCount: details.errors.length },
      });

      // Also register in the detailed audit table
      if (projectId) {
        await (supabase as any).from('generation_audits').insert({
          project_id: projectId,
          generated_files: [],
          validation_result: { errors: details.errors, warnings: details.warnings },
          file_count: details.fileCount,
          total_size_bytes: details.totalSizeBytes,
          generation_time_ms: details.generationTimeMs,
          is_valid: success,
          errors: details.errors,
          warnings: details.warnings,
        });
      }
    } catch (err) {
      console.warn('[FeedbackCollector] Failed to track generation:', err);
    }
  }

  /**
   * Chamado quando resultado da validacao do projeto gerado e obtido.
   */
  static async trackValidation(
    projectId: string | undefined,
    result: {
      isValid: boolean;
      errors: Array<{ file: string; rule: string; message: string }>;
      warnings: Array<{ file: string; rule: string; message: string }>;
    },
  ): Promise<void> {
    try {
      await (supabase as any).from('feedback_entries').insert({
        type: 'VALIDATION_RESULT' as FeedbackType,
        project_id: projectId || null,
        data: result,
        score: result.isValid ? 1.0 : Math.max(0, 1 - result.errors.length * 0.1),
        context: {
          errorCount: result.errors.length,
          warningCount: result.warnings.length,
          failedRules: result.errors.map(e => e.rule),
        },
      });
    } catch (err) {
      console.warn('[FeedbackCollector] Failed to track validation:', err);
    }
  }

  /**
   * Chamado quando usuario da rating explicito (thumbs up/down, stars).
   */
  static async trackUserRating(
    rating: number,
    category: string,
    comment?: string,
    options: FeedbackOptions = {},
  ): Promise<void> {
    try {
      await (supabase as any).from('feedback_entries').insert({
        type: 'USER_RATING' as FeedbackType,
        data: { rating, category, comment: comment || null },
        score: rating / 5,
        session_id: options.session_id || null,
        project_id: options.project_id || null,
        context: options.context || null,
      });
    } catch (err) {
      console.warn('[FeedbackCollector] Failed to track user rating:', err);
    }
  }

  /**
   * Chamado para medir efetividade de um system prompt especifico.
   */
  static async trackPromptEffectiveness(
    promptId: string,
    metrics: {
      responseRelevance: number;
      userFollowedSuggestion: boolean;
      requiredClarification: boolean;
      stepCompletedAfter: boolean;
    },
    options: FeedbackOptions = {},
  ): Promise<void> {
    try {
      const score = (
        metrics.responseRelevance * 0.4 +
        (metrics.userFollowedSuggestion ? 0.3 : 0) +
        (!metrics.requiredClarification ? 0.15 : 0) +
        (metrics.stepCompletedAfter ? 0.15 : 0)
      );

      await (supabase as any).from('feedback_entries').insert({
        type: 'PROMPT_EFFECTIVENESS' as FeedbackType,
        data: { promptId, metrics },
        score,
        session_id: options.session_id || null,
        project_id: options.project_id || null,
        context: options.context || null,
      });
    } catch (err) {
      console.warn('[FeedbackCollector] Failed to track prompt effectiveness:', err);
    }
  }

  /**
   * Chamado quando squad e criado.
   */
  static async trackSquadCreation(
    squadSlug: string,
    agentCount: number,
    options: FeedbackOptions = {},
  ): Promise<void> {
    try {
      await (supabase as any).from('feedback_entries').insert({
        type: 'SQUAD_CREATION' as FeedbackType,
        data: { squadSlug, agentCount },
        score: 1.0,
        session_id: options.session_id || null,
        project_id: options.project_id || null,
        context: options.context || null,
      });
    } catch (err) {
      console.warn('[FeedbackCollector] Failed to track squad creation:', err);
    }
  }

  /**
   * Chamado quando export (ZIP download) e concluido com sucesso ou falha.
   */
  static async trackExport(
    success: boolean,
    fileCount: number,
    options: FeedbackOptions = {},
  ): Promise<void> {
    try {
      const type: FeedbackType = success ? 'EXPORT_SUCCESS' : 'EXPORT_FAILURE';

      await (supabase as any).from('feedback_entries').insert({
        type,
        data: { fileCount },
        score: success ? 1.0 : 0.0,
        session_id: options.session_id || null,
        project_id: options.project_id || null,
        context: options.context || null,
      });
    } catch (err) {
      console.warn('[FeedbackCollector] Failed to track export:', err);
    }
  }
}
