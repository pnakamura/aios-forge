

# Auditoria Completa — Modelos de IA Desatualizados

A auditoria identificou **referências a modelos descontinuados** em 5 locais adicionais que não foram atualizados na rodada anterior. São referências hardcoded em strings de UI, fallbacks de store, e conteúdo gerado pelo motor de pacotes.

## Achados

### 1. `src/components/wizard/ArchitectureDiagram.tsx` — `MODEL_OPTIONS` (linha 71-78)
Array duplicado do `AgentEditor` mas **nunca foi atualizado**. Ainda usa `gpt-4o`, `gpt-4o-mini`, `gemini-2.0-flash`, `gemini-2.5-pro-preview-05-06`.

### 2. `src/stores/wizard-store.ts` — fallback `llmModel` (linha 177)
Ao carregar projeto do banco: `llmModel: a.llm_model || 'gemini-2.0-flash'` — fallback desatualizado.

### 3. `src/components/wizard/AgentCatalog.tsx` — hardcoded model (linha 115)
Ao criar agente customizado: `llmModel: 'gemini-2.0-flash'` — deveria ser `gemini-3-flash-preview`.

### 4. `src/pages/WizardPage.tsx` — textos de integração (linhas 333-335)
Descritivos de UI mencionam modelos antigos:
- `'Modelos Anthropic (Claude Opus, Sonnet, Haiku)'` — Claude Opus não existe mais; correto seria `Claude Sonnet 4, Haiku 4`
- `'Modelos GPT (GPT-4o, GPT-4o-mini)'` → `GPT-5, GPT-5-mini, GPT-5.2`
- `'Modelos Google (Gemini Flash, Pro)'` → `Gemini 3 Flash, Gemini 3 Pro`

### 5. `src/lib/generate-aios-package.ts` — conteúdo gerado (múltiplas linhas)
O motor de geração escreve modelos antigos nos arquivos do pacote exportado:
- Linha 418: `model: 'gemini-2.0-flash'` no CLAUDE.md gerado
- Linha 1061: fallback `'gpt-4o-mini'` no agent-runner
- Linha 1125: comentário referenciando `gemini-2.0-flash`
- Linhas 1842, 1966, 1982: exemplos YAML com `gemini-2.0-flash`
- Linhas 2127-2129: lista de modelos suportados desatualizada
- Linha 2166: exemplo de log com modelo antigo

## Plano de Correção

### Arquivo 1: `src/components/wizard/ArchitectureDiagram.tsx`
Atualizar `MODEL_OPTIONS` (linhas 71-78) para:
```
gemini-3-flash-preview, gemini-3-pro-preview, gpt-5, gpt-5-mini, gpt-5.2, claude-sonnet-4-20250514, claude-haiku-4-20250414
```

### Arquivo 2: `src/stores/wizard-store.ts`
Linha 177: trocar fallback de `gemini-2.0-flash` para `gemini-3-flash-preview`.

### Arquivo 3: `src/components/wizard/AgentCatalog.tsx`
Linha 115: trocar `gemini-2.0-flash` para `gemini-3-flash-preview`.

### Arquivo 4: `src/pages/WizardPage.tsx`
Linhas 333-335: atualizar descrições dos modelos nas integrações.

### Arquivo 5: `src/lib/generate-aios-package.ts`
Atualizar todas as ~10 ocorrências de modelos antigos em strings template (CLAUDE.md gerado, agent-runner, exemplos YAML, documentação).

## Resumo
- **5 arquivos** a editar
- **~20 ocorrências** de modelos desatualizados
- Sem mudanças estruturais — apenas substituição de strings

