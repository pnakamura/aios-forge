

# Atualizar Modelos de IA para Versões Atuais

## Locais que precisam de alteração

### 1. Edge Functions (modelos do builder interno)
- `supabase/functions/aios-chat/index.ts` — linha 84: `google/gemini-2.5-flash` → `google/gemini-3-flash-preview`
- `supabase/functions/aios-compliance-review/index.ts` — linha 114: `google/gemini-2.5-flash` → `google/gemini-3-flash-preview`

### 2. Catálogo de agentes nativos
- `src/data/native-agents.ts` — todos os 11 agentes usam `gemini-2.0-flash` como `defaultModel`
- Atualizar todos para `gemini-3-flash-preview`

### 3. Seletor de modelos no AgentEditor
- `src/components/wizard/AgentEditor.tsx` — linhas 23-30: `MODEL_OPTIONS` com modelos desatualizados

Modelos atuais disponíveis (março 2026):

| Provider | Antigo | Novo |
|----------|--------|------|
| Google | `gemini-2.0-flash` | `gemini-3-flash-preview` |
| Google | `gemini-2.5-pro-preview-05-06` | `gemini-3-pro-preview` |
| OpenAI | `gpt-4o` | `gpt-5` |
| OpenAI | `gpt-4o-mini` | `gpt-5-mini` |
| Anthropic | `claude-sonnet-4-20250514` | `claude-sonnet-4-20250514` (manter — ainda é o mais recente) |
| Anthropic | `claude-haiku-4-20250414` | `claude-haiku-4-20250414` (manter — ainda é o mais recente) |

**Nota:** Os modelos Claude Sonnet 4 e Haiku 4 são os mais recentes disponíveis da Anthropic — não há versão mais nova, portanto serão mantidos.

### Resumo de arquivos editados
- `supabase/functions/aios-chat/index.ts` — 1 linha
- `supabase/functions/aios-compliance-review/index.ts` — 1 linha
- `src/data/native-agents.ts` — 11 ocorrências de `defaultModel`
- `src/components/wizard/AgentEditor.tsx` — array `MODEL_OPTIONS`

