/**
 * @agent     LibraryCard
 * @persona   Card de exibicao de um item da Library com cores por tipo
 * @commands  render
 * @context   Usado no LibraryGrid e LibraryList para exibir cada artefato.
 */

import { Bot, Zap, Users, GitBranch, Star, Eye, Import, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import type { LibraryItem, LibraryEntityType } from '@/types/library';

const TYPE_CONFIG: Record<LibraryEntityType, { icon: typeof Bot; label: string; colorVar: string }> = {
  agent: { icon: Bot, label: 'Agent', colorVar: 'var(--library-agent)' },
  skill: { icon: Zap, label: 'Skill', colorVar: 'var(--library-skill)' },
  squad: { icon: Users, label: 'Squad', colorVar: 'var(--library-squad)' },
  workflow: { icon: GitBranch, label: 'Workflow', colorVar: 'var(--library-workflow)' },
};

interface LibraryCardProps {
  item: LibraryItem;
  index?: number;
  onSelect: (item: LibraryItem) => void;
  onToggleFavorite: (item: LibraryItem) => void;
}

export default function LibraryCard({ item, index = 0, onSelect, onToggleFavorite }: LibraryCardProps) {
  const navigate = useNavigate();
  const cfg = TYPE_CONFIG[item.type];
  const Icon = cfg.icon;
  const borderColor = `hsl(${cfg.colorVar})`;
  const isDraftOrFork = item.status === 'draft' || item.status === 'fork';

  const metaChips: string[] = [];
  if (item.meta.type === 'agent') {
    metaChips.push(item.meta.llmModel.split('/').pop() ?? '');
    metaChips.push(`${item.meta.commandCount} cmds`);
  } else if (item.meta.type === 'skill') {
    metaChips.push(item.meta.category);
    metaChips.push(`${item.meta.inputCount} in / ${item.meta.outputCount} out`);
  } else if (item.meta.type === 'squad') {
    metaChips.push(`${item.meta.agentCount} agents`);
    metaChips.push(`${item.meta.taskCount} tasks`);
  } else if (item.meta.type === 'workflow') {
    metaChips.push(item.meta.pattern);
    metaChips.push(`${item.meta.stepCount} steps`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onSelect(item)}
      className="glass rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-all group relative"
      style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}
    >
      {/* Draft/Fork badge */}
      {isDraftOrFork && (
        <Badge
          className="absolute top-2 left-2 text-[9px] z-10"
          variant={item.status === 'draft' ? 'secondary' : 'outline'}
          style={item.status === 'fork' ? { borderColor: 'hsl(var(--library-workflow))', color: 'hsl(var(--library-workflow))' } : { backgroundColor: 'hsl(var(--glow-warning) / 0.2)', color: 'hsl(var(--glow-warning))' }}
        >
          {item.status === 'draft' ? 'Rascunho' : 'Fork'}
        </Badge>
      )}
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `hsl(${cfg.colorVar} / 0.15)` }}
          >
            <Icon className="w-4 h-4" style={{ color: borderColor }} />
          </div>
          <Badge variant="outline" className="text-[10px]" style={{ borderColor: `hsl(${cfg.colorVar} / 0.4)`, color: borderColor }}>
            {cfg.label}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(item); }}
        >
          <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
        </Button>
      </div>

      {/* Title & description */}
      <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-1">{item.name}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{item.description || 'Sem descricao'}</p>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {metaChips.map((chip) => (
          <span key={chip} className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
            {chip}
          </span>
        ))}
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          {item.tags.length > 3 && (
            <span className="text-[9px] text-muted-foreground">+{item.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="truncate max-w-[120px]">{item.projectName}</span>
        <span>{item.usageCount} usos</span>
      </div>

      {/* Hover actions */}
      <div className="absolute inset-0 rounded-xl bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {isDraftOrFork ? (
          <Button size="sm" className="gap-1.5 text-xs" onClick={(e) => { e.stopPropagation(); navigate(`/library/editor/${item.type}/${item.id}`); }}>
            <Pencil className="w-3 h-3" /> Continuar editando
          </Button>
        ) : (
          <>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={(e) => { e.stopPropagation(); onSelect(item); }}>
              <Eye className="w-3 h-3" /> Detalhes
            </Button>
            <Button size="sm" className="gap-1.5 text-xs" onClick={(e) => { e.stopPropagation(); /* import handled at page level */ }}>
              <Import className="w-3 h-3" /> Importar
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
