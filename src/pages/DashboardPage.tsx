import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cpu, Plus, FolderOpen, LogOut, Bot, Users, Network, Package, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Project {
  id: string;
  name: string;
  description: string | null;
  domain: string;
  orchestration_pattern: string;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/auth'); return; }

    const { data, error } = await supabase.from('projects').select('*').order('updated_at', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar projetos');
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const patternLabels: Record<string, string> = {
    SEQUENTIAL_PIPELINE: 'Pipeline Sequencial',
    PARALLEL_SWARM: 'Enxame Paralelo',
    HIERARCHICAL: 'Hierarquico',
    WATCHDOG: 'Watchdog',
    COLLABORATIVE: 'Colaborativo',
    TASK_FIRST: 'Task-First',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-background bg-grid relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <header className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[var(--shadow-glow)]">
            <Cpu className="w-4.5 h-4.5 text-primary" />
          </div>
          <span className="text-lg font-bold">AIOS Forge</span>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => navigate('/wizard')} className="gap-2 shadow-[var(--shadow-glow)]">
            <Plus className="w-4 h-4" />
            Novo AIOS
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-8 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Seus Projetos</h1>
            <p className="text-muted-foreground text-sm">Gerencie seus sistemas de agentes IA orquestrados</p>
          </div>
          {projects.length > 0 && (
            <Badge variant="secondary" className="text-xs">{projects.length} projeto(s)</Badge>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-xl p-6 animate-pulse h-44" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-16 text-center max-w-lg mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 shadow-[var(--shadow-glow)]">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Nenhum projeto ainda</h3>
            <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
              Crie seu primeiro sistema AIOS com o wizard conversacional. O assistente vai guiar voce em cada etapa.
            </p>
            <Button onClick={() => navigate('/wizard')} className="gap-2 h-11 px-8 shadow-[var(--shadow-glow)]">
              <Plus className="w-4 h-4" />
              Criar novo AIOS
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/project/${p.id}`)}
                className="glass rounded-xl p-6 cursor-pointer hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:shadow-[var(--shadow-glow)] transition-shadow">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-[10px]">{p.domain}</Badge>
                </div>
                <h3 className="font-bold mb-1 group-hover:text-primary transition-colors">{p.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{p.description || 'Sem descricao'}</p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground">
                    <Network className="w-3 h-3" />
                    {patternLabels[p.orchestration_pattern] || p.orchestration_pattern}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(p.updated_at || p.created_at)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
