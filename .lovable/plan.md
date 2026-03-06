

# Fix: AIOS Package Import Parsing Empty Data

## Problem Identified

The database confirms the imported skill `pep-rs-auditoria` has empty data:
- `description`: just `">"` (a stray markdown blockquote character)
- `prompt`: empty
- `inputs`: `[]`
- `outputs`: `[]`
- `examples`: `[]`
- `tags`: `[]`

The AIOS package parser (`aios-package-parser.ts`) failed to extract content from the SKILL.md inside the `.skill` ZIP. The likely causes:

1. **The SKILL.md format from Claude Code doesn't match the expected structure** — the parser expects either YAML front-matter (`---` blocks) or `@agent` docblocks, but Claude Code may use a different layout (e.g., plain markdown with `# Title` and prose sections without `##` headers, or a different section naming convention).

2. **The `>` in description** indicates the MD starts with a blockquote (`> description text`) which the `splitSections` function doesn't handle — it only splits by `## Header`, so a `>` blockquote at the top becomes the description via some path that only captures the `>` character.

3. **No validation gate on import** — the FileImportDialog shows a preview but doesn't warn when critical fields (prompt, inputs) are empty, so the user clicks "Import" without realizing the parse failed silently.

## Plan

### 1. Make parser more resilient (`src/services/aios-package-parser.ts`)

- Handle blockquote descriptions: `> text` → strip the `>` prefix
- Handle "flat" markdown without `##` sections: treat the body after the first `#` title as description + prompt content
- Support alternate section names used by Claude Code generators (e.g., `## Objetivo`, `## Contexto`, `## Instrucoes`, `## Checklist`)
- If no structured sections found, treat the entire body as the `prompt` field (better to have the full text in one field than lose it)
- Parse bullet lists outside of named sections as potential inputs/outputs

### 2. Add import validation warnings (`src/components/library/FileImportDialog.tsx`)

- In the preview step, show yellow warnings for empty critical fields per type:
  - Skill: warn if `prompt` is empty, warn if `inputs` is empty
  - Agent: warn if `system_prompt` is empty
- Show the actual parsed field values in the preview (not just name/slug) so the user can verify before importing
- Add a "raw content" expandable section showing the extracted markdown for debugging

### 3. Add fallback: store raw MD content

- When importing a `.skill` package, store the full SKILL.md content in the `prompt` field as fallback if no structured prompt section was found — ensures no data loss even if parsing is imperfect

## Files to modify

| File | Action |
|------|--------|
| `src/services/aios-package-parser.ts` | **Edit** — More resilient parsing, blockquote handling, flat MD fallback |
| `src/components/library/FileImportDialog.tsx` | **Edit** — Show field-level preview + validation warnings before import |

