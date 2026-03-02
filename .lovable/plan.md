

# Guardrails de Correcao de Rota — Padrao @aios-master v4.2.13

## Resumo

Integrar os 5 guardrails (A-E) ao sistema de compliance review para que o agente IA identifique e classifique violacoes usando as categorias especificas dos guardrails, fornecendo instrucoes de correcao acionaveis no relatorio.

## Mudancas

### 1. Expandir o system prompt da edge function com os guardrails

**Arquivo:** `supabase/functions/aios-compliance-review/index.ts`

Adicionar ao final do system prompt existente uma secao "GUARDRAILS DE CORRECAO" com as 5 categorias. Cada violacao encontrada devera ser classificada com o guardrail correspondente no campo `rule`:

```text
GUARDRAILS DE CORRECAO DE ROTA:

Ao encontrar violacoes, classifique cada uma com o guardrail correspondente:

GUARDRAIL_A (missing_agent_header):
Arquivo sem header @agent completo no topo. Campos obrigatorios:
@agent, @persona, @version, @squad, @commands, @deps, @context.
Na correcao, indique exatamente quais campos estao faltando.

GUARDRAIL_B (business_logic_in_component):
Componente UI contendo logica de negocio (chamadas de API, acesso a
banco, processamento de dados). Violacao do principio Agent Authority.
Na correcao, indique a separacao correta: service para logica,
hook para estado, componente apenas para apresentacao.

GUARDRAIL_C (uninstructed_feature):
Arquivo contendo funcionalidades nao declaradas no @context do agente.
Violacao do principio No Invention. Na correcao, liste os elementos
que excedem o escopo do @context.

GUARDRAIL_D (wrong_file_location):
Arquivo criado fora da estrutura de pastas obrigatoria:
src/agents/ -> .agent.ts
src/components/[Dominio]/ -> componentes UI
src/hooks/ -> React hooks
src/services/ -> camada de servico
src/types/ -> interfaces
src/pages/ -> paginas
src/utils/ -> utilitarios
Na correcao, indique o caminho correto.

GUARDRAIL_E (audit_inconsistency):
Inconsistencia detectada na auditoria cruzada: @persona vazio ou
generico, campos obrigatorios faltando por tipo de arquivo, comandos
inconsistentes entre .md/.yaml/.agent.ts do mesmo agente.
```

### 2. Expandir o tool schema com campo `guardrail`

No schema do tool `validate_files`, adicionar o campo `guardrail` ao objeto de violation:

```text
violations.items.properties:
  rule: string
  severity: error | warning | info
  detail: string
  guardrail: string (enum: GUARDRAIL_A, GUARDRAIL_B, GUARDRAIL_C,
                      GUARDRAIL_D, GUARDRAIL_E, NONE)
  fix_instruction: string (instrucao de correcao especifica)
```

### 3. Atualizar tipo no wizard-store

**Arquivo:** `src/stores/wizard-store.ts`

Expandir o tipo de violations para incluir os novos campos:

```text
violations?: {
  rule: string;
  severity: string;
  detail: string;
  guardrail?: string;
  fix_instruction?: string;
}[]
```

### 4. Atualizar FilePreview para exibir guardrails e instrucoes de correcao

**Arquivo:** `src/components/wizard/FilePreview.tsx`

Na secao de violacoes detalhadas, alem do `[rule]` e `detail` ja exibidos:
- Exibir um badge colorido com o guardrail (A-E) quando presente
- Exibir `fix_instruction` como bloco de texto com fundo diferenciado, mostrando a instrucao de correcao sugerida pelo agente IA
- Agrupar violacoes por guardrail quando houver multiplas do mesmo tipo

### 5. Redesplegar a edge function

Deplegar `aios-compliance-review` apos as mudancas.

## Arquivos impactados

| Arquivo | Acao |
|---------|------|
| `supabase/functions/aios-compliance-review/index.ts` | Expandir prompt com guardrails, adicionar campos ao tool schema |
| `src/stores/wizard-store.ts` | Expandir tipo de violations com guardrail e fix_instruction |
| `src/components/wizard/FilePreview.tsx` | Renderizar badges de guardrail e instrucoes de correcao |

## Detalhes tecnicos

- Os guardrails B e C sao mais relevantes para arquivos `.agent.ts` e componentes gerados; o guardrail A se aplica a todos os arquivos `.ts`/`.tsx`
- O guardrail D valida caminhos de arquivo contra a estrutura canonica — o agente IA analisa o `path` de cada arquivo
- O guardrail E e a auditoria cruzada que ja existe no prompt, agora categorizada explicitamente
- O campo `guardrail` e opcional (`NONE` para violacoes que nao se encaixam em nenhum guardrail especifico)
- Nenhuma dependencia nova

