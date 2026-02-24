import { useWizardStore } from '@/stores/wizard-store';
import { AiosAgent, AiosSquad } from '@/types/aios';
import { useMemo, useEffect, useCallback, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
  NodeToolbar,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network, Bot, Users, Trash2, Plus, Link2, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// ── Tier layout constants ──

const TIER_Y = {
  orchestrator: 30,
  agents: 180,
  squads: 360,
};

const NODE_WIDTH = 160;
const NODE_GAP = 20;

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
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[hsl(190,95%,50%)] !border-2 !border-[hsl(190,95%,70%)]" />
      <div className="text-xs font-bold">{data.label as string}</div>
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
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={() => removeAgent(agentSlug)}
            title="Remover agente"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </NodeToolbar>
      <div className={cn(
        'px-4 py-2.5 rounded-lg border text-center min-w-[140px] transition-shadow',
        selected ? 'shadow-[0_0_12px_-3px_hsl(265,80%,60%/0.5)]' : ''
      )}
        style={{
          background: 'hsl(265 80% 60% / 0.08)',
          borderColor: selected ? 'hsl(265 80% 60% / 0.6)' : 'hsl(265 80% 60% / 0.35)',
          color: 'hsl(265 80% 80%)',
        }}
      >
        <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-[hsl(265,80%,60%)] !border-2 !border-[hsl(265,80%,80%)]" />
        <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-[hsl(265,80%,60%)] !border-2 !border-[hsl(265,80%,80%)]" />
        <div className="flex items-center gap-1.5 justify-center">
          <Bot className="w-3 h-3 opacity-60" />
          <span className="text-[11px] font-semibold">{data.label as string}</span>
        </div>
        <div className="text-[9px] opacity-50 mt-0.5 truncate max-w-[130px]">{data.sublabel as string}</div>
        {data.category && (
          <div className="text-[8px] opacity-40 mt-1">{data.category as string}</div>
        )}
      </div>
    </>
  );
}

// ── Custom Node: Squad ──

function SquadNode({ data, id, selected }: NodeProps) {
  const { removeSquad } = useWizardStore();
  const squadSlug = (id as string).replace('squad-', '');

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Bottom}>
        <div className="flex gap-1 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg p-1 shadow-lg">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={() => removeSquad(squadSlug)}
            title="Remover squad"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </NodeToolbar>
      <div className={cn(
        'px-4 py-2.5 rounded-lg border text-center min-w-[150px] transition-shadow',
        selected ? 'shadow-[0_0_12px_-3px_hsl(150,80%,45%/0.5)]' : ''
      )}
        style={{
          background: 'hsl(150 80% 45% / 0.08)',
          borderColor: selected ? 'hsl(150 80% 45% / 0.6)' : 'hsl(150 80% 45% / 0.35)',
          color: 'hsl(150 80% 70%)',
        }}
      >
        <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-[hsl(150,80%,45%)] !border-2 !border-[hsl(150,80%,70%)]" />
        <div className="flex items-center gap-1.5 justify-center">
          <Users className="w-3 h-3 opacity-60" />
          <span className="text-[11px] font-semibold">{data.label as string}</span>
        </div>
        <div className="text-[9px] opacity-50 mt-0.5">{data.agentCount as number} agentes · {data.taskCount as number} tasks</div>
      </div>
    </>
  );
}

const nodeTypes = {
  orchestrator: OrchestratorNode,
  agent: AgentNode,
  squad: SquadNode,
};

// ── Build diagram data from store ──

function buildDiagramData(
  agents: AiosAgent[],
  squads: AiosSquad[],
  pattern: string,
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const patternLabels: Record<string, string> = {
    SEQUENTIAL_PIPELINE: 'Pipeline Sequencial',
    PARALLEL_SWARM: 'Enxame Paralelo',
    HIERARCHICAL: 'Hierarquico',
    WATCHDOG: 'Watchdog',
    COLLABORATIVE: 'Colaborativo',
    TASK_FIRST: 'Task-First',
  };

  // Calculate layout widths
  const agentCount = agents.length;
  const squadCount = squads.length;
  const agentTotalWidth = agentCount * (NODE_WIDTH + NODE_GAP) - NODE_GAP;
  const squadTotalWidth = squadCount * (NODE_WIDTH + 40 + NODE_GAP) - NODE_GAP;
  const maxWidth = Math.max(agentTotalWidth, squadTotalWidth, 200);

  // Tier 1: Orchestrator (top center)
  nodes.push({
    id: 'orchestrator',
    type: 'orchestrator',
    position: { x: maxWidth / 2 - 90, y: TIER_Y.orchestrator },
    data: {
      label: patternLabels[pattern] || pattern,
      sublabel: 'Orquestrador',
    },
    draggable: true,
    selectable: false,
  });

  // Tier 2: Agents
  const agentStartX = (maxWidth - agentTotalWidth) / 2;
  agents.forEach((agent, i) => {
    const nodeId = `agent-${agent.slug}`;
    nodes.push({
      id: nodeId,
      type: 'agent',
      position: { x: agentStartX + i * (NODE_WIDTH + NODE_GAP), y: TIER_Y.agents },
      data: {
        label: agent.name,
        sublabel: agent.role.substring(0, 40),
        category: agent.category || '',
      },
      draggable: true,
    });

    // Edges: orchestrator → agents
    const isSequential = pattern === 'SEQUENTIAL_PIPELINE';
    if (isSequential && i > 0) {
      edges.push({
        id: `edge-chain-${i}`,
        source: `agent-${agents[i - 1].slug}`,
        target: nodeId,
        style: { stroke: 'hsl(265 80% 60% / 0.4)', strokeWidth: 1.5 },
        animated: true,
        type: 'smoothstep',
      });
    }
    if (!isSequential || i === 0) {
      edges.push({
        id: `edge-orch-${agent.slug}`,
        source: 'orchestrator',
        target: nodeId,
        style: { stroke: 'hsl(190 95% 50% / 0.3)', strokeWidth: 1.5 },
        animated: true,
        type: 'smoothstep',
      });
    }
  });

  // Tier 3: Squads
  const squadStartX = (maxWidth - squadTotalWidth) / 2;
  squads.forEach((squad, i) => {
    const nodeId = `squad-${squad.slug}`;
    nodes.push({
      id: nodeId,
      type: 'squad',
      position: { x: squadStartX + i * (NODE_WIDTH + 40 + NODE_GAP), y: TIER_Y.squads },
      data: {
        label: squad.name,
        agentCount: squad.agentIds.length,
        taskCount: squad.tasks.length,
      },
      draggable: true,
    });

    // Edges: agents → squads (membership)
    squad.agentIds.forEach((agentSlug) => {
      if (agents.find(a => a.slug === agentSlug)) {
        edges.push({
          id: `edge-squad-${squad.slug}-${agentSlug}`,
          source: `agent-${agentSlug}`,
          target: nodeId,
          style: { stroke: 'hsl(150 80% 45% / 0.4)', strokeWidth: 1.5 },
          type: 'smoothstep',
          label: '',
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

  const { nodes: computedNodes, edges: computedEdges } = useMemo(
    () => buildDiagramData(agents, squads, project.orchestrationPattern || 'TASK_FIRST'),
    [agents, squads, project.orchestrationPattern]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(computedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(computedEdges);

  // Sync when store data changes
  useEffect(() => {
    setNodes(computedNodes);
    setEdges(computedEdges);
  }, [computedNodes, computedEdges, setNodes, setEdges]);

  // Handle new connection: agent → squad = assign agent to squad
  const onConnect = useCallback((connection: Connection) => {
    const { source, target } = connection;
    if (!source || !target) return;

    // Only allow agent → squad connections
    const isAgentToSquad = source.startsWith('agent-') && target.startsWith('squad-');
    const isSquadToAgent = source.startsWith('squad-') && target.startsWith('agent-');

    if (isAgentToSquad) {
      const agentSlug = source.replace('agent-', '');
      const squadSlug = target.replace('squad-', '');
      const squad = squads.find(s => s.slug === squadSlug);
      if (squad && !squad.agentIds.includes(agentSlug)) {
        updateSquad(squadSlug, { agentIds: [...squad.agentIds, agentSlug] });
      }
    } else if (isSquadToAgent) {
      const agentSlug = target.replace('agent-', '');
      const squadSlug = source.replace('squad-', '');
      const squad = squads.find(s => s.slug === squadSlug);
      if (squad && !squad.agentIds.includes(agentSlug)) {
        updateSquad(squadSlug, { agentIds: [...squad.agentIds, agentSlug] });
      }
    }
    // Don't manually add edges — the store update triggers a re-render with correct edges
  }, [squads, updateSquad]);

  // Validate connections
  const isValidConnection = useCallback((connection: Connection) => {
    const { source, target } = connection;
    if (!source || !target) return false;
    // Allow agent ↔ squad connections only
    return (
      (source.startsWith('agent-') && target.startsWith('squad-')) ||
      (source.startsWith('squad-') && target.startsWith('agent-'))
    );
  }, []);

  // Handle edge deletion = remove agent from squad
  const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    deletedEdges.forEach(edge => {
      if (edge.id.startsWith('edge-squad-')) {
        // Parse: edge-squad-{squadSlug}-{agentSlug}
        const parts = edge.id.replace('edge-squad-', '').split('-');
        // The squad slug might contain hyphens, so we need to find the agent
        const agentSlug = edge.source?.replace('agent-', '') || '';
        const squadSlug = edge.target?.replace('squad-', '') || '';
        const squad = squads.find(s => s.slug === squadSlug);
        if (squad) {
          updateSquad(squadSlug, {
            agentIds: squad.agentIds.filter(id => id !== agentSlug),
          });
        }
      }
    });
  }, [squads, updateSquad]);

  // Quick create squad from diagram
  const handleCreateSquad = () => {
    if (!newSquadName.trim()) return;
    const slug = newSquadName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    addSquad({
      name: newSquadName,
      slug,
      description: '',
      agentIds: [],
      tasks: [],
      workflows: [],
      isValidated: false,
    });
    setShowCreateSquad(false);
    setNewSquadName('');
  };

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
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        connectionLineStyle={{ stroke: 'hsl(150 80% 45% / 0.5)', strokeWidth: 2 }}
        connectionLineType="smoothstep"
        deleteKeyCode="Delete"
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        <Background color="hsl(220 16% 16%)" gap={30} size={1} />
        <Controls
          style={{
            background: 'hsl(220 18% 7%)',
            border: '1px solid hsl(220 16% 16%)',
            borderRadius: '8px',
          }}
        />
        <MiniMap
          style={{
            background: 'hsl(220 18% 5%)',
            border: '1px solid hsl(220 16% 16%)',
            borderRadius: '8px',
          }}
          maskColor="hsl(220 20% 4% / 0.8)"
        />

        {/* Legend + Tier labels */}
        <Panel position="top-left">
          <div className="flex flex-col gap-2">
            {/* Legend */}
            <div className="flex gap-3 text-[10px] text-muted-foreground bg-card/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(190,95%,50%)]" /> Orquestrador</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(265,80%,60%)]" /> Agentes</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(150,80%,45%)]" /> Squads</span>
            </div>
            {/* Instructions */}
            <div className="text-[10px] text-muted-foreground/60 bg-card/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/30 max-w-[220px]">
              <p className="font-medium text-muted-foreground mb-1">Interacao:</p>
              <ul className="space-y-0.5">
                <li>Arraste conectores de agente para squad</li>
                <li>Selecione um no e aperte Delete para remover</li>
                <li>Selecione uma conexao e Delete para desvincular</li>
              </ul>
            </div>
          </div>
        </Panel>

        {/* Quick actions panel */}
        <Panel position="top-right">
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1 bg-card/80 backdrop-blur-sm"
              onClick={() => setShowCreateSquad(true)}
            >
              <Plus className="w-3 h-3" /> Squad
            </Button>
          </div>
        </Panel>
      </ReactFlow>

      {/* Tier labels overlay */}
      <div className="absolute left-1 pointer-events-none" style={{ top: TIER_Y.orchestrator + 'px' }}>
        <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(190,95%,50%)] opacity-40 select-none">Tier 1</span>
      </div>
      <div className="absolute left-1 pointer-events-none" style={{ top: TIER_Y.agents + 'px' }}>
        <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(265,80%,60%)] opacity-40 select-none">Tier 2</span>
      </div>
      {squads.length > 0 && (
        <div className="absolute left-1 pointer-events-none" style={{ top: TIER_Y.squads + 'px' }}>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(150,80%,45%)] opacity-40 select-none">Tier 3</span>
        </div>
      )}

      {/* Create Squad Dialog */}
      <Dialog open={showCreateSquad} onOpenChange={setShowCreateSquad}>
        <DialogContent className="glass max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Criar Squad pelo Diagrama</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Nome</Label>
              <Input
                value={newSquadName}
                onChange={e => setNewSquadName(e.target.value)}
                placeholder="Ex: Frontend Team"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreateSquad()}
              />
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
