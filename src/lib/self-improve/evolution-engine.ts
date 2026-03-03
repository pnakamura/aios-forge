/**
 * @agent     EvolutionEngine
 * @persona   Motor que aplica melhorias aprovadas ao sistema,
 *            com capacidade de rollback e medicao de impacto
 * @version   1.0.0
 * @context   Camada 4 do sistema de auto-melhoria. Aplica mudancas identificadas
 *            pela AnalysisEngine e mede seu impacto ao longo do tempo.
 */

import { supabase } from '@/integrations/supabase/client';
import { AnalysisEngine } from './analysis-engine';
import type {
  ImprovementStatus,
  ImprovementTarget,
  EvolutionCycleResult,
  ImpactMeasurement,
  Improvement,
} from './types';

export class EvolutionEngine {

  /**
   * Executa ciclo completo: analise -> proposta -> armazenamento.
   * Melhorias com confidence >= 0.7 sao criadas automaticamente como PROPOSED.
   */
  static async runEvolutionCycle(): Promise<EvolutionCycleResult> {
    // 1. Rodar analise
    const results = await AnalysisEngine.runFullAnalysis(30);

    // 2. Coletar todas as sugestoes com confianca > 0.7
    const highConfidenceSuggestions = results
      .flatMap(r => r.suggestedImprovements)
      .filter(s => s.confidence >= 0.7);

    // 3. Criar propostas de melhoria no banco
    for (const suggestion of highConfidenceSuggestions) {
      // Verificar se ja existe proposta similar ativa
      const { data: existing } = await (supabase as any)
        .from('improvements')
        .select('id')
        .eq('target', suggestion.target)
        .in('status', ['PROPOSED', 'APPROVED'])
        .limit(1);

      if (!existing || existing.length === 0) {
        await (supabase as any).from('improvements').insert({
          target: suggestion.target,
          target_id: suggestion.targetId || null,
          description: suggestion.description,
          before_value: '',
          after_value: '',
          reason: suggestion.reason,
          confidence: suggestion.confidence,
          status: 'PROPOSED' as ImprovementStatus,
        });
      }
    }

    // 4. Retornar resumo
    return {
      analysisResults: results,
      proposedImprovements: highConfidenceSuggestions.length,
      totalFeedbackEntries: results.reduce((sum, r) => sum + r.sampleSize, 0),
    };
  }

  /**
   * Aplica uma melhoria aprovada (chamado pelo admin/sistema).
   */
  static async applyImprovement(improvementId: string): Promise<void> {
    const { data: improvement } = await (supabase as any)
      .from('improvements')
      .select('*')
      .eq('id', improvementId)
      .single();

    if (!improvement || improvement.status !== 'APPROVED') {
      throw new Error('Melhoria nao encontrada ou nao aprovada');
    }

    // Marcar como aplicada
    await (supabase as any).from('improvements').update({
      status: 'APPLIED' as ImprovementStatus,
      applied_at: new Date().toISOString(),
    }).eq('id', improvementId);
  }

  /**
   * Reverte uma melhoria aplicada.
   */
  static async revertImprovement(improvementId: string): Promise<void> {
    const { data: improvement } = await (supabase as any)
      .from('improvements')
      .select('*')
      .eq('id', improvementId)
      .single();

    if (!improvement || improvement.status !== 'APPLIED') {
      throw new Error('Melhoria nao encontrada ou nao aplicada');
    }

    await (supabase as any).from('improvements').update({
      status: 'REVERTED' as ImprovementStatus,
      reverted_at: new Date().toISOString(),
    }).eq('id', improvementId);
  }

  /**
   * Mede o impacto de uma melhoria aplicada (comparando metricas antes/depois).
   */
  static async measureImpact(
    improvementId: string,
    daysBefore: number = 14,
    daysAfter: number = 14,
  ): Promise<ImpactMeasurement | null> {
    const { data: improvement } = await (supabase as any)
      .from('improvements')
      .select('*')
      .eq('id', improvementId)
      .single();

    if (!improvement?.applied_at) return null;

    const appliedAt = new Date(improvement.applied_at);

    // Buscar metricas do periodo antes
    const { data: metricsBefore } = await (supabase as any)
      .from('quality_metrics')
      .select('*')
      .lte('period_end', appliedAt.toISOString())
      .gte('period_start', new Date(appliedAt.getTime() - daysBefore * 86400000).toISOString());

    // Buscar metricas do periodo depois
    const { data: metricsAfter } = await (supabase as any)
      .from('quality_metrics')
      .select('*')
      .gte('period_start', appliedAt.toISOString())
      .lte('period_end', new Date(appliedAt.getTime() + daysAfter * 86400000).toISOString());

    // Calcular delta por metrica
    const impact: ImpactMeasurement = {};

    for (const metric of (metricsAfter || [])) {
      const corresponding = (metricsBefore || []).find(m => m.metric_name === metric.metric_name);
      if (corresponding) {
        impact[metric.metric_name] = {
          before: corresponding.metric_value,
          after: metric.metric_value,
          delta: metric.metric_value - corresponding.metric_value,
        };
      }
    }

    // Salvar score de impacto
    const deltas = Object.values(impact).map(v => v.delta);
    const avgDelta = deltas.length > 0
      ? deltas.reduce((s, v) => s + v, 0) / deltas.length
      : 0;

    await (supabase as any).from('improvements').update({
      impact_score: avgDelta,
    }).eq('id', improvementId);

    return impact;
  }

  /**
   * Aprova uma melhoria proposta.
   */
  static async approveImprovement(improvementId: string): Promise<void> {
    await (supabase as any).from('improvements').update({
      status: 'APPROVED' as ImprovementStatus,
    }).eq('id', improvementId);
  }

  /**
   * Rejeita uma melhoria proposta.
   */
  static async rejectImprovement(improvementId: string): Promise<void> {
    await (supabase as any).from('improvements').update({
      status: 'REJECTED' as ImprovementStatus,
    }).eq('id', improvementId);
  }

  /**
   * Lista melhorias por status.
   */
  static async listImprovements(status?: ImprovementStatus): Promise<Improvement[]> {
    let query = (supabase as any)
      .from('improvements')
      .select('*')
      .order('confidence', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data } = await query.limit(50);
    return (data || []) as Improvement[];
  }
}
