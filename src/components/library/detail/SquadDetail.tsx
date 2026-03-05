/**
 * @agent     SquadDetail
 * @persona   Detalhes tecnicos de um squad na Library
 * @context   Tab de detalhes no LibraryDetailPanel para tipo squad.
 */

import { Badge } from '@/components/ui/badge';
import type { LibraryItem, SquadMeta } from '@/types/library';

export default function SquadDetail({ item }: { item: LibraryItem }) {
  const meta = item.meta as SquadMeta;

  return (
    <div className="space-y-4">
      {meta.orchestrationPattern && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-1">Padrao de orquestracao</h4>
          <Badge variant="outline" className="text-xs">{meta.orchestrationPattern}</Badge>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass rounded-lg p-3 text-center">
          <span className="text-lg font-bold">{meta.agentCount}</span>
          <p className="text-[10px] text-muted-foreground">Agents</p>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <span className="text-lg font-bold">{meta.taskCount}</span>
          <p className="text-[10px] text-muted-foreground">Tasks</p>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <span className="text-lg font-bold">{meta.workflowCount}</span>
          <p className="text-[10px] text-muted-foreground">Workflows</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge
          className="text-[10px]"
          style={meta.isValidated
            ? { backgroundColor: 'hsl(var(--glow-success) / 0.2)', color: 'hsl(var(--glow-success))' }
            : { backgroundColor: 'hsl(var(--glow-warning) / 0.2)', color: 'hsl(var(--glow-warning))' }
          }
        >
          {meta.isValidated ? 'Validado' : 'Nao validado'}
        </Badge>
      </div>
    </div>
  );
}
