/**
 * @agent     LibraryTypes
 * @persona   Definicoes de tipos do modulo AIOS Library
 * @context   Tipos compartilhados para navegacao, filtragem e importacao de artefatos da Library.
 */

export type LibraryEntityType = 'agent' | 'skill' | 'squad' | 'workflow';

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
