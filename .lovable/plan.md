

# Adicionar Tools e Skills Padrao aos Agentes Nativos

## Resumo

Expandir a interface `NativeAgent` com campos `defaultTools` e `defaultSkills`, preencher cada um dos 11 agentes nativos com ferramentas e habilidades coerentes ao seu papel, e atualizar o `AgentCatalog` para usa-los ao adicionar um agente.

## Mudancas

### 1. Expandir a interface `NativeAgent`

**Arquivo:** `src/types/aios.ts`

Adicionar dois campos opcionais ao `NativeAgent`:

```text
defaultTools: string[]
defaultSkills: string[]
```

### 2. Preencher tools e skills em cada agente nativo

**Arquivo:** `src/data/native-agents.ts`

Cada agente recebera ferramentas e habilidades contextuais ao seu papel:

| Agente | Tools | Skills |
|--------|-------|--------|
| AIOS Master | agent-registry, task-dispatcher, status-dashboard, config-loader | coordenacao-multi-agente, resolucao-de-conflitos, planejamento-estrategico, priorizacao-dinamica |
| AIOS Orchestrator | queue-manager, event-bus, retry-engine, health-checker | roteamento-inteligente, balanceamento-de-carga, monitoramento-em-tempo-real, recuperacao-de-falhas |
| Analyst | document-parser, data-extractor, interview-recorder, requirement-tracker | elicitacao-de-requisitos, analise-de-dominio, mapeamento-de-stakeholders, modelagem-de-processos |
| Product Manager | backlog-manager, story-mapper, roadmap-builder, metrics-tracker | priorizacao-por-valor, escrita-de-user-stories, gestao-de-roadmap, analise-de-metricas |
| Architect | diagram-generator, tech-radar, dependency-analyzer, adr-writer | design-de-sistemas, avaliacao-de-trade-offs, definicao-de-padroes, documentacao-tecnica |
| UX Expert | wireframe-tool, prototype-builder, heatmap-analyzer, accessibility-checker | design-de-interfaces, pesquisa-com-usuarios, avaliacao-heuristica, design-responsivo |
| Scrum Master | sprint-board, velocity-tracker, burndown-chart, retrospective-tool | facilitacao-agil, remocao-de-impedimentos, coaching-de-time, melhoria-continua |
| Developer | code-editor, linter, test-runner, git-client | implementacao-limpa, refatoracao, code-review, integracao-de-apis |
| QA Engineer | test-framework, bug-tracker, coverage-analyzer, load-tester | planejamento-de-testes, automacao-de-testes, teste-de-regressao, validacao-de-criterios |
| Product Owner | acceptance-tracker, value-calculator, feedback-collector, demo-recorder | definicao-de-visao, validacao-de-entregas, priorizacao-de-negocios, gestao-de-feedback |
| DevOps Engineer | ci-cd-runner, container-manager, infra-provisioner, log-aggregator | automacao-de-deploy, infraestrutura-como-codigo, monitoramento-de-producao, gestao-de-containers |

### 3. Usar defaultTools e defaultSkills no AgentCatalog

**Arquivo:** `src/components/wizard/AgentCatalog.tsx`

Na funcao `handleAddNative`, trocar os arrays vazios pelos valores do agente nativo:

```text
tools: native.defaultTools || [],
skills: native.defaultSkills || [],
```

## Arquivos impactados

| Arquivo | Acao |
|---------|------|
| `src/types/aios.ts` | Adicionar `defaultTools` e `defaultSkills` a `NativeAgent` |
| `src/data/native-agents.ts` | Preencher tools e skills para os 11 agentes |
| `src/components/wizard/AgentCatalog.tsx` | Usar `defaultTools`/`defaultSkills` ao adicionar agente |

## Detalhes tecnicos

- Os campos sao `string[]` consistentes com `AiosAgent.tools` e `AiosAgent.skills`
- Nomes de tools usam kebab-case (ex: `queue-manager`) para consistencia com o padrao de slugs do AIOS
- Nomes de skills usam kebab-case com descricao funcional (ex: `coordenacao-multi-agente`)
- Os arquivos gerados (.md, .yaml, .agent.ts) ja leem `tools` e `skills` do `AiosAgent` — nenhuma alteracao necessaria nos geradores
- Nenhuma dependencia nova

