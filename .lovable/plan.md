

# AIOS Library Module — Implementation Plan

## Critical Adaptation Notes

The PRD references **Next.js app router, Prisma, and API routes** — but this project uses **React + Vite + React Router + Supabase**. All patterns must be adapted:
- No `src/app/` routes — use React Router pages in `src/pages/`
- No Prisma — use Supabase migrations + client SDK
- No server components — everything is client-side with Supabase queries
- AI endpoints use Supabase Edge Functions, not Next.js API routes

## Scope: This is a very large module. Recommended phased delivery.

---

## Phase 1: Foundation (Database + Types + Navigation + Browse Page)

### 1.1 Database Migration

New tables via Supabase migration:

**`skills`** — new table for reusable skill definitions
- id, project_id, agent_id (nullable), name, slug, description, category, inputs (jsonb), outputs (jsonb), prompt (text), examples (jsonb), tags (jsonb), is_public, usage_count, created_at, updated_at
- RLS: same pattern as agents (via project ownership)

**`workflows_library`** — standalone workflow records (separate from project.workflows jsonb)
- id, project_id, squad_id (nullable), name, slug, description, pattern, steps (jsonb), triggers (jsonb), outputs (jsonb), tags (jsonb), is_public, usage_count, created_at, updated_at
- RLS: same pattern as agents

**`library_favorites`** — user favorites
- id, user_id, entity_type (text), entity_id (text), created_at
- Unique constraint on (user_id, entity_type, entity_id)
- RLS: user can manage own favorites

**Alter existing tables:**
- `agents`: add columns `tags jsonb default '[]'`, `is_public boolean default false`, `usage_count integer default 0`
- `squads`: add columns `tags jsonb default '[]'`, `is_public boolean default false`, `usage_count integer default 0`

### 1.2 Types

**`src/types/library.ts`** — LibraryEntityType, LibraryFilter, LibraryItem, AgentMeta, SkillMeta, SquadMeta, WorkflowMeta (as specified in PRD, adapted for Supabase column naming)

### 1.3 Service Layer

**`src/services/library.service.ts`** — Supabase queries:
- `fetchLibraryItems(filter)` — aggregate query across agents, skills, squads, workflows_library; join with library_favorites for isFavorite
- `fetchLibraryItemDetail(type, id)` — full detail with expanded relations
- `toggleFavorite(entityType, entityId)` — upsert/delete in library_favorites
- `fetchAvailableTags()` — distinct tags across all entity tables
- `importElement(entityType, entityId, targetProjectId)` — clone + increment usage_count

### 1.4 Zustand Store

**`src/stores/library-store.ts`** — items, filter, selectedItem, viewMode, isLoading, favorites; actions for setFilter, resetFilter, toggleFavorite, loadItems; computed filteredItems via selector

### 1.5 Navigation

**Modify `src/pages/DashboardPage.tsx`** — add "Library" link (`BookOpen` icon) in header nav

**Modify `src/App.tsx`** — add route `/library` pointing to new LibraryPage

### 1.6 UI Components

**`src/pages/LibraryPage.tsx`** — three-column layout with ResizablePanelGroup

**`src/components/library/LibraryFilterPanel.tsx`** — search input, entity type checkboxes, category filters, tag cloud, sort select, favorite/public toggles

**`src/components/library/LibraryToolbar.tsx`** — count display, grid/list toggle, import button

**`src/components/library/LibraryGrid.tsx`** — responsive grid of LibraryCards

**`src/components/library/LibraryList.tsx`** — dense list view

**`src/components/library/LibraryCard.tsx`** — card with type-colored border (purple=agent, teal=skill, orange=squad, blue=workflow), meta chips, tags, favorite star, hover actions

**`src/components/library/LibraryDetailPanel.tsx`** — sliding right panel with tabs (Overview, Technical Details, History); content varies by entity type

**`src/components/library/detail/AgentDetail.tsx`** — system prompt, commands, skills, squads
**`src/components/library/detail/SkillDetail.tsx`** — prompt, inputs/outputs tables, examples
**`src/components/library/detail/SquadDetail.tsx`** — manifest, agent list, tasks
**`src/components/library/detail/WorkflowDetail.tsx`** — step pipeline visualization

**`src/components/library/ImportDialog.tsx`** — project selector, dependency warnings, confirm

---

## Phase 2: Authoring + Working Copy (Future)

This includes draft/fork system, editor pages, AI assistant panel, auto-save, publish flow, and validation. To be scoped separately after Phase 1 is stable.

---

## File Count Estimate (Phase 1)

| Category | Files | 
|----------|-------|
| DB migration | 1 |
| Types | 1 |
| Service | 1 |
| Store | 1 |
| Pages | 1 |
| Components | 10 |
| Modified files | 2 (App.tsx, DashboardPage.tsx) |
| **Total** | **~17 files** |

---

## Implementation Order

1. Database migration (skills, workflows_library, library_favorites, alter agents/squads)
2. `src/types/library.ts`
3. `src/services/library.service.ts`
4. `src/stores/library-store.ts`
5. LibraryCard, LibraryGrid, LibraryList (display components)
6. LibraryFilterPanel, LibraryToolbar
7. Detail components (AgentDetail, SkillDetail, SquadDetail, WorkflowDetail)
8. LibraryDetailPanel
9. ImportDialog
10. LibraryPage (assembly)
11. Navigation updates (App.tsx route, DashboardPage header link)

