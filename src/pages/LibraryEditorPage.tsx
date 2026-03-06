/**
 * @agent     LibraryEditorPage
 * @persona   Pagina do editor de elementos da Library com formulario, painel IA e comparacao
 * @squad     pages
 * @context   Rota /library/editor/:type/:id. Layout duas colunas: formulario + IA ou Compare.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLibraryEditorStore } from '@/stores/library-editor-store';
import { useAutoSave } from '@/hooks/useAutoSave';
import { getSession } from '@/services/auth.service';
import EditorHeader from '@/components/library/editor/EditorHeader';
import EditorAiPanel from '@/components/library/editor/EditorAiPanel';
import ComparePanel from '@/components/library/editor/ComparePanel';
import CompareSelectDialog from '@/components/library/editor/CompareSelectDialog';
import PublishDialog from '@/components/library/editor/PublishDialog';
import DiscardDialog from '@/components/library/editor/DiscardDialog';
import AgentForm from '@/components/library/editor/forms/AgentForm';
import SkillForm from '@/components/library/editor/forms/SkillForm';
import SquadForm from '@/components/library/editor/forms/SquadForm';
import WorkflowForm from '@/components/library/editor/forms/WorkflowForm';
import type { LibraryEntityType, AgentFormData, SkillFormData, SquadFormData, WorkflowFormData } from '@/types/library';

export default function LibraryEditorPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const {
    workingCopy,
    aiPanelOpen,
    comparePanelOpen,
    validationErrors,
    loadEntity,
    updateField,
    runValidation,
    loadCompareEntity,
    closeCompare,
    reset,
  } = useLibraryEditorStore();

  const [publishOpen, setPublishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [compareSelectOpen, setCompareSelectOpen] = useState(false);

  useAutoSave();

  useEffect(() => {
    getSession().then(s => {
      if (!s) { navigate('/auth'); return; }
      if (type && id) {
        loadEntity(type as LibraryEntityType, id).catch(() => navigate('/library'));
      }
    });
    return () => reset();
  }, [type, id, navigate, loadEntity, reset]);

  const handleAiRequest = (prompt: string) => {
    const store = useLibraryEditorStore.getState();
    if (!store.aiPanelOpen) store.toggleAiPanel();
    store.addAiMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    });
  };

  const handleCompareSelect = async (selectedId: string, selectedName: string) => {
    if (!type) return;
    await loadCompareEntity(type as LibraryEntityType, selectedId, selectedName);
  };

  const sidePanelOpen = aiPanelOpen || comparePanelOpen;

  if (!workingCopy) {
    return (
      <div className="min-h-screen bg-background bg-grid flex items-center justify-center">
        <div className="glass rounded-xl p-8 animate-pulse">
          <p className="text-sm text-muted-foreground">Carregando editor...</p>
        </div>
      </div>
    );
  }

  const renderForm = () => {
    switch (workingCopy.type) {
      case 'agent':
        return <AgentForm data={workingCopy.data as AgentFormData} onChange={updateField} onAiRequest={handleAiRequest} />;
      case 'skill':
        return <SkillForm data={workingCopy.data as SkillFormData} onChange={updateField} onAiRequest={handleAiRequest} />;
      case 'squad':
        return <SquadForm data={workingCopy.data as SquadFormData} onChange={updateField} onAiRequest={handleAiRequest} />;
      case 'workflow':
        return <WorkflowForm data={workingCopy.data as WorkflowFormData} onChange={updateField} onAiRequest={handleAiRequest} />;
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col">
      <EditorHeader
        onPublish={() => setPublishOpen(true)}
        onDiscard={() => setDiscardOpen(true)}
        onValidate={runValidation}
        onCompare={() => setCompareSelectOpen(true)}
      />

      <div className="flex-1 h-[calc(100vh-49px)]">
        <ResizablePanelGroup direction="horizontal">
          {/* Form panel */}
          <ResizablePanel defaultSize={sidePanelOpen ? 60 : 100} minSize={40}>
            <ScrollArea className="h-full">
              <div className="p-6 max-w-3xl mx-auto">
                {renderForm()}

                {/* Validation errors inline */}
                {validationErrors.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground">Resultados da validacao</h4>
                    {validationErrors.map((err, i) => (
                      <div key={i} className={`flex items-center gap-2 text-xs p-2 rounded-md ${err.severity === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-yellow-500/10 text-yellow-400'}`}>
                        <span className="font-mono text-[10px] bg-secondary px-1.5 py-0.5 rounded">{err.field}</span>
                        <span>{err.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </ResizablePanel>

          {/* Side panel: AI or Compare */}
          {sidePanelOpen && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={40} minSize={25} maxSize={50}>
                {comparePanelOpen ? (
                  <ComparePanel onClose={closeCompare} />
                ) : (
                  <EditorAiPanel onClose={() => useLibraryEditorStore.getState().toggleAiPanel()} />
                )}
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} />
      <DiscardDialog open={discardOpen} onOpenChange={setDiscardOpen} />
      <CompareSelectDialog
        open={compareSelectOpen}
        onOpenChange={setCompareSelectOpen}
        entityType={(type as LibraryEntityType) || 'agent'}
        currentEntityId={id || ''}
        onSelect={handleCompareSelect}
      />
    </div>
  );
}
