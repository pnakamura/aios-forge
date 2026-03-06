

# Migrate Commands from Plain Strings to Structured Format

## Analysis

The current system has a **dual format problem**:

- **DB + `AiosAgent.commands`**: `string[]` — plain names like `"*route"`, `"*queue"` with zero context
- **`AiosAgent.structuredCommands`**: `AgentCommand[]` with `name`, `description`, `visibility`, `handler` — but this field is optional and rarely populated

The generation engine (`generate-aios-package.ts`) already supports both: if `structuredCommands` exists, it generates rich command tables; otherwise it outputs `—` for description and handler. So the 28 commands of AIOS Orchestrator generate a markdown table with 28 rows of `| *route | public | — | — |` — technically valid but useless for anyone reading or using the agent definition.

**Are plain string commands useful?** The name alone serves as a routing identifier, but without description, visibility, and handler, the generated AIOS package produces incomplete agent files. The commands exist but nobody knows what they do.

## Proposal

Unify commands into a single structured format everywhere: DB, store, editor, native agents, and generation.

### 1. Enrich native agents (`src/data/native-agents.ts`)

Change `defaultCommands: string[]` to `defaultCommands: AgentCommand[]` with full descriptions for all 11 agents. Example for Orchestrator's 28 commands:

```typescript
{ name: '*route', description: 'Roteia tarefa para o agente mais adequado', visibility: 'public', handler: 'route-task' },
{ name: '*queue', description: 'Adiciona tarefa na fila de execucao', visibility: 'public', handler: 'enqueue-task' },
```

### 2. Update types (`src/types/aios.ts`)

- Change `NativeAgent.defaultCommands` from `string[]` to `AgentCommand[]`
- Remove `AiosAgent.structuredCommands` — merge into `commands` as `AgentCommand[]`
- Keep `AiosAgent.commands` but change type to `(string | AgentCommand)[]` for backward compat during transition

### 3. Update DB handling (`src/services/library-editor.service.ts`, `src/stores/wizard-store.ts`)

- When loading from DB, normalize: if a command is a plain string, convert to `{ name: str, description: '', visibility: 'public', handler: '' }`
- When saving, always save as structured objects

### 4. Update generation engine (`src/lib/generate-aios-package.ts`)

- Remove the dual-path logic (structured vs simple) — always use structured
- The `inferCommandVisibility` fallback stays for any legacy string commands

### 5. Update AgentForm (`src/components/library/editor/forms/AgentForm.tsx`)

- Already expects `{ name, description, returnType }` — align field names with `AgentCommand` (`returnType` → `handler`, add `visibility`)

### 6. Update AgentCatalog / wizard agent creation

- When adding a native agent to a project, copy `defaultCommands` (now structured) into the agent's commands

## Files

| File | Action |
|------|--------|
| `src/types/aios.ts` | **Edit** — Unify command types |
| `src/data/native-agents.ts` | **Rewrite** — Enrich all 11 agents' commands with descriptions |
| `src/lib/generate-aios-package.ts` | **Edit** — Remove dual-path, always use structured |
| `src/components/library/editor/forms/AgentForm.tsx` | **Edit** — Align field names with AgentCommand |
| `src/stores/wizard-store.ts` | **Edit** — Normalize commands on load |
| `src/components/wizard/AgentCatalog.tsx` | **Edit** — Copy structured commands |
| `src/components/wizard/AgentEditor.tsx` | **Edit** — Use structured format |

