/**
 * @agent     ComplianceService
 * @persona   Camada de servico para revisao de conformidade AIOS v4.2.13
 * @version   1.0.0
 * @commands  runReview
 * @deps      supabase/client
 * @context   Usado por FilePreview para executar validacao de conformidade via edge function
 */

import { supabase } from '@/integrations/supabase/client';
import { GeneratedFile } from '@/types/aios';

export interface ComplianceViolation {
  rule: string;
  severity: string;
  detail: string;
  guardrail?: string;
  fix_instruction?: string;
}

export interface ComplianceResult {
  status: string;
  notes: string;
  violations?: ComplianceViolation[];
}

export async function runReview(
  files: GeneratedFile[],
): Promise<Record<string, ComplianceResult>> {
  const reviewableFiles = files.filter(f =>
    f.path === 'aios.config.yaml' ||
    f.path.startsWith('agents/') ||
    f.path.startsWith('squads/') ||
    f.path.startsWith('src/agents/') ||
    f.path === 'README.md' ||
    f.path === 'FIRST-RUN.md' ||
    f.path === '.env.example'
  );

  const payload = reviewableFiles.map(f => ({
    path: f.path,
    content: f.content,
    type: f.type,
  }));

  const { data, error } = await supabase.functions.invoke('aios-compliance-review', {
    body: { files: payload },
  });

  if (error) throw error;
  if (!data?.results) throw new Error('Resposta invalida');

  const mapped: Record<string, ComplianceResult> = {};
  data.results.forEach((r: any) => {
    mapped[r.path] = {
      status: r.status,
      notes: r.notes,
      violations: r.violations || [],
    };
  });

  return mapped;
}
