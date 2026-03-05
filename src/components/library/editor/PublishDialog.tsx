/**
 * @agent     PublishDialog
 * @persona   Dialog de publicacao de draft/fork na Library
 * @commands  render
 * @context   Solicita versao, changelog e projeto destino (para drafts novos).
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload } from 'lucide-react';
import { useLibraryEditorStore } from '@/stores/library-editor-store';

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PublishDialog({ open, onOpenChange }: PublishDialogProps) {
  const { workingCopy, isPublishing, validationErrors, publishWorkingCopy } = useLibraryEditorStore();
  const [version, setVersion] = useState(workingCopy?.status === 'fork' ? '' : '1.0.0');
  const [changelog, setChangelog] = useState('');

  const errorCount = validationErrors.filter(e => e.severity === 'error').length;

  const handlePublish = async () => {
    if (!version.trim()) return;
    await publishWorkingCopy(changelog, version);
    onOpenChange(false);
  };

  if (!workingCopy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Publicar {workingCopy.data.name || 'elemento'}</DialogTitle>
          <DialogDescription className="text-xs">
            {workingCopy.status === 'fork'
              ? `Fork de "${workingCopy.originalName}" — sera publicado como nova versao.`
              : 'Novo elemento sera publicado na Library.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Versao</Label>
            <Input
              value={version}
              onChange={e => setVersion(e.target.value)}
              placeholder="1.0.0"
              className="mt-1 font-mono text-xs"
            />
          </div>

          <div>
            <Label className="text-xs">Changelog {workingCopy.status === 'fork' ? '(obrigatorio)' : '(opcional)'}</Label>
            <Textarea
              value={changelog}
              onChange={e => setChangelog(e.target.value)}
              placeholder="Descreva as alteracoes..."
              className="mt-1 text-xs"
              rows={3}
            />
          </div>

          {errorCount > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/30">
              <Badge variant="destructive" className="text-[10px]">{errorCount} erros</Badge>
              <span className="text-xs text-destructive">Corrija os erros antes de publicar.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            size="sm"
            className="gap-1"
            onClick={handlePublish}
            disabled={isPublishing || errorCount > 0 || !version.trim() || (workingCopy.status === 'fork' && !changelog.trim())}
          >
            {isPublishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            Publicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
