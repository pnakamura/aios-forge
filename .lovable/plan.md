

# Validacao de Dependencias Circulares em Workflows

## Analise do Estado Atual

O orchestrator gerado **ja detecta ciclos em runtime** (linhas 1155-1158 de `generate-aios-package.ts`): quando nenhum step tem dependencias satisfeitas mas ainda ha steps pendentes, retorna erro com mensagem `"Dependencias circulares ou ausentes detectadas"`. Isso previne loops infinitos.

**Porem**, a detecao ocorre apenas em runtime — o usuario so descobre o problema ao executar o sistema gerado. Nao ha validacao no wizard durante a criacao/edicao de workflows.

## Correcoes Propostas

### 1. Validacao upfront no WorkflowStore (design-time)

**Arquivo:** `src/stores/workflow-store.ts`

Adicionar funcao `detectCycle(steps)` que faz deteccao de ciclos via DFS antes de aceitar mudancas. Expor metodo `validateWorkflows()` que retorna erros por workflow.

### 2. Feedback visual no WorkflowEditor (design-time)

**Arquivo:** `src/components/wizard/WorkflowEditor.tsx`

Chamar `validateWorkflows()` e exibir alerta quando um workflow tem dependencias circulares, impedindo o usuario de avancar com workflows invalidos.

### 3. Validacao mais robusta no orchestrator gerado (runtime)

**Arquivo:** `src/lib/generate-aios-package.ts`

Adicionar validacao pre-execucao explicita com `detectCycle()` no template do `runWorkflow`, com mensagem de erro detalhada listando os steps que formam o ciclo. O codigo atual ja funciona, mas a mensagem pode ser mais descritiva.

### 4. Validacao no script validate.ts gerado

**Arquivo:** `src/lib/generate-aios-package.ts` (dentro de `generateValidateScript`)

Adicionar check de ciclos nos workflows como parte do `npm run validate`.

## Arquivos Editados

| Arquivo | Mudanca |
|---------|---------|
| `src/stores/workflow-store.ts` | Adicionar `detectCycle()` e `validateWorkflows()` |
| `src/components/wizard/WorkflowEditor.tsx` | Exibir alerta de ciclos detectados |
| `src/lib/generate-aios-package.ts` | Melhorar mensagem de erro + adicionar check no validate.ts |

