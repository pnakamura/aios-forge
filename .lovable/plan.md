

# Import Elements from Files into AIOS Library

## Overview

Add a file-based import feature to the Library toolbar that lets users upload YAML, JSON, or MD files to create new library elements. Include a guided help system explaining what files are needed for each element type.

## Changes

### 1. New Component: `FileImportDialog` (`src/components/library/FileImportDialog.tsx`)

A dialog triggered from the Library toolbar with:
- **Step 1 — Select type**: Choose what to import (Agent, Skill, Squad, Workflow)
- **Step 2 — Help panel + file upload**: Shows a contextual help card explaining required files per type, then a file drop zone
- **Step 3 — Preview + confirm**: Parse uploaded files, show a preview of what will be created, select target project, and confirm

**Help content per type:**
- **Agent**: Single file — `agent.yaml` or `agent.json` with fields: name, slug, role, system_prompt, llm_model, commands, tools, skills, visibility. Alternatively, an `.md` file following the `@agent` header format from `aios-master`.
- **Skill**: Single file — `skill.yaml/json` with name, slug, description, category, prompt, inputs, outputs, examples.
- **Squad**: Multiple files — `squad.yaml/json` (name, slug, description, agent_ids, tasks, workflows) + optionally the agent definition files for auto-import of missing agents.
- **Workflow**: Single file — `workflow.yaml/json` with name, slug, pattern, steps, triggers, outputs.

**File parsing logic:**
- Detect format by extension (`.yaml`/`.yml` → YAML, `.json` → JSON, `.md` → Markdown)
- For YAML: use a lightweight parser (parse manually with regex since we can't add `js-yaml` — or use JSON only and document that)
- For JSON: `JSON.parse`
- For MD: Extract `@agent` header fields via regex
- Validate required fields, show errors inline

### 2. Service: `importElementFromFile()` in `src/services/library.service.ts`

New function that:
- Takes parsed data object, entity type, and target project ID
- Inserts into the correct table with sensible defaults for missing fields
- Returns the created element ID

### 3. Toolbar Integration (`src/components/library/LibraryToolbar.tsx`)

- Add an "Importar" button (Upload icon) next to the "Novo" dropdown
- Opens `FileImportDialog`

### 4. Store: `addImportedItem` in `src/stores/library-store.ts`

- After successful import, reload items or append the new item to the local array

## Implementation Notes

- Support only JSON format to avoid adding a YAML parser dependency. Document YAML→JSON conversion in help text.
- Support `.md` for agents only (regex parse of `@agent` docblock headers).
- Multiple file upload for squads: user can drag multiple JSON files, system detects squad vs agent files by presence of `agent_ids` field.
- Max file size: 1MB per file, max 10 files.

## Files

| File | Action |
|------|--------|
| `src/components/library/FileImportDialog.tsx` | **Create** — Multi-step import dialog with help, upload, preview |
| `src/services/library.service.ts` | **Edit** — Add `importElementFromFile()` |
| `src/stores/library-store.ts` | **Edit** — Add reload after import |
| `src/components/library/LibraryToolbar.tsx` | **Edit** — Add "Importar" button |

