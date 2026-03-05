/**
 * @agent     LibraryPage
 * @persona   Pagina principal da AIOS Library — navegacao e exploracao de artefatos
 * @squad     pages
 * @context   Rota /library. Layout tres colunas: filtros, grid/lista, painel de detalhes.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, BookOpen, ArrowLeft, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useLibraryStore } from '@/stores/library-store';
import { useTheme } from '@/lib/theme';
import { getSession } from '@/services/auth.service';
import LibraryFilterPanel from '@/components/library/LibraryFilterPanel';
import LibraryToolbar from '@/components/library/LibraryToolbar';
import LibraryGrid from '@/components/library/LibraryGrid';
import LibraryList from '@/components/library/LibraryList';
import LibraryDetailPanel from '@/components/library/LibraryDetailPanel';
import ImportDialog from '@/components/library/ImportDialog';
import type { LibraryItem } from '@/types/library';

export default function LibraryPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const {
    isLoading,
    items,
    selectedItem,
    viewMode,
    loadItems,
    setSelectedItem,
    toggleFavorite,
    getFilteredItems,
  } = useLibraryStore();

  const [importItem, setImportItem] = useState<LibraryItem | null>(null);

  useEffect(() => {
    getSession().then((s) => {
      if (!s) navigate('/auth');
      else loadItems();
    });
  }, [navigate, loadItems]);

  const filteredItems = getFilteredItems();

  const handleSelect = (item: LibraryItem) => setSelectedItem(item);
  const handleToggleFav = (item: LibraryItem) => toggleFavorite(item.type, item.id);

  return (
    <div className="min-h-screen bg-background bg-grid relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <span className="text-base font-bold">AIOS Library</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="relative z-10 h-[calc(100vh-49px)]">
        <ResizablePanelGroup direction="horizontal">
          {/* Filter panel */}
          <ResizablePanel defaultSize={18} minSize={14} maxSize={25}>
            <div className="h-full border-r border-border/50 overflow-hidden">
              <LibraryFilterPanel />
            </div>
          </ResizablePanel>
          <ResizableHandle />

          {/* Main content */}
          <ResizablePanel defaultSize={selectedItem ? 52 : 82} minSize={35}>
            <div className="h-full overflow-y-auto p-6">
              <LibraryToolbar filteredCount={filteredItems.length} totalCount={items.length} />
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="glass rounded-xl p-5 animate-pulse h-48" />
                  ))}
                </div>
              ) : viewMode === 'grid' ? (
                <LibraryGrid items={filteredItems} onSelect={handleSelect} onToggleFavorite={handleToggleFav} />
              ) : (
                <LibraryList items={filteredItems} onSelect={handleSelect} onToggleFavorite={handleToggleFav} />
              )}
            </div>
          </ResizablePanel>

          {/* Detail panel */}
          {selectedItem && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={22} maxSize={40}>
                <div className="h-full border-l border-border/50">
                  <LibraryDetailPanel
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onToggleFavorite={() => toggleFavorite(selectedItem.type, selectedItem.id)}
                  />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      <ImportDialog item={importItem} open={!!importItem} onOpenChange={(o) => !o && setImportItem(null)} />
    </div>
  );
}
