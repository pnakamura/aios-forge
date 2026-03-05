/**
 * @agent     SkillForm
 * @persona   Formulario de edicao de Skill no editor da Library
 * @commands  render
 * @context   Secoes: identidade, prompt, inputs, outputs, exemplos, config.
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
import type { SkillFormData } from '@/types/library';

interface SkillFormProps {
  data: SkillFormData;
  onChange: (field: string, value: unknown) => void;
  onAiRequest?: (prompt: string) => void;
}

export default function SkillForm({ data, onChange, onAiRequest }: SkillFormProps) {
  const addInput = () => onChange('inputs', [...data.inputs, { name: '', type: 'string', description: '', required: true }]);
  const removeInput = (i: number) => onChange('inputs', data.inputs.filter((_, idx) => idx !== i));
  const updateInput = (i: number, field: string, value: unknown) => {
    const arr = [...data.inputs]; arr[i] = { ...arr[i], [field]: value }; onChange('inputs', arr);
  };

  const addOutput = () => onChange('outputs', [...data.outputs, { name: '', type: 'string', description: '' }]);
  const removeOutput = (i: number) => onChange('outputs', data.outputs.filter((_, idx) => idx !== i));
  const updateOutput = (i: number, field: string, value: string) => {
    const arr = [...data.outputs]; arr[i] = { ...arr[i], [field]: value }; onChange('outputs', arr);
  };

  const addExample = () => onChange('examples', [...data.examples, { title: '', input: '', output: '' }]);
  const removeExample = (i: number) => onChange('examples', data.examples.filter((_, idx) => idx !== i));

  return (
    <Accordion type="multiple" defaultValue={['identity', 'prompt', 'inputs']} className="space-y-2">
      <AccordionItem value="identity" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Identidade</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div><Label className="text-xs">Nome</Label><Input value={data.name} onChange={e => onChange('name', e.target.value)} className="mt-1" /></div>
          <div><Label className="text-xs">Slug</Label><Input value={data.slug} onChange={e => onChange('slug', e.target.value)} className="mt-1 font-mono text-xs" /></div>
          <div><Label className="text-xs">Descricao</Label><Textarea value={data.description} onChange={e => onChange('description', e.target.value)} className="mt-1" rows={2} /></div>
          <div>
            <Label className="text-xs">Categoria</Label>
            <Select value={data.category} onValueChange={v => onChange('category', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['analysis', 'coding', 'communication', 'research', 'general'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="prompt" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Prompt da Skill</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Instrucao</Label>
            {onAiRequest && <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => onAiRequest('Gere um prompt para esta skill com secoes OBJECTIVE e CONSTRAINTS.')}><Sparkles className="w-3 h-3" /> Gerar</Button>}
          </div>
          <Textarea value={data.prompt} onChange={e => onChange('prompt', e.target.value)} className="font-mono text-xs min-h-[150px]" placeholder="# OBJECTIVE&#10;...&#10;# CONSTRAINTS&#10;..." />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="inputs" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Inputs ({data.inputs.length})</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          {data.inputs.map((inp, i) => (
            <div key={i} className="flex gap-2 items-start p-2 rounded-md bg-secondary/50">
              <div className="flex-1 grid grid-cols-2 gap-1.5">
                <Input value={inp.name} onChange={e => updateInput(i, 'name', e.target.value)} placeholder="Nome" className="text-xs h-8" />
                <Select value={inp.type} onValueChange={v => updateInput(i, 'type', v)}>
                  <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{['string', 'json', 'file', 'url', 'markdown', 'code'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={inp.description} onChange={e => updateInput(i, 'description', e.target.value)} placeholder="Descricao" className="text-xs h-8 col-span-2" />
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => removeInput(i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addInput}><Plus className="w-3 h-3" /> Input</Button>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="outputs" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Outputs ({data.outputs.length})</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          {data.outputs.map((out, i) => (
            <div key={i} className="flex gap-2 items-start p-2 rounded-md bg-secondary/50">
              <div className="flex-1 grid grid-cols-2 gap-1.5">
                <Input value={out.name} onChange={e => updateOutput(i, 'name', e.target.value)} placeholder="Nome" className="text-xs h-8" />
                <Select value={out.type} onValueChange={v => updateOutput(i, 'type', v)}>
                  <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{['string', 'json', 'file', 'url', 'markdown', 'code'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={out.description} onChange={e => updateOutput(i, 'description', e.target.value)} placeholder="Descricao" className="text-xs h-8 col-span-2" />
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => removeOutput(i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addOutput}><Plus className="w-3 h-3" /> Output</Button>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="examples" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Exemplos ({data.examples.length})</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          {data.examples.map((ex, i) => (
            <div key={i} className="space-y-1.5 p-2 rounded-md bg-secondary/50">
              <div className="flex justify-between"><Input value={ex.title} onChange={e => { const arr = [...data.examples]; arr[i] = { ...arr[i], title: e.target.value }; onChange('examples', arr); }} placeholder="Titulo" className="text-xs h-8" /><Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeExample(i)}><Trash2 className="w-3 h-3 text-destructive" /></Button></div>
              <Textarea value={ex.input} onChange={e => { const arr = [...data.examples]; arr[i] = { ...arr[i], input: e.target.value }; onChange('examples', arr); }} placeholder="Input de exemplo" className="text-xs font-mono" rows={2} />
              <Textarea value={ex.output} onChange={e => { const arr = [...data.examples]; arr[i] = { ...arr[i], output: e.target.value }; onChange('examples', arr); }} placeholder="Output esperado" className="text-xs font-mono" rows={2} />
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addExample}><Plus className="w-3 h-3" /> Exemplo</Button>
            {onAiRequest && <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => onAiRequest('Gere 2-3 exemplos de uso para esta skill.')}><Sparkles className="w-3 h-3" /> Gerar</Button>}
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
