

# Revisao de Conformidade por Agente IA — Padrao AIOS v4.2.13

## Resumo

Atualizar a edge function `aios-compliance-review` para que o agente IA valide os arquivos gerados contra o padrao completo do Synkra AIOS v4.2.13, incluindo verificacao de headers `@agent`, estrutura `persona_profile`, visibilidade de comandos, dependencias cruzadas e coerencia entre arquivos `.md`, `.agent.ts` e `.yaml`.

## Problema atual

O prompt de validacao atual e generico — verifica apenas campos basicos (slug, name, model) sem considerar:
- Headers `@agent` obrigatorios nos `.agent.ts`
- Tabela `persona_profile` nos `.md`
- Consistencia de `commands` com niveis de visibilidade (`full`/`quick`/`key`)
- Cross-reference entre agentes declarados em squads e arquivos individuais
- Presenca do `AppMaster.agent.ts` como orquestrador raiz
- Secoes obrigatorias: Dependencies, Context, Tools, Skills

## Mudancas

### 1. Reescrever o system prompt da edge function

O novo prompt sera estruturado como um "agente revisor AIOS" com regras especificas por tipo de arquivo:

**Arquivo: `supabase/functions/aios-compliance-review/index.ts`**

O system prompt passara a incluir:

```text
Voce e o AIOS Compliance Reviewer, um agente especializado em validar
artefatos contra o padrao Synkra AIOS v4.2.13.

REGRAS POR TIPO DE ARQUIVO:

1. Arquivos .agent.ts (src/agents/*.agent.ts):
   - OBRIGATORIO: header JSDoc com @agent, @persona, @version, @squad,
     @commands, @deps, @context
   - OBRIGATORIO: export const [Name]Agent com campos: name, slug, persona,
     version, squad, model, commands, context
   - OBRIGATORIO: export type [Name]Commands
   - Cada comando deve ter visibility (full|quick|key) e description
   - O AppMaster.agent.ts deve ter campo squads mapeando todos os squads

2. Arquivos .md (agents/*.md):
   - OBRIGATORIO: frontmatter YAML com agent, slug, version, squad, model
   - OBRIGATORIO: secao persona_profile como tabela com name, role, style,
     visibility, constraints
   - OBRIGATORIO: secoes System Prompt, Commands (tabela com Comando,
     Visibilidade, Descricao), Tools, Skills, Dependencies, Context
   - Commands devem ter visibilidade inferida corretamente

3. Arquivos .yaml (agents/*.yaml):
   - OBRIGATORIO: slug, name, role, version
   - OBRIGATORIO: bloco llm com model, temperature, max_tokens
   - OBRIGATORIO: visibility, system_prompt, commands, tools, skills

4. Squad YAML (squads/*/squad.yaml):
   - OBRIGATORIO: name, slug, version, agents, tasks, workflows
   - Cada task: id, name, description, agent, dependencies, checklist
   - Cada workflow: id, name, steps (com id, name, agent)
   - Cross-check: agentes referenciados devem existir nos arquivos de agente

5. aios.config.yaml:
   - OBRIGATORIO: name, version, domain, orchestration.pattern, agents,
     squads, logging, runtime
   - Cross-check: slugs de agentes e squads devem bater com os arquivos

6. FIRST-RUN.md:
   - OBRIGATORIO: secoes Pre-requisitos, Setup Inicial, First-Value, tabela
     "incluido vs necessario"

7. README.md:
   - OBRIGATORIO: titulo, descricao, instrucoes de setup, lista de agentes

CROSS-VALIDATION:
- Todo agente listado em aios.config.yaml deve ter .md, .yaml e .agent.ts
- Todo agente em um squad.yaml deve existir em aios.config.yaml
- O AppMaster deve listar todos os squads do projeto
- Comandos devem ser consistentes entre .md, .yaml e .agent.ts

SEVERIDADE:
- failed: campo obrigatorio ausente, cross-reference quebrada,
  header @agent faltando
- warning: campo opcional ausente, descricao vazia, inconsistencia menor
- passed: totalmente conforme ao padrao v4.2.13
```

### 2. Atualizar o modelo utilizado

Trocar `google/gemini-2.0-flash` por `google/gemini-2.5-flash` para melhor capacidade de raciocinio na validacao cruzada.

### 3. Adicionar campo `severity_reason` ao tool schema

Enriquecer o retorno para incluir uma razao categorizada (ex: `missing_header`, `cross_ref_broken`, `empty_field`):

```text
properties:
  results:
    type: array
    items:
      properties:
        path: { type: string }
        status: { type: string, enum: [passed, warning, failed] }
        notes: { type: string }
        violations: {
          type: array,
          items: {
            type: object,
            properties:
              rule: { type: string }
              severity: { type: string, enum: [error, warning, info] }
              detail: { type: string }
          }
        }
```

### 4. Atualizar o FilePreview para exibir violacoes detalhadas

No componente `FilePreview.tsx`, ao exibir as notas de compliance, renderizar tambem a lista de violacoes individuais quando disponivel, mostrando a regra violada e o detalhe.

### 5. Atualizar o wizard-store para armazenar violacoes

Expandir o tipo de `complianceResults` no store para incluir o array de `violations` opcional.

## Arquivos impactados

| Arquivo | Acao |
|---------|------|
| `supabase/functions/aios-compliance-review/index.ts` | Reescrever prompt, atualizar modelo, expandir tool schema |
| `src/components/wizard/FilePreview.tsx` | Renderizar lista de violacoes detalhadas |
| `src/stores/wizard-store.ts` | Expandir tipo de complianceResults para incluir violations |

## Detalhes tecnicos

- O prompt e longo mas necessario para validacao precisa — o modelo `gemini-2.5-flash` suporta contextos grandes
- A cross-validation entre arquivos e feita pela IA analisando todos os arquivos simultaneamente (ja enviados no payload atual)
- Nenhuma dependencia nova e necessaria
- O campo `violations` e opcional para manter compatibilidade retroativa com resultados existentes
