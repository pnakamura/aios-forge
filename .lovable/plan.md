

# Renderizar Workflows como Edges no Diagrama de Arquitetura

## Objetivo

Adicionar edges direcionais ao diagrama de arquitetura (`ArchitectureDiagram.tsx`) que representem visualmente o fluxo de execucao definido nos workflows do projeto. Cada step com `dependsOn` gera edges entre os nodes dos agentes correspondentes.

## Abordagem

### 1. Novo tipo de relacao para workflows

Adicionar entrada `workflow` ao objeto `RELATIONS` com estilo visual distinto (cor laranja/coral, animado, tracejado diferenciado) para diferenciar edges de workflow das relacoes manuais existentes (orquestra, delega, membro, etc.).

### 2. Importar workflow store no diagrama

O componente `ArchitectureDiagram` passara a consumir `useWorkflowStore` para acessar os workflows do projeto.

### 3. Alterar `buildDiagramData` para aceitar workflows

A funcao `buildDiagramData` recebera um parametro adicional `workflows: ProjectWorkflow[]` e gerara edges adicionais:

- Para cada workflow, iterar sobre seus steps
- Para cada step com `dependsOn` nao vazio, encontrar o step predecessor pelo ID
- Mapear `step.agentSlug` para o node `agent-<slug>` correspondente
- Criar edge direcional do agente predecessor para o agente do step atual, com tipo `relation` e `relationType: 'workflow'`
- Steps sem dependencias (paralelos) receberao edge do orchestrator para o agente
- Label do edge mostrara o nome do workflow (abreviado se necessario)
- Deduplicar edges entre o mesmo par de agentes (evitar sobreposicao)

### 4. Logica de deduplicacao

Como multiplos steps podem conectar os mesmos agentes, usar um Set de `source-target` para evitar edges duplicados. Quando houver duplicatas, o label acumulara os nomes.

## Arquivos impactados

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/wizard/ArchitectureDiagram.tsx` | Importar `useWorkflowStore`, adicionar relacao `workflow` ao `RELATIONS`, estender `buildDiagramData` com parametro workflows, gerar edges de workflow no diagrama |

## Detalhes tecnicos

```text
// Nova entrada em RELATIONS
workflow: {
  label: 'Workflow',
  dark: 'hsl(25 95% 60%)',
  light: 'hsl(25 80% 38%)',
  dash: '8 4',
  animated: true
}

// Pseudo-logica em buildDiagramData
for (workflow of workflows) {
  // Map stepId -> agentSlug
  const stepMap = new Map(workflow.steps.map(s => [s.id, s.agentSlug]));
  const seen = new Set<string>();

  for (step of workflow.steps) {
    if (step.dependsOn?.length) {
      for (depId of step.dependsOn) {
        const srcSlug = stepMap.get(depId);
        if (!srcSlug) continue;
        const key = `agent-${srcSlug}->agent-${step.agentSlug}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({
          id: `wf-${workflow.slug}-${step.id}-${depId}`,
          source: `agent-${srcSlug}`,
          target: `agent-${step.agentSlug}`,
          sourceHandle: 'right', targetHandle: 'left',
          type: 'relation',
          data: { relationType: 'workflow', customLabel: workflow.name },
        });
      }
    }
  }
}
```

A alteracao e isolada a um unico arquivo, sem impacto em outros componentes.
