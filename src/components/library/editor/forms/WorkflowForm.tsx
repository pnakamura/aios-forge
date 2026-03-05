/**
 * @agent     WorkflowForm
 * @persona   Formulario de edicao de Workflow no editor da Library
 * @commands  render
 * @context   Secoes: identidade, steps, triggers, outputs, config.
 */

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import type { WorkflowFormData } from '@/types/library';

interface WorkflowFormProps {
  data: WorkflowFormData;
  onChange: (field: string, value: unknown) => void;
  onAiRequest?: (prompt: string) => void;
}

export default function WorkflowForm({ data, onChange, onAiRequest }: WorkflowFormProps) {
  const addStep = () => onChange('steps', [...data.steps, { name: '', agentSlug: '', task: '', exitCondition: '' }]);
  const removeStep = (i: number) => onChange('steps', data.steps.filter((_, idx) => idx !== i));
  const updateStep = (i: number, field: string, value: string) => {
    const arr = [...data.steps]; arr[i] = { ...arr[i], [field]: value }; onChange('steps', arr);
  };

  const addTrigger = () => onChange('triggers', [...data.triggers, { type: 'manual', description: '' }]);
  const removeTrigger = (i: number) => onChange('triggers', data.triggers.filter((_, idx) => idx !== i));

  const addOutput = () => onChange('outputs', [...data.outputs, { name: '', type: 'string', description: '' }]);
  const removeOutput = (i: number) => onChange('outputs', data.outputs.filter((_, idx) => idx !== i));

  return (
    <Accordion type="multiple" defaultValue={['identity', 'steps']} className="space-y-2">
      <AccordionItem value="identity" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Identidade</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div><Label className="text-xs">Nome</Label><Input value={data.name} onChange={e => onChange('name', e.target.value)} className="mt-1" /></div>
          <div><Label className="text-xs">Slug</Label><Input value={data.slug} onChange={e => onChange('slug', e.target.value)} className="mt-1 font-mono text-xs" /></div>
          <div><Label className="text-xs">Descricao</Label><Textarea value={data.description} onChange={e => onChange('description', e.target.value)} className="mt-1" rows={2} /></div>
          <div>
            <Label className="text-xs">Pattern</Label>
            <Select value={data.pattern} onValueChange={v => onChange('pattern', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sequential">Sequential</SelectItem>
                <SelectItem value="parallel">Parallel</SelectItem>
                <SelectItem value="conditional">Conditional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="steps" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Steps ({data.steps.length})</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          {data.steps.map((step, i) => (
            <div key={i} className="space-y-1.5 p-2 rounded-md bg-secondary/50">
              <div className="flex justify-between gap-2">
                <Input value={step.name} onChange={e => updateStep(i, 'name', e.target.value)} placeholder="Nome do step" className="text-xs h-8" />
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => removeStep(i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
              <Input value={step.agentSlug} onChange={e => updateStep(i, 'agentSlug', e.target.value)} placeholder="Agente responsavel (slug)" className="text-xs h-8 font-mono" />
              <Input value={step.task} onChange={e => updateStep(i, 'task', e.target.value)} placeholder="Task vinculada" className="text-xs h-8" />
              <Input value={step.exitCondition} onChange={e => updateStep(i, 'exitCondition', e.target.value)} placeholder="Condicao de saida" className="text-xs h-8" />
            </div>
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
          {data.triggers.map((trg, i) => (
            <div key={i} className="flex gap-2 items-start p-2 rounded-md bg-secondary/50">
              <div className="flex-1 grid grid-cols-2 gap-1.5">
                <Select value={trg.type} onValueChange={v => { const arr = [...data.triggers]; arr[i] = { ...arr[i], type: v }; onChange('triggers', arr); }}>
                  <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['manual', 'event', 'schedule', 'webhook'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input value={trg.description} onChange={e => { const arr = [...data.triggers]; arr[i] = { ...arr[i], description: e.target.value }; onChange('triggers', arr); }} placeholder="Descricao" className="text-xs h-8" />
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
          {data.outputs.map((out, i) => (
            <div key={i} className="flex gap-2 items-start p-2 rounded-md bg-secondary/50">
              <div className="flex-1 grid grid-cols-2 gap-1.5">
                <Input value={out.name} onChange={e => { const arr = [...data.outputs]; arr[i] = { ...arr[i], name: e.target.value }; onChange('outputs', arr); }} placeholder="Nome" className="text-xs h-8" />
                <Input value={out.description} onChange={e => { const arr = [...data.outputs]; arr[i] = { ...arr[i], description: e.target.value }; onChange('outputs', arr); }} placeholder="Descricao" className="text-xs h-8" />
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
            <Label className="text-xs">Elemento publico</Label>
            <Switch checked={data.isPublic} onCheckedChange={v => onChange('isPublic', v)} />
          </div>
          <div>
            <Label className="text-xs mb-2 block">Tags</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {data.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px] cursor-pointer" onClick={() => onChange('tags', data.tags.filter(x => x !== t))}>{t} ×</Badge>)}
            </div>
            <Input placeholder="Adicionar tag (Enter)" onKeyDown={e => { if (e.key === 'Enter') { const v = (e.target as HTMLInputElement).value; if (v && !data.tags.includes(v)) onChange('tags', [...data.tags, v]); (e.target as HTMLInputElement).value = ''; e.preventDefault(); } }} className="text-xs" />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
