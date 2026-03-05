

# Import from Library into Wizard

## What to build

Add a "Importar da Library" button in the wizard's Agents step (AgentCatalog) and Squads step (SquadBuilder) that opens a dialog to browse and import published elements from the Library. When imported, the element is converted to the wizard store format (AiosAgent/AiosSquad) and fully integrated — including resolving dependencies (e.g., importing a squad also imports its referenced agents if missing).

---

## Architecture

### New Component: `LibraryImportWizardDialog`

A reusable dialog (`src/components/wizard/LibraryImportWizardDialog.tsx`) that:
- Accepts a `filter` prop to restrict by entity type (`agent`, `skill`, `squad`, `workflow`)
- Fetches published items from `fetchLibraryItems()` filtered by type and status=`published`
- Displays a searchable list with LibraryCard-style items
- On select, shows a preview with an "Importar" button
- On import:
  - **Agent**: Fetches full agent data from DB, converts to `AiosAgent` format, calls `addAgent()`
  - **Squad**: Fetches full squad data, converts to `AiosSquad`, calls `addSquad()`. Also checks `agentIds` — for each agent not already in the wizard store, fetches and imports it automatically via `addAgent()`

### Service Addition: `fetchLibraryElementForWizard()`

New function in `src/services/library.service.ts` that:
- Takes `entityType` and `entityId`
- Returns the full raw DB record for conversion to wizard store types
- For squads: also returns referenced agents that need importing

### Integration Points

1. **AgentCatalog.tsx** — Add "Importar da Library" button next to "+ Custom" button. Opens `LibraryImportWizardDialog` with `filter="agent"`.

2. **SquadBuilder.tsx** — Add "Importar da Library" button next to "Novo Squad" button. Opens `LibraryImportWizardDialog` with `filter="squad"`. On import, auto-imports missing agents.

3. **Dependency Resolution** — When importing a squad, iterate `agentIds`. For each that doesn't exist in `useWizardStore.agents`, fetch the agent from DB and add it. Show a toast listing auto-imported agents.

---

## Files

| File | Action |
|------|--------|
| `src/components/wizard/LibraryImportWizardDialog.tsx` | **Create** — Dialog with search, list, preview, import |
| `src/services/library.service.ts` | **Edit** — Add `fetchElementForWizard()` |
| `src/components/wizard/AgentCatalog.tsx` | **Edit** — Add import button + dialog |
| `src/components/wizard/SquadBuilder.tsx` | **Edit** — Add import button + dialog |

---

## Key conversion logic

```text
DB Agent → AiosAgent:
  slug, name, role, system_prompt→systemPrompt, llm_model→llmModel,
  commands, tools, skills, memory:[], visibility,
  is_custom:true (imported counts as custom), category:undefined

DB Squad → AiosSquad:
  name, slug, description, agent_ids→agentIds, tasks, workflows,
  manifest_yaml→manifestYaml, is_validated→isValidated
```

Dependency resolution on squad import:
- For each `agentId` in squad.agentIds not in wizard store, fetch agent from same project, convert, and `addAgent()`
- Toast: "Squad X importado com Y agentes adicionados automaticamente"

