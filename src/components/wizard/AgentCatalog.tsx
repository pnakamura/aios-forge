/**
 * @agent     AgentCatalog
 * @persona   Catalogo de agentes nativos e criacao de agentes customizados
 * @commands  addNative, removeAgent, createCustom, editAgent
 * @context   Usado na etapa 3 (Agentes) do wizard
 */

import { NATIVE_AGENTS } from '@/data/native-agents';
import { useWizardStore } from '@/stores/wizard-store';
import { AiosAgent, AgentCategory, AgentCommand, AgentDependencies, normalizeCommands } from '@/types/aios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Crown, Network, Search, Target, Building2, Palette,
  Users, Code, ShieldCheck, Star, Server, Plus, Check, X, Sparkles,
  Terminal, Wrench, FileCode, Brain, BookOpen
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ORCHESTRATION_PATTERNS } from '@/data/orchestration-patterns';
import { AgentEditor } from './AgentEditor';
import { EditableList } from './EditableList';
import { LibraryImportWizardDialog } from './LibraryImportWizardDialog';

const iconMap: Record<string, React.FC<any>> = {
  Crown, Network, Search, Target, Building2, Palette,
  Users, Code, ShieldCheck, Star, Server,
};

const categoryColors: Record<AgentCategory, string> = {
  Meta: 'bg-primary/10 text-primary border-primary/30',
  Planejamento: 'bg-accent/10 text-accent border-accent/30',
  Desenvolvimento: 'bg-glow-success/10 text-glow-success border-glow-success/30',
  Infraestrutura: 'bg-glow-warning/10 text-glow-warning border-glow-warning/30',
};

const categories: AgentCategory[] = ['Meta', 'Planejamento', 'Desenvolvimento', 'Infraestrutura'];

interface CustomAgentDraft {
  name: string;
  slug: string;
  role: string;
  squad: string;
  context: string;
  systemPrompt: string;
  tools: string[];
  skills: string[];
  structuredCommands: AgentCommand[];
  dependencies: AgentDependencies;
}

const emptyDraft: CustomAgentDraft = {
  name: '', slug: '', role: '', squad: '', context: '', systemPrompt: '',
  tools: [], skills: [],
  structuredCommands: [],
  dependencies: { services: [], hooks: [], types: [] },
};

export function AgentCatalog() {
  const { agents, addAgent, removeAgent, squads, project } = useWizardStore();
  const [filter, setFilter] = useState<AgentCategory | 'all'>('all');
  const [detailAgent, setDetailAgent] = useState<typeof NATIVE_AGENTS[0] | null>(null);
  const [editAgent, setEditAgent] = useState<AiosAgent | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [draft, setDraft] = useState<CustomAgentDraft>({ ...emptyDraft });

  const filtered = filter === 'all' ? NATIVE_AGENTS : NATIVE_AGENTS.filter(a => a.category === filter);
  const addedSlugs = new Set(agents.map(a => a.slug));

  const currentPattern = ORCHESTRATION_PATTERNS.find(p => p.id === project.orchestrationPattern);
  const recommendedSlugs = new Set(currentPattern?.suggestedAgents || []);

  const handleAddNative = (native: typeof NATIVE_AGENTS[0]) => {
    const agent: AiosAgent = {
      slug: native.slug, name: native.name, role: native.role,
      systemPrompt: native.defaultSystemPrompt, llmModel: native.defaultModel,
      commands: native.defaultCommands, tools: native.defaultTools || [],
      skills: native.defaultSkills || [], memory: [], visibility: 'full',
      isCustom: false, category: native.category,
    };
    addAgent(agent);
  };

  const handleAddAllRecommended = () => {
    NATIVE_AGENTS.filter(a => recommendedSlugs.has(a.slug) && !addedSlugs.has(a.slug)).forEach(handleAddNative);
  };

  const updateDraft = (partial: Partial<CustomAgentDraft>) => setDraft(prev => ({ ...prev, ...partial }));

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const addCommand = () => {
    updateDraft({ structuredCommands: [...draft.structuredCommands, { name: '', description: '', visibility: 'public', handler: '' }] });
  };

  const updateCommand = (idx: number, data: Partial<AgentCommand>) => {
    const cmds = draft.structuredCommands.map((c, i) => i === idx ? { ...c, ...data } : c);
    updateDraft({ structuredCommands: cmds });
  };

  const removeCommand = (idx: number) => {
    updateDraft({ structuredCommands: draft.structuredCommands.filter((_, i) => i !== idx) });
  };

  const handleCreateCustom = () => {
    if (!draft.name || !draft.role) return;
    const slug = draft.slug || autoSlug(draft.name);
    const agent: AiosAgent = {
      slug, name: draft.name, role: draft.role,
      systemPrompt: draft.systemPrompt, llmModel: 'gemini-3-flash-preview',
      commands: draft.structuredCommands.filter(c => c.name),
      tools: draft.tools, skills: draft.skills, memory: [],
      visibility: 'full', isCustom: true,
      dependencies: draft.dependencies,
      context: draft.context,
    };
    addAgent(agent);
    setShowCustom(false);
    setDraft({ ...emptyDraft });
  };

  const hasUnaddedRecommended = NATIVE_AGENTS.some(a => recommendedSlugs.has(a.slug) && !addedSlugs.has(a.slug));

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Catalogo de Agentes</h3>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={() => setShowLibrary(true)} className="gap-1.5 text-xs">
            <BookOpen className="w-3.5 h-3.5" /> Library
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCustom(true)} className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" /> Custom
          </Button>
        </div>
      </div>

      {/* Recommended banner */}
      {hasUnaddedRecommended && currentPattern && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">Recomendados para {currentPattern.name}</p>
            <p className="text-[10px] text-muted-foreground">{currentPattern.suggestedAgents.length} agentes sugeridos</p>
          </div>
          <Button size="sm" variant="default" onClick={handleAddAllRecommended} className="text-xs h-7 shrink-0">
            Adicionar todos
          </Button>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        <Badge variant={filter === 'all' ? 'default' : 'outline'} className="cursor-pointer text-xs" onClick={() => setFilter('all')}>
          Todos
        </Badge>
        {categories.map(cat => (
          <Badge key={cat} variant={filter === cat ? 'default' : 'outline'} className="cursor-pointer text-xs" onClick={() => setFilter(cat)}>
            {cat}
          </Badge>
        ))}
      </div>

      {agents.length > 0 && (
        <p className="text-xs text-muted-foreground">{agents.length} agente(s) adicionado(s)</p>
      )}

      {/* Agent grid */}
      <div className="grid grid-cols-1 gap-2">
        {filtered.map(agent => {
          const Icon = iconMap[agent.icon] || Code;
          const isAdded = addedSlugs.has(agent.slug);
          const isRecommended = recommendedSlugs.has(agent.slug);
          return (
            <div key={agent.slug}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer',
                isAdded ? 'border-primary/30 bg-primary/5'
                  : isRecommended ? 'border-primary/15 bg-primary/[0.02] hover:border-primary/30'
                    : 'border-border/50 bg-card/50 hover:border-primary/20'
              )}
              onClick={() => {
                if (isAdded) {
                  const storeAgent = agents.find(a => a.slug === agent.slug);
                  if (storeAgent) setEditAgent({ ...storeAgent });
                } else {
                  setDetailAgent(agent);
                }
              }}
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', categoryColors[agent.category])}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{agent.name}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">{agent.category}</Badge>
                  {isRecommended && !isAdded && (
                    <Badge variant="outline" className="text-[9px] shrink-0 text-primary border-primary/30">Recomendado</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
              </div>
              <Button variant={isAdded ? 'ghost' : 'outline'} size="sm" className="shrink-0"
                onClick={(e) => { e.stopPropagation(); isAdded ? removeAgent(agent.slug) : handleAddNative(agent); }}>
                {isAdded ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Detail Modal (native agent) */}
      <Dialog open={!!detailAgent} onOpenChange={() => setDetailAgent(null)}>
        <DialogContent className="glass max-w-lg">
          {detailAgent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => { const I = iconMap[detailAgent.icon] || Code; return <I className="w-5 h-5 text-primary" />; })()}
                  {detailAgent.name}
                  {recommendedSlugs.has(detailAgent.slug) && (
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/30 ml-2">Recomendado</Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label className="text-xs text-muted-foreground">Role</Label><p className="text-sm">{detailAgent.role}</p></div>
                <div><Label className="text-xs text-muted-foreground">Descricao</Label><p className="text-sm">{detailAgent.description}</p></div>
                <div>
                  <Label className="text-xs text-muted-foreground">System Prompt</Label>
                  <pre className="text-xs bg-muted rounded-lg p-3 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">{detailAgent.defaultSystemPrompt}</pre>
                </div>
                <div><Label className="text-xs text-muted-foreground">Modelo</Label><Badge variant="secondary" className="text-xs font-mono">{detailAgent.defaultModel}</Badge></div>
                <div>
                  <Label className="text-xs text-muted-foreground">Comandos</Label>
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    {detailAgent.defaultCommands.map(cmd => <Badge key={cmd.name} variant="secondary" className="text-xs font-mono">{cmd.name}</Badge>)}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Padroes compativeis</Label>
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    {detailAgent.compatiblePatterns.map(p => (
                      <Badge key={p} variant="outline" className={cn('text-[10px]', p === project.orchestrationPattern && 'border-primary/30 text-primary')}>
                        {p.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={() => {
                  addedSlugs.has(detailAgent.slug) ? removeAgent(detailAgent.slug) : handleAddNative(detailAgent);
                  setDetailAgent(null);
                }}>
                  {addedSlugs.has(detailAgent.slug) ? 'Remover do projeto' : 'Adicionar ao projeto'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Agent Dialog — Agent File v4.2.13 */}
      <Dialog open={showCustom} onOpenChange={(open) => { setShowCustom(open); if (!open) setDraft({ ...emptyDraft }); }}>
        <DialogContent className="glass max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Brain className="w-4 h-4 text-primary" />
              Criar Agente Customizado
              <Badge variant="outline" className="text-[9px] text-accent border-accent/30">v4.2.13</Badge>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="identity" className="mt-1">
            <TabsList className="grid w-full grid-cols-5 h-8">
              <TabsTrigger value="identity" className="text-[10px] px-1">Identidade</TabsTrigger>
              <TabsTrigger value="commands" className="text-[10px] px-1">Comandos</TabsTrigger>
              <TabsTrigger value="toolskills" className="text-[10px] px-1">Tools/Skills</TabsTrigger>
              <TabsTrigger value="deps" className="text-[10px] px-1">Dependencias</TabsTrigger>
              <TabsTrigger value="prompt" className="text-[10px] px-1">Prompt</TabsTrigger>
            </TabsList>

            {/* Identity */}
            <TabsContent value="identity" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome *</Label>
                  <Input value={draft.name} onChange={e => { updateDraft({ name: e.target.value }); if (!draft.slug) updateDraft({ slug: autoSlug(e.target.value) }); }} placeholder="Ex: Content Writer" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Slug</Label>
                  <Input value={draft.slug || autoSlug(draft.name)} onChange={e => updateDraft({ slug: e.target.value })} placeholder="auto-gerado" className="h-8 text-xs font-mono" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Role *</Label>
                <Input value={draft.role} onChange={e => updateDraft({ role: e.target.value })} placeholder="Ex: Escritor de conteudo especializado em documentacao tecnica" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Squad</Label>
                <select
                  value={draft.squad}
                  onChange={e => updateDraft({ squad: e.target.value })}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Nenhum (core)</option>
                  {squads.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Context (quando ativar este agente)</Label>
                <Textarea value={draft.context} onChange={e => updateDraft({ context: e.target.value })} placeholder="Ex: Ativado quando o usuario precisa gerar documentacao tecnica para APIs" rows={2} className="text-xs" />
              </div>
            </TabsContent>

            {/* Structured Commands */}
            <TabsContent value="commands" className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Defina os comandos com descricao, visibilidade e handler</p>
                <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={addCommand}>
                  <Plus className="w-3 h-3" /> Comando
                </Button>
              </div>
              {draft.structuredCommands.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-4">Nenhum comando. Clique em "+ Comando" para adicionar.</p>
              )}
              {draft.structuredCommands.map((cmd, idx) => (
                <div key={idx} className="rounded-lg border border-border p-3 space-y-2 bg-card/50">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-primary shrink-0" />
                    <Input value={cmd.name} onChange={e => updateCommand(idx, { name: e.target.value })} placeholder="Nome (ex: /analyze)" className="h-7 text-xs flex-1 font-mono" />
                    <select
                      value={cmd.visibility}
                      onChange={e => updateCommand(idx, { visibility: e.target.value as AgentCommand['visibility'] })}
                      className="h-7 rounded-md border border-input bg-background px-2 text-[10px] w-[90px] shrink-0"
                    >
                      <option value="public">Public</option>
                      <option value="internal">Internal</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button onClick={() => removeCommand(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Input value={cmd.description} onChange={e => updateCommand(idx, { description: e.target.value })} placeholder="Descricao do comando" className="h-7 text-xs" />
                  <Input value={cmd.handler} onChange={e => updateCommand(idx, { handler: e.target.value })} placeholder="Handler (ex: contentWriter.service.analyze)" className="h-7 text-xs font-mono" />
                </div>
              ))}
            </TabsContent>

            {/* Tools & Skills */}
            <TabsContent value="toolskills" className="mt-3 space-y-4">
              <div>
                <Label className="text-xs mb-2 block">Tools</Label>
                <EditableList
                  items={draft.tools}
                  onAdd={t => updateDraft({ tools: [...draft.tools, t] })}
                  onRemove={i => updateDraft({ tools: draft.tools.filter((_, idx) => idx !== i) })}
                  placeholder="Ex: web-search, code-review"
                  icon={Wrench}
                />
              </div>
              <div>
                <Label className="text-xs mb-2 block">Skills</Label>
                <EditableList
                  items={draft.skills}
                  onAdd={s => updateDraft({ skills: [...draft.skills, s] })}
                  onRemove={i => updateDraft({ skills: draft.skills.filter((_, idx) => idx !== i) })}
                  placeholder="Ex: typescript, api-design"
                  icon={Sparkles}
                />
              </div>
            </TabsContent>

            {/* Dependencies */}
            <TabsContent value="deps" className="mt-3 space-y-4">
              <div>
                <Label className="text-xs mb-2 block">Services</Label>
                <EditableList
                  items={draft.dependencies.services}
                  onAdd={s => updateDraft({ dependencies: { ...draft.dependencies, services: [...draft.dependencies.services, s] } })}
                  onRemove={i => updateDraft({ dependencies: { ...draft.dependencies, services: draft.dependencies.services.filter((_, idx) => idx !== i) } })}
                  placeholder="Ex: contentWriter.service.ts"
                  icon={FileCode}
                />
              </div>
              <div>
                <Label className="text-xs mb-2 block">Hooks</Label>
                <EditableList
                  items={draft.dependencies.hooks}
                  onAdd={h => updateDraft({ dependencies: { ...draft.dependencies, hooks: [...draft.dependencies.hooks, h] } })}
                  onRemove={i => updateDraft({ dependencies: { ...draft.dependencies, hooks: draft.dependencies.hooks.filter((_, idx) => idx !== i) } })}
                  placeholder="Ex: useContentWriter.ts"
                  icon={FileCode}
                />
              </div>
              <div>
                <Label className="text-xs mb-2 block">Types</Label>
                <EditableList
                  items={draft.dependencies.types}
                  onAdd={t => updateDraft({ dependencies: { ...draft.dependencies, types: [...draft.dependencies.types, t] } })}
                  onRemove={i => updateDraft({ dependencies: { ...draft.dependencies, types: draft.dependencies.types.filter((_, idx) => idx !== i) } })}
                  placeholder="Ex: contentWriter.types.ts"
                  icon={FileCode}
                />
              </div>
            </TabsContent>

            {/* System Prompt */}
            <TabsContent value="prompt" className="mt-3 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">System Prompt</Label>
                <Textarea value={draft.systemPrompt} onChange={e => updateDraft({ systemPrompt: e.target.value })} placeholder="Instrucoes para o agente..." rows={8} className="text-xs font-mono resize-y" />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleCreateCustom} size="sm" className="flex-1 gap-1.5" disabled={!draft.name || !draft.role}>
              Criar Agente
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setShowCustom(false); setDraft({ ...emptyDraft }); }}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agent Editor for editing added agents */}
      <AgentEditor agent={editAgent} open={!!editAgent} onOpenChange={(open) => { if (!open) setEditAgent(null); }} />

      {/* Library Import Dialog */}
      <LibraryImportWizardDialog open={showLibrary} onOpenChange={setShowLibrary} filterType="agent" />
    </div>
  );
}
