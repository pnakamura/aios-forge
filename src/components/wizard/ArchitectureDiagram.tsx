import { useWizardStore } from '@/stores/wizard-store';
import { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Bot, Users, Network } from 'lucide-react';

const NODE_STYLES = {
  orchestrator: {
    background: 'hsl(190 95% 50% / 0.12)',
    border: '2px solid hsl(190 95% 50% / 0.5)',
    borderRadius: '14px',
    padding: '14px 24px',
    color: 'hsl(190 95% 70%)',
    fontSize: '12px',
    fontWeight: '700',
    textAlign: 'center' as const,
    whiteSpace: 'pre-line' as const,
    boxShadow: '0 0 20px -5px hsl(190 95% 50% / 0.2)',
  },
  agent: {
    background: 'hsl(265 80% 60% / 0.08)',
    border: '1.5px solid hsl(265 80% 60% / 0.35)',
    borderRadius: '10px',
    padding: '10px 16px',
    color: 'hsl(265 80% 80%)',
    fontSize: '11px',
    fontWeight: '500',
    textAlign: 'center' as const,
    whiteSpace: 'pre-line' as const,
    minWidth: '140px',
  },
  squad: {
    background: 'hsl(150 80% 45% / 0.08)',
    border: '1.5px solid hsl(150 80% 45% / 0.35)',
    borderRadius: '10px',
    padding: '10px 16px',
    color: 'hsl(150 80% 70%)',
    fontSize: '11px',
    fontWeight: '500',
    textAlign: 'center' as const,
    whiteSpace: 'pre-line' as const,
    minWidth: '150px',
  },
};

function buildDiagramData(agents: any[], squads: any[], pattern: string) {
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

  // Calculate layout
  const agentCount = agents.length;
  const squadCount = squads.length;
  const totalWidth = Math.max(agentCount, squadCount, 1) * 180;
  const centerX = totalWidth / 2;

  // Orchestrator node
  nodes.push({
    id: 'orchestrator',
    type: 'default',
    position: { x: centerX - 80, y: 40 },
    data: { label: `${patternLabels[pattern] || pattern}\nOrquestrador` },
    style: NODE_STYLES.orchestrator,
  });

  // Agent nodes - evenly distributed
  const agentStartX = (totalWidth - (agentCount - 1) * 170) / 2;
  agents.forEach((agent, i) => {
    const nodeId = `agent-${agent.slug}`;
    nodes.push({
      id: nodeId,
      type: 'default',
      position: { x: agentStartX + i * 170, y: 200 },
      data: { label: `${agent.name}\n${agent.role.substring(0, 35)}` },
      style: NODE_STYLES.agent,
    });

    // Edge style varies by pattern
    const isSequential = pattern === 'SEQUENTIAL_PIPELINE';
    if (isSequential && i > 0) {
      edges.push({
        id: `edge-chain-${i}`,
        source: `agent-${agents[i - 1].slug}`,
        target: nodeId,
        style: { stroke: 'hsl(265 80% 60% / 0.4)', strokeWidth: 1.5 },
        animated: true,
      });
    }

    if (!isSequential || i === 0) {
      edges.push({
        id: `edge-orch-${agent.slug}`,
        source: 'orchestrator',
        target: nodeId,
        style: { stroke: 'hsl(190 95% 50% / 0.3)', strokeWidth: 1.5 },
        animated: true,
      });
    }
  });

  // Squad nodes
  const squadStartX = (totalWidth - (squadCount - 1) * 220) / 2;
  squads.forEach((squad, i) => {
    const nodeId = `squad-${squad.slug}`;
    nodes.push({
      id: nodeId,
      type: 'default',
      position: { x: squadStartX + i * 220, y: 380 },
      data: { label: `${squad.name}\n${(squad.agentIds || []).length} agentes` },
      style: NODE_STYLES.squad,
    });

    // Connect squad to its agents
    (squad.agentIds || []).forEach((agentSlug: string) => {
      const agentNodeId = `agent-${agentSlug}`;
      if (agents.find(a => a.slug === agentSlug)) {
        edges.push({
          id: `edge-squad-${squad.slug}-${agentSlug}`,
          source: agentNodeId,
          target: nodeId,
          style: { stroke: 'hsl(150 80% 45% / 0.3)', strokeWidth: 1, strokeDasharray: '5,5' },
        });
      }
    });
  });

  return { nodes, edges };
}

export function ArchitectureDiagram() {
  const { agents, squads, project } = useWizardStore();

  const { nodes: computedNodes, edges: computedEdges } = useMemo(
    () => buildDiagramData(agents, squads, project.orchestrationPattern || 'TASK_FIRST'),
    [agents, squads, project.orchestrationPattern]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(computedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(computedEdges);

  // Sync nodes/edges when agents, squads, or pattern changes
  useEffect(() => {
    setNodes(computedNodes);
    setEdges(computedEdges);
  }, [computedNodes, computedEdges, setNodes, setEdges]);

  if (agents.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Network className="w-7 h-7 text-primary/50" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Diagrama de Arquitetura</p>
          <p className="text-xs text-muted-foreground/60 max-w-xs">
            Quando voce adicionar agentes (etapa 4), o diagrama mostrara a arquitetura
            de orquestracao com as conexoes entre orquestrador, agentes e squads.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 flex gap-3 text-[10px] text-muted-foreground bg-card/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(190,95%,50%)]" /> Orquestrador</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(265,80%,60%)]" /> Agentes</span>
        {squads.length > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(150,80%,45%)]" /> Squads</span>}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
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
      </ReactFlow>
    </div>
  );
}
