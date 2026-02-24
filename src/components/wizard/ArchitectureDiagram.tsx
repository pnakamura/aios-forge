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
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ── Relationship types ──

const RELATIONS: Record<string, { label: string; color: string; dash: string; animated: boolean }> = {
  orquestra:    { label: 'Orquestra',     color: 'hsl(190 95% 50%)',  dash: '',    animated: true },
  delega:       { label: 'Delega',        color: 'hsl(265 80% 60%)',  dash: '6 3', animated: false },
  supervisiona: { label: 'Supervisiona',  color: 'hsl(40 95% 55%)',   dash: '',    animated: false },
  reporta:      { label: 'Reporta',       color: 'hsl(200 80% 60%)',  dash: '4 4', animated: false },
  coordena:     { label: 'Coordena',      color: 'hsl(220 80% 65%)',  dash: '',    animated: false },
  membro:       { label: 'Membro',        color: 'hsl(150 80% 45%)',  dash: '',    animated: false },
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

const H_SIZE = '!w-2 !h-2 !min-w-0 !min-h-0';

function FourHandles({ color }: { color: string }) {
  const cls = `${H_SIZE} !bg-[${color}] !border !border-[${color}] !opacity-0 hover:!opacity-100 transition-opacity`;
  // Use inline style for reliable color since Tailwind can't use dynamic bracket values in JIT
  const s = { background: color, borderColor: color, opacity: 0 };
  const sHover = { background: color, borderColor: color };
  return (
    <>
      <Handle type="source" position={Position.Top}    id="top"    className={H_SIZE} style={s} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={H_SIZE} style={s} />
      <Handle type="source" position={Position.Left}   id="left"   className={H_SIZE} style={s} />
      <Handle type="source" position={Position.Right}  id="right"  className={H_SIZE} style={s} />
    </>
  );
}

// ── Custom Node: Orchestrator ──

function OrchestratorNode({ data }: NodeProps) {
  return (
    <div className="px-5 py-3 rounded-xl border-2 text-center min-w-[180px]"
      style={{
        background: 'hsl(190 95% 50% / 0.12)',
        borderColor: 'hsl(190 95% 50% / 0.5)',
        color: 'hsl(190 95% 70%)',
        boxShadow: '0 0 20px -5px hsl(190 95% 50% / 0.2)',
      }}
    >
      <FourHandles color="hsl(190,95%,50%)" />
      <div className="flex items-center gap-1.5 justify-center">
        <Network className="w-3.5 h-3.5 opacity-60" />
        <span className="text-xs font-bold">{data.label as string}</span>
      </div>
      <div className="text-[10px] opacity-60 mt-0.5">{data.sublabel as string}</div>
    </div>
  );
}

// ── Custom Node: Agent ──

function AgentNode({ data, id, selected }: NodeProps) {
  const { removeAgent } = useWizardStore();
  const agentSlug = (id as string).replace('agent-', '');

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="flex gap-1 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg p-1 shadow-lg">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={() => removeAgent(agentSlug)} title="Remover agente">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </NodeToolbar>
      <div className={cn(
        'px-4 py-2.5 rounded-lg border text-center min-w-[140px] transition-shadow',
        selected ? 'shadow-[0_0_12px_-3px_hsl(265,80%,60%/0.5)]' : ''
      )} style={{
        background: 'hsl(265 80% 60% / 0.08)',
        borderColor: selected ? 'hsl(265 80% 60% / 0.6)' : 'hsl(265 80% 60% / 0.35)',
        color: 'hsl(265 80% 80%)',
      }}>
        <FourHandles color="hsl(265,80%,60%)" />
        <div className="flex items-center gap-1.5 justify-center">
          <Bot className="w-3 h-3 opacity-60" />
          <span className="text-[11px] font-semibold">{data.label as string}</span>
        </div>
        <div className="text-[9px] opacity-50 mt-0.5 truncate max-w-[130px]">{data.sublabel as string}</div>
        {data.category && <div className="text-[8px] opacity-40 mt-1">{data.category as string}</div>}
      </div>
    </>
  );
}

// ── Custom Node: Squad (shows member list) ──

function SquadNode({ data, id, selected }: NodeProps) {
  const { removeSquad } = useWizardStore();
  const squadSlug = (id as string).replace('squad-', '');
  const members = (data.members as string[]) || [];

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Bottom}>
        <div className="flex gap-1 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg p-1 shadow-lg">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={() => removeSquad(squadSlug)} title="Remover squad">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </NodeToolbar>
      <div className={cn(
        'px-4 py-3 rounded-lg border min-w-[160px] transition-shadow',
        selected ? 'shadow-[0_0_12px_-3px_hsl(150,80%,45%/0.5)]' : ''
      )} style={{
        background: 'hsl(150 80% 45% / 0.08)',
        borderColor: selected ? 'hsl(150 80% 45% / 0.6)' : 'hsl(150 80% 45% / 0.35)',
        color: 'hsl(150 80% 70%)',
      }}>
        <FourHandles color="hsl(150,80%,45%)" />
        <div className="flex items-center gap-1.5 justify-center">
          <Users className="w-3 h-3 opacity-60" />
          <span className="text-[11px] font-semibold">{data.label as string}</span>
        </div>
        {members.length > 0 ? (
          <div className="mt-2 pt-2 border-t border-[hsl(150,80%,45%,0.2)] flex flex-wrap gap-1 justify-center max-w-[180px]">
            {members.map((m: string) => (
              <span key={m} className="text-[8px] px-1.5 py-0.5 rounded-full"
                style={{ background: 'hsl(265 80% 60% / 0.15)', color: 'hsl(265 80% 80%)' }}>
                {m}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-[9px] opacity-40 mt-1 text-center">sem agentes</div>
        )}
        <div className="text-[9px] opacity-50 mt-1.5 text-center">{data.taskCount as number} tasks</div>
      </div>
    </>
  );
}

// ── Custom Edge: RelationEdge (with label) ──

function RelationEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected, data }: EdgeProps) {
  const relType = (data?.relationType as string) || 'coordena';
  const cfg = RELATIONS[relType] || RELATIONS.coordena;
  const customLabel = data?.customLabel as string | undefined;
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: cfg.color,
          strokeDasharray: cfg.dash || undefined,
          strokeWidth: selected ? 2.5 : 1.5,
          opacity: selected ? 1 : 0.6,
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
          <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full select-none whitespace-nowrap"
            style={{
              background: cfg.color + '22',
              border: `1px solid ${cfg.color}55`,
              color: cfg.color,
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
        connectionLineStyle={{ stroke: 'hsl(220 80% 65% / 0.5)', strokeWidth: 2 }}
        connectionLineType="smoothstep"
        deleteKeyCode="Delete"
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        <Background color="hsl(var(--border))" gap={30} size={1} />
        <Controls
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <MiniMap
          style={{
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          maskColor="hsl(var(--background) / 0.8)"
        />

        {/* Legend */}
        <Panel position="top-left">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground bg-card/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: RELATIONS.orquestra.color }} /> Orquestrador</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: RELATIONS.delega.color }} /> Agentes</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: RELATIONS.membro.color }} /> Squads</span>
            </div>
            <div className="text-[10px] text-muted-foreground/60 bg-card/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/30 max-w-[240px]">
              <p className="font-medium text-muted-foreground mb-1">Interacao:</p>
              <ul className="space-y-0.5">
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
            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 bg-card/80 backdrop-blur-sm"
              onClick={() => setShowCreateSquad(true)}>
              <Plus className="w-3 h-3" /> Squad
            </Button>
          </div>
        </Panel>
      </ReactFlow>

      {/* Tier labels */}
      <div className="absolute left-1 pointer-events-none" style={{ top: TIER_Y.orchestrator + 'px' }}>
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 select-none" style={{ color: RELATIONS.orquestra.color }}>Tier 1</span>
      </div>
      <div className="absolute left-1 pointer-events-none" style={{ top: TIER_Y.agents + 'px' }}>
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 select-none" style={{ color: RELATIONS.delega.color }}>Tier 2</span>
      </div>
      {squads.length > 0 && (
        <div className="absolute left-1 pointer-events-none" style={{ top: TIER_Y.squads + 'px' }}>
          <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 select-none" style={{ color: RELATIONS.membro.color }}>Tier 3</span>
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
              return (
                <button key={opt.type}
                  onClick={() => confirmRelation(opt.type)}
                  className="flex items-center gap-2 p-2.5 rounded-lg border transition-all hover:scale-[1.02] active:scale-[0.98] text-left"
                  style={{ borderColor: cfg.color + '44', background: cfg.color + '0a' }}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: cfg.color }} />
                  <div>
                    <div className="text-[11px] font-semibold" style={{ color: cfg.color }}>{cfg.label}</div>
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
