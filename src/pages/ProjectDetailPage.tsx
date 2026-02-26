import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Bot, Users, Network, Download, FileText, Trash2, Package, Calendar, Terminal, Copy, Check, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import JSZip from 'jszip';
import { cn } from '@/lib/utils';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [squads, setSquads] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [copied, setCopied] = useState(false);

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
    if (pRes.error) { toast.error('Projeto nao encontrado'); navigate('/dashboard'); return; }
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
    toast.success('ZIP baixado!');
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este projeto? Essa acao nao pode ser desfeita.')) return;
    await supabase.from('projects').delete().eq('id', id);
    toast.success('Projeto excluido');
    navigate('/dashboard');
  };

  const copyFileContent = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20" />
          <p className="text-sm text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  const patternLabels: Record<string, string> = {
    SEQUENTIAL_PIPELINE: 'Pipeline Sequencial', PARALLEL_SWARM: 'Enxame Paralelo',
    HIERARCHICAL: 'Hierarquico', WATCHDOG: 'Watchdog',
    COLLABORATIVE: 'Colaborativo', TASK_FIRST: 'Task-First',
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-background bg-grid relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <header className="relative z-10 flex items-center gap-4 px-8 py-4 border-b border-border/50 backdrop-blur-sm">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <h1 className="font-bold text-lg">{project.name}</h1>
          <Badge variant="outline" className="text-xs">{project.domain}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/wizard/${id}`)} size="sm" className="gap-2">
            <Pencil className="w-3.5 h-3.5" /> Editar
          </Button>
          <Button onClick={handleDownload} className="gap-2" disabled={files.length === 0} size="sm">
            <Download className="w-3.5 h-3.5" /> Download ZIP
          </Button>
          <Button variant="destructive" onClick={handleDelete} size="sm" className="gap-2">
            <Trash2 className="w-3.5 h-3.5" /> Excluir
          </Button>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Project info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Project summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-6"
            >
              <p className="text-muted-foreground text-sm mb-4">{project.description || 'Sem descricao'}</p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-primary" />
                  <span className="text-sm">{patternLabels[project.orchestration_pattern]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{formatDate(project.created_at)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
                <Badge variant="secondary" className="gap-1 text-xs"><Bot className="w-3 h-3" />{agents.length} agentes</Badge>
                <Badge variant="secondary" className="gap-1 text-xs"><Users className="w-3 h-3" />{squads.length} squads</Badge>
                <Badge variant="secondary" className="gap-1 text-xs"><FileText className="w-3 h-3" />{files.length} arquivos</Badge>
              </div>
            </motion.div>

            {/* Agents */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass rounded-xl p-6"
            >
              <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" /> Agentes
              </h2>
              <div className="space-y-2">
                {agents.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium block truncate">{a.name}</span>
                      <span className="text-[10px] text-muted-foreground block truncate">{a.role}</span>
                    </div>
                    {a.is_custom && <Badge variant="outline" className="text-[9px] shrink-0">Custom</Badge>}
                  </div>
                ))}
                {agents.length === 0 && <p className="text-xs text-muted-foreground">Nenhum agente</p>}
              </div>
            </motion.div>

            {/* Squads */}
            {squads.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-xl p-6"
              >
                <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" /> Squads
                </h2>
                <div className="space-y-2">
                  {squads.map((s: any) => (
                    <div key={s.id} className="p-2 rounded-lg bg-secondary/30">
                      <span className="text-xs font-medium">{s.name}</span>
                      <p className="text-[10px] text-muted-foreground">{s.description || s.slug}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right column - File browser */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 glass rounded-xl overflow-hidden flex flex-col"
            style={{ minHeight: '500px' }}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-card/30">
              <Terminal className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Arquivos do Pacote</h2>
              <Badge variant="secondary" className="text-[10px] ml-auto">{files.length} arquivos</Badge>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* File list */}
              <div className="w-56 border-r border-border/50 overflow-y-auto p-2 bg-card/20 shrink-0">
                {files.map((f: any) => (
                  <button
                    key={f.id || f.path}
                    onClick={() => setSelectedFile(f)}
                    className={cn(
                      'w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-1.5 transition-all',
                      selectedFile?.path === f.path
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-secondary/50 text-muted-foreground'
                    )}
                  >
                    <FileText className="w-3 h-3 shrink-0" />
                    <span className="truncate font-mono">{f.path}</span>
                  </button>
                ))}
                {files.length === 0 && (
                  <p className="text-xs text-muted-foreground p-4 text-center">Nenhum arquivo gerado</p>
                )}
              </div>

              {/* File content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {selectedFile ? (
                  <>
                    <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card/20">
                      <span className="text-xs font-mono text-muted-foreground">{selectedFile.path}</span>
                      <Button variant="ghost" size="sm" onClick={() => copyFileContent(selectedFile.content)} className="gap-1.5 text-xs h-7">
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copiado' : 'Copiar'}
                      </Button>
                    </div>
                    <pre className="flex-1 overflow-auto p-4 text-xs font-mono leading-relaxed text-secondary-foreground">
                      {selectedFile.content}
                    </pre>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                    Selecione um arquivo para visualizar
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
