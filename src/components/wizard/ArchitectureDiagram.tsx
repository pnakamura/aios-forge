import { useWizardStore } from '@/stores/wizard-store';
import { AiosAgent, AiosSquad } from '@/types/aios';
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
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network, Bot, Users, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ── Relationship types (dark + light color variants) ──

const RELATIONS: Record<string, { label: string; dark: string; light: string; dash: string; animated: boolean }> = {
  orquestra:    { label: 'Orquestra',     dark: 'hsl(190 95% 55%)',  light: 'hsl(190 85% 32%)', dash: '',    animated: true },
  delega:       { label: 'Delega',        dark: 'hsl(265 80% 65%)',  light: 'hsl(265 65% 38%)', dash: '6 3', animated: false },
  supervisiona: { label: 'Supervisiona',  dark: 'hsl(40 95% 60%)',   light: 'hsl(35 80% 35%)',  dash: '',    animated: false },
  reporta:      { label: 'Reporta',       dark: 'hsl(200 80% 65%)',  light: 'hsl(200 70% 32%)', dash: '4 4', animated: false },
  coordena:     { label: 'Coordena',      dark: 'hsl(220 80% 70%)',  light: 'hsl(220 70% 35%)', dash: '',    animated: false },
  membro:       { label: 'Membro',        dark: 'hsl(150 80% 50%)',  light: 'hsl(150 65% 28%)', dash: '',    animated: false },
};

const RELATION_OPTIONS = [
  { type: 'orquestra',    desc: 'Comando hierarquico' },
  { type: 'delega',       desc: 'Delega tarefas' },
  { type: 'supervisiona', desc: 'Monitora e supervisiona' },
  { type: 'reporta',      desc: 'Reporta status/resultados' },
  { type: 'coordena',     desc: 'Colaboracao entre pares' },
  { type: 'membro',       desc: 'Pertence ao squad' },
];

// ── Tier layout constants ──

const TIER_Y = { orchestrator: 30, agents: 200, squads: 420 };
const NODE_WIDTH = 160;
const NODE_GAP = 20;

// ── Shared handle styles ──

const H_SIZE = '!w-2.5 !h-2.5 !min-w-0 !min-h-0';

function FourHandles({ color }: { color: string }) {
  const s: React.CSSProperties = { background: color, borderColor: color, opacity: 0 };
  return (
    <>
      <Handle type="source" position={Position.Top}    id="top"    className={`${H_SIZE} hover:!opacity-100 transition-opacity`} style={s} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={`${H_SIZE} hover:!opacity-100 transition-opacity`} style={s} />
      <Handle type="source" position={Position.Left}   id="left"   className={`${H_SIZE} hover:!opacity-100 transition-opacity`} style={s} />
      <Handle type="source" position={Position.Right}  id="right"  className={`${H_SIZE} hover:!opacity-100 transition-opacity`} style={s} />
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
      ? { bg: 'hsl(190 85% 94%)', border: 'hsl(190 80% 38%)', text: 'hsl(190 85% 18%)', sub: 'hsl(190 50% 32%)', shadow: '0 2px 12px -3px hsl(190 80% 38% / 0.2)', handle: 'hsl(190 80% 38%)' }
      : { bg: 'hsl(190 95% 50% / 0.15)', border: 'hsl(190 95% 50% / 0.6)', text: 'hsl(190 90% 82%)', sub: 'hsl(190 60% 68%)', shadow: '0 0 24px -4px hsl(190 95% 50% / 0.3)', handle: 'hsl(190 95% 50%)' },
    agent: isLight
      ? { bg: 'hsl(265 60% 96%)', border: 'hsl(265 60% 48%)', borderSel: 'hsl(265 65% 40%)', text: 'hsl(265 65% 18%)', sub: 'hsl(265 30% 38%)', cat: 'hsl(265 25% 48%)', handle: 'hsl(265 60% 48%)' }
      : { bg: 'hsl(265 80% 60% / 0.12)', border: 'hsl(265 80% 60% / 0.5)', borderSel: 'hsl(265 80% 60% / 0.8)', text: 'hsl(265 80% 88%)', sub: 'hsl(265 50% 70%)', cat: 'hsl(265 40% 58%)', handle: 'hsl(265 80% 60%)' },
    squad: isLight
      ? { bg: 'hsl(150 55% 95%)', border: 'hsl(150 55% 35%)', borderSel: 'hsl(150 60% 28%)', text: 'hsl(150 60% 16%)', sub: 'hsl(150 30% 32%)', divider: 'hsl(150 55% 35% / 0.3)', handle: 'hsl(150 55% 35%)' }
      : { bg: 'hsl(150 80% 45% / 0.12)', border: 'hsl(150 80% 45% / 0.55)', borderSel: 'hsl(150 80% 45% / 0.8)', text: 'hsl(150 75% 82%)', sub: 'hsl(150 50% 62%)', divider: 'hsl(150 80% 45% / 0.3)', handle: 'hsl(150 80% 45%)' },
    chip: isLight
      ? { bg: 'hsl(265 60% 48% / 0.12)', text: 'hsl(265 60% 25%)' }
      : { bg: 'hsl(265 80% 60% / 0.22)', text: 'hsl(265 80% 88%)' },
    empty: isLight
      ? { text: 'hsl(220 15% 45%)' }
      : { text: 'hsl(220 15% 50%)' },
  }), [isLight]);
}

// ── Custom Node: Orchestrator ──

function OrchestratorNode({ data }: NodeProps) {
  const p = useNodeColors();
  return (
    <div className="px-5 py-3 rounded-xl border-2 text-center min-w-[180px]"
      style={{
        background: p.orch.bg,
        borderColor: p.orch.border,
        color: p.orch.text,
        boxShadow: p.orch.shadow,
      }}
    >
      <FourHandles color={p.orch.handle} />
      <div className="flex items-center gap-1.5 justify-center">
        <Network className="w-3.5 h-3.5" style={{ opacity: 0.7 }} />
        <span className="text-xs font-bold">{data.label as string}</span>
      </div>
      <div className="text-[10px] mt-0.5" style={{ color: p.orch.sub }}>{data.sublabel as string}</div>
    </div>
  );
}

// ── Custom Node: Agent ──

function AgentNode({ data, id, selected }: NodeProps) {
  const { removeAgent } = useWizardStore();
  const p = useNodeColors();
  const agentSlug = (id as string).replace('agent-', '');

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="flex gap-1 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-1 shadow-lg">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={() => removeAgent(agentSlug)} title="Remover agente">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </NodeToolbar>
      <div className={cn(
        'px-4 py-2.5 rounded-lg border text-center min-w-[140px] transition-shadow',
        selected ? 'border-2' : ''
      )} style={{
        background: p.agent.bg,
        borderColor: selected ? p.agent.borderSel : p.agent.border,
        color: p.agent.text,
        boxShadow: selected ? `0 0 14px -3px ${p.agent.borderSel}` : undefined,
      }}>
        <FourHandles color={p.agent.handle} />
        <div className="flex items-center gap-1.5 justify-center">
          <Bot className="w-3 h-3" style={{ opacity: 0.7 }} />
          <span className="text-[11px] font-semibold">{data.label as string}</span>
        </div>
        <div className="text-[9px] mt-0.5 truncate max-w-[130px]" style={{ color: p.agent.sub }}>{data.sublabel as string}</div>
        {data.category && <div className="text-[8px] mt-1" style={{ color: p.agent.cat }}>{data.category as string}</div>}
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
        <div className="flex gap-1 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-1 shadow-lg">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={() => removeSquad(squadSlug)} title="Remover squad">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </NodeToolbar>
      <div className={cn(
        'px-4 py-3 rounded-lg border min-w-[160px] transition-shadow',
        selected ? 'border-2' : ''
      )} style={{
        background: p.squad.bg,
        borderColor: selected ? p.squad.borderSel : p.squad.border,
        color: p.squad.text,
        boxShadow: selected ? `0 0 14px -3px ${p.squad.borderSel}` : undefined,
      }}>
        <FourHandles color={p.squad.handle} />
        <div className="flex items-center gap-1.5 justify-center">
          <Users className="w-3 h-3" style={{ opacity: 0.7 }} />
          <span className="text-[11px] font-semibold">{data.label as string}</span>
        </div>
        {members.length > 0 ? (
          <div className="mt-2 pt-2 flex flex-wrap gap-1 justify-center max-w-[180px]"
            style={{ borderTop: `1px solid ${p.squad.divider}` }}>
            {members.map((m: string) => (
              <span key={m} className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: p.chip.bg, color: p.chip.text }}>
                {m}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-[9px] mt-1 text-center" style={{ color: p.empty.text }}>sem agentes</div>
        )}
        <div className="text-[9px] mt-1.5 text-center" style={{ color: p.squad.sub }}>{data.taskCount as number} tasks</div>
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

  // Edge label styling: opaque background for readability
  const labelBg = isLight
    ? `hsl(210 30% 98% / 0.92)`
    : `hsl(220 20% 8% / 0.92)`;
  const labelBorder = isLight ? `${color}44` : `${color}66`;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeDasharray: cfg.dash || undefined,
          strokeWidth: selected ? 2.5 : 1.5,
          opacity: selected ? 1 : (isLight ? 0.85 : 0.75),
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
          <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full select-none whitespace-nowrap"
            style={{
              background: labelBg,
              border: `1px solid ${labelBorder}`,
              color: color,
              backdropFilter: 'blur(4px)',
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

function buildDiagramData(agents: AiosAgent[], squads: AiosSquad[], pattern: string) {
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
  const maxWidth = Math.max(agentTotalWidth, squadTotalWidth, 200);

  // Tier 1: Orchestrator
  nodes.push({
    id: 'orchestrator', type: 'orchestrator',
    position: { x: maxWidth / 2 - 90, y: TIER_Y.orchestrator },
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
      data: { label: agent.name, sublabel: agent.role.substring(0, 40), category: agent.category || '' },
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

  return { nodes, edges };
}

// ── Main Component ──

export function ArchitectureDiagram() {
  const store = useWizardStore();
  const { agents, squads, project, updateSquad, addSquad } = store;
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [pendingConn, setPendingConn] = useState<Connection | null>(null);
  const [customLabel, setCustomLabel] = useState('');
  const customEdgesRef = useRef<Edge[]>([]);
  let nextCustomId = useRef(0);

  const { nodes: sysNodes, edges: sysEdges } = useMemo(
    () => buildDiagramData(agents, squads, project.orchestrationPattern || 'TASK_FIRST'),
    [agents, squads, project.orchestrationPattern]
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

  // ── Theme-aware colors for non-component elements ──
  const tierColor = (relKey: string) => isLight ? RELATIONS[relKey].light : RELATIONS[relKey].dark;
  const connLineColor = isLight ? 'hsl(220 60% 45% / 0.5)' : 'hsl(220 80% 65% / 0.5)';
  const bgDotColor = isLight ? 'hsl(220 15% 78%)' : 'hsl(var(--border))';

  // ── Empty state ──
  if (agents.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Network className="w-7 h-7 text-primary/50" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Diagrama de Arquitetura</p>
          <p className="text-xs text-muted-foreground/60 max-w-xs">
            Quando voce adicionar agentes (etapa 3), o diagrama mostrara a hierarquia
            com orquestrador, agentes e squads em niveis (tiers).
          </p>
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
        fitViewOptions={{ padding: 0.3 }}
        connectionLineStyle={{ stroke: connLineColor, strokeWidth: 2 }}
        connectionLineType="smoothstep"
        deleteKeyCode="Delete"
        proOptions={{ hideAttribution: true }}
        className="aios-diagram"
        style={{ background: 'transparent' }}
      >
        <Background color={bgDotColor} gap={30} size={1} />
        <Controls />
        <MiniMap
          maskColor={isLight ? 'hsl(210 30% 98% / 0.75)' : 'hsl(220 20% 4% / 0.8)'}
        />

        {/* Legend */}
        <Panel position="top-left">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-medium text-foreground/80 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border shadow-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10" style={{ background: tierColor('orquestra') }} />
                Orquestrador
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10" style={{ background: tierColor('delega') }} />
                Agentes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10" style={{ background: tierColor('membro') }} />
                Squads
              </span>
            </div>
            <div className="text-[10px] text-foreground/60 bg-card/85 backdrop-blur-sm rounded-lg px-3 py-2 border border-border shadow-sm max-w-[240px]">
              <p className="font-semibold text-foreground/80 mb-1">Interacao:</p>
              <ul className="space-y-0.5 leading-relaxed">
                <li>Arraste de qualquer lado de um no para conectar</li>
                <li>Arraste a ponta de uma linha para mover conexao</li>
                <li>Selecione uma linha e Delete para remover</li>
                <li>Selecione um no e Delete para remover</li>
              </ul>
            </div>
          </div>
        </Panel>

        <Panel position="top-right">
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 bg-card/90 backdrop-blur-sm border-border shadow-sm"
              onClick={() => setShowCreateSquad(true)}>
              <Plus className="w-3 h-3" /> Squad
            </Button>
          </div>
        </Panel>
      </ReactFlow>

      {/* Tier labels */}
      <div className="absolute left-1 pointer-events-none" style={{ top: TIER_Y.orchestrator + 'px' }}>
        <span className="text-[9px] font-bold uppercase tracking-widest select-none"
          style={{ color: tierColor('orquestra'), opacity: isLight ? 0.8 : 0.65 }}>
          Tier 1
        </span>
      </div>
      <div className="absolute left-1 pointer-events-none" style={{ top: TIER_Y.agents + 'px' }}>
        <span className="text-[9px] font-bold uppercase tracking-widest select-none"
          style={{ color: tierColor('delega'), opacity: isLight ? 0.8 : 0.65 }}>
          Tier 2
        </span>
      </div>
      {squads.length > 0 && (
        <div className="absolute left-1 pointer-events-none" style={{ top: TIER_Y.squads + 'px' }}>
          <span className="text-[9px] font-bold uppercase tracking-widest select-none"
            style={{ color: tierColor('membro'), opacity: isLight ? 0.8 : 0.65 }}>
            Tier 3
          </span>
        </div>
      )}

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
    </div>
  );
}
