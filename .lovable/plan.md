

# Implementar Execucao de Workflows no Pacote Gerado

## Problema

O pacote gerado define workflows no `aios.config.yaml` e gera arquivos YAML em `workflows/`, mas o runtime nunca os carrega nem executa. Tres lacunas no codigo gerado pelo builder.

## Alteracoes em `src/lib/generate-aios-package.ts`

### 1. `loadConfig()` em `generateMainEntryPoint` (linhas 682-696)

Adicionar carregamento de workflows ao objeto retornado por `loadConfig()`:

```typescript
workflows: (yaml.workflows || []).map((w: any) => ({
  slug: w.slug,
  name: w.name,
  trigger: w.trigger,
  configPath: w.config,
})),
```

Tambem no fallback hardcoded, incluir array de workflows gerado a partir do parametro `workflows` da funcao (requer adicionar `workflows: ProjectWorkflow[]` ao parametro da funcao — ja existe no `generateAiosPackage` mas nao e passado).

### 2. `runWorkflow()` em `generateOrchestratorEngine` (linhas 805-922)

Adicionar metodo `runWorkflow` ao orchestrator retornado:

- Recebe `slug` e `task`
- Carrega o YAML do workflow via `configPath` (usando `readFileSync` + `parse`)
- Valida que todos os agentes referenciados nos steps existem no `agentMap`
- Executa steps sequencialmente, passando output do step anterior como `context`
- Log formatado: `[Workflow: <name>] Step N/N: <step-name> → agent: <slug>`
- Retorna `TaskResult` agregado
- Erro se slug nao encontrado: `Workflow '<slug>' nao encontrado`

Atualizar o return object para expor `runWorkflow` junto com `run`.

### 3. CLI `/workflow` em `generateMainEntryPoint` (linhas 749-773)

Adicionar handler no readline loop, antes do bloco `try`:

```
if (trimmed.startsWith('/workflow ')) {
  const parts = trimmed.slice(10).match(/^(\S+)\s+(.+)$/);
  // parse slug e task
  // call orchestrator.runWorkflow(slug, task)
}
```

Tambem no comando `status`, listar workflows configurados.

### 4. Parametro `workflows` na funcao `generateMainEntryPoint` (linha 649)

Adicionar `workflows: ProjectWorkflow[]` como parametro e atualiza-lo na chamada (linha 68).

### 5. Tipos ja estao corretos

`src/types.ts` gerado ja define `WorkflowConfig`, `WorkflowStepConfig` e `AiosConfig.workflows` — nenhuma alteracao necessaria.

## Resumo de impacto

- **Arquivo editado:** `src/lib/generate-aios-package.ts`
- **Funcoes alteradas:** `generateMainEntryPoint`, `generateOrchestratorEngine`, chamada na linha 68
- **Sem novas dependencias**

