

# Phase 2: AIOS Library — Authoring, Editor & AI Assistant

## Overview

Add working copy system (draft/fork/published), per-type editor forms, AI assistant panel with streaming, and publish/discard flows. All adapted to React + Vite + Supabase (no Next.js/Prisma).

---

## 1. Database Migration

**Alter 4 existing tables** (agents, skills, squads, workflows_library) — add columns:
- `status text NOT NULL DEFAULT 'published'` (draft | published | fork | archived)
- `version text NOT NULL DEFAULT '1.0.0'`
- `parent_id uuid NULL` (self-referential for forks)
- `changelog jsonb NOT NULL DEFAULT '[]'`
- `published_at timestamptz NULL`
- `created_in_library boolean NOT NULL DEFAULT false`

**New table: `library_editor_sessions`**
- id, user_id, entity_type, entity_id, ai_messages (jsonb), ai_context (jsonb), last_saved_at, created_at, updated_at
- Unique on (user_id, entity_type, entity_id)
- RLS: user manages own sessions

---

## 2. Types Extension (`src/types/library.ts`)

Add: `LibraryItemStatus`, `WorkingCopy`, `AgentFormData`, `SkillFormData`, `SquadFormData`, `WorkflowFormData`, `EditorAiMessage`, `LibraryItemVersion`.

---

## 3. Service Layer (`src/services/library-editor.service.ts`)

Functions:
- `createDraft(type, projectId)` — insert with status='draft'
- `createFork(type, originalId, projectId)` — clone with status='fork', parent_id set
- `saveDraft(type, id, data)` — update entity fields
- `publishDraft(type, id, changelog, version)` — set status='published', publishedAt
- `discardDraft(type, id)` — delete draft/fork
- `validateElement(type, data)` — client-side AIOS Core validation
- `loadEditorSession(type, id)` — get/create editor session
- `saveEditorSession(type, id, aiMessages)` — persist AI conversation

---

## 4. Editor Store (`src/stores/library-editor-store.ts`)

State: workingCopy, isSaving, isPublishing, validationErrors, aiMessages, isAiThinking, aiPanelOpen.

Actions: startNew, startFork, updateField, saveDraft, discardChanges, publishWorkingCopy, sendAiMessage, applyAiSuggestion, toggleAiPanel.

---

## 5. Edge Function (`supabase/functions/library-editor-ai/index.ts`)

SSE streaming endpoint. System prompt specialized per entity type with AIOS Core v4.x validation rules. Supports tool calling with `apply_fields` tool for structured field suggestions. Uses `google/gemini-3-flash-preview`.

---

## 6. UI Components

### Editor Page (`src/pages/LibraryEditorPage.tsx`)
- Route: `/library/editor/:type/:id`
- Two-column resizable layout: form (left 60%) + AI panel (right 40%)
- Header with status badge, save/publish/discard buttons, validation trigger

### Editor Header (`src/components/library/editor/EditorHeader.tsx`)
- Breadcrumb, status badge (draft/fork), dirty indicator, auto-save status
- Buttons: Validate, Save Draft, Publish, Discard, Toggle AI Panel

### Forms (4 components in `src/components/library/editor/forms/`)
- **AgentForm.tsx**: Identity, system prompt (textarea with section snippets), LLM model select, commands list, tools/skills multi-select, visibility, tags
- **SkillForm.tsx**: Identity, prompt textarea, inputs/outputs dynamic lists, examples accordion, tags
- **SquadForm.tsx**: Identity, version, agent multi-select, tasks list with agent assignment, workflow select, tags
- **WorkflowForm.tsx**: Identity, pattern select, steps drag list, triggers list, outputs list, tags

Each form uses collapsible sections with shadcn Accordion. Dynamic list items use add/remove with inline editing.

### AI Panel (`src/components/library/editor/EditorAiPanel.tsx`)
- Chat interface reusing patterns from wizard ChatPanel
- Quick action chips: "Revisar", "Verificar padroes AIOS", "Gerar system prompt", "Sugerir melhorias"
- AI suggestion cards with "Aplicar" / "Ignorar" actions when tool call received
- Markdown rendering for responses

### Dialogs
- **PublishDialog.tsx**: Version input, changelog textarea, project selector (for new drafts), validation result display
- **DiscardDialog.tsx**: Confirmation with context-aware messaging (fork vs draft)
- **ValidationPanel.tsx**: Inline panel showing errors/warnings from AIOS Core validation

### Auto-save Hook (`src/hooks/useAutoSave.ts`)
- Debounced save (30s inactivity), beforeunload handler, visual indicator

---

## 7. Navigation Updates

- Add route `/library/editor/:type/:id` in App.tsx
- LibraryToolbar: Add "Novo elemento" dropdown (Agent, Skill, Squad, Workflow)
- LibraryCard: Show draft/fork badge, "Continuar editando" on hover for user's drafts
- LibraryDetailPanel: Add "Criar fork e editar" button
- LibraryPage: Add "Meus rascunhos" horizontal section at top when drafts exist

---

## 8. Implementation Order

1. Database migration (alter tables + new table)
2. Extended types in library.ts
3. library-editor.service.ts
4. library-editor-store.ts
5. Edge function library-editor-ai
6. useAutoSave hook
7. Form components (AgentForm, SkillForm, SquadForm, WorkflowForm)
8. EditorAiPanel
9. EditorHeader + PublishDialog + DiscardDialog + ValidationPanel
10. LibraryEditorPage (assembly)
11. Navigation updates (App.tsx route, toolbar dropdown, card badges, detail panel button)

---

## File Count: ~18 new files, ~6 modified files

| Category | Count |
|----------|-------|
| DB migration | 1 |
| Types (extend) | 1 |
| Service | 1 |
| Store | 1 |
| Edge function | 1 |
| Hook | 1 |
| Editor forms | 4 |
| Editor components | 5 (header, AI panel, publish, discard, validation) |
| Pages | 1 |
| Modified | 6 (App.tsx, LibraryPage, LibraryToolbar, LibraryCard, LibraryDetailPanel, config.toml) |

