/**
 * @agent     WorkflowDetail
 * @persona   Detalhes tecnicos de um workflow na Library
 * @context   Tab de detalhes no LibraryDetailPanel para tipo workflow.
 */

import { Badge } from '@/components/ui/badge';
import type { LibraryItem, WorkflowMeta } from '@/types/library';

export default function WorkflowDetail({ item }: { item: LibraryItem }) {
  const meta = item.meta as WorkflowMeta;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-1">Pattern</h4>
        <Badge variant="outline" className="text-xs">{meta.pattern}</Badge>
      </div>
      {meta.squadName && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-1">Squad de origem</h4>
          <p className="text-sm">{meta.squadName}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-lg p-3 text-center">
          <span className="text-lg font-bold">{meta.stepCount}</span>
          <p className="text-[10px] text-muted-foreground">Steps</p>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <span className="text-lg font-bold">{meta.triggerCount}</span>
          <p className="text-[10px] text-muted-foreground">Triggers</p>
        </div>
      </div>
    </div>
  );
}
