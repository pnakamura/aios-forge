import { useState, useEffect } from 'react';
import { AiosAgent, AgentMemory } from '@/types/aios';
import { useWizardStore } from '@/stores/wizard-store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Bot, Terminal, Wrench, Sparkles, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

const MODEL_OPTIONS = [
  'claude-sonnet-4-20250514',
  'claude-haiku-4-20250414',
  'gpt-4o',
  'gpt-4o-mini',
  'gemini-2.0-flash',
  'gemini-2.5-pro-preview-05-06',
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

function EditableList({ items, onAdd, onRemove, placeholder, icon: Icon }: {
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  icon: React.FC<any>;
}) {
  const [input, setInput] = useState('');
  const handleAdd = () => {
    if (!input.trim()) return;
    onAdd(input.trim());
    setInput('');
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={placeholder}
          className="h-8 text-xs"
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
        />
        <Button variant="outline" size="sm" className="h-8 shrink-0 gap-1 text-xs" onClick={handleAdd} disabled={!input.trim()}>
          <Plus className="w-3 h-3" /> Adicionar
        </Button>
      </div>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <Badge key={`${item}-${i}`} variant="secondary" className="gap-1 text-xs font-mono pr-1">
              <Icon className="w-3 h-3 opacity-60" />
              {item}
              <button onClick={() => onRemove(i)} className="ml-0.5 hover:text-destructive transition-colors">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Nenhum item adicionado</p>
      )}
    </div>
  );
}

export function AgentEditor({ agent, open, onOpenChange }: AgentEditorProps) {
  const { updateAgent } = useWizardStore();
  const [draft, setDraft] = useState<AiosAgent | null>(null);

  useEffect(() => {
    if (agent) setDraft({ ...agent, memory: agent.memory || [] });
  }, [agent]);

  if (!draft) return null;

  const update = (partial: Partial<AiosAgent>) => setDraft(prev => prev ? { ...prev, ...partial } : prev);

  const handleSave = () => {
    if (!draft) return;
    updateAgent(draft.slug, {
      name: draft.name,
      role: draft.role,
      systemPrompt: draft.systemPrompt,
      llmModel: draft.llmModel,
      visibility: draft.visibility,
      commands: draft.commands,
      tools: draft.tools,
      skills: draft.skills,
      memory: draft.memory,
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
          <TabsList className="grid w-full grid-cols-5 h-8">
            <TabsTrigger value="general" className="text-[10px] px-1">Geral</TabsTrigger>
            <TabsTrigger value="commands" className="text-[10px] px-1">Comandos</TabsTrigger>
            <TabsTrigger value="tools" className="text-[10px] px-1">Ferramentas</TabsTrigger>
            <TabsTrigger value="skills" className="text-[10px] px-1">Skills</TabsTrigger>
            <TabsTrigger value="memory" className="text-[10px] px-1">Memoria</TabsTrigger>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Modelo LLM</Label>
                <select
                  value={draft.llmModel}
                  onChange={e => update({ llmModel: e.target.value })}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {MODEL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                  {!MODEL_OPTIONS.includes(draft.llmModel) && <option value={draft.llmModel}>{draft.llmModel}</option>}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Visibilidade</Label>
                <div className="flex gap-1">
                  {VISIBILITY_OPTIONS.map(opt => (
                    <button key={opt.value}
                      onClick={() => update({ visibility: opt.value })}
                      className={cn(
                        'flex-1 py-1 rounded-md border text-[10px] font-medium transition-all',
                        draft.visibility === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">System Prompt</Label>
              <Textarea
                value={draft.systemPrompt}
                onChange={e => update({ systemPrompt: e.target.value })}
                rows={5}
                className="text-xs font-mono resize-y"
              />
            </div>
          </TabsContent>

          {/* Commands tab */}
          <TabsContent value="commands" className="mt-3">
            <EditableList
              items={draft.commands}
              onAdd={cmd => update({ commands: [...draft.commands, cmd] })}
              onRemove={i => update({ commands: draft.commands.filter((_, idx) => idx !== i) })}
              placeholder="Ex: /analyze, /report"
              icon={Terminal}
            />
          </TabsContent>

          {/* Tools tab */}
          <TabsContent value="tools" className="mt-3">
            <EditableList
              items={draft.tools}
              onAdd={tool => update({ tools: [...draft.tools, tool] })}
              onRemove={i => update({ tools: draft.tools.filter((_, idx) => idx !== i) })}
              placeholder="Ex: web-search, code-review"
              icon={Wrench}
            />
          </TabsContent>

          {/* Skills tab */}
          <TabsContent value="skills" className="mt-3">
            <EditableList
              items={draft.skills}
              onAdd={skill => update({ skills: [...draft.skills, skill] })}
              onRemove={i => update({ skills: draft.skills.filter((_, idx) => idx !== i) })}
              placeholder="Ex: typescript, api-design"
              icon={Sparkles}
            />
          </TabsContent>

          {/* Memory tab */}
          <TabsContent value="memory" className="mt-3 space-y-3">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs w-full" onClick={addMemory}>
              <Plus className="w-3 h-3" /> Adicionar entrada de memoria
            </Button>
            {draft.memory.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-4">Nenhuma memoria configurada</p>
            )}
            {draft.memory.map(entry => (
              <div key={entry.id} className="rounded-lg border border-border p-3 space-y-2 bg-card/50">
                <div className="flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 text-primary shrink-0" />
                  <Input
                    value={entry.key}
                    onChange={e => updateMemory(entry.id, { key: e.target.value })}
                    placeholder="Chave (ex: context, goal)"
                    className="h-7 text-xs flex-1"
                  />
                  <Select value={entry.type} onValueChange={v => updateMemory(entry.id, { type: v as AgentMemory['type'] })}>
                    <SelectTrigger className="h-7 text-[10px] w-[110px] shrink-0">
                      <SelectValue />
                    </SelectTrigger>
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
                <Textarea
                  value={entry.content}
                  onChange={e => updateMemory(entry.id, { content: e.target.value })}
                  placeholder="Conteudo da memoria..."
                  rows={2}
                  className="text-xs resize-y"
                />
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} size="sm" className="flex-1 gap-1.5">
            Salvar alteracoes
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
