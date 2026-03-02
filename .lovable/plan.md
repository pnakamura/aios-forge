

# Melhorar Criacao de Agente Customizado — Padrao Agent File v4.2.13

## Resumo

O dialogo atual de criacao de agente customizado tem apenas 4 campos (nome, slug, role, system prompt). Vamos expandi-lo para gerar agentes completos seguindo a estrutura do Agent File, com comandos estruturados (description, visibility, handler), dependencias (services, hooks, types), tools, skills e context.

## Mudancas

### 1. Expandir tipo de comando no AiosAgent

**Arquivo:** `src/types/aios.ts`

Adicionar um tipo estruturado para comandos, mantendo retrocompatibilidade:

```text
AgentCommand {
  name: string
  description: string
  visibility: 'public' | 'internal' | 'admin'
  handler: string  // referencia ao service/hook que implementa
}

AgentDependencies {
  services: string[]
  hooks: string[]
  types: string[]
}
```

Adicionar a `AiosAgent`:
- `structuredCommands: AgentCommand[]` (os comandos ricos)
- `dependencies: AgentDependencies` (mapeamento de arquivos relacionados)
- `context: string` (descricao do caso de uso, separado do systemPrompt)

### 2. Redesenhar o dialogo de criacao customizada

**Arquivo:** `src/components/wizard/AgentCatalog.tsx`

Substituir o dialogo simples por um formulario multi-secao com:

- **Identidade**: nome, slug (auto-gerado), role, squad (selecionavel entre squads existentes)
- **Contexto**: campo context (quando ativar este agente) separado do system prompt
- **Comandos**: lista editavel de comandos com campos name, description, visibility (public/internal/admin) e handler
- **Dependencias**: campos para services, hooks e types (listas editaveis)
- **Tools e Skills**: listas editaveis (reaproveitando o componente EditableList do AgentEditor)
- **System Prompt**: textarea para o prompt

### 3. Atualizar geracao do .agent.ts

**Arquivo:** `src/lib/generate-aios-package.ts`

Na funcao `generateAgentTs`, usar `structuredCommands` quando disponivel para gerar a estrutura completa:

```text
commands: {
  [nome]: {
    description: '[descricao]',
    visibility: 'public',
    handler: '[service.method]',
  },
},

dependencies: {
  services: ['nome.service.ts'],
  hooks: ['useNome.ts'],
  types: ['nome.types.ts'],
},
```

Tambem gerar o type export `[Nome]Commands` e `[Nome]Visibility`.

### 4. Atualizar AgentEditor para suportar os novos campos

**Arquivo:** `src/components/wizard/AgentEditor.tsx`

Adicionar abas ou secoes para:
- **Comandos estruturados**: editar name, description, visibility, handler por comando
- **Dependencias**: editar services, hooks, types
- **Context**: campo separado do system prompt

### 5. Extrair EditableList para componente reutilizavel

**Arquivo:** `src/components/wizard/EditableList.tsx`

Mover o componente `EditableList` (atualmente inline no AgentEditor) para arquivo proprio, permitindo reuso no dialogo de criacao customizada.

## Arquivos impactados

| Arquivo | Acao |
|---------|------|
| `src/types/aios.ts` | Adicionar AgentCommand, AgentDependencies, novos campos em AiosAgent |
| `src/components/wizard/EditableList.tsx` | Extrair componente reutilizavel |
| `src/components/wizard/AgentCatalog.tsx` | Redesenhar dialogo de criacao customizada |
| `src/components/wizard/AgentEditor.tsx` | Adicionar edicao de comandos estruturados, deps e context |
| `src/lib/generate-aios-package.ts` | Usar structuredCommands e dependencies na geracao |
| `src/stores/wizard-store.ts` | Ajustar initialState para novos campos opcionais |

## Detalhes tecnicos

- `structuredCommands` e opcional — agentes nativos continuam usando `commands: string[]` e o gerador faz fallback para o formato atual
- `AgentCommand.handler` segue o padrao `[service].[method]` (ex: `contractAnalysis.service.analyze`)
- O slug e auto-gerado a partir do nome via kebab-case, editavel manualmente
- O campo `context` do AiosAgent e diferente do `systemPrompt`: context descreve QUANDO usar, systemPrompt descreve COMO o agente se comporta
- Nenhuma dependencia nova

