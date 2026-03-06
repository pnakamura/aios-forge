/**
 * @agent     CompareSelectDialog
 * @persona   Dialog para selecionar um elemento da Library para comparacao
 * @commands  render
 * @context   Busca e seleciona elemento do mesmo tipo para diff no editor.
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, GitCompareArrows } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { LibraryEntityType } from '@/types/library';

interface CompareSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: LibraryEntityType;
  currentEntityId: string;
  onSelect: (id: string, name: string) => void;
}

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  version: string;
  status: string;
  tags: string[];
}

const TABLE_MAP: Record<LibraryEntityType, string> = {
  agent: 'agents', skill: 'skills', squad: 'squads', workflow: 'workflows_library',
};

const TYPE_LABELS: Record<LibraryEntityType, string> = {
  agent: 'Agent', skill: 'Skill', squad: 'Squad', workflow: 'Workflow',
};

export default function CompareSelectDialog({ open, onOpenChange, entityType, currentEntityId, onSelect }: CompareSelectDialogProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const table = TABLE_MAP[entityType];
    supabase
      .from(table as 'agents')
      .select('id, name, slug, version, status, tags')
      .neq('id', currentEntityId)
      .order('name')
      .then(({ data }) => {
        const items = (data || []).map(r => {
          const raw = r as Record<string, unknown>;
          return {
            id: raw.id as string,
            name: raw.name as string,
            slug: raw.slug as string,
            version: raw.version as string,
            status: raw.status as string,
            tags: (raw.tags as string[]) || [],
          };
        });
        setResults(items);
        setLoading(false);
      });
  }, [open, entityType, currentEntityId]);

  const filtered = search.trim()
    ? results.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.slug.toLowerCase().includes(search.toLowerCase()))
    : results;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompareArrows className="w-4 h-4" />
            Comparar com outro {TYPE_LABELS[entityType]}
          </DialogTitle>
          <DialogDescription>Selecione um elemento para comparar e incorporar melhorias.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou slug..." className="pl-8 text-xs" />
        </div>

        <ScrollArea className="max-h-[350px]">
          <div className="space-y-1">
            {loading && <p className="text-xs text-muted-foreground text-center py-4">Carregando...</p>}
            {!loading && filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum elemento encontrado</p>}
            {filtered.map(item => (
              <button
                key={item.id}
                onClick={() => { onSelect(item.id, item.name); onOpenChange(false); }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md hover:bg-secondary/80 transition-colors text-left group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{item.slug}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-[9px] font-mono">v{item.version}</Badge>
                  <Badge variant={item.status === 'published' ? 'secondary' : 'outline'} className="text-[9px]">{item.status}</Badge>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
