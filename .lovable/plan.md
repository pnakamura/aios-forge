

# Workflows Macro-Level: Definicao e Visualizacao

## Diagnostico Tecnico

### Estado atual
Os workflows estao acoplados exclusivamente a `AiosSquad.workflows[]` (tipo `SquadWorkflow`). A UI no `SquadBuilder.tsx` permite apenas criar workflows e editar nomes - nao ha edicao de steps. O `orchestrator.ts` gerado **ignora completamente os workflows** e roteia tarefas apenas pelo `pattern` hardcoded. Ou seja, workflows sao decorativos - nao influenciam a execucao.

### Problemas identificados
1. **Escopo limitado**: workflows existem apenas dentro de squads, sem visao projeto-nivel
2. **UI incompleta**: sem edicao de steps (agente, condicao, dependencias, taskId)
3. **Desconexao runtime**: o orchestrator gerado nao consome os workflows definidos
4. **Sem auto-geracao**: nenhum workflow e criado automaticamente com base no padrao de orquestracao

---

## Solucao Proposta

### 1. Novos tipos em `src/types/aios.ts`

Adicionar `ProjectWorkflow` como entidade de nivel projeto, separada dos squad workflows:

```text
interface ProjectWorkflow {
  id: string;
  name: string;
  slug: string;
  description: string;
  trigger: 'manual' | 'on_task' | 'scheduled' | 'event';
  steps: WorkflowStep[];
  squadSlug?: string;       // opcional - vinculo a squad especifico
}
```

Estender `WorkflowStep` existente:

```text
interface WorkflowStep {
  id: string;
  name: string;
  agentSlug: string;
  taskId?: string;
  condition?: string;
  dependsOn?: string[];     // IDs de steps predecessores
  timeout_ms?: number;
  retryPolicy?: { maxRetries: number; backoffMs: number };
}
```

Adicionar `workflows: ProjectWorkflow[]` ao `AiosProject`.

### 2. Store: `wizard-store.ts`

Adicionar ao state:
- `workflows: ProjectWorkflow[]`
- Actions: `addWorkflow`, `removeWorkflow`, `updateWorkflow`, `addWorkflowStep`, `removeWorkflowStep`, `updateWorkflowStep`
- `autoGenerateWorkflows()` - gera workflows padrao baseado no `orchestrationPattern` e agentes/squads selecionados

### 3. Auto-geracao por padrao de orquestracao

Funcao `generateDefaultWorkflows(pattern, agents, squads)`:

| Padrao | Workflow gerado |
|--------|----------------|
| SEQUENTIAL_PIPELINE | Um workflow linear: agent1 -> agent2 -> ... -> agentN |
| PARALLEL_SWARM | Um workflow com todos os steps sem dependencias (paralelo) |
| HIERARCHICAL | Workflow master -> squad-leaders -> workers (arvore) |
| WATCHDOG | Workflow workers paralelos -> supervisor review |
| COLLABORATIVE | Workflow com N rounds de iteracao entre agentes |
| TASK_FIRST | Um workflow por squad com steps baseados nas tasks |

Chamada automatica quando o usuario muda o padrao de orquestracao ou avanca para o step de squads.

### 4. Novo componente: `WorkflowEditor.tsx`

Editor visual de workflows com:
- Lista de workflows do projeto (nao apenas de squads)
- Para cada workflow: nome, descricao, trigger type
- Lista de steps arrastavel (reorder) com:
  - Select de agente (de todos os agentes do projeto)
  - Select de task (opcional, das tasks dos squads)
  - Campo condicao (string livre)
  - Multi-select de dependencias (outros steps)
- Botao "Auto-gerar" que chama `autoGenerateWorkflows()`
- Visualizacao em lista e em mini-diagrama (reutilizando ReactFlow simplificado)

### 5. Integracao no Wizard

Duas opcoes de integracao (recomendo a primeira):

**Opcao A - Tab dentro da etapa Squads**: Adicionar aba "Workflows" ao lado de Squads no `WizardPage.tsx`, usando `Tabs` do shadcn. Isso mantem o fluxo linear do wizard sem adicionar um step novo.

**Opcao B - Novo step no wizard**: Adicionar step `workflows` entre `squads` e `integrations`. Requer alterar `WIZARD_STEPS` e `WizardStep` type.

Recomendo **Opcao A** porque workflows dependem de agentes e squads ja definidos, e a visualizacao conjunta facilita a consistencia.

### 6. Atualizacao no `ArchitectureDiagram.tsx`

Renderizar workflows como edges com label no diagrama de arquitetura:
- Steps com `dependsOn` geram edges direcionais entre nodes de agentes
- Workflows sem dependencias (paralelos) mostram edges do orchestrator para todos os agentes

### 7. Atualizacao no gerador de pacotes

**`generate-aios-package.ts`**:
- Novo arquivo gerado: `workflows/<slug>.yaml` para cada ProjectWorkflow
- Atualizar `aios.config.yaml` com secao `workflows:`
- Atualizar `orchestrator.ts` gerado para consumir os workflows definidos em YAML em vez de logica hardcoded
- Atualizar `types.ts` gerado com `WorkflowConfig`

### 8. Persistencia no banco

Adicionar coluna `workflows jsonb default '[]'` na tabela `projects` (ou criar tabela `workflows` separada). Atualizar o `handleSaveProject` no `WizardPage.tsx` para persistir.

---

## Arquivos impactados

| Arquivo | Acao |
|---------|------|
| `src/types/aios.ts` | Adicionar `ProjectWorkflow`, estender `WorkflowStep`, campo em `AiosProject` |
| `src/stores/wizard-store.ts` | State + actions para workflows, auto-geracao |
| `src/components/wizard/WorkflowEditor.tsx` | **Novo** - editor completo de workflows |
| `src/pages/WizardPage.tsx` | Integrar WorkflowEditor como tab na etapa Squads |
| `src/components/wizard/SquadBuilder.tsx` | Remover secao de workflows inline (migra para WorkflowEditor) |
| `src/components/wizard/ArchitectureDiagram.tsx` | Renderizar workflows como edges |
| `src/lib/generate-aios-package.ts` | Gerar `workflows/*.yaml`, atualizar orchestrator |
| `supabase/migrations/` | Coluna `workflows` na tabela `projects` |

