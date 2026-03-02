/**
 * @agent     AnalysisEngine
 * @persona   Motor de analise que processa feedback coletado e identifica
 *            oportunidades de melhoria com base em padroes estatisticos
 * @version   1.0.0
 * @context   Camada 3 do sistema de auto-melhoria. Processa dados da Camada 2
 *            (feedback_entries, generation_audits) e gera sugestoes para a Camada 4.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  FeedbackType,
  ImprovementTarget,
  AnalysisResult,
  SuggestedImprovement,
} from './types';

export class AnalysisEngine {

  /**
   * Executa analise completa e retorna insights acionaveis.
   */
  static async runFullAnalysis(periodDays: number = 30): Promise<AnalysisResult[]> {
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
    const results: AnalysisResult[] = [];

    results.push(await this.analyzeWizardCompletion(since));
    results.push(await this.analyzeAgentPopularity(since));
    results.push(await this.analyzeGenerationQuality(since));
    results.push(await this.analyzePromptEffectiveness(since));
    results.push(await this.analyzeValidationPatterns(since));

    return results;
  }

  /**
   * Analisa taxa de completude do wizard por step.
   */
  private static async analyzeWizardCompletion(since: string): Promise<AnalysisResult> {
    const { data: entries } = await supabase
      .from('feedback_entries')
      .select('*')
      .eq('type', 'WIZARD_STEP_COMPLETION')
      .gte('created_at', since);

    const feedbackEntries = entries || [];
    const byStep = new Map<number, { completed: number; total: number }>();

    for (const entry of feedbackEntries) {
      const data = entry.data as { step: number; completed: boolean };
      const current = byStep.get(data.step) || { completed: 0, total: 0 };
      current.total++;
      if (data.completed) current.completed++;
      byStep.set(data.step, current);
    }

    const insights: string[] = [];
    const suggestions: SuggestedImprovement[] = [];

    for (const [step, stats] of byStep) {
      const rate = stats.completed / stats.total;
      if (rate < 0.6 && stats.total >= 10) {
        insights.push(
          `Step ${step} tem taxa de completude de ${(rate * 100).toFixed(1)}% (${stats.completed}/${stats.total})`,
        );
        suggestions.push({
          target: 'SYSTEM_PROMPT' as ImprovementTarget,
          targetId: `step_${step}`,
          description: `Melhorar prompt do step ${step} para reduzir abandono`,
          confidence: Math.min(0.9, stats.total / 100),
          reason: `Taxa de completude de ${(rate * 100).toFixed(1)}% em ${stats.total} sessoes`,
        });
      }
    }

    const overallRate = feedbackEntries.length > 0
      ? feedbackEntries.filter(e => (e.data as any).completed).length / feedbackEntries.length
      : 0;

    return {
      metric: 'wizard_completion_rate',
      currentValue: overallRate,
      trend: this.calculateTrend(feedbackEntries.map(e => e.score || 0)),
      sampleSize: feedbackEntries.length,
      insights,
      suggestedImprovements: suggestions,
    };
  }

  /**
   * Analisa quais agentes sao mais selecionados vs removidos.
   */
  private static async analyzeAgentPopularity(since: string): Promise<AnalysisResult> {
    const { data: entries } = await supabase
      .from('feedback_entries')
      .select('*')
      .eq('type', 'AGENT_SELECTION')
      .gte('created_at', since);

    const feedbackEntries = entries || [];
    const agentStats = new Map<string, { added: number; removed: number }>();

    for (const entry of feedbackEntries) {
      const data = entry.data as { agentSlug: string; action: string };
      const current = agentStats.get(data.agentSlug) || { added: 0, removed: 0 };
      if (data.action === 'added') current.added++;
      if (data.action === 'removed') current.removed++;
      agentStats.set(data.agentSlug, current);
    }

    const insights: string[] = [];
    const suggestions: SuggestedImprovement[] = [];

    for (const [slug, stats] of agentStats) {
      const removalRate = stats.removed / (stats.added + stats.removed);
      if (removalRate > 0.4 && stats.added >= 5) {
        insights.push(
          `Agente "${slug}" tem taxa de remocao de ${(removalRate * 100).toFixed(1)}%`,
        );
        suggestions.push({
          target: 'AGENT_TEMPLATE' as ImprovementTarget,
          targetId: slug,
          description: `Revisar descricao e prompt do agente "${slug}" — alta taxa de remocao`,
          confidence: Math.min(0.85, (stats.added + stats.removed) / 50),
          reason: `${stats.removed} remocoes em ${stats.added + stats.removed} interacoes`,
        });
      }
    }

    return {
      metric: 'agent_selection_quality',
      currentValue: 1 - (feedbackEntries.filter(e => (e.data as any).action === 'removed').length / Math.max(feedbackEntries.length, 1)),
      trend: this.calculateTrend(feedbackEntries.map(e => e.score || 0)),
      sampleSize: feedbackEntries.length,
      insights,
      suggestedImprovements: suggestions,
    };
  }

  /**
   * Analisa qualidade das geracoes (taxa de sucesso, erros comuns).
   */
  private static async analyzeGenerationQuality(since: string): Promise<AnalysisResult> {
    const { data: audits } = await supabase
      .from('generation_audits')
      .select('*')
      .gte('created_at', since);

    const genAudits = audits || [];

    const successRate = genAudits.length > 0
      ? genAudits.filter(a => a.is_valid).length / genAudits.length
      : 1;

    const errorFrequency = new Map<string, number>();
    for (const audit of genAudits) {
      const errors = (audit.errors || []) as string[];
      for (const error of errors) {
        errorFrequency.set(error, (errorFrequency.get(error) || 0) + 1);
      }
    }

    const insights: string[] = [];
    const suggestions: SuggestedImprovement[] = [];

    const sortedErrors = [...errorFrequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    for (const [error, count] of sortedErrors) {
      if (count >= 3) {
        insights.push(`Erro recorrente (${count}x): "${error}"`);
        suggestions.push({
          target: 'GENERATION_TEMPLATE' as ImprovementTarget,
          description: `Corrigir template que causa: "${error}"`,
          confidence: Math.min(0.95, count / 20),
          reason: `Erro ocorreu ${count} vezes no periodo`,
        });
      }
    }

    return {
      metric: 'generation_success_rate',
      currentValue: successRate,
      trend: this.calculateTrend(genAudits.map(a => a.is_valid ? 1 : 0)),
      sampleSize: genAudits.length,
      insights,
      suggestedImprovements: suggestions,
    };
  }

  /**
   * Analisa efetividade dos system prompts.
   */
  private static async analyzePromptEffectiveness(since: string): Promise<AnalysisResult> {
    const { data: entries } = await supabase
      .from('feedback_entries')
      .select('*')
      .eq('type', 'PROMPT_EFFECTIVENESS')
      .gte('created_at', since);

    const feedbackEntries = entries || [];
    const byPrompt = new Map<string, number[]>();

    for (const entry of feedbackEntries) {
      const data = entry.data as { promptId: string };
      const scores = byPrompt.get(data.promptId) || [];
      scores.push(entry.score || 0);
      byPrompt.set(data.promptId, scores);
    }

    const insights: string[] = [];
    const suggestions: SuggestedImprovement[] = [];

    for (const [promptId, scores] of byPrompt) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg < 0.5 && scores.length >= 10) {
        insights.push(
          `Prompt "${promptId}" tem score medio de ${(avg * 100).toFixed(1)}%`,
        );
        suggestions.push({
          target: 'SYSTEM_PROMPT' as ImprovementTarget,
          targetId: promptId,
          description: `Reescrever prompt "${promptId}" — baixa efetividade`,
          confidence: Math.min(0.9, scores.length / 50),
          reason: `Score medio de ${(avg * 100).toFixed(1)}% em ${scores.length} usos`,
        });
      }
    }

    const overallScore = feedbackEntries.length > 0
      ? feedbackEntries.reduce((sum, e) => sum + (e.score || 0), 0) / feedbackEntries.length
      : 0;

    return {
      metric: 'prompt_effectiveness',
      currentValue: overallScore,
      trend: this.calculateTrend(feedbackEntries.map(e => e.score || 0)),
      sampleSize: feedbackEntries.length,
      insights,
      suggestedImprovements: suggestions,
    };
  }

  /**
   * Analisa padroes de falha na validacao.
   */
  private static async analyzeValidationPatterns(since: string): Promise<AnalysisResult> {
    const { data: entries } = await supabase
      .from('feedback_entries')
      .select('*')
      .eq('type', 'VALIDATION_RESULT')
      .gte('created_at', since);

    const feedbackEntries = entries || [];
    const ruleFailures = new Map<string, number>();

    for (const entry of feedbackEntries) {
      const ctx = entry.context as { failedRules?: string[] } | null;
      if (ctx?.failedRules) {
        for (const rule of ctx.failedRules) {
          ruleFailures.set(rule, (ruleFailures.get(rule) || 0) + 1);
        }
      }
    }

    const insights: string[] = [];
    const suggestions: SuggestedImprovement[] = [];

    for (const [rule, count] of ruleFailures) {
      if (count >= 5) {
        insights.push(`Regra "${rule}" falha ${count} vezes`);
        suggestions.push({
          target: 'VALIDATION_RULE' as ImprovementTarget,
          targetId: rule,
          description: `Investigar e corrigir causa raiz de falhas na regra "${rule}"`,
          confidence: Math.min(0.9, count / 30),
          reason: `${count} falhas no periodo analisado`,
        });
      }
    }

    const validRate = feedbackEntries.length > 0
      ? feedbackEntries.filter(e => (e.score || 0) >= 0.9).length / feedbackEntries.length
      : 1;

    return {
      metric: 'validation_pass_rate',
      currentValue: validRate,
      trend: this.calculateTrend(feedbackEntries.map(e => e.score || 0)),
      sampleSize: feedbackEntries.length,
      insights,
      suggestedImprovements: suggestions,
    };
  }

  /**
   * Calcula tendencia simples (ultimos 30% vs primeiros 30%).
   */
  private static calculateTrend(scores: number[]): 'improving' | 'stable' | 'declining' {
    if (scores.length < 10) return 'stable';

    const third = Math.floor(scores.length / 3);
    const firstThird = scores.slice(0, third);
    const lastThird = scores.slice(-third);

    const avgFirst = firstThird.reduce((a, b) => a + b, 0) / firstThird.length;
    const avgLast = lastThird.reduce((a, b) => a + b, 0) / lastThird.length;

    const diff = avgLast - avgFirst;
    if (diff > 0.05) return 'improving';
    if (diff < -0.05) return 'declining';
    return 'stable';
  }
}
