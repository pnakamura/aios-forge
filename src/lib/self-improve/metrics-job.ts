/**
 * @agent     MetricsJob
 * @persona   Job que calcula metricas agregadas periodicamente
 * @version   1.0.0
 * @context   Pode ser chamado via cron (Supabase Edge Function ou scheduler externo)
 *            ou manualmente pelo dashboard de admin. Calcula e persiste metricas
 *            agregadas na tabela quality_metrics.
 */

import { supabase } from '@/integrations/supabase/client';

export interface MetricsJobResult {
  wizardEntries: number;
  generationEntries: number;
  ratingEntries: number;
  calculatedAt: string;
}

export async function calculatePeriodicMetrics(): Promise<MetricsJobResult> {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 86400000);
  const nowISO = now.toISOString();
  const dayAgoISO = dayAgo.toISOString();

  // Metrica: Taxa de completude do wizard (ultimas 24h)
  const { data: wizardEntries } = await supabase
    .from('feedback_entries')
    .select('*')
    .eq('type', 'WIZARD_STEP_COMPLETION')
    .gte('created_at', dayAgoISO);

  const wizardData = wizardEntries || [];
  if (wizardData.length > 0) {
    const completionRate = wizardData
      .filter(e => (e.data as any).completed).length / wizardData.length;

    await supabase.from('quality_metrics').insert({
      metric_name: 'wizard_completion_rate',
      metric_value: completionRate,
      sample_size: wizardData.length,
      period_start: dayAgoISO,
      period_end: nowISO,
    });
  }

  // Metrica: Taxa de sucesso de geracao (ultimas 24h)
  const { data: genEntries } = await supabase
    .from('generation_audits')
    .select('*')
    .gte('created_at', dayAgoISO);

  const genData = genEntries || [];
  if (genData.length > 0) {
    const successRate = genData
      .filter(e => e.is_valid).length / genData.length;

    await supabase.from('quality_metrics').insert({
      metric_name: 'generation_success_rate',
      metric_value: successRate,
      sample_size: genData.length,
      period_start: dayAgoISO,
      period_end: nowISO,
    });

    // Metrica: Tempo medio de geracao
    const avgTime = genData
      .reduce((sum, e) => sum + (e.generation_time_ms || 0), 0) / genData.length;

    await supabase.from('quality_metrics').insert({
      metric_name: 'avg_generation_time_ms',
      metric_value: avgTime,
      sample_size: genData.length,
      period_start: dayAgoISO,
      period_end: nowISO,
    });
  }

  // Metrica: Score medio de satisfacao do usuario (ultimas 24h)
  const { data: ratingEntries } = await supabase
    .from('feedback_entries')
    .select('*')
    .eq('type', 'USER_RATING')
    .gte('created_at', dayAgoISO);

  const ratingData = ratingEntries || [];
  if (ratingData.length > 0) {
    const avgRating = ratingData
      .reduce((sum, e) => sum + (e.score || 0), 0) / ratingData.length;

    await supabase.from('quality_metrics').insert({
      metric_name: 'user_satisfaction_score',
      metric_value: avgRating,
      sample_size: ratingData.length,
      period_start: dayAgoISO,
      period_end: nowISO,
    });
  }

  return {
    wizardEntries: wizardData.length,
    generationEntries: genData.length,
    ratingEntries: ratingData.length,
    calculatedAt: nowISO,
  };
}
