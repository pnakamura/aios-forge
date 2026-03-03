

# Gerar `manual_de_uso.md` na Raiz do Projeto

## Objetivo

Criar um arquivo Markdown exaustivo que funcione como guia mestre de onboarding do AIOS Forge, referenciando nomes reais de funcoes, agentes, stores, servicos e padroes que existem no codigo.

## Arquivo unico: `manual_de_uso.md` (raiz do projeto)

### Estrutura do documento (~600-800 linhas)

**1. Arquitetura e Visao Geral do Sistema**
- Descricao do AIOS Forge como builder de sistemas multi-agente
- Stack: React 18 + Vite + Zustand + Supabase + React Flow + JSZip
- Camada de agentes internos (`src/agents/`): `AuthAgent`, `DashboardAgent`, `WizardAgent`, `PackageGenerationAgent`
- Camada de servicos (`src/services/`): `auth.service.ts`, `project.service.ts`, `compliance.service.ts`
- Capacidades core: geracao de pacotes instaláveis, revisao de conformidade via edge function `aios-compliance-review`, chat assistido via `aios-chat`, persistencia no banco, download ZIP via `JSZip`, diagrama interativo via React Flow

**2. Ecossistema de Agentes e Squads**
- Tabela completa dos 11 agentes nativos de `NATIVE_AGENTS` (`src/data/native-agents.ts`): slug, name, role, category, 8 tools, 10 skills, defaultModel, defaultCommands, compatiblePatterns
- Descricao dos 6 padroes de orquestracao de `ORCHESTRATION_PATTERNS` (`src/data/orchestration-patterns.ts`): SEQUENTIAL_PIPELINE, PARALLEL_SWARM, HIERARCHICAL, WATCHDOG, COLLABORATIVE, TASK_FIRST
- Squads: como o `SquadBuilder` organiza agentes em equipes com tasks e workflows
- Fluxo de colaboracao multi-agente com exemplos (ex: Analyst → Architect → Developer → QA)

**3. Guia de Funcionalidades e Comandos**
- Wizard de 8 etapas (`WIZARD_STEPS` em `src/types/aios.ts`): welcome → project_config → agents → squads → integrations → review → generation → post_creation
- Estado global via `useWizardStore` (`src/stores/wizard-store.ts`): commands `setStep`, `addAgent`, `removeAgent`, `addSquad`, `updateProject`, `loadProject`, `reset`
- Funcao `generateAiosPackage()` e seus ~30 sub-geradores
- Estrutura do pacote gerado: `aios.config.yaml`, `agents/*.yaml`, `agents/*.md`, `src/agents/*.agent.ts`, `squads/*/squad.yaml`, `.claude/` (settings.json, commands/, skills/, hooks/)
- `frameworkProtection: true` no config
- Compliance review via `runReview()` (`compliance.service.ts`)
- First-Run checklist (`FIRSTRUN_ITEMS` em `src/data/firstrun-requirements.ts`)

**4. Exemplos de Uso Baseados no Contexto**
- Workflow 1: Criar um sistema DevOps com Pipeline Sequencial (Analyst → Architect → Dev → QA → DevOps)
- Workflow 2: Criar um squad de Product Discovery com padrao Colaborativo (Analyst + UX Expert + PM + PO)
- Workflow 3: Configurar um projeto com Watchdog para compliance continuo (AIOS Master + QA + Architect)
- Sugestoes de expansao: combinar agentes custom com nativos, criar workflows com triggers automaticos, integrar MCP Servers

**5. Guia de Resolucao de Problemas e Limites**
- Limites operacionais: tamanho de contexto LLM, 1000 rows por query Supabase, formatos suportados
- Troubleshooting: erros de compliance, agentes sem skills/tools, squads vazios
- Self-improvement engine (`src/lib/self-improve/`): tipos de feedback, metricas de qualidade, ciclo de evolucao

### Detalhes de implementacao

O arquivo sera escrito com Markdown rico: tabelas para agentes/tools/skills, blocos de codigo para exemplos de YAML e TypeScript, negritos para nomes de funcoes, listas para comandos. Tom de arquiteto de IA explicando para usuario final avancado. Todas as referencias serao a nomes reais do codigo (`generateAiosPackage`, `useWizardStore`, `NATIVE_AGENTS`, `runReview`, etc.).

