/**
 * @agent     SkillForm
 * @persona   Formulario de edicao de Skill no editor da Library
 * @commands  render
 * @context   Secoes: identidade, prompt, inputs (com required toggle e reorder), outputs (com reorder), exemplos (colapsaveis com reorder), config. Com ajuda contextual.
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
import type { SkillFormData } from '@/types/library';

const H = FIELD_HELP.skill;

interface SkillFormProps {
  data: SkillFormData;
  onChange: (field: string, value: unknown) => void;
  onAiRequest?: (prompt: string) => void;
}

export default function SkillForm({ data, onChange, onAiRequest }: SkillFormProps) {
  const [expandedExamples, setExpandedExamples] = useState<Set<number>>(new Set([0]));

  const addInput = () => onChange('inputs', [...data.inputs, { name: '', type: 'string', description: '', required: true }]);
  const removeInput = (i: number) => onChange('inputs', data.inputs.filter((_, idx) => idx !== i));
  const updateInput = (i: number, field: string, value: unknown) => {
    const arr = [...data.inputs]; arr[i] = { ...arr[i], [field]: value }; onChange('inputs', arr);
  };
  const moveInput = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= data.inputs.length) return;
    const arr = [...data.inputs]; [arr[i], arr[t]] = [arr[t], arr[i]]; onChange('inputs', arr);
  };

  const addOutput = () => onChange('outputs', [...data.outputs, { name: '', type: 'string', description: '' }]);
  const removeOutput = (i: number) => onChange('outputs', data.outputs.filter((_, idx) => idx !== i));
  const updateOutput = (i: number, field: string, value: string) => {
    const arr = [...data.outputs]; arr[i] = { ...arr[i], [field]: value }; onChange('outputs', arr);
  };
  const moveOutput = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= data.outputs.length) return;
    const arr = [...data.outputs]; [arr[i], arr[t]] = [arr[t], arr[i]]; onChange('outputs', arr);
  };

  const addExample = () => {
    const newIdx = data.examples.length;
    onChange('examples', [...data.examples, { title: '', input: '', output: '' }]);
    setExpandedExamples(prev => new Set(prev).add(newIdx));
  };
  const removeExample = (i: number) => onChange('examples', data.examples.filter((_, idx) => idx !== i));
  const moveExample = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= data.examples.length) return;
    const arr = [...data.examples]; [arr[i], arr[t]] = [arr[t], arr[i]]; onChange('examples', arr);
  };
  const toggleExample = (idx: number) => {
    setExpandedExamples(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <Accordion type="multiple" defaultValue={['identity', 'prompt', 'inputs']} className="space-y-2">
      <AccordionItem value="identity" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Identidade</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div><LabelWithHelp help={H.name}>Nome</LabelWithHelp><Input value={data.name} onChange={e => onChange('name', e.target.value)} placeholder="Ex: Code Analysis" className="mt-1" /></div>
          <div><LabelWithHelp help={H.slug}>Slug</LabelWithHelp><Input value={data.slug} onChange={e => onChange('slug', e.target.value)} placeholder="Ex: code-analysis" className="mt-1 font-mono text-xs" /></div>
          <div><LabelWithHelp help={H.description}>Descricao</LabelWithHelp><Textarea value={data.description} onChange={e => onChange('description', e.target.value)} placeholder="Ex: Analisa codigo e retorna relatorio com vulnerabilidades." className="mt-1" rows={2} /></div>
          <div>
            <LabelWithHelp help={H.category}>Categoria</LabelWithHelp>
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
            <LabelWithHelp help={H.prompt}>Instrucao</LabelWithHelp>
            {onAiRequest && <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => onAiRequest('Gere um prompt para esta skill com secoes OBJECTIVE e CONSTRAINTS.')}><Sparkles className="w-3 h-3" /> Gerar</Button>}
          </div>
          <Textarea value={data.prompt} onChange={e => onChange('prompt', e.target.value)} className="font-mono text-xs min-h-[150px]" placeholder="# OBJECTIVE&#10;Analise o codigo fornecido e identifique...&#10;&#10;# CONSTRAINTS&#10;- Priorize severidade alta&#10;- Use formato SARIF no output" />
          <p className="text-[10px] text-muted-foreground">~{Math.ceil((data.prompt?.length || 0) / 4)} tokens estimados</p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="inputs" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Inputs ({data.inputs.length})</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <LabelWithHelp help={H.inputs}>Parametros de entrada</LabelWithHelp>
          {data.inputs.map((inp, i) => (
            <div key={i} className="p-2.5 rounded-md bg-secondary/50 space-y-1.5">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px] text-muted-foreground font-mono w-5">#{i + 1}</span>
                <span className="flex-1 text-xs font-medium truncate">{inp.name || '(sem nome)'}</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveInput(i, -1)} disabled={i === 0}><ArrowUp className="w-3 h-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveInput(i, 1)} disabled={i === data.inputs.length - 1}><ArrowDown className="w-3 h-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeInput(i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Input value={inp.name} onChange={e => updateInput(i, 'name', e.target.value)} placeholder="Ex: source_code" className="text-xs h-8" />
                <Select value={inp.type} onValueChange={v => updateInput(i, 'type', v)}>
                  <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{['string', 'json', 'file', 'url', 'markdown', 'code'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={inp.description} onChange={e => updateInput(i, 'description', e.target.value)} placeholder="Ex: Codigo-fonte a ser analisado" className="text-xs h-8 col-span-2" />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Switch checked={inp.required} onCheckedChange={v => updateInput(i, 'required', v)} className="scale-75" />
                <Label className="text-[10px] text-muted-foreground">Obrigatorio</Label>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addInput}><Plus className="w-3 h-3" /> Input</Button>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="outputs" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Outputs ({data.outputs.length})</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <LabelWithHelp help={H.outputs}>Resultados</LabelWithHelp>
          {data.outputs.map((out, i) => (
            <div key={i} className="p-2.5 rounded-md bg-secondary/50 space-y-1.5">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px] text-muted-foreground font-mono w-5">#{i + 1}</span>
                <span className="flex-1 text-xs font-medium truncate">{out.name || '(sem nome)'}</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveOutput(i, -1)} disabled={i === 0}><ArrowUp className="w-3 h-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveOutput(i, 1)} disabled={i === data.outputs.length - 1}><ArrowDown className="w-3 h-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeOutput(i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Input value={out.name} onChange={e => updateOutput(i, 'name', e.target.value)} placeholder="Ex: report" className="text-xs h-8" />
                <Select value={out.type} onValueChange={v => updateOutput(i, 'type', v)}>
                  <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{['string', 'json', 'file', 'url', 'markdown', 'code'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={out.description} onChange={e => updateOutput(i, 'description', e.target.value)} placeholder="Ex: Relatorio de analise em JSON" className="text-xs h-8 col-span-2" />
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addOutput}><Plus className="w-3 h-3" /> Output</Button>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="examples" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Exemplos ({data.examples.length})</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <LabelWithHelp help={H.examples}>Casos de uso</LabelWithHelp>
          {data.examples.map((ex, i) => (
            <Collapsible key={i} open={expandedExamples.has(i)} onOpenChange={() => toggleExample(i)}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/50 hover:bg-secondary/80 transition-colors text-left">
                  {expandedExamples.has(i) ? <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground" />}
                  <span className="text-[10px] text-muted-foreground font-mono">#{i + 1}</span>
                  <span className="text-xs font-medium truncate flex-1">{ex.title || '(sem titulo)'}</span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-5 mr-2 mt-1 mb-2 p-3 rounded-md border border-border/50 bg-background/60 space-y-2">
                  <Input value={ex.title} onChange={e => { const arr = [...data.examples]; arr[i] = { ...arr[i], title: e.target.value }; onChange('examples', arr); }} placeholder="Ex: Analise de arquivo simples" className="text-xs h-8" />
                  <Textarea value={ex.input} onChange={e => { const arr = [...data.examples]; arr[i] = { ...arr[i], input: e.target.value }; onChange('examples', arr); }} placeholder="Ex: const x = eval(userInput);" className="text-xs font-mono" rows={2} />
                  <Textarea value={ex.output} onChange={e => { const arr = [...data.examples]; arr[i] = { ...arr[i], output: e.target.value }; onChange('examples', arr); }} placeholder='Ex: { "severity": "critical", "rule": "no-eval" }' className="text-xs font-mono" rows={2} />
                  <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/30">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveExample(i, -1)} disabled={i === 0}><ArrowUp className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveExample(i, 1)} disabled={i === data.examples.length - 1}><ArrowDown className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeExample(i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
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
            <LabelWithHelp help={H.isPublic}>Elemento publico</LabelWithHelp>
            <Switch checked={data.isPublic} onCheckedChange={v => onChange('isPublic', v)} />
          </div>
          <div>
            <LabelWithHelp help={H.tags} className="mb-2">Tags</LabelWithHelp>
            <div className="flex flex-wrap gap-1 mb-2">
              {data.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px] cursor-pointer" onClick={() => onChange('tags', data.tags.filter(x => x !== t))}>{t} ×</Badge>)}
            </div>
            <Input placeholder="Ex: security, typescript (Enter)" onKeyDown={e => { if (e.key === 'Enter') { const v = (e.target as HTMLInputElement).value; if (v && !data.tags.includes(v)) onChange('tags', [...data.tags, v]); (e.target as HTMLInputElement).value = ''; e.preventDefault(); } }} className="text-xs" />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
