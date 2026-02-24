import { motion } from 'framer-motion';
import { Bot, ArrowRight, Cpu, Users, Zap, Network, Code, ShieldCheck, Package, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const features = [
  { icon: Bot, title: '11 Agentes Nativos', desc: 'Agentes pre-configurados para cada papel no ciclo de desenvolvimento' },
  { icon: Users, title: 'Squads Inteligentes', desc: 'Monte equipes de agentes com tasks, workflows e dependencias' },
  { icon: Network, title: '6 Padroes de Orquestracao', desc: 'Pipeline, Swarm, Hierarquico, Watchdog, Colaborativo e Task-First' },
  { icon: Package, title: 'Pacote Completo', desc: 'Runtime TypeScript, Docker, scripts de setup e documentacao' },
  { icon: ShieldCheck, title: 'Validacao AIOS', desc: 'Conformidade automatica com padroes AIOS Core' },
  { icon: Code, title: 'IA Assistente', desc: 'Chat inteligente guia cada etapa da configuracao' },
];

const steps = [
  { num: '01', title: 'Descreva', desc: 'Converse com a IA sobre seu projeto e objetivos' },
  { num: '02', title: 'Configure', desc: 'Selecione agentes, monte squads e defina workflows' },
  { num: '03', title: 'Valide', desc: 'Revise a conformidade e a arquitetura do sistema' },
  { num: '04', title: 'Exporte', desc: 'Baixe o pacote completo pronto para instalacao' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background bg-grid relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-glow-success/3 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[var(--shadow-glow)]">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight">AIOS Forge</span>
            <span className="text-xs text-muted-foreground ml-2">v1.0</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
            Entrar
          </Button>
          <Button size="sm" onClick={() => navigate('/auth')} className="gap-2 shadow-[var(--shadow-glow)]">
            Comecar <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10">
        <section className="flex flex-col items-center justify-center px-8 pt-24 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-8">
              <Zap className="w-3.5 h-3.5" />
              Sistema de Orquestracao de Agentes IA
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
              Construa seu{' '}
              <span className="text-primary text-glow">AIOS</span>
              <br />
              em minutos
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              Configure agentes, monte squads e gere um pacote de instalacao completo
              do seu sistema de IA orquestrado — com um wizard conversacional inteligente.
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
        </section>

        {/* How it works */}
        <section className="px-8 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-5xl mx-auto"
          >
            <h2 className="text-center text-sm font-semibold text-primary uppercase tracking-widest mb-10">Como funciona</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="relative"
                >
                  <div className="text-4xl font-black text-primary/10 mb-3">{step.num}</div>
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-6 right-0 translate-x-1/2">
                      <ArrowRight className="w-4 h-4 text-primary/20" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Features grid */}
        <section className="px-8 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="glass rounded-xl p-6 hover:border-primary/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors group-hover:shadow-[var(--shadow-glow)]">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Generated package preview */}
        <section className="px-8 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="max-w-3xl mx-auto glass rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Terminal className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Pacote Gerado</h3>
            </div>
            <pre className="text-xs font-mono text-muted-foreground leading-relaxed">
{`meu-aios/
├── aios.config.yaml       # Configuracao principal
├── package.json            # Dependencias Node.js
├── tsconfig.json           # TypeScript config
├── Dockerfile              # Container Docker
├── docker-compose.yaml     # Orquestracao Docker
├── src/
│   ├── main.ts             # Entry point
│   ├── orchestrator.ts     # Motor de orquestracao
│   ├── agent-runner.ts     # Executor de agentes (LLM)
│   ├── logger.ts           # Logging estruturado
│   └── types.ts            # Definicoes de tipos
├── agents/                 # Definicoes de agentes
├── squads/                 # Manifests de squads
├── scripts/setup.sh        # Script de instalacao
└── docs/                   # Documentacao completa`}
            </pre>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8 px-8 text-center">
          <p className="text-xs text-muted-foreground">
            AIOS Forge — Construa sistemas de agentes IA orquestrados
          </p>
        </footer>
      </main>
    </div>
  );
}
