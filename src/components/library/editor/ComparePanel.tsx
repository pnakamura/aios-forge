/**
 * @agent     ComparePanel
 * @persona   Painel de comparacao side-by-side com merge seletivo
 * @commands  render
 * @context   Exibe diferencas entre working copy e outro elemento, permitindo incorporar campos individualmente.
 */

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, ArrowRight, CheckCheck, Plus, PenLine, Minus } from 'lucide-react';
import { useLibraryEditorStore } from '@/stores/library-editor-store';
import type { AgentFormData } from '@/types/library';

interface ComparePanelProps {
  onClose: () => void;
}

interface ScalarDiff {
  kind: 'scalar';
  field: string;
  label: string;
  currentValue: string;
  otherValue: string;
}

interface ArrayItemDiff {
  name: string;
  status: 'added' | 'modified' | 'removed';
  currentValue?: unknown;
  otherValue?: unknown;
}

interface ArrayDiff {
  kind: 'array';
  field: string;
  label: string;
  items: ArrayItemDiff[];
}

type FieldDiff = ScalarDiff | ArrayDiff;

const SCALAR_FIELDS: { field: string; label: string }[] = [
  { field: 'name', label: 'Nome' },
  { field: 'role', label: 'Role' },
  { field: 'description', label: 'Descricao' },
  { field: 'systemPrompt', label: 'System Prompt' },
  { field: 'llmModel', label: 'Modelo LLM' },
  { field: 'visibility', label: 'Visibilidade' },
  { field: 'category', label: 'Categoria' },
  // Skill fields
  { field: 'prompt', label: 'Prompt' },
  // Workflow fields
  { field: 'pattern', label: 'Padrao' },
];

function truncate(s: string, max = 80) {
  return s && s.length > max ? s.slice(0, max) + '...' : s || '(vazio)';
}

export default function ComparePanel({ onClose }: ComparePanelProps) {
  const { workingCopy, compareEntity, compareEntityName, updateField } = useLibraryEditorStore();

  const diffs = useMemo<FieldDiff[]>(() => {
    if (!workingCopy || !compareEntity) return [];
    const current = workingCopy.data as unknown as Record<string, unknown>;
    const other = compareEntity as unknown as Record<string, unknown>;
    const result: FieldDiff[] = [];

    // Scalar diffs
    for (const { field, label } of SCALAR_FIELDS) {
      if (!(field in current) || !(field in other)) continue;
      const cv = String(current[field] ?? '');
      const ov = String(other[field] ?? '');
      if (cv !== ov) {
        result.push({ kind: 'scalar', field, label, currentValue: cv, otherValue: ov });
      }
    }

    // Array diffs for commands
    if ('commands' in current && 'commands' in other) {
      const cc = (current.commands as { name: string; description: string; returnType: string }[]) || [];
      const oc = (other.commands as { name: string; description: string; returnType: string }[]) || [];
      const items: ArrayItemDiff[] = [];

      // Added (in other but not in current)
      for (const o of oc) {
        const match = cc.find(c => c.name === o.name);
        if (!match) items.push({ name: o.name || '(sem nome)', status: 'added', otherValue: o });
        else if (match.description !== o.description || match.returnType !== o.returnType) {
          items.push({ name: o.name, status: 'modified', currentValue: match, otherValue: o });
        }
      }
      // Removed (in current but not in other)
      for (const c of cc) {
        if (!oc.find(o => o.name === c.name)) {
          items.push({ name: c.name || '(sem nome)', status: 'removed', currentValue: c });
        }
      }
      if (items.length > 0) result.push({ kind: 'array', field: 'commands', label: 'Comandos', items });
    }

    // Simple string array diffs (tools, skills, tags)
    for (const arrField of ['tools', 'skills', 'tags'] as const) {
      if (!(arrField in current) || !(arrField in other)) continue;
      const ca = (current[arrField] as string[]) || [];
      const oa = (other[arrField] as string[]) || [];
      const items: ArrayItemDiff[] = [];
      for (const o of oa) { if (!ca.includes(o)) items.push({ name: o, status: 'added', otherValue: o }); }
      for (const c of ca) { if (!oa.includes(c)) items.push({ name: c, status: 'removed', currentValue: c }); }
      if (items.length > 0) {
        const label = arrField === 'tools' ? 'Ferramentas' : arrField === 'skills' ? 'Skills' : 'Tags';
        result.push({ kind: 'array', field: arrField, label, items });
      }
    }

    return result;
  }, [workingCopy, compareEntity]);

  const mergeScalar = (field: string, value: string) => {
    updateField(field, value);
  };

  const mergeArrayItem = (field: string, item: ArrayItemDiff) => {
    if (!workingCopy) return;
    const current = workingCopy.data as unknown as Record<string, unknown>;

    if (field === 'commands') {
      const cmds = [...((current.commands as AgentFormData['commands']) || [])];
      if (item.status === 'added') {
        cmds.push(item.otherValue as AgentFormData['commands'][0]);
      } else if (item.status === 'modified') {
        const idx = cmds.findIndex(c => c.name === item.name);
        if (idx >= 0) cmds[idx] = item.otherValue as AgentFormData['commands'][0];
      }
      updateField('commands', cmds);
    } else {
      // string arrays
      const arr = [...((current[field] as string[]) || [])];
      if (item.status === 'added' && !arr.includes(item.name)) {
        arr.push(item.name);
      }
      updateField(field, arr);
    }
  };

  const mergeAll = () => {
    for (const diff of diffs) {
      if (diff.kind === 'scalar') {
        mergeScalar(diff.field, diff.otherValue);
      } else {
        for (const item of diff.items) {
          if (item.status === 'added' || item.status === 'modified') {
            mergeArrayItem(diff.field, item);
          }
        }
      }
    }
  };

  const addedCount = diffs.reduce((sum, d) => sum + (d.kind === 'array' ? d.items.filter(i => i.status === 'added').length : 0), 0);
  const modifiedCount = diffs.reduce((sum, d) => sum + (d.kind === 'array' ? d.items.filter(i => i.status === 'modified').length : 0) + (d.kind === 'scalar' ? 1 : 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate">Comparando com: {compareEntityName}</h3>
          <p className="text-[10px] text-muted-foreground">
            {addedCount > 0 && <span className="text-emerald-400">{addedCount} novos</span>}
            {addedCount > 0 && modifiedCount > 0 && ' · '}
            {modifiedCount > 0 && <span className="text-amber-400">{modifiedCount} modificados</span>}
            {addedCount === 0 && modifiedCount === 0 && 'Nenhuma diferenca encontrada'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {diffs.length > 0 && (
            <Button size="sm" className="h-7 text-xs gap-1" onClick={mergeAll}>
              <CheckCheck className="w-3 h-3" /> Incorporar todos
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Diffs */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {diffs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Os dois elementos sao identicos.</p>
            </div>
          )}

          {diffs.map((diff, i) => (
            <div key={i} className="rounded-md border border-border/50 overflow-hidden">
              {diff.kind === 'scalar' ? (
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-mono">{diff.label}</Badge>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => mergeScalar(diff.field, diff.otherValue)}>
                      <ArrowRight className="w-2.5 h-2.5" /> Incorporar
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-secondary/50">
                      <p className="text-[9px] text-muted-foreground mb-0.5">Atual</p>
                      <p className="text-xs break-words">{truncate(diff.currentValue, 120)}</p>
                    </div>
                    <div className="p-2 rounded bg-amber-500/5 border border-amber-500/20">
                      <p className="text-[9px] text-amber-400 mb-0.5">Outro</p>
                      <p className="text-xs break-words">{truncate(diff.otherValue, 120)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">{diff.label}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {diff.items.filter(i => i.status === 'added').length > 0 && <span className="text-emerald-400">{diff.items.filter(i => i.status === 'added').length} novos</span>}
                        {diff.items.filter(i => i.status === 'modified').length > 0 && <span className="text-amber-400 ml-1">{diff.items.filter(i => i.status === 'modified').length} mod.</span>}
                        {diff.items.filter(i => i.status === 'removed').length > 0 && <span className="text-muted-foreground ml-1">{diff.items.filter(i => i.status === 'removed').length} ausentes</span>}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {diff.items.map((item, j) => (
                      <div key={j} className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded text-xs ${
                        item.status === 'added' ? 'bg-emerald-500/5 border border-emerald-500/20' :
                        item.status === 'modified' ? 'bg-amber-500/5 border border-amber-500/20' :
                        'bg-secondary/30 border border-border/30'
                      }`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          {item.status === 'added' && <Plus className="w-3 h-3 text-emerald-400 shrink-0" />}
                          {item.status === 'modified' && <PenLine className="w-3 h-3 text-amber-400 shrink-0" />}
                          {item.status === 'removed' && <Minus className="w-3 h-3 text-muted-foreground shrink-0" />}
                          <span className="font-mono truncate">{item.name}</span>
                        </div>
                        {(item.status === 'added' || item.status === 'modified') && (
                          <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5 shrink-0" onClick={() => mergeArrayItem(diff.field, item)}>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
