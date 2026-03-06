/**
 * @agent     LibraryEditorService
 * @persona   Camada de servico para criacao, edicao e publicacao de artefatos na Library
 * @version   1.0.0
 * @commands  createDraft, createFork, saveDraft, publishDraft, discardDraft, validateElement, loadEditorSession, saveEditorSession
 * @deps      supabase/client
 * @context   Gerencia working copies (draft/fork) e sessoes de edicao com IA.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  LibraryEntityType,
  AgentFormData,
  SkillFormData,
  SquadFormData,
  WorkflowFormData,
  ValidationError,
  EditorAiMessage,
  WorkingCopy,
} from '@/types/library';

type FormData = AgentFormData | SkillFormData | SquadFormData | WorkflowFormData;

// ── Helpers ──

async function getCurrentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user?.id) throw new Error('Nao autenticado');
  return data.user.id;
}

function getTableName(type: LibraryEntityType): string {
  switch (type) {
    case 'agent': return 'agents';
    case 'skill': return 'skills';
    case 'squad': return 'squads';
    case 'workflow': return 'workflows_library';
  }
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'novo-elemento';
}

// ── Default form data factories ──

function defaultAgentData(): AgentFormData {
  return {
    name: '', slug: '', role: '', category: 'Custom', systemPrompt: '',
    llmModel: 'google/gemini-3-flash-preview', commands: [], tools: [], skills: [],
    visibility: 'full', tags: [], isPublic: false, description: '',
  };
}

function defaultSkillData(): SkillFormData {
  return {
    name: '', slug: '', description: '', category: 'general',
    inputs: [], outputs: [], prompt: '', examples: [], tags: [], isPublic: false,
  };
}

function defaultSquadData(): SquadFormData {
  return {
    name: '', slug: '', description: '', agentSlugs: [],
    tasks: [], workflows: [], tags: [], isPublic: false,
  };
}

function defaultWorkflowData(): WorkflowFormData {
  return {
    name: '', slug: '', description: '', pattern: 'sequential',
    steps: [], triggers: [], outputs: [], tags: [], isPublic: false,
  };
}

export function getDefaultFormData(type: LibraryEntityType): FormData {
  switch (type) {
    case 'agent': return defaultAgentData();
    case 'skill': return defaultSkillData();
    case 'squad': return defaultSquadData();
    case 'workflow': return defaultWorkflowData();
  }
}

// ── Create Draft ──

export async function createDraft(type: LibraryEntityType, projectId: string): Promise<string> {
  const table = getTableName(type);
  const defaults = getDefaultFormData(type);
  const slug = `draft-${Date.now()}`;

  const insertData: Record<string, unknown> = {
    project_id: projectId,
    name: defaults.name || 'Novo elemento',
    slug,
    status: 'draft',
    version: '0.1.0',
    created_in_library: true,
  };

  if (type === 'agent') {
    const d = defaults as AgentFormData;
    insertData.role = d.role || 'Novo agente';
    insertData.system_prompt = d.systemPrompt;
    insertData.llm_model = d.llmModel;
    insertData.commands = d.commands;
    insertData.tools = d.tools;
    insertData.skills = d.skills;
    insertData.visibility = d.visibility;
    insertData.tags = d.tags;
    insertData.is_public = d.isPublic;
    insertData.is_custom = true;
  } else if (type === 'skill') {
    const d = defaults as SkillFormData;
    insertData.description = d.description;
    insertData.category = d.category;
    insertData.inputs = d.inputs;
    insertData.outputs = d.outputs;
    insertData.prompt = d.prompt;
    insertData.examples = d.examples;
    insertData.tags = d.tags;
    insertData.is_public = d.isPublic;
  } else if (type === 'squad') {
    const d = defaults as SquadFormData;
    insertData.description = d.description;
    insertData.agent_ids = [];
    insertData.tasks = d.tasks;
    insertData.workflows = d.workflows;
    insertData.tags = d.tags;
    insertData.is_public = d.isPublic;
  } else if (type === 'workflow') {
    const d = defaults as WorkflowFormData;
    insertData.description = d.description;
    insertData.pattern = d.pattern;
    insertData.steps = d.steps;
    insertData.triggers = d.triggers;
    insertData.outputs = d.outputs;
    insertData.tags = d.tags;
    insertData.is_public = d.isPublic;
  }

  const { data, error } = await supabase
    .from(table as 'agents')
    .insert(insertData as never)
    .select('id')
    .single();
  if (error) throw error;
  return data!.id;
}

// ── Create Fork ──

export async function createFork(type: LibraryEntityType, originalId: string, projectId: string): Promise<string> {
  const table = getTableName(type);

  const { data: original, error: fetchErr } = await supabase
    .from(table as 'agents')
    .select('*')
    .eq('id', originalId)
    .single();
  if (fetchErr || !original) throw new Error('Elemento original nao encontrado');

  const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = original as Record<string, unknown>;
  const forkData = {
    ...rest,
    project_id: projectId,
    status: 'fork',
    parent_id: originalId,
    created_in_library: true,
    slug: `fork-${toSlug(String(rest.name || ''))}-${Date.now().toString(36)}`,
  };

  const { data, error } = await supabase
    .from(table as 'agents')
    .insert(forkData as never)
    .select('id')
    .single();
  if (error) throw error;
  return data!.id;
}

// ── Save Draft ──

export async function saveDraft(type: LibraryEntityType, id: string, formData: FormData): Promise<void> {
  const table = getTableName(type);
  const updateData: Record<string, unknown> = {
    name: formData.name,
    slug: formData.slug || toSlug(formData.name),
    tags: formData.tags,
    is_public: formData.isPublic,
  };

  if (type === 'agent') {
    const d = formData as AgentFormData;
    updateData.role = d.role;
    updateData.system_prompt = d.systemPrompt;
    updateData.llm_model = d.llmModel;
    updateData.commands = d.commands;
    updateData.tools = d.tools;
    updateData.skills = d.skills;
    updateData.visibility = d.visibility;
  } else if (type === 'skill') {
    const d = formData as SkillFormData;
    updateData.description = d.description;
    updateData.category = d.category;
    updateData.inputs = d.inputs;
    updateData.outputs = d.outputs;
    updateData.prompt = d.prompt;
    updateData.examples = d.examples;
  } else if (type === 'squad') {
    const d = formData as SquadFormData;
    updateData.description = d.description;
    updateData.tasks = d.tasks;
    updateData.workflows = d.workflows;
  } else if (type === 'workflow') {
    const d = formData as WorkflowFormData;
    updateData.description = d.description;
    updateData.pattern = d.pattern;
    updateData.steps = d.steps;
    updateData.triggers = d.triggers;
    updateData.outputs = d.outputs;
  }

  const { error } = await supabase
    .from(table as 'agents')
    .update(updateData as never)
    .eq('id', id);
  if (error) throw error;
}

// ── Publish ──

export async function publishDraft(
  type: LibraryEntityType,
  id: string,
  changelog: string,
  version: string
): Promise<void> {
  const table = getTableName(type);

  // Get current changelog
  const { data: current } = await supabase
    .from(table as 'agents')
    .select('changelog')
    .eq('id', id)
    .single();

  const existingChangelog = Array.isArray((current as Record<string, unknown>)?.changelog)
    ? (current as Record<string, unknown>).changelog as unknown[]
    : [];

  const newEntry = { version, changelog, publishedAt: new Date().toISOString() };

  const { error } = await supabase
    .from(table as 'agents')
    .update({
      status: 'published',
      version,
      published_at: new Date().toISOString(),
      changelog: [...existingChangelog, newEntry],
    } as never)
    .eq('id', id);
  if (error) throw error;
}

// ── Discard ──

export async function discardDraft(type: LibraryEntityType, id: string): Promise<void> {
  const table = getTableName(type);
  const { error } = await supabase
    .from(table as 'agents')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── Load entity data for editor ──

export async function loadEntityForEditor(type: LibraryEntityType, id: string): Promise<WorkingCopy | null> {
  const table = getTableName(type);
  const { data, error } = await supabase
    .from(table as 'agents')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;

  const raw = data as Record<string, unknown>;
  const status = raw.status as string;

  let formData: FormData;
  if (type === 'agent') {
    // Normalize commands from DB (may be strings or objects)
    const rawCommands = (raw.commands as unknown[]) || [];
    const normalizedCmds = rawCommands.map((c: unknown) => {
      if (typeof c === 'string') return { name: c, description: '', visibility: 'public', handler: '' };
      if (c && typeof c === 'object') {
        const obj = c as Record<string, unknown>;
        return {
          name: String(obj.name || ''),
          description: String(obj.description || ''),
          visibility: String(obj.visibility || 'public'),
          handler: String(obj.handler || obj.returnType || ''),
        };
      }
      return { name: '', description: '', visibility: 'public', handler: '' };
    });
    formData = {
      name: raw.name as string,
      slug: raw.slug as string,
      role: raw.role as string,
      category: (raw.is_custom as boolean) ? 'Custom' : 'Nativo',
      systemPrompt: raw.system_prompt as string,
      llmModel: raw.llm_model as string,
      commands: normalizedCmds,
      tools: (raw.tools as string[]) || [],
      skills: (raw.skills as string[]) || [],
      visibility: raw.visibility as string,
      tags: (raw.tags as string[]) || [],
      isPublic: raw.is_public as boolean,
      description: raw.role as string,
    };
  } else if (type === 'skill') {
    formData = {
      name: raw.name as string,
      slug: raw.slug as string,
      description: raw.description as string,
      category: raw.category as string,
      inputs: (raw.inputs as SkillFormData['inputs']) || [],
      outputs: (raw.outputs as SkillFormData['outputs']) || [],
      prompt: raw.prompt as string,
      examples: (raw.examples as SkillFormData['examples']) || [],
      tags: (raw.tags as string[]) || [],
      isPublic: raw.is_public as boolean,
    };
  } else if (type === 'squad') {
    formData = {
      name: raw.name as string,
      slug: raw.slug as string,
      description: (raw.description as string) || '',
      agentSlugs: (raw.agent_ids as string[]) || [],
      tasks: (raw.tasks as SquadFormData['tasks']) || [],
      workflows: (raw.workflows as string[]) || [],
      tags: (raw.tags as string[]) || [],
      isPublic: raw.is_public as boolean,
    };
  } else {
    formData = {
      name: raw.name as string,
      slug: raw.slug as string,
      description: raw.description as string,
      pattern: (raw.pattern as WorkflowFormData['pattern']) || 'sequential',
      steps: (raw.steps as WorkflowFormData['steps']) || [],
      triggers: (raw.triggers as WorkflowFormData['triggers']) || [],
      outputs: (raw.outputs as WorkflowFormData['outputs']) || [],
      tags: (raw.tags as string[]) || [],
      isPublic: raw.is_public as boolean,
    };
  }

  // Load parent info if fork
  let originalName: string | undefined;
  let originalVersion: string | undefined;
  if (raw.parent_id) {
    const { data: parent } = await supabase
      .from(table as 'agents')
      .select('name, version')
      .eq('id', raw.parent_id as string)
      .single();
    if (parent) {
      originalName = (parent as Record<string, unknown>).name as string;
      originalVersion = (parent as Record<string, unknown>).version as string;
    }
  }

  return {
    id,
    type,
    status: status as 'draft' | 'fork',
    originalId: raw.parent_id as string | undefined,
    originalName,
    originalVersion,
    projectId: raw.project_id as string,
    data: formData,
    isDirty: false,
    lastSavedAt: raw.updated_at as string,
  };
}

// ── Validate element ──

export function validateElement(type: LibraryEntityType, data: FormData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name?.trim()) {
    errors.push({ field: 'name', message: 'Nome e obrigatorio', severity: 'error' });
  }
  if (!data.slug?.trim()) {
    errors.push({ field: 'slug', message: 'Slug e obrigatorio', severity: 'error' });
  } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push({ field: 'slug', message: 'Slug deve ser lowercase-kebab-case', severity: 'error' });
  }

  if (type === 'agent') {
    const d = data as AgentFormData;
    if (!d.role?.trim()) errors.push({ field: 'role', message: 'Role e obrigatorio', severity: 'error' });
    if (!d.systemPrompt?.trim()) errors.push({ field: 'systemPrompt', message: 'System prompt e obrigatorio', severity: 'warning' });
    if (d.commands.length === 0) errors.push({ field: 'commands', message: 'Adicione pelo menos 1 comando', severity: 'warning' });
  } else if (type === 'skill') {
    const d = data as SkillFormData;
    if (!d.prompt?.trim()) errors.push({ field: 'prompt', message: 'Prompt da skill e obrigatorio', severity: 'error' });
    if (d.inputs.length === 0) errors.push({ field: 'inputs', message: 'Adicione pelo menos 1 input', severity: 'warning' });
  } else if (type === 'squad') {
    const d = data as SquadFormData;
    if (d.agentSlugs.length === 0) errors.push({ field: 'agentSlugs', message: 'Adicione pelo menos 1 agente', severity: 'warning' });
  } else if (type === 'workflow') {
    const d = data as WorkflowFormData;
    if (d.steps.length === 0) errors.push({ field: 'steps', message: 'Adicione pelo menos 1 step', severity: 'warning' });
    if (d.triggers.length === 0) errors.push({ field: 'triggers', message: 'Adicione pelo menos 1 trigger', severity: 'warning' });
  }

  return errors;
}

// ── Editor session persistence ──

export async function loadEditorSession(type: LibraryEntityType, entityId: string): Promise<EditorAiMessage[]> {
  const userId = await getCurrentUserId();
  const { data } = await (supabase
    .from('library_editor_sessions') as any)
    .select('ai_messages')
    .eq('user_id', userId)
    .eq('entity_type', type)
    .eq('entity_id', entityId)
    .maybeSingle();
  return (data?.ai_messages as EditorAiMessage[]) || [];
}

export async function saveEditorSession(type: LibraryEntityType, entityId: string, aiMessages: EditorAiMessage[]): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await (supabase
    .from('library_editor_sessions') as any)
    .upsert({
      user_id: userId,
      entity_type: type,
      entity_id: entityId,
      ai_messages: aiMessages,
      last_saved_at: new Date().toISOString(),
    }, { onConflict: 'user_id,entity_type,entity_id' });
  if (error) throw error;
}

// ── Fetch user drafts/forks ──

export async function fetchUserDrafts(): Promise<{ type: LibraryEntityType; id: string; name: string; status: string; updatedAt: string }[]> {
  const results: { type: LibraryEntityType; id: string; name: string; status: string; updatedAt: string }[] = [];

  const tables: { type: LibraryEntityType; table: string }[] = [
    { type: 'agent', table: 'agents' },
    { type: 'skill', table: 'skills' },
    { type: 'squad', table: 'squads' },
    { type: 'workflow', table: 'workflows_library' },
  ];

  const promises = tables.map(async ({ type, table }) => {
    const { data } = await supabase
      .from(table as 'agents')
      .select('id, name, status, updated_at')
      .in('status', ['draft', 'fork']);
    if (data) {
      for (const row of data) {
        const r = row as Record<string, unknown>;
        results.push({
          type,
          id: r.id as string,
          name: r.name as string,
          status: r.status as string,
          updatedAt: r.updated_at as string,
        });
      }
    }
  });

  await Promise.all(promises);
  return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
