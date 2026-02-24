import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Cpu, Plus, FolderOpen, LogOut, Bot, Users, Network } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Project {
  id: string;
  name: string;
  description: string | null;
  domain: string;
  orchestration_pattern: string;
  created_at: string;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
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
    HIERARCHICAL: 'Hierárquico',
    WATCHDOG: 'Watchdog',
    COLLABORATIVE: 'Colaborativo',
    TASK_FIRST: 'Task-First',
  };

  return (
    <div className="min-h-screen bg-background bg-grid relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <header className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Cpu className="w-4.5 h-4.5 text-primary" />
          </div>
          <span className="text-lg font-bold">AIOS Builder</span>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => navigate('/wizard')} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo AIOS
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold mb-2">Seus Projetos</h1>
        <p className="text-muted-foreground mb-8">Gerencie seus sistemas de agentes IA</p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-xl p-6 animate-pulse h-40" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-12 text-center"
          >
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum projeto ainda</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Crie seu primeiro AIOS com o wizard conversacional
            </p>
            <Button onClick={() => navigate('/wizard')} className="gap-2">
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
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">{p.domain}</span>
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{p.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.description || 'Sem descrição'}</p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                    <Network className="w-3 h-3" />
                    {patternLabels[p.orchestration_pattern] || p.orchestration_pattern}
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
