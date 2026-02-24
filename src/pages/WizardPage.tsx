import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '@/stores/wizard-store';
import { StepProgress } from '@/components/wizard/StepProgress';
import { StepContextPanel } from '@/components/wizard/StepContextPanel';
import { ChatPanel } from '@/components/wizard/ChatPanel';
import { AgentCatalog } from '@/components/wizard/AgentCatalog';
import { SquadBuilder } from '@/components/wizard/SquadBuilder';
import { FilePreview } from '@/components/wizard/FilePreview';
import { ArchitectureDiagram } from '@/components/wizard/ArchitectureDiagram';
import { ORCHESTRATION_PATTERNS } from '@/data/orchestration-patterns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Cpu, Bot, Users, Network,
  FileText, GitBranch, Check, Download, Package,
  AlertCircle, Sparkles, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateAiosPackage } from '@/lib/generate-aios-package';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'framer-motion';

export default function WizardPage() {
  const store = useWizardStore();
  const navigate = useNavigate();
  const [rightPanel, setRightPanel] = useState<'preview' | 'diagram' | 'agents' | 'squads'>('agents');
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate('/auth');
    };
    checkAuth();
  }, [navigate]);

  // Track unsaved changes
  useEffect(() => {
    if (store.agents.length > 0 || store.project.name) {
      setHasUnsavedChanges(true);
    }
  }, [store.agents, store.squads, store.project]);

  // Warn on navigation away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Auto-switch right panel based on step — every step has a relevant tab
  useEffect(() => {
    switch (store.currentStep) {
      case 'welcome':
      case 'context_analysis':
      case 'project_config':
        setRightPanel('preview'); // Show files evolving in real-time
        break;
      case 'agents':
        setRightPanel('agents');
        break;
      case 'squads':
        setRightPanel('squads');
        break;
      case 'integrations':
      case 'review':
      case 'generation':
        setRightPanel('preview');
        break;
    }
  }, [store.currentStep]);

  // Compute live file count for the evolution header
  const fileCount = useMemo(
    () => generateAiosPackage({ project: store.project, agents: store.agents, squads: store.squads, complianceResults: store.complianceResults }).length,
    [store.project, store.agents, store.squads, store.complianceResults]
  );

  const handleSaveProject = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nao autenticado');

      // Create project
      const projectData = {
        name: store.project.name || 'Meu AIOS',
        description: store.project.description || '',
        domain: store.project.domain || 'software',
        orchestration_pattern: (store.project.orchestrationPattern || 'TASK_FIRST') as any,
        config: JSON.parse(JSON.stringify(store.project.config || {})),
        user_id: user.id,
      };
      const { data: proj, error: projErr } = await supabase.from('projects').insert(projectData as any).select().single();
      if (projErr) throw projErr;

      // Batch insert agents
      if (store.agents.length > 0) {
        const agentRows = store.agents.map(agent => ({
          project_id: proj.id,
          name: agent.name,
          slug: agent.slug,
          role: agent.role,
          system_prompt: agent.systemPrompt,
          llm_model: agent.llmModel,
          commands: JSON.parse(JSON.stringify(agent.commands)),
          tools: JSON.parse(JSON.stringify(agent.tools)),
          skills: JSON.parse(JSON.stringify(agent.skills)),
          visibility: agent.visibility,
          is_custom: agent.isCustom,
          definition_md: '',
        }));
        const { error: agentErr } = await supabase.from('agents').insert(agentRows as any);
        if (agentErr) throw agentErr;
      }

      // Batch insert squads
      if (store.squads.length > 0) {
        const squadRows = store.squads.map(squad => ({
          project_id: proj.id,
          name: squad.name,
          slug: squad.slug,
          description: squad.description,
          manifest_yaml: squad.manifestYaml || '',
          tasks: JSON.parse(JSON.stringify(squad.tasks)),
          workflows: JSON.parse(JSON.stringify(squad.workflows)),
          agent_ids: JSON.parse(JSON.stringify(squad.agentIds)),
          is_validated: squad.isValidated,
        }));
        const { error: squadErr } = await supabase.from('squads').insert(squadRows as any);
        if (squadErr) throw squadErr;
      }

      // Save generated files in batch
      const files = generateAiosPackage({ project: store.project, agents: store.agents, squads: store.squads, complianceResults: store.complianceResults });
      if (files.length > 0) {
        const fileRows = files.map(file => ({
          project_id: proj.id,
          path: file.path,
          content: file.content,
          file_type: file.type,
          compliance_status: file.complianceStatus,
          compliance_notes: file.complianceNotes || null,
        }));
        const { error: fileErr } = await supabase.from('generated_files').insert(fileRows);
        if (fileErr) throw fileErr;
      }

      setHasUnsavedChanges(false);
      toast.success('Projeto salvo com sucesso!');
      navigate(`/project/${proj.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadZip = useCallback(async () => {
    const files = generateAiosPackage({ project: store.project, agents: store.agents, squads: store.squads, complianceResults: store.complianceResults });
    const zip = new JSZip();
    files.forEach(f => zip.file(f.path, f.content));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(store.project.name || 'aios').toLowerCase().replace(/\s+/g, '-')}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ZIP baixado!');
  }, [store.project, store.agents, store.squads, store.complianceResults]);

  const canProceed = store.canProceed();
  const stepIdx = store.getStepIndex();

  const renderStepContent = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={store.currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col min-h-0"
        >
          {renderStepInner()}
        </motion.div>
      </AnimatePresence>
    );
  };

  const renderStepInner = () => {
    switch (store.currentStep) {
      case 'welcome':
      case 'context_analysis':
        return <ChatPanel />;

      case 'project_config':
        return (
          <div className="p-6 space-y-6 overflow-y-auto h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Configuracao do Projeto</h3>
                <p className="text-xs text-muted-foreground">Defina os detalhes basicos do seu AIOS</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Projeto *</Label>
                <Input
                  value={store.project.name || ''}
                  onChange={e => store.updateProject({ name: e.target.value })}
                  placeholder="Meu AIOS"
                  className={cn(!store.project.name && 'border-yellow-400/30')}
                />
                {!store.project.name && (
                  <p className="text-[11px] text-yellow-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Obrigatorio para prosseguir</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Descricao</Label>
                <Textarea
                  value={store.project.description || ''}
                  onChange={e => store.updateProject({ description: e.target.value })}
                  placeholder="Descreva o objetivo do seu sistema..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Dominio</Label>
                <div className="flex gap-2 flex-wrap">
                  {['software', 'conteudo', 'negocios', 'educacao', 'saude', 'financeiro'].map(d => (
                    <Badge
                      key={d}
                      variant={store.project.domain === d ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-all',
                        store.project.domain === d && 'shadow-[var(--shadow-glow)]'
                      )}
                      onClick={() => store.updateProject({ domain: d })}
                    >
                      {d}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Padrao de Orquestracao</Label>
                <div className="grid grid-cols-1 gap-2">
                  {ORCHESTRATION_PATTERNS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => store.updateProject({ orchestrationPattern: p.id })}
                      className={cn(
                        'text-left p-3 rounded-lg border transition-all group',
                        store.project.orchestrationPattern === p.id
                          ? 'border-primary/40 bg-primary/5 shadow-[0_0_15px_-5px_hsl(var(--glow-primary)/0.2)]'
                          : 'border-border/50 bg-card/30 hover:border-primary/20'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Network className={cn(
                          'w-4 h-4',
                          store.project.orchestrationPattern === p.id ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/60'
                        )} />
                        <span className="font-medium text-sm">{p.name}</span>
                        {store.project.orchestrationPattern === p.id && (
                          <Check className="w-3.5 h-3.5 text-primary ml-auto" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {p.useCases.slice(0, 2).map(uc => (
                          <span key={uc} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground">{uc}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'agents':
        return <ChatPanel />;

      case 'squads':
        return <ChatPanel />;

      case 'integrations':
        return (
          <div className="p-6 space-y-4 overflow-y-auto h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
                <Network className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">Integracoes</h3>
                <p className="text-xs text-muted-foreground">Configure servicos externos para seu AIOS</p>
              </div>
            </div>
            {[
              { name: 'Claude API', desc: 'Modelos Anthropic (Claude Opus, Sonnet, Haiku)', configured: store.agents.some(a => a.llmModel.includes('claude')) },
              { name: 'OpenAI API', desc: 'Modelos GPT (GPT-4o, GPT-4o-mini)', configured: store.agents.some(a => a.llmModel.includes('gpt')) },
              { name: 'Google Gemini', desc: 'Modelos Google (Gemini Flash, Pro)', configured: store.agents.some(a => a.llmModel.includes('gemini')) },
              { name: 'N8N', desc: 'Automacao de workflows', configured: false },
              { name: 'Notion', desc: 'Documentacao e knowledge base', configured: false },
              { name: 'MCP Server', desc: 'Model Context Protocol', configured: false },
            ].map(integration => (
              <div key={integration.name} className={cn(
                'flex items-center justify-between p-4 rounded-lg border transition-all',
                integration.configured
                  ? 'border-glow-success/30 bg-glow-success/5'
                  : 'border-border/50 bg-card/30'
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    integration.configured ? 'bg-glow-success/10' : 'bg-secondary'
                  )}>
                    {integration.configured ? <Check className="w-4 h-4 text-glow-success" /> : <Network className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <span className="text-sm font-medium">{integration.name}</span>
                    <p className="text-xs text-muted-foreground">{integration.desc}</p>
                  </div>
                </div>
                <Badge variant={integration.configured ? 'default' : 'outline'} className="text-xs">
                  {integration.configured ? 'Auto-detectado' : 'Manual'}
                </Badge>
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-4">
              As API keys serao configuradas no arquivo <code className="px-1 py-0.5 rounded bg-muted text-xs">.env</code> do pacote gerado.
            </p>
          </div>
        );

      case 'review': {
        const total = Object.keys(store.complianceResults).length;
        const passed = Object.values(store.complianceResults).filter(r => r.status === 'passed').length;
        const warnings = Object.values(store.complianceResults).filter(r => r.status === 'warning').length;
        const failed = Object.values(store.complianceResults).filter(r => r.status === 'failed').length;
        const files = generateAiosPackage({ project: store.project, agents: store.agents, squads: store.squads });

        return (
          <div className="p-6 space-y-4 overflow-y-auto h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Revisao do Projeto</h3>
                <p className="text-xs text-muted-foreground">Revise antes de gerar o pacote</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Project summary */}
              <div className="p-4 rounded-lg border border-border/50 bg-card/50">
                <p className="text-xs text-muted-foreground mb-2">Projeto</p>
                <p className="font-semibold">{store.project.name || '(sem nome)'}</p>
                <p className="text-sm text-muted-foreground mt-1">{store.project.description || 'Sem descricao'}</p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs">{store.project.domain}</Badge>
                  <Badge variant="secondary" className="text-xs">{store.project.orchestrationPattern}</Badge>
                </div>
              </div>

              {/* Agents */}
              <div className="p-4 rounded-lg border border-border/50 bg-card/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Agentes</p>
                  <Badge variant="outline" className="text-[10px]">{store.agents.length}</Badge>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {store.agents.map(a => (
                    <Badge key={a.slug} variant="secondary" className="text-xs gap-1">
                      <Bot className="w-3 h-3" />{a.name}
                    </Badge>
                  ))}
                  {store.agents.length === 0 && <span className="text-xs text-yellow-400">Nenhum agente adicionado</span>}
                </div>
              </div>

              {/* Squads */}
              <div className="p-4 rounded-lg border border-border/50 bg-card/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Squads</p>
                  <Badge variant="outline" className="text-[10px]">{store.squads.length}</Badge>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {store.squads.map(s => (
                    <Badge key={s.slug} variant="secondary" className="text-xs gap-1">
                      <Users className="w-3 h-3" />{s.name}
                    </Badge>
                  ))}
                  {store.squads.length === 0 && <span className="text-xs text-muted-foreground">(opcional)</span>}
                </div>
              </div>

              {/* Package summary */}
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-primary" />
                  <p className="text-xs font-medium text-primary">Pacote de Instalacao</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {files.length} arquivos serao gerados incluindo: runtime TypeScript, configuracoes YAML,
                  definicoes de agentes, manifests de squads, Dockerfile, scripts de setup e documentacao completa.
                </p>
              </div>

              {/* Compliance */}
              <div className={cn(
                'p-4 rounded-lg border',
                store.complianceReviewed
                  ? failed > 0 ? 'border-destructive/30 bg-destructive/5' : 'border-glow-success/30 bg-glow-success/5'
                  : 'border-border/50 bg-card/50'
              )}>
                <p className="text-xs text-muted-foreground mb-2">Conformidade AIOS</p>
                {store.complianceReviewed ? (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-glow-success font-medium">{passed} aprovados</span>
                    {warnings > 0 && <span className="text-yellow-400 font-medium">{warnings} avisos</span>}
                    {failed > 0 && <span className="text-destructive font-medium">{failed} reprovados</span>}
                    <span className="text-muted-foreground text-xs">de {total}</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Execute a revisao na aba Arquivos para validar.</p>
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'generation':
        return (
          <div className="p-6 space-y-6 overflow-y-auto h-full flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-20 h-20 rounded-2xl bg-glow-success/10 border border-glow-success/30 flex items-center justify-center shadow-[0_0_40px_-10px_hsl(var(--glow-success)/0.3)]"
            >
              <Package className="w-10 h-10 text-glow-success" />
            </motion.div>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <h3 className="font-bold text-xl mb-2">Pacote Pronto!</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Seu AIOS <strong className="text-foreground">{store.project.name || 'Meu AIOS'}</strong> esta
                configurado e pronto para uso. O pacote inclui runtime completo, configuracoes, Docker e documentacao.
              </p>
            </motion.div>
            {!store.complianceReviewed && (
              <p className="text-xs text-yellow-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Revisao de conformidade nao executada. Recomendamos revisar antes de salvar.
              </p>
            )}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex gap-3"
            >
              <Button onClick={handleSaveProject} disabled={saving} className="gap-2 h-11 px-6 shadow-[var(--shadow-glow)]">
                {saving ? 'Salvando...' : 'Salvar Projeto'}
              </Button>
              <Button variant="outline" onClick={handleDownloadZip} className="gap-2 h-11 px-6">
                <Download className="w-4 h-4" /> Download ZIP
              </Button>
            </motion.div>
          </div>
        );

      default:
        return <ChatPanel />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border/50 shrink-0 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => {
            if (hasUnsavedChanges && !confirm('Tem alteracoes nao salvas. Deseja sair?')) return;
            navigate('/dashboard');
          }}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <span className="font-semibold text-sm">AIOS Wizard</span>
              {store.project.name && (
                <span className="text-xs text-muted-foreground ml-2">— {store.project.name}</span>
              )}
            </div>
          </div>
        </div>
        <StepProgress />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={store.prevStep} disabled={stepIdx === 0}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={store.nextStep}
            disabled={store.currentStep === 'generation' || !canProceed}
            className={cn('gap-1.5', !canProceed && 'opacity-50')}
          >
            Proximo <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="flex-1 border-r border-border/50 flex flex-col min-w-0">
          <StepContextPanel />
          {renderStepContent()}
        </div>

        {/* Right panel */}
        <div className="w-[45%] flex flex-col min-w-0">
          {/* Evolution status header */}
          <div className="px-4 py-3 border-b border-border/50 bg-card/40 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-semibold">Construindo seu AIOS</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Etapa {stepIdx + 1} de 8
              </Badge>
            </div>
            <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden mb-2.5">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: `${((stepIdx + 1) / 8) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <div className="flex gap-4 text-[10px]">
              <span className={cn(
                'flex items-center gap-1 transition-colors',
                store.agents.length > 0 ? 'text-glow-success' : 'text-muted-foreground'
              )}>
                <Bot className="w-3 h-3" />
                <span className="font-mono">{store.agents.length}</span> agentes
              </span>
              <span className={cn(
                'flex items-center gap-1 transition-colors',
                store.squads.length > 0 ? 'text-glow-success' : 'text-muted-foreground'
              )}>
                <Users className="w-3 h-3" />
                <span className="font-mono">{store.squads.length}</span> squads
              </span>
              <span className="flex items-center gap-1 text-primary">
                <FileText className="w-3 h-3" />
                <span className="font-mono">{fileCount}</span> arquivos
              </span>
            </div>
          </div>

          <Tabs value={rightPanel} onValueChange={(v) => setRightPanel(v as any)} className="flex flex-col flex-1 min-h-0">
            <TabsList className="mx-2 mt-2 shrink-0">
              <TabsTrigger value="agents" className="gap-1.5 text-xs">
                <Bot className="w-3.5 h-3.5" /> Agentes
                <span className={cn(
                  'ml-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center',
                  store.agents.length > 0 ? 'bg-glow-success/20 text-glow-success' : 'bg-secondary text-muted-foreground'
                )}>{store.agents.length}</span>
              </TabsTrigger>
              <TabsTrigger value="squads" className="gap-1.5 text-xs">
                <Users className="w-3.5 h-3.5" /> Squads
                <span className={cn(
                  'ml-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center',
                  store.squads.length > 0 ? 'bg-glow-success/20 text-glow-success' : 'bg-secondary text-muted-foreground'
                )}>{store.squads.length}</span>
              </TabsTrigger>
              <TabsTrigger value="diagram" className="gap-1.5 text-xs"><GitBranch className="w-3.5 h-3.5" /> Diagrama</TabsTrigger>
              <TabsTrigger value="preview" className="gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5" /> Arquivos
                <span className="ml-1 w-5 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center">{fileCount}</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="agents" className="flex-1 overflow-hidden m-0"><AgentCatalog /></TabsContent>
            <TabsContent value="squads" className="flex-1 overflow-hidden m-0"><SquadBuilder /></TabsContent>
            <TabsContent value="diagram" className="flex-1 overflow-hidden m-0"><ArchitectureDiagram /></TabsContent>
            <TabsContent value="preview" className="flex-1 overflow-hidden m-0"><FilePreview /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
