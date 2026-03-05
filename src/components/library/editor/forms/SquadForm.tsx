/**
 * @agent     SquadForm
 * @persona   Formulario de edicao de Squad no editor da Library
 * @commands  render
 * @context   Secoes: identidade, agentes, tasks, config.
 */

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import type { SquadFormData } from '@/types/library';

interface SquadFormProps {
  data: SquadFormData;
  onChange: (field: string, value: unknown) => void;
  onAiRequest?: (prompt: string) => void;
}

export default function SquadForm({ data, onChange, onAiRequest }: SquadFormProps) {
  const addTask = () => onChange('tasks', [...data.tasks, { name: '', description: '', agentSlug: '', dependencies: [] }]);
  const removeTask = (i: number) => onChange('tasks', data.tasks.filter((_, idx) => idx !== i));
  const updateTask = (i: number, field: string, value: unknown) => {
    const arr = [...data.tasks]; arr[i] = { ...arr[i], [field]: value }; onChange('tasks', arr);
  };

  return (
    <Accordion type="multiple" defaultValue={['identity', 'agents', 'tasks']} className="space-y-2">
      <AccordionItem value="identity" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Identidade</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div><Label className="text-xs">Nome</Label><Input value={data.name} onChange={e => onChange('name', e.target.value)} className="mt-1" /></div>
          <div><Label className="text-xs">Slug</Label><Input value={data.slug} onChange={e => onChange('slug', e.target.value)} className="mt-1 font-mono text-xs" /></div>
          <div><Label className="text-xs">Descricao</Label><Textarea value={data.description} onChange={e => onChange('description', e.target.value)} className="mt-1" rows={2} /></div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="agents" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Agentes ({data.agentSlugs.length})</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div className="flex flex-wrap gap-1 mb-2">
            {data.agentSlugs.map(slug => (
              <Badge key={slug} variant="secondary" className="text-[10px] cursor-pointer" onClick={() => onChange('agentSlugs', data.agentSlugs.filter(s => s !== slug))}>
                {slug} ×
              </Badge>
            ))}
          </div>
          <Input placeholder="Adicionar slug do agente (Enter)" onKeyDown={e => {
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
          {data.tasks.map((task, i) => (
            <div key={i} className="space-y-1.5 p-2 rounded-md bg-secondary/50">
              <div className="flex justify-between gap-2">
                <Input value={task.name} onChange={e => updateTask(i, 'name', e.target.value)} placeholder="Nome da task" className="text-xs h-8" />
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => removeTask(i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
              <Input value={task.description} onChange={e => updateTask(i, 'description', e.target.value)} placeholder="Descricao" className="text-xs h-8" />
              <Input value={task.agentSlug} onChange={e => updateTask(i, 'agentSlug', e.target.value)} placeholder="Agente responsavel (slug)" className="text-xs h-8 font-mono" />
            </div>
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
