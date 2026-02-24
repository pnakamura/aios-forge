import { motion } from 'framer-motion';
import { Bot, ArrowRight, Cpu, Users, Zap, Network, Code, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const features = [
  { icon: Bot, title: 'Agentes Inteligentes', desc: '11 agentes nativos + criação customizada' },
  { icon: Users, title: 'Squads', desc: 'Monte equipes de agentes com tasks e workflows' },
  { icon: Network, title: 'Orquestração', desc: '6 padrões de orquestração pré-configurados' },
  { icon: Zap, title: 'Geração Automática', desc: 'YAML, Markdown, configs gerados automaticamente' },
  { icon: ShieldCheck, title: 'Validação AIOS', desc: 'Conformidade com padrões AIOS Core' },
  { icon: Code, title: 'IA Assistente', desc: 'Chat inteligente guia cada etapa do processo' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background bg-grid relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight">AIOS Builder</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
          Entrar
        </Button>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center px-8 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Sistema de Orquestração de Agentes IA
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            Construa seu{' '}
            <span className="text-primary text-glow">AIOS</span>
            <br />
            em minutos
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Configure agentes, monte squads e gere toda a estrutura do seu sistema de IA orquestrado — 
            com um wizard conversacional inteligente.
          </p>

          <div className="flex items-center gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="gap-2 px-8 h-12 text-base font-semibold shadow-[var(--shadow-glow)]"
            >
              Criar novo AIOS
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/auth')}
              className="h-12 px-8 text-base"
            >
              Ver projetos
            </Button>
          </div>
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto mt-24"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="glass rounded-xl p-6 hover:border-primary/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
