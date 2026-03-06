/**
 * @agent     EditorHeader
 * @persona   Barra superior do editor da Library com status, acoes e breadcrumb
 * @commands  render
 * @context   Exibe status do working copy, botoes de salvar/publicar/descartar e toggle IA.
 */

import { ArrowLeft, Save, Upload, Trash2, Sparkles, CheckCircle, AlertCircle, Loader2, GitCompareArrows } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useLibraryEditorStore } from '@/stores/library-editor-store';

const TYPE_LABELS: Record<string, string> = {
  agent: 'Agent', skill: 'Skill', squad: 'Squad', workflow: 'Workflow',
};

interface EditorHeaderProps {
  onPublish: () => void;
  onDiscard: () => void;
  onValidate: () => void;
  onCompare: () => void;
}

export default function EditorHeader({ onPublish, onDiscard, onValidate, onCompare }: EditorHeaderProps) {
  const navigate = useNavigate();
  const { workingCopy, isSaving, validationErrors, aiPanelOpen, comparePanelOpen, toggleAiPanel, saveDraft } = useLibraryEditorStore();

  if (!workingCopy) return null;

  const errorCount = validationErrors.filter(e => e.severity === 'error').length;
  const warningCount = validationErrors.filter(e => e.severity === 'warning').length;

  return (
    <header className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 backdrop-blur-sm bg-background/80">
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate('/library')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-muted-foreground">Library</span>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-xs text-muted-foreground">{TYPE_LABELS[workingCopy.type]}</span>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-sm font-semibold truncate max-w-[200px]">
            {workingCopy.data.name || 'Sem nome'}
          </span>
        </div>

        {/* Status badge */}
        <Badge
          variant={workingCopy.status === 'draft' ? 'secondary' : 'outline'}
          className="text-[10px] shrink-0"
          style={workingCopy.status === 'fork' ? { borderColor: 'hsl(var(--library-workflow))', color: 'hsl(var(--library-workflow))' } : undefined}
        >
          {workingCopy.status === 'draft' ? 'RASCUNHO' : `FORK de ${workingCopy.originalName || '...'}`}
        </Badge>

        {/* Dirty indicator */}
        {workingCopy.isDirty && (
          <div className="flex items-center gap-1 text-[10px] text-orange-400">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            Alteracoes pendentes
          </div>
        )}

        {/* Auto-save indicator */}
        {!workingCopy.isDirty && workingCopy.lastSavedAt && (
          <span className="text-[10px] text-muted-foreground">
            Salvo {new Date(workingCopy.lastSavedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Validation badge */}
        {validationErrors.length > 0 && (
          <div className="flex items-center gap-1 text-xs">
            {errorCount > 0 && <Badge variant="destructive" className="text-[10px]">{errorCount} erros</Badge>}
            {warningCount > 0 && <Badge variant="secondary" className="text-[10px] bg-yellow-500/20 text-yellow-400">{warningCount} avisos</Badge>}
          </div>
        )}

        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={onValidate}>
          <CheckCircle className="w-3 h-3" /> Validar
        </Button>
        <Button variant={comparePanelOpen ? 'secondary' : 'outline'} size="sm" className="text-xs gap-1" onClick={onCompare}>
          <GitCompareArrows className="w-3 h-3" /> Comparar
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => saveDraft()} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
        </Button>
        <Button size="sm" className="text-xs gap-1" onClick={onPublish} disabled={errorCount > 0}>
          <Upload className="w-3 h-3" /> Publicar
        </Button>
        <Button variant="destructive" size="sm" className="text-xs gap-1" onClick={onDiscard}>
          <Trash2 className="w-3 h-3" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant={aiPanelOpen ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={toggleAiPanel}
        >
          <Sparkles className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
