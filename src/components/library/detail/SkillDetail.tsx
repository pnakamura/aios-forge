/**
 * @agent     SkillDetail
 * @persona   Detalhes tecnicos de uma skill na Library
 * @context   Tab de detalhes no LibraryDetailPanel para tipo skill.
 */

import { Badge } from '@/components/ui/badge';
import type { LibraryItem, SkillMeta } from '@/types/library';

export default function SkillDetail({ item }: { item: LibraryItem }) {
  const meta = item.meta as SkillMeta;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-1">Categoria</h4>
        <Badge variant="secondary" className="text-xs">{meta.category}</Badge>
      </div>
      {meta.agentName && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-1">Agente de origem</h4>
          <p className="text-sm">{meta.agentName}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-lg p-3 text-center">
          <span className="text-lg font-bold">{meta.inputCount}</span>
          <p className="text-[10px] text-muted-foreground">Inputs</p>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <span className="text-lg font-bold">{meta.outputCount}</span>
          <p className="text-[10px] text-muted-foreground">Outputs</p>
        </div>
      </div>
    </div>
  );
}
