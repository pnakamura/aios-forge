/**
 * @agent     AgentForm
 * @persona   Formulario de edicao de Agent no editor da Library
 * @commands  render
 * @context   Secoes colapsaveis: identidade, system prompt, modelo LLM, comandos (cards colapsaveis com busca), ferramentas, skills, config.
 */

import { useCallback, useMemo, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Sparkles, Search, ChevronRight, ChevronDown, ArrowUp, ArrowDown, ChevronsUpDown, X } from 'lucide-react';
import type { AgentFormData } from '@/types/library';

interface AgentFormProps {
  data: AgentFormData;
  onChange: (field: string, value: unknown) => void;
  onAiRequest?: (prompt: string) => void;
}

export default function AgentForm({ data, onChange, onAiRequest }: AgentFormProps) {
  const [cmdSearch, setCmdSearch] = useState('');
  const [expandedCmds, setExpandedCmds] = useState<Set<number>>(new Set());
  const [newTool, setNewTool] = useState('');
  const [newSkill, setNewSkill] = useState('');

  const updateSlug = useCallback((name: string) => {
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    onChange('slug', slug);
  }, [onChange]);

  // Commands helpers
  const filteredCmds = useMemo(() => {
    if (!cmdSearch.trim()) return data.commands.map((c, i) => ({ ...c, _idx: i }));
    const q = cmdSearch.toLowerCase();
    return data.commands
      .map((c, i) => ({ ...c, _idx: i }))
      .filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }, [data.commands, cmdSearch]);

  const toggleCmd = (idx: number) => {
    setExpandedCmds(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const expandAll = () => setExpandedCmds(new Set(data.commands.map((_, i) => i)));
  const collapseAll = () => setExpandedCmds(new Set());

  const addCommand = () => {
    const newIdx = data.commands.length;
    onChange('commands', [...data.commands, { name: '', description: '', returnType: '' }]);
    setExpandedCmds(prev => new Set(prev).add(newIdx));
  };

  const removeCommand = (idx: number) => {
    onChange('commands', data.commands.filter((_, i) => i !== idx));
    setExpandedCmds(prev => {
      const next = new Set<number>();
      prev.forEach(v => { if (v < idx) next.add(v); else if (v > idx) next.add(v - 1); });
      return next;
    });
  };

  const updateCommand = (idx: number, field: string, value: string) => {
    const cmds = [...data.commands];
    cmds[idx] = { ...cmds[idx], [field]: value };
    onChange('commands', cmds);
  };

  const moveCommand = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= data.commands.length) return;
    const cmds = [...data.commands];
    [cmds[idx], cmds[target]] = [cmds[target], cmds[idx]];
    onChange('commands', cmds);
    setExpandedCmds(prev => {
      const next = new Set<number>();
      prev.forEach(v => {
        if (v === idx) next.add(target);
        else if (v === target) next.add(idx);
        else next.add(v);
      });
      return next;
    });
  };

  // Tags
  const addTag = (tag: string) => {
    if (tag && !data.tags.includes(tag)) onChange('tags', [...data.tags, tag]);
  };
  const removeTag = (tag: string) => onChange('tags', data.tags.filter(t => t !== tag));

  // Tools
  const addTool = () => {
    if (newTool.trim() && !data.tools.includes(newTool.trim())) {
      onChange('tools', [...data.tools, newTool.trim()]);
      setNewTool('');
    }
  };
  const removeTool = (t: string) => onChange('tools', data.tools.filter(x => x !== t));

  // Skills
  const addSkillItem = () => {
    if (newSkill.trim() && !data.skills.includes(newSkill.trim())) {
      onChange('skills', [...data.skills, newSkill.trim()]);
      setNewSkill('');
    }
  };
  const removeSkillItem = (s: string) => onChange('skills', data.skills.filter(x => x !== s));

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

      {/* Commands — Rich collapsible cards */}
      <AccordionItem value="commands" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">
          <span className="flex items-center gap-2">
            Comandos
            <Badge variant="secondary" className="text-[10px] font-mono">{data.commands.length}</Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          {/* Search + bulk actions */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={cmdSearch}
                onChange={e => setCmdSearch(e.target.value)}
                placeholder="Filtrar comandos..."
                className="pl-8 text-xs h-8"
              />
              {cmdSearch && (
                <button onClick={() => setCmdSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1 shrink-0" onClick={expandAll} title="Expandir todos">
              <ChevronsUpDown className="w-3 h-3" /> Todos
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] shrink-0" onClick={collapseAll} title="Colapsar todos">
              Colapsar
            </Button>
          </div>

          {cmdSearch && (
            <p className="text-[10px] text-muted-foreground">{filteredCmds.length} de {data.commands.length} comandos</p>
          )}

          {/* Command cards */}
          <ScrollArea className={data.commands.length > 8 ? 'max-h-[500px]' : ''}>
            <div className="space-y-1">
              {filteredCmds.map(cmd => {
                const idx = cmd._idx;
                const isOpen = expandedCmds.has(idx);
                return (
                  <Collapsible key={idx} open={isOpen} onOpenChange={() => toggleCmd(idx)}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/50 hover:bg-secondary/80 transition-colors text-left group">
                        {isOpen ? <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground" />}
                        <span className="font-mono text-xs font-medium text-primary truncate">
                          {cmd.name || '(sem nome)'}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate flex-1">
                          {cmd.description ? (cmd.description.length > 60 ? cmd.description.slice(0, 60) + '...' : cmd.description) : ''}
                        </span>
                        {cmd.returnType && (
                          <Badge variant="outline" className="text-[9px] font-mono shrink-0 opacity-60">{cmd.returnType}</Badge>
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-5 mr-2 mt-1 mb-2 p-3 rounded-md border border-border/50 bg-background/60 space-y-2">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Nome do comando</Label>
                          <Input value={cmd.name} onChange={e => updateCommand(idx, 'name', e.target.value)} placeholder="*nome-do-comando" className="text-xs font-mono h-8 mt-0.5" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Descricao</Label>
                          <Textarea value={cmd.description} onChange={e => updateCommand(idx, 'description', e.target.value)} placeholder="O que este comando faz..." className="text-xs min-h-[60px] mt-0.5" rows={2} />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Retorno esperado</Label>
                          <Input value={cmd.returnType} onChange={e => updateCommand(idx, 'returnType', e.target.value)} placeholder="Ex: AnalysisResult" className="text-xs font-mono h-8 mt-0.5" />
                        </div>
                        <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/30">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveCommand(idx, -1)} disabled={idx === 0} title="Mover para cima">
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveCommand(idx, 1)} disabled={idx === data.commands.length - 1} title="Mover para baixo">
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeCommand(idx)} title="Remover">
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>

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

      {/* Tools */}
      <AccordionItem value="tools" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">
          <span className="flex items-center gap-2">
            Ferramentas
            <Badge variant="secondary" className="text-[10px] font-mono">{data.tools.length}</Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {data.tools.map(t => (
              <Badge key={t} variant="outline" className="text-xs gap-1 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => removeTool(t)}>
                {t} <X className="w-2.5 h-2.5" />
              </Badge>
            ))}
            {data.tools.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma ferramenta adicionada</span>}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTool}
              onChange={e => setNewTool(e.target.value)}
              placeholder="Nome da ferramenta"
              className="text-xs h-8"
              onKeyDown={e => { if (e.key === 'Enter') { addTool(); e.preventDefault(); } }}
            />
            <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={addTool}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Skills */}
      <AccordionItem value="skills" className="glass rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">
          <span className="flex items-center gap-2">
            Skills
            <Badge variant="secondary" className="text-[10px] font-mono">{data.skills.length}</Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map(s => (
              <Badge key={s} variant="outline" className="text-xs gap-1 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => removeSkillItem(s)}>
                {s} <X className="w-2.5 h-2.5" />
              </Badge>
            ))}
            {data.skills.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma skill vinculada</span>}
          </div>
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              placeholder="Slug da skill"
              className="text-xs h-8 font-mono"
              onKeyDown={e => { if (e.key === 'Enter') { addSkillItem(); e.preventDefault(); } }}
            />
            <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={addSkillItem}>
              <Plus className="w-3 h-3" />
            </Button>
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
