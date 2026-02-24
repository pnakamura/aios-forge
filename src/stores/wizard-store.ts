import { create } from 'zustand';
import { WizardStep, AiosAgent, AiosSquad, AiosProject, ChatMessage, WIZARD_STEPS } from '@/types/aios';

// ── Transition messages injected when the user advances to a new step ──

function getTransitionMessage(step: WizardStep, state: { project: Partial<AiosProject>; agents: AiosAgent[]; squads: AiosSquad[] }): string | null {
  const patternName = (state.project.orchestrationPattern || 'TASK_FIRST').replace(/_/g, ' ');
  switch (step) {
    case 'context_analysis':
      return [
        '### Fase: Analise de Contexto',
        '',
        'Com base no que voce descreveu, vou analisar o contexto e sugerir a melhor configuracao para o seu AIOS.',
        '',
        '**Nesta fase vamos definir:**',
        '- Dominio mais adequado para o projeto',
        '- Padrao de orquestracao ideal',
        '- Tipos de agentes recomendados',
        '',
        'Me pergunte sobre padroes, agentes ou estrategias. Quando tiver clareza, clique em **Proximo** para configurar o projeto.',
        '',
        '*Acompanhe no painel a direita a evolucao dos arquivos do sistema.*',
      ].join('\n');
    case 'agents':
      return [
        '### Fase: Selecao de Agentes',
        '',
        `Agora vamos montar o time de agentes! No **painel a direita** esta o catalogo com agentes nativos.`,
        '',
        '**O que fazer:**',
        `1. Veja os agentes recomendados para o padrao **${patternName}**`,
        '2. Clique em **Adicionar todos** para os recomendados ou selecione individualmente',
        '3. Me peca para criar agentes customizados se precisar',
        '',
        'Cada agente adicionado gera automaticamente: `agents/<nome>.yaml` e `agents/<nome>.md`',
        '',
        '*Adicione pelo menos 1 agente para prosseguir.*',
      ].join('\n');
    case 'squads':
      return [
        '### Fase: Montagem de Squads',
        '',
        `Seus **${state.agents.length} agentes** estao selecionados! Agora vamos organiza-los em equipes.`,
        '',
        '**No painel a direita**, crie squads e atribua agentes. Cada squad gera:',
        '- `squads/<nome>/squad.yaml` — manifesto do squad',
        '- `squads/<nome>/README.md` — documentacao',
        '',
        'Me peca sugestoes de como organizar os squads.',
        '',
        '*Esta etapa e opcional — avance quando desejar.*',
      ].join('\n');
    default:
      return null;
  }
}

interface WizardState {
  currentStep: WizardStep;
  project: Partial<AiosProject>;
  agents: AiosAgent[];
  squads: AiosSquad[];
  messages: ChatMessage[];
  sessionId: string | null;
  isLoading: boolean;
  complianceResults: Record<string, { status: string; notes: string }>;
  complianceReviewed: boolean;

  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateProject: (data: Partial<AiosProject>) => void;
  addAgent: (agent: AiosAgent) => void;
  removeAgent: (slug: string) => void;
  updateAgent: (slug: string, data: Partial<AiosAgent>) => void;
  addAgent_batch: (agents: AiosAgent[]) => void;
  addSquad: (squad: AiosSquad) => void;
  removeSquad: (slug: string) => void;
  updateSquad: (slug: string, data: Partial<AiosSquad>) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setSessionId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setComplianceResults: (results: Record<string, { status: string; notes: string }>) => void;
  reset: () => void;
  getStepIndex: () => number;
  canProceed: () => boolean;
  getValidationMessage: () => string | null;
}

const initialState = {
  currentStep: 'welcome' as WizardStep,
  project: { name: '', description: '', domain: 'software', orchestrationPattern: 'TASK_FIRST' as const },
  agents: [] as AiosAgent[],
  squads: [] as AiosSquad[],
  messages: [] as ChatMessage[],
  sessionId: null as string | null,
  isLoading: false,
  complianceResults: {} as Record<string, { status: string; notes: string }>,
  complianceReviewed: false,
};

export const useWizardStore = create<WizardState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const state = get();
    if (!state.canProceed()) return;
    const idx = state.getStepIndex();
    if (idx < WIZARD_STEPS.length - 1) {
      const newStep = WIZARD_STEPS[idx + 1].key;
      const transitionMsg = getTransitionMessage(newStep, state);
      const updates: Partial<WizardState> = { currentStep: newStep };
      if (transitionMsg) {
        updates.messages = [...state.messages, { role: 'assistant' as const, content: transitionMsg }];
      }
      set(updates);
    }
  },

  prevStep: () => {
    const idx = get().getStepIndex();
    if (idx > 0) {
      set({ currentStep: WIZARD_STEPS[idx - 1].key });
    }
  },

  updateProject: (data) => set((s) => ({ project: { ...s.project, ...data } })),

  addAgent: (agent) => set((s) => ({
    agents: [...s.agents.filter(a => a.slug !== agent.slug), agent],
  })),

  removeAgent: (slug) => set((s) => ({
    agents: s.agents.filter(a => a.slug !== slug),
    // Also remove from squads
    squads: s.squads.map(sq => ({
      ...sq,
      agentIds: sq.agentIds.filter(id => id !== slug),
    })),
  })),

  updateAgent: (slug, data) => set((s) => ({
    agents: s.agents.map(a => a.slug === slug ? { ...a, ...data } : a),
  })),

  addAgent_batch: (agents) => set((s) => {
    const existing = new Set(s.agents.map(a => a.slug));
    const newAgents = agents.filter(a => !existing.has(a.slug));
    return { agents: [...s.agents, ...newAgents] };
  }),

  addSquad: (squad) => set((s) => ({
    squads: [...s.squads.filter(sq => sq.slug !== squad.slug), squad],
  })),

  removeSquad: (slug) => set((s) => ({
    squads: s.squads.filter(sq => sq.slug !== slug),
  })),

  updateSquad: (slug, data) => set((s) => ({
    squads: s.squads.map(sq => sq.slug === slug ? { ...sq, ...data } : sq),
  })),

  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setSessionId: (id) => set({ sessionId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setComplianceResults: (results) => set({ complianceResults: results, complianceReviewed: true }),
  reset: () => set(initialState),
  getStepIndex: () => WIZARD_STEPS.findIndex(s => s.key === get().currentStep),

  canProceed: () => {
    const { currentStep, project, agents } = get();
    switch (currentStep) {
      case 'welcome': return true;
      case 'context_analysis': return true;
      case 'project_config': return !!(project.name && project.name.trim().length > 0);
      case 'agents': return agents.length > 0;
      case 'squads': return true;
      case 'integrations': return true;
      case 'review': return true;
      default: return false;
    }
  },

  getValidationMessage: () => {
    const { currentStep, project, agents } = get();
    switch (currentStep) {
      case 'project_config':
        if (!project.name || project.name.trim().length === 0) return 'Defina um nome para o projeto';
        return null;
      case 'agents':
        if (agents.length === 0) return 'Adicione pelo menos um agente';
        return null;
      default:
        return null;
    }
  },
}));
