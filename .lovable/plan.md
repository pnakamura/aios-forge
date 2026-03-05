

# Delete Library Element

## What to build

Add ability to delete user-created elements from the Library. Native agents (where `is_custom = false`) are blocked from deletion. Skills, squads, and workflows are always deletable since they're user-created.

## Changes

### 1. Service — `deleteElement()` in `src/services/library.service.ts`

New function that:
- Takes `entityType` and `entityId`
- Deletes from the correct table (`agents`, `skills`, `squads`, `workflows_library`)
- Also cleans up related `library_favorites` entries for that entity
- RLS already ensures users can only delete their own items (via project ownership)

### 2. Store — `deleteItem()` in `src/stores/library-store.ts`

New action that:
- Calls `deleteElement(type, id)`
- Removes item from `items` array
- Clears `selectedItem` if it was the deleted item

### 3. UI — Delete button in `LibraryDetailPanel`

- Add a "Excluir" (Trash2 icon) button in the overview tab, below existing action buttons
- For agents: only show if `meta.isNative === false` (i.e. `is_custom = true`)
- For skills/squads/workflows: always show
- Wrap in an AlertDialog for confirmation before deleting
- On confirm: call store `deleteItem()`, show success toast, close panel

### 4. UI — Delete action on `LibraryCard` hover

- Add Trash2 button in the hover overlay for deletable items (same native check)
- Clicking opens same AlertDialog confirmation

## Files modified

| File | Change |
|------|--------|
| `src/services/library.service.ts` | Add `deleteElement()` |
| `src/stores/library-store.ts` | Add `deleteItem()` action |
| `src/components/library/LibraryDetailPanel.tsx` | Add delete button + AlertDialog |
| `src/components/library/LibraryCard.tsx` | Add delete button in hover overlay |

