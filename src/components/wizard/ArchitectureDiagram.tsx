import { useWizardStore } from '@/stores/wizard-store';
import { useWorkflowStore } from '@/stores/workflow-store';
import { AiosAgent, AiosSquad, ProjectWorkflow } from '@/types/aios';
import { AgentEditor } from './AgentEditor';
import { useMemo, useEffect, useCallback, useState, useRef } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Connection,
  reconnectEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
  EdgeProps,
  NodeToolbar,
  Panel,
  ConnectionMode,
  ConnectionLineType,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Network, Bot, Users, Trash2, Plus, Info, ChevronDown, ChevronRight,
  Zap, Crown, Pencil, Cpu, Wrench, Eye, Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ── Relationship types (dark + light color variants) ──

const RELATIONS: Record<string, { label: string; dark: string; light: string; dash: string; animated: boolean }> = {
  orquestra:    { label: 'Orquestra',     dark: 'hsl(190 95% 55%)',  light: 'hsl(190 85% 32%)', dash: '',    animated: true },
  delega:       { label: 'Delega',        dark: 'hsl(265 80% 65%)',  light: 'hsl(265 65% 38%)', dash: '6 3', animated: false },
  supervisiona: { label: 'Supervisiona',  dark: 'hsl(40 95% 60%)',   light: 'hsl(35 80% 35%)',  dash: '',    animated: false },
  reporta:      { label: 'Reporta',       dark: 'hsl(200 80% 65%)',  light: 'hsl(200 70% 32%)', dash: '4 4', animated: false },
  coordena:     { label: 'Coordena',      dark: 'hsl(220 80% 70%)',  light: 'hsl(220 70% 35%)', dash: '',    animated: false },
  membro:       { label: 'Membro',        dark: 'hsl(150 80% 50%)',  light: 'hsl(150 65% 28%)', dash: '',    animated: false },
  workflow:     { label: 'Workflow',      dark: 'hsl(25 95% 60%)',   light: 'hsl(25 80% 38%)',  dash: '8 4', animated: true },
};

const RELATION_OPTIONS = [
  { type: 'orquestra',    desc: 'Comando hierarquico' },
  { type: 'delega',       desc: 'Delega tarefas' },
  { type: 'supervisiona', desc: 'Monitora e supervisiona' },
  { type: 'reporta',      desc: 'Reporta status/resultados' },
  { type: 'coordena',     desc: 'Colaboracao entre pares' },
  { type: 'membro',       desc: 'Pertence ao squad' },
];

const MODEL_OPTIONS = [
  'claude-sonnet-4-20250514',
  'claude-haiku-4-20250414',
  'gpt-4o',
  'gpt-4o-mini',
  'gemini-2.0-flash',
  'gemini-2.5-pro-preview-05-06',
];

const VISIBILITY_OPTIONS: { value: 'full' | 'quick' | 'key'; label: string }[] = [
  { value: 'full', label: 'Completa' },
  { value: 'quick', label: 'Rapida' },
  { value: 'key', label: 'Chave' },
];

// ── Event bus for agent edit (nodes dispatch, main component listens) ──

function dispatchEditAgent(slug: string) {
  window.dispatchEvent(new CustomEvent('aios-edit-agent', { detail: slug }));
}

// ── Tier layout constants ──

const TIER_Y = { orchestrator: 40, agents: 230, squads: 480 };
const NODE_WIDTH = 200;
const NODE_GAP = 28;

// ── Shared handle component with permanent visibility ──

const H_SIZE = '!w-3 !h-3 !min-w-0 !min-h-0';

function FourHandles({ color }: { color: string }) {
  const base: React.CSSProperties = {
    background: color,
    borderColor: color,
    opacity: 0.35,
    transition: 'opacity 0.2s, transform 0.2s',
  };
  return (
    <>
      <Handle type="source" position={Position.Top}    id="top"    className={`${H_SIZE} hover:!opacity-100 hover:!scale-125`} style={base} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={`${H_SIZE} hover:!opacity-100 hover:!scale-125`} style={base} />
      <Handle type="source" position={Position.Left}   id="left"   className={`${H_SIZE} hover:!opacity-100 hover:!scale-125`} style={base} />
      <Handle type="source" position={Position.Right}  id="right"  className={`${H_SIZE} hover:!opacity-100 hover:!scale-125`} style={base} />
    </>
  );
}

// ── Theme-aware palettes ──

function useNodeColors() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  return useMemo(() => ({
    isLight,
    orch: isLight
      ? {
          bg: 'linear-gradient(135deg, hsl(190 85% 95%), hsl(200 80% 92%))',
          bgSolid: 'hsl(190 85% 94%)',
          border: 'hsl(190 75% 35%)',
          text: 'hsl(190 80% 15%)',
          sub: 'hsl(190 45% 30%)',
          shadow: '0 4px 20px -4px hsl(190 80% 38% / 0.25)',
          handle: 'hsl(190 75% 35%)',
          glow: 'hsl(190 80% 50% / 0.12)',
        }
      : {
          bg: 'linear-gradient(135deg, hsl(190 95% 50% / 0.18), hsl(200 90% 50% / 0.12))',
          bgSolid: 'hsl(190 50% 12%)',
          border: 'hsl(190 90% 48%)',
          text: 'hsl(190 85% 85%)',
          sub: 'hsl(190 55% 65%)',
          shadow: '0 0 30px -6px hsl(190 95% 50% / 0.35)',
          handle: 'hsl(190 90% 48%)',
          glow: 'hsl(190 95% 50% / 0.08)',
        },
    agent: isLight
      ? {
          bg: 'hsl(265 55% 97%)',
          border: 'hsl(265 55% 52%)',
          borderSel: 'hsl(265 60% 42%)',
          text: 'hsl(265 60% 15%)',
          sub: 'hsl(265 25% 38%)',
          dim: 'hsl(265 18% 48%)',
          cat: 'hsl(265 30% 50%)',
          catBg: 'hsl(265 50% 52% / 0.1)',
          infoBg: 'hsl(265 40% 52% / 0.06)',
          infoBorder: 'hsl(265 40% 52% / 0.12)',
          handle: 'hsl(265 55% 52%)',
          shadow: '0 2px 10px -3px hsl(265 60% 48% / 0.15)',
        }
      : {
          bg: 'hsl(265 80% 60% / 0.12)',
          border: 'hsl(265 75% 58%)',
          borderSel: 'hsl(265 80% 65%)',
          text: 'hsl(265 75% 90%)',
          sub: 'hsl(265 45% 72%)',
          dim: 'hsl(265 35% 58%)',
          cat: 'hsl(265 45% 62%)',
          catBg: 'hsl(265 80% 60% / 0.18)',
          infoBg: 'hsl(265 80% 60% / 0.08)',
          infoBorder: 'hsl(265 80% 60% / 0.15)',
          handle: 'hsl(265 75% 58%)',
          shadow: '0 0 18px -4px hsl(265 80% 60% / 0.25)',
        },
    squad: isLight
      ? {
          bg: 'hsl(150 50% 96%)',
          border: 'hsl(150 50% 38%)',
          borderSel: 'hsl(150 55% 30%)',
          text: 'hsl(150 55% 14%)',
          sub: 'hsl(150 28% 32%)',
          divider: 'hsl(150 50% 38% / 0.25)',
          handle: 'hsl(150 50% 38%)',
          shadow: '0 2px 10px -3px hsl(150 55% 35% / 0.15)',
        }
      : {
          bg: 'hsl(150 80% 45% / 0.12)',
          border: 'hsl(150 70% 42%)',
          borderSel: 'hsl(150 75% 50%)',
          text: 'hsl(150 70% 85%)',
          sub: 'hsl(150 45% 65%)',
          divider: 'hsl(150 70% 42% / 0.3)',
          handle: 'hsl(150 70% 42%)',
          shadow: '0 0 18px -4px hsl(150 80% 45% / 0.25)',
        },
    chip: isLight
      ? { bg: 'hsl(265 50% 52% / 0.1)', text: 'hsl(265 55% 28%)', border: 'hsl(265 50% 52% / 0.2)' }
      : { bg: 'hsl(265 80% 60% / 0.2)', text: 'hsl(265 75% 88%)', border: 'hsl(265 80% 60% / 0.3)' },
    empty: isLight
      ? { text: 'hsl(220 12% 50%)' }
      : { text: 'hsl(220 12% 55%)' },
  }), [isLight]);
}

// ── Custom Node: Orchestrator ──

function OrchestratorNode({ data }: NodeProps) {
  const p = useNodeColors();
  return (
    <div className="px-6 py-4 rounded-2xl border-2 text-center min-w-[200px] relative"
      style={{
        background: p.orch.bg,
        borderColor: p.orch.border,
        color: p.orch.text,
        boxShadow: p.orch.shadow,
      }}
    >
      <FourHandles color={p.orch.handle} />
      {/* Subtle glow ring */}
      <div className="absolute -inset-1 rounded-[18px] pointer-events-none"
        style={{ background: p.orch.glow, filter: 'blur(8px)' }} />
      <div className="relative">
        <div className="flex items-center gap-2 justify-center mb-1">
          <Crown className="w-4 h-4" style={{ color: p.orch.border }} />
          <span className="text-sm font-bold tracking-tight">{data.label as string}</span>
        </div>
        <div className="text-[11px] font-medium" style={{ color: p.orch.sub }}>
          {data.sublabel as string}
        </div>
      </div>
    </div>
  );
}

// ── Custom Node: Agent (expanded with info + edit support) ──

function AgentNode({ data, id, selected }: NodeProps) {
  const { removeAgent } = useWizardStore();
  const p = useNodeColors();
  const agentSlug = (id as string).replace('agent-', '');
  const model = (data.model as string) || '';
  const toolsCount = (data.toolsCount as number) || 0;
  const commandsCount = (data.commandsCount as number) || 0;
  const visibility = (data.visibility as string) || 'full';
  const modelShort = model.replace(/(claude-|gpt-|gemini-)/, '').split('-').slice(0, 2).join('-');

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="flex gap-1 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-1 shadow-lg">
          <Button variant="ghost" size="sm" className="h-6 px-1.5 gap-1 text-foreground hover:bg-secondary"
            onClick={() => dispatchEditAgent(agentSlug)} title="Editar agente">
            <Pencil className="w-3 h-3" />
            <span className="text-[10px]">Editar</span>
          </Button>
          <div className="w-px h-5 bg-border self-center" />
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => removeAgent(agentSlug)} title="Remover agente">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </NodeToolbar>
      <div
        className={cn(
          'rounded-xl border transition-all cursor-pointer min-w-[190px] max-w-[220px]',
          selected ? 'border-2' : ''
        )}
        style={{
          background: p.agent.bg,
          borderColor: selected ? p.agent.borderSel : p.agent.border,
          color: p.agent.text,
          boxShadow: selected ? `0 0 20px -4px ${p.agent.borderSel}` : p.agent.shadow,
        }}
        onDoubleClick={() => dispatchEditAgent(agentSlug)}
      >
        <FourHandles color={p.agent.handle} />

        {/* Header */}
        <div className="px-3.5 pt-3 pb-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Bot className="w-3.5 h-3.5 shrink-0" style={{ color: p.agent.border }} />
            <span className="text-xs font-bold truncate">{data.label as string}</span>
          </div>
          <div className="text-[10px] leading-snug line-clamp-2" style={{ color: p.agent.sub }}>
            {data.sublabel as string}
          </div>
        </div>

        {/* Info section */}
        <div className="mx-2 mb-2 rounded-lg px-2.5 py-1.5 space-y-1"
          style={{ background: p.agent.infoBg, border: `1px solid ${p.agent.infoBorder}` }}>
          {/* Model */}
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 shrink-0" style={{ color: p.agent.dim }} />
            <span className="text-[9px] font-mono font-medium truncate" style={{ color: p.agent.sub }}>{modelShort || '—'}</span>
          </div>
          {/* Tools & Commands row */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1" title={`${toolsCount} tools`}>
              <Wrench className="w-2.5 h-2.5" style={{ color: p.agent.dim }} />
              <span className="text-[9px] font-mono" style={{ color: p.agent.dim }}>{toolsCount}</span>
            </div>
            <div className="flex items-center gap-1" title={`${commandsCount} commands`}>
              <Terminal className="w-2.5 h-2.5" style={{ color: p.agent.dim }} />
              <span className="text-[9px] font-mono" style={{ color: p.agent.dim }}>{commandsCount}</span>
            </div>
            <div className="flex items-center gap-1 ml-auto" title={`Visibilidade: ${visibility}`}>
              <Eye className="w-2.5 h-2.5" style={{ color: p.agent.dim }} />
              <span className="text-[9px]" style={{ color: p.agent.dim }}>{visibility}</span>
            </div>
          </div>
        </div>

        {/* Category tag */}
        {data.category && (
          <div className="px-3.5 pb-2.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold"
              style={{ background: p.agent.catBg, color: p.agent.cat }}>
              {data.category as string}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

// ── Custom Node: Squad (shows member list) ──

function SquadNode({ data, id, selected }: NodeProps) {
  const { removeSquad } = useWizardStore();
  const p = useNodeColors();
  const squadSlug = (id as string).replace('squad-', '');
  const members = (data.members as string[]) || [];

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Bottom}>
        <div className="flex gap-1 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-1 shadow-lg">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => removeSquad(squadSlug)} title="Remover squad">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </NodeToolbar>
      <div className={cn(
        'px-4 py-3 rounded-xl border min-w-[170px] transition-all',
        selected ? 'border-2' : ''
      )} style={{
        background: p.squad.bg,
        borderColor: selected ? p.squad.borderSel : p.squad.border,
        color: p.squad.text,
        boxShadow: selected ? `0 0 20px -4px ${p.squad.borderSel}` : p.squad.shadow,
      }}>
        <FourHandles color={p.squad.handle} />
        <div className="flex items-center gap-1.5 justify-center mb-0.5">
          <Users className="w-3.5 h-3.5" style={{ color: p.squad.border }} />
          <span className="text-xs font-bold">{data.label as string}</span>
        </div>
        {members.length > 0 ? (
          <div className="mt-2 pt-2 flex flex-wrap gap-1 justify-center max-w-[190px]"
            style={{ borderTop: `1px solid ${p.squad.divider}` }}>
            {members.map((m: string) => (
              <span key={m} className="text-[9px] px-2 py-0.5 rounded-full font-medium border"
                style={{ background: p.chip.bg, color: p.chip.text, borderColor: p.chip.border }}>
                {m}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-[10px] mt-1.5 text-center italic" style={{ color: p.empty.text }}>sem agentes</div>
        )}
        <div className="text-[10px] mt-2 text-center font-medium flex items-center justify-center gap-1" style={{ color: p.squad.sub }}>
          <Zap className="w-3 h-3" />
          {data.taskCount as number} tasks
        </div>
      </div>
    </>
  );
}

// ── Custom Edge: RelationEdge (with label) ──

function RelationEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected, data }: EdgeProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const relType = (data?.relationType as string) || 'coordena';
  const cfg = RELATIONS[relType] || RELATIONS.coordena;
  const color = isLight ? cfg.light : cfg.dark;
  const customLabel = data?.customLabel as string | undefined;
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  const labelBg = isLight ? 'hsl(210 30% 99%)' : 'hsl(220 20% 8%)';
  const labelBorder = isLight ? `${color}40` : `${color}55`;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeDasharray: cfg.dash || undefined,
          strokeWidth: selected ? 3 : 2,
          opacity: selected ? 1 : (isLight ? 0.9 : 0.8),
          filter: selected ? `drop-shadow(0 0 4px ${color})` : undefined,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan absolute"
        >
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full select-none whitespace-nowrap border shadow-sm"
            style={{
              background: labelBg,
              borderColor: labelBorder,
              color: color,
              backdropFilter: 'blur(6px)',
            }}>
            {customLabel || cfg.label}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes = { orchestrator: OrchestratorNode, agent: AgentNode, squad: SquadNode };
const edgeTypes = { relation: RelationEdge };

// ── Build system nodes & edges from store ──

function buildDiagramData(agents: AiosAgent[], squads: AiosSquad[], pattern: string, workflows: ProjectWorkflow[] = []) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const patternLabels: Record<string, string> = {
    SEQUENTIAL_PIPELINE: 'Pipeline Sequencial', PARALLEL_SWARM: 'Enxame Paralelo',
    HIERARCHICAL: 'Hierarquico', WATCHDOG: 'Watchdog',
    COLLABORATIVE: 'Colaborativo', TASK_FIRST: 'Task-First',
  };

  const agentCount = agents.length;
  const squadCount = squads.length;
  const agentTotalWidth = agentCount * (NODE_WIDTH + NODE_GAP) - NODE_GAP;
  const squadTotalWidth = squadCount * (NODE_WIDTH + 40 + NODE_GAP) - NODE_GAP;
  const maxWidth = Math.max(agentTotalWidth, squadTotalWidth, 250);

  // Tier 1: Orchestrator
  nodes.push({
    id: 'orchestrator', type: 'orchestrator',
    position: { x: maxWidth / 2 - 100, y: TIER_Y.orchestrator },
    data: { label: patternLabels[pattern] || pattern, sublabel: 'Orquestrador' },
    draggable: true,
  });

  // Tier 2: Agents
  const agentStartX = (maxWidth - agentTotalWidth) / 2;
  agents.forEach((agent, i) => {
    const nodeId = `agent-${agent.slug}`;
    nodes.push({
      id: nodeId, type: 'agent',
      position: { x: agentStartX + i * (NODE_WIDTH + NODE_GAP), y: TIER_Y.agents },
      data: {
        label: agent.name,
        sublabel: agent.role.substring(0, 60),
        category: agent.category || '',
        model: agent.llmModel,
        toolsCount: agent.tools.length,
        commandsCount: agent.commands.length,
        visibility: agent.visibility,
      },
      draggable: true,
    });

    // System edges: orchestrator → agents
    const isSequential = pattern === 'SEQUENTIAL_PIPELINE';
    if (isSequential && i > 0) {
      edges.push({
        id: `sys-chain-${i}`, source: `agent-${agents[i - 1].slug}`, target: nodeId,
        type: 'relation', data: { relationType: 'delega' },
        reconnectable: false,
      });
    }
    if (!isSequential || i === 0) {
      edges.push({
        id: `sys-orch-${agent.slug}`, source: 'orchestrator', target: nodeId,
        sourceHandle: 'bottom', targetHandle: 'top',
        type: 'relation', data: { relationType: 'orquestra' },
        reconnectable: false,
      });
    }
  });

  // Tier 3: Squads
  const squadStartX = (maxWidth - squadTotalWidth) / 2;
  squads.forEach((squad, i) => {
    const nodeId = `squad-${squad.slug}`;
    const memberNames = squad.agentIds.map(id => agents.find(a => a.slug === id)?.name).filter(Boolean);
    nodes.push({
      id: nodeId, type: 'squad',
      position: { x: squadStartX + i * (NODE_WIDTH + 40 + NODE_GAP), y: TIER_Y.squads },
      data: { label: squad.name, taskCount: squad.tasks.length, members: memberNames },
      draggable: true,
    });

    // System edges: agent → squad (membership)
    squad.agentIds.forEach((agentSlug) => {
      if (agents.find(a => a.slug === agentSlug)) {
        edges.push({
          id: `sys-member-${squad.slug}-${agentSlug}`,
          source: `agent-${agentSlug}`, target: nodeId,
          sourceHandle: 'bottom', targetHandle: 'top',
          type: 'relation', data: { relationType: 'membro' },
          reconnectable: false,
        });
      }
    });
  });

  // ── Workflow edges ──
  const agentNodeIds = new Set(agents.map(a => `agent-${a.slug}`));
  const wfSeen = new Set<string>();

  for (const workflow of workflows) {
    const stepMap = new Map(workflow.steps.map(s => [s.id, s.agentSlug]));

    for (const step of workflow.steps) {
      const tgtNode = `agent-${step.agentSlug}`;
      if (!agentNodeIds.has(tgtNode)) continue;

      if (step.dependsOn && step.dependsOn.length > 0) {
        // Edge from predecessor agent → current agent
        for (const depId of step.dependsOn) {
          const srcSlug = stepMap.get(depId);
          if (!srcSlug) continue;
          const srcNode = `agent-${srcSlug}`;
          if (!agentNodeIds.has(srcNode)) continue;
          const key = `${srcNode}->${tgtNode}`;
          if (wfSeen.has(key)) continue;
          wfSeen.add(key);
          edges.push({
            id: `wf-${workflow.slug}-${step.id}-${depId}`,
            source: srcNode,
            target: tgtNode,
            sourceHandle: 'right',
            targetHandle: 'left',
            type: 'relation',
            data: { relationType: 'workflow', customLabel: workflow.name },
            reconnectable: false,
          });
        }
      } else {
        // Steps without dependencies: edge from orchestrator → agent
        const key = `orchestrator->${tgtNode}`;
        if (wfSeen.has(key)) continue;
        wfSeen.add(key);
        edges.push({
          id: `wf-${workflow.slug}-${step.id}-orch`,
          source: 'orchestrator',
          target: tgtNode,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'relation',
          data: { relationType: 'workflow', customLabel: workflow.name },
          reconnectable: false,
        });
      }
    }
  }

  return { nodes, edges };
}

// ── Main Component ──

export function ArchitectureDiagram() {
  const store = useWizardStore();
  const { agents, squads, project, updateSquad, addSquad, updateAgent } = store;
  const { workflows } = useWorkflowStore();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [pendingConn, setPendingConn] = useState<Connection | null>(null);
  const [customLabel, setCustomLabel] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AiosAgent | null>(null);
  const customEdgesRef = useRef<Edge[]>([]);
  const nextCustomId = useRef(0);
  const [visibleWorkflowIds, setVisibleWorkflowIds] = useState<Set<string>>(new Set());
  const [showWorkflowFilter, setShowWorkflowFilter] = useState(false);

  // Sync visibleWorkflowIds with available workflows
  useEffect(() => {
    setVisibleWorkflowIds(prev => {
      const allIds = new Set(workflows.map(w => w.id));
      const next = new Set<string>();
      for (const id of allIds) {
        // Keep existing selections, add new workflows as visible by default
        if (prev.size === 0 || prev.has(id) || !prev.has(id)) next.add(id);
      }
      return next;
    });
  }, [workflows]);

  const filteredWorkflows = useMemo(
    () => workflows.filter(w => visibleWorkflowIds.has(w.id)),
    [workflows, visibleWorkflowIds]
  );

  // Listen for edit-agent events from nodes
  useEffect(() => {
    const handler = (e: Event) => {
      const slug = (e as CustomEvent).detail as string;
      const agent = agents.find(a => a.slug === slug);
      if (agent) setEditingAgent({ ...agent });
    };
    window.addEventListener('aios-edit-agent', handler);
    return () => window.removeEventListener('aios-edit-agent', handler);
  }, [agents]);

  const { nodes: sysNodes, edges: sysEdges } = useMemo(
    () => buildDiagramData(agents, squads, project.orchestrationPattern || 'TASK_FIRST', filteredWorkflows),
    [agents, squads, project.orchestrationPattern, filteredWorkflows]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(sysNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([...sysEdges, ...customEdgesRef.current]);

  // Sync system data, preserve custom edges and user-positioned nodes
  useEffect(() => {
    setNodes(prev => {
      const posMap = new Map(prev.map(n => [n.id, n.position]));
      return sysNodes.map(sn => {
        const existingPos = posMap.get(sn.id);
        return existingPos ? { ...sn, position: existingPos } : sn;
      });
    });
    setEdges(() => [...sysEdges, ...customEdgesRef.current]);
  }, [sysEdges, sysNodes, setNodes, setEdges]);

  // ── Connection: open relationship picker ──
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    if (connection.source === connection.target) return;
    setPendingConn(connection);
    setCustomLabel('');
  }, []);

  // Confirm relationship type from dialog
  const confirmRelation = useCallback((relationType: string) => {
    if (!pendingConn) return;
    const { source, target } = pendingConn;
    if (!source || !target) return;

    // If "membro" and agent→squad, update store (system edge will be created on re-render)
    const isAgentToSquad = source.startsWith('agent-') && target.startsWith('squad-');
    const isSquadToAgent = source.startsWith('squad-') && target.startsWith('agent-');
    if (relationType === 'membro' && (isAgentToSquad || isSquadToAgent)) {
      const agentSlug = isAgentToSquad ? source.replace('agent-', '') : target.replace('agent-', '');
      const squadSlug = isAgentToSquad ? target.replace('squad-', '') : source.replace('squad-', '');
      const squad = squads.find(s => s.slug === squadSlug);
      if (squad && !squad.agentIds.includes(agentSlug)) {
        updateSquad(squadSlug, { agentIds: [...squad.agentIds, agentSlug] });
      }
    } else {
      // Create custom edge
      const id = `custom-${nextCustomId.current++}`;
      const newEdge: Edge = {
        id,
        source: pendingConn.source!,
        target: pendingConn.target!,
        sourceHandle: pendingConn.sourceHandle || undefined,
        targetHandle: pendingConn.targetHandle || undefined,
        type: 'relation',
        data: { relationType, customLabel: customLabel.trim() || undefined },
        reconnectable: true,
      };
      customEdgesRef.current = [...customEdgesRef.current, newEdge];
      setEdges(prev => [...prev, newEdge]);
    }
    setPendingConn(null);
    setCustomLabel('');
  }, [pendingConn, squads, updateSquad, setEdges, customLabel]);

  // ── Validate connections ──
  const isValidConnection = useCallback((connection: Connection) => {
    return connection.source !== connection.target;
  }, []);

  // ── Edge deletion ──
  const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    deletedEdges.forEach(edge => {
      if (edge.id.startsWith('custom-')) {
        customEdgesRef.current = customEdgesRef.current.filter(e => e.id !== edge.id);
      }
      // System membership edges: remove agent from squad
      if (edge.id.startsWith('sys-member-')) {
        const agentSlug = edge.source?.replace('agent-', '') || '';
        const squadSlug = edge.target?.replace('squad-', '') || '';
        const squad = squads.find(s => s.slug === squadSlug);
        if (squad) {
          updateSquad(squadSlug, { agentIds: squad.agentIds.filter(id => id !== agentSlug) });
        }
      }
    });
  }, [squads, updateSquad]);

  // ── Edge reconnection (drag endpoint to another node) ──
  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    if (!oldEdge.id.startsWith('custom-')) return; // only custom edges are reconnectable
    const updated = reconnectEdge(oldEdge, newConnection, customEdgesRef.current);
    customEdgesRef.current = updated;
    setEdges(prev => {
      const withoutOld = prev.filter(e => e.id !== oldEdge.id);
      const newEdge = updated.find(e => e.id === oldEdge.id);
      return newEdge ? [...withoutOld, newEdge] : withoutOld;
    });
  }, [setEdges]);

  // ── Quick create squad ──
  const handleCreateSquad = () => {
    if (!newSquadName.trim()) return;
    const slug = newSquadName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    addSquad({ name: newSquadName, slug, description: '', agentIds: [], tasks: [], workflows: [], isValidated: false });
    setShowCreateSquad(false);
    setNewSquadName('');
  };

  // ── Save agent edits ──
  const handleSaveAgent = () => {
    if (!editingAgent) return;
    updateAgent(editingAgent.slug, {
      name: editingAgent.name,
      role: editingAgent.role,
      systemPrompt: editingAgent.systemPrompt,
      llmModel: editingAgent.llmModel,
      visibility: editingAgent.visibility,
    });
    setEditingAgent(null);
  };

  // ── Theme-aware colors for non-component elements ──
  const tierColor = (relKey: string) => isLight ? RELATIONS[relKey].light : RELATIONS[relKey].dark;
  const connLineColor = isLight ? 'hsl(220 60% 45% / 0.5)' : 'hsl(220 80% 65% / 0.5)';
  const bgDotColor = isLight ? 'hsl(220 15% 82%)' : 'hsl(var(--border))';

  // ── MiniMap node color callback ──
  const miniMapNodeColor = useCallback((node: Node) => {
    if (node.type === 'orchestrator') return isLight ? 'hsl(190 75% 50%)' : 'hsl(190 90% 55%)';
    if (node.type === 'agent') return isLight ? 'hsl(265 55% 55%)' : 'hsl(265 75% 62%)';
    if (node.type === 'squad') return isLight ? 'hsl(150 50% 42%)' : 'hsl(150 70% 48%)';
    return isLight ? 'hsl(220 10% 70%)' : 'hsl(220 15% 35%)';
  }, [isLight]);

  // ── Empty state ──
  if (agents.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center">
            <Network className="w-8 h-8 text-primary" />
          </div>
          <div className="absolute -inset-3 rounded-3xl bg-primary/5 -z-10 blur-md" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground mb-1.5">Diagrama de Arquitetura</p>
          <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed">
            Adicione agentes na etapa 3 para visualizar a hierarquia completa:
            orquestrador, agentes e squads organizados em tiers.
          </p>
        </div>
        <div className="flex items-center gap-6 text-[10px] text-muted-foreground">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center">
              <Crown className="w-4 h-4 text-muted-foreground" />
            </div>
            <span>Tier 1</span>
          </div>
          <div className="w-6 h-px bg-border" />
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center">
              <Bot className="w-4 h-4 text-muted-foreground" />
            </div>
            <span>Tier 2</span>
          </div>
          <div className="w-6 h-px bg-border" />
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center">
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <span>Tier 3</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onReconnect={onReconnect}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.35 }}
        connectionLineStyle={{ stroke: connLineColor, strokeWidth: 2 }}
        connectionLineType={ConnectionLineType.SmoothStep}
        deleteKeyCode="Delete"
        proOptions={{ hideAttribution: true }}
        className="aios-diagram"
        style={{ background: 'transparent' }}
      >
        <Background color={bgDotColor} gap={28} size={1.2} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={miniMapNodeColor}
          maskColor={isLight ? 'hsl(210 30% 98% / 0.8)' : 'hsl(220 20% 4% / 0.85)'}
          style={{ borderRadius: 8 }}
          pannable
          zoomable
        />

        {/* Tier indicators + legend + actions */}
        <Panel position="top-left">
          <div className="flex flex-col gap-1.5">
            {/* Tier legend row */}
            <div className="flex items-center gap-3 text-[10px] font-semibold bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 border border-border shadow-sm">
              <span className="flex items-center gap-1.5">
                <Crown className="w-3 h-3" style={{ color: tierColor('orquestra') }} />
                <span style={{ color: tierColor('orquestra') }}>Orquestrador</span>
              </span>
              <span className="w-px h-3 bg-border" />
              <span className="flex items-center gap-1.5">
                <Bot className="w-3 h-3" style={{ color: tierColor('delega') }} />
                <span style={{ color: tierColor('delega') }}>Agentes</span>
              </span>
              <span className="w-px h-3 bg-border" />
              <span className="flex items-center gap-1.5">
                <Users className="w-3 h-3" style={{ color: tierColor('membro') }} />
                <span style={{ color: tierColor('membro') }}>Squads</span>
              </span>
            </div>

            {/* Collapsible interaction help */}
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-card/95 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border shadow-sm hover:bg-secondary/30 transition-colors w-fit"
            >
              <Info className="w-3 h-3" />
              <span className="font-medium">Ajuda</span>
              {showHelp
                ? <ChevronDown className="w-3 h-3" />
                : <ChevronRight className="w-3 h-3" />
              }
            </button>
            {showHelp && (
              <div className="text-[10px] text-foreground bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 border border-border shadow-sm max-w-[220px] space-y-1 leading-relaxed">
                <p>Arraste de um lado do no para conectar</p>
                <p>Duplo-clique em um agente para editar</p>
                <p>Selecione + <kbd className="px-1 py-0.5 rounded bg-secondary border border-border text-[9px] font-mono">Del</kbd> para remover</p>
              </div>
            )}
          </div>
        </Panel>

        {/* Top-right action bar */}
        <Panel position="top-right">
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex gap-1.5">
              {workflows.length > 0 && (
                <Button variant="outline" size="sm"
                  className="h-7 text-[10px] gap-1.5 bg-card/95 backdrop-blur-sm border-border shadow-sm font-semibold"
                  onClick={() => setShowWorkflowFilter(!showWorkflowFilter)}
                  style={{ color: isLight ? RELATIONS.workflow.light : RELATIONS.workflow.dark }}
                >
                  <Zap className="w-3 h-3" />
                  Workflows
                  <span className="text-[9px] opacity-70">({visibleWorkflowIds.size}/{workflows.length})</span>
                  {showWorkflowFilter ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </Button>
              )}
              <Button variant="outline" size="sm"
                className="h-7 text-[10px] gap-1.5 bg-card/95 backdrop-blur-sm border-border shadow-sm font-semibold"
                onClick={() => setShowCreateSquad(true)}>
                <Plus className="w-3 h-3" /> Squad
              </Button>
            </div>

            {/* Workflow filter dropdown */}
            {showWorkflowFilter && workflows.length > 0 && (
              <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-border shadow-lg p-2.5 min-w-[200px] max-w-[260px]">
                {/* Bulk actions */}
                {workflows.length > 1 && (
                  <div className="flex gap-1.5 mb-2">
                    <button
                      className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-secondary/60 hover:bg-secondary text-foreground transition-colors"
                      onClick={() => setVisibleWorkflowIds(new Set(workflows.map(w => w.id)))}
                    >
                      Todos
                    </button>
                    <button
                      className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-secondary/60 hover:bg-secondary text-foreground transition-colors"
                      onClick={() => setVisibleWorkflowIds(new Set())}
                    >
                      Nenhum
                    </button>
                  </div>
                )}
                {/* Workflow list */}
                <div className="space-y-1">
                  {workflows.map(wf => {
                    const isVisible = visibleWorkflowIds.has(wf.id);
                    const wfColor = isLight ? RELATIONS.workflow.light : RELATIONS.workflow.dark;
                    return (
                      <button
                        key={wf.id}
                        className={cn(
                          "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-left transition-colors",
                          isVisible ? "bg-secondary/40 hover:bg-secondary/60" : "opacity-50 hover:opacity-75 hover:bg-secondary/20"
                        )}
                        onClick={() => {
                          setVisibleWorkflowIds(prev => {
                            const next = new Set(prev);
                            if (next.has(wf.id)) next.delete(wf.id);
                            else next.add(wf.id);
                            return next;
                          });
                        }}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10 transition-opacity"
                          style={{ background: wfColor, opacity: isVisible ? 1 : 0.3 }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-foreground truncate">{wf.name}</div>
                          <div className="text-[9px] text-muted-foreground">{wf.steps.length} steps</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Panel>

      </ReactFlow>

      {/* ── Relationship picker dialog ── */}
      <Dialog open={!!pendingConn} onOpenChange={(open) => { if (!open) setPendingConn(null); }}>
        <DialogContent className="glass max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Tipo de Relacao</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2 mb-3">
            {pendingConn?.source && pendingConn?.target && (
              <>
                <span className="font-medium text-foreground">{pendingConn.source.replace(/^(agent-|squad-|orchestrator)/, (m) => m === 'orchestrator' ? 'Orquestrador' : '')}</span>
                {' → '}
                <span className="font-medium text-foreground">{pendingConn.target.replace(/^(agent-|squad-|orchestrator)/, (m) => m === 'orchestrator' ? 'Orquestrador' : '')}</span>
              </>
            )}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {RELATION_OPTIONS.map(opt => {
              const cfg = RELATIONS[opt.type];
              const clr = isLight ? cfg.light : cfg.dark;
              return (
                <button key={opt.type}
                  onClick={() => confirmRelation(opt.type)}
                  className="flex items-center gap-2 p-2.5 rounded-lg border transition-all hover:scale-[1.02] active:scale-[0.98] text-left"
                  style={{
                    borderColor: clr + (isLight ? '55' : '44'),
                    background: clr + (isLight ? '10' : '0a'),
                  }}
                >
                  <span className="w-3 h-3 rounded-full shrink-0 ring-1 ring-black/10" style={{ background: clr }} />
                  <div>
                    <div className="text-[11px] font-semibold" style={{ color: clr }}>{cfg.label}</div>
                    <div className="text-[9px] text-muted-foreground">{opt.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 space-y-2">
            <Label className="text-[10px] text-muted-foreground">Rotulo personalizado (opcional)</Label>
            <div className="flex gap-2">
              <Input
                value={customLabel}
                onChange={e => setCustomLabel(e.target.value)}
                placeholder="Ex: Valida entregas"
                className="h-8 text-xs"
                onKeyDown={e => e.key === 'Enter' && customLabel.trim() && confirmRelation('coordena')}
              />
              {customLabel.trim() && (
                <Button size="sm" className="h-8 text-xs shrink-0" onClick={() => confirmRelation('coordena')}>
                  Aplicar
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Squad Dialog */}
      <Dialog open={showCreateSquad} onOpenChange={setShowCreateSquad}>
        <DialogContent className="glass max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Criar Squad pelo Diagrama</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Nome</Label>
              <Input value={newSquadName} onChange={e => setNewSquadName(e.target.value)}
                placeholder="Ex: Frontend Team" autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreateSquad()} />
            </div>
            <Button onClick={handleCreateSquad} className="w-full" size="sm" disabled={!newSquadName.trim()}>
              Criar e adicionar ao diagrama
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Agent via AgentEditor ── */}
      <AgentEditor
        agent={editingAgent}
        open={!!editingAgent}
        onOpenChange={(open) => { if (!open) setEditingAgent(null); }}
      />
    </div>
  );
}
