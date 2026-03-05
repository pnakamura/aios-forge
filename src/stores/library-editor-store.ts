/**
 * @agent     LibraryEditorStore
 * @persona   Estado global do editor de elementos da Library
 * @commands  startNew, startFork, updateField, saveDraft, discardChanges, publishWorkingCopy, sendAiMessage, applyAiSuggestion, toggleAiPanel, runValidation
 * @deps      zustand, library-editor.service
 * @context   Gerencia working copy, validacao, e painel de IA do editor.
 */

import { create } from 'zustand';
import type {
  LibraryEntityType,
  WorkingCopy,
  EditorAiMessage,
  ValidationError,
  AgentFormData,
  SkillFormData,
  SquadFormData,
  WorkflowFormData,
} from '@/types/library';
import {
  createDraft,
  createFork,
  saveDraft as saveDraftService,
  publishDraft,
  discardDraft,
  loadEntityForEditor,
  validateElement,
  loadEditorSession,
  saveEditorSession,
} from '@/services/library-editor.service';

type FormData = AgentFormData | SkillFormData | SquadFormData | WorkflowFormData;

interface LibraryEditorStore {
  workingCopy: WorkingCopy | null;
  isSaving: boolean;
  isPublishing: boolean;
  validationErrors: ValidationError[];
  aiMessages: EditorAiMessage[];
  isAiThinking: boolean;
  aiPanelOpen: boolean;

  // Working copy actions
  loadEntity: (type: LibraryEntityType, id: string) => Promise<void>;
  startNew: (type: LibraryEntityType, projectId: string) => Promise<string>;
  startFork: (type: LibraryEntityType, originalId: string, projectId: string) => Promise<string>;
  updateField: (field: string, value: unknown) => void;
  saveDraft: () => Promise<void>;
  discardChanges: () => Promise<void>;
  publishWorkingCopy: (changelog: string, version: string) => Promise<void>;
  runValidation: () => void;

  // AI actions
  toggleAiPanel: () => void;
  addAiMessage: (msg: EditorAiMessage) => void;
  setAiThinking: (v: boolean) => void;
  applyAiSuggestion: (fields: Partial<FormData>) => void;
  clearAiHistory: () => void;

  // Cleanup
  reset: () => void;
}

export const useLibraryEditorStore = create<LibraryEditorStore>((set, get) => ({
  workingCopy: null,
  isSaving: false,
  isPublishing: false,
  validationErrors: [],
  aiMessages: [],
  isAiThinking: false,
  aiPanelOpen: true,

  loadEntity: async (type, id) => {
    const wc = await loadEntityForEditor(type, id);
    if (!wc) throw new Error('Elemento nao encontrado');
    const messages = await loadEditorSession(type, id);
    set({ workingCopy: wc, aiMessages: messages, validationErrors: [] });
  },

  startNew: async (type, projectId) => {
    const id = await createDraft(type, projectId);
    return id;
  },

  startFork: async (type, originalId, projectId) => {
    const id = await createFork(type, originalId, projectId);
    return id;
  },

  updateField: (field, value) => {
    const wc = get().workingCopy;
    if (!wc) return;
    set({
      workingCopy: {
        ...wc,
        isDirty: true,
        data: { ...wc.data, [field]: value } as FormData,
      },
    });
  },

  saveDraft: async () => {
    const wc = get().workingCopy;
    if (!wc) return;
    set({ isSaving: true });
    try {
      await saveDraftService(wc.type, wc.id, wc.data);
      // Also persist AI session
      if (get().aiMessages.length > 0) {
        await saveEditorSession(wc.type, wc.id, get().aiMessages);
      }
      set({
        workingCopy: { ...wc, isDirty: false, lastSavedAt: new Date().toISOString() },
      });
    } finally {
      set({ isSaving: false });
    }
  },

  discardChanges: async () => {
    const wc = get().workingCopy;
    if (!wc) return;
    await discardDraft(wc.type, wc.id);
    set({ workingCopy: null, aiMessages: [], validationErrors: [] });
  },

  publishWorkingCopy: async (changelog, version) => {
    const wc = get().workingCopy;
    if (!wc) return;
    set({ isPublishing: true });
    try {
      // Save first
      await saveDraftService(wc.type, wc.id, wc.data);
      await publishDraft(wc.type, wc.id, changelog, version);
      set({
        workingCopy: { ...wc, status: 'draft', isDirty: false },
      });
    } finally {
      set({ isPublishing: false });
    }
  },

  runValidation: () => {
    const wc = get().workingCopy;
    if (!wc) return;
    const errors = validateElement(wc.type, wc.data);
    set({ validationErrors: errors });
  },

  toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),

  addAiMessage: (msg) =>
    set((s) => ({ aiMessages: [...s.aiMessages, msg] })),

  setAiThinking: (v) => set({ isAiThinking: v }),

  applyAiSuggestion: (fields) => {
    const wc = get().workingCopy;
    if (!wc) return;
    set({
      workingCopy: {
        ...wc,
        isDirty: true,
        data: { ...wc.data, ...fields } as FormData,
      },
    });
  },

  clearAiHistory: () => set({ aiMessages: [] }),

  reset: () =>
    set({
      workingCopy: null,
      isSaving: false,
      isPublishing: false,
      validationErrors: [],
      aiMessages: [],
      isAiThinking: false,
    }),
}));
