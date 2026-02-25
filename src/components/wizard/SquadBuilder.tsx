import { useWizardStore } from '@/stores/wizard-store';
import { AiosSquad, SquadTask, SquadWorkflow } from '@/types/aios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, ListChecks, GitBranch, Bot, ChevronDown, ChevronRight, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function SquadBuilder() {
  const { squads, agents, addSquad, removeSquad, updateSquad } = useWizardStore();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedSquad, setExpandedSquad] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const handleCreate = () => {
    if (!form.name) return;
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const squad: AiosSquad = {
      name: form.name,
      slug,
      description: form.description,
      agentIds: [],
      tasks: [],
      workflows: [],
      isValidated: false,
    };
    addSquad(squad);
    setShowCreate(false);
    setForm({ name: '', description: '' });
    setExpandedSquad(slug);
  };

  const toggleAgentInSquad = (squadSlug: string, agentSlug: string) => {
    const squad = squads.find(s => s.slug === squadSlug);
    if (!squad) return;
    const has = squad.agentIds.includes(agentSlug);
    updateSquad(squadSlug, {
      agentIds: has
        ? squad.agentIds.filter(id => id !== agentSlug)
        : [...squad.agentIds, agentSlug],
    });
  };

  const addTaskToSquad = (squadSlug: string) => {
    const squad = squads.find(s => s.slug === squadSlug);
    if (!squad) return;
    const newTask: SquadTask = {
      id: crypto.randomUUID(),
      name: 'Nova Task',
      description: '',
      agentSlug: squad.agentIds[0] || '',
      dependencies: [],
      checklist: [],
    };
    updateSquad(squadSlug, { tasks: [...squad.tasks, newTask] });
  };

  const removeTaskFromSquad = (squadSlug: string, taskId: string) => {
    const squad = squads.find(s => s.slug === squadSlug);
    if (!squad) return;
    updateSquad(squadSlug, { tasks: squad.tasks.filter(t => t.id !== taskId) });
  };

  const addWorkflowToSquad = (squadSlug: string) => {
    const squad = squads.find(s => s.slug === squadSlug);
    if (!squad) return;
    const newWf: SquadWorkflow = {
      id: crypto.randomUUID(),
      name: 'Novo Workflow',
      steps: [],
    };
    updateSquad(squadSlug, { workflows: [...squad.workflows, newWf] });
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Squads</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Agrupe seus {agents.length} agentes em equipes
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Novo Squad
        </Button>
      </div>

      {agents.length === 0 && (
        <div className="p-3 rounded-lg border border-yellow-500/30 dark:border-yellow-400/20 bg-yellow-500/10 dark:bg-yellow-400/5">
          <p className="text-xs text-yellow-700 dark:text-yellow-400">Adicione agentes primeiro (etapa anterior) para poder atribui-los a squads.</p>
        </div>
      )}

      {squads.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">Nenhum squad criado</p>
          <p className="text-xs text-muted-foreground mb-4">
            Squads agrupam agentes em equipes com tasks e workflows definidos.
          </p>
          <Button variant="outline" size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Criar primeiro squad
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {squads.map(squad => {
            const isExpanded = expandedSquad === squad.slug;
            return (
              <div key={squad.slug} className="border border-border/50 rounded-lg bg-card/50 overflow-hidden">
                {/* Squad header */}
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/20 transition-colors"
                  onClick={() => setExpandedSquad(isExpanded ? null : squad.slug)}
                >
                  {isExpanded
                    ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  }
                  <Users className="w-4 h-4 text-glow-success shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{squad.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">
                      {squad.agentIds.length} agentes · {squad.tasks.length} tasks
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={(e) => { e.stopPropagation(); removeSquad(squad.slug); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t border-border/30 pt-3">
                    {/* Description */}
                    {squad.description && (
                      <p className="text-xs text-muted-foreground">{squad.description}</p>
                    )}

                    {/* Agent assignment - toggle grid */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Atribuir agentes
                      </p>
                      {agents.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          {agents.map(agent => {
                            const isInSquad = squad.agentIds.includes(agent.slug);
                            return (
                              <button
                                key={agent.slug}
                                onClick={() => toggleAgentInSquad(squad.slug, agent.slug)}
                                className={cn(
                                  'flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-left transition-all border',
                                  isInSquad
                                    ? 'border-glow-success/40 bg-glow-success/10 text-glow-success'
                                    : 'border-border/30 bg-secondary/20 text-muted-foreground hover:border-primary/30 hover:bg-primary/5'
                                )}
                              >
                                <Bot className="w-3 h-3 shrink-0" />
                                <span className="truncate flex-1">{agent.name}</span>
                                {isInSquad && <span className="text-[9px] shrink-0">x</span>}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Nenhum agente disponivel</p>
                      )}
                    </div>

                    {/* Tasks */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <ListChecks className="w-3 h-3" /> Tasks
                        </p>
                        <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2" onClick={() => addTaskToSquad(squad.slug)}>
                          <Plus className="w-3 h-3 mr-1" /> Adicionar
                        </Button>
                      </div>
                      {squad.tasks.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground py-1">Nenhuma task definida</p>
                      ) : (
                        <div className="space-y-1">
                          {squad.tasks.map((task, ti) => (
                            <div key={task.id} className="flex items-center gap-2 text-xs bg-secondary/30 rounded-md px-2.5 py-1.5">
                              <span className="text-muted-foreground font-mono text-[10px] w-4">{ti + 1}.</span>
                              <Input
                                className="h-5 text-xs bg-transparent border-none p-0 flex-1"
                                value={task.name}
                                onChange={(e) => {
                                  const updated = squad.tasks.map(t => t.id === task.id ? { ...t, name: e.target.value } : t);
                                  updateSquad(squad.slug, { tasks: updated });
                                }}
                              />
                              {/* Agent assignment for task */}
                              <select
                                className="h-5 text-[10px] bg-transparent border border-border/30 rounded px-1 text-muted-foreground"
                                value={task.agentSlug}
                                onChange={(e) => {
                                  const updated = squad.tasks.map(t => t.id === task.id ? { ...t, agentSlug: e.target.value } : t);
                                  updateSquad(squad.slug, { tasks: updated });
                                }}
                              >
                                <option value="">-- agente --</option>
                                {squad.agentIds.map(id => {
                                  const ag = agents.find(a => a.slug === id);
                                  return <option key={id} value={id}>{ag?.name || id}</option>;
                                })}
                              </select>
                              <button
                                onClick={() => removeTaskFromSquad(squad.slug, task.id)}
                                className="text-muted-foreground/70 hover:text-destructive transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Workflows */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <GitBranch className="w-3 h-3" /> Workflows
                        </p>
                        <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2" onClick={() => addWorkflowToSquad(squad.slug)}>
                          <Plus className="w-3 h-3 mr-1" /> Adicionar
                        </Button>
                      </div>
                      {squad.workflows.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground py-1">Nenhum workflow definido</p>
                      ) : (
                        <div className="space-y-1">
                          {squad.workflows.map(wf => (
                            <div key={wf.id} className="text-xs bg-secondary/30 rounded-md px-2.5 py-1.5 flex items-center gap-2">
                              <GitBranch className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                              <Input
                                className="h-5 text-xs bg-transparent border-none p-0 flex-1"
                                value={wf.name}
                                onChange={(e) => {
                                  const updated = squad.workflows.map(w => w.id === wf.id ? { ...w, name: e.target.value } : w);
                                  updateSquad(squad.slug, { workflows: updated });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="glass max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Squad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Squad *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Frontend Team"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Objetivo do squad..."
                rows={2}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Apos criar, voce podera atribuir agentes e adicionar tasks diretamente no painel do squad.
            </p>
            <Button onClick={handleCreate} className="w-full" disabled={!form.name.trim()}>
              Criar Squad
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
