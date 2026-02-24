import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Bot, Users, Network, Download, FileText, Trash2 } from 'lucide-react';
import JSZip from 'jszip';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [squads, setSquads] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadProject();
  }, [id]);

  const loadProject = async () => {
    const [pRes, aRes, sRes, fRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('agents').select('*').eq('project_id', id),
      supabase.from('squads').select('*').eq('project_id', id),
      supabase.from('generated_files').select('*').eq('project_id', id),
    ]);
    if (pRes.error) { toast.error('Projeto não encontrado'); navigate('/dashboard'); return; }
    setProject(pRes.data);
    setAgents(aRes.data || []);
    setSquads(sRes.data || []);
    setFiles(fRes.data || []);
    setLoading(false);
  };

  const handleDownload = async () => {
    const zip = new JSZip();
    files.forEach((f: any) => zip.file(f.path, f.content));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
    await supabase.from('projects').delete().eq('id', id);
    toast.success('Projeto excluído');
    navigate('/dashboard');
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando...</div>;

  const patternLabels: Record<string, string> = {
    SEQUENTIAL_PIPELINE: 'Pipeline Sequencial', PARALLEL_SWARM: 'Enxame Paralelo',
    HIERARCHICAL: 'Hierárquico', WATCHDOG: 'Watchdog',
    COLLABORATIVE: 'Colaborativo', TASK_FIRST: 'Task-First',
  };

  return (
    <div className="min-h-screen bg-background bg-grid relative">
      <header className="flex items-center gap-3 px-8 py-4 border-b border-border/50">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-bold text-lg">{project.name}</h1>
        <Badge variant="outline" className="text-xs">{project.domain}</Badge>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-8 space-y-6">
        <div className="glass rounded-xl p-6">
          <p className="text-muted-foreground text-sm mb-4">{project.description || 'Sem descrição'}</p>
          <div className="flex items-center gap-4">
            <Badge className="gap-1"><Network className="w-3 h-3" />{patternLabels[project.orchestration_pattern]}</Badge>
            <Badge variant="secondary" className="gap-1"><Bot className="w-3 h-3" />{agents.length} agentes</Badge>
            <Badge variant="secondary" className="gap-1"><Users className="w-3 h-3" />{squads.length} squads</Badge>
            <Badge variant="secondary" className="gap-1"><FileText className="w-3 h-3" />{files.length} arquivos</Badge>
          </div>
        </div>

        {/* Agents */}
        <div>
          <h2 className="font-semibold mb-3">Agentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agents.map((a: any) => (
              <div key={a.id} className="glass rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{a.name}</span>
                  {a.is_custom && <Badge variant="outline" className="text-[10px]">Custom</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{a.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Squads */}
        {squads.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">Squads</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {squads.map((s: any) => (
                <div key={s.id} className="glass rounded-lg p-4">
                  <span className="font-medium text-sm">{s.name}</span>
                  <p className="text-xs text-muted-foreground">{s.description || s.slug}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleDownload} className="gap-2" disabled={files.length === 0}>
            <Download className="w-4 h-4" /> Download ZIP
          </Button>
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 className="w-4 h-4" /> Excluir
          </Button>
        </div>
      </main>
    </div>
  );
}
