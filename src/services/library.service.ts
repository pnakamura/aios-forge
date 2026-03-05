/**
 * @agent     LibraryService
 * @persona   Camada de servico para o modulo AIOS Library
 * @version   1.0.0
 * @commands  fetchLibraryItems, fetchItemDetail, toggleFavorite, fetchTags, importElement
 * @deps      supabase/client
 * @context   Consultas agregadas para navegar, filtrar e importar artefatos da Library.
 */

import { supabase } from '@/integrations/supabase/client';
import type { LibraryFilter, LibraryItem, AgentMeta, SkillMeta, SquadMeta, WorkflowMeta } from '@/types/library';

// ── Helpers ──

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function getFavoriteIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('library_favorites')
    .select('entity_id')
    .eq('user_id', userId);
  return new Set((data ?? []).map((f: { entity_id: string }) => f.entity_id));
}

function matchesSearch(item: { name: string; description: string; tags: string[] }, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    item.name.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.tags.some((t) => t.toLowerCase().includes(q))
  );
}

// ── Fetch all items ──

export async function fetchLibraryItems(): Promise<LibraryItem[]> {
  const userId = await getCurrentUserId();
  const favIds = userId ? await getFavoriteIds(userId) : new Set<string>();

  // Fetch all entity types in parallel
  const [agentsRes, skillsRes, squadsRes, workflowsRes, projectsRes] = await Promise.all([
    supabase.from('agents').select('*'),
    supabase.from('skills').select('*'),
    supabase.from('squads').select('*'),
    supabase.from('workflows_library').select('*'),
    supabase.from('projects').select('id, name'),
  ]);

  const projectMap = new Map<string, string>();
  (projectsRes.data ?? []).forEach((p: { id: string; name: string }) => projectMap.set(p.id, p.name));

  const items: LibraryItem[] = [];

  // Map agents
  for (const a of agentsRes.data ?? []) {
    const tags = Array.isArray(a.tags) ? (a.tags as string[]) : [];
    const commands = Array.isArray(a.commands) ? a.commands : [];
    const skills = Array.isArray(a.skills) ? a.skills : [];
    items.push({
      id: a.id,
      type: 'agent',
      name: a.name,
      slug: a.slug,
      description: a.role,
      tags,
      projectName: projectMap.get(a.project_id) ?? '',
      projectId: a.project_id,
      usageCount: a.usage_count ?? 0,
      isFavorite: favIds.has(a.id),
      isPublic: a.is_public ?? false,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      meta: {
        type: 'agent',
        role: a.role,
        llmModel: a.llm_model,
        category: a.is_custom ? 'Custom' : 'Nativo',
        commandCount: commands.length,
        skillCount: skills.length,
        isNative: !a.is_custom,
      } as AgentMeta,
    });
  }

  // Map skills
  for (const s of skillsRes.data ?? []) {
    const tags = Array.isArray(s.tags) ? (s.tags as string[]) : [];
    const inputs = Array.isArray(s.inputs) ? s.inputs : [];
    const outputs = Array.isArray(s.outputs) ? s.outputs : [];
    items.push({
      id: s.id,
      type: 'skill',
      name: s.name,
      slug: s.slug,
      description: s.description,
      tags,
      projectName: projectMap.get(s.project_id) ?? '',
      projectId: s.project_id,
      usageCount: s.usage_count ?? 0,
      isFavorite: favIds.has(s.id),
      isPublic: s.is_public ?? false,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      meta: {
        type: 'skill',
        category: s.category,
        inputCount: inputs.length,
        outputCount: outputs.length,
      } as SkillMeta,
    });
  }

  // Map squads
  for (const sq of squadsRes.data ?? []) {
    const tags = Array.isArray(sq.tags) ? (sq.tags as string[]) : [];
    const agentIds = Array.isArray(sq.agent_ids) ? sq.agent_ids : [];
    const tasks = Array.isArray(sq.tasks) ? sq.tasks : [];
    const workflows = Array.isArray(sq.workflows) ? sq.workflows : [];
    items.push({
      id: sq.id,
      type: 'squad',
      name: sq.name,
      slug: sq.slug,
      description: sq.description ?? '',
      tags,
      projectName: projectMap.get(sq.project_id) ?? '',
      projectId: sq.project_id,
      usageCount: sq.usage_count ?? 0,
      isFavorite: favIds.has(sq.id),
      isPublic: sq.is_public ?? false,
      createdAt: sq.created_at,
      updatedAt: sq.updated_at,
      meta: {
        type: 'squad',
        agentCount: agentIds.length,
        taskCount: tasks.length,
        workflowCount: workflows.length,
        orchestrationPattern: '',
        isValidated: sq.is_validated,
      } as SquadMeta,
    });
  }

  // Map workflows
  for (const w of workflowsRes.data ?? []) {
    const tags = Array.isArray(w.tags) ? (w.tags as string[]) : [];
    const steps = Array.isArray(w.steps) ? w.steps : [];
    const triggers = Array.isArray(w.triggers) ? w.triggers : [];
    items.push({
      id: w.id,
      type: 'workflow',
      name: w.name,
      slug: w.slug,
      description: w.description,
      tags,
      projectName: projectMap.get(w.project_id) ?? '',
      projectId: w.project_id,
      usageCount: w.usage_count ?? 0,
      isFavorite: favIds.has(w.id),
      isPublic: w.is_public ?? false,
      createdAt: w.created_at,
      updatedAt: w.updated_at,
      meta: {
        type: 'workflow',
        pattern: w.pattern,
        stepCount: steps.length,
        triggerCount: triggers.length,
      } as WorkflowMeta,
    });
  }

  return items;
}

// ── Filter items client-side ──

export function filterItems(items: LibraryItem[], filter: LibraryFilter): LibraryItem[] {
  let result = items;

  if (filter.entityTypes.length > 0) {
    result = result.filter((i) => filter.entityTypes.includes(i.type));
  }
  if (filter.searchQuery) {
    result = result.filter((i) => matchesSearch(i, filter.searchQuery));
  }
  if (filter.tags.length > 0) {
    result = result.filter((i) => filter.tags.some((t) => i.tags.includes(t)));
  }
  if (filter.showOnlyPublic) {
    result = result.filter((i) => i.isPublic);
  }
  if (filter.showOnlyFavorites) {
    result = result.filter((i) => i.isFavorite);
  }

  // Sort
  result.sort((a, b) => {
    let cmp = 0;
    switch (filter.sortBy) {
      case 'name': cmp = a.name.localeCompare(b.name); break;
      case 'usage': cmp = a.usageCount - b.usageCount; break;
      case 'createdAt': cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
      case 'updatedAt': cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break;
    }
    return filter.sortOrder === 'desc' ? -cmp : cmp;
  });

  return result;
}

// ── Toggle favorite ──

export async function toggleFavorite(entityType: string, entityId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Nao autenticado');

  const { data: existing } = await supabase
    .from('library_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .maybeSingle();

  if (existing) {
    await supabase.from('library_favorites').delete().eq('id', existing.id);
    return false;
  } else {
    await supabase.from('library_favorites').insert({ user_id: userId, entity_type: entityType, entity_id: entityId });
    return true;
  }
}

// ── Fetch all tags ──

export async function fetchAvailableTags(): Promise<{ tag: string; count: number }[]> {
  const items = await fetchLibraryItems();
  const tagCounts = new Map<string, number>();
  for (const item of items) {
    for (const tag of item.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// ── Import element ──

export async function importElement(
  entityType: string,
  entityId: string,
  targetProjectId: string
): Promise<string> {
  if (entityType === 'agent') {
    const { data: original } = await supabase.from('agents').select('*').eq('id', entityId).single();
    if (!original) throw new Error('Agente nao encontrado');
    const { id: _id, project_id: _pid, created_at: _ca, updated_at: _ua, ...rest } = original;
    const { data: created, error } = await supabase
      .from('agents')
      .insert({ ...rest, project_id: targetProjectId } as never)
      .select('id')
      .single();
    if (error) throw error;
    await supabase.from('agents').update({ usage_count: (original.usage_count ?? 0) + 1 } as never).eq('id', entityId);
    return created!.id;
  }

  if (entityType === 'skill') {
    const { data: original } = await supabase.from('skills').select('*').eq('id', entityId).single();
    if (!original) throw new Error('Skill nao encontrada');
    const { id: _id, project_id: _pid, created_at: _ca, updated_at: _ua, ...rest } = original;
    const { data: created, error } = await supabase
      .from('skills')
      .insert({ ...rest, project_id: targetProjectId } as never)
      .select('id')
      .single();
    if (error) throw error;
    await supabase.from('skills').update({ usage_count: (original.usage_count ?? 0) + 1 } as never).eq('id', entityId);
    return created!.id;
  }

  if (entityType === 'squad') {
    const { data: original } = await supabase.from('squads').select('*').eq('id', entityId).single();
    if (!original) throw new Error('Squad nao encontrado');
    const { id: _id, project_id: _pid, created_at: _ca, updated_at: _ua, ...rest } = original;
    const { data: created, error } = await supabase
      .from('squads')
      .insert({ ...rest, project_id: targetProjectId } as never)
      .select('id')
      .single();
    if (error) throw error;
    await supabase.from('squads').update({ usage_count: (original.usage_count ?? 0) + 1 } as never).eq('id', entityId);
    return created!.id;
  }

  if (entityType === 'workflow') {
    const { data: original } = await supabase.from('workflows_library').select('*').eq('id', entityId).single();
    if (!original) throw new Error('Workflow nao encontrado');
    const { id: _id, project_id: _pid, created_at: _ca, updated_at: _ua, ...rest } = original;
    const { data: created, error } = await supabase
      .from('workflows_library')
      .insert({ ...rest, project_id: targetProjectId } as never)
      .select('id')
      .single();
    if (error) throw error;
    await supabase.from('workflows_library').update({ usage_count: (original.usage_count ?? 0) + 1 } as never).eq('id', entityId);
    return created!.id;
  }

  throw new Error(`Tipo desconhecido: ${entityType}`);
}
