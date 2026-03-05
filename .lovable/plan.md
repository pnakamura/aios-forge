

# Fix: Truncated AI Output in AIOS Assistant

## Root Causes Identified

### 1. No `max_tokens` set in the AI gateway request (Edge Function)
The edge function doesn't specify `max_tokens`, relying on a low default. For complex agent generation (system prompts, commands, etc.), output gets cut off.

### 2. Duplicate key bug in streaming message updates (EditorAiPanel)
The `addAiMessage` call on line 127 always fires because `aiMessages` in the closure is stale (captured at callback creation time). The `existing` check on line 125 searches the stale `aiMessages` array, never finds the assistant message, and calls `addAiMessage` again — creating duplicate messages with the same ID (the console error confirms this). Each partial content chunk creates a NEW message instead of updating the existing one, producing the "truncated text" visual effect.

### 3. Stale closure over `aiMessages`
The `sendMessage` callback has `aiMessages` in its dependency array but reads a snapshot. During streaming, `aiMessages` updates via `setState` but the closure still holds the old reference, so `aiMessages.find(m => m.id === assistantId)` always returns `undefined`.

---

## Fixes

### Fix 1: Edge Function — Add `max_tokens: 8192`

In `supabase/functions/library-editor-ai/index.ts`, add `max_tokens: 8192` to the request body (line 118-126).

### Fix 2: EditorAiPanel — Fix streaming message logic

Replace the streaming content handling to:
- Track whether the assistant message has been added via a local boolean (`messageAdded`) instead of searching `aiMessages`
- Always use `useLibraryEditorStore.setState()` for updates after the first `addAiMessage`
- This eliminates the duplicate key issue and stale closure problem

**Before (broken):**
```typescript
const existing = aiMessages.find(m => m.id === assistantId);
if (!existing) {
  addAiMessage({...});
} else {
  useLibraryEditorStore.setState(s => ({...}));
}
```

**After (fixed):**
```typescript
if (!messageAdded) {
  addAiMessage({...});
  messageAdded = true;
} else {
  useLibraryEditorStore.setState(s => ({...}));
}
```

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/library-editor-ai/index.ts` | Add `max_tokens: 8192` to API request |
| `src/components/library/editor/EditorAiPanel.tsx` | Fix streaming update logic with local `messageAdded` flag |

