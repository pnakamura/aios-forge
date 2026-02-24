import { motion } from 'framer-motion';
import { Bot, ArrowRight, Cpu, Users, Zap, Network, Code, ShieldCheck, Package, Terminal, Sparkles, Layers, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const features = [
  { icon: Bot, title: '11 Agentes Nativos', desc: 'Agentes pre-configurados para cada papel no ciclo de desenvolvimento', color: 'primary' },
  { icon: Users, title: 'Squads Inteligentes', desc: 'Monte equipes de agentes com tasks, workflows e dependencias', color: 'accent' },
  { icon: Network, title: '6 Padroes de Orquestracao', desc: 'Pipeline, Swarm, Hierarquico, Watchdog, Colaborativo e Task-First', color: 'primary' },
  { icon: Package, title: 'Pacote Completo', desc: 'Runtime TypeScript, Docker, scripts de setup e documentacao', color: 'glow-success' },
  { icon: ShieldCheck, title: 'Validacao AIOS', desc: 'Conformidade automatica com padroes AIOS Core', color: 'glow-warning' },
  { icon: Code, title: 'IA Assistente', desc: 'Chat inteligente guia cada etapa da configuracao', color: 'accent' },
];

const steps = [
  { num: '01', title: 'Descreva', desc: 'Converse com a IA sobre seu projeto e objetivos', icon: Sparkles },
  { num: '02', title: 'Configure', desc: 'Selecione agentes, monte squads e defina workflows', icon: Layers },
  { num: '03', title: 'Valide', desc: 'Revise a conformidade e a arquitetura do sistema', icon: ShieldCheck },
  { num: '04', title: 'Exporte', desc: 'Baixe o pacote completo pronto para instalacao', icon: Package },
];

// Animated orb background
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(190 95% 50% / 0.07) 0%, transparent 70%)',
          top: '-10%', left: '20%',
        }}
        animate={{ x: [0, 60, -30, 0], y: [0, -40, 20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(265 80% 60% / 0.06) 0%, transparent 70%)',
          top: '30%', right: '-5%',
        }}
        animate={{ x: [0, -50, 30, 0], y: [0, 30, -50, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(150 80% 45% / 0.04) 0%, transparent 70%)',
          bottom: '10%', left: '5%',
        }}
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// Typing animation for hero
function TypedText({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % words.length), 3000);
    return () => clearInterval(timer);
  }, [words.length]);

  return (
    <span className="relative inline-block min-w-[200px]">
      {words.map((word, i) => (
        <motion.span
          key={word}
          className="absolute left-0 text-primary text-glow"
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={i === index ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: -20, filter: 'blur(8px)' }}
          transition={{ duration: 0.5 }}
        >
          {word}
        </motion.span>
      ))}
      <span className="invisible">{words.reduce((a, b) => a.length > b.length ? a : b, '')}</span>
    </span>
  );
}

function StatCounter({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-black text-primary text-glow">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingOrbs />
      <div className="bg-dots absolute inset-0 pointer-events-none opacity-30" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-border/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[var(--shadow-glow)] ring-pulse">
            <Cpu className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">AIOS Forge</span>
            <span className="text-[10px] font-mono text-muted-foreground/60 border border-border/50 rounded px-1.5 py-0.5">v1.0</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="text-muted-foreground hover:text-foreground">
            Entrar
          </Button>
          <Button size="sm" onClick={() => navigate('/auth')} className="gap-2 shadow-[var(--shadow-glow)] rounded-xl">
            Comecar <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10">
        <section className="flex flex-col items-center justify-center px-8 pt-28 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-10 shimmer"
            >
              <Zap className="w-3.5 h-3.5" />
              Sistema de Orquestracao de Agentes IA
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-8">
              Construa seu{' '}
              <TypedText words={['AIOS', 'Squad', 'Pipeline']} />
              <br />
              <span className="text-muted-foreground/80">em minutos</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
              Configure agentes inteligentes, monte squads coordenados e gere um pacote
              de instalacao completo — guiado por um wizard conversacional com IA.
            </p>

            <div className="flex items-center gap-4 justify-center mb-16">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="gap-2 px-8 h-13 text-base font-semibold shadow-[var(--shadow-glow)] rounded-xl"
              >
                Criar novo AIOS
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/auth')}
                className="h-13 px-8 text-base rounded-xl border-border/50 hover:border-primary/30"
              >
                Ver projetos
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex items-center justify-center gap-12"
            >
              <StatCounter value="11" label="Agentes nativos" />
              <div className="w-px h-8 bg-border/40" />
              <StatCounter value="6" label="Padroes" />
              <div className="w-px h-8 bg-border/40" />
              <StatCounter value="30+" label="Arquivos gerados" />
            </motion.div>
          </motion.div>
        </section>

        {/* How it works */}
        <section className="px-8 pb-28">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto"
          >
            <h2 className="text-center text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-4">Como funciona</h2>
            <p className="text-center text-muted-foreground text-sm mb-14 max-w-md mx-auto">
              Do conceito ao pacote instalavel em 4 passos simples
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="relative group"
                >
                  <div className="glass-strong rounded-2xl p-6 hover:border-primary/30 transition-all h-full">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:shadow-[var(--shadow-glow)] transition-all">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-[10px] font-mono text-primary/50 mb-2">{step.num}</div>
                    <h3 className="font-bold text-sm mb-1.5">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden md:flex absolute top-1/2 -right-2 -translate-y-1/2 z-10 w-4 items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-primary/20" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Features grid */}
        <section className="px-8 pb-28">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto"
          >
            <h2 className="text-center text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-4">Recursos</h2>
            <p className="text-center text-muted-foreground text-sm mb-14 max-w-md mx-auto">
              Tudo o que voce precisa para construir um sistema de agentes IA
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="glass rounded-2xl p-6 hover:border-primary/25 transition-all group cursor-default"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all
                    ${f.color === 'primary' ? 'bg-primary/10 group-hover:bg-primary/15 group-hover:shadow-[0_0_20px_-5px_hsl(var(--glow-primary)/0.3)]' :
                      f.color === 'accent' ? 'bg-accent/10 group-hover:bg-accent/15 group-hover:shadow-[0_0_20px_-5px_hsl(var(--glow-accent)/0.3)]' :
                      f.color === 'glow-success' ? 'bg-glow-success/10 group-hover:bg-glow-success/15 group-hover:shadow-[0_0_20px_-5px_hsl(var(--glow-success)/0.3)]' :
                      'bg-glow-warning/10 group-hover:bg-glow-warning/15 group-hover:shadow-[0_0_20px_-5px_hsl(var(--glow-warning)/0.3)]'
                    }`}
                  >
                    <f.icon className={`w-5 h-5
                      ${f.color === 'primary' ? 'text-primary' :
                        f.color === 'accent' ? 'text-accent' :
                        f.color === 'glow-success' ? 'text-glow-success' :
                        'text-glow-warning'
                      }`}
                    />
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Package preview — terminal style */}
        <section className="px-8 pb-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto"
          >
            <div className="glass-strong rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-card/60">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-glow-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-glow-success/60" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-[11px] font-mono text-muted-foreground/60">meu-aios/</span>
                </div>
                <Terminal className="w-3.5 h-3.5 text-muted-foreground/40" />
              </div>
              <div className="p-6">
                <pre className="text-xs font-mono leading-[1.8] text-muted-foreground">
                  <span className="text-primary">meu-aios/</span>{'\n'}
                  <span className="text-yellow-400">├──</span> aios.config.yaml       <span className="text-muted-foreground/40"># Configuracao principal</span>{'\n'}
                  <span className="text-yellow-400">├──</span> CLAUDE.md               <span className="text-muted-foreground/40"># Documentacao para IA</span>{'\n'}
                  <span className="text-yellow-400">├──</span> package.json            <span className="text-muted-foreground/40"># Dependencias Node.js</span>{'\n'}
                  <span className="text-yellow-400">├──</span> Dockerfile              <span className="text-muted-foreground/40"># Container Docker</span>{'\n'}
                  <span className="text-cyan-400">├── src/</span>{'\n'}
                  <span className="text-yellow-400">│   ├──</span> main.ts             <span className="text-muted-foreground/40"># Entry point</span>{'\n'}
                  <span className="text-yellow-400">│   ├──</span> orchestrator.ts     <span className="text-muted-foreground/40"># Motor de orquestracao</span>{'\n'}
                  <span className="text-yellow-400">│   └──</span> agent-runner.ts     <span className="text-muted-foreground/40"># Executor de agentes</span>{'\n'}
                  <span className="text-green-400">├── agents/</span>                 <span className="text-muted-foreground/40"># Definicoes de agentes</span>{'\n'}
                  <span className="text-accent">├── squads/</span>                 <span className="text-muted-foreground/40"># Manifests de squads</span>{'\n'}
                  <span className="text-orange-400">├── docs/</span>{'\n'}
                  <span className="text-yellow-400">│   ├──</span> manual.md           <span className="text-muted-foreground/40"># Manual de instalacao</span>{'\n'}
                  <span className="text-yellow-400">│   └──</span> architecture.md     <span className="text-muted-foreground/40"># Documentacao tecnica</span>{'\n'}
                  <span className="text-yellow-400">└──</span> scripts/setup.sh        <span className="text-muted-foreground/40"># Script de setup</span>
                </pre>
              </div>
            </div>
          </motion.div>
        </section>

        {/* CTA final */}
        <section className="px-8 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="glass-strong rounded-3xl p-12 relative overflow-hidden">
              <div className="gradient-mesh absolute inset-0 pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-3">Pronto para comecar?</h3>
                <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
                  Crie seu primeiro sistema de agentes IA orquestrados em poucos minutos.
                </p>
                <Button
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="gap-2 px-10 h-13 text-base font-semibold shadow-[var(--shadow-glow)] rounded-xl"
                >
                  Comecar agora <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/30 py-8 px-8">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-primary/50" />
              <span className="text-xs text-muted-foreground/60 font-medium">AIOS Forge</span>
            </div>
            <p className="text-[11px] text-muted-foreground/40">
              Construa sistemas de agentes IA orquestrados
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
