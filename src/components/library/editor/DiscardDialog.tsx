/**
 * @agent     DiscardDialog
 * @persona   Dialog de confirmacao de descarte de draft/fork
 * @commands  render
 * @context   Mensagem contextual para fork vs draft. Ao confirmar, deleta e redireciona.
 */

import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLibraryEditorStore } from '@/stores/library-editor-store';

interface DiscardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DiscardDialog({ open, onOpenChange }: DiscardDialogProps) {
  const navigate = useNavigate();
  const { workingCopy, discardChanges } = useLibraryEditorStore();

  const handleDiscard = async () => {
    await discardChanges();
    onOpenChange(false);
    navigate('/library');
  };

  if (!workingCopy) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">
            {workingCopy.status === 'fork' ? 'Descartar fork?' : 'Descartar rascunho?'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            {workingCopy.status === 'fork'
              ? `As alteracoes serao descartadas. O elemento original "${workingCopy.originalName}" nao sera afetado.`
              : 'Este rascunho sera permanentemente excluido. Esta acao nao pode ser desfeita.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-xs">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDiscard} className="bg-destructive text-destructive-foreground text-xs">
            Descartar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
