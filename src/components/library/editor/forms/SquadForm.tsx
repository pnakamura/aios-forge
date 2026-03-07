/**
 * @agent     SquadForm
 * @persona   Formulario de edicao de Squad no editor da Library
 * @commands  render
 * @context   Secoes: identidade, agentes, tasks (com dependencies e reorder, colapsaveis), config. Com ajuda contextual.
 */

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Sparkles, ArrowUp, ArrowDown, ChevronRight, ChevronDown } from 'lucide-react';
import { LabelWithHelp } from '@/components/library/editor/FieldHelp';
import { FIELD_HELP } from '@/data/editor-field-help';
import type { SquadFormData } from '@/types/library';

const H = FIELD_HELP.squad;

interface SquadFormProps {
  data: SquadFormData;
  onChange: (field: string, value: unknown) => void;
  onAiRequest?: (prompt: string) => void;
}

export default function SquadForm({ data, onChange, onAiRequest }: SquadFormProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set([0]));

  const addTask = () => {
    const newIdx = data.tasks.length;
    onChange('tasks', [...data.tasks, { name: '', description: '', agentSlug: '', dependencies: [] }]);
    setExpandedTasks(prev => new Set(prev).add(newIdx));
  };
  const removeTask = (i: number) => {
    onChange('tasks', data.tasks.filter((_, idx) => idx !== i));
    setExpandedTasks(prev => {
      const next = new Set<number>();
      prev.forEach(v => { if (v < i) next.add(v); else if (v > i) next.add(v - 1); });
      return next;
    });
  };
  const updateTask = (i: number, field: string, value: unknown) => {
    const arr = [...data.tasks]; arr[i] = { ...arr[i], [field]: value }; onChange('tasks', arr);
  };
  const moveTask = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= data.tasks.length) return;
    const arr = [...data.tasks]; [arr[i], arr[t]] = [arr[t], arr[i]]; onChange('tasks', arr);
    setExpandedTasks(prev => {
      const next = new Set<number>();
      prev.forEach(v => {
        if (v === i) next.add(t);
        else if (v === t) next.add(i);
        else next.add(v);
      });
      return next;
    });
  };
  const toggleTask = (idx: number) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  // Task names for dependency picker
  const taskNames = data.tasks.map(t => t.name).filter(Boolean);

  return (
    <Accordion type="multiple" defaultValue={['identity', 'agents', 'tasks']} className="space-y-2">
      <AccordionItem value="identity" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Identidade</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div><LabelWithHelp help={H.name}>Nome</LabelWithHelp><Input value={data.name} onChange={e => onChange('name', e.target.value)} placeholder="Ex: Security Review Team" className="mt-1" /></div>
          <div><LabelWithHelp help={H.slug}>Slug</LabelWithHelp><Input value={data.slug} onChange={e => onChange('slug', e.target.value)} placeholder="Ex: security-review-team" className="mt-1 font-mono text-xs" /></div>
          <div><LabelWithHelp help={H.description}>Descricao</LabelWithHelp><Textarea value={data.description} onChange={e => onChange('description', e.target.value)} placeholder="Ex: Equipe responsavel por revisao de seguranca de codigo e compliance." className="mt-1" rows={2} /></div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="agents" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Agentes ({data.agentSlugs.length})</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <LabelWithHelp help={H.agentSlugs}>Slugs dos agentes</LabelWithHelp>
          <div className="flex flex-wrap gap-1 mb-2">
            {data.agentSlugs.map(slug => (
              <Badge key={slug} variant="secondary" className="text-[10px] cursor-pointer" onClick={() => onChange('agentSlugs', data.agentSlugs.filter(s => s !== slug))}>
                {slug} ×
              </Badge>
            ))}
          </div>
          <Input placeholder="Ex: code-reviewer, security-auditor (Enter)" onKeyDown={e => {
            if (e.key === 'Enter') {
              const v = (e.target as HTMLInputElement).value.trim();
              if (v && !data.agentSlugs.includes(v)) onChange('agentSlugs', [...data.agentSlugs, v]);
              (e.target as HTMLInputElement).value = '';
              e.preventDefault();
            }
          }} className="text-xs" />
          {onAiRequest && <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => onAiRequest('Recomende agentes para este squad dado sua descricao e tarefas.')}><Sparkles className="w-3 h-3" /> Recomendar</Button>}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="tasks" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Tasks ({data.tasks.length})</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <LabelWithHelp help={H.tasks}>Tarefas do squad</LabelWithHelp>
          {data.tasks.map((task, i) => (
            <Collapsible key={i} open={expandedTasks.has(i)} onOpenChange={() => toggleTask(i)}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/50 hover:bg-secondary/80 transition-colors text-left">
                  {expandedTasks.has(i) ? <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground" />}
                  <span className="text-[10px] text-muted-foreground font-mono w-5">#{i + 1}</span>
                  <span className="text-xs font-medium truncate flex-1">{task.name || '(sem nome)'}</span>
                  {task.agentSlug && <Badge variant="outline" className="text-[9px] font-mono shrink-0 opacity-60">{task.agentSlug}</Badge>}
                  {task.dependencies.length > 0 && <Badge variant="secondary" className="text-[9px] shrink-0">{task.dependencies.length} deps</Badge>}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-5 mr-2 mt-1 mb-2 p-3 rounded-md border border-border/50 bg-background/60 space-y-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Nome da task</Label>
                    <Input value={task.name} onChange={e => updateTask(i, 'name', e.target.value)} placeholder="Ex: Revisar PR" className="text-xs h-8 mt-0.5" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Descricao</Label>
                    <Textarea value={task.description} onChange={e => updateTask(i, 'description', e.target.value)} placeholder="Ex: Analisa arquivos alterados no PR e gera relatorio" className="text-xs mt-0.5" rows={2} />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Agente responsavel (slug)</Label>
                    <Input value={task.agentSlug} onChange={e => updateTask(i, 'agentSlug', e.target.value)} placeholder="Ex: code-reviewer" className="text-xs h-8 font-mono mt-0.5" />
                    {data.agentSlugs.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {data.agentSlugs.map(s => (
                          <button key={s} type="button" onClick={() => updateTask(i, 'agentSlug', s)} className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${task.agentSlug === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <LabelWithHelp help={H.taskDependencies} className="mb-1"><span className="text-[10px] text-muted-foreground">Dependencias</span></LabelWithHelp>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {task.dependencies.map(dep => (
                        <Badge key={dep} variant="secondary" className="text-[9px] cursor-pointer" onClick={() => updateTask(i, 'dependencies', task.dependencies.filter(d => d !== dep))}>
                          {dep} ×
                        </Badge>
                      ))}
                    </div>
                    {taskNames.filter(n => n !== task.name && !task.dependencies.includes(n)).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {taskNames.filter(n => n !== task.name && !task.dependencies.includes(n)).map(n => (
                          <button key={n} type="button" onClick={() => updateTask(i, 'dependencies', [...task.dependencies, n])} className="text-[9px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:border-primary/50 transition-colors">
                            + {n}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/30">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveTask(i, -1)} disabled={i === 0}><ArrowUp className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveTask(i, 1)} disabled={i === data.tasks.length - 1}><ArrowDown className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeTask(i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addTask}><Plus className="w-3 h-3" /> Task</Button>
            {onAiRequest && <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => onAiRequest('Gere tasks para este squad com base na descricao e agentes.')}><Sparkles className="w-3 h-3" /> Gerar</Button>}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="config" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Configuracoes</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div className="flex items-center justify-between">
            <LabelWithHelp help={H.isPublic}>Elemento publico</LabelWithHelp>
            <Switch checked={data.isPublic} onCheckedChange={v => onChange('isPublic', v)} />
          </div>
          <div>
            <LabelWithHelp help={H.tags} className="mb-2">Tags</LabelWithHelp>
            <div className="flex flex-wrap gap-1 mb-2">
              {data.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px] cursor-pointer" onClick={() => onChange('tags', data.tags.filter(x => x !== t))}>{t} ×</Badge>)}
            </div>
            <Input placeholder="Ex: security, review, compliance (Enter)" onKeyDown={e => { if (e.key === 'Enter') { const v = (e.target as HTMLInputElement).value; if (v && !data.tags.includes(v)) onChange('tags', [...data.tags, v]); (e.target as HTMLInputElement).value = ''; e.preventDefault(); } }} className="text-xs" />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
