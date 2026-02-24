import { create } from 'zustand';
import { WizardStep, AiosAgent, AiosSquad, AiosProject, ChatMessage, WIZARD_STEPS, OrchestrationPatternType } from '@/types/aios';

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
  /** When editing a saved project, holds the Supabase project ID */
  editingProjectId: string | null;

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
  /** Load a saved project from Supabase data into the wizard for editing */
  loadProject: (data: {
    projectId: string;
    project: any;
    agents: any[];
    squads: any[];
  }) => void;
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
  editingProjectId: null as string | null,
};

export const useWizardStore = create<WizardState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const state = get();
    if (!state.canProceed()) return;
    const idx = state.getStepIndex();
    if (idx < WIZARD_STEPS.length - 1) {
      set({ currentStep: WIZARD_STEPS[idx + 1].key });
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
  loadProject: ({ projectId, project: p, agents: dbAgents, squads: dbSquads }) => {
    // Map DB rows (snake_case) → store types (camelCase)
    const agents: AiosAgent[] = dbAgents.map((a: any) => ({
      id: a.id,
      slug: a.slug,
      name: a.name,
      role: a.role,
      systemPrompt: a.system_prompt || '',
      llmModel: a.llm_model || 'google/gemini-3-flash-preview',
      commands: a.commands || [],
      tools: a.tools || [],
      skills: a.skills || [],
      visibility: a.visibility || 'full',
      isCustom: a.is_custom || false,
      category: undefined, // not stored in DB, will be inferred from native agents
    }));

    const squads: AiosSquad[] = dbSquads.map((s: any) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description || '',
      agentIds: s.agent_ids || [],
      tasks: s.tasks || [],
      workflows: s.workflows || [],
      manifestYaml: s.manifest_yaml || '',
      isValidated: s.is_validated || false,
    }));

    set({
      editingProjectId: projectId,
      currentStep: 'review',
      project: {
        id: p.id,
        name: p.name || '',
        description: p.description || '',
        domain: p.domain || 'software',
        orchestrationPattern: (p.orchestration_pattern || 'TASK_FIRST') as OrchestrationPatternType,
        config: p.config || {},
      },
      agents,
      squads,
      messages: [],
      complianceResults: {},
      complianceReviewed: false,
    });
  },

  reset: () => set(initialState),
  getStepIndex: () => WIZARD_STEPS.findIndex(s => s.key === get().currentStep),

  canProceed: () => {
    const { currentStep, project, agents } = get();
    switch (currentStep) {
      case 'welcome': return true;
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
