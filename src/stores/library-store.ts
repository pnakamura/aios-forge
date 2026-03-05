/**
 * @agent     LibraryStore
 * @persona   Estado global do modulo AIOS Library
 * @commands  setFilter, resetFilter, setSelectedItem, toggleFavorite, setViewMode, loadItems
 * @deps      zustand, library.service
 * @context   Gerencia itens, filtros, favoritos e selecao para a pagina da Library.
 */

import { create } from 'zustand';
import type { LibraryFilter, LibraryItem, LibraryEntityType } from '@/types/library';
import { DEFAULT_LIBRARY_FILTER } from '@/types/library';
import { fetchLibraryItems, filterItems, toggleFavorite as toggleFav } from '@/services/library.service';

interface LibraryStore {
  items: LibraryItem[];
  filter: LibraryFilter;
  selectedItem: LibraryItem | null;
  viewMode: 'grid' | 'list';
  isLoading: boolean;

  setFilter: (partial: Partial<LibraryFilter>) => void;
  resetFilter: () => void;
  setSelectedItem: (item: LibraryItem | null) => void;
  toggleFavorite: (entityType: LibraryEntityType, entityId: string) => Promise<void>;
  setViewMode: (mode: 'grid' | 'list') => void;
  loadItems: () => Promise<void>;

  // Derived
  getFilteredItems: () => LibraryItem[];
  getFacets: () => { agents: number; skills: number; squads: number; workflows: number };
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  items: [],
  filter: { ...DEFAULT_LIBRARY_FILTER },
  selectedItem: null,
  viewMode: 'grid',
  isLoading: false,

  setFilter: (partial) =>
    set((s) => ({ filter: { ...s.filter, ...partial } })),

  resetFilter: () => set({ filter: { ...DEFAULT_LIBRARY_FILTER } }),

  setSelectedItem: (item) => set({ selectedItem: item }),

  toggleFavorite: async (entityType, entityId) => {
    const isFav = await toggleFav(entityType, entityId);
    set((s) => ({
      items: s.items.map((i) =>
        i.id === entityId ? { ...i, isFavorite: isFav } : i
      ),
      selectedItem:
        s.selectedItem?.id === entityId
          ? { ...s.selectedItem, isFavorite: isFav }
          : s.selectedItem,
    }));
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  loadItems: async () => {
    set({ isLoading: true });
    try {
      const items = await fetchLibraryItems();
      set({ items });
    } finally {
      set({ isLoading: false });
    }
  },

  getFilteredItems: () => {
    const { items, filter } = get();
    return filterItems(items, filter);
  },

  getFacets: () => {
    const { items } = get();
    return {
      agents: items.filter((i) => i.type === 'agent').length,
      skills: items.filter((i) => i.type === 'skill').length,
      squads: items.filter((i) => i.type === 'squad').length,
      workflows: items.filter((i) => i.type === 'workflow').length,
    };
  },
}));
