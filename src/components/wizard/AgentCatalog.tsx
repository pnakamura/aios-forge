import { NATIVE_AGENTS } from '@/data/native-agents';
import { useWizardStore } from '@/stores/wizard-store';
import { AiosAgent, AgentCategory } from '@/types/aios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Crown, Network, Search, Target, Building2, Palette,
  Users, Code, ShieldCheck, Star, Server, Plus, Check, X, Sparkles
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ORCHESTRATION_PATTERNS } from '@/data/orchestration-patterns';

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

export function AgentCatalog() {
  const { agents, addAgent, removeAgent, project } = useWizardStore();
  const [filter, setFilter] = useState<AgentCategory | 'all'>('all');
  const [detailAgent, setDetailAgent] = useState<typeof NATIVE_AGENTS[0] | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customAgent, setCustomAgent] = useState({ name: '', slug: '', role: '', systemPrompt: '' });

  const filtered = filter === 'all' ? NATIVE_AGENTS : NATIVE_AGENTS.filter(a => a.category === filter);
  const addedSlugs = new Set(agents.map(a => a.slug));

  // Get recommended agents for the current orchestration pattern
  const currentPattern = ORCHESTRATION_PATTERNS.find(p => p.id === project.orchestrationPattern);
  const recommendedSlugs = new Set(currentPattern?.suggestedAgents || []);

  const handleAddNative = (native: typeof NATIVE_AGENTS[0]) => {
    const agent: AiosAgent = {
      slug: native.slug,
      name: native.name,
      role: native.role,
      systemPrompt: native.defaultSystemPrompt,
      llmModel: native.defaultModel,
      commands: native.defaultCommands,
      tools: [],
      skills: [],
      visibility: 'full',
      isCustom: false,
      category: native.category,
    };
    addAgent(agent);
  };

  const handleAddAllRecommended = () => {
    NATIVE_AGENTS.filter(a => recommendedSlugs.has(a.slug) && !addedSlugs.has(a.slug)).forEach(handleAddNative);
  };

  const handleCreateCustom = () => {
    if (!customAgent.name || !customAgent.role) return;
    const slug = customAgent.slug || customAgent.name.toLowerCase().replace(/\s+/g, '-');
    const agent: AiosAgent = {
      slug,
      name: customAgent.name,
      role: customAgent.role,
      systemPrompt: customAgent.systemPrompt,
      llmModel: 'gemini-2.0-flash',
      commands: [],
      tools: [],
      skills: [],
      visibility: 'full',
      isCustom: true,
    };
    addAgent(agent);
    setShowCustom(false);
    setCustomAgent({ name: '', slug: '', role: '', systemPrompt: '' });
  };

  const hasUnaddedRecommended = NATIVE_AGENTS.some(a => recommendedSlugs.has(a.slug) && !addedSlugs.has(a.slug));

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Catalogo de Agentes</h3>
        <Button variant="outline" size="sm" onClick={() => setShowCustom(true)} className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Custom
        </Button>
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
        <Badge
          variant={filter === 'all' ? 'default' : 'outline'}
          className="cursor-pointer text-xs"
          onClick={() => setFilter('all')}
        >
          Todos
        </Badge>
        {categories.map(cat => (
          <Badge
            key={cat}
            variant={filter === cat ? 'default' : 'outline'}
            className="cursor-pointer text-xs"
            onClick={() => setFilter(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Agent added count */}
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
            <div
              key={agent.slug}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer',
                isAdded
                  ? 'border-primary/30 bg-primary/5'
                  : isRecommended
                    ? 'border-primary/15 bg-primary/[0.02] hover:border-primary/30'
                    : 'border-border/50 bg-card/50 hover:border-primary/20'
              )}
              onClick={() => setDetailAgent(agent)}
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
              <Button
                variant={isAdded ? 'ghost' : 'outline'}
                size="sm"
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  isAdded ? removeAgent(agent.slug) : handleAddNative(agent);
                }}
              >
                {isAdded ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
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
                <div>
                  <Label className="text-xs text-muted-foreground">Role</Label>
                  <p className="text-sm">{detailAgent.role}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Descricao</Label>
                  <p className="text-sm">{detailAgent.description}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">System Prompt</Label>
                  <pre className="text-xs bg-muted rounded-lg p-3 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">{detailAgent.defaultSystemPrompt}</pre>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Modelo</Label>
                  <Badge variant="secondary" className="text-xs font-mono">{detailAgent.defaultModel}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Comandos</Label>
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    {detailAgent.defaultCommands.map(cmd => (
                      <Badge key={cmd} variant="secondary" className="text-xs font-mono">{cmd}</Badge>
                    ))}
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
                <Button
                  className="w-full"
                  onClick={() => {
                    const isAdded = addedSlugs.has(detailAgent.slug);
                    isAdded ? removeAgent(detailAgent.slug) : handleAddNative(detailAgent);
                    setDetailAgent(null);
                  }}
                >
                  {addedSlugs.has(detailAgent.slug) ? 'Remover do projeto' : 'Adicionar ao projeto'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Agent Dialog */}
      <Dialog open={showCustom} onOpenChange={setShowCustom}>
        <DialogContent className="glass max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Agente Customizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={customAgent.name} onChange={e => setCustomAgent(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Content Writer" />
            </div>
            <div className="space-y-2">
              <Label>Slug (identificador)</Label>
              <Input value={customAgent.slug} onChange={e => setCustomAgent(p => ({ ...p, slug: e.target.value }))} placeholder="Ex: content-writer" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={customAgent.role} onChange={e => setCustomAgent(p => ({ ...p, role: e.target.value }))} placeholder="Ex: Escritor de conteudo especializado" />
            </div>
            <div className="space-y-2">
              <Label>System Prompt</Label>
              <Textarea
                value={customAgent.systemPrompt}
                onChange={e => setCustomAgent(p => ({ ...p, systemPrompt: e.target.value }))}
                placeholder="Instrucoes para o agente..."
                rows={4}
              />
            </div>
            <Button onClick={handleCreateCustom} className="w-full" disabled={!customAgent.name || !customAgent.role}>
              Criar Agente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
