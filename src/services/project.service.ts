/**
 * @agent     ProjectService
 * @persona   Camada de servico para CRUD de projetos, agentes, squads e arquivos gerados
 * @version   1.0.0
 * @commands  listProjects, getProject, getProjectWithChildren, deleteProject
 * @deps      supabase/client
 * @context   Usado por DashboardPage, ProjectDetailPage e WizardPage para persistencia
 */

import { supabase } from '@/integrations/supabase/client';

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

export async function deleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}
