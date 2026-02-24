import { useWizardStore } from '@/stores/wizard-store';
import { GeneratedFile } from '@/types/aios';
import { useState, useMemo } from 'react';
import { File, Folder, ChevronRight, ChevronDown, Copy, Check, CheckCircle, AlertTriangle, XCircle, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateAiosPackage } from '@/lib/generate-aios-package';

// ── Tree types & builder ─────────────────────────────────

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

// ── Status icon helper ───────────────────────────────────

function ComplianceIcon({ status }: { status: string }) {
  switch (status) {
    case 'passed': return <CheckCircle className="w-3.5 h-3.5 text-glow-success shrink-0" />;
    case 'warning': return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
    case 'failed': return <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />;
    default: return null;
  }
}

// ── File type to extension color mapping ─────────────────

function getFileColor(path: string): string {
  if (path.endsWith('.yaml') || path.endsWith('.yml')) return 'text-yellow-400';
  if (path.endsWith('.md')) return 'text-blue-400';
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'text-cyan-400';
  if (path.endsWith('.json')) return 'text-green-400';
  if (path.endsWith('.sh')) return 'text-orange-400';
  if (path.endsWith('.env') || path.includes('.env')) return 'text-red-400';
  if (path === 'Dockerfile' || path === '.dockerignore') return 'text-sky-400';
  return 'text-muted-foreground';
}

// ── Tree item ────────────────────────────────────────────

function TreeItem({ node, selectedPath, onSelect, complianceResults, depth = 0 }: {
  node: TreeNode;
  selectedPath: string;
  onSelect: (path: string) => void;
  complianceResults: Record<string, { status: string; notes: string }>;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth < 2);
  const isSelected = node.path === selectedPath;
  const result = node.file ? complianceResults[node.path] : undefined;

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 w-full px-2 py-1 hover:bg-secondary/50 rounded text-sm group"
        >
          {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          <Folder className="w-3.5 h-3.5 text-primary/70" />
          <span className="truncate font-medium text-xs">{node.name}</span>
          <span className="text-[10px] text-muted-foreground/60 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            {node.children.length}
          </span>
        </button>
        {open && (
          <div className="pl-3 ml-1.5 border-l border-border/30">
            {node.children.map(child => (
              <TreeItem key={child.path} node={child} selectedPath={selectedPath} onSelect={onSelect} complianceResults={complianceResults} depth={depth + 1} />
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
        'flex items-center gap-1.5 w-full px-2 py-1 rounded text-sm transition-all',
        isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50'
      )}
    >
      <File className={cn('w-3.5 h-3.5', getFileColor(node.path))} />
      <span className="truncate flex-1 text-left text-xs">{node.name}</span>
      {result && <ComplianceIcon status={result.status} />}
    </button>
  );
}

// ── Syntax-aware content display ─────────────────────────

function SyntaxContent({ content, path }: { content: string; path: string }) {
  const lines = content.split('\n');

  return (
    <div className="flex-1 overflow-auto text-xs font-mono leading-relaxed">
      <table className="w-full">
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="hover:bg-secondary/20">
              <td className="px-3 py-0 text-right text-muted-foreground/40 select-none w-10 align-top">{i + 1}</td>
              <td className="px-3 py-0 whitespace-pre text-secondary-foreground">
                <SyntaxLine line={line} path={path} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SyntaxLine({ line, path }: { line: string; path: string }) {
  const isYaml = path.endsWith('.yaml') || path.endsWith('.yml');
  const isMd = path.endsWith('.md');
  const isTs = path.endsWith('.ts');

  if (isYaml) {
    if (line.trimStart().startsWith('#')) return <span className="text-muted-foreground italic">{line}</span>;
    const keyMatch = line.match(/^(\s*)([\w-]+)(:)(.*)/);
    if (keyMatch) {
      return (
        <span>
          {keyMatch[1]}<span className="text-cyan-400">{keyMatch[2]}</span><span className="text-muted-foreground">{keyMatch[3]}</span><span className="text-amber-300">{keyMatch[4]}</span>
        </span>
      );
    }
  }

  if (isMd) {
    if (line.startsWith('#')) return <span className="text-primary font-bold">{line}</span>;
    if (line.startsWith('- ') || line.startsWith('* ')) return <span><span className="text-primary">-</span>{line.slice(1)}</span>;
    if (line.startsWith('```')) return <span className="text-muted-foreground">{line}</span>;
    if (line.startsWith('---')) return <span className="text-muted-foreground">{line}</span>;
    if (line.startsWith('|')) return <span className="text-cyan-400/80">{line}</span>;
  }

  if (isTs) {
    if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*') || line.trimStart().startsWith('/**')) {
      return <span className="text-muted-foreground italic">{line}</span>;
    }
    const kwRegex = /\b(import|export|from|const|let|var|function|async|await|return|if|else|switch|case|default|type|interface)\b/;
    if (kwRegex.test(line)) {
      const parts = line.split(kwRegex);
      return <span>{parts.map((part, i) => kwRegex.test(part) ? <span key={i} className="text-purple-400">{part}</span> : <span key={i}>{part}</span>)}</span>;
    }
  }

  return <span>{line}</span>;
}

// ── Main component ───────────────────────────────────────

export function FilePreview() {
  const { project, agents, squads, complianceResults, complianceReviewed, setComplianceResults } = useWizardStore();
  const [selectedPath, setSelectedPath] = useState('');
  const [copied, setCopied] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const files = useMemo(
    () => generateAiosPackage({ project, agents, squads, complianceResults }),
    [project, agents, squads, complianceResults]
  );
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
      const reviewableFiles = files.filter(f =>
        f.path === 'aios.config.yaml' ||
        f.path.startsWith('agents/') ||
        f.path.startsWith('squads/') ||
        f.path === 'README.md' ||
        f.path === '.env.example'
      );
      const payload = reviewableFiles.map(f => ({ path: f.path, content: f.content, type: f.type }));
      const { data, error } = await supabase.functions.invoke('aios-compliance-review', {
        body: { files: payload },
      });
      if (error) throw error;
      if (data?.results) {
        const mapped: Record<string, { status: string; notes: string }> = {};
        data.results.forEach((r: any) => { mapped[r.path] = { status: r.status, notes: r.notes }; });
        setComplianceResults(mapped);
        toast.success('Revisao de conformidade concluida!');
      } else {
        throw new Error('Resposta invalida');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro na revisao de conformidade');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Compliance summary bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 shrink-0 bg-card/30">
        <Button size="sm" variant="outline" onClick={runComplianceReview} disabled={reviewing} className="gap-1.5 text-xs">
          {reviewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          {reviewing ? 'Revisando...' : 'Revisar Conformidade'}
        </Button>
        {complianceReviewed && (
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-glow-success border-glow-success/30 text-[10px]">{passed} aprovados</Badge>
            {warnings > 0 && <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 text-[10px]">{warnings} avisos</Badge>}
            {failed > 0 && <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px]">{failed} falhas</Badge>}
          </div>
        )}
        <Badge variant="secondary" className="text-[10px] ml-auto">{files.length} arquivos</Badge>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File tree */}
        <div className="w-60 border-r border-border/50 p-2 overflow-y-auto shrink-0 bg-card/20">
          {tree.map(node => (
            <TreeItem key={node.path} node={node} selectedPath={selectedPath} onSelect={setSelectedPath} complianceResults={complianceResults} />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedFile ? (
            <>
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card/30">
                <div className="flex items-center gap-2">
                  <File className={cn('w-3.5 h-3.5', getFileColor(selectedFile.path))} />
                  <span className="text-xs font-mono text-muted-foreground">{selectedFile.path}</span>
                  {selectedFile.complianceStatus !== 'pending' && <ComplianceIcon status={selectedFile.complianceStatus} />}
                </div>
                <Button variant="ghost" size="sm" onClick={copyContent} className="gap-1.5 text-xs h-7">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
              <SyntaxContent content={selectedFile.content} path={selectedFile.path} />
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
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2 p-8">
              <File className="w-10 h-10 text-muted-foreground/30" />
              <p>Selecione um arquivo para visualizar</p>
              <p className="text-xs text-muted-foreground/50">O pacote contem {files.length} arquivos prontos para download</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { generateAiosPackage };
