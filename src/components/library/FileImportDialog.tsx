/**
 * @agent     FileImportDialog
 * @persona   Dialog multi-step para importar elementos da Library via upload de arquivos
 * @commands  render
 * @context   Permite ao usuario importar agents, skills, squads e workflows via JSON, MD ou pacotes AIOS.
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, FileJson, FileText, Bot, Zap, Users, GitBranch, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, X, HelpCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { importElementFromFile } from '@/services/library-import.service';
import { isAiosPackage, detectAiosPackageType, parseAiosPackage } from '@/services/aios-package-parser';
import type { LibraryEntityType } from '@/types/library';

interface FileImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

type Step = 'type' | 'upload' | 'preview';

interface ParsedElement {
  fileName: string;
  entityType: LibraryEntityType;
  data: Record<string, unknown>;
  errors: string[];
  warnings: string[];
  isValid: boolean;
  rawContent: string;
}

const TYPE_META: Record<LibraryEntityType, { label: string; icon: typeof Bot; color: string }> = {
  agent: { label: 'Agent', icon: Bot, color: 'hsl(var(--library-agent))' },
  skill: { label: 'Skill', icon: Zap, color: 'hsl(var(--library-skill))' },
  squad: { label: 'Squad', icon: Users, color: 'hsl(var(--library-squad))' },
  workflow: { label: 'Workflow', icon: GitBranch, color: 'hsl(var(--library-workflow))' },
};

const HELP_CONTENT: Record<LibraryEntityType, { title: string; description: string; fields: { name: string; required: boolean; desc: string }[]; tips: string[] }> = {
  agent: {
    title: 'Importar Agent',
    description: 'Envie um arquivo JSON com a definicao do agente, ou um arquivo .md com headers @agent.',
    fields: [
      { name: 'name', required: true, desc: 'Nome do agente' },
      { name: 'slug', required: true, desc: 'Identificador unico (kebab-case)' },
      { name: 'role', required: true, desc: 'Papel/funcao do agente' },
      { name: 'system_prompt', required: false, desc: 'Prompt de sistema' },
      { name: 'llm_model', required: false, desc: 'Modelo LLM (padrao: gemini-3-flash)' },
      { name: 'commands', required: false, desc: 'Array de comandos [{name, description}]' },
      { name: 'tools', required: false, desc: 'Array de ferramentas' },
      { name: 'skills', required: false, desc: 'Array de skills' },
      { name: 'tags', required: false, desc: 'Array de tags' },
    ],
    tips: [
      'Arquivos .md: use o formato @agent com headers @name, @role, @slug no docblock.',
      'Voce tambem pode importar arquivos .agent gerados pelo Claude Code ou outros geradores AIOS.',
      'Se slug nao for informado, sera gerado a partir do name.',
    ],
  },
  skill: {
    title: 'Importar Skill',
    description: 'Envie um arquivo JSON com a definicao da skill.',
    fields: [
      { name: 'name', required: true, desc: 'Nome da skill' },
      { name: 'slug', required: true, desc: 'Identificador unico' },
      { name: 'description', required: false, desc: 'Descricao da skill' },
      { name: 'category', required: false, desc: 'Categoria (padrao: general)' },
      { name: 'prompt', required: false, desc: 'Prompt da skill' },
      { name: 'inputs', required: false, desc: 'Array de inputs [{name, type, description}]' },
      { name: 'outputs', required: false, desc: 'Array de outputs [{name, type, description}]' },
      { name: 'examples', required: false, desc: 'Array de exemplos [{title, input, output}]' },
      { name: 'tags', required: false, desc: 'Array de tags' },
    ],
    tips: [
      'Voce tambem pode importar arquivos .skill gerados pelo Claude Code ou outros geradores AIOS.',
      'O arquivo .skill e um pacote ZIP contendo SKILL.md com a definicao completa.',
    ],
  },
  squad: {
    title: 'Importar Squad',
    description: 'Envie o JSON do squad. Para importar com agentes, inclua os JSONs dos agentes no mesmo upload.',
    fields: [
      { name: 'name', required: true, desc: 'Nome do squad' },
      { name: 'slug', required: true, desc: 'Identificador unico' },
      { name: 'description', required: false, desc: 'Descricao do squad' },
      { name: 'agent_ids', required: false, desc: 'Array de slugs dos agentes' },
      { name: 'tasks', required: false, desc: 'Array de tasks [{name, description, agentSlug}]' },
      { name: 'workflows', required: false, desc: 'Array de workflows' },
      { name: 'tags', required: false, desc: 'Array de tags' },
    ],
    tips: [
      'Voce pode enviar multiplos arquivos: 1 squad + N agentes.',
      'O sistema detecta automaticamente squads (campo agent_ids) vs agentes.',
      'Agentes enviados junto serao importados automaticamente.',
      'Voce tambem pode importar arquivos .squad gerados pelo Claude Code.',
    ],
  },
  workflow: {
    title: 'Importar Workflow',
    description: 'Envie um arquivo JSON com a definicao do workflow.',
    fields: [
      { name: 'name', required: true, desc: 'Nome do workflow' },
      { name: 'slug', required: true, desc: 'Identificador unico' },
      { name: 'pattern', required: false, desc: 'Padrao: sequential, parallel ou conditional' },
      { name: 'steps', required: false, desc: 'Array de steps [{name, agentSlug, task}]' },
      { name: 'triggers', required: false, desc: 'Array de triggers [{type, description}]' },
      { name: 'outputs', required: false, desc: 'Array de outputs' },
      { name: 'tags', required: false, desc: 'Array de tags' },
    ],
    tips: [
      'Voce tambem pode importar arquivos .workflow gerados pelo Claude Code.',
      'O arquivo .workflow e um pacote ZIP contendo WORKFLOW.md com a definicao completa.',
    ],
  },
};

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseAgentMd(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const nameMatch = content.match(/@(?:agent|name)\s+(.*)/i);
  const roleMatch = content.match(/@(?:persona|role)\s+(.*)/i);
  const slugMatch = content.match(/@slug\s+(.*)/i);
  const versionMatch = content.match(/@version\s+(.*)/i);

  if (nameMatch) result.name = nameMatch[1].trim();
  if (roleMatch) result.role = roleMatch[1].trim();
  if (slugMatch) result.slug = slugMatch[1].trim();
  if (versionMatch) result.version = versionMatch[1].trim();

  if (result.name && !result.slug) {
    result.slug = toSlug(result.name as string);
  }

  const docblockEnd = content.indexOf('*/');
  if (docblockEnd !== -1) {
    const body = content.slice(docblockEnd + 2).trim();
    if (body) result.system_prompt = body;
  }

  return result;
}

function parseFile(file: File, content: string, entityType: LibraryEntityType): ParsedElement {
  const errors: string[] = [];
  let data: Record<string, unknown> = {};
  const ext = file.name.split('.').pop()?.toLowerCase();

  try {
    if (ext === 'json') {
      data = JSON.parse(content);
    } else if (ext === 'md' && entityType === 'agent') {
      data = parseAgentMd(content);
    } else {
      errors.push(`Formato .${ext} nao suportado. Use JSON${entityType === 'agent' ? ' ou MD' : ''}.`);
    }
  } catch {
    errors.push('Erro ao fazer parse do arquivo. Verifique se o JSON e valido.');
  }

  let detectedType = entityType;
  if (entityType === 'squad' && !data.agent_ids && data.role) {
    detectedType = 'agent';
  }

  if (!data.name) errors.push('Campo obrigatorio ausente: name');
  if (!data.slug && data.name) {
    data.slug = toSlug(data.name as string);
  }
  if (!data.slug) errors.push('Campo obrigatorio ausente: slug');

  return {
    fileName: file.name,
    entityType: detectedType,
    data,
    errors,
    warnings: [],
    isValid: errors.length === 0,
    rawContent: content,
  };
}

/** Returns field-level summary for the preview */
function getFieldSummary(el: ParsedElement): { label: string; value: string; empty: boolean }[] {
  const fields: { label: string; value: string; empty: boolean }[] = [];
  const d = el.data;

  fields.push({ label: 'Nome', value: (d.name as string) || '', empty: !d.name });
  fields.push({ label: 'Slug', value: (d.slug as string) || '', empty: !d.slug });

  if (el.entityType === 'skill') {
    const desc = (d.description as string) || '';
    fields.push({ label: 'Descricao', value: desc.length > 80 ? desc.slice(0, 80) + '…' : desc, empty: desc.length < 3 });
    const prompt = (d.prompt as string) || '';
    fields.push({ label: 'Prompt', value: prompt ? `${prompt.length} caracteres` : '', empty: !prompt });
    fields.push({ label: 'Inputs', value: Array.isArray(d.inputs) && d.inputs.length > 0 ? `${d.inputs.length} item(ns)` : '', empty: !Array.isArray(d.inputs) || d.inputs.length === 0 });
    fields.push({ label: 'Outputs', value: Array.isArray(d.outputs) && d.outputs.length > 0 ? `${d.outputs.length} item(ns)` : '', empty: !Array.isArray(d.outputs) || d.outputs.length === 0 });
  } else if (el.entityType === 'agent') {
    fields.push({ label: 'Role', value: (d.role as string) || '', empty: !d.role });
    const sp = (d.system_prompt as string) || '';
    fields.push({ label: 'System Prompt', value: sp ? `${sp.length} caracteres` : '', empty: !sp });
    fields.push({ label: 'Commands', value: Array.isArray(d.commands) && d.commands.length > 0 ? `${d.commands.length} item(ns)` : '', empty: !Array.isArray(d.commands) || d.commands.length === 0 });
  } else if (el.entityType === 'squad') {
    fields.push({ label: 'Descricao', value: (d.description as string) || '', empty: !d.description });
    fields.push({ label: 'Agentes', value: Array.isArray(d.agent_ids) && d.agent_ids.length > 0 ? `${d.agent_ids.length} item(ns)` : '', empty: !Array.isArray(d.agent_ids) || d.agent_ids.length === 0 });
    fields.push({ label: 'Tasks', value: Array.isArray(d.tasks) && d.tasks.length > 0 ? `${d.tasks.length} item(ns)` : '', empty: !Array.isArray(d.tasks) || d.tasks.length === 0 });
  } else if (el.entityType === 'workflow') {
    fields.push({ label: 'Descricao', value: (d.description as string) || '', empty: !d.description });
    fields.push({ label: 'Pattern', value: (d.pattern as string) || '', empty: !d.pattern });
    fields.push({ label: 'Steps', value: Array.isArray(d.steps) && d.steps.length > 0 ? `${d.steps.length} item(ns)` : '', empty: !Array.isArray(d.steps) || d.steps.length === 0 });
  }

  return fields;
}

const MAX_FILE_SIZE = 1024 * 1024;
const MAX_FILES = 10;

export default function FileImportDialog({ open, onOpenChange, onImported }: FileImportDialogProps) {
  const [step, setStep] = useState<Step>('type');
  const [entityType, setEntityType] = useState<LibraryEntityType>('agent');
  const [parsedElements, setParsedElements] = useState<ParsedElement[]>([]);
  const [projectId, setProjectId] = useState<string>('');
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [expandedRaw, setExpandedRaw] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setStep('type');
    setParsedElements([]);
    setProjectId('');
    setImporting(false);
    setExpandedRaw(null);
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const loadProjects = useCallback(async () => {
    const { data } = await supabase.from('projects').select('id, name');
    const list = data ?? [];
    setProjects(list);
    if (list.length > 0 && !projectId) setProjectId(list[0].id);
  }, [projectId]);

  const goToUpload = () => {
    setStep('upload');
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files).slice(0, MAX_FILES);
    const results: ParsedElement[] = [];

    for (const file of fileArr) {
      if (file.size > MAX_FILE_SIZE) {
        results.push({
          fileName: file.name,
          entityType,
          data: {},
          errors: [`Arquivo excede o limite de 1MB (${(file.size / 1024 / 1024).toFixed(1)}MB)`],
          warnings: [],
          isValid: false,
          rawContent: '',
        });
        continue;
      }

      if (isAiosPackage(file.name)) {
        const result = await parseAiosPackage(file);
        results.push({
          fileName: file.name,
          entityType: result.entityType,
          data: result.data,
          errors: result.errors,
          warnings: result.warnings,
          isValid: result.errors.length === 0,
          rawContent: result.rawContent,
        });
        continue;
      }

      const content = await file.text();
      results.push(parseFile(file, content, entityType));
    }

    setParsedElements(results);
    await loadProjects();
    setStep('preview');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) processFiles(e.target.files);
  };

  const handleImport = async () => {
    if (!projectId) {
      toast({ title: 'Selecione um projeto', variant: 'destructive' });
      return;
    }
    const validElements = parsedElements.filter((e) => e.isValid);
    if (validElements.length === 0) return;

    setImporting(true);
    try {
      let importedCount = 0;
      for (const el of validElements) {
        await importElementFromFile(el.entityType, el.data, projectId);
        importedCount++;
      }
      toast({
        title: `${importedCount} elemento(s) importado(s)`,
        description: 'Os elementos foram adicionados a Library com sucesso.',
      });
      onImported();
      handleOpenChange(false);
    } catch (e) {
      toast({ title: 'Erro na importacao', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const help = HELP_CONTENT[entityType];
  const validCount = parsedElements.filter((e) => e.isValid).length;
  const totalWarnings = parsedElements.reduce((sum, el) => sum + el.warnings.length, 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" />
            Importar da Arquivo — Passo {step === 'type' ? '1/3' : step === 'upload' ? '2/3' : '3/3'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Select type */}
        {step === 'type' && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Que tipo de elemento deseja importar?</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(TYPE_META) as [LibraryEntityType, typeof TYPE_META['agent']][]).map(([type, meta]) => {
                const Icon = meta.icon;
                return (
                  <button
                    key={type}
                    onClick={() => setEntityType(type)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left text-xs transition-colors ${
                      entityType === type
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border hover:border-muted-foreground/30 text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" style={{ color: meta.color }} />
                    <span className="font-medium">{meta.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button size="sm" className="text-xs gap-1" onClick={goToUpload}>
                Proximo <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Help + Upload */}
        {step === 'upload' && (
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                {help.title}
              </div>
              <p className="text-[11px] text-muted-foreground">{help.description}</p>
              <ScrollArea className="max-h-[140px]">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left font-medium pb-1">Campo</th>
                      <th className="text-left font-medium pb-1 w-16">Obrigatorio</th>
                      <th className="text-left font-medium pb-1">Descricao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {help.fields.map((f) => (
                      <tr key={f.name} className="border-t border-border/50">
                        <td className="py-0.5 font-mono text-primary/80">{f.name}</td>
                        <td className="py-0.5">{f.required ? <Badge variant="destructive" className="text-[9px] h-4">Sim</Badge> : <span className="text-muted-foreground">Nao</span>}</td>
                        <td className="py-0.5 text-muted-foreground">{f.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
              {help.tips.length > 0 && (
                <div className="space-y-0.5 pt-1 border-t border-border/50">
                  {help.tips.map((tip, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground flex gap-1">
                      <span className="text-primary">💡</span> {tip}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".json,.md,.skill,.agent,.squad,.workflow"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 p-8 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'
              }`}
            >
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Arraste arquivos aqui ou clique para selecionar</span>
              <span className="text-[10px] text-muted-foreground/60">JSON{entityType === 'agent' ? ', MD' : ''}, .{entityType} (pacote AIOS) • Max 1MB • Ate 10 arquivos</span>
            </div>

            <div className="flex justify-between">
              <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => setStep('type')}>
                <ChevronLeft className="w-3 h-3" /> Voltar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview + Confirm */}
        {step === 'preview' && (
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            {/* Warnings banner */}
            {totalWarnings > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-[11px] text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{totalWarnings} aviso(s): alguns campos podem nao ter sido extraidos corretamente. Verifique o preview abaixo.</span>
              </div>
            )}

            <ScrollArea className="flex-1 max-h-[320px]">
              <div className="space-y-2">
                {parsedElements.map((el, i) => {
                  const Meta = TYPE_META[el.entityType];
                  const Icon = Meta.icon;
                  const fieldSummary = getFieldSummary(el);
                  const hasWarnings = el.warnings.length > 0;
                  const borderClass = !el.isValid
                    ? 'border-destructive/50 bg-destructive/5'
                    : hasWarnings
                    ? 'border-yellow-500/30 bg-yellow-500/5'
                    : 'border-border';

                  return (
                    <div key={i} className={`rounded-lg border p-3 text-xs space-y-2 ${borderClass}`}>
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5" style={{ color: Meta.color }} />
                          <span className="font-medium">{(el.data.name as string) || el.fileName}</span>
                          <Badge variant="outline" className="text-[9px] h-4">{Meta.label}</Badge>
                        </div>
                        {el.isValid ? (
                          hasWarnings ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          )
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                        )}
                      </div>

                      {/* Field-level summary table */}
                      {el.isValid && (
                        <div className="rounded border border-border/50 overflow-hidden">
                          <table className="w-full text-[10px]">
                            <tbody>
                              {fieldSummary.map((f, fi) => (
                                <tr key={fi} className={fi > 0 ? 'border-t border-border/30' : ''}>
                                  <td className="px-2 py-0.5 font-medium text-muted-foreground w-24">{f.label}</td>
                                  <td className={`px-2 py-0.5 ${f.empty ? 'text-yellow-600 dark:text-yellow-400 italic' : 'text-foreground'}`}>
                                    {f.empty ? '(vazio)' : f.value}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Warnings */}
                      {el.warnings.map((warn, j) => (
                        <p key={j} className="text-yellow-600 dark:text-yellow-400 text-[10px] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> {warn}
                        </p>
                      ))}

                      {/* Errors */}
                      {el.errors.map((err, j) => (
                        <p key={j} className="text-destructive text-[10px] flex items-center gap-1">
                          <X className="w-3 h-3 shrink-0" /> {err}
                        </p>
                      ))}

                      {/* Raw content collapsible */}
                      {el.rawContent && (
                        <Collapsible open={expandedRaw === i} onOpenChange={(open) => setExpandedRaw(open ? i : null)}>
                          <CollapsibleTrigger className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronDown className={`w-3 h-3 transition-transform ${expandedRaw === i ? 'rotate-180' : ''}`} />
                            Ver conteudo bruto do MD
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <pre className="mt-1 max-h-[120px] overflow-auto rounded bg-muted/50 border border-border/50 p-2 text-[9px] font-mono text-muted-foreground whitespace-pre-wrap">
                              {el.rawContent.slice(0, 2000)}{el.rawContent.length > 2000 ? '\n\n[... truncado]' : ''}
                            </pre>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Project selector */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Projeto destino</label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => { setParsedElements([]); setStep('upload'); }}>
                <ChevronLeft className="w-3 h-3" /> Voltar
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {validCount} de {parsedElements.length} valido(s)
                  {totalWarnings > 0 && ` • ${totalWarnings} aviso(s)`}
                </span>
                <Button
                  size="sm"
                  className="text-xs gap-1"
                  disabled={validCount === 0 || !projectId || importing}
                  onClick={handleImport}
                >
                  {importing ? 'Importando...' : `Importar ${validCount} elemento(s)`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
