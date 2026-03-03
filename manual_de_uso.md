# AIOS Forge — Manual de Uso

> **Versão**: 4.2.13 · **Gerado em**: 2026-03-03
> **Padrão de referência**: Synkra AIOS Agent Standard (`@aios-master`)

---

## Sumário

1. [Arquitetura e Visão Geral do Sistema](#1-arquitetura-e-visão-geral-do-sistema)
2. [Ecossistema de Agentes e Squads](#2-ecossistema-de-agentes-e-squads)
3. [Guia de Funcionalidades e Comandos](#3-guia-de-funcionalidades-e-comandos)
4. [Exemplos de Uso Baseados no Contexto](#4-exemplos-de-uso-baseados-no-contexto)
5. [Guia de Resolução de Problemas e Limites](#5-guia-de-resolução-de-problemas-e-limites)

---

## 1. Arquitetura e Visão Geral do Sistema

### 1.1 O que é o AIOS Forge

O **AIOS Forge** é um builder web para configurar, orquestrar e gerar pacotes instaláveis de sistemas multi-agente baseados no padrão **Synkra AIOS v4.2.13**. Ele transforma configurações visuais — agentes, squads, workflows e integrações — em um projeto Node.js/TypeScript completo, pronto para download (ZIP) ou persistência no banco de dados.

### 1.2 Stack Tecnológico

| Camada | Tecnologia | Uso |
|--------|-----------|-----|
| **Frontend** | React 18 + TypeScript + Vite 5 | SPA com hot-reload |
| **UI** | Tailwind CSS + shadcn/ui (Radix) + Framer Motion | Componentes e animações |
| **Estado Global** | Zustand (`useWizardStore`) | Estado do wizard e projeto |
| **Backend** | Lovable Cloud (PostgreSQL + Auth + Edge Functions) | Persistência e lógica server-side |
| **Diagrama** | React Flow (`@xyflow/react`) | Diagrama de arquitetura interativo |
| **Export** | JSZip | Download do pacote gerado como ZIP |
| **Markdown** | react-markdown | Renderização de conteúdo markdown no chat |

### 1.3 Camada de Agentes Internos (`src/agents/`)

O AIOS Forge possui 4 **agentes internos** que governam a própria aplicação web. Cada um segue o schema `agent-v3` do padrão AIOS:

| Agente | Arquivo | Persona | Commands |
|--------|---------|---------|----------|
| **AuthAgent** | `src/agents/Auth.agent.ts` | Gerenciador de autenticação e sessão | `login`, `signup`, `logout`, `checkSession` |
| **DashboardAgent** | `src/agents/Dashboard.agent.ts` | Gerenciador da listagem e navegação de projetos | `listProjects`, `openProject`, `editProject`, `deleteProject` |
| **WizardAgent** | `src/agents/Wizard.agent.ts` | Orquestrador do fluxo de criação via wizard | `navigate`, `configureProject`, `addAgent`, `addSquad`, `generate`, `save` |
| **PackageGenerationAgent** | `src/agents/PackageGeneration.agent.ts` | Engine de geração do pacote instalável | `generate`, `downloadZip`, `reviewCompliance`, `previewFiles` |

### 1.4 Camada de Serviços (`src/services/`)

| Serviço | Arquivo | Funções Exportadas |
|---------|---------|-------------------|
| **AuthService** | `auth.service.ts` | `signIn()`, `signUp()`, `signOut()`, `getSession()`, `getUser()` |
| **ProjectService** | `project.service.ts` | `listProjects()`, `getProject()`, `getProjectWithChildren()`, `loadProjectForEditing()`, `deleteProject()`, `saveProject()`, `downloadProjectZip()` |
| **ComplianceService** | `compliance.service.ts` | `runReview()` |

### 1.5 Capacidades Core

- **Geração de Pacotes Instaláveis**: A função `generateAiosPackage()` (`src/lib/generate-aios-package.ts`) produz ~30 arquivos que formam um projeto Node.js/TypeScript funcional
- **Revisão de Conformidade**: Edge function `aios-compliance-review` valida arquivos gerados contra regras do padrão AIOS v4.2.13
- **Chat Assistido**: Edge function `aios-chat` fornece assistência conversacional na etapa de descoberta do wizard
- **Persistência**: Tabelas `projects`, `agents`, `squads`, `generated_files`, `integrations` e `wizard_sessions` no banco de dados
- **Download ZIP**: Via `downloadProjectZip()` usando JSZip, empacota todos os arquivos gerados
- **Diagrama Interativo**: React Flow com drag-and-drop de agentes para squads, criação visual de conexões
- **Self-Improvement Engine**: Sistema de feedback e evolução contínua em `src/lib/self-improve/`

### 1.6 Banco de Dados — Tabelas

| Tabela | Finalidade |
|--------|-----------|
| `projects` | Projetos AIOS do usuário (nome, domínio, padrão de orquestração, workflows) |
| `agents` | Agentes salvos por projeto (slug, role, tools, skills, commands) |
| `squads` | Squads por projeto (agentIds, tasks, workflows, manifest YAML) |
| `generated_files` | Arquivos gerados (path, content, compliance_status) |
| `integrations` | Integrações configuradas (N8N, Claude API, MCP Server, Notion, Miro, OpenAI API) |
| `wizard_sessions` | Sessões do wizard (messages, wizard_state, current_step) |

---

## 2. Ecossistema de Agentes e Squads

### 2.1 Catálogo de Agentes Nativos

Definidos em `src/data/native-agents.ts` como `NATIVE_AGENTS`. Cada agente tem **8 tools** e **10 skills** (thresholds do `aios-core doctor`).

#### 2.1.1 Agentes Meta

##### AIOS Master (`aios-master`)

- **Role**: Orquestrador principal do sistema AIOS
- **Model**: `gemini-2.0-flash`
- **Commands**: `*orchestrate`, `*delegate`, `*status`, `*plan`
- **Compatible Patterns**: Todos (6/6)

| Tools | Skills |
|-------|--------|
| `agent-registry` | `coordenacao-multi-agente` |
| `task-dispatcher` | `resolucao-de-conflitos` |
| `status-dashboard` | `planejamento-estrategico` |
| `config-loader` | `priorizacao-dinamica` |
| `dependency-graph` | `delegacao-contextual` |
| `escalation-engine` | `gestao-de-dependencias` |
| `resource-allocator` | `escalonamento-automatico` |
| `decision-logger` | `analise-de-gargalos` |
| | `alocacao-de-recursos` |
| | `tomada-de-decisao-autonoma` |

> **System Prompt**: "Você é o AIOS Master, o orquestrador principal do sistema. Sua responsabilidade é coordenar todos os agentes, delegar tarefas e garantir que o projeto avance de forma eficiente."

##### AIOS Orchestrator (`aios-orchestrator`)

- **Role**: Motor de execução e roteamento de tarefas
- **Model**: `gemini-2.0-flash`
- **Commands**: `*route`, `*queue`, `*monitor`, `*retry`
- **Compatible Patterns**: Todos (6/6)

| Tools | Skills |
|-------|--------|
| `queue-manager` | `roteamento-inteligente` |
| `event-bus` | `balanceamento-de-carga` |
| `retry-engine` | `monitoramento-em-tempo-real` |
| `health-checker` | `recuperacao-de-falhas` |
| `deadlock-detector` | `deteccao-de-deadlock` |
| `timeout-manager` | `orquestracao-de-eventos` |
| `circuit-breaker` | `gestao-de-timeout` |
| `trace-collector` | `paralelizacao-de-tarefas` |
| | `circuit-breaking` |
| | `observabilidade-distribuida` |

#### 2.1.2 Agentes de Planejamento

##### Analyst (`analyst`)

- **Role**: Analista de negócios e requisitos
- **Commands**: `*analyze`, `*requirements`, `*stakeholders`, `*specs`
- **Compatible Patterns**: `SEQUENTIAL_PIPELINE`, `HIERARCHICAL`, `TASK_FIRST`

| Tools | Skills |
|-------|--------|
| `document-parser` | `elicitacao-de-requisitos` |
| `data-extractor` | `analise-de-dominio` |
| `interview-recorder` | `mapeamento-de-stakeholders` |
| `requirement-tracker` | `modelagem-de-processos` |
| `gap-analyzer` | `analise-de-gaps` |
| `benchmark-tool` | `benchmarking` |
| `journey-mapper` | `mapeamento-de-jornada` |
| `swot-generator` | `analise-swot` |
| | `documentacao-de-requisitos` |
| | `prototipacao-rapida` |

##### Product Manager (`pm`)

- **Role**: Gerente de produto e priorização
- **Commands**: `*backlog`, `*prioritize`, `*story`, `*roadmap`
- **Compatible Patterns**: `SEQUENTIAL_PIPELINE`, `HIERARCHICAL`, `COLLABORATIVE`, `TASK_FIRST`

| Tools | Skills |
|-------|--------|
| `backlog-manager` | `priorizacao-por-valor` |
| `story-mapper` | `escrita-de-user-stories` |
| `roadmap-builder` | `gestao-de-roadmap` |
| `metrics-tracker` | `analise-de-metricas` |
| `release-planner` | `analise-de-impacto` |
| `okr-tracker` | `gestao-de-releases` |
| `competitor-analyzer` | `comunicacao-com-stakeholders` |
| `risk-matrix` | `definicao-de-okrs` |
| | `analise-competitiva` |
| | `gestao-de-riscos` |

##### Architect (`architect`)

- **Role**: Arquiteto de software e soluções
- **Commands**: `*architecture`, `*patterns`, `*stack`, `*components`
- **Compatible Patterns**: `SEQUENTIAL_PIPELINE`, `HIERARCHICAL`, `COLLABORATIVE`, `TASK_FIRST`

| Tools | Skills |
|-------|--------|
| `diagram-generator` | `design-de-sistemas` |
| `tech-radar` | `avaliacao-de-trade-offs` |
| `dependency-analyzer` | `definicao-de-padroes` |
| `adr-writer` | `documentacao-tecnica` |
| `c4-modeler` | `modelagem-c4` |
| `api-designer` | `analise-de-escalabilidade` |
| `security-scanner` | `design-de-apis` |
| `debt-tracker` | `avaliacao-de-seguranca` |
| | `gestao-de-debito-tecnico` |
| | `prova-de-conceito` |

##### UX Expert (`ux-expert`)

- **Role**: Especialista em experiência do usuário
- **Commands**: `*wireframe`, `*flow`, `*usability`, `*prototype`
- **Compatible Patterns**: `SEQUENTIAL_PIPELINE`, `COLLABORATIVE`, `TASK_FIRST`

| Tools | Skills |
|-------|--------|
| `wireframe-tool` | `design-de-interfaces` |
| `prototype-builder` | `pesquisa-com-usuarios` |
| `heatmap-analyzer` | `avaliacao-heuristica` |
| `accessibility-checker` | `design-responsivo` |
| `design-system-manager` | `design-system-management` |
| `usability-tester` | `teste-de-usabilidade` |
| `ia-mapper` | `analise-de-acessibilidade` |
| `token-generator` | `design-de-microinteracoes` |
| | `information-architecture` |
| | `design-tokens` |

##### Scrum Master (`sm`)

- **Role**: Facilitador ágil e gestor de cerimônias
- **Commands**: `*sprint`, `*standup`, `*retro`, `*impediment`
- **Compatible Patterns**: `HIERARCHICAL`, `COLLABORATIVE`, `TASK_FIRST`

| Tools | Skills |
|-------|--------|
| `sprint-board` | `facilitacao-agil` |
| `velocity-tracker` | `remocao-de-impedimentos` |
| `burndown-chart` | `coaching-de-time` |
| `retrospective-tool` | `melhoria-continua` |
| `capacity-planner` | `gestao-de-conflitos` |
| `conflict-resolver` | `metricas-ageis` |
| `dod-tracker` | `planejamento-de-capacidade` |
| `workshop-board` | `gestao-de-dependencias-entre-times` |
| | `workshop-facilitation` |
| | `definition-of-done` |

##### Product Owner (`po`)

- **Role**: Dono do produto e decisor de negócio
- **Commands**: `*vision`, `*prioritize`, `*accept`, `*reject`
- **Compatible Patterns**: `HIERARCHICAL`, `COLLABORATIVE`, `TASK_FIRST`

| Tools | Skills |
|-------|--------|
| `acceptance-tracker` | `definicao-de-visao` |
| `value-calculator` | `validacao-de-entregas` |
| `feedback-collector` | `priorizacao-de-negocios` |
| `demo-recorder` | `gestao-de-feedback` |
| `roi-calculator` | `analise-de-roi` |
| `mvp-tracker` | `gestao-de-mvp` |
| `churn-analyzer` | `customer-discovery` |
| `pmf-scorer` | `analise-de-churn` |
| | `product-market-fit` |
| | `gestao-de-backlog-estrategico` |

#### 2.1.3 Agentes de Desenvolvimento

##### Developer (`dev`)

- **Role**: Desenvolvedor de software
- **Commands**: `*code`, `*implement`, `*refactor`, `*review`
- **Compatible Patterns**: `SEQUENTIAL_PIPELINE`, `PARALLEL_SWARM`, `HIERARCHICAL`, `COLLABORATIVE`, `TASK_FIRST`

| Tools | Skills |
|-------|--------|
| `code-editor` | `implementacao-limpa` |
| `linter` | `refatoracao` |
| `test-runner` | `code-review` |
| `git-client` | `integracao-de-apis` |
| `profiler` | `tdd-driven-development` |
| `dependency-manager` | `design-patterns` |
| `doc-generator` | `otimizacao-de-performance` |
| `debugger` | `gestao-de-dependencias` |
| | `documentacao-de-codigo` |
| | `debugging-avancado` |

##### QA Engineer (`qa`)

- **Role**: Engenheiro de qualidade e testes
- **Commands**: `*test`, `*bug`, `*validate`, `*regression`
- **Compatible Patterns**: `SEQUENTIAL_PIPELINE`, `PARALLEL_SWARM`, `TASK_FIRST`

| Tools | Skills |
|-------|--------|
| `test-framework` | `planejamento-de-testes` |
| `bug-tracker` | `automacao-de-testes` |
| `coverage-analyzer` | `teste-de-regressao` |
| `load-tester` | `validacao-de-criterios` |
| `security-tester` | `teste-de-seguranca` |
| `performance-tester` | `teste-de-performance` |
| `a11y-tester` | `teste-de-acessibilidade` |
| `mutation-analyzer` | `gestao-de-dados-de-teste` |
| | `teste-exploatorio` |
| | `analise-de-mutacao` |

#### 2.1.4 Agentes de Infraestrutura

##### DevOps Engineer (`devops`)

- **Role**: Engenheiro de infraestrutura e CI/CD
- **Commands**: `*deploy`, `*pipeline`, `*infra`, `*monitor`
- **Compatible Patterns**: `SEQUENTIAL_PIPELINE`, `PARALLEL_SWARM`, `HIERARCHICAL`, `TASK_FIRST`

| Tools | Skills |
|-------|--------|
| `ci-cd-runner` | `automacao-de-deploy` |
| `container-manager` | `infraestrutura-como-codigo` |
| `infra-provisioner` | `monitoramento-de-producao` |
| `log-aggregator` | `gestao-de-containers` |
| `secret-manager` | `gestao-de-segredos` |
| `observability-platform` | `observabilidade-full-stack` |
| `dr-planner` | `disaster-recovery` |
| `cost-analyzer` | `capacity-planning` |
| | `security-hardening` |
| | `cost-optimization` |

---

### 2.2 Padrões de Orquestração

Definidos em `src/data/orchestration-patterns.ts` como `ORCHESTRATION_PATTERNS`. Selecionados na etapa `project_config` do wizard.

| ID | Nome | Descrição | Agentes Sugeridos |
|----|------|-----------|-------------------|
| `SEQUENTIAL_PIPELINE` | Pipeline Sequencial | Agentes executam em cadeia, cada um processando a saída do anterior | `analyst`, `architect`, `dev`, `qa`, `devops` |
| `PARALLEL_SWARM` | Enxame Paralelo | Múltiplos agentes trabalham simultaneamente em tarefas independentes | `aios-orchestrator`, `dev`, `qa`, `devops` |
| `HIERARCHICAL` | Hierárquico | Estrutura de comando em árvore com Master delegando para líderes de squad | `aios-master`, `pm`, `sm`, `dev`, `qa`, `po` |
| `WATCHDOG` | Watchdog | Agente supervisor monitora e valida a saída de outros continuamente | `aios-master`, `qa`, `architect` |
| `COLLABORATIVE` | Colaborativo | Agentes trabalham juntos em espaço compartilhado com troca livre de informações | `analyst`, `ux-expert`, `pm`, `architect`, `po` |
| `TASK_FIRST` | Task-First | Tarefas são a unidade central; agentes são assignados dinamicamente | `aios-orchestrator`, `sm`, `dev`, `qa`, `devops` |

### 2.3 Squads — Orquestração de Agentes

O componente **SquadBuilder** (`src/components/wizard/SquadBuilder.tsx`) organiza agentes em equipes de trabalho. Cada squad (`AiosSquad`) possui:

```typescript
interface AiosSquad {
  name: string;          // Nome do squad
  slug: string;          // Identificador único
  description: string;   // Propósito
  agentIds: string[];    // Slugs dos agentes membros
  tasks: SquadTask[];    // Tarefas atribuídas
  workflows: SquadWorkflow[];  // Fluxos de trabalho internos
  isValidated: boolean;  // Passou no compliance
}
```

**Fluxo de colaboração multi-agente (exemplo: Pipeline Sequencial)**:

```
Analyst → Architect → Developer → QA → DevOps
  │           │           │         │       │
  └─ specs    └─ ADRs     └─ code   └─ tests └─ deploy
```

O **ArchitectureDiagram** (`src/components/wizard/ArchitectureDiagram.tsx`) visualiza esta estrutura em 3 tiers com React Flow:
- **Tier 1**: Nó do Orquestrador (padrão selecionado)
- **Tier 2**: Nós dos Agentes (arrastar connector → squad para atribuir)
- **Tier 3**: Nós dos Squads

Interações no diagrama:
- Arrastar conector de agente para squad = `updateSquad()` no store
- Selecionar nó + Delete = remover agente/squad
- Selecionar aresta + Delete = desvincular agente do squad

---

## 3. Guia de Funcionalidades e Comandos

### 3.1 Wizard — 8 Etapas

Definidas em `WIZARD_STEPS` (`src/types/aios.ts`):

| # | Key | Label | Descrição |
|---|-----|-------|-----------|
| 1 | `welcome` | Descoberta | Chat com IA para descrever o projeto (edge function `aios-chat`) |
| 2 | `project_config` | Projeto | Formulário: nome, descrição, domínio, padrão de orquestração |
| 3 | `agents` | Agentes | Catálogo de 11 agentes nativos + criação de agentes customizados |
| 4 | `squads` | Squads | Builder para agrupar agentes em equipes com tasks e workflows |
| 5 | `integrations` | Integrações | APIs de LLM auto-detectadas + serviços externos (N8N, Notion, Miro, MCP) |
| 6 | `review` | Revisão | Resumo do projeto + validação de conformidade AIOS via `runReview()` |
| 7 | `generation` | Geração | Geração dos arquivos + salvar no banco ou download ZIP |
| 8 | `post_creation` | First-Run | Checklist de pós-instalação (`FIRSTRUN_ITEMS`) |

### 3.2 Estado Global — `useWizardStore`

Arquivo: `src/stores/wizard-store.ts`. Store Zustand com os seguintes commands:

| Command | Assinatura | Descrição |
|---------|-----------|-----------|
| `setStep` | `(step: WizardStep) => void` | Navegar para uma etapa específica |
| `nextStep` | `() => void` | Avançar para próxima etapa (com validação via `canProceed()`) |
| `prevStep` | `() => void` | Voltar para etapa anterior |
| `updateProject` | `(data: Partial<AiosProject>) => void` | Atualizar dados do projeto |
| `addAgent` | `(agent: AiosAgent) => void` | Adicionar agente (substitui se mesmo slug) |
| `removeAgent` | `(slug: string) => void` | Remover agente e desvincular de squads |
| `updateAgent` | `(slug: string, data: Partial<AiosAgent>) => void` | Atualizar agente existente |
| `addAgent_batch` | `(agents: AiosAgent[]) => void` | Adicionar múltiplos agentes de uma vez |
| `addSquad` | `(squad: AiosSquad) => void` | Adicionar squad |
| `removeSquad` | `(slug: string) => void` | Remover squad |
| `updateSquad` | `(slug: string, data: Partial<AiosSquad>) => void` | Atualizar squad |
| `loadProject` | `(data: { projectId, project, agents, squads }) => void` | Carregar projeto salvo para edição |
| `reset` | `() => void` | Resetar estado para valores iniciais |

**Validação por etapa** (`canProceed()`):
- `project_config`: exige `project.name` preenchido
- `agents`: exige pelo menos 1 agente adicionado
- Demais etapas: sem bloqueio

### 3.3 Geração de Pacote — `generateAiosPackage()`

Arquivo: `src/lib/generate-aios-package.ts`

Recebe um `GenerationInput` e retorna um array de `GeneratedFile[]`. Cada arquivo gerado possui `path`, `content`, `type` e `complianceStatus`.

**Arquivos gerados (~30+)**:

```
📁 Pacote Gerado
├── aios.config.yaml              ← Configuração central
├── package.json                  ← Dependências Node.js
├── tsconfig.json                 ← Configuração TypeScript
├── .env.example                  ← Variáveis de ambiente
├── .gitignore
├── Dockerfile                    ← Containerização
├── docker-compose.yaml
├── src/
│   ├── main.ts                   ← Entry point do runtime
│   ├── orchestrator.ts           ← Engine de orquestração
│   ├── agent-runner.ts           ← Executor de agentes
│   ├── logger.ts                 ← Sistema de logging
│   ├── types.ts                  ← Tipos TypeScript
│   ├── env-validator.ts          ← Validação de .env
│   └── agents/
│       ├── AppMaster.agent.ts    ← Orquestrador do app
│       └── [Agent].agent.ts      ← Um arquivo por agente
├── agents/
│   ├── [agent-slug].yaml         ← Config YAML por agente
│   └── [agent-slug].md           ← Definição markdown por agente
├── squads/
│   └── [squad-slug]/
│       ├── squad.yaml            ← Manifesto do squad
│       └── README.md             ← Documentação do squad
├── workflows/
│   └── [workflow-slug].yaml      ← Definição de workflow
├── docs/
│   ├── README.md                 ← Documentação principal
│   ├── INSTALLATION.md           ← Manual de instalação
│   ├── SETUP.md                  ← Guia de setup
│   └── ARCHITECTURE.md           ← Documentação de arquitetura
├── scripts/
│   └── setup.sh                  ← Script de setup
├── stories/
│   └── TEMPLATE.story.md         ← Template story-driven
├── .aios/
│   ├── project-status.md         ← Status do projeto
│   ├── decisions.json            ← Registro de decisões
│   └── codebase-map.md           ← Mapa do codebase
└── FIRST-RUN.md                  ← Checklist pós-instalação
```

**Sub-geradores principais**:
- `generateAiosConfig()` — `aios.config.yaml` com `frameworkProtection: true` implícito
- `generateAgentMd()` — Definição markdown do agente com persona, commands, tools, skills, dependencies
- `generateAgentTs()` — Arquivo TypeScript `.agent.ts` com header `@agent` completo
- `generateAgentConfig()` — YAML de configuração do agente
- `generateAppMasterAgent()` — Orquestrador principal que mapeia todos os squads
- `generateSquadYaml()` / `generateSquadReadme()` — Manifesto e documentação por squad
- `generateWorkflowYaml()` — Definição de workflow com steps, triggers e retry policies
- `generateOrchestratorEngine()` — Engine de orquestração baseado no padrão selecionado
- `generateMainEntryPoint()` — `src/main.ts` com bootstrap do runtime
- `generateClaudeMd()` — Arquivo `CLAUDE.md` para integração com Claude Code/Cursor
- `generateFirstRunMd()` — Checklist de first-run baseado em `FIRSTRUN_ITEMS`

### 3.4 Compliance Review — `runReview()`

Arquivo: `src/services/compliance.service.ts`

A função `runReview(files: GeneratedFile[])` envia arquivos relevantes para a edge function `aios-compliance-review` e retorna um `Record<string, ComplianceResult>`:

```typescript
interface ComplianceResult {
  status: string;         // 'passed' | 'warning' | 'failed'
  notes: string;          // Descrição do resultado
  violations?: ComplianceViolation[];
}

interface ComplianceViolation {
  rule: string;           // Regra violada
  severity: string;       // 'error' | 'warning'
  detail: string;         // Descrição detalhada
  guardrail?: string;     // Guardrail associado
  fix_instruction?: string; // Como corrigir
}
```

**Arquivos revisados**: `aios.config.yaml`, `agents/*`, `squads/*`, `src/agents/*`, `README.md`, `FIRST-RUN.md`, `.env.example`.

### 3.5 First-Run Checklist

Arquivo: `src/data/firstrun-requirements.ts`

Define `FIRSTRUN_ITEMS` organizados em 5 seções (`FIRSTRUN_SECTIONS`):

| Seção | Emoji | Itens |
|-------|-------|-------|
| `prerequisites` | 🔧 | Node.js 18+, npm 9+, IDE compatível, API Key Anthropic |
| `setup` | 📦 | Extrair ZIP, `npm install`, configurar `.env`, `npm run validate` |
| `first_value` | 🚀 | Ativar agente na IDE, confirmar greeting, executar `*help` |
| `integrations` | 🔌 | Testar N8N, Notion, Miro, MCP Servers (condicionais) |
| `observability` | 📊 | Instalar AIOS Dashboard (opcional) |

A função `getActiveFirstRunItems(configuredIntegrations)` filtra itens condicionais baseado nas integrações configuradas.

### 3.6 Persistência — `saveProject()`

Arquivo: `src/services/project.service.ts`

O fluxo de salvamento:
1. Cria ou atualiza registro em `projects`
2. Insere `agents` vinculados ao `project_id`
3. Insere `squads` vinculados ao `project_id`
4. Insere `generated_files` com `compliance_status` e `compliance_notes`
5. Retorna o `projectId`

**Edição de projeto existente** (`loadProjectForEditing()`):
1. Busca projeto + agentes + squads em paralelo via `Promise.all()`
2. `useWizardStore.loadProject()` mapeia dados do banco (snake_case) para o store (camelCase)
3. Navega automaticamente para a etapa `review`

### 3.7 Input/Output e Gestão de Contexto

**Input aceito**:
- Chat em linguagem natural (etapa Descoberta)
- Formulários estruturados (etapas 2-5)
- Drag-and-drop no diagrama de arquitetura
- Upload de configurações via painel do wizard

**Output produzido**:
- Pacote ZIP com projeto Node.js/TypeScript completo
- Projeto persistido no banco de dados
- Diagrama visual de arquitetura
- Relatório de compliance com violations detalhadas

**Gestão de contexto**:
- `messages` no store mantém histórico do chat (etapa 1)
- `wizard_sessions` no banco persiste estado entre sessões
- `highestStepIndex` permite navegação backward sem perder progresso
- `FeedbackCollector` registra interações para o self-improvement engine

---

## 4. Exemplos de Uso Baseados no Contexto

### 4.1 Workflow 1: Sistema DevOps com Pipeline Sequencial

**Objetivo**: Criar um sistema de automação de deploy com agentes em cadeia.

1. **Etapa Descoberta**: Descreva no chat: *"Preciso de um sistema de CI/CD automatizado com análise de requisitos, design de arquitetura, implementação, testes e deploy"*

2. **Etapa Projeto**:
   - Nome: `meu-cicd-aios`
   - Domínio: `software`
   - Padrão: **Pipeline Sequencial** (`SEQUENTIAL_PIPELINE`)

3. **Etapa Agentes** — Adicionar do catálogo:
   - `analyst` → analisa requisitos do pipeline
   - `architect` → define arquitetura do sistema
   - `dev` → implementa código
   - `qa` → executa testes automatizados
   - `devops` → faz deploy e monitora

4. **Etapa Squads** — Criar squad `delivery-pipeline`:
   ```yaml
   name: "Delivery Pipeline"
   slug: "delivery-pipeline"
   agentIds: ["analyst", "architect", "dev", "qa", "devops"]
   ```

5. **Gerar e baixar** → O pacote incluirá `aios.config.yaml` com `pattern: "SEQUENTIAL_PIPELINE"` e `max_concurrent_tasks: 1`.

### 4.2 Workflow 2: Product Discovery com Padrão Colaborativo

**Objetivo**: Squad de descoberta de produto com brainstorming livre.

1. **Etapa Projeto**:
   - Nome: `product-discovery-aios`
   - Padrão: **Colaborativo** (`COLLABORATIVE`)

2. **Etapa Agentes**:
   - `analyst` → pesquisa de mercado
   - `ux-expert` → design de experiência
   - `pm` → gestão de backlog
   - `po` → validação de negócio

3. **Etapa Squads** — Criar squad `discovery`:
   - Tasks: "Pesquisa de mercado", "Wireframes iniciais", "Priorização de features"
   - Workflow: `analyst → ux-expert → pm → po (accept/reject)`

4. **Resultado**: Sistema onde 4 agentes colaboram em espaço compartilhado, trocando informações livremente.

### 4.3 Workflow 3: Watchdog para Compliance Contínuo

**Objetivo**: Monitoramento contínuo de qualidade e conformidade.

1. **Etapa Projeto**:
   - Nome: `compliance-watchdog`
   - Padrão: **Watchdog** (`WATCHDOG`)

2. **Etapa Agentes**:
   - `aios-master` → supervisão geral
   - `qa` → validação de qualidade
   - `architect` → revisão de arquitetura

3. **Configuração**: O AIOS Master monitora continuamente as saídas de QA e Architect, validando compliance contra regras definidas.

### 4.4 Sugestões de Expansão

| Combinação | Resultado |
|-----------|-----------|
| `analyst` + `ux-expert` + tool `journey-mapper` | Mapeamento completo de jornada do usuário com wireframes |
| `dev` + `qa` + padrão `PARALLEL_SWARM` | Desenvolvimento e testes rodando em paralelo |
| `pm` + `po` + `sm` + padrão `TASK_FIRST` | Gestão ágil completa com sprint board automatizado |
| Agente custom "Data Scientist" + `analyst` | Pipeline de análise de dados com ML |
| `devops` + integração `N8N` | Automação de deploy com webhooks e triggers |
| `aios-master` + `aios-orchestrator` + MCP Servers | Orquestração avançada com servidores MCP customizados |

---

## 5. Guia de Resolução de Problemas e Limites

### 5.1 Limites Operacionais

| Limite | Valor | Detalhes |
|--------|-------|---------|
| **Rows por query** | 1.000 | Limite padrão do banco. Projetos com muitos arquivos gerados podem atingir |
| **Tamanho de contexto LLM** | Varia por modelo | `gemini-2.0-flash`: ~1M tokens. Considerar ao definir `system_prompt` |
| **Agentes por projeto** | Sem limite hard | Recomendado: 3-15 agentes. Acima disso, considerar múltiplos squads |
| **Squads por projeto** | Sem limite hard | Recomendado: 1-5 squads |
| **Tamanho do ZIP** | ~500KB-2MB | Depende do número de agentes e squads |
| **Formatos suportados** | YAML, Markdown, TypeScript, JSON, ENV | Definidos em `GeneratedFile.type` |

### 5.2 Troubleshooting Comum

#### Erro: "Defina um nome para o projeto"
- **Causa**: Campo `project.name` vazio na etapa `project_config`
- **Solução**: Preencher o nome antes de avançar. Validação em `getValidationMessage()`

#### Erro: "Adicione pelo menos um agente"
- **Causa**: Array `agents` vazio na etapa `agents`
- **Solução**: Adicionar pelo menos 1 agente do catálogo ou criar um customizado

#### Compliance: status `failed` em agente
- **Causa**: Agente sem `tools` ou `skills` suficientes
- **Solução**: Verificar que o agente tem pelo menos 8 tools e 10 skills (thresholds do `aios-core doctor`)

#### Compliance: `aios.config.yaml` com warning
- **Causa**: Campos obrigatórios ausentes ou padrão não reconhecido
- **Solução**: Verificar que `orchestration.pattern` é um dos 6 valores válidos de `OrchestrationPatternType`

#### Squad vazio (sem agentes)
- **Causa**: Squad criado mas nenhum agente arrastado para ele
- **Solução**: Usar o ArchitectureDiagram para arrastar conectores de agente → squad, ou adicionar `agentIds` manualmente no SquadBuilder

#### Download ZIP não inicia
- **Causa**: Bloqueio de popup ou erro no `JSZip`
- **Solução**: Verificar console do navegador. A função `downloadProjectZip()` cria um `<a>` dinâmico para trigger do download

### 5.3 Self-Improvement Engine

Localizado em `src/lib/self-improve/`. Sistema de feedback e evolução contínua do AIOS Forge.

#### Componentes

| Módulo | Arquivo | Finalidade |
|--------|---------|-----------|
| **Types** | `types.ts` | `FeedbackEntry`, `QualityMetric`, `Improvement`, `GenerationAudit` |
| **FeedbackCollector** | `feedback-collector.ts` | Coleta eventos: `trackWizardStep()`, `trackAgentSelection()`, `trackSquadCreation()` |
| **AnalysisEngine** | `analysis-engine.ts` | Analisa métricas e identifica trends (`improving`, `stable`, `declining`) |
| **EvolutionEngine** | `evolution-engine.ts` | Propõe e aplica melhorias com base na análise |
| **MetricsJob** | `metrics-job.ts` | Agregação periódica de métricas de qualidade |
| **Middleware** | `middleware.ts` | Interceptação de ações para coleta automática |

#### Tipos de Feedback (`FeedbackType`)

```typescript
'WIZARD_STEP_COMPLETION' | 'AGENT_SELECTION' | 'AGENT_CUSTOMIZATION' |
'SQUAD_CREATION' | 'GENERATION_SUCCESS' | 'GENERATION_FAILURE' |
'EXPORT_SUCCESS' | 'EXPORT_FAILURE' | 'VALIDATION_RESULT' |
'USER_RATING' | 'INSTALLATION_TEST' | 'PROMPT_EFFECTIVENESS'
```

#### Alvos de Melhoria (`ImprovementTarget`)

```typescript
'SYSTEM_PROMPT' | 'AGENT_TEMPLATE' | 'SQUAD_TEMPLATE' |
'GENERATION_TEMPLATE' | 'VALIDATION_RULE' | 'ORCHESTRATION_PATTERN' | 'UI_DEFAULT'
```

#### Ciclo de Evolução

1. **Coleta**: `FeedbackCollector` registra interações do usuário
2. **Análise**: `AnalysisEngine` identifica padrões e trends
3. **Proposta**: `EvolutionEngine` sugere melhorias com `confidence` score
4. **Aplicação**: Melhorias aprovadas são aplicadas (status: `PROPOSED` → `APPROVED` → `APPLIED`)
5. **Medição**: Impacto medido via `ImpactMeasurement` (before/after/delta)

---

## Apêndice A: Tipos Centrais (`src/types/aios.ts`)

```typescript
// Etapas do wizard
type WizardStep = 'welcome' | 'project_config' | 'agents' | 'squads' |
                  'integrations' | 'review' | 'generation' | 'post_creation';

// Padrões de orquestração
type OrchestrationPatternType = 'SEQUENTIAL_PIPELINE' | 'PARALLEL_SWARM' |
  'HIERARCHICAL' | 'WATCHDOG' | 'COLLABORATIVE' | 'TASK_FIRST';

// Categorias de agentes
type AgentCategory = 'Meta' | 'Planejamento' | 'Desenvolvimento' | 'Infraestrutura';

// Arquivo gerado
interface GeneratedFile {
  path: string;
  content: string;
  type: 'yaml' | 'md' | 'json' | 'ts' | 'env' | 'other';
  complianceStatus: 'pending' | 'passed' | 'warning' | 'failed';
  complianceNotes?: string;
}
```

## Apêndice B: Integrações Suportadas

| Tipo | Enum | Descrição |
|------|------|-----------|
| N8N | `N8N` | Automação de workflows com webhooks |
| Claude API | `CLAUDE_API` | API direta para agentes Claude |
| MCP Server | `MCP_SERVER` | Servidores Model Context Protocol |
| Notion | `NOTION` | Integração com workspaces Notion |
| Miro | `MIRO` | Integração com boards Miro |
| OpenAI API | `OPENAI_API` | API para modelos OpenAI |

Status possíveis: `CONFIGURED` → `TESTED` → `FAILED`

---

> **AIOS Forge** — Construa sistemas multi-agente com confiança.
> Padrão Synkra AIOS v4.2.13 · React 18 · Zustand · Lovable Cloud
