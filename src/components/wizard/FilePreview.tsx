import { useWizardStore } from '@/stores/wizard-store';
import { GeneratedFile } from '@/types/aios';
import { useState, useMemo } from 'react';
import { File, Folder, ChevronRight, ChevronDown, Copy, Check, CheckCircle, AlertTriangle, XCircle, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

function generateFileTree(project: any, agents: any[], squads: any[], complianceResults?: Record<string, { status: string; notes: string }>): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const name = project.name || 'meu-aios';
  const slug = name.toLowerCase().replace(/\s+/g, '-');

  // aios.config.yaml
  files.push({
    path: 'aios.config.yaml',
    type: 'yaml',
    complianceStatus: 'pending',
    content: `# AIOS Configuration
name: "${name}"
version: "1.0.0"
domain: "${project.domain || 'software'}"
orchestration: "${project.orchestrationPattern || 'TASK_FIRST'}"

agents:
${agents.map(a => `  - slug: "${a.slug}"
    name: "${a.name}"
    model: "${a.llmModel}"`).join('\n')}

squads:
${squads.map(s => `  - slug: "${s.slug}"
    name: "${s.name}"
    agents: [${s.agentIds?.map((id: string) => `"${id}"`).join(', ') || ''}]`).join('\n')}
`,
  });

  // Agent definition files
  agents.forEach(agent => {
    files.push({
      path: `agents/${agent.slug}.md`,
      type: 'md',
      complianceStatus: 'pending',
      content: `---
name: "${agent.name}"
slug: "${agent.slug}"
role: "${agent.role}"
model: "${agent.llmModel}"
visibility: "${agent.visibility}"
version: "1.0.0"
---

# ${agent.name}

## Role
${agent.role}

## System Prompt
${agent.systemPrompt}

## Commands
${(agent.commands || []).map((c: string) => `- \`${c}\``).join('\n') || '- (nenhum)'}

## Tools
${(agent.tools || []).map((t: string) => `- ${t}`).join('\n') || '- (nenhum)'}

## Skills
${(agent.skills || []).map((s: string) => `- ${s}`).join('\n') || '- (nenhum)'}
`,
    });
  });

  // Squad manifests
  squads.forEach(squad => {
    files.push({
      path: `squads/${squad.slug}/squad.yaml`,
      type: 'yaml',
      complianceStatus: 'pending',
      content: `name: "${squad.name}"
slug: "${squad.slug}"
description: "${squad.description || ''}"
version: "1.0.0"

agents:
${(squad.agentIds || []).map((id: string) => `  - "${id}"`).join('\n') || '  []'}

tasks:
${(squad.tasks || []).map((t: any) => `  - name: "${t.name}"
    agent: "${t.agentSlug}"
    description: "${t.description || ''}"`).join('\n') || '  []'}

workflows:
${(squad.workflows || []).map((w: any) => `  - name: "${w.name}"
    steps:
${(w.steps || []).map((s: any) => `      - name: "${s.name}"
        agent: "${s.agentSlug}"`).join('\n') || '      []'}`).join('\n') || '  []'}
`,
    });

    files.push({
      path: `squads/${squad.slug}/README.md`,
      type: 'md',
      complianceStatus: 'pending',
      content: `# Squad: ${squad.name}\n\n${squad.description || ''}\n\n## Agentes\n${(squad.agentIds || []).map((id: string) => `- ${id}`).join('\n') || '(vazio)'}`,
    });
  });

  // Project files
  files.push({
    path: '.env.example',
    type: 'env',
    complianceStatus: 'pending',
    content: `ANTHROPIC_API_KEY=\nOPENAI_API_KEY=\nDATABASE_URL=\n`,
  });

  files.push({
    path: 'README.md',
    type: 'md',
    complianceStatus: 'pending',
    content: `# ${name}\n\n${project.description || 'Sistema AIOS'}\n\n## Setup\n\n1. Copie \`.env.example\` para \`.env\` e configure as variáveis\n2. Instale dependências: \`npm install\`\n3. Execute: \`npm start\`\n\n## Agentes\n\n${agents.map(a => `- **${a.name}** — ${a.role}`).join('\n') || '(nenhum)'}\n\n## Squads\n\n${squads.map(s => `- **${s.name}** — ${s.description || ''}`).join('\n') || '(nenhum)'}`,
  });

  // Apply compliance results
  if (complianceResults) {
    files.forEach(f => {
      const result = complianceResults[f.path];
      if (result) {
        f.complianceStatus = result.status as any;
        f.complianceNotes = result.notes;
      }
    });
  }

  return files;
}

// --- Tree types & builder ---

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
  file?: GeneratedFile;
}

function buildTree(files: GeneratedFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  files.forEach(file => {
    const parts = file.path.split('/');
    let current = root;
    parts.forEach((part, i) => {
      const isLast = i === parts.length - 1;
      let existing = current.find(n => n.name === part);
      if (!existing) {
        existing = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          isDir: !isLast,
          children: [],
          file: isLast ? file : undefined,
        };
        current.push(existing);
      }
      current = existing.children;
    });
  });
  return root;
}

// --- Status icon helper ---

function ComplianceIcon({ status }: { status: string }) {
  switch (status) {
    case 'passed': return <CheckCircle className="w-3.5 h-3.5 text-glow-success shrink-0" />;
    case 'warning': return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
    case 'failed': return <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />;
    default: return null;
  }
}

// --- Tree item ---

function TreeItem({ node, selectedPath, onSelect, complianceResults }: {
  node: TreeNode;
  selectedPath: string;
  onSelect: (path: string) => void;
  complianceResults: Record<string, { status: string; notes: string }>;
}) {
  const [open, setOpen] = useState(true);
  const isSelected = node.path === selectedPath;
  const result = node.file ? complianceResults[node.path] : undefined;

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 w-full px-2 py-1 hover:bg-secondary/50 rounded text-sm"
        >
          {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          <Folder className="w-3.5 h-3.5 text-primary/70" />
          <span className="truncate">{node.name}</span>
        </button>
        {open && (
          <div className="pl-4">
            {node.children.map(child => (
              <TreeItem key={child.path} node={child} selectedPath={selectedPath} onSelect={onSelect} complianceResults={complianceResults} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={cn(
        'flex items-center gap-1.5 w-full px-2 py-1 rounded text-sm',
        isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50'
      )}
    >
      <File className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="truncate flex-1 text-left">{node.name}</span>
      {result && <ComplianceIcon status={result.status} />}
    </button>
  );
}

// --- Main component ---

export function FilePreview() {
  const { project, agents, squads, complianceResults, complianceReviewed, setComplianceResults } = useWizardStore();
  const [selectedPath, setSelectedPath] = useState('');
  const [copied, setCopied] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const files = useMemo(() => generateFileTree(project, agents, squads, complianceResults), [project, agents, squads, complianceResults]);
  const tree = useMemo(() => buildTree(files), [files]);
  const selectedFile = files.find(f => f.path === selectedPath);

  const passed = Object.values(complianceResults).filter(r => r.status === 'passed').length;
  const warnings = Object.values(complianceResults).filter(r => r.status === 'warning').length;
  const failed = Object.values(complianceResults).filter(r => r.status === 'failed').length;

  const copyContent = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      toast.success('Copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const runComplianceReview = async () => {
    setReviewing(true);
    try {
      const payload = files.map(f => ({ path: f.path, content: f.content, type: f.type }));
      const { data, error } = await supabase.functions.invoke('aios-compliance-review', {
        body: { files: payload },
      });
      if (error) throw error;
      if (data?.results) {
        const mapped: Record<string, { status: string; notes: string }> = {};
        data.results.forEach((r: any) => { mapped[r.path] = { status: r.status, notes: r.notes }; });
        setComplianceResults(mapped);
        toast.success('Revisão de conformidade concluída!');
      } else {
        throw new Error('Resposta inválida');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro na revisão de conformidade');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Compliance summary bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 shrink-0">
        <Button size="sm" variant="outline" onClick={runComplianceReview} disabled={reviewing} className="gap-1.5 text-xs">
          {reviewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          {reviewing ? 'Revisando...' : 'Revisar Conformidade'}
        </Button>
        {complianceReviewed && (
          <div className="flex items-center gap-2 text-xs ml-auto">
            <span className="text-glow-success">{passed} ✓</span>
            {warnings > 0 && <span className="text-yellow-400">{warnings} ⚠</span>}
            {failed > 0 && <span className="text-destructive">{failed} ✗</span>}
            <span className="text-muted-foreground">/ {files.length}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File tree */}
        <div className="w-56 border-r border-border/50 p-2 overflow-y-auto shrink-0">
          <p className="text-xs font-medium text-muted-foreground px-2 mb-2">Arquivos ({files.length})</p>
          {tree.map(node => (
            <TreeItem key={node.path} node={node} selectedPath={selectedPath} onSelect={setSelectedPath} complianceResults={complianceResults} />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedFile ? (
            <>
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{selectedFile.path}</span>
                  {selectedFile.complianceStatus !== 'pending' && <ComplianceIcon status={selectedFile.complianceStatus} />}
                </div>
                <Button variant="ghost" size="sm" onClick={copyContent} className="gap-1.5 text-xs">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
              <pre className="flex-1 overflow-auto p-4 text-xs font-mono leading-relaxed text-secondary-foreground">
                {selectedFile.content}
              </pre>
              {selectedFile.complianceNotes && (
                <div className={cn(
                  'px-4 py-2 border-t text-xs',
                  selectedFile.complianceStatus === 'passed' ? 'border-glow-success/30 bg-glow-success/5 text-glow-success' :
                  selectedFile.complianceStatus === 'warning' ? 'border-yellow-400/30 bg-yellow-400/5 text-yellow-300' :
                  'border-destructive/30 bg-destructive/5 text-destructive'
                )}>
                  <strong>Notas:</strong> {selectedFile.complianceNotes}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Selecione um arquivo para visualizar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { generateFileTree };
