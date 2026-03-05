/**
 * @agent     LibraryList
 * @persona   Visao em lista densa dos itens da Library
 * @commands  render
 * @context   Alternativa ao grid, mostra uma linha por item com informacoes compactas.
 */

import { Bot, Zap, Users, GitBranch, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { LibraryItem, LibraryEntityType } from '@/types/library';

const ICONS: Record<LibraryEntityType, typeof Bot> = {
  agent: Bot,
  skill: Zap,
  squad: Users,
  workflow: GitBranch,
};

interface LibraryListProps {
  items: LibraryItem[];
  onSelect: (item: LibraryItem) => void;
  onToggleFavorite: (item: LibraryItem) => void;
}

export default function LibraryList({ items, onSelect, onToggleFavorite }: LibraryListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Nenhum elemento encontrado.</p>
      </div>
    );
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = ICONS[item.type];
        return (
          <div
            key={`${item.type}-${item.id}`}
            onClick={() => onSelect(item)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors group"
          >
            <Icon className="w-4 h-4 shrink-0" style={{ color: `hsl(var(--library-${item.type}))` }} />
            <span className="font-medium text-sm truncate min-w-0 flex-1">{item.name}</span>
            <span className="text-xs text-muted-foreground truncate max-w-[100px] hidden md:inline">{item.projectName}</span>
            <div className="flex gap-1 hidden lg:flex">
              {item.tags.slice(0, 2).map((t) => (
                <Badge key={t} variant="secondary" className="text-[9px] px-1.5 py-0">{t}</Badge>
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground w-12 text-right">{item.usageCount} usos</span>
            <span className="text-[10px] text-muted-foreground w-16 text-right hidden sm:inline">{formatDate(item.updatedAt)}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(item); }}
            >
              <Star className={`w-3 h-3 ${item.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
