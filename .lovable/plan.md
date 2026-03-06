

# Enhanced Commands Editor + Import & Compare

## Problem

1. **Commands section is flat and unreadable** — 28 commands displayed as 3 raw inputs each (name, description, returnType) creates a wall of fields with no way to quickly scan, search, or collapse individual commands.
2. **No import-and-compare capability** — users cannot bring in another element to see differences and selectively merge improvements.

## Solution

### 1. Rich Commands Editor

Replace the flat list with a collapsible card-based UI:

- Each command renders as a **compact collapsed card** showing just the name and a truncated description
- Click to **expand** and reveal description + returnType fields
- Add a **search/filter bar** at the top of the commands section to filter by name
- Add **reorder** capability via up/down buttons
- Show a **command count badge** on the accordion trigger
- Add bulk actions: "Expandir todos" / "Colapsar todos"

Also enhance **Tools** and **Skills** sections (currently just `string[]` with no UI) to show editable tag-like lists.

### 2. Import & Compare Panel

Add a "Comparar com outro elemento" button in the EditorHeader that:

- Opens a dialog to select another element of the same type from the Library (reuses the existing `LibraryImportWizardDialog` pattern — search + select from published items)
- Once selected, opens a **side-by-side diff panel** (replaces the AI panel temporarily) showing:
  - Field-by-field comparison: green for additions, red for removals, yellow for changes
  - For array fields (commands, tools, skills): show which items are new, modified, or missing
  - Each difference has a **"Incorporar"** button to merge that specific field/item into the working copy
  - A **"Incorporar todos"** button to merge everything at once
- The compare panel can be dismissed to return to the AI panel

## Files

| File | Action |
|------|--------|
| `src/components/library/editor/forms/AgentForm.tsx` | **Rewrite** — Collapsible command cards, search, bulk actions, tools/skills editors |
| `src/components/library/editor/ComparePanel.tsx` | **Create** — Side-by-side diff view with selective merge |
| `src/components/library/editor/CompareSelectDialog.tsx` | **Create** — Dialog to pick element to compare against |
| `src/components/library/editor/EditorHeader.tsx` | **Edit** — Add "Comparar" button |
| `src/pages/LibraryEditorPage.tsx` | **Edit** — Support swapping AI panel for Compare panel |
| `src/stores/library-editor-store.ts` | **Edit** — Add compareEntity state and merge actions |

## Command Card UI

```text
┌─────────────────────────────────────────────┐
│ 🔍 Filtrar comandos...          [▼ Todos] [▲ Todos] │
├─────────────────────────────────────────────┤
│ ▸ *analyze-code         Analisa codigo...   │  ← collapsed
│ ▾ *review-pr            Revisa pull requ... │  ← expanded:
│   ┌─────────────────────────────────────┐   │
│   │ Nome: *review-pr                    │   │
│   │ Descricao: Revisa pull requests...  │   │
│   │ Retorno: ReviewResult               │   │
│   │                        [↑] [↓] [🗑] │   │
│   └─────────────────────────────────────┘   │
│ ▸ *generate-tests       Gera testes...      │
└─────────────────────────────────────────────┘
```

## Compare Panel UI

```text
┌─ Comparando com: AIOS Master v2.1.0 ──────┐
│                                    [✕ Fechar] │
├────────────────────────────────────────────┤
│ CAMPO: role                                │
│  Atual:    "Orchestrator principal"        │
│  Outro:    "Orchestrator principal v2"     │
│                            [Incorporar]    │
├────────────────────────────────────────────┤
│ CAMPO: commands (3 novos, 2 modificados)   │
│  + *new-command-1        [Incorporar]      │
│  + *new-command-2        [Incorporar]      │
│  ~ *analyze (modificado) [Incorporar]      │
│  ~ *deploy (modificado)  [Incorporar]      │
│                     [Incorporar todos]     │
└────────────────────────────────────────────┘
```

## Compare Logic

For scalar fields (name, role, systemPrompt, llmModel, visibility): show if different, allow overwrite.

For array fields (commands, tools, skills, tags):
- Match commands by `name` — if name exists in both, compare description/returnType
- Commands only in the compared element = "new" (can be added)
- Commands only in current = "only in current" (informational)
- Commands in both with different values = "modified" (can be updated)

## Store Changes

Add to `library-editor-store.ts`:
- `compareEntity: FormData | null` — the loaded comparison data
- `compareEntityName: string` — name for display
- `comparePanelOpen: boolean`
- `loadCompareEntity(type, id): Promise<void>` — fetches and sets
- `mergeField(field, value): void` — same as updateField but from compare
- `closeCompare(): void`

