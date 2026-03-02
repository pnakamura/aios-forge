/**
 * @agent     SelfImproveMiddleware
 * @persona   Middleware e hooks para coleta automatica de feedback
 * @version   1.0.0
 * @context   Integrado nos componentes e API routes existentes para alimentar
 *            o FeedbackCollector automaticamente em pontos chave de interacao.
 */

import { useRef, useCallback } from 'react';
import { FeedbackCollector } from './feedback-collector';
import type { GeneratedFile } from '@/types/aios';

/**
 * Hook para componentes React — rastreia tempo em cada step do wizard.
 * Retorna callbacks para sinalizar completude ou abandono do step.
 */
export function useStepTracking(step: number, sessionId?: string) {
  const startTimeRef = useRef(Date.now());

  // Reset start time when step changes
  const resetTimer = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);

  const onStepComplete = useCallback(() => {
    const timeSpent = Date.now() - startTimeRef.current;
    FeedbackCollector.trackWizardStep(step, true, timeSpent, {
      session_id: sessionId,
    });
  }, [step, sessionId]);

  const onStepSkip = useCallback(() => {
    const timeSpent = Date.now() - startTimeRef.current;
    FeedbackCollector.trackWizardStep(step, false, timeSpent, {
      session_id: sessionId,
    });
  }, [step, sessionId]);

  return { onStepComplete, onStepSkip, resetTimer };
}

/**
 * Wrapper para a funcao de geracao — registra auditoria completa.
 * Mede tempo de execucao, conta arquivos e registra erros/warnings.
 */
export function withGenerationAudit<T extends (...args: any[]) => GeneratedFile[]>(
  generator: T,
): (...args: Parameters<T>) => GeneratedFile[] {
  return (...args: Parameters<T>): GeneratedFile[] => {
    const startTime = Date.now();

    try {
      const result = generator(...args);
      const totalSize = result.reduce(
        (sum, f) => sum + new TextEncoder().encode(f.content).length,
        0,
      );

      // Track success asynchronously (don't block the generation)
      FeedbackCollector.trackGeneration(undefined, true, {
        fileCount: result.length,
        totalSizeBytes: totalSize,
        generationTimeMs: Date.now() - startTime,
        errors: [],
        warnings: [],
      });

      return result;
    } catch (error) {
      // Track failure asynchronously
      FeedbackCollector.trackGeneration(undefined, false, {
        fileCount: 0,
        totalSizeBytes: 0,
        generationTimeMs: Date.now() - startTime,
        errors: [(error as Error).message],
        warnings: [],
      });
      throw error;
    }
  };
}

/**
 * Wrapper para export ZIP — registra sucesso/falha do download.
 */
export function trackExportResult(
  success: boolean,
  fileCount: number,
  projectId?: string,
): void {
  FeedbackCollector.trackExport(success, fileCount, {
    project_id: projectId,
  });
}
