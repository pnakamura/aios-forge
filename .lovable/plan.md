

# Conectores transparentes + Persistencia de Workflows

## Problema 1: Conectores nao ficam transparentes

Atualmente, quando um workflow e selecionado parcialmente, os edges (conectores) que nao pertencem ao workflow sao **removidos completamente** via `.filter()`. O comportamento correto e mante-los visiveis porem **transparentes** (opacidade reduzida), igual ao que ja acontece com os nodes.

### Correcao

No `useEffect` de sincronizacao de edges em `ArchitectureDiagram.tsx` (linha 668), substituir o `.filter()` por `.map()` que aplica opacidade:

```text
// De (atual):
return allEdges.filter(e => highlightedNodeIds.has(e.source) && highlightedNodeIds.has(e.target));

// Para:
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
```

## Problema 2: Workflows nao sao restaurados ao editar projeto

Os workflows sao salvos corretamente no campo JSONB `workflows` da tabela `projects` (linhas 157 e 175 do WizardPage). Porem, ao carregar um projeto para edicao, os workflows salvos **nao sao restaurados** no `workflowStore`.

### Correcao

No `useEffect` de `loadExistingProject` em `WizardPage.tsx` (linha 81-86), apos chamar `store.loadProject()`, restaurar os workflows:

```text
store.loadProject({ projectId: editId, project: pRes.data, agents: aRes.data || [], squads: sRes.data || [] });

// Restaurar workflows salvos no projeto
const savedWorkflows = pRes.data.workflows;
if (Array.isArray(savedWorkflows) && savedWorkflows.length > 0) {
  workflowStore.setWorkflows(savedWorkflows);
}
```

## Arquivos impactados

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/wizard/ArchitectureDiagram.tsx` | Linha 668: trocar `.filter()` por `.map()` com `style.opacity` |
| `src/pages/WizardPage.tsx` | Linha 86: restaurar workflows do DB no `workflowStore` ao carregar projeto |

