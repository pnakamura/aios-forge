import { useWorkflowStore } from '@/stores/workflow-store';
import { useWizardStore } from '@/stores/wizard-store';
import { ProjectWorkflow, WorkflowStep, WorkflowTrigger } from '@/types/aios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Plus, Trash2, GitBranch, Bot, ChevronDown, ChevronRight,
  Sparkles, ArrowRight, Zap, Clock, Play,
} from 'lucide-react';

const TRIGGER_OPTIONS: { value: WorkflowTrigger; label: string; icon: React.ReactNode }[] = [
  { value: 'manual', label: 'Manual', icon: <Play className="w-3 h-3" /> },
  { value: 'on_task', label: 'On Task', icon: <Zap className="w-3 h-3" /> },
  { value: 'scheduled', label: 'Agendado', icon: <Clock className="w-3 h-3" /> },
  { value: 'event', label: 'Evento', icon: <ArrowRight className="w-3 h-3" /> },
];

export function WorkflowEditor() {
  const { workflows, addWorkflow, removeWorkflow, updateWorkflow, addWorkflowStep, removeWorkflowStep, updateWorkflowStep, autoGenerateWorkflows } = useWorkflowStore();
  const { agents, squads, project } = useWizardStore();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedWf, setExpandedWf] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', trigger: 'manual' as WorkflowTrigger });

  const allTasks = squads.flatMap(s => s.tasks.map(t => ({ ...t, squadName: s.name })));

  const handleCreate = () => {
    if (!form.name) return;
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const wf: ProjectWorkflow = {
      id: crypto.randomUUID(),
      name: form.name,
      slug,
      description: form.description,
      trigger: form.trigger,
      steps: [],
    };
    addWorkflow(wf);
    setShowCreate(false);
    setForm({ name: '', description: '', trigger: 'manual' });
    setExpandedWf(wf.id);
  };

  const handleAutoGenerate = () => {
    if (agents.length === 0) return;
    autoGenerateWorkflows(
      project.orchestrationPattern || 'TASK_FIRST',
      agents,
      squads,
    );
  };

  const handleAddStep = (workflowId: string) => {
    const step: WorkflowStep = {
      id: crypto.randomUUID(),
      name: 'Novo Step',
      agentSlug: agents[0]?.slug || '',
      dependsOn: [],
    };
    addWorkflowStep(workflowId, step);
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Workflows</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Defina fluxos de execucao entre agentes
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoGenerate}
            className="gap-1.5 text-xs"
            disabled={agents.length === 0}
          >
            <Sparkles className="w-3.5 h-3.5" /> Auto-gerar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" /> Novo
          </Button>
        </div>
      </div>

      {agents.length === 0 && (
        <div className="p-3 rounded-lg border border-yellow-500/30 dark:border-yellow-400/20 bg-yellow-500/10 dark:bg-yellow-400/5">
          <p className="text-xs text-yellow-700 dark:text-yellow-400">Adicione agentes primeiro para criar workflows.</p>
        </div>
      )}

      {workflows.length === 0 ? (
        <div className="text-center py-12">
          <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">Nenhum workflow definido</p>
          <p className="text-xs text-muted-foreground mb-4">
            Workflows definem a ordem de execucao dos agentes. Use "Auto-gerar" para criar baseado no padrao de orquestracao.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoGenerate}
            className="gap-1.5"
            disabled={agents.length === 0}
          >
            <Sparkles className="w-3.5 h-3.5" /> Auto-gerar workflows
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map(wf => {
            const isExpanded = expandedWf === wf.id;
            const triggerOpt = TRIGGER_OPTIONS.find(t => t.value === wf.trigger);
            return (
              <div key={wf.id} className="border border-border/50 rounded-lg bg-card/50 overflow-hidden">
                {/* Workflow header */}
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/20 transition-colors"
                  onClick={() => setExpandedWf(isExpanded ? null : wf.id)}
                >
                  {isExpanded
                    ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  }
                  <GitBranch className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{wf.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">
                      {wf.steps.length} steps · {triggerOpt?.label || wf.trigger}
                    </span>
                  </div>
                  {wf.squadSlug && (
                    <Badge variant="outline" className="text-[9px] shrink-0">
                      {squads.find(s => s.slug === wf.squadSlug)?.name || wf.squadSlug}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={(e) => { e.stopPropagation(); removeWorkflow(wf.id); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t border-border/30 pt-3">
                    {/* Workflow metadata */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Nome</Label>
                        <Input
                          className="h-7 text-xs"
                          value={wf.name}
                          onChange={(e) => updateWorkflow(wf.id, { name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Trigger</Label>
                        <Select
                          value={wf.trigger}
                          onValueChange={(v) => updateWorkflow(wf.id, { trigger: v as WorkflowTrigger })}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TRIGGER_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {wf.description && (
                      <p className="text-xs text-muted-foreground">{wf.description}</p>
                    )}

                    {/* Steps */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" /> Steps
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[10px] px-2"
                          onClick={() => handleAddStep(wf.id)}
                          disabled={agents.length === 0}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Step
                        </Button>
                      </div>
                      {wf.steps.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground py-1">Nenhum step. Adicione ou use "Auto-gerar".</p>
                      ) : (
                        <div className="space-y-1.5">
                          {wf.steps.map((step, si) => (
                            <StepRow
                              key={step.id}
                              step={step}
                              index={si}
                              workflowId={wf.id}
                              allSteps={wf.steps}
                              agents={agents}
                              allTasks={allTasks}
                              onUpdate={updateWorkflowStep}
                              onRemove={removeWorkflowStep}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Visual flow mini-preview */}
                    {wf.steps.length > 1 && (
                      <div className="mt-2 p-2 rounded-lg bg-secondary/20 border border-border/20">
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase mb-1.5">Fluxo</p>
                        <div className="flex items-center gap-1 flex-wrap">
                          {wf.steps.map((step, i) => {
                            const agent = agents.find(a => a.slug === step.agentSlug);
                            const hasDeps = (step.dependsOn || []).length > 0;
                            return (
                              <div key={step.id} className="flex items-center gap-1">
                                {i > 0 && (
                                  <ArrowRight className={cn(
                                    'w-3 h-3 shrink-0',
                                    hasDeps ? 'text-primary' : 'text-muted-foreground/40'
                                  )} />
                                )}
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium whitespace-nowrap">
                                  {agent?.name || step.agentSlug}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
            <DialogTitle>Criar Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Pipeline de Desenvolvimento"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Objetivo do workflow..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select value={form.trigger} onValueChange={(v) => setForm(f => ({ ...f, trigger: v as WorkflowTrigger }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={!form.name.trim()}>
              Criar Workflow
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Individual step row ──

interface StepRowProps {
  step: WorkflowStep;
  index: number;
  workflowId: string;
  allSteps: WorkflowStep[];
  agents: { slug: string; name: string }[];
  allTasks: { id: string; name: string; squadName: string }[];
  onUpdate: (workflowId: string, stepId: string, data: Partial<WorkflowStep>) => void;
  onRemove: (workflowId: string, stepId: string) => void;
}

function StepRow({ step, index, workflowId, allSteps, agents, allTasks, onUpdate, onRemove }: StepRowProps) {
  const [showDetails, setShowDetails] = useState(false);
  const otherSteps = allSteps.filter(s => s.id !== step.id);
  const depNames = (step.dependsOn || [])
    .map(depId => allSteps.find(s => s.id === depId)?.name)
    .filter(Boolean);

  return (
    <div className="bg-secondary/30 rounded-md px-2.5 py-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground font-mono text-[10px] w-4 shrink-0">{index + 1}.</span>
        <Input
          className="h-5 text-xs bg-transparent border-none p-0 flex-1"
          value={step.name}
          onChange={(e) => onUpdate(workflowId, step.id, { name: e.target.value })}
        />
        <select
          className="h-5 text-[10px] bg-transparent border border-border/30 rounded px-1 text-muted-foreground max-w-[100px]"
          value={step.agentSlug}
          onChange={(e) => onUpdate(workflowId, step.id, { agentSlug: e.target.value })}
        >
          <option value="">-- agente --</option>
          {agents.map(a => (
            <option key={a.slug} value={a.slug}>{a.name}</option>
          ))}
        </select>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-muted-foreground/70 hover:text-foreground transition-colors"
          title="Detalhes"
        >
          {showDetails ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        <button
          onClick={() => onRemove(workflowId, step.id)}
          className="text-muted-foreground/70 hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Dependencies chips */}
      {depNames.length > 0 && !showDetails && (
        <div className="flex items-center gap-1 pl-5">
          <span className="text-[9px] text-muted-foreground">deps:</span>
          {depNames.map((name, i) => (
            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{name}</span>
          ))}
        </div>
      )}

      {showDetails && (
        <div className="pl-5 space-y-2 pt-1">
          {/* Task */}
          <div className="flex items-center gap-2">
            <Label className="text-[9px] w-14 shrink-0">Task</Label>
            <select
              className="h-5 text-[10px] bg-transparent border border-border/30 rounded px-1 text-muted-foreground flex-1"
              value={step.taskId || ''}
              onChange={(e) => onUpdate(workflowId, step.id, { taskId: e.target.value || undefined })}
            >
              <option value="">(nenhuma)</option>
              {allTasks.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.squadName})</option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div className="flex items-center gap-2">
            <Label className="text-[9px] w-14 shrink-0">Condicao</Label>
            <Input
              className="h-5 text-[10px] bg-transparent border-border/30 p-0 px-1 flex-1"
              value={step.condition || ''}
              onChange={(e) => onUpdate(workflowId, step.id, { condition: e.target.value || undefined })}
              placeholder="Ex: resultado.status === 'ok'"
            />
          </div>

          {/* Dependencies */}
          <div className="flex items-start gap-2">
            <Label className="text-[9px] w-14 shrink-0 pt-1">Deps</Label>
            <div className="flex-1 space-y-1">
              <div className="flex gap-1 flex-wrap">
                {otherSteps.map(os => {
                  const isDep = (step.dependsOn || []).includes(os.id);
                  return (
                    <button
                      key={os.id}
                      onClick={() => {
                        const current = step.dependsOn || [];
                        const next = isDep
                          ? current.filter(d => d !== os.id)
                          : [...current, os.id];
                        onUpdate(workflowId, step.id, { dependsOn: next });
                      }}
                      className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded border transition-colors',
                        isDep
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border/30 text-muted-foreground hover:border-primary/20'
                      )}
                    >
                      {os.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
