/**
 * @agent     LibraryTypes
 * @persona   Definicoes de tipos do modulo AIOS Library
 * @context   Tipos compartilhados para navegacao, filtragem, importacao e edicao de artefatos da Library.
 */

export type LibraryEntityType = 'agent' | 'skill' | 'squad' | 'workflow';

export type LibraryItemStatus = 'draft' | 'published' | 'fork' | 'archived';

export interface LibraryFilter {
  entityTypes: LibraryEntityType[];
  tags: string[];
  categories: string[];
  searchQuery: string;
  showOnlyPublic: boolean;
  showOnlyFavorites: boolean;
  sortBy: 'name' | 'usage' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

export const DEFAULT_LIBRARY_FILTER: LibraryFilter = {
  entityTypes: [],
  tags: [],
  categories: [],
  searchQuery: '',
  showOnlyPublic: false,
  showOnlyFavorites: false,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};

export interface LibraryItem {
  id: string;
  type: LibraryEntityType;
  name: string;
  slug: string;
  description: string;
  tags: string[];
  projectName: string;
  projectId: string;
  usageCount: number;
  isFavorite: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  status: LibraryItemStatus;
  version: string;
  parentId?: string;
  meta: AgentMeta | SkillMeta | SquadMeta | WorkflowMeta;
}

export interface AgentMeta {
  type: 'agent';
  role: string;
  llmModel: string;
  category: string;
  commandCount: number;
  skillCount: number;
  isNative: boolean;
}

export interface SkillMeta {
  type: 'skill';
  category: string;
  inputCount: number;
  outputCount: number;
  agentName?: string;
}

export interface SquadMeta {
  type: 'squad';
  agentCount: number;
  taskCount: number;
  workflowCount: number;
  orchestrationPattern: string;
  isValidated: boolean;
}

export interface WorkflowMeta {
  type: 'workflow';
  pattern: string;
  stepCount: number;
  squadName?: string;
  triggerCount: number;
}

// ── Working Copy & Editor types ──

export interface LibraryItemVersion {
  version: string;
  changelog: string;
  publishedAt: string;
  publishedBy: string;
}

export interface WorkingCopy {
  id: string;
  type: LibraryEntityType;
  status: 'draft' | 'fork';
  originalId?: string;
  originalName?: string;
  originalVersion?: string;
  projectId: string;
  data: AgentFormData | SkillFormData | SquadFormData | WorkflowFormData;
  isDirty: boolean;
  lastSavedAt?: string;
}

export interface AgentFormData {
  name: string;
  slug: string;
  role: string;
  category: string;
  systemPrompt: string;
  llmModel: string;
  commands: { name: string; description: string; returnType: string }[];
  tools: string[];
  skills: string[];
  visibility: string;
  tags: string[];
  isPublic: boolean;
  description: string;
}

export interface SkillFormData {
  name: string;
  slug: string;
  description: string;
  category: string;
  inputs: { name: string; type: string; description: string; required: boolean }[];
  outputs: { name: string; type: string; description: string }[];
  prompt: string;
  examples: { title: string; input: string; output: string }[];
  tags: string[];
  isPublic: boolean;
}

export interface SquadFormData {
  name: string;
  slug: string;
  description: string;
  agentSlugs: string[];
  tasks: { name: string; description: string; agentSlug: string; dependencies: string[] }[];
  workflows: string[];
  tags: string[];
  isPublic: boolean;
}

export interface WorkflowFormData {
  name: string;
  slug: string;
  description: string;
  pattern: 'sequential' | 'parallel' | 'conditional';
  steps: { name: string; agentSlug: string; task: string; exitCondition: string }[];
  triggers: { type: string; description: string }[];
  outputs: { name: string; type: string; description: string }[];
  tags: string[];
  isPublic: boolean;
}

export interface EditorAiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  appliedFields?: string[];
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}
