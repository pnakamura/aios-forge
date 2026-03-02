/**
 * @agent     ProjectService
 * @persona   Camada de servico para CRUD de projetos, agentes, squads e arquivos gerados
 * @version   1.1.0
 * @commands  listProjects, getProject, getProjectWithChildren, deleteProject, saveProject, loadProjectForEditing
 * @deps      supabase/client
 * @context   Usado por DashboardPage, ProjectDetailPage e WizardPage para persistencia
 */

import { supabase } from '@/integrations/supabase/client';
import type { AiosAgent, AiosSquad, ProjectWorkflow } from '@/types/aios';

export async function listProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getProject(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getProjectWithChildren(id: string) {
  const [pRes, aRes, sRes, fRes] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('agents').select('*').eq('project_id', id),
    supabase.from('squads').select('*').eq('project_id', id),
    supabase.from('generated_files').select('*').eq('project_id', id),
  ]);
  if (pRes.error) throw pRes.error;
  return {
    project: pRes.data,
    agents: aRes.data || [],
    squads: sRes.data || [],
    files: fRes.data || [],
  };
}

export async function loadProjectForEditing(id: string) {
  const [pRes, aRes, sRes] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('agents').select('*').eq('project_id', id),
    supabase.from('squads').select('*').eq('project_id', id),
  ]);
  if (pRes.error) throw pRes.error;
  return {
    project: pRes.data,
    agents: aRes.data || [],
    squads: sRes.data || [],
  };
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

interface SaveProjectParams {
  editingProjectId: string | null;
  userId: string;
  project: {
    name?: string;
    description?: string;
    domain?: string;
    orchestrationPattern?: string;
    config?: Record<string, unknown>;
  };
  agents: AiosAgent[];
  squads: AiosSquad[];
  workflows: ProjectWorkflow[];
  files: { path: string; content: string; type: string; complianceStatus: string; complianceNotes?: string }[];
}

export async function saveProject(params: SaveProjectParams): Promise<string> {
  const { editingProjectId, userId, project, agents, squads, workflows, files } = params;
  const isUpdate = !!editingProjectId;
  let projectId: string;

  if (isUpdate) {
    projectId = editingProjectId!;
    const { error: projErr } = await supabase.from('projects').update({
      name: project.name || 'Meu AIOS',
      description: project.description || '',
      domain: project.domain || 'software',
      orchestration_pattern: (project.orchestrationPattern || 'TASK_FIRST') as any,
      config: JSON.parse(JSON.stringify(project.config || {})),
      workflows: JSON.parse(JSON.stringify(workflows)),
    } as any).eq('id', projectId);
    if (projErr) throw projErr;

    await Promise.all([
      supabase.from('agents').delete().eq('project_id', projectId),
      supabase.from('squads').delete().eq('project_id', projectId),
      supabase.from('generated_files').delete().eq('project_id', projectId),
    ]);
  } else {
    const { data: proj, error: projErr } = await supabase.from('projects').insert({
      name: project.name || 'Meu AIOS',
      description: project.description || '',
      domain: project.domain || 'software',
      orchestration_pattern: (project.orchestrationPattern || 'TASK_FIRST') as any,
      config: JSON.parse(JSON.stringify(project.config || {})),
      workflows: JSON.parse(JSON.stringify(workflows)),
      user_id: userId,
    } as any).select().single();
    if (projErr) throw projErr;
    projectId = proj.id;
  }

  if (agents.length > 0) {
    const agentRows = agents.map(agent => ({
      project_id: projectId,
      name: agent.name,
      slug: agent.slug,
      role: agent.role,
      system_prompt: agent.systemPrompt,
      llm_model: agent.llmModel,
      commands: JSON.parse(JSON.stringify(agent.commands)),
      tools: JSON.parse(JSON.stringify(agent.tools)),
      skills: JSON.parse(JSON.stringify(agent.skills)),
      visibility: agent.visibility,
      is_custom: agent.isCustom,
      definition_md: '',
    }));
    const { error: agentErr } = await supabase.from('agents').insert(agentRows as any);
    if (agentErr) throw agentErr;
  }

  if (squads.length > 0) {
    const squadRows = squads.map(squad => ({
      project_id: projectId,
      name: squad.name,
      slug: squad.slug,
      description: squad.description,
      manifest_yaml: squad.manifestYaml || '',
      tasks: JSON.parse(JSON.stringify(squad.tasks)),
      workflows: JSON.parse(JSON.stringify(squad.workflows)),
      agent_ids: JSON.parse(JSON.stringify(squad.agentIds)),
      is_validated: squad.isValidated,
    }));
    const { error: squadErr } = await supabase.from('squads').insert(squadRows as any);
    if (squadErr) throw squadErr;
  }

  if (files.length > 0) {
    const fileRows = files.map(file => ({
      project_id: projectId,
      path: file.path,
      content: file.content,
      file_type: file.type,
      compliance_status: file.complianceStatus,
      compliance_notes: file.complianceNotes || null,
    }));
    const { error: fileErr } = await supabase.from('generated_files').insert(fileRows);
    if (fileErr) throw fileErr;
  }

  return projectId;
}

export async function downloadProjectZip(files: { path: string; content: string }[], projectName: string) {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  files.forEach(f => zip.file(f.path, f.content));
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
