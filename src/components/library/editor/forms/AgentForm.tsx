/**
 * @agent     AgentForm
 * @persona   Formulario de edicao de Agent no editor da Library
 * @commands  render
 * @context   Secoes colapsaveis: identidade, system prompt, modelo LLM, comandos, ferramentas, config.
 */

import { useCallback } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import type { AgentFormData } from '@/types/library';

interface AgentFormProps {
  data: AgentFormData;
  onChange: (field: string, value: unknown) => void;
  onAiRequest?: (prompt: string) => void;
}

export default function AgentForm({ data, onChange, onAiRequest }: AgentFormProps) {
  const updateSlug = useCallback((name: string) => {
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    onChange('slug', slug);
  }, [onChange]);

  const addCommand = () => {
    onChange('commands', [...data.commands, { name: '', description: '', returnType: '' }]);
  };

  const removeCommand = (idx: number) => {
    onChange('commands', data.commands.filter((_, i) => i !== idx));
  };

  const updateCommand = (idx: number, field: string, value: string) => {
    const cmds = [...data.commands];
    cmds[idx] = { ...cmds[idx], [field]: value };
    onChange('commands', cmds);
  };

  const addTag = (tag: string) => {
    if (tag && !data.tags.includes(tag)) onChange('tags', [...data.tags, tag]);
  };

  const removeTag = (tag: string) => {
    onChange('tags', data.tags.filter(t => t !== tag));
  };

  return (
    <Accordion type="multiple" defaultValue={['identity', 'system-prompt', 'commands']} className="space-y-2">
      {/* Identity */}
      <AccordionItem value="identity" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Identidade</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input value={data.name} onChange={e => { onChange('name', e.target.value); updateSlug(e.target.value); }} placeholder="Ex: Code Reviewer" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Slug</Label>
            <Input value={data.slug} onChange={e => onChange('slug', e.target.value)} placeholder="code-reviewer" className="mt-1 font-mono text-xs" />
          </div>
          <div>
            <Label className="text-xs">Role</Label>
            <Input value={data.role} onChange={e => onChange('role', e.target.value)} placeholder="Senior Code Reviewer" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Categoria</Label>
            <Select value={data.category} onValueChange={v => onChange('category', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Meta">Meta</SelectItem>
                <SelectItem value="Planejamento">Planejamento</SelectItem>
                <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Descricao curta</Label>
            <Textarea value={data.description} onChange={e => onChange('description', e.target.value)} placeholder="Descricao para exibicao na Library" className="mt-1" rows={2} />
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* System Prompt */}
      <AccordionItem value="system-prompt" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">System Prompt</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Prompt do agente</Label>
            {onAiRequest && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => onAiRequest('Gere um system prompt completo para este agente com as secoes ROLE, CONTEXT, RESPONSIBILITIES, COMMANDS e OUTPUT FORMAT.')}>
                <Sparkles className="w-3 h-3" /> Gerar
              </Button>
            )}
          </div>
          <Textarea value={data.systemPrompt} onChange={e => onChange('systemPrompt', e.target.value)} className="font-mono text-xs min-h-[200px]" placeholder="# ROLE&#10;...&#10;# CONTEXT&#10;..." />
          <p className="text-[10px] text-muted-foreground">~{Math.ceil((data.systemPrompt?.length || 0) / 4)} tokens estimados</p>
        </AccordionContent>
      </AccordionItem>

      {/* LLM Model */}
      <AccordionItem value="llm" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Modelo LLM</AccordionTrigger>
        <AccordionContent className="pb-4">
          <Select value={data.llmModel} onValueChange={v => onChange('llmModel', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="google/gemini-3-flash-preview">Gemini 3 Flash (rapido, balanceado)</SelectItem>
              <SelectItem value="google/gemini-3-pro-preview">Gemini 3 Pro (alta capacidade)</SelectItem>
              <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash (custo-eficiente)</SelectItem>
              <SelectItem value="openai/gpt-5">GPT-5 (precisao maxima)</SelectItem>
              <SelectItem value="openai/gpt-5-mini">GPT-5 Mini (balanceado)</SelectItem>
            </SelectContent>
          </Select>
        </AccordionContent>
      </AccordionItem>

      {/* Commands */}
      <AccordionItem value="commands" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Comandos ({data.commands.length})</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          {data.commands.map((cmd, i) => (
            <div key={i} className="flex gap-2 items-start p-2 rounded-md bg-secondary/50">
              <div className="flex-1 space-y-1.5">
                <Input value={cmd.name} onChange={e => updateCommand(i, 'name', e.target.value)} placeholder="*nome-do-comando" className="text-xs font-mono h-8" />
                <Input value={cmd.description} onChange={e => updateCommand(i, 'description', e.target.value)} placeholder="Descricao" className="text-xs h-8" />
                <Input value={cmd.returnType} onChange={e => updateCommand(i, 'returnType', e.target.value)} placeholder="Retorno esperado" className="text-xs h-8" />
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => removeCommand(i)}>
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addCommand}>
              <Plus className="w-3 h-3" /> Adicionar
            </Button>
            {onAiRequest && (
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => onAiRequest('Sugira comandos para este agente dado seu role e responsabilidades.')}>
                <Sparkles className="w-3 h-3" /> Sugerir
              </Button>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Config */}
      <AccordionItem value="config" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Configuracoes</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div>
            <Label className="text-xs">Visibilidade</Label>
            <Select value={data.visibility} onValueChange={v => onChange('visibility', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full — visivel em todos os contextos</SelectItem>
                <SelectItem value="quick">Quick — resumo compacto</SelectItem>
                <SelectItem value="key">Key — destaque em squads</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Elemento publico</Label>
            <Switch checked={data.isPublic} onCheckedChange={v => onChange('isPublic', v)} />
          </div>
          <div>
            <Label className="text-xs mb-2 block">Tags</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {data.tags.map(t => (
                <Badge key={t} variant="secondary" className="text-[10px] cursor-pointer" onClick={() => removeTag(t)}>
                  {t} ×
                </Badge>
              ))}
            </div>
            <Input placeholder="Adicionar tag (Enter)" onKeyDown={e => { if (e.key === 'Enter') { addTag((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; e.preventDefault(); } }} className="text-xs" />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
