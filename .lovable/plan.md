

# ✅ IMPLEMENTADO — AIOS Library Module (Phase 1)

## Resumo

Modulo Library implementado com navegacao, filtragem e visualizacao de artefatos (agents, skills, squads, workflows).

## Entregues

| Item | Status |
|------|--------|
| Migration: skills, workflows_library, library_favorites + alter agents/squads | ✅ |
| Tipos: `src/types/library.ts` | ✅ |
| Servico: `src/services/library.service.ts` | ✅ |
| Store: `src/stores/library-store.ts` | ✅ |
| CSS tokens: --library-agent/skill/squad/workflow | ✅ |
| LibraryCard com cores por tipo | ✅ |
| LibraryGrid + LibraryList | ✅ |
| LibraryFilterPanel (busca, tipo, tags, ordenacao, toggles) | ✅ |
| LibraryToolbar (contagem, toggle view) | ✅ |
| LibraryDetailPanel com tabs (Visao Geral + Detalhes Tecnicos) | ✅ |
| Detail components: AgentDetail, SkillDetail, SquadDetail, WorkflowDetail | ✅ |
| ImportDialog com selecao de projeto destino | ✅ |
| LibraryPage com layout 3 colunas redimensinaveis | ✅ |
| Rota /library no App.tsx | ✅ |
| Link "Library" no header do DashboardPage | ✅ |

# ✅ IMPLEMENTADO — AIOS Library Module (Phase 2)

## Resumo

Sistema de working copy (draft/fork/published), editor de elementos com formularios por tipo, painel de IA assistida com streaming SSE, e fluxo de publicacao/descarte.

## Entregues

| Item | Status |
|------|--------|
| Migration: status, version, parent_id, changelog em 4 tabelas + library_editor_sessions | ✅ |
| Tipos estendidos: LibraryItemStatus, WorkingCopy, FormData por tipo, EditorAiMessage | ✅ |
| Servico: `src/services/library-editor.service.ts` (draft/fork/save/publish/discard/validate) | ✅ |
| Store: `src/stores/library-editor-store.ts` (working copy + IA) | ✅ |
| Edge Function: `library-editor-ai` com SSE streaming e tool calling (apply_fields) | ✅ |
| Hook: `useAutoSave` (debounce 30s + beforeunload) | ✅ |
| AgentForm (identidade, system prompt, LLM, comandos, config) | ✅ |
| SkillForm (identidade, prompt, inputs/outputs, exemplos) | ✅ |
| SquadForm (identidade, agentes, tasks, config) | ✅ |
| WorkflowForm (identidade, steps, triggers, outputs) | ✅ |
| EditorAiPanel (chat streaming, quick actions, sugestoes) | ✅ |
| EditorHeader (breadcrumb, status, save/publish/discard/validate) | ✅ |
| PublishDialog (versao, changelog, validacao) | ✅ |
| DiscardDialog (confirmacao contextual fork vs draft) | ✅ |
| LibraryEditorPage (layout 2 colunas redimensionaveis) | ✅ |
| Rota /library/editor/:type/:id no App.tsx | ✅ |
| LibraryToolbar com dropdown "Novo elemento" | ✅ |
| LibraryCard com badges draft/fork e "Continuar editando" | ✅ |
| LibraryDetailPanel com botao "Criar fork e editar" | ✅ |

# ✅ IMPLEMENTADO — Migrate Commands from Plain Strings to Structured Format

## Resumo

Unificacao do formato de comandos de agentes: de `string[]` para `AgentCommand[]` em toda a stack (tipos, dados nativos, store, editor, geracao).

## Entregues

| Item | Status |
|------|--------|
| Tipo `NativeAgent.defaultCommands` migrado para `AgentCommand[]` | ✅ |
| Campo `AiosAgent.structuredCommands` removido, `commands` unificado como `AgentCommand[]` | ✅ |
| Funcao `normalizeCommands()` para converter legacy strings em objetos | ✅ |
| 11 agentes nativos enriquecidos com descricao, visibilidade e handler | ✅ |
| `AgentFormData.commands` alinhado com `{ name, description, visibility, handler }` | ✅ |
| `AgentForm.tsx` (Library Editor) atualizado com campos visibility e handler | ✅ |
| `AgentEditor.tsx` (Wizard) unificado sem dual-path | ✅ |
| `AgentCatalog.tsx` copia comandos estruturados ao adicionar nativo | ✅ |
| `LibraryImportWizardDialog` normaliza comandos ao importar | ✅ |
| `wizard-store.ts` normaliza comandos no `loadProject` | ✅ |
| `library-editor.service.ts` normaliza ao carregar do DB | ✅ |
| `generate-aios-package.ts` removido dual-path (structured vs simple) | ✅ |
