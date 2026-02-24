import { useWizardStore } from '@/stores/wizard-store';
import { useMemo, useCallback } from 'react';
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

function buildDiagramData(agents: any[], squads: any[], pattern: string) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Orchestrator node
  nodes.push({
    id: 'orchestrator',
    type: 'default',
    position: { x: 400, y: 50 },
    data: { label: `🎯 Orquestrador\n${pattern.replace(/_/g, ' ')}` },
    style: {
      background: 'hsl(190 95% 50% / 0.15)',
      border: '2px solid hsl(190 95% 50% / 0.5)',
      borderRadius: '12px',
      padding: '12px 20px',
      color: 'hsl(190 95% 70%)',
      fontSize: '12px',
      fontWeight: '600',
      textAlign: 'center' as const,
      whiteSpace: 'pre-line' as const,
    },
  });

  // Agent nodes
  const agentStartX = 50;
  const agentY = 220;
  const agentSpacing = 160;

  agents.forEach((agent, i) => {
    const nodeId = `agent-${agent.slug}`;
    nodes.push({
      id: nodeId,
      type: 'default',
      position: { x: agentStartX + i * agentSpacing, y: agentY },
      data: { label: `🤖 ${agent.name}\n${agent.role.substring(0, 30)}` },
      style: {
        background: 'hsl(265 80% 60% / 0.1)',
        border: '1.5px solid hsl(265 80% 60% / 0.4)',
        borderRadius: '10px',
        padding: '10px 14px',
        color: 'hsl(265 80% 80%)',
        fontSize: '11px',
        textAlign: 'center' as const,
        whiteSpace: 'pre-line' as const,
        minWidth: '130px',
      },
    });

    edges.push({
      id: `edge-orch-${agent.slug}`,
      source: 'orchestrator',
      target: nodeId,
      style: { stroke: 'hsl(190 95% 50% / 0.3)', strokeWidth: 1.5 },
      animated: true,
    });
  });

  // Squad nodes
  squads.forEach((squad, i) => {
    const nodeId = `squad-${squad.slug}`;
    nodes.push({
      id: nodeId,
      type: 'default',
      position: { x: 50 + i * 220, y: 400 },
      data: { label: `👥 ${squad.name}\n${(squad.agentIds || []).length} agentes` },
      style: {
        background: 'hsl(150 80% 45% / 0.1)',
        border: '1.5px solid hsl(150 80% 45% / 0.4)',
        borderRadius: '10px',
        padding: '10px 14px',
        color: 'hsl(150 80% 70%)',
        fontSize: '11px',
        textAlign: 'center' as const,
        whiteSpace: 'pre-line' as const,
        minWidth: '140px',
      },
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

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildDiagramData(agents, squads, project.orchestrationPattern || 'TASK_FIRST'),
    [agents, squads, project.orchestrationPattern]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  if (agents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        Adicione agentes para visualizar o diagrama
      </div>
    );
  }

  return (
    <div className="h-full w-full">
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
