

# Expandir defaultSkills (4→10) e defaultTools (4→8) dos 11 Agentes Nativos

## Arquivo unico: `src/data/native-agents.ts`

Apenas expansao de arrays de dados — sem mudanca de tipos ou logica.

### Valores por agente

**AIOS Master** (lines 21-22):
- tools: +4 → `dependency-graph`, `escalation-engine`, `resource-allocator`, `decision-logger`
- skills: +6 → `delegacao-contextual`, `gestao-de-dependencias`, `escalonamento-automatico`, `analise-de-gargalos`, `alocacao-de-recursos`, `tomada-de-decisao-autonoma`

**AIOS Orchestrator** (lines 35-36):
- tools: +4 → `deadlock-detector`, `timeout-manager`, `circuit-breaker`, `trace-collector`
- skills: +6 → `deteccao-de-deadlock`, `orquestracao-de-eventos`, `gestao-de-timeout`, `paralelizacao-de-tarefas`, `circuit-breaking`, `observabilidade-distribuida`

**Analyst** (lines 49-50):
- tools: +4 → `gap-analyzer`, `benchmark-tool`, `journey-mapper`, `swot-generator`
- skills: +6 → `analise-de-gaps`, `benchmarking`, `mapeamento-de-jornada`, `analise-swot`, `documentacao-de-requisitos`, `prototipacao-rapida`

**Product Manager** (lines 63-64):
- tools: +4 → `release-planner`, `okr-tracker`, `competitor-analyzer`, `risk-matrix`
- skills: +6 → `analise-de-impacto`, `gestao-de-releases`, `comunicacao-com-stakeholders`, `definicao-de-okrs`, `analise-competitiva`, `gestao-de-riscos`

**Architect** (lines 77-78):
- tools: +4 → `c4-modeler`, `api-designer`, `security-scanner`, `debt-tracker`
- skills: +6 → `modelagem-c4`, `analise-de-escalabilidade`, `design-de-apis`, `avaliacao-de-seguranca`, `gestao-de-debito-tecnico`, `prova-de-conceito`

**UX Expert** (lines 91-92):
- tools: +4 → `design-system-manager`, `usability-tester`, `ia-mapper`, `token-generator`
- skills: +6 → `design-system-management`, `teste-de-usabilidade`, `analise-de-acessibilidade`, `design-de-microinteracoes`, `information-architecture`, `design-tokens`

**Scrum Master** (lines 105-106):
- tools: +4 → `capacity-planner`, `conflict-resolver`, `dod-tracker`, `workshop-board`
- skills: +6 → `gestao-de-conflitos`, `metricas-ageis`, `planejamento-de-capacidade`, `gestao-de-dependencias-entre-times`, `workshop-facilitation`, `definition-of-done`

**Developer** (lines 119-120):
- tools: +4 → `profiler`, `dependency-manager`, `doc-generator`, `debugger`
- skills: +6 → `tdd-driven-development`, `design-patterns`, `otimizacao-de-performance`, `gestao-de-dependencias`, `documentacao-de-codigo`, `debugging-avancado`

**QA Engineer** (lines 133-134):
- tools: +4 → `security-tester`, `performance-tester`, `a11y-tester`, `mutation-analyzer`
- skills: +6 → `teste-de-seguranca`, `teste-de-performance`, `teste-de-acessibilidade`, `gestao-de-dados-de-teste`, `teste-exploatorio`, `analise-de-mutacao`

**Product Owner** (lines 147-148):
- tools: +4 → `roi-calculator`, `mvp-tracker`, `churn-analyzer`, `pmf-scorer`
- skills: +6 → `analise-de-roi`, `gestao-de-mvp`, `customer-discovery`, `analise-de-churn`, `product-market-fit`, `gestao-de-backlog-estrategico`

**DevOps Engineer** (lines 161-162):
- tools: +4 → `secret-manager`, `observability-platform`, `dr-planner`, `cost-analyzer`
- skills: +6 → `gestao-de-segredos`, `observabilidade-full-stack`, `disaster-recovery`, `capacity-planning`, `security-hardening`, `cost-optimization`

## Resultado

Cada agente: 10 skills, 8 tools. Passa com margem nos thresholds do `aios-core doctor`.

