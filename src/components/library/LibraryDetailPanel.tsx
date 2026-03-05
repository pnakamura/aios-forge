/**
 * @agent     LibraryDetailPanel
 * @persona   Painel lateral de detalhes de um item selecionado
 * @commands  render
 * @context   Exibe visao geral e detalhes tecnicos do item, com tabs por tipo de entidade.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Star, ExternalLink, Bot, Zap, Users, GitBranch, GitFork, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { createFork } from '@/services/library-editor.service';
import { useLibraryStore } from '@/stores/library-store';
import { toast } from '@/hooks/use-toast';
import type { LibraryItem, LibraryEntityType } from '@/types/library';
import AgentDetail from './detail/AgentDetail';
import SkillDetail from './detail/SkillDetail';
import SquadDetail from './detail/SquadDetail';
import WorkflowDetail from './detail/WorkflowDetail';

const TYPE_ICONS: Record<LibraryEntityType, typeof Bot> = {
  agent: Bot, skill: Zap, squad: Users, workflow: GitBranch,
};

function isDeletable(item: LibraryItem): boolean {
  if (item.type === 'agent' && item.meta.type === 'agent') return !item.meta.isNative;
  return true;
}

interface LibraryDetailPanelProps {
  item: LibraryItem;
  onClose: () => void;
  onToggleFavorite: () => void;
}

export default function LibraryDetailPanel({ item, onClose, onToggleFavorite }: LibraryDetailPanelProps) {
  const navigate = useNavigate();
  const [forking, setForking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteItem = useLibraryStore((s) => s.deleteItem);
  const Icon = TYPE_ICONS[item.type];
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleFork = async () => {
    setForking(true);
    try {
      const { data: projects } = await supabase.from('projects').select('id').limit(1);
      const projectId = projects?.[0]?.id;
      if (!projectId) {
        toast({ title: 'Nenhum projeto encontrado', description: 'Crie um projeto primeiro.', variant: 'destructive' });
        return;
      }
      const forkId = await createFork(item.type, item.id, projectId);
      navigate(`/library/editor/${item.type}/${forkId}`);
    } catch (e) {
      toast({ title: 'Erro ao criar fork', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setForking(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteItem(item.type, item.id);
      toast({ title: 'Elemento excluido', description: `${item.name} foi removido da biblioteca.` });
      onClose();
    } catch (e) {
      toast({ title: 'Erro ao excluir', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `hsl(var(--library-${item.type}) / 0.15)` }}
          >
            <Icon className="w-4 h-4" style={{ color: `hsl(var(--library-${item.type}))` }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm truncate">{item.name}</h3>
            <span className="text-[10px] text-muted-foreground">{item.projectName}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onToggleFavorite}>
            <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <Tabs defaultValue="overview" className="p-4">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1 text-xs">Visao Geral</TabsTrigger>
            <TabsTrigger value="technical" className="flex-1 text-xs">Detalhes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">{item.description || 'Sem descricao'}</p>

            {/* Meta */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tipo</span>
                <Badge variant="outline" className="text-[10px]" style={{ borderColor: `hsl(var(--library-${item.type}) / 0.4)` }}>
                  {item.type}
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Usos</span>
                <span>{item.usageCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Criado em</span>
                <span>{formatDate(item.createdAt)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Atualizado</span>
                <span>{formatDate(item.updatedAt)}</span>
              </div>
              {item.isPublic && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Visibilidade</span>
                  <Badge variant="secondary" className="text-[10px]">Publico</Badge>
                </div>
              )}
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs mt-2" disabled={forking} onClick={handleFork}>
              <GitFork className="w-3 h-3" /> Criar fork e editar
            </Button>
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs mt-1">
              <ExternalLink className="w-3 h-3" /> Ver no projeto original
            </Button>

            {/* Delete */}
            {isDeletable(item) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs mt-1 text-destructive border-destructive/30 hover:bg-destructive/10">
                    <Trash2 className="w-3 h-3" /> Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir "{item.name}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acao e irreversivel. O elemento sera removido permanentemente da biblioteca e dos favoritos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {deleting ? 'Excluindo...' : 'Excluir'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </TabsContent>

          <TabsContent value="technical" className="mt-4">
            {item.meta.type === 'agent' && <AgentDetail item={item} />}
            {item.meta.type === 'skill' && <SkillDetail item={item} />}
            {item.meta.type === 'squad' && <SquadDetail item={item} />}
            {item.meta.type === 'workflow' && <WorkflowDetail item={item} />}
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
}