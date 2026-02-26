

# Destaque de Elementos do Workflow Selecionado no Diagrama

## Objetivo

Quando o usuario seleciona um (ou mais) workflow(s) no filtro, destacar visualmente apenas os nodes e edges que participam desses workflows. Todos os demais elementos (nodes e edges nao relacionados) ficam transparentes/esmaecidos.

## Abordagem

### 1. Calcular o conjunto de nodes relevantes aos workflows visiveis

A partir dos `filteredWorkflows`, extrair todos os `agentSlug` presentes nos steps e o node `orchestrator` (quando steps sem dependencias existem). Armazenar em um `Set<string>` chamado `highlightedNodeIds`.

- Se nenhum workflow estiver visivel (`filteredWorkflows.length === 0` e `workflows.length > 0`), considerar que o usuario desligou tudo -- nesse caso nenhum destaque e aplicado (tudo normal).
- Se todos os workflows estiverem visiveis (`visibleWorkflowIds.size === workflows.length`), tambem nao aplicar destaque -- tudo normal.
- O destaque so e aplicado quando ha uma **selecao parcial** (pelo menos 1 workflow visivel, mas nao todos).

### 2. Propagar informacao de destaque para nodes via `data`

No `buildDiagramData`, adicionar um campo `dimmed: boolean` no `data` de cada node. Esse campo indica se o node deve ser renderizado com opacidade reduzida.

Alternativamente (e mais simples), aplicar a opacidade via `style` diretamente no array de nodes apos o `buildDiagramData`, no `useEffect` de sincronizacao. Isso evita alterar a funcao de build.

**Abordagem escolhida**: Aplicar `style.opacity` nos nodes e edges no `useEffect` de sync, baseado no `highlightedNodeIds`.

### 3. Aplicar opacidade reduzida em nodes nao-destacados

No `useEffect` que sincroniza `sysNodes` com o estado do React Flow, aplicar:

```text
node.style = { opacity: shouldDim ? 0.2 : 1, transition: 'opacity 0.3s ease' }
```

Nodes que pertencem ao `highlightedNodeIds` mantem opacidade 1. Nodes fora do conjunto recebem opacidade 0.2.

### 4. Aplicar opacidade reduzida em edges nao-relacionados

Edges de workflow (tipo `relationType: 'workflow'`) que estao nos `filteredWorkflows` mantem opacidade 1. Edges de sistema (`sys-orch-*`, `sys-chain-*`, `sys-member-*`) que conectam nodes fora do conjunto ficam esmaecidos. Custom edges tambem.

Logica simplificada: uma edge e destacada se **ambos** source e target estao no `highlightedNodeIds`, OU se e uma edge de workflow visivel.

### 5. Transicao suave

Adicionar `transition: 'opacity 0.3s ease'` no `style` dos nodes e edges para que o efeito de destaque/esmaecimento seja animado.

## Arquivo impactado

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/wizard/ArchitectureDiagram.tsx` | Calcular `highlightedNodeIds` via `useMemo`, aplicar `style.opacity` nos nodes e edges no `useEffect` de sync |

## Detalhes tecnicos

```text
// Calcular nodes destacados
const highlightedNodeIds = useMemo(() => {
  // Sem destaque se todos visiveis ou nenhum workflow existe
  const isPartialSelection = workflows.length > 0
    && filteredWorkflows.length > 0
    && filteredWorkflows.length < workflows.length;
  if (!isPartialSelection) return null; // null = sem destaque

  const ids = new Set<string>();
  for (const wf of filteredWorkflows) {
    for (const step of wf.steps) {
      ids.add(`agent-${step.agentSlug}`);
      if (!step.dependsOn || step.dependsOn.length === 0) {
        ids.add('orchestrator');
      }
    }
  }
  return ids;
}, [workflows, filteredWorkflows]);

// No useEffect de sync de nodes:
setNodes(prev => {
  const posMap = new Map(prev.map(n => [n.id, n.position]));
  return sysNodes.map(sn => {
    const existingPos = posMap.get(sn.id);
    const dimmed = highlightedNodeIds && !highlightedNodeIds.has(sn.id);
    return {
      ...sn,
      position: existingPos || sn.position,
      style: {
        opacity: dimmed ? 0.15 : 1,
        transition: 'opacity 0.3s ease',
      },
    };
  });
});

// No useEffect de sync de edges:
setEdges(() => {
  const allEdges = [...sysEdges, ...customEdgesRef.current];
  if (!highlightedNodeIds) return allEdges;
  return allEdges.map(e => {
    const relevant = highlightedNodeIds.has(e.source) && highlightedNodeIds.has(e.target);
    return {
      ...e,
      style: {
        ...e.style,
        opacity: relevant ? 1 : 0.1,
        transition: 'opacity 0.3s ease',
      },
    };
  });
});
```

A alteracao e isolada a um unico arquivo e nao impacta outros componentes.

