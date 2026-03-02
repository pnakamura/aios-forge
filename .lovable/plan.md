

# Geracao de Agentes no Padrao @aios-master v4.2.13

## Resumo

Atualizar a geracao de arquivos de agentes no pacote ZIP para seguir o padrao Synkra AIOS v4.2.13, incluindo `persona_profile`, `commands` estruturados com visibilidade, `dependencies`, e geracao de arquivos `.agent.ts`.

## Mudancas

### 1. Atualizar `generateAgentMd` em `src/lib/generate-aios-package.ts`

O formato atual e simples (frontmatter YAML + sections). O novo formato segue o padrao `aios-master.md` com:

- **persona_profile**: nome, papel, estilo de comunicacao, constraints
- **commands**: cada comando com nome, visibilidade (`full`/`quick`/`key`), descricao
- **dependencies**: agentes dos quais depende, squads aos quais pertence, servicos
- **context**: quando e como o agente deve ser ativado

A funcao passara a receber tambem `squads` e `project` para enriquecer o contexto.

```text
# agents/aios-master.md

---
agent: "AIOS Master"
slug: "aios-master"
version: "1.0.0"
squad: "core"
model: "gemini-2.0-flash"
---

## persona_profile

| Campo       | Valor                                          |
|-------------|------------------------------------------------|
| name        | AIOS Master                                    |
| role        | Orquestrador principal do sistema AIOS         |
| style       | Direto, tecnico, orientado a resultados        |
| visibility  | full                                           |
| constraints | Nao executa tarefas diretamente; delega        |

## System Prompt

Voce e o AIOS Master, o orquestrador principal...

## Commands

| Comando       | Visibilidade | Descricao                              |
|---------------|-------------|----------------------------------------|
| *orchestrate  | full        | Orquestrar execucao de tarefa          |
| *delegate     | full        | Delegar tarefa para agente especifico  |
| *status       | quick       | Exibir status do sistema               |
| *plan         | full        | Criar plano de execucao                |

## Tools

- (lista de ferramentas)

## Skills

- (lista de skills)

## Dependencies

- **Squads**: core, desenvolvimento
- **Agents**: aios-orchestrator, dev, qa

## Context

Ativado na inicializacao do sistema. Responsavel por coordenar...
```

### 2. Adicionar `generateAgentTs` — novo gerador de `.agent.ts`

Para cada agente, gerar um arquivo `.agent.ts` dentro do pacote no diretorio `src/agents/`, seguindo o padrao do Knowledge File:

```text
// src/agents/AiosMaster.agent.ts

/**
 * @agent     AiosMaster
 * @persona   Orquestrador principal do sistema AIOS.
 *            Coordena todos os agentes, define roteamento
 *            de responsabilidades e mantem coerencia arquitetural.
 * @version   1.0.0
 * @squad     core
 * @commands  *orchestrate, *delegate, *status, *plan
 * @deps      aios-orchestrator, dev, qa
 * @context   Ativado na inicializacao do app. Define a arquitetura
 *            de squads e roteia requisicoes para o modulo correto.
 */

export const AiosMasterAgent = {
  name: 'AIOS Master',
  slug: 'aios-master',
  persona: 'Orquestrador principal do sistema AIOS',
  version: '1.0.0',
  squad: 'core',
  model: 'gemini-2.0-flash',

  commands: {
    '*orchestrate': { visibility: 'full', description: 'Orquestrar execucao' },
    '*delegate': { visibility: 'full', description: 'Delegar tarefa' },
    '*status': { visibility: 'quick', description: 'Status do sistema' },
    '*plan': { visibility: 'full', description: 'Criar plano' },
  },

  context: 'Ativado na inicializacao do sistema...',
} as const;

export type AiosMasterCommands = keyof typeof AiosMasterAgent.commands;
```

### 3. Gerar `AppMaster.agent.ts` — agente raiz do projeto

Um arquivo especial `src/agents/AppMaster.agent.ts` que serve como orquestrador raiz, listando todos os squads e agentes do projeto. Gerado uma unica vez com base nos dados do wizard:

```text
/**
 * @agent     AppMaster
 * @persona   Orquestrador principal do [NOME_PROJETO].
 *            Coordena todos os modulos, define o roteamento de
 *            responsabilidades e mantem a coerencia arquitetural.
 * @version   1.0.0
 * @squad     core
 * @commands  navigate, orchestrate, loadModule, validateContext
 * @deps      todos os agents de squad
 * @context   Ativado na inicializacao do app.
 */

export const AppMasterAgent = {
  name: 'AppMaster',
  ...
  squads: { ... }, // mapeamento de todos os squads
} as const;
```

### 4. Registrar novos geradores no `generateAiosPackage`

Na funcao principal, adicionar chamadas para:
- `generateAgentTs(agent, squads)` dentro do loop de agentes (linha 28-31)
- `generateAppMasterAgent(name, project, agents, squads)` apos o loop

### 5. Atualizar assinatura de `generateAgentMd`

Passar `squads` e `project` como parametros adicionais para enriquecer as secoes Dependencies e Context.

## Arquivos impactados

| Arquivo | Acao |
|---------|------|
| `src/lib/generate-aios-package.ts` | Reescrever `generateAgentMd`, adicionar `generateAgentTs` e `generateAppMasterAgent` |

## Detalhes tecnicos

- A funcao `generateAgentMd` atual (linhas 197-234) sera substituida pela versao enriquecida
- Cada comando tera visibilidade inferida: comandos com `*` prefixo sao `full`, exceto `*status`/`*help` que sao `quick`
- O slug do squad ao qual o agente pertence sera buscado em `squads.find(s => s.agentIds.includes(agent.slug))`
- O PascalCase do nome do agente para o `.agent.ts` sera derivado do slug com conversao (`aios-master` -> `AiosMaster`)
- Nenhuma dependencia nova e necessaria
