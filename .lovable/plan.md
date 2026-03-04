

# ✅ IMPLEMENTADO — Correções na Lógica de Execução do Sistema Gerado

Todas as 14 correções foram implementadas em `src/lib/generate-aios-package.ts`.

## Resumo das Correções

| # | Problema | Status |
|---|----------|--------|
| 1 | Orchestrator ignora retry_policy e timeout_ms | ✅ Implementado com helpers `withRetry` e `withTimeout` |
| 2 | Agent Runner ignora temperature e max_tokens | ✅ Propagados do YAML para todos os providers |
| 3 | Squads não usados no roteamento | ✅ Squad filtering + comando `/squad <slug> <tarefa>` |
| 4 | Workflows ignoram depends_on, timeout, retry | ✅ Execução DAG com parallelismo + retry/timeout por step |
| 5 | Script `npm run validate` não existe | ✅ Gerado `src/validate.ts` + script no package.json |
| 6 | Docker não inclui `workflows/` | ✅ Adicionado COPY e volume |
| 7 | WorkflowConfig tipo incompleto | ✅ Adicionado `configPath?`, `timeout_ms?`, `retry_policy?` |
| 8 | FIRST-RUN.md diz Node.js 18+ | ✅ Corrigido para 20+ |
| 9 | FIRST-RUN.md hardcoda Anthropic | ✅ Detecção dinâmica de providers |
| 10 | frameworkProtection ausente | ✅ Adicionado ao aios.config.yaml |
| 11 | Codebase map incompleto | ✅ Adicionados workflows, agent.ts, FIRST-RUN.md, validate.ts |
| 12 | AppMaster não mapeia workflows | ✅ Seção workflows adicionada |
| 13 | .gitignore exclui scaffolds úteis | ✅ Preserva JSON scaffold, ignora apenas runtime |
| 14 | Orchestrator não expõe targetAgent | ✅ Rota direta + comando `@<slug> <tarefa>` |
