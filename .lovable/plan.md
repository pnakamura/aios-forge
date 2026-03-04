

# Analise da Logica de Execucao do Sistema Gerado

## Diagnostico

Apos auditoria completa do motor de geracao (`generate-aios-package.ts`, 2666 linhas), identifiquei **14 problemas** que comprometem o funcionamento do sistema gerado apos instalacao. Estao organizados por severidade.

---

## Problemas Criticos (sistema nao funciona corretamente)

### 1. Orchestrator ignora retry_policy e timeout_ms
O `aios.config.yaml` gera `retry_policy` e `timeout_ms`, mas o `orchestrator.ts` gerado nao os utiliza. Agentes que falham nao sao re-tentados.

**Correcao**: Atualizar `generateOrchestratorEngine()` para ler retry/timeout do config e aplicar logica de retry com backoff + timeout em cada invocacao de agente.

### 2. Agent Runner ignora temperature e max_tokens do YAML
O YAML de cada agente define `temperature: 0.7` e `max_tokens: 4096`, mas `callOpenAI()`, `callAnthropic()` e `callGoogle()` usam valores hardcoded ou nenhum.

**Correcao**: Propagar `temperature` e `max_tokens` do `AgentDefinition` para as chamadas de cada provider.

### 3. Squads nao sao usados no roteamento
`TaskRequest` tem campo `targetSquad`, e o orchestrator carrega squads em `squadMap`, mas nenhum padrao de orquestracao faz roteamento por squad. Squads existem apenas como documentacao.

**Correcao**: Implementar logica no orchestrator que, quando `targetSquad` e informado, filtra os agentes daquele squad. Adicionar comando `/squad <slug> <tarefa>` no main.ts.

### 4. Workflows ignoram depends_on, timeout_ms e retry_policy
O YAML de workflow gera campos `depends_on`, `timeout_ms` e `retry_policy` por step, mas o runtime executa tudo sequencialmente sem respeitar dependencias ou timeouts.

**Correcao**: Implementar execucao baseada em DAG (dependencias), timeout por step e retry com backoff.

### 5. Script `npm run validate` nao existe
FIRST-RUN.md referencia `npm run validate` mas o `package.json` gerado nao tem esse script.

**Correcao**: Adicionar script `validate` que verifica: (a) .env existe, (b) pelo menos 1 API key configurada, (c) aios.config.yaml valido, (d) todos os agents YAML existem.

---

## Problemas de Consistencia (sistema funciona parcialmente)

### 6. Docker nao inclui diretorio `workflows/`
O Dockerfile copia `agents/`, `squads/`, `.aios/`, `docs/` mas nao `workflows/`. Docker Compose tambem nao monta `./workflows`.

**Correcao**: Adicionar `COPY --from=builder /app/workflows ./workflows` no Dockerfile e volume `./workflows:/app/workflows:ro` no docker-compose.

### 7. WorkflowConfig tipo incompleto
No `types.ts` gerado, `WorkflowConfig` tem `steps` mas `loadConfig()` mapeia para `configPath` (que nao existe no tipo).

**Correcao**: Adicionar `configPath?: string` ao `WorkflowConfig` e corrigir `loadConfig()` para tambem carregar steps inline.

### 8. FIRST-RUN.md diz Node.js 18+ mas package.json exige >=20
Inconsistencia na versao minima de Node.js.

**Correcao**: Uniformizar para Node.js 20+ em todo o FIRST-RUN.md.

### 9. FIRST-RUN.md hardcoda "API Key Anthropic"
Independente dos modelos usados, sempre pede Anthropic API Key. Deveria ser dinamico.

**Correcao**: Gerar a tabela "Voce Precisa Prover" e checklist de pre-requisitos baseado nos providers reais dos agentes.

### 10. `frameworkProtection` ausente no aios.config.yaml
A memoria do projeto indica que `npx aios-core doctor` requer `frameworkProtection: true`. Nao e gerado.

**Correcao**: Adicionar secao `framework` no aios.config.yaml com `frameworkProtection: true`.

### 11. Codebase map incompleto
Nao inclui `workflows/`, `src/agents/*.agent.ts`, nem `FIRST-RUN.md`.

**Correcao**: Adicionar essas entradas ao mapa gerado.

### 12. AppMaster nao mapeia workflows
O `AppMaster.agent.ts` gerado lista agentes e squads mas nao workflows.

**Correcao**: Adicionar secao `workflows` ao AppMaster com slug, nome e trigger de cada workflow.

### 13. `.gitignore` exclui arquivos scaffold uteis
Exclui `.aios/memory/*.json` incluindo `decisions.json` e `codebase-map.json` que sao scaffolds iniciais uteis para commit.

**Correcao**: Mudar para ignorar apenas arquivos de runtime (ex: `*.log`), preservar JSON scaffold.

### 14. Orchestrator nao expoe `targetAgent`
`TaskRequest` tem `targetAgent` mas nenhum padrao o utiliza para enviar tarefa diretamente a um agente especifico.

**Correcao**: Adicionar rota direta quando `targetAgent` e especificado, bypass do padrao de orquestracao. Adicionar comando `@<slug> <tarefa>` no main.ts.

---

## Plano de Implementacao

### Arquivos editados: 1
- `src/lib/generate-aios-package.ts` — todas as 14 correcoes sao neste arquivo (templates de geracao)

### Funcoes afetadas:
- `generateOrchestratorEngine()` — retry, timeout, squad routing, targetAgent (items 1, 3, 14)
- `generateAgentRunner()` — temperature, max_tokens (item 2)
- `generateMainEntryPoint()` — comandos `/squad`, `@agent`, `/workflow` melhorados (items 3, 14)
- `generatePackageJson()` — script `validate` (item 5)
- `generateDockerfile()` — workflows dir (item 6)
- `generateDockerCompose()` — workflows volume (item 6)
- `generateTypes()` — WorkflowConfig.configPath (item 7)
- `generateFirstRunMd()` — Node 20+, providers dinamicos (items 8, 9)
- `generateAiosConfig()` — frameworkProtection (item 10)
- `generateCodebaseMap()` — entradas faltantes (item 11)
- `generateAppMasterAgent()` — workflows (item 12)
- `generateGitignore()` — preservar scaffolds (item 13)
- `runWorkflow` dentro de `generateOrchestratorEngine()` — DAG, timeout, retry (item 4)

### Estimativa
Alteracoes concentradas em ~15 funcoes de um unico arquivo. Sem mudancas estruturais — apenas enriquecimento dos templates de geracao.

