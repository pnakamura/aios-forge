/**
 * @agent     useAutoSave
 * @persona   Hook de auto-save com debounce para o editor da Library
 * @commands  useAutoSave
 * @deps      zustand, library-editor-store
 * @context   Salva rascunho automaticamente apos 30s de inatividade e ao sair da pagina.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLibraryEditorStore } from '@/stores/library-editor-store';

export function useAutoSave(intervalMs = 30000) {
  const { workingCopy, isSaving, saveDraft } = useLibraryEditorStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSave = useCallback(async () => {
    if (workingCopy?.isDirty && !isSaving) {
      try {
        await saveDraft();
      } catch (e) {
        console.error('Auto-save failed:', e);
      }
    }
  }, [workingCopy?.isDirty, isSaving, saveDraft]);

  // Debounced auto-save on dirty change
  useEffect(() => {
    if (!workingCopy?.isDirty) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, intervalMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [workingCopy?.isDirty, workingCopy?.data, intervalMs, doSave]);

  // Save on beforeunload
  useEffect(() => {
    const handler = () => {
      if (workingCopy?.isDirty) {
        // Fire and forget
        saveDraft();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [workingCopy?.isDirty, saveDraft]);
}
