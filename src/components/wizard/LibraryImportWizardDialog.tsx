/**
 * @agent     LibraryImportWizardDialog
 * @persona   Dialog reutilizavel para importar elementos publicados da Library para o Wizard
 * @commands  open, search, select, import
 * @context   Usado nas etapas Agents e Squads do wizard para buscar e importar elementos da Library.
 */

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, BookOpen, Bot, Users, Loader2, ArrowRight, Check } from 'lucide-react';
import { fetchLibraryItems, fetchAgentForWizard, fetchSquadForWizard, fetchAgentsByProject } from '@/services/library.service';
import { useWizardStore } from '@/stores/wizard-store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { LibraryItem } from '@/types/library';
import type { AiosAgent, AiosSquad, SquadTask } from '@/types/aios';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterType: 'agent' | 'squad';
}

export function LibraryImportWizardDialog({ open, onOpenChange, filterType }: Props) {
  const { agents, addAgent, addSquad } = useWizardStore();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState<LibraryItem | null>(null);

  const existingSlugs = new Set(agents.map(a => a.slug));

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelected(null);
    setSearch('');
    fetchLibraryItems()
      .then(all => {
        const filtered = all.filter(
          i => i.type === filterType && i.status === 'published'
        );
        setItems(filtered);
      })
      .finally(() => setLoading(false));
  }, [open, filterType]);

  const filtered = items.filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
  });

  const handleImportAgent = useCallback(async (item: LibraryItem) => {
    setImporting(true);
    try {
      const dbAgent = await fetchAgentForWizard(item.id);
      const commands = normalizeCommands(Array.isArray(dbAgent.commands) ? dbAgent.commands : []);
      const tools = Array.isArray(dbAgent.tools) ? dbAgent.tools as string[] : [];
      const skills = Array.isArray(dbAgent.skills) ? dbAgent.skills as string[] : [];

      const agent: AiosAgent = {
        slug: dbAgent.slug,
        name: dbAgent.name,
        role: dbAgent.role,
        systemPrompt: dbAgent.system_prompt,
        llmModel: dbAgent.llm_model,
        commands,
        tools,
        skills,
        memory: [],
        visibility: dbAgent.visibility as AiosAgent['visibility'],
        isCustom: true,
      };

      if (existingSlugs.has(agent.slug)) {
        toast.warning(`Agente "${agent.name}" ja existe no projeto`);
      } else {
        addAgent(agent);
        toast.success(`Agente "${agent.name}" importado da Library`);
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao importar agente');
    } finally {
      setImporting(false);
    }
  }, [addAgent, existingSlugs, onOpenChange]);

  const handleImportSquad = useCallback(async (item: LibraryItem) => {
    setImporting(true);
    try {
      const dbSquad = await fetchSquadForWizard(item.id);
      const agentIds = Array.isArray(dbSquad.agent_ids) ? dbSquad.agent_ids as string[] : [];
      const tasks = Array.isArray(dbSquad.tasks) ? dbSquad.tasks as unknown as SquadTask[] : [];
      const workflows = Array.isArray(dbSquad.workflows) ? dbSquad.workflows : [];

      // Resolve agent dependencies
      let autoImportedCount = 0;
      if (agentIds.length > 0) {
        const projectAgents = await fetchAgentsByProject(dbSquad.project_id);
        const agentSlugMap = new Map<string, typeof projectAgents[0]>();
        for (const a of projectAgents) {
          agentSlugMap.set(a.slug, a);
        }

        for (const agSlug of agentIds) {
          if (!existingSlugs.has(agSlug)) {
            const dbAg = agentSlugMap.get(agSlug);
            if (dbAg) {
              const cmds = normalizeCommands(Array.isArray(dbAg.commands) ? dbAg.commands : []);
              const tls = Array.isArray(dbAg.tools) ? dbAg.tools as string[] : [];
              const sks = Array.isArray(dbAg.skills) ? dbAg.skills as string[] : [];
              addAgent({
                slug: dbAg.slug,
                name: dbAg.name,
                role: dbAg.role,
                systemPrompt: dbAg.system_prompt,
                llmModel: dbAg.llm_model,
                commands: cmds,
                tools: tls,
                skills: sks,
                memory: [],
                visibility: dbAg.visibility as AiosAgent['visibility'],
                isCustom: true,
              });
              autoImportedCount++;
            }
          }
        }
      }

      const squad: AiosSquad = {
        name: dbSquad.name,
        slug: dbSquad.slug,
        description: dbSquad.description ?? '',
        agentIds,
        tasks: tasks.map((t: any) => ({
          id: t.id || crypto.randomUUID(),
          name: t.name || '',
          description: t.description || '',
          agentSlug: t.agentSlug || t.agent_slug || '',
          dependencies: t.dependencies || [],
          checklist: t.checklist || [],
        })),
        workflows: Array.isArray(workflows) ? workflows as unknown as AiosSquad['workflows'] : [],
        isValidated: dbSquad.is_validated,
      };

      addSquad(squad);

      const msg = autoImportedCount > 0
        ? `Squad "${squad.name}" importado com ${autoImportedCount} agente(s) adicionados automaticamente`
        : `Squad "${squad.name}" importado da Library`;
      toast.success(msg);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao importar squad');
    } finally {
      setImporting(false);
    }
  }, [addAgent, addSquad, existingSlugs, onOpenChange]);

  const handleImport = () => {
    if (!selected) return;
    if (filterType === 'agent') handleImportAgent(selected);
    else handleImportSquad(selected);
  };

  const typeLabel = filterType === 'agent' ? 'Agentes' : 'Squads';
  const TypeIcon = filterType === 'agent' ? Bot : Users;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <BookOpen className="w-4 h-4 text-primary" />
            Importar {typeLabel} da Library
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder={`Buscar ${typeLabel.toLowerCase()}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        <ScrollArea className="flex-1 min-h-0 max-h-[45vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <TypeIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                {search ? 'Nenhum resultado encontrado' : `Nenhum ${filterType} publicado na Library`}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 pr-2">
              {filtered.map(item => {
                const isSelected = selected?.id === item.id;
                const alreadyExists = filterType === 'agent' && existingSlugs.has(item.slug);
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelected(isSelected ? null : item)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                      isSelected
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/40 bg-card/30 hover:border-primary/20 hover:bg-primary/[0.02]',
                      alreadyExists && 'opacity-50'
                    )}
                  >
                    <TypeIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{item.name}</span>
                        <Badge variant="outline" className="text-[9px] shrink-0">v{item.version}</Badge>
                        {alreadyExists && (
                          <Badge variant="secondary" className="text-[9px] shrink-0 gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Ja adicionado
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.description}</p>
                    </div>
                    {item.tags.length > 0 && (
                      <div className="flex gap-1 shrink-0">
                        {item.tags.slice(0, 2).map(t => (
                          <Badge key={t} variant="outline" className="text-[8px]">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Preview + Import */}
        {selected && (
          <div className="border-t border-border/30 pt-3 space-y-2">
            <div className="flex items-center gap-2">
              <TypeIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{selected.name}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                Projeto: {selected.projectName}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{selected.description}</p>
            {selected.meta.type === 'squad' && (
              <p className="text-[10px] text-muted-foreground">
                {(selected.meta as any).agentCount} agentes · {(selected.meta as any).taskCount} tasks
                {' '}— agentes ausentes serao importados automaticamente
              </p>
            )}
            <Button
              onClick={handleImport}
              disabled={importing || (filterType === 'agent' && existingSlugs.has(selected.slug))}
              className="w-full gap-2"
              size="sm"
            >
              {importing ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Importando...</>
              ) : (
                <><ArrowRight className="w-3.5 h-3.5" /> Importar para o projeto</>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
