/**
 * @agent     AgentEditor
 * @persona   Editor completo de agente com suporte a comandos estruturados, deps e context
 * @commands  updateAgent, save
 * @context   Aberto ao clicar em um agente adicionado no AgentCatalog
 */

import { useState, useEffect } from 'react';
import { AiosAgent, AgentMemory, AgentCommand, AgentDependencies } from '@/types/aios';
import { useWizardStore } from '@/stores/wizard-store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Bot, Terminal, Wrench, Sparkles, Brain, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditableList } from './EditableList';

const MODEL_OPTIONS = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gpt-5',
  'gpt-5-mini',
  'claude-sonnet-4-20250514',
  'claude-haiku-4-20250414',
];

const VISIBILITY_OPTIONS: { value: 'full' | 'quick' | 'key'; label: string }[] = [
  { value: 'full', label: 'Completa' },
  { value: 'quick', label: 'Rapida' },
  { value: 'key', label: 'Chave' },
];

interface AgentEditorProps {
  agent: AiosAgent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentEditor({ agent, open, onOpenChange }: AgentEditorProps) {
  const { updateAgent } = useWizardStore();
  const [draft, setDraft] = useState<AiosAgent | null>(null);

  useEffect(() => {
    if (agent) setDraft({
      ...agent,
      memory: agent.memory || [],
      structuredCommands: agent.structuredCommands || [],
      dependencies: agent.dependencies || { services: [], hooks: [], types: [] },
      context: agent.context || '',
    });
  }, [agent]);

  if (!draft) return null;

  const update = (partial: Partial<AiosAgent>) => setDraft(prev => prev ? { ...prev, ...partial } : prev);

  const handleSave = () => {
    if (!draft) return;
    updateAgent(draft.slug, {
      name: draft.name, role: draft.role, systemPrompt: draft.systemPrompt,
      llmModel: draft.llmModel, visibility: draft.visibility,
      commands: draft.commands, tools: draft.tools, skills: draft.skills,
      memory: draft.memory, structuredCommands: draft.structuredCommands,
      dependencies: draft.dependencies, context: draft.context,
    });
    onOpenChange(false);
  };

  const addMemory = () => {
    const entry: AgentMemory = { id: crypto.randomUUID(), key: '', content: '', type: 'short_term' };
    update({ memory: [...draft.memory, entry] });
  };
  const updateMemory = (id: string, data: Partial<AgentMemory>) => {
    update({ memory: draft.memory.map(m => m.id === id ? { ...m, ...data } : m) });
  };
  const removeMemory = (id: string) => {
    update({ memory: draft.memory.filter(m => m.id !== id) });
  };

  // Structured commands helpers
  const sCommands = draft.structuredCommands || [];
  const deps = draft.dependencies || { services: [], hooks: [], types: [] };

  const addStructuredCommand = () => {
    update({ structuredCommands: [...sCommands, { name: '', description: '', visibility: 'public', handler: '' }] });
  };
  const updateStructuredCommand = (idx: number, data: Partial<AgentCommand>) => {
    update({ structuredCommands: sCommands.map((c, i) => i === idx ? { ...c, ...data } : c) });
  };
  const removeStructuredCommand = (idx: number) => {
    update({ structuredCommands: sCommands.filter((_, i) => i !== idx) });
  };

  const updateDeps = (partial: Partial<AgentDependencies>) => {
    update({ dependencies: { ...deps, ...partial } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Bot className="w-4 h-4 text-primary" />
            Editar Agente: {draft.name}
            {draft.isCustom && <Badge variant="outline" className="text-[9px] text-accent border-accent/30">Custom</Badge>}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-1">
          <TabsList className="grid w-full grid-cols-4 h-8">
            <TabsTrigger value="general" className="text-[10px] px-1">Geral</TabsTrigger>
            <TabsTrigger value="structured" className="text-[10px] px-1">Comandos</TabsTrigger>
            <TabsTrigger value="toolskills" className="text-[10px] px-1">Tools/Skills</TabsTrigger>
            <TabsTrigger value="advanced" className="text-[10px] px-1">Avancado</TabsTrigger>
          </TabsList>

          {/* General tab */}
          <TabsContent value="general" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome</Label>
                <Input value={draft.name} onChange={e => update({ name: e.target.value })} className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Slug</Label>
                <Input value={draft.slug} disabled className="h-8 text-xs font-mono opacity-60" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Input value={draft.role} onChange={e => update({ role: e.target.value })} className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Context (quando ativar)</Label>
              <Textarea value={draft.context || ''} onChange={e => update({ context: e.target.value })} rows={2} className="text-xs" placeholder="Ex: Ativado quando o usuario precisa de..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Modelo LLM</Label>
                <select value={draft.llmModel} onChange={e => update({ llmModel: e.target.value })}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                  {MODEL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                  {!MODEL_OPTIONS.includes(draft.llmModel) && <option value={draft.llmModel}>{draft.llmModel}</option>}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Visibilidade</Label>
                <div className="flex gap-1">
                  {VISIBILITY_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => update({ visibility: opt.value })}
                      className={cn('flex-1 py-1 rounded-md border text-[10px] font-medium transition-all',
                        draft.visibility === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/30')}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">System Prompt</Label>
              <Textarea value={draft.systemPrompt} onChange={e => update({ systemPrompt: e.target.value })} rows={5} className="text-xs font-mono resize-y" />
            </div>
          </TabsContent>

          {/* Structured Commands tab */}
          <TabsContent value="structured" className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Comandos com descricao, visibilidade e handler</p>
              <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={addStructuredCommand}>
                <Plus className="w-3 h-3" /> Comando
              </Button>
            </div>
            {sCommands.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-4">Nenhum comando estruturado</p>
            )}
            {sCommands.map((cmd, idx) => (
              <div key={idx} className="rounded-lg border border-border p-3 space-y-2 bg-card/50">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-primary shrink-0" />
                  <Input value={cmd.name} onChange={e => updateStructuredCommand(idx, { name: e.target.value })} placeholder="Nome (ex: /analyze)" className="h-7 text-xs flex-1 font-mono" />
                  <select value={cmd.visibility} onChange={e => updateStructuredCommand(idx, { visibility: e.target.value as AgentCommand['visibility'] })}
                    className="h-7 rounded-md border border-input bg-background px-2 text-[10px] w-[90px] shrink-0">
                    <option value="public">Public</option>
                    <option value="internal">Internal</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onClick={() => removeStructuredCommand(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Input value={cmd.description} onChange={e => updateStructuredCommand(idx, { description: e.target.value })} placeholder="Descricao" className="h-7 text-xs" />
                <Input value={cmd.handler} onChange={e => updateStructuredCommand(idx, { handler: e.target.value })} placeholder="Handler (ex: service.method)" className="h-7 text-xs font-mono" />
              </div>
            ))}

            {/* Legacy simple commands */}
            <div className="pt-3 border-t border-border">
              <Label className="text-xs text-muted-foreground mb-2 block">Comandos simples (legado)</Label>
              <EditableList
                items={draft.commands}
                onAdd={cmd => update({ commands: [...draft.commands, cmd] })}
                onRemove={i => update({ commands: draft.commands.filter((_, idx) => idx !== i) })}
                placeholder="Ex: /analyze, /report"
                icon={Terminal}
              />
            </div>
          </TabsContent>

          {/* Tools & Skills tab */}
          <TabsContent value="toolskills" className="mt-3 space-y-4">
            <div>
              <Label className="text-xs mb-2 block">Tools</Label>
              <EditableList items={draft.tools} onAdd={t => update({ tools: [...draft.tools, t] })} onRemove={i => update({ tools: draft.tools.filter((_, idx) => idx !== i) })} placeholder="Ex: web-search" icon={Wrench} />
            </div>
            <div>
              <Label className="text-xs mb-2 block">Skills</Label>
              <EditableList items={draft.skills} onAdd={s => update({ skills: [...draft.skills, s] })} onRemove={i => update({ skills: draft.skills.filter((_, idx) => idx !== i) })} placeholder="Ex: typescript" icon={Sparkles} />
            </div>
          </TabsContent>

          {/* Advanced tab: Dependencies + Memory */}
          <TabsContent value="advanced" className="mt-3 space-y-4">
            <div>
              <Label className="text-xs mb-2 block font-medium">Dependencias</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Services</Label>
                  <EditableList items={deps.services} onAdd={s => updateDeps({ services: [...deps.services, s] })} onRemove={i => updateDeps({ services: deps.services.filter((_, idx) => idx !== i) })} placeholder="Ex: nome.service.ts" icon={FileCode} />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Hooks</Label>
                  <EditableList items={deps.hooks} onAdd={h => updateDeps({ hooks: [...deps.hooks, h] })} onRemove={i => updateDeps({ hooks: deps.hooks.filter((_, idx) => idx !== i) })} placeholder="Ex: useNome.ts" icon={FileCode} />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Types</Label>
                  <EditableList items={deps.types} onAdd={t => updateDeps({ types: [...deps.types, t] })} onRemove={i => updateDeps({ types: deps.types.filter((_, idx) => idx !== i) })} placeholder="Ex: nome.types.ts" icon={FileCode} />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-medium">Memoria</Label>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={addMemory}>
                  <Plus className="w-3 h-3" /> Entrada
                </Button>
              </div>
              {draft.memory.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-3">Nenhuma memoria configurada</p>
              )}
              {draft.memory.map(entry => (
                <div key={entry.id} className="rounded-lg border border-border p-3 space-y-2 bg-card/50 mt-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 text-primary shrink-0" />
                    <Input value={entry.key} onChange={e => updateMemory(entry.id, { key: e.target.value })} placeholder="Chave (ex: context)" className="h-7 text-xs flex-1" />
                    <Select value={entry.type} onValueChange={v => updateMemory(entry.id, { type: v as AgentMemory['type'] })}>
                      <SelectTrigger className="h-7 text-[10px] w-[110px] shrink-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short_term" className="text-xs">Curto prazo</SelectItem>
                        <SelectItem value="long_term" className="text-xs">Longo prazo</SelectItem>
                        <SelectItem value="episodic" className="text-xs">Episodica</SelectItem>
                      </SelectContent>
                    </Select>
                    <button onClick={() => removeMemory(entry.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Textarea value={entry.content} onChange={e => updateMemory(entry.id, { content: e.target.value })} placeholder="Conteudo da memoria..." rows={2} className="text-xs resize-y" />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} size="sm" className="flex-1 gap-1.5">Salvar alteracoes</Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
