/**
 * @agent     AiosTypes
 * @persona   Definicoes de tipos centrais do dominio AIOS
 * @context   Tipos compartilhados: WizardStep, AiosAgent, AiosSquad, AiosProject, GeneratedFile, etc.
 */

export type WizardStep =
  | 'welcome'
  | 'project_config'
  | 'agents'
  | 'squads'
  | 'integrations'
  | 'review'
  | 'generation'
  | 'post_creation';

export const WIZARD_STEPS: { key: WizardStep; label: string; number: number }[] = [
  { key: 'welcome', label: 'Descoberta', number: 1 },
  { key: 'project_config', label: 'Projeto', number: 2 },
  { key: 'agents', label: 'Agentes', number: 3 },
  { key: 'squads', label: 'Squads', number: 4 },
  { key: 'integrations', label: 'Integracoes', number: 5 },
  { key: 'review', label: 'Revisao', number: 6 },
  { key: 'generation', label: 'Geracao', number: 7 },
  { key: 'post_creation', label: 'First-Run', number: 8 },
];

export type OrchestrationPatternType =
  | 'SEQUENTIAL_PIPELINE'
  | 'PARALLEL_SWARM'
  | 'HIERARCHICAL'
  | 'WATCHDOG'
  | 'COLLABORATIVE'
  | 'TASK_FIRST';

export interface OrchestrationPattern {
  id: OrchestrationPatternType;
  name: string;
  description: string;
  useCases: string[];
  suggestedAgents: string[];
  domains: string[];
  icon: string;
}

export type AgentCategory = 'Meta' | 'Planejamento' | 'Desenvolvimento' | 'Infraestrutura';

export interface NativeAgent {
  slug: string;
  name: string;
  category: AgentCategory;
  role: string;
  description: string;
  defaultSystemPrompt: string;
  defaultModel: string;
  defaultCommands: AgentCommand[];
  icon: string;
  compatiblePatterns: OrchestrationPatternType[];
  defaultTools: string[];
  defaultSkills: string[];
}

export interface AgentMemory {
  id: string;
  key: string;
  content: string;
  type: 'short_term' | 'long_term' | 'episodic';
}

export interface AgentCommand {
  name: string;
  description: string;
  visibility: 'public' | 'internal' | 'admin';
  handler: string;
}

export interface AgentDependencies {
  services: string[];
  hooks: string[];
  types: string[];
}

export interface AiosAgent {
  id?: string;
  slug: string;
  name: string;
  role: string;
  systemPrompt: string;
  llmModel: string;
  commands: AgentCommand[];
  tools: string[];
  skills: string[];
  memory: AgentMemory[];
  visibility: 'full' | 'quick' | 'key';
  isCustom: boolean;
  category?: AgentCategory;
  /** File dependencies (services, hooks, types) */
  dependencies?: AgentDependencies;
  /** When to activate this agent — use case description */
  context?: string;
}

/** Normalizes legacy string commands to structured AgentCommand format */
export function normalizeCommands(commands: unknown[]): AgentCommand[] {
  return commands.map(c => {
    if (typeof c === 'string') {
      return { name: c, description: '', visibility: 'public' as const, handler: '' };
    }
    if (c && typeof c === 'object') {
      const obj = c as Record<string, unknown>;
      return {
        name: String(obj.name || ''),
        description: String(obj.description || ''),
        visibility: (obj.visibility as AgentCommand['visibility']) || 'public',
        handler: String(obj.handler || obj.returnType || ''),
      };
    }
    return { name: '', description: '', visibility: 'public' as const, handler: '' };
  });
}

export interface AiosSquad {
  id?: string;
  name: string;
  slug: string;
  description: string;
  agentIds: string[];
  tasks: SquadTask[];
  workflows: SquadWorkflow[];
  manifestYaml?: string;
  isValidated: boolean;
}

export interface SquadTask {
  id: string;
  name: string;
  description: string;
  agentSlug: string;
  dependencies: string[];
  checklist: string[];
}

export interface SquadWorkflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  agentSlug: string;
  taskId?: string;
  condition?: string;
  dependsOn?: string[];
  timeout_ms?: number;
  retryPolicy?: { maxRetries: number; backoffMs: number };
}

export type WorkflowTrigger = 'manual' | 'on_task' | 'scheduled' | 'event';

export interface ProjectWorkflow {
  id: string;
  name: string;
  slug: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  squadSlug?: string;
}

export interface AiosProject {
  id?: string;
  name: string;
  description: string;
  domain: string;
  orchestrationPattern: OrchestrationPatternType;
  agents: AiosAgent[];
  squads: AiosSquad[];
  workflows: ProjectWorkflow[];
  config: Record<string, unknown>;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'yaml' | 'md' | 'json' | 'ts' | 'env' | 'other';
  complianceStatus: 'pending' | 'passed' | 'warning' | 'failed';
  complianceNotes?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
