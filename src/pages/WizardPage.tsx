import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '@/stores/wizard-store';
import { StepProgress } from '@/components/wizard/StepProgress';
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
  FileText, GitBranch, Eye, Settings, Download, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateFileTree } from '@/components/wizard/FilePreview';
import JSZip from 'jszip';

export default function WizardPage() {
  const store = useWizardStore();
  const navigate = useNavigate();
  const [rightPanel, setRightPanel] = useState<'preview' | 'diagram' | 'agents' | 'squads'>('agents');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate('/auth');
    };
    checkAuth();
  }, [navigate]);

  // Auto-switch right panel based on step
  useEffect(() => {
    switch (store.currentStep) {
      case 'agents': setRightPanel('agents'); break;
      case 'squads': setRightPanel('squads'); break;
      case 'review': case 'generation': setRightPanel('preview'); break;
      default: break;
    }
  }, [store.currentStep]);

  const handleSaveProject = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

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

      // Create agents
      for (const agent of store.agents) {
        await supabase.from('agents').insert({
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
        } as any);
      }

      // Create squads
      for (const squad of store.squads) {
        await supabase.from('squads').insert({
          project_id: proj.id,
          name: squad.name,
          slug: squad.slug,
          description: squad.description,
          manifest_yaml: squad.manifestYaml || '',
          tasks: JSON.parse(JSON.stringify(squad.tasks)),
          workflows: JSON.parse(JSON.stringify(squad.workflows)),
          agent_ids: JSON.parse(JSON.stringify(squad.agentIds)),
          is_validated: squad.isValidated,
        } as any);
      }

      // Save generated files with compliance data
      const files = generateFileTree(store.project, store.agents, store.squads, store.complianceResults);
      for (const file of files) {
        await supabase.from('generated_files').insert({
          project_id: proj.id,
          path: file.path,
          content: file.content,
          file_type: file.type,
          compliance_status: file.complianceStatus,
          compliance_notes: file.complianceNotes || null,
        });
      }

      toast.success('Projeto salvo com sucesso!');
      navigate(`/project/${proj.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadZip = async () => {
    const files = generateFileTree(store.project, store.agents, store.squads, store.complianceResults);
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
  };

  const renderStepContent = () => {
    switch (store.currentStep) {
      case 'welcome':
      case 'context_analysis':
        return <ChatPanel />;

      case 'project_config':
        return (
          <div className="p-6 space-y-6 overflow-y-auto h-full">
            <h3 className="font-semibold">Configuração do Projeto</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Projeto</Label>
                <Input
                  value={store.project.name || ''}
                  onChange={e => store.updateProject({ name: e.target.value })}
                  placeholder="Meu AIOS"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={store.project.description || ''}
                  onChange={e => store.updateProject({ description: e.target.value })}
                  placeholder="Descreva o objetivo do seu sistema..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Domínio</Label>
                <div className="flex gap-2 flex-wrap">
                  {['software', 'conteúdo', 'negócios', 'educação'].map(d => (
                    <Badge
                      key={d}
                      variant={store.project.domain === d ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => store.updateProject({ domain: d })}
                    >
                      {d}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Padrão de Orquestração</Label>
                <div className="grid grid-cols-1 gap-2">
                  {ORCHESTRATION_PATTERNS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => store.updateProject({ orchestrationPattern: p.id })}
                      className={cn(
                        'text-left p-3 rounded-lg border transition-all',
                        store.project.orchestrationPattern === p.id
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border/50 bg-card/30 hover:border-primary/20'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Network className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">{p.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
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
            <h3 className="font-semibold">Integrações</h3>
            <p className="text-sm text-muted-foreground">Configure integrações externas para seu AIOS.</p>
            {['Claude API', 'OpenAI API', 'N8N', 'Notion', 'Miro', 'MCP Server'].map(name => (
              <div key={name} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/30">
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{name}</span>
                </div>
                <Badge variant="outline" className="text-xs">Não configurado</Badge>
              </div>
            ))}
          </div>
        );

      case 'review': {
        const total = Object.keys(store.complianceResults).length;
        const passed = Object.values(store.complianceResults).filter(r => r.status === 'passed').length;
        const warnings = Object.values(store.complianceResults).filter(r => r.status === 'warning').length;
        const failed = Object.values(store.complianceResults).filter(r => r.status === 'failed').length;
        return (
          <div className="p-6 space-y-4 overflow-y-auto h-full">
            <h3 className="font-semibold">Revisão do Projeto</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-border/50 bg-card/50">
                <p className="text-xs text-muted-foreground mb-1">Projeto</p>
                <p className="font-medium text-sm">{store.project.name || '(sem nome)'}</p>
                <p className="text-xs text-muted-foreground">{store.project.domain} • {store.project.orchestrationPattern}</p>
              </div>
              <div className="p-3 rounded-lg border border-border/50 bg-card/50">
                <p className="text-xs text-muted-foreground mb-1">Agentes ({store.agents.length})</p>
                <div className="flex gap-1.5 flex-wrap">
                  {store.agents.map(a => <Badge key={a.slug} variant="secondary" className="text-xs">{a.name}</Badge>)}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-border/50 bg-card/50">
                <p className="text-xs text-muted-foreground mb-1">Squads ({store.squads.length})</p>
                <div className="flex gap-1.5 flex-wrap">
                  {store.squads.map(s => <Badge key={s.slug} variant="secondary" className="text-xs">{s.name}</Badge>)}
                </div>
              </div>
              {/* Compliance summary */}
              <div className={cn(
                'p-3 rounded-lg border',
                store.complianceReviewed
                  ? failed > 0 ? 'border-destructive/30 bg-destructive/5' : 'border-glow-success/30 bg-glow-success/5'
                  : 'border-border/50 bg-card/50'
              )}>
                <p className="text-xs text-muted-foreground mb-1">Conformidade AIOS</p>
                {store.complianceReviewed ? (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-glow-success font-medium">{passed} aprovados</span>
                    {warnings > 0 && <span className="text-yellow-400 font-medium">{warnings} avisos</span>}
                    {failed > 0 && <span className="text-destructive font-medium">{failed} reprovados</span>}
                    <span className="text-muted-foreground">de {total}</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Execute a revisão na aba Arquivos para validar.</p>
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'generation':
        return (
          <div className="p-6 space-y-6 overflow-y-auto h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-glow-success/10 border border-glow-success/30 flex items-center justify-center">
              <Check className="w-8 h-8 text-glow-success" />
            </div>
            <h3 className="font-semibold text-lg">Pronto para gerar!</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Seu AIOS está configurado. Salve o projeto no banco ou baixe o ZIP com todos os arquivos.
            </p>
            {!store.complianceReviewed && (
              <p className="text-xs text-yellow-400">⚠ Revisão de conformidade não executada. Recomendamos revisar antes de salvar.</p>
            )}
            <div className="flex gap-3">
              <Button onClick={handleSaveProject} disabled={saving} className="gap-2">
                {saving ? 'Salvando...' : 'Salvar Projeto'}
              </Button>
              <Button variant="outline" onClick={handleDownloadZip} className="gap-2">
                <Download className="w-4 h-4" /> Download ZIP
              </Button>
            </div>
          </div>
        );

      default:
        return <ChatPanel />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">AIOS Wizard</span>
          </div>
        </div>
        <StepProgress />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={store.prevStep} disabled={store.getStepIndex() === 0}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={store.nextStep} disabled={store.currentStep === 'generation'} className="gap-1.5">
            Próximo <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="flex-1 border-r border-border/50 flex flex-col min-w-0">
          {renderStepContent()}
        </div>

        {/* Right panel */}
        <div className="w-[45%] flex flex-col min-w-0">
          <Tabs value={rightPanel} onValueChange={(v) => setRightPanel(v as any)} className="flex flex-col h-full">
            <TabsList className="mx-2 mt-2 shrink-0">
              <TabsTrigger value="agents" className="gap-1.5 text-xs"><Bot className="w-3.5 h-3.5" /> Agentes</TabsTrigger>
              <TabsTrigger value="squads" className="gap-1.5 text-xs"><Users className="w-3.5 h-3.5" /> Squads</TabsTrigger>
              <TabsTrigger value="diagram" className="gap-1.5 text-xs"><GitBranch className="w-3.5 h-3.5" /> Diagrama</TabsTrigger>
              <TabsTrigger value="preview" className="gap-1.5 text-xs"><FileText className="w-3.5 h-3.5" /> Arquivos</TabsTrigger>
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
