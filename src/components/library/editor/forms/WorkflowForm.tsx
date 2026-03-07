/**
 * @agent     WorkflowForm
 * @persona   Formulario de edicao de Workflow no editor da Library
 * @commands  render
 * @context   Secoes: identidade, steps (colapsaveis com reorder), triggers, outputs, config. Com ajuda contextual.
 */

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Sparkles, ArrowUp, ArrowDown, ChevronRight, ChevronDown } from 'lucide-react';
import { LabelWithHelp } from '@/components/library/editor/FieldHelp';
import { FIELD_HELP } from '@/data/editor-field-help';
import type { WorkflowFormData } from '@/types/library';

const H = FIELD_HELP.workflow;

interface WorkflowFormProps {
  data: WorkflowFormData;
  onChange: (field: string, value: unknown) => void;
  onAiRequest?: (prompt: string) => void;
}

export default function WorkflowForm({ data, onChange, onAiRequest }: WorkflowFormProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]));

  const addStep = () => {
    const newIdx = data.steps.length;
    onChange('steps', [...data.steps, { name: '', agentSlug: '', task: '', exitCondition: '' }]);
    setExpandedSteps(prev => new Set(prev).add(newIdx));
  };
  const removeStep = (i: number) => {
    onChange('steps', data.steps.filter((_, idx) => idx !== i));
    setExpandedSteps(prev => {
      const next = new Set<number>();
      prev.forEach(v => { if (v < i) next.add(v); else if (v > i) next.add(v - 1); });
      return next;
    });
  };
  const updateStep = (i: number, field: string, value: string) => {
    const arr = [...data.steps]; arr[i] = { ...arr[i], [field]: value }; onChange('steps', arr);
  };
  const moveStep = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= data.steps.length) return;
    const arr = [...data.steps]; [arr[i], arr[t]] = [arr[t], arr[i]]; onChange('steps', arr);
    setExpandedSteps(prev => {
      const next = new Set<number>();
      prev.forEach(v => {
        if (v === i) next.add(t);
        else if (v === t) next.add(i);
        else next.add(v);
      });
      return next;
    });
  };
  const toggleStep = (idx: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const addTrigger = () => onChange('triggers', [...data.triggers, { type: 'manual', description: '' }]);
  const removeTrigger = (i: number) => onChange('triggers', data.triggers.filter((_, idx) => idx !== i));
  const moveTrigger = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= data.triggers.length) return;
    const arr = [...data.triggers]; [arr[i], arr[t]] = [arr[t], arr[i]]; onChange('triggers', arr);
  };

  const addOutput = () => onChange('outputs', [...data.outputs, { name: '', type: 'string', description: '' }]);
  const removeOutput = (i: number) => onChange('outputs', data.outputs.filter((_, idx) => idx !== i));
  const moveOutput = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= data.outputs.length) return;
    const arr = [...data.outputs]; [arr[i], arr[t]] = [arr[t], arr[i]]; onChange('outputs', arr);
  };

  return (
    <Accordion type="multiple" defaultValue={['identity', 'steps']} className="space-y-2">
      <AccordionItem value="identity" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Identidade</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div><LabelWithHelp help={H.name}>Nome</LabelWithHelp><Input value={data.name} onChange={e => onChange('name', e.target.value)} placeholder="Ex: PR Review Pipeline" className="mt-1" /></div>
          <div><LabelWithHelp help={H.slug}>Slug</LabelWithHelp><Input value={data.slug} onChange={e => onChange('slug', e.target.value)} placeholder="Ex: pr-review-pipeline" className="mt-1 font-mono text-xs" /></div>
          <div><LabelWithHelp help={H.description}>Descricao</LabelWithHelp><Textarea value={data.description} onChange={e => onChange('description', e.target.value)} placeholder="Ex: Pipeline que analisa PRs, executa revisao e gera relatorio." className="mt-1" rows={2} /></div>
          <div>
            <LabelWithHelp help={H.pattern}>Pattern</LabelWithHelp>
            <Select value={data.pattern} onValueChange={v => onChange('pattern', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sequential">Sequential — steps executam em sequencia</SelectItem>
                <SelectItem value="parallel">Parallel — steps executam simultaneamente</SelectItem>
                <SelectItem value="conditional">Conditional — steps baseados em condicoes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="steps" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Steps ({data.steps.length})</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <LabelWithHelp help={H.steps}>Etapas do workflow</LabelWithHelp>
          {data.steps.map((step, i) => (
            <Collapsible key={i} open={expandedSteps.has(i)} onOpenChange={() => toggleStep(i)}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/50 hover:bg-secondary/80 transition-colors text-left">
                  {expandedSteps.has(i) ? <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground" />}
                  <span className="text-[10px] text-muted-foreground font-mono w-5">#{i + 1}</span>
                  <span className="text-xs font-medium truncate flex-1">{step.name || '(sem nome)'}</span>
                  {step.agentSlug && <Badge variant="outline" className="text-[9px] font-mono shrink-0 opacity-60">{step.agentSlug}</Badge>}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-5 mr-2 mt-1 mb-2 p-3 rounded-md border border-border/50 bg-background/60 space-y-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Nome do step</Label>
                    <Input value={step.name} onChange={e => updateStep(i, 'name', e.target.value)} placeholder="Ex: Code Review" className="text-xs h-8 mt-0.5" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Agente responsavel (slug)</Label>
                    <Input value={step.agentSlug} onChange={e => updateStep(i, 'agentSlug', e.target.value)} placeholder="Ex: code-reviewer" className="text-xs h-8 font-mono mt-0.5" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Task vinculada</Label>
                    <Input value={step.task} onChange={e => updateStep(i, 'task', e.target.value)} placeholder="Ex: Revisar arquivos alterados" className="text-xs h-8 mt-0.5" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Condicao de saida</Label>
                    <Input value={step.exitCondition} onChange={e => updateStep(i, 'exitCondition', e.target.value)} placeholder="Ex: Relatorio sem vulnerabilidades criticas" className="text-xs h-8 mt-0.5" />
                  </div>
                  <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/30">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveStep(i, -1)} disabled={i === 0}><ArrowUp className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveStep(i, 1)} disabled={i === data.steps.length - 1}><ArrowDown className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeStep(i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addStep}><Plus className="w-3 h-3" /> Step</Button>
            {onAiRequest && <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => onAiRequest('Gere steps para este workflow dado seu objetivo e pattern.')}><Sparkles className="w-3 h-3" /> Gerar</Button>}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="triggers" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Triggers ({data.triggers.length})</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <LabelWithHelp help={H.triggers}>Eventos de disparo</LabelWithHelp>
          {data.triggers.map((trg, i) => (
            <div key={i} className="flex gap-2 items-start p-2.5 rounded-md bg-secondary/50">
              <span className="text-[10px] text-muted-foreground font-mono mt-1.5 w-5 shrink-0">#{i + 1}</span>
              <div className="flex-1 grid grid-cols-2 gap-1.5">
                <Select value={trg.type} onValueChange={v => { const arr = [...data.triggers]; arr[i] = { ...arr[i], type: v }; onChange('triggers', arr); }}>
                  <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['manual', 'event', 'schedule', 'webhook'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input value={trg.description} onChange={e => { const arr = [...data.triggers]; arr[i] = { ...arr[i], description: e.target.value }; onChange('triggers', arr); }} placeholder="Ex: Novo PR aberto" className="text-xs h-8" />
              </div>
              <div className="flex flex-col gap-0.5 shrink-0">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveTrigger(i, -1)} disabled={i === 0}><ArrowUp className="w-3 h-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveTrigger(i, 1)} disabled={i === data.triggers.length - 1}><ArrowDown className="w-3 h-3" /></Button>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => removeTrigger(i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addTrigger}><Plus className="w-3 h-3" /> Trigger</Button>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="outputs" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Outputs ({data.outputs.length})</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <LabelWithHelp help={H.outputs}>Resultados do workflow</LabelWithHelp>
          {data.outputs.map((out, i) => (
            <div key={i} className="flex gap-2 items-start p-2.5 rounded-md bg-secondary/50">
              <span className="text-[10px] text-muted-foreground font-mono mt-1.5 w-5 shrink-0">#{i + 1}</span>
              <div className="flex-1 grid grid-cols-2 gap-1.5">
                <Input value={out.name} onChange={e => { const arr = [...data.outputs]; arr[i] = { ...arr[i], name: e.target.value }; onChange('outputs', arr); }} placeholder="Ex: review_report" className="text-xs h-8" />
                <Input value={out.description} onChange={e => { const arr = [...data.outputs]; arr[i] = { ...arr[i], description: e.target.value }; onChange('outputs', arr); }} placeholder="Ex: Relatorio consolidado em JSON" className="text-xs h-8" />
              </div>
              <div className="flex flex-col gap-0.5 shrink-0">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveOutput(i, -1)} disabled={i === 0}><ArrowUp className="w-3 h-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveOutput(i, 1)} disabled={i === data.outputs.length - 1}><ArrowDown className="w-3 h-3" /></Button>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => removeOutput(i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addOutput}><Plus className="w-3 h-3" /> Output</Button>
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
            <Input placeholder="Ex: pipeline, ci-cd, automation (Enter)" onKeyDown={e => { if (e.key === 'Enter') { const v = (e.target as HTMLInputElement).value; if (v && !data.tags.includes(v)) onChange('tags', [...data.tags, v]); (e.target as HTMLInputElement).value = ''; e.preventDefault(); } }} className="text-xs" />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
