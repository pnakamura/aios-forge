/**
 * @agent     LibraryFilterPanel
 * @persona   Painel lateral de filtros da Library
 * @commands  render
 * @context   Busca, filtros por tipo, tags, ordenacao e toggles de favorito/publico.
 */

import { useState, useEffect } from 'react';
import { Search, Bot, Zap, Users, GitBranch, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLibraryStore } from '@/stores/library-store';
import type { LibraryEntityType } from '@/types/library';

const ENTITY_TYPES: { key: LibraryEntityType; label: string; icon: typeof Bot }[] = [
  { key: 'agent', label: 'Agents', icon: Bot },
  { key: 'skill', label: 'Skills', icon: Zap },
  { key: 'squad', label: 'Squads', icon: Users },
  { key: 'workflow', label: 'Workflows', icon: GitBranch },
];

export default function LibraryFilterPanel() {
  const { filter, setFilter, resetFilter, getFacets, items } = useLibraryStore();
  const facets = getFacets();
  const [searchLocal, setSearchLocal] = useState(filter.searchQuery);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setFilter({ searchQuery: searchLocal }), 300);
    return () => clearTimeout(t);
  }, [searchLocal, setFilter]);

  const toggleEntityType = (type: LibraryEntityType) => {
    const types = filter.entityTypes.includes(type)
      ? filter.entityTypes.filter((t) => t !== type)
      : [...filter.entityTypes, type];
    setFilter({ entityTypes: types });
  };

  // Collect unique tags from items
  const allTags = Array.from(new Set(items.flatMap((i) => i.tags))).slice(0, 20);

  const activeFilterCount =
    filter.entityTypes.length +
    filter.tags.length +
    (filter.searchQuery ? 1 : 0) +
    (filter.showOnlyFavorites ? 1 : 0) +
    (filter.showOnlyPublic ? 1 : 0);

  const facetCounts: Record<LibraryEntityType, number> = {
    agent: facets.agents,
    skill: facets.skills,
    squad: facets.squads,
    workflow: facets.workflows,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-6 p-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar na Library..."
            value={searchLocal}
            onChange={(e) => setSearchLocal(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Entity types */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tipo</h4>
          <div className="space-y-2">
            {ENTITY_TYPES.map(({ key, label, icon: Icon }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  checked={filter.entityTypes.includes(key)}
                  onCheckedChange={() => toggleEntityType(key)}
                />
                <Icon className="w-3.5 h-3.5" style={{ color: `hsl(var(--library-${key}))` }} />
                <span className="text-sm flex-1">{label}</span>
                <span className="text-[10px] text-muted-foreground">{facetCounts[key]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ordenar por</h4>
          <Select
            value={filter.sortBy}
            onValueChange={(v) => setFilter({ sortBy: v as typeof filter.sortBy })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">Mais recentes</SelectItem>
              <SelectItem value="createdAt">Data de criacao</SelectItem>
              <SelectItem value="usage">Mais usados</SelectItem>
              <SelectItem value="name">A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tags</h4>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={filter.tags.includes(tag) ? 'default' : 'secondary'}
                  className="text-[10px] cursor-pointer"
                  onClick={() => {
                    const tags = filter.tags.includes(tag)
                      ? filter.tags.filter((t) => t !== tag)
                      : [...filter.tags, tag];
                    setFilter({ tags });
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Apenas favoritos</Label>
            <Switch
              checked={filter.showOnlyFavorites}
              onCheckedChange={(v) => setFilter({ showOnlyFavorites: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Apenas publicos</Label>
            <Switch
              checked={filter.showOnlyPublic}
              onCheckedChange={(v) => setFilter({ showOnlyPublic: v })}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      {activeFilterCount > 0 && (
        <div className="p-4 border-t border-border/50">
          <Button variant="ghost" size="sm" className="w-full text-xs gap-1.5" onClick={resetFilter}>
            <X className="w-3 h-3" /> Limpar filtros ({activeFilterCount})
          </Button>
        </div>
      )}
    </div>
  );
}
