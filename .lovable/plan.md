

# Enhanced Editor Forms with Contextual Help System

## Current State

All 4 editor forms (Agent, Skill, Squad, Workflow) have bare labels with no guidance. Users see "Nome", "Slug", "System Prompt" but have no idea what to write, what format to use, or how fields relate to other AIOS elements. Array fields (steps, tasks, triggers, inputs/outputs) lack reordering and inline help.

## Solution

### 1. Shared FieldHelp Component

Create a reusable `FieldHelp` component that renders an info icon next to any label. On hover/click it shows a popover with:
- **What to fill**: short description of the field's purpose
- **Relationships**: which other elements use or depend on this field (e.g., "O slug e usado por squads e workflows para referenciar este agente")
- **Example**: concrete text example the user can reference

```text
┌─ Nome ⓘ ──────────────────────────────┐
│ [Code Reviewer                      ] │
│                                       │
│  ⓘ popover:                          │
│  ┌──────────────────────────────────┐ │
│  │ Nome legivel do agente.          │ │
│  │                                  │ │
│  │ Relacionamentos:                 │ │
│  │ • Aparece no catalogo e squads   │ │
│  │ • Usado no header do AGENT.md    │ │
│  │                                  │ │
│  │ Exemplo: "Code Reviewer"         │ │
│  │          "DevOps Engineer"       │ │
│  └──────────────────────────────────┘ │
└───────────────────────────────────────┘
```

### 2. Help Data Registry

A pure data file (`src/data/editor-field-help.ts`) containing all help entries per entity type and field:

```typescript
export const FIELD_HELP: Record<LibraryEntityType, Record<string, FieldHelpData>> = {
  agent: {
    name: { description: '...', relationships: ['...'], example: '...' },
    slug: { ... },
    role: { ... },
    systemPrompt: { ... },
    commands: { ... },
    tools: { ... },
    skills: { ... },
    // ...
  },
  skill: { name: {...}, prompt: {...}, inputs: {...}, outputs: {...}, examples: {...} },
  squad: { name: {...}, agentSlugs: {...}, tasks: {...}, workflows: {...} },
  workflow: { name: {...}, steps: {...}, triggers: {...}, outputs: {...}, pattern: {...} },
};
```

### 3. Form Enhancements per Entity

**All forms** get:
- `FieldHelp` next to every label
- Better placeholders with realistic example text
- Reorder buttons (up/down) on all array items (steps, tasks, triggers, inputs, outputs, examples)
- Collapsible array items for forms with many entries (WorkflowForm steps, SquadForm tasks)
- Step numbering / indices for ordered arrays

**WorkflowForm** additions:
- Steps: add `depends_on` field (comma-separated step names) and `timeout` field
- Steps: collapsible cards (same pattern as AgentForm commands)
- Pattern selector with inline help explaining each pattern

**SquadForm** additions:
- Tasks: add `dependencies` editor (currently in type but not in UI)
- Manifest YAML textarea (field exists in DB but not exposed)

**SkillForm** additions:
- Inputs: add `required` toggle (exists in type but not rendered as toggle)
- Better prompt placeholder with structured template

### 4. Interrelationship Hints

For fields that reference other elements:
- **agentSlug** fields (in Squad tasks, Workflow steps): show hint "Use o slug de um agente existente no projeto (ex: aios-developer)"
- **dependencies** in Squad tasks: "Nomes de tasks que devem completar antes desta"
- **tools/skills** in Agent: "Slugs de skills/ferramentas registradas na Library"

## Files

| File | Action |
|------|--------|
| `src/data/editor-field-help.ts` | **Create** — Help data registry for all 4 entity types |
| `src/components/library/editor/FieldHelp.tsx` | **Create** — Reusable popover component |
| `src/components/library/editor/forms/AgentForm.tsx` | **Edit** — Add FieldHelp to all labels, improve placeholders |
| `src/components/library/editor/forms/SkillForm.tsx` | **Edit** — Add FieldHelp, required toggle, reorder, collapsible examples |
| `src/components/library/editor/forms/SquadForm.tsx` | **Edit** — Add FieldHelp, dependencies UI, reorder tasks, manifest field |
| `src/components/library/editor/forms/WorkflowForm.tsx` | **Edit** — Add FieldHelp, collapsible steps, depends_on/timeout, reorder |

