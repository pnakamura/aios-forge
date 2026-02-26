import { create } from 'zustand';
import { ProjectWorkflow, WorkflowStep, WorkflowTrigger, AiosAgent, AiosSquad, OrchestrationPatternType } from '@/types/aios';

interface WorkflowState {
  workflows: ProjectWorkflow[];

  addWorkflow: (workflow: ProjectWorkflow) => void;
  removeWorkflow: (id: string) => void;
  updateWorkflow: (id: string, data: Partial<ProjectWorkflow>) => void;
  addWorkflowStep: (workflowId: string, step: WorkflowStep) => void;
  removeWorkflowStep: (workflowId: string, stepId: string) => void;
  updateWorkflowStep: (workflowId: string, stepId: string, data: Partial<WorkflowStep>) => void;
  setWorkflows: (workflows: ProjectWorkflow[]) => void;
  autoGenerateWorkflows: (pattern: OrchestrationPatternType, agents: AiosAgent[], squads: AiosSquad[]) => void;
  reset: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  workflows: [],

  addWorkflow: (workflow) => set((s) => ({
    workflows: [...s.workflows.filter(w => w.id !== workflow.id), workflow],
  })),

  removeWorkflow: (id) => set((s) => ({
    workflows: s.workflows.filter(w => w.id !== id),
  })),

  updateWorkflow: (id, data) => set((s) => ({
    workflows: s.workflows.map(w => w.id === id ? { ...w, ...data } : w),
  })),

  addWorkflowStep: (workflowId, step) => set((s) => ({
    workflows: s.workflows.map(w =>
      w.id === workflowId ? { ...w, steps: [...w.steps, step] } : w
    ),
  })),

  removeWorkflowStep: (workflowId, stepId) => set((s) => ({
    workflows: s.workflows.map(w =>
      w.id === workflowId ? { ...w, steps: w.steps.filter(st => st.id !== stepId) } : w
    ),
  })),

  updateWorkflowStep: (workflowId, stepId, data) => set((s) => ({
    workflows: s.workflows.map(w =>
      w.id === workflowId
        ? { ...w, steps: w.steps.map(st => st.id === stepId ? { ...st, ...data } : st) }
        : w
    ),
  })),

  setWorkflows: (workflows) => set({ workflows }),

  autoGenerateWorkflows: (pattern, agents, squads) => {
    const workflows = generateDefaultWorkflows(pattern, agents, squads);
    set({ workflows });
  },

  reset: () => set({ workflows: [] }),
}));

// ── Auto-generation logic per orchestration pattern ──

function generateDefaultWorkflows(
  pattern: OrchestrationPatternType,
  agents: AiosAgent[],
  squads: AiosSquad[],
): ProjectWorkflow[] {
  if (agents.length === 0) return [];

  switch (pattern) {
    case 'SEQUENTIAL_PIPELINE':
      return [createSequentialWorkflow(agents)];
    case 'PARALLEL_SWARM':
      return [createParallelWorkflow(agents)];
    case 'HIERARCHICAL':
      return [createHierarchicalWorkflow(agents)];
    case 'WATCHDOG':
      return [createWatchdogWorkflow(agents)];
    case 'COLLABORATIVE':
      return [createCollaborativeWorkflow(agents)];
    case 'TASK_FIRST':
      return createTaskFirstWorkflows(agents, squads);
    default:
      return [];
  }
}

function createSequentialWorkflow(agents: AiosAgent[]): ProjectWorkflow {
  const steps: WorkflowStep[] = agents.map((agent, i) => ({
    id: crypto.randomUUID(),
    name: `Etapa ${i + 1}: ${agent.name}`,
    agentSlug: agent.slug,
    dependsOn: i > 0 ? [agents[i - 1].slug] : [],
  }));
  // Wire dependsOn to previous step IDs
  for (let i = 1; i < steps.length; i++) {
    steps[i].dependsOn = [steps[i - 1].id];
  }
  return {
    id: crypto.randomUUID(),
    name: 'Pipeline Sequencial',
    slug: 'pipeline-sequencial',
    description: 'Execucao linear: cada agente processa apos o anterior',
    trigger: 'manual',
    steps,
  };
}

function createParallelWorkflow(agents: AiosAgent[]): ProjectWorkflow {
  return {
    id: crypto.randomUUID(),
    name: 'Enxame Paralelo',
    slug: 'enxame-paralelo',
    description: 'Todos os agentes executam simultaneamente sem dependencias',
    trigger: 'manual',
    steps: agents.map((agent, i) => ({
      id: crypto.randomUUID(),
      name: `Worker ${i + 1}: ${agent.name}`,
      agentSlug: agent.slug,
      dependsOn: [],
    })),
  };
}

function createHierarchicalWorkflow(agents: AiosAgent[]): ProjectWorkflow {
  const master = agents.find(a => a.slug === 'aios-master') || agents[0];
  const workers = agents.filter(a => a.slug !== master.slug);
  const masterStep: WorkflowStep = {
    id: crypto.randomUUID(),
    name: `Master: ${master.name}`,
    agentSlug: master.slug,
    dependsOn: [],
  };
  const workerSteps: WorkflowStep[] = workers.map((w) => ({
    id: crypto.randomUUID(),
    name: `Worker: ${w.name}`,
    agentSlug: w.slug,
    dependsOn: [masterStep.id],
  }));
  return {
    id: crypto.randomUUID(),
    name: 'Hierarquia Master-Workers',
    slug: 'hierarquia-master-workers',
    description: 'Master planeja, workers executam em paralelo',
    trigger: 'manual',
    steps: [masterStep, ...workerSteps],
  };
}

function createWatchdogWorkflow(agents: AiosAgent[]): ProjectWorkflow {
  const supervisor = agents.find(a => a.slug === 'aios-master') || agents[agents.length - 1];
  const workers = agents.filter(a => a.slug !== supervisor.slug);
  const workerSteps: WorkflowStep[] = workers.map((w) => ({
    id: crypto.randomUUID(),
    name: `Worker: ${w.name}`,
    agentSlug: w.slug,
    dependsOn: [],
  }));
  const reviewStep: WorkflowStep = {
    id: crypto.randomUUID(),
    name: `Supervisao: ${supervisor.name}`,
    agentSlug: supervisor.slug,
    dependsOn: workerSteps.map(s => s.id),
  };
  return {
    id: crypto.randomUUID(),
    name: 'Watchdog',
    slug: 'watchdog',
    description: 'Workers em paralelo, seguidos de revisao pelo supervisor',
    trigger: 'manual',
    steps: [...workerSteps, reviewStep],
  };
}

function createCollaborativeWorkflow(agents: AiosAgent[]): ProjectWorkflow {
  const steps: WorkflowStep[] = [];
  const rounds = 2;
  for (let round = 0; round < rounds; round++) {
    agents.forEach((agent) => {
      const step: WorkflowStep = {
        id: crypto.randomUUID(),
        name: `Round ${round + 1}: ${agent.name}`,
        agentSlug: agent.slug,
        dependsOn: steps.length > 0 ? [steps[steps.length - 1].id] : [],
      };
      steps.push(step);
    });
  }
  return {
    id: crypto.randomUUID(),
    name: 'Colaborativo',
    slug: 'colaborativo',
    description: `${rounds} rounds de iteracao entre todos os agentes`,
    trigger: 'manual',
    steps,
  };
}

function createTaskFirstWorkflows(agents: AiosAgent[], squads: AiosSquad[]): ProjectWorkflow[] {
  if (squads.length === 0) {
    // Fallback: one workflow with all agents
    return [createParallelWorkflow(agents)];
  }
  return squads.map((squad) => {
    const squadAgents = squad.agentIds
      .map(id => agents.find(a => a.slug === id))
      .filter(Boolean) as AiosAgent[];
    const steps: WorkflowStep[] = squad.tasks.length > 0
      ? squad.tasks.map((task) => ({
          id: crypto.randomUUID(),
          name: task.name,
          agentSlug: task.agentSlug,
          taskId: task.id,
          dependsOn: [],
        }))
      : squadAgents.map((agent) => ({
          id: crypto.randomUUID(),
          name: `${agent.name}`,
          agentSlug: agent.slug,
          dependsOn: [],
        }));
    return {
      id: crypto.randomUUID(),
      name: `Workflow: ${squad.name}`,
      slug: `workflow-${squad.slug}`,
      description: `Workflow baseado nas tasks do squad ${squad.name}`,
      trigger: 'on_task' as WorkflowTrigger,
      steps,
      squadSlug: squad.slug,
    };
  });
}
