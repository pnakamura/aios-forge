/**
 * @agent     ImportDialog
 * @persona   Dialog de importacao de elemento da Library para um projeto
 * @commands  render
 * @context   Confirma importacao de um artefato para o projeto de destino.
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Import, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { importElement } from '@/services/library.service';
import { listProjects } from '@/services/project.service';
import type { LibraryItem } from '@/types/library';

interface ImportDialogProps {
  item: LibraryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportDialog({ item, open, onOpenChange }: ImportDialogProps) {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [targetProjectId, setTargetProjectId] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (open) {
      listProjects().then(setProjects).catch(() => {});
    }
  }, [open]);

  if (!item) return null;

  const handleImport = async () => {
    if (!targetProjectId) {
      toast.error('Selecione um projeto de destino');
      return;
    }
    setImporting(true);
    try {
      await importElement(item.type, item.id, targetProjectId);
      toast.success(`${item.name} importado com sucesso!`);
      onOpenChange(false);
    } catch (err) {
      toast.error('Erro ao importar elemento');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Import className="w-4 h-4" /> Importar {item.type}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="glass rounded-lg p-3">
            <p className="font-medium text-sm">{item.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
            <div className="flex gap-1.5 mt-2">
              <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
              <Badge variant="secondary" className="text-[10px]">De: {item.projectName}</Badge>
            </div>
          </div>

          {item.type === 'squad' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
              <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Importar um squad copia apenas a configuracao. Os agentes vinculados precisam ser importados separadamente.
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-medium mb-1.5 block">Projeto de destino</label>
            <Select value={targetProjectId} onValueChange={setTargetProjectId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects
                  .filter((p) => p.id !== item.projectId)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button size="sm" onClick={handleImport} disabled={importing || !targetProjectId} className="gap-1.5">
            <Import className="w-3 h-3" /> {importing ? 'Importando...' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
