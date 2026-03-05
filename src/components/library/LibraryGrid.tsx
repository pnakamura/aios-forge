/**
 * @agent     LibraryGrid
 * @persona   Grid responsivo de LibraryCards
 * @commands  render
 * @context   Exibe itens filtrados em layout de grid 3 colunas (desktop), 2 (tablet), 1 (mobile).
 */

import LibraryCard from './LibraryCard';
import type { LibraryItem } from '@/types/library';

interface LibraryGridProps {
  items: LibraryItem[];
  onSelect: (item: LibraryItem) => void;
  onToggleFavorite: (item: LibraryItem) => void;
}

export default function LibraryGrid({ items, onSelect, onToggleFavorite }: LibraryGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Nenhum elemento encontrado com os filtros atuais.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item, i) => (
        <LibraryCard
          key={`${item.type}-${item.id}`}
          item={item}
          index={i}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
