

# Support AIOS Package Imports (.skill, .agent, .squad, .workflow)

## Context

The uploaded `.skill` file is a ZIP archive (PK header) produced by Claude Code. It contains a directory structure like `skill-name/SKILL.md` with a markdown-based skill definition following AIOS conventions. The current import dialog only supports `.json` and `.md` — it needs to handle these AIOS package formats.

## What to build

Extend the file import system to recognize and parse `.skill`, `.agent`, `.squad`, and `.workflow` ZIP archives. Each archive contains a directory with a markdown file (`SKILL.md`, `AGENT.md`, etc.) that defines the element using YAML front-matter and structured markdown sections.

## Architecture

### 1. New parser: `src/services/aios-package-parser.ts`

A service that:
- Takes a `File` object with `.skill`/`.agent`/`.squad`/`.workflow` extension
- Uses JSZip (already installed) to extract the archive contents
- Finds the main definition file (`SKILL.md`, `AGENT.md`, `SQUAD.md`, `WORKFLOW.md`)
- Parses the markdown structure into a `Record<string, unknown>` matching the DB schema
- Extracts: name, slug (from directory name), description, category, inputs/outputs (from markdown sections), tags, prompt content

**Markdown parsing strategy:**
- YAML front-matter block (between `---` markers) for structured metadata
- Markdown sections (## headers) mapped to fields: `## Description` → description, `## Inputs` → inputs array, `## Outputs` → outputs array, `## Examples` → examples array, `## Prompt` → prompt text
- Falls back to extracting `@agent`-style docblock headers if no YAML front-matter

### 2. Update `FileImportDialog.tsx`

- Add `.skill`, `.agent`, `.squad`, `.workflow` to accepted file extensions
- In `parseFile()`, detect ZIP extensions and delegate to the new parser
- Auto-detect entity type from file extension (`.skill` → skill, `.agent` → agent, etc.), overriding the user's type selection
- Update help text to mention AIOS package formats alongside JSON
- Update the drop zone label to show supported formats

### 3. Update help content in `FileImportDialog`

Add tips per type explaining the AIOS package format:
- "Voce tambem pode importar arquivos .skill gerados pelo Claude Code ou outros geradores AIOS."
- "O arquivo .skill e um pacote ZIP contendo SKILL.md com a definicao completa."

## Files

| File | Action |
|------|--------|
| `src/services/aios-package-parser.ts` | **Create** — ZIP extraction + MD parsing for AIOS packages |
| `src/components/library/FileImportDialog.tsx` | **Edit** — Accept new extensions, delegate to parser, update help |

## Parsing logic detail

```text
.skill ZIP contents:
  skill-name/
    SKILL.md          ← main definition (parse this)
    (other files)     ← ignored for now

SKILL.md structure (expected):
  ---
  name: "Skill Name"
  slug: "skill-name"
  category: "audit"
  tags: [audit, compliance]
  ---
  ## Description
  ...text...
  ## Inputs
  - **param_name** (type): description
  ## Outputs
  - **result** (type): description
  ## Prompt
  ...prompt content...
  ## Examples
  ### Example Title
  Input: ...
  Output: ...
```

The parser will be flexible — if the MD doesn't have YAML front-matter, it will extract the name from the directory name, slug from the directory name, and treat the full content as the description/prompt.

