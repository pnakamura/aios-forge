/**
 * @agent     AgentDetail
 * @persona   Detalhes tecnicos de um agent na Library
 * @context   Tab de detalhes no LibraryDetailPanel para tipo agent.
 */

import { Badge } from '@/components/ui/badge';
import type { LibraryItem, AgentMeta } from '@/types/library';

export default function AgentDetail({ item }: { item: LibraryItem }) {
  const meta = item.meta as AgentMeta;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-1">Role</h4>
        <p className="text-sm">{meta.role}</p>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-1">Modelo LLM</h4>
        <Badge variant="outline" className="text-xs">{meta.llmModel}</Badge>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-1">Categoria</h4>
        <Badge variant="secondary" className="text-xs">{meta.category}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-lg p-3 text-center">
          <span className="text-lg font-bold">{meta.commandCount}</span>
          <p className="text-[10px] text-muted-foreground">Comandos</p>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <span className="text-lg font-bold">{meta.skillCount}</span>
          <p className="text-[10px] text-muted-foreground">Skills</p>
        </div>
      </div>
      {meta.isNative && (
        <Badge className="text-[10px]" style={{ backgroundColor: 'hsl(var(--glow-success) / 0.2)', color: 'hsl(var(--glow-success))' }}>
          Agente Nativo AIOS
        </Badge>
      )}
    </div>
  );
}
