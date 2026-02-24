import { useWizardStore } from '@/stores/wizard-store';
import { GeneratedFile } from '@/types/aios';
import { useState, useMemo } from 'react';
import { File, Folder, ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function generateFileTree(project: any, agents: any[], squads: any[]): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const name = project.name || 'meu-aios';
  const slug = name.toLowerCase().replace(/\s+/g, '-');

  // aios.config.yaml
  files.push({
    path: 'aios.config.yaml',
    type: 'yaml',
    complianceStatus: 'passed',
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
      complianceStatus: 'passed',
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
      complianceStatus: 'passed',
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
      complianceStatus: 'passed',
      content: `# Squad: ${squad.name}\n\n${squad.description || ''}\n\n## Agentes\n${(squad.agentIds || []).map((id: string) => `- ${id}`).join('\n') || '(vazio)'}`,
    });
  });

  // Project files
  files.push({
    path: '.env.example',
    type: 'env',
    complianceStatus: 'passed',
    content: `ANTHROPIC_API_KEY=\nOPENAI_API_KEY=\nDATABASE_URL=\n`,
  });

  files.push({
    path: 'README.md',
    type: 'md',
    complianceStatus: 'passed',
    content: `# ${name}\n\n${project.description || 'Sistema AIOS'}\n\n## Setup\n\n1. Copie \`.env.example\` para \`.env\` e configure as variáveis\n2. Instale dependências: \`npm install\`\n3. Execute: \`npm start\`\n\n## Agentes\n\n${agents.map(a => `- **${a.name}** — ${a.role}`).join('\n') || '(nenhum)'}\n\n## Squads\n\n${squads.map(s => `- **${s.name}** — ${s.description || ''}`).join('\n') || '(nenhum)'}`,
  });

  return files;
}

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

function TreeItem({ node, selectedPath, onSelect }: { node: TreeNode; selectedPath: string; onSelect: (path: string) => void }) {
  const [open, setOpen] = useState(true);
  const isSelected = node.path === selectedPath;

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
              <TreeItem key={child.path} node={child} selectedPath={selectedPath} onSelect={onSelect} />
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
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function FilePreview() {
  const { project, agents, squads } = useWizardStore();
  const [selectedPath, setSelectedPath] = useState('');
  const [copied, setCopied] = useState(false);

  const files = useMemo(() => generateFileTree(project, agents, squads), [project, agents, squads]);
  const tree = useMemo(() => buildTree(files), [files]);
  const selectedFile = files.find(f => f.path === selectedPath);

  const copyContent = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      toast.success('Copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-full">
      {/* File tree */}
      <div className="w-56 border-r border-border/50 p-2 overflow-y-auto shrink-0">
        <p className="text-xs font-medium text-muted-foreground px-2 mb-2">Arquivos ({files.length})</p>
        {tree.map(node => (
          <TreeItem key={node.path} node={node} selectedPath={selectedPath} onSelect={setSelectedPath} />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {selectedFile ? (
          <>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
              <span className="text-xs font-mono text-muted-foreground">{selectedFile.path}</span>
              <Button variant="ghost" size="sm" onClick={copyContent} className="gap-1.5 text-xs">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-xs font-mono leading-relaxed text-secondary-foreground">
              {selectedFile.content}
            </pre>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Selecione um arquivo para visualizar
          </div>
        )}
      </div>
    </div>
  );
}

export { generateFileTree };
