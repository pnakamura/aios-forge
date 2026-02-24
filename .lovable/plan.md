

# AIOS Compliance Review Step

## Overview
Add an AI-powered compliance review system that validates every generated file against AIOS standards before the project can be saved or exported. This includes a new backend function for automated review, a visual compliance dashboard in the FilePreview panel, and integration into the wizard flow.

## What Changes

### 1. New Edge Function: `aios-compliance-review`
A backend function that receives generated file content and uses Lovable AI (gemini-3-flash-preview) to validate each file against AIOS compliance rules:
- YAML files: valid structure, required fields (name, version, slug), proper agent/squad references
- MD files: frontmatter present, required sections (Role, System Prompt, Commands for agents)
- Squad manifests: agent references exist, tasks have assigned agents, workflows have steps
- Config files: all agents/squads referenced, orchestration pattern valid

The function returns per-file results: `passed`, `failed`, or `warning` with specific notes.

Uses tool calling to extract structured output (array of file results with status and notes).

### 2. Update `FilePreview.tsx`
- Add a "Run Compliance Review" button at the top of the file tree panel
- Show compliance status badges (green checkmark, yellow warning, red X) next to each file in the tree
- Display compliance notes below the file content when a file is selected
- Show an overall compliance summary bar (e.g., "6/8 files passed")
- Loading state while review is running

### 3. Update `WizardPage.tsx` Review Step
- In the `review` step content, add a compliance summary section showing pass/fail counts
- Add a "Run Review" button that triggers the compliance check on all generated files
- Store compliance results in the wizard store
- Disable "Save Project" and "Download ZIP" buttons until compliance review has been run (warn, don't block)

### 4. Update `wizard-store.ts`
- Add `complianceResults: Record<string, { status: string; notes: string }>` to state
- Add `setComplianceResults` action
- Add `complianceReviewed: boolean` flag

### 5. Update `generateFileTree` function
- Use compliance results from store to set `complianceStatus` and `complianceNotes` on each `GeneratedFile` instead of hardcoding `'passed'`

### 6. Persist compliance in database
- When saving the project, store each file's `compliance_status` and `compliance_notes` (columns already exist in `generated_files` table)

---

## Technical Details

### Edge Function: `supabase/functions/aios-compliance-review/index.ts`
- Input: `{ files: Array<{ path, content, type }> }`
- Uses tool calling with a `validate_files` function schema to get structured output
- System prompt defines AIOS compliance rules (required fields per file type, naming conventions, cross-references)
- Returns: `{ results: Array<{ path, status: 'passed'|'failed'|'warning', notes: string }> }`

### Config update: `supabase/config.toml`
- Add `[functions.aios-compliance-review]` with `verify_jwt = false`

### Store changes
```text
complianceResults: {}
complianceReviewed: false
setComplianceResults(results) -> updates both fields
reset() -> clears compliance state
```

### FilePreview UI additions
- Badge component per file showing status color
- Summary bar at top: "X/Y passed | Z warnings | W failed"
- Button triggers `supabase.functions.invoke('aios-compliance-review', { body: { files } })`
- Notes panel below file content viewer

### Review step changes
- Show compliance card with summary stats
- "Review Compliance" button
- Toast warning if user tries to save without review
