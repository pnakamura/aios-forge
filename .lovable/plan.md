

# Correcao: Workflows ausentes no FilePreview

## Problema Identificado

O componente `FilePreview.tsx` (linha 202) chama `generateAiosPackage()` **sem passar o parametro `workflows`**, fazendo com que:
- Os arquivos YAML de workflows nao aparecam na arvore de arquivos
- O `codebase-map.json` nao liste os workflows
- O `AppMaster.agent.ts` nao mapeie workflows
- O `aios.config.yaml` nao inclua a secao de workflows

Enquanto `WizardPage.tsx` passa corretamente `workflows: workflowStore.workflows` em todas as chamadas (linhas 141, 151, 176, 374), o `FilePreview` nao o faz.

## Correcao

### Arquivo: `src/components/wizard/FilePreview.tsx`

1. Importar `useWorkflowStore` do workflow store
2. Na funcao `FilePreview()`, extrair `workflows` do store
3. Passar `workflows` na chamada de `generateAiosPackage` (linha 202)
4. Adicionar `workflowStore.workflows` ao array de dependencias do `useMemo`

### Alteracao especifica:

**Linha 196** — adicionar:
```typescript
const { workflows } = useWorkflowStore();
```

**Linha 202** — alterar de:
```typescript
() => generateAiosPackage({ project, agents, squads, complianceResults }),
[project, agents, squads, complianceResults]
```
para:
```typescript
() => generateAiosPackage({ project, agents, squads, workflows, complianceResults }),
[project, agents, squads, workflows, complianceResults]
```

### Resultado esperado
- Os 3 workflows (incluindo "Pipeline de Teste QA") aparecerao na arvore como `workflows/pipeline-de-teste-qa.yaml`, etc.
- O `codebase-map.json` listara os workflows na secao `structure.workflows`
- O `AppMaster.agent.ts` mapeara os workflows
- O contador de arquivos (atualmente 44 no FilePreview vs 47 no WizardPage) ficara consistente

