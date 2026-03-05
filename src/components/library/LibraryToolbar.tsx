/**
 * @agent     LibraryToolbar
 * @persona   Barra de ferramentas acima do grid/lista da Library
 * @commands  render
 * @context   Exibe contagem, toggle grid/lista e ordenacao rapida.
 */

import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLibraryStore } from '@/stores/library-store';

interface LibraryToolbarProps {
  filteredCount: number;
  totalCount: number;
}

export default function LibraryToolbar({ filteredCount, totalCount }: LibraryToolbarProps) {
  const { viewMode, setViewMode } = useLibraryStore();

  return (
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs text-muted-foreground">
        Exibindo <strong className="text-foreground">{filteredCount}</strong> de {totalCount} elementos
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setViewMode('grid')}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setViewMode('list')}
        >
          <List className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
