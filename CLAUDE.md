# AIOS Forge

Sistema web para configurar e gerar pacotes completos de instalacao de sistemas AIOS (AI Operating System) com orquestracao de agentes IA.

## Stack

- **Frontend**: React 18 + TypeScript + Vite 5
- **UI**: Tailwind CSS + shadcn/ui (Radix primitives) + Framer Motion
- **State**: Zustand (`src/stores/wizard-store.ts`)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Diagrama**: React Flow (@xyflow/react)
- **Export**: JSZip para download do pacote gerado

## Estrutura do projeto

```
src/
  pages/           → Paginas (LandingPage, AuthPage, DashboardPage, WizardPage, ProjectDetailPage)
  components/
    wizard/        → Componentes do wizard (ChatPanel, AgentCatalog, SquadBuilder, FilePreview, ArchitectureDiagram, StepProgress, StepContextPanel)
    ui/            → shadcn/ui components
  stores/          → Zustand stores (wizard-store.ts)
  types/           → TypeScript types (aios.ts)
  data/            → Dados estaticos (native-agents.ts, orchestration-patterns.ts)
  lib/             → Utilitarios (generate-aios-package.ts, utils.ts)
  integrations/    → Supabase client e types
supabase/
  functions/       → Edge Functions (aios-chat, aios-compliance-review)
```

## Wizard Flow (7 etapas)

1. **Descoberta** (`welcome`) — Chat com IA para descrever o projeto
2. **Projeto** (`project_config`) — Formulario: nome, descricao, dominio, padrao de orquestracao
3. **Agentes** (`agents`) — Catalogo de 11 agentes nativos + criacao customizada (painel esquerdo = AgentCatalog)
4. **Squads** (`squads`) — Builder para agrupar agentes em equipes com tasks/workflows (painel esquerdo = SquadBuilder)
5. **Integracoes** (`integrations`) — APIs de LLM auto-detectadas + servicos externos
6. **Revisao** (`review`) — Resumo + validacao de conformidade AIOS
7. **Geracao** (`generation`) — Salvar no Supabase ou download ZIP

## Diagrama de Arquitetura (`src/components/wizard/ArchitectureDiagram.tsx`)

Diagrama interativo com React Flow organizado em 3 tiers:
- **Tier 1**: Orquestrador (padrao selecionado)
- **Tier 2**: Agentes (custom nodes com Handle source/target)
- **Tier 3**: Squads (custom nodes com Handle target)

Funcionalidades interativas:
- Arrastar conectores de agente para squad = atribuir agente ao squad (via `onConnect` → `updateSquad`)
- Selecionar no + Delete = remover agente/squad do store
- Selecionar aresta + Delete = desvincular agente do squad
- Criar squad pelo diagrama (botao "+ Squad" no painel)
- Alteracoes no diagrama refletem no store e vice-versa (sync bidirecional via `useEffect`)

## Pacote gerado (`src/lib/generate-aios-package.ts`)

O engine gera um pacote completo e instalavel com:
- `aios.config.yaml` — configuracao central
- `package.json`, `tsconfig.json` — projeto Node/TypeScript
- `src/main.ts`, `src/orchestrator.ts`, `src/agent-runner.ts` — runtime
- `agents/*.yaml`, `agents/*.md` — definicao por agente
- `squads/*/squad.yaml`, `squads/*/README.md` — manifesto por squad
- `Dockerfile`, `docker-compose.yaml` — containerizacao
- `docs/`, `scripts/`, `.env.example` — documentacao e setup

## Agentes nativos (11)

Definidos em `src/data/native-agents.ts`:
- **Meta**: AIOS Master (`aios-master`), AIOS Orchestrator (`aios-orchestrator`)
- **Planejamento**: Analyst, Product Manager, Architect, UX Expert, Scrum Master, Product Owner
- **Desenvolvimento**: Developer, QA Engineer
- **Infraestrutura**: DevOps Engineer

## Padroes de orquestracao (6)

Definidos em `src/data/orchestration-patterns.ts`:
- Sequential Pipeline, Parallel Swarm, Hierarchical, Watchdog, Collaborative, Task-First

## Convencoes

- Idioma da UI: Portugues do Brasil (sem acentos no codigo-fonte)
- CSS: Tailwind com design tokens customizados (glow-primary, glow-success, glow-warning)
- Componentes UI: shadcn/ui — importar de `@/components/ui/`
- Estado global: Zustand store — `useWizardStore()`
- Build: `npm run build` (Vite)
- Dev: `npm run dev`

## Comandos

```bash
npm install        # Instalar dependencias
npm run dev        # Dev server (localhost:8080)
npm run build      # Build de producao
```
