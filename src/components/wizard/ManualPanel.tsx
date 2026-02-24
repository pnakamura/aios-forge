import { useWizardStore } from '@/stores/wizard-store';
import { ORCHESTRATION_PATTERNS } from '@/data/orchestration-patterns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, Circle, AlertCircle,
  Terminal, Settings, Bot, Users, Network,
  Package, Play, FileText, Wrench, BookOpen, Download, ArrowRight,
} from 'lucide-react';

type CheckStatus = 'done' | 'partial' | 'pending';

function StatusIcon({ status }: { status: CheckStatus }) {
  switch (status) {
    case 'done': return <CheckCircle2 className="w-3.5 h-3.5 text-glow-success shrink-0" />;
    case 'partial': return <AlertCircle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
    case 'pending': return <Circle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />;
  }
}

export function ManualPanel() {
  const store = useWizardStore();
  const { project, agents, squads } = store;
  const patternInfo = ORCHESTRATION_PATTERNS.find(p => p.id === project.orchestrationPattern);

  // Compute checklist statuses
  const hasName: CheckStatus = project.name ? 'done' : 'pending';
  const hasPattern: CheckStatus = project.orchestrationPattern ? 'done' : 'pending';
  const hasAgents: CheckStatus = agents.length >= 2 ? 'done' : agents.length > 0 ? 'partial' : 'pending';
  const hasSquads: CheckStatus = squads.length > 0 ? 'done' : 'pending';
  const hasAssignments: CheckStatus = squads.length > 0 && squads.every(s => (s.agentIds || []).length > 0) ? 'done'
    : squads.some(s => (s.agentIds || []).length > 0) ? 'partial' : 'pending';

  const llmModels = [...new Set(agents.map(a => a.llmModel))];
  const usesOpenAI = agents.some(a => a.llmModel.includes('gpt') || a.llmModel.includes('openai'));
  const usesClaude = agents.some(a => a.llmModel.includes('claude') || a.llmModel.includes('anthropic'));
  const usesGemini = agents.some(a => a.llmModel.includes('gemini') || a.llmModel.includes('google'));
  const providers = [usesOpenAI && 'OpenAI', usesClaude && 'Anthropic', usesGemini && 'Google'].filter(Boolean);

  const allDone = hasName === 'done' && hasPattern === 'done' && hasAgents === 'done';

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 bg-card/30 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Guia de Instalacao</h3>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Resumo em tempo real do seu AIOS. O manual completo esta em <code className="px-1 py-0.5 rounded bg-muted text-[10px]">docs/manual.md</code>
        </p>
      </div>

      <div className="p-4 space-y-5">
        {/* Checklist */}
        <section>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Settings className="w-3 h-3" /> Checklist de Configuracao
          </h4>
          <div className="space-y-1.5">
            {([
              [hasName, 'Nome do projeto definido', project.name || '—'],
              [hasPattern, 'Padrao de orquestracao', patternInfo?.name || '—'],
              [hasAgents, `Agentes configurados (${agents.length})`, agents.length >= 2 ? 'Pronto' : 'Minimo 2'],
              [hasSquads, `Squads criados (${squads.length})`, squads.length > 0 ? 'Pronto' : 'Opcional'],
              [hasAssignments, 'Agentes atribuidos aos squads', hasAssignments === 'done' ? 'Pronto' : hasAssignments === 'partial' ? 'Parcial' : 'Pendente'],
            ] as [CheckStatus, string, string][]).map(([status, label, detail], i) => (
              <div key={i} className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors',
                status === 'done' ? 'bg-glow-success/5' : status === 'partial' ? 'bg-yellow-400/5' : 'bg-card/30'
              )}>
                <StatusIcon status={status} />
                <span className="flex-1">{label}</span>
                <span className={cn(
                  'text-[10px]',
                  status === 'done' ? 'text-glow-success' : status === 'partial' ? 'text-yellow-400' : 'text-muted-foreground/50'
                )}>{detail}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Install Steps */}
        <section>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Terminal className="w-3 h-3" /> Instalacao Rapida
          </h4>
          <div className="rounded-lg border border-border/50 bg-card/40 p-3 space-y-2 font-mono text-[11px]">
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold shrink-0">1.</span>
              <div>
                <code className="text-cyan-400">bash scripts/setup.sh</code>
                <p className="text-muted-foreground font-sans mt-0.5">Setup automatico completo</p>
              </div>
            </div>
            <div className="border-t border-border/30 pt-2 text-muted-foreground/60 font-sans text-[10px]">ou manualmente:</div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold shrink-0">1.</span>
              <code>npm install</code>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold shrink-0">2.</span>
              <code>cp .env.example .env</code>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold shrink-0">3.</span>
              <div>
                <code className="text-yellow-300">Editar .env</code>
                <p className="text-muted-foreground font-sans mt-0.5">
                  {providers.length > 0
                    ? `Configurar: ${providers.join(', ')}`
                    : 'Configurar API keys de LLM'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold shrink-0">4.</span>
              <code>npm run dev</code>
            </div>
          </div>
        </section>

        {/* Architecture Summary */}
        <section>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Network className="w-3 h-3" /> Arquitetura
          </h4>
          <div className="rounded-lg border border-border/50 bg-card/40 p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <Badge className="text-[10px] gap-1">
                <Network className="w-3 h-3" /> {patternInfo?.name || project.orchestrationPattern || '—'}
              </Badge>
            </div>
            {patternInfo && (
              <p className="text-[11px] text-muted-foreground">{patternInfo.description}</p>
            )}

            {agents.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground/60 font-semibold">Agentes:</p>
                {agents.map(a => (
                  <div key={a.slug} className="flex items-center gap-2 text-[11px]">
                    <Bot className="w-3 h-3 text-primary shrink-0" />
                    <span className="flex-1 truncate">{a.name}</span>
                    <code className="text-[9px] text-muted-foreground/50">{a.llmModel.split('/').pop()}</code>
                  </div>
                ))}
              </div>
            )}

            {squads.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground/60 font-semibold">Squads:</p>
                {squads.map(s => (
                  <div key={s.slug} className="flex items-center gap-2 text-[11px]">
                    <Users className="w-3 h-3 text-accent shrink-0" />
                    <span className="flex-1 truncate">{s.name}</span>
                    <span className="text-[9px] text-muted-foreground/50">{(s.agentIds || []).length} agentes</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Key Files Reference */}
        <section>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <FileText className="w-3 h-3" /> Arquivos-Chave
          </h4>
          <div className="space-y-1">
            {[
              ['aios.config.yaml', 'Configuracao central'],
              ['CLAUDE.md', 'Documentacao para IA'],
              ['docs/manual.md', 'Manual completo'],
              ['.env.example', 'Template de ambiente'],
              ['src/main.ts', 'Entry point'],
              ['src/orchestrator.ts', 'Motor de orquestracao'],
              ['src/agent-runner.ts', 'Executor de agentes'],
            ].map(([file, desc]) => (
              <div key={file} className="flex items-center gap-2 text-[11px] px-2 py-1 rounded hover:bg-secondary/30 transition-colors">
                <code className="text-cyan-400 shrink-0 w-36 truncate">{file}</code>
                <span className="text-muted-foreground text-[10px] truncate">{desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Runtime requirements */}
        <section>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Wrench className="w-3 h-3" /> Pre-requisitos
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              ['Node.js', '>= 20'],
              ['TypeScript', '5.x'],
              ['Docker', 'opcional'],
              ...(providers.length > 0 ? providers.map(p => [`${p} Key`, 'obrigatoria']) : [['API Key', 'obrigatoria']]),
            ].map(([name, ver]) => (
              <div key={name} className="flex items-center justify-between px-2.5 py-1.5 rounded bg-card/40 border border-border/30 text-[11px]">
                <span>{name}</span>
                <span className="text-muted-foreground text-[10px]">{ver}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Ready indicator / Action */}
        {allDone ? (
          <div className="space-y-2">
            <div className="rounded-lg p-3 border border-glow-success/30 bg-glow-success/5 text-center">
              <div className="flex items-center justify-center gap-2 text-glow-success text-xs font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Pacote pronto para gerar e instalar
              </div>
            </div>
            {store.currentStep !== 'generation' ? (
              <Button
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                size="sm"
                onClick={() => store.setStep('generation')}
              >
                <ArrowRight className="w-3.5 h-3.5" />
                Ir para Geracao do Pacote
              </Button>
            ) : (
              <Button
                className="w-full gap-2 bg-glow-success/90 hover:bg-glow-success text-white"
                size="sm"
                onClick={() => {
                  const btn = document.querySelector('[data-download-zip]') as HTMLButtonElement;
                  if (btn) btn.click();
                }}
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Pacote ZIP
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg p-3 border border-border/50 bg-card/30 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
              <Play className="w-4 h-4" />
              Complete as etapas para gerar o pacote
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
