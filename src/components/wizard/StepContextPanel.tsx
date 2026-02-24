import { useWizardStore } from '@/stores/wizard-store';
import { WizardStep } from '@/types/aios';
import { cn } from '@/lib/utils';
import {
  Check, Circle, FileText, MessageSquare, Settings, Bot,
  Users, Network, Shield, Package, ChevronDown, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

// ── Step metadata: what each phase collects and where it goes ──

interface StepChecklistItem {
  id: string;
  label: string;
  /** Which generated files this piece of data feeds into */
  targetFiles: string[];
  /** Function to determine if this item is fulfilled */
  check: (state: ReturnType<typeof useWizardStore.getState>) => boolean;
}

interface StepMeta {
  key: WizardStep;
  phase: string;
  phaseGroup: 'Descoberta' | 'Configuracao' | 'Construcao' | 'Finalizacao';
  title: string;
  objective: string;
  description: string;
  checklist: StepChecklistItem[];
  criteriaToAdvance: string;
}

const STEP_META: StepMeta[] = [
  {
    key: 'welcome',
    phase: '1 de 8',
    phaseGroup: 'Descoberta',
    title: 'Boas-vindas',
    objective: 'Entender o contexto geral do projeto',
    description: 'Converse com o assistente para descrever seu projeto, seus objetivos e o tipo de sistema que deseja construir.',
    checklist: [
      {
        id: 'w-conversation',
        label: 'Iniciar conversa com o assistente',
        targetFiles: [],
        check: (s) => s.messages.length > 0,
      },
    ],
    criteriaToAdvance: 'Descreva seu projeto ao assistente e avance quando estiver pronto.',
  },
  {
    key: 'context_analysis',
    phase: '2 de 8',
    phaseGroup: 'Descoberta',
    title: 'Analise de Contexto',
    objective: 'Refinar requisitos e receber sugestoes',
    description: 'O assistente analisa o que voce descreveu e sugere o melhor padrao de orquestracao, agentes e dominio.',
    checklist: [
      {
        id: 'ca-domain',
        label: 'Dominio do projeto identificado',
        targetFiles: ['aios.config.yaml', 'README.md'],
        check: (s) => !!s.project.domain && s.project.domain !== 'software',
      },
      {
        id: 'ca-pattern-discussed',
        label: 'Padrao de orquestracao discutido',
        targetFiles: ['aios.config.yaml', 'src/orchestrator.ts'],
        check: (s) => s.messages.length >= 2,
      },
    ],
    criteriaToAdvance: 'Discuta com o assistente ate ter clareza sobre dominio e abordagem.',
  },
  {
    key: 'project_config',
    phase: '3 de 8',
    phaseGroup: 'Configuracao',
    title: 'Configuracao do Projeto',
    objective: 'Definir identidade e arquitetura base',
    description: 'Preencha nome, descricao, dominio e escolha o padrao de orquestracao que define como os agentes se comunicam.',
    checklist: [
      {
        id: 'pc-name',
        label: 'Nome do projeto definido',
        targetFiles: ['aios.config.yaml', 'package.json', 'README.md', 'src/main.ts'],
        check: (s) => !!(s.project.name && s.project.name.trim().length > 0),
      },
      {
        id: 'pc-description',
        label: 'Descricao do projeto',
        targetFiles: ['aios.config.yaml', 'README.md'],
        check: (s) => !!(s.project.description && s.project.description.trim().length > 0),
      },
      {
        id: 'pc-domain',
        label: 'Dominio selecionado',
        targetFiles: ['aios.config.yaml', 'README.md'],
        check: (s) => !!s.project.domain,
      },
      {
        id: 'pc-pattern',
        label: 'Padrao de orquestracao escolhido',
        targetFiles: ['aios.config.yaml', 'src/orchestrator.ts', 'src/main.ts', 'docs/architecture.md'],
        check: (s) => !!s.project.orchestrationPattern,
      },
    ],
    criteriaToAdvance: 'Preencha pelo menos o nome do projeto (obrigatorio).',
  },
  {
    key: 'agents',
    phase: '4 de 8',
    phaseGroup: 'Construcao',
    title: 'Selecao de Agentes',
    objective: 'Montar o time de agentes IA',
    description: 'Selecione agentes nativos ou crie customizados. Cada agente tera seu arquivo de definicao e configuracao no pacote.',
    checklist: [
      {
        id: 'ag-at-least-one',
        label: 'Pelo menos 1 agente adicionado',
        targetFiles: ['aios.config.yaml', 'agents/*.md', 'agents/*.yaml', 'src/main.ts'],
        check: (s) => s.agents.length > 0,
      },
      {
        id: 'ag-meta',
        label: 'Agente orquestrador (Meta) incluido',
        targetFiles: ['src/orchestrator.ts', 'agents/*.yaml'],
        check: (s) => s.agents.some(a => a.category === 'Meta'),
      },
      {
        id: 'ag-dev',
        label: 'Agente de execucao incluido',
        targetFiles: ['agents/*.yaml', 'agents/*.md'],
        check: (s) => s.agents.some(a => a.category === 'Desenvolvimento'),
      },
    ],
    criteriaToAdvance: 'Adicione pelo menos um agente ao projeto.',
  },
  {
    key: 'squads',
    phase: '5 de 8',
    phaseGroup: 'Construcao',
    title: 'Montagem de Squads',
    objective: 'Agrupar agentes em equipes com responsabilidades',
    description: 'Crie squads para organizar seus agentes em equipes, defina tasks e workflows de execucao.',
    checklist: [
      {
        id: 'sq-created',
        label: 'Pelo menos 1 squad criado',
        targetFiles: ['aios.config.yaml', 'squads/*/squad.yaml', 'squads/*/README.md'],
        check: (s) => s.squads.length > 0,
      },
      {
        id: 'sq-with-agents',
        label: 'Squad com agentes atribuidos',
        targetFiles: ['squads/*/squad.yaml'],
        check: (s) => s.squads.some(sq => sq.agentIds.length > 0),
      },
      {
        id: 'sq-tasks',
        label: 'Tasks definidas em algum squad',
        targetFiles: ['squads/*/squad.yaml'],
        check: (s) => s.squads.some(sq => sq.tasks.length > 0),
      },
    ],
    criteriaToAdvance: 'Opcional — avance quando desejar. Squads podem ser configurados depois.',
  },
  {
    key: 'integrations',
    phase: '6 de 8',
    phaseGroup: 'Construcao',
    title: 'Integracoes',
    objective: 'Mapear servicos e APIs externas',
    description: 'Revise as integracoes necessarias. APIs de LLM sao detectadas automaticamente pelos modelos dos agentes.',
    checklist: [
      {
        id: 'int-llm',
        label: 'API de LLM identificada',
        targetFiles: ['.env.example', 'src/agent-runner.ts', 'package.json'],
        check: (s) => s.agents.length > 0,
      },
    ],
    criteriaToAdvance: 'Revise as integracoes e avance.',
  },
  {
    key: 'review',
    phase: '7 de 8',
    phaseGroup: 'Finalizacao',
    title: 'Revisao',
    objective: 'Validar a configuracao antes de gerar',
    description: 'Revise todos os dados coletados e execute a validacao de conformidade AIOS nos arquivos.',
    checklist: [
      {
        id: 'rv-compliance',
        label: 'Revisao de conformidade executada',
        targetFiles: [],
        check: (s) => s.complianceReviewed,
      },
    ],
    criteriaToAdvance: 'Recomenda-se executar a revisao de conformidade antes de gerar.',
  },
  {
    key: 'generation',
    phase: '8 de 8',
    phaseGroup: 'Finalizacao',
    title: 'Geracao',
    objective: 'Exportar o pacote AIOS completo',
    description: 'Seu pacote esta pronto. Salve no banco de dados ou baixe o ZIP com todos os arquivos.',
    checklist: [],
    criteriaToAdvance: '',
  },
];

export function StepContextPanel() {
  const store = useWizardStore();
  const [expanded, setExpanded] = useState(true);

  const meta = STEP_META.find(m => m.key === store.currentStep) || STEP_META[0];
  const completedItems = meta.checklist.filter(item => item.check(store));
  const totalItems = meta.checklist.length;
  const progressPct = totalItems > 0 ? Math.round((completedItems.length / totalItems) * 100) : 100;

  // Collect unique target files for this step
  const allTargetFiles = [...new Set(meta.checklist.flatMap(c => c.targetFiles))].sort();

  return (
    <div className="border-b border-border/50 bg-card/20 shrink-0">
      {/* Compact header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/20 transition-colors"
      >
        {/* Phase group badge */}
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] shrink-0 font-semibold',
            meta.phaseGroup === 'Descoberta' && 'border-accent/40 text-accent',
            meta.phaseGroup === 'Configuracao' && 'border-primary/40 text-primary',
            meta.phaseGroup === 'Construcao' && 'border-glow-success/40 text-glow-success',
            meta.phaseGroup === 'Finalizacao' && 'border-glow-warning/40 text-glow-warning',
          )}
        >
          {meta.phaseGroup}
        </Badge>

        {/* Title and objective */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold truncate">{meta.title}</span>
            <span className="text-[10px] text-muted-foreground">— {meta.objective}</span>
          </div>
        </div>

        {/* Progress indicator */}
        {totalItems > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  progressPct === 100 ? 'bg-glow-success' : 'bg-primary'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className={cn(
              'text-[10px] font-mono w-8 text-right',
              progressPct === 100 ? 'text-glow-success' : 'text-muted-foreground'
            )}>
              {completedItems.length}/{totalItems}
            </span>
          </div>
        )}

        {/* Expand/collapse */}
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-3">
              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">{meta.description}</p>

              {/* Checklist */}
              {meta.checklist.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Informacoes coletadas</p>
                  {meta.checklist.map(item => {
                    const done = item.check(store);
                    return (
                      <div key={item.id} className="flex items-start gap-2 group">
                        <div className={cn(
                          'w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 border transition-all',
                          done
                            ? 'border-glow-success bg-glow-success/20'
                            : 'border-muted-foreground/30 bg-transparent'
                        )}>
                          {done && <Check className="w-2.5 h-2.5 text-glow-success" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            'text-xs',
                            done ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {item.label}
                          </span>
                          {/* Target files */}
                          {item.targetFiles.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-0.5">
                              {item.targetFiles.map(f => (
                                <span
                                  key={f}
                                  className="text-[9px] font-mono px-1 py-0 rounded bg-secondary/50 text-muted-foreground/70"
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Criteria to advance */}
              {meta.criteriaToAdvance && (
                <div className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
                  progressPct === 100
                    ? 'bg-glow-success/5 border border-glow-success/20 text-glow-success'
                    : 'bg-secondary/30 border border-border/30 text-muted-foreground'
                )}>
                  {progressPct === 100 ? (
                    <Check className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>
                    {progressPct === 100 ? 'Pronto para avancar' : meta.criteriaToAdvance}
                  </span>
                </div>
              )}

              {/* Affected files summary */}
              {allTargetFiles.length > 0 && (
                <div className="pt-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Arquivos impactados nesta fase
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {allTargetFiles.map(f => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/5 border border-primary/10 text-primary/80"
                      >
                        <FileText className="w-2.5 h-2.5" />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
