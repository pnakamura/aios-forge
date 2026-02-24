import { create } from 'zustand';
import { WizardStep, AiosAgent, AiosSquad, AiosProject, ChatMessage, WIZARD_STEPS } from '@/types/aios';

interface WizardState {
  currentStep: WizardStep;
  project: Partial<AiosProject>;
  agents: AiosAgent[];
  squads: AiosSquad[];
  messages: ChatMessage[];
  sessionId: string | null;
  isLoading: boolean;

  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateProject: (data: Partial<AiosProject>) => void;
  addAgent: (agent: AiosAgent) => void;
  removeAgent: (slug: string) => void;
  updateAgent: (slug: string, data: Partial<AiosAgent>) => void;
  addSquad: (squad: AiosSquad) => void;
  removeSquad: (slug: string) => void;
  updateSquad: (slug: string, data: Partial<AiosSquad>) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setSessionId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
  getStepIndex: () => number;
  canProceed: () => boolean;
}

const initialState = {
  currentStep: 'welcome' as WizardStep,
  project: { name: '', description: '', domain: 'software', orchestrationPattern: 'TASK_FIRST' as const },
  agents: [],
  squads: [],
  messages: [],
  sessionId: null,
  isLoading: false,
};

export const useWizardStore = create<WizardState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),
  
  nextStep: () => {
    const idx = get().getStepIndex();
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
  addAgent: (agent) => set((s) => ({ agents: [...s.agents.filter(a => a.slug !== agent.slug), agent] })),
  removeAgent: (slug) => set((s) => ({ agents: s.agents.filter(a => a.slug !== slug) })),
  updateAgent: (slug, data) => set((s) => ({
    agents: s.agents.map(a => a.slug === slug ? { ...a, ...data } : a),
  })),
  addSquad: (squad) => set((s) => ({ squads: [...s.squads.filter(sq => sq.slug !== squad.slug), squad] })),
  removeSquad: (slug) => set((s) => ({ squads: s.squads.filter(sq => sq.slug !== slug) })),
  updateSquad: (slug, data) => set((s) => ({
    squads: s.squads.map(sq => sq.slug === slug ? { ...sq, ...data } : sq),
  })),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setSessionId: (id) => set({ sessionId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  reset: () => set(initialState),
  getStepIndex: () => WIZARD_STEPS.findIndex(s => s.key === get().currentStep),
  canProceed: () => {
    const { currentStep, project, agents } = get();
    switch (currentStep) {
      case 'welcome': return true;
      case 'context_analysis': return !!project.domain;
      case 'project_config': return !!project.name;
      case 'agents': return agents.length > 0;
      case 'squads': return true;
      case 'integrations': return true;
      case 'review': return true;
      default: return false;
    }
  },
}));
