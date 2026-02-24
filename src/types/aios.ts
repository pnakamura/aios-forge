export type WizardStep =
  | 'welcome'
  | 'context_analysis'
  | 'project_config'
  | 'agents'
  | 'squads'
  | 'integrations'
  | 'review'
  | 'generation';

export const WIZARD_STEPS: { key: WizardStep; label: string; number: number }[] = [
  { key: 'welcome', label: 'Boas-vindas', number: 1 },
  { key: 'context_analysis', label: 'Análise', number: 2 },
  { key: 'project_config', label: 'Projeto', number: 3 },
  { key: 'agents', label: 'Agentes', number: 4 },
  { key: 'squads', label: 'Squads', number: 5 },
  { key: 'integrations', label: 'Integrações', number: 6 },
  { key: 'review', label: 'Revisão', number: 7 },
  { key: 'generation', label: 'Geração', number: 8 },
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
  defaultCommands: string[];
  icon: string;
  compatiblePatterns: OrchestrationPatternType[];
}

export interface AiosAgent {
  id?: string;
  slug: string;
  name: string;
  role: string;
  systemPrompt: string;
  llmModel: string;
  commands: string[];
  tools: string[];
  skills: string[];
  visibility: 'full' | 'quick' | 'key';
  isCustom: boolean;
  category?: AgentCategory;
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
}

export interface AiosProject {
  id?: string;
  name: string;
  description: string;
  domain: string;
  orchestrationPattern: OrchestrationPatternType;
  agents: AiosAgent[];
  squads: AiosSquad[];
  config: Record<string, unknown>;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'yaml' | 'md' | 'json' | 'ts' | 'env' | 'other';
  complianceStatus: 'pending' | 'passed' | 'failed';
  complianceNotes?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
