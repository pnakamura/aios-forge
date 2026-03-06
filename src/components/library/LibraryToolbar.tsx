/**
 * @agent     LibraryToolbar
 * @persona   Barra de ferramentas acima do grid/lista da Library
 * @commands  render
 * @context   Exibe contagem, toggle grid/lista, ordenacao e botao de criar novo elemento.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, List, Plus, Upload, Bot, Zap, Users, GitBranch } from 'lucide-react';
import FileImportDialog from '@/components/library/FileImportDialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLibraryStore } from '@/stores/library-store';
import { createDraft } from '@/services/library-editor.service';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { LibraryEntityType } from '@/types/library';

interface LibraryToolbarProps {
  filteredCount: number;
  totalCount: number;
}

const NEW_ITEMS: { type: LibraryEntityType; label: string; icon: typeof Bot }[] = [
  { type: 'agent', label: 'Novo Agent', icon: Bot },
  { type: 'skill', label: 'Nova Skill', icon: Zap },
  { type: 'squad', label: 'Novo Squad', icon: Users },
  { type: 'workflow', label: 'Novo Workflow', icon: GitBranch },
];

export default function LibraryToolbar({ filteredCount, totalCount }: LibraryToolbarProps) {
  const { viewMode, setViewMode } = useLibraryStore();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const handleNewElement = async (type: LibraryEntityType) => {
    setCreating(true);
    try {
      // Get first project as default target
      const { data: projects } = await supabase.from('projects').select('id').limit(1);
      const projectId = projects?.[0]?.id;
      if (!projectId) {
        toast({ title: 'Nenhum projeto encontrado', description: 'Crie um projeto primeiro no wizard.', variant: 'destructive' });
        return;
      }
      const id = await createDraft(type, projectId);
      navigate(`/library/editor/${type}/${id}`);
    } catch (e) {
      toast({ title: 'Erro ao criar elemento', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs text-muted-foreground">
        Exibindo <strong className="text-foreground">{filteredCount}</strong> de {totalCount} elementos
      </span>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1" disabled={creating}>
              <Plus className="w-3 h-3" /> Novo
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {NEW_ITEMS.map(({ type, label, icon: Icon }) => (
              <DropdownMenuItem key={type} onClick={() => handleNewElement(type)} className="text-xs gap-2">
                <Icon className="w-3.5 h-3.5" style={{ color: `hsl(var(--library-${type}))` }} />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

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
    </div>
  );
}
