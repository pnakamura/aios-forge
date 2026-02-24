import { useWizardStore } from '@/stores/wizard-store';
import { AiosSquad, SquadTask, SquadWorkflow, WorkflowStep } from '@/types/aios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, ListChecks, GitBranch } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function SquadBuilder() {
  const { squads, agents, addSquad, removeSquad, updateSquad } = useWizardStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editSquad, setEditSquad] = useState<AiosSquad | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', agentIds: [] as string[] });

  const handleCreate = () => {
    if (!form.name) return;
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-');
    const squad: AiosSquad = {
      name: form.name,
      slug,
      description: form.description,
      agentIds: form.agentIds,
      tasks: [],
      workflows: [],
      isValidated: false,
    };
    addSquad(squad);
    setShowCreate(false);
    setForm({ name: '', slug: '', description: '', agentIds: [] });
  };

  const toggleAgent = (slug: string) => {
    setForm(f => ({
      ...f,
      agentIds: f.agentIds.includes(slug)
        ? f.agentIds.filter(id => id !== slug)
        : [...f.agentIds, slug],
    }));
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
        <h3 className="font-semibold text-sm">Squads</h3>
        <Button variant="outline" size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Novo Squad
        </Button>
      </div>

      {squads.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum squad criado</p>
          <p className="text-xs text-muted-foreground mt-1">Crie squads para agrupar agentes em equipes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {squads.map(squad => (
            <div key={squad.slug} className="border border-border/50 rounded-lg p-4 bg-card/50 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-sm">{squad.name}</h4>
                  <p className="text-xs text-muted-foreground">{squad.description || squad.slug}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeSquad(squad.slug)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Agents */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Agentes ({squad.agentIds.length})</p>
                <div className="flex gap-1.5 flex-wrap">
                  {squad.agentIds.map(id => (
                    <Badge key={id} variant="secondary" className="text-xs">{id}</Badge>
                  ))}
                  {squad.agentIds.length === 0 && <span className="text-xs text-muted-foreground">(vazio)</span>}
                </div>
              </div>

              {/* Tasks */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ListChecks className="w-3 h-3" /> Tasks ({squad.tasks.length})
                  </p>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => addTaskToSquad(squad.slug)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                {squad.tasks.map((task, ti) => (
                  <div key={task.id} className="flex items-center gap-2 text-xs bg-secondary/30 rounded px-2 py-1 mb-1">
                    <span className="text-muted-foreground">{ti + 1}.</span>
                    <Input
                      className="h-6 text-xs bg-transparent border-none p-0"
                      value={task.name}
                      onChange={(e) => {
                        const updated = squad.tasks.map(t => t.id === task.id ? { ...t, name: e.target.value } : t);
                        updateSquad(squad.slug, { tasks: updated });
                      }}
                    />
                    <Badge variant="outline" className="text-[10px] shrink-0">{task.agentSlug || '?'}</Badge>
                  </div>
                ))}
              </div>

              {/* Workflows */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <GitBranch className="w-3 h-3" /> Workflows ({squad.workflows.length})
                  </p>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => addWorkflowToSquad(squad.slug)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                {squad.workflows.map(wf => (
                  <div key={wf.id} className="text-xs bg-secondary/30 rounded px-2 py-1 mb-1">
                    <Input
                      className="h-6 text-xs bg-transparent border-none p-0"
                      value={wf.name}
                      onChange={(e) => {
                        const updated = squad.workflows.map(w => w.id === wf.id ? { ...w, name: e.target.value } : w);
                        updateSquad(squad.slug, { workflows: updated });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="glass max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Squad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Frontend Team" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Objetivo do squad..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Agentes</Label>
              <div className="flex gap-1.5 flex-wrap">
                {agents.map(agent => (
                  <Badge
                    key={agent.slug}
                    variant={form.agentIds.includes(agent.slug) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleAgent(agent.slug)}
                  >
                    {agent.name}
                  </Badge>
                ))}
                {agents.length === 0 && <span className="text-xs text-muted-foreground">Adicione agentes primeiro</span>}
              </div>
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={!form.name}>
              Criar Squad
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
