/**
 * @agent     LibraryImportService
 * @persona   Servico de importacao de elementos via arquivo para a Library
 * @version   1.0.0
 * @commands  importElementFromFile
 * @deps      supabase/client
 * @context   Recebe dados parseados de arquivos e insere nas tabelas corretas com defaults.
 */

import { supabase } from '@/integrations/supabase/client';
import type { LibraryEntityType } from '@/types/library';

function ensureArray(val: unknown): unknown[] {
  return Array.isArray(val) ? val : [];
}

function ensureString(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : fallback;
}

export async function importElementFromFile(
  entityType: LibraryEntityType,
  data: Record<string, unknown>,
  projectId: string
): Promise<string> {
  const name = ensureString(data.name);
  const slug = ensureString(data.slug);

  if (!name || !slug) throw new Error('name e slug sao obrigatorios');

  if (entityType === 'agent') {
    const { data: created, error } = await supabase
      .from('agents')
      .insert({
        project_id: projectId,
        name,
        slug,
        role: ensureString(data.role, name),
        system_prompt: ensureString(data.system_prompt),
        llm_model: ensureString(data.llm_model, 'google/gemini-3-flash-preview'),
        commands: ensureArray(data.commands) as any,
        tools: ensureArray(data.tools) as any,
        skills: ensureArray(data.skills) as any,
        tags: ensureArray(data.tags) as any,
        visibility: ensureString(data.visibility, 'full'),
        is_custom: true,
        is_public: Boolean(data.is_public),
        status: 'published',
        created_in_library: true,
      } as never)
      .select('id')
      .single();
    if (error) throw error;
    return created!.id;
  }

  if (entityType === 'skill') {
    const { data: created, error } = await supabase
      .from('skills')
      .insert({
        project_id: projectId,
        name,
        slug,
        description: ensureString(data.description),
        category: ensureString(data.category, 'general'),
        prompt: ensureString(data.prompt),
        inputs: ensureArray(data.inputs) as any,
        outputs: ensureArray(data.outputs) as any,
        examples: ensureArray(data.examples) as any,
        tags: ensureArray(data.tags) as any,
        is_public: Boolean(data.is_public),
        status: 'published',
        created_in_library: true,
      } as never)
      .select('id')
      .single();
    if (error) throw error;
    return created!.id;
  }

  if (entityType === 'squad') {
    const { data: created, error } = await supabase
      .from('squads')
      .insert({
        project_id: projectId,
        name,
        slug,
        description: ensureString(data.description),
        agent_ids: ensureArray(data.agent_ids) as any,
        tasks: ensureArray(data.tasks) as any,
        workflows: ensureArray(data.workflows) as any,
        tags: ensureArray(data.tags) as any,
        is_public: Boolean(data.is_public),
        status: 'published',
        created_in_library: true,
      } as never)
      .select('id')
      .single();
    if (error) throw error;
    return created!.id;
  }

  if (entityType === 'workflow') {
    const { data: created, error } = await supabase
      .from('workflows_library')
      .insert({
        project_id: projectId,
        name,
        slug,
        description: ensureString(data.description),
        pattern: ensureString(data.pattern, 'sequential'),
        steps: ensureArray(data.steps) as any,
        triggers: ensureArray(data.triggers) as any,
        outputs: ensureArray(data.outputs) as any,
        tags: ensureArray(data.tags) as any,
        is_public: Boolean(data.is_public),
        status: 'published',
        created_in_library: true,
      } as never)
      .select('id')
      .single();
    if (error) throw error;
    return created!.id;
  }

  throw new Error(`Tipo desconhecido: ${entityType}`);
}
