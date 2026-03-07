/**
 * @agent     EditorFieldHelp
 * @persona   Registro centralizado de ajuda contextual para campos dos formularios do editor
 * @version   1.0.0
 * @context   Consumido pelo componente FieldHelp para exibir descricao, relacionamentos e exemplos.
 */

import type { LibraryEntityType } from '@/types/library';

export interface FieldHelpData {
  description: string;
  relationships?: string[];
  example?: string;
}

export const FIELD_HELP: Record<LibraryEntityType, Record<string, FieldHelpData>> = {
  agent: {
    name: {
      description: 'Nome legivel do agente. Aparece no catalogo, listas e cabecalhos.',
      relationships: ['Usado no AGENT.md gerado', 'Exibido em squads que referenciam este agente'],
      example: 'Code Reviewer\nDevOps Engineer\nUX Research Analyst',
    },
    slug: {
      description: 'Identificador unico em kebab-case. Usado internamente para referenciar o agente em squads, workflows e configuracoes.',
      relationships: ['Referenciado por squads no campo agentSlugs', 'Usado em steps de workflows como agentSlug', 'Define a pasta agents/<slug>/ no pacote gerado'],
      example: 'code-reviewer\naios-developer\nux-research-analyst',
    },
    role: {
      description: 'Papel ou titulo profissional do agente. Define a persona e escopo de atuacao.',
      relationships: ['Aparece no cabecalho do AGENT.md', 'Influencia o system prompt gerado por IA'],
      example: 'Senior Code Reviewer\nStaff DevOps Engineer\nLead UX Researcher',
    },
    category: {
      description: 'Classificacao funcional do agente para organizacao no catalogo.',
      relationships: ['Filtravel na Library', 'Define o grupo no catalogo do wizard'],
      example: 'Meta, Planejamento, Desenvolvimento, Infraestrutura ou Custom',
    },
    description: {
      description: 'Descricao curta para exibicao em cards e listas. Maximo recomendado: 140 caracteres.',
      relationships: ['Exibida no card da Library', 'Usada na busca textual'],
      example: 'Revisa codigo-fonte com foco em seguranca, performance e aderencia a padroes.',
    },
    systemPrompt: {
      description: 'Instrucao principal enviada ao LLM. Define comportamento, restricoes e formato de saida do agente.',
      relationships: ['Incluido no AGENT.md como bloco de prompt', 'Consumido pelo agent-runner em runtime'],
      example: '# ROLE\nVoce e um Code Reviewer senior...\n\n# CONTEXT\nAnalise PRs em repositorios TypeScript...\n\n# CONSTRAINTS\n- Nunca aprove sem testes\n- Sugira refatoracoes quando complexidade > 10',
    },
    llmModel: {
      description: 'Modelo de IA que executara este agente. Afeta custo, velocidade e qualidade das respostas.',
      relationships: ['Definido no aios.config.yaml do pacote', 'Pode ser sobrescrito por squad em runtime'],
    },
    commands: {
      description: 'Acoes que o agente pode executar. Cada comando tem nome, descricao, handler e visibilidade.',
      relationships: ['Listados na secao @commands do AGENT.md', 'Invocaveis pelo orquestrador via *nome-do-comando', 'Podem ser filtrados por visibilidade (public/internal/admin)'],
      example: 'Nome: *review-pr\nDescricao: Analisa um Pull Request\nHandler: review-handler\nVisibilidade: public',
    },
    tools: {
      description: 'Ferramentas externas que o agente pode utilizar (APIs, CLIs, integrações).',
      relationships: ['Declaradas no tools.yaml do agente', 'Devem existir como dependencia no projeto ou integracao configurada'],
      example: 'github-api\neslint-runner\nsonarqube-scanner',
    },
    skills: {
      description: 'Skills reutilizaveis vinculadas a este agente. Cada skill e um prompt especializado com inputs/outputs definidos.',
      relationships: ['Referenciadas pelo slug da skill na Library', 'Executadas como sub-tarefas pelo agente'],
      example: 'code-analysis\nsecurity-audit\nperformance-review',
    },
    visibility: {
      description: 'Nivel de detalhe na exibicao do agente em diferentes contextos.',
      relationships: ['Afeta como o agente aparece em resumos de squad'],
    },
    tags: {
      description: 'Etiquetas para categorizacao e filtragem. Use termos curtos e consistentes.',
      relationships: ['Filtraveis na Library', 'Pesquisaveis na busca global'],
      example: 'security, typescript, code-review, ci-cd',
    },
    isPublic: {
      description: 'Se marcado, o elemento fica visivel para todos os usuarios da plataforma.',
      relationships: ['Afeta visibilidade na Library publica', 'Permite fork por outros usuarios'],
    },
  },

  skill: {
    name: {
      description: 'Nome legivel da skill. Exibido no catalogo e em vinculos com agentes.',
      relationships: ['Aparece no card da Library', 'Referenciada por agentes na lista de skills'],
      example: 'Code Analysis\nSecurity Audit\nPEP Compliance Check',
    },
    slug: {
      description: 'Identificador unico em kebab-case. Usado para vincular skills a agentes.',
      relationships: ['Referenciado no campo skills[] dos agentes', 'Define a pasta skills/<slug>/ no pacote'],
      example: 'code-analysis\nsecurity-audit\npep-compliance-check',
    },
    description: {
      description: 'Descricao curta da skill para exibicao em cards e listas.',
      relationships: ['Exibida no card da Library', 'Incluida no SKILL.md gerado'],
      example: 'Analisa codigo TypeScript e retorna um relatorio com vulnerabilidades e sugestoes.',
    },
    category: {
      description: 'Classificacao da skill por dominio funcional.',
      relationships: ['Filtravel na Library', 'Agrupa skills similares no catalogo'],
      example: 'analysis, coding, communication, research, general',
    },
    prompt: {
      description: 'Instrucao detalhada da skill. Define o objetivo, restricoes e formato do output esperado.',
      relationships: ['Executado pelo agente como sub-tarefa', 'Recebe os inputs definidos como variaveis'],
      example: '# OBJECTIVE\nAnalise o codigo fornecido e identifique:\n- Vulnerabilidades de seguranca\n- Code smells\n\n# CONSTRAINTS\n- Priorize severidade alta\n- Use formato SARIF no output',
    },
    inputs: {
      description: 'Parametros de entrada da skill. Cada input tem nome, tipo, descricao e flag de obrigatoriedade.',
      relationships: ['Passados pelo agente ao invocar a skill', 'Validados antes da execucao'],
      example: 'Nome: source_code | Tipo: code | Obrigatorio: sim\nNome: language | Tipo: string | Obrigatorio: nao',
    },
    outputs: {
      description: 'Resultados retornados pela skill. Cada output tem nome, tipo e descricao.',
      relationships: ['Consumidos pelo agente apos execucao', 'Podem alimentar inputs de outras skills em workflows'],
      example: 'Nome: report | Tipo: json | Descricao: Relatorio de analise\nNome: score | Tipo: string | Descricao: Nota de 0-100',
    },
    examples: {
      description: 'Casos de uso demonstrando input/output da skill. Ajudam o LLM a calibrar a resposta.',
      relationships: ['Incluidos no SKILL.md como few-shot examples', 'Usados na validacao de conformidade'],
      example: 'Titulo: Analise de arquivo simples\nInput: const x = eval(userInput);\nOutput: { "severity": "critical", "rule": "no-eval" }',
    },
    tags: {
      description: 'Etiquetas para categorizacao e filtragem.',
      relationships: ['Filtraveis na Library', 'Pesquisaveis na busca'],
      example: 'security, typescript, analysis, compliance',
    },
    isPublic: {
      description: 'Se marcado, a skill fica visivel para todos os usuarios.',
      relationships: ['Afeta visibilidade na Library publica'],
    },
  },

  squad: {
    name: {
      description: 'Nome do squad. Representa uma equipe de agentes com objetivo compartilhado.',
      relationships: ['Exibido no diagrama de arquitetura', 'Aparece no card da Library'],
      example: 'Security Review Team\nFrontend Development Squad\nCompliance Audit Team',
    },
    slug: {
      description: 'Identificador unico em kebab-case para o squad.',
      relationships: ['Define a pasta squads/<slug>/ no pacote gerado', 'Referenciado por workflows no campo squad_id'],
      example: 'security-review-team\nfrontend-dev\ncompliance-audit',
    },
    description: {
      description: 'Descricao do proposito e escopo do squad.',
      relationships: ['Incluida no squad.yaml e README.md', 'Exibida no card da Library'],
      example: 'Equipe responsavel por revisao de seguranca de codigo, auditoria de dependencias e compliance com politicas PEP.',
    },
    agentSlugs: {
      description: 'Slugs dos agentes que compoem este squad. Use slugs existentes no projeto.',
      relationships: ['Cada slug deve corresponder a um agente registrado', 'Agentes aparecem como nos no diagrama de arquitetura conectados ao squad'],
      example: 'code-reviewer\nsecurity-auditor\naios-developer',
    },
    tasks: {
      description: 'Tarefas que o squad deve executar. Cada task e atribuida a um agente e pode ter dependencias.',
      relationships: ['Executadas pelo orquestrador na ordem definida por dependencias', 'Agente responsavel deve estar em agentSlugs'],
      example: 'Nome: Revisar PR | Agente: code-reviewer | Deps: []\nNome: Auditoria de seguranca | Agente: security-auditor | Deps: [Revisar PR]',
    },
    taskDependencies: {
      description: 'Nomes de outras tasks que devem ser concluidas antes desta. Define a ordem de execucao.',
      relationships: ['Cria grafo de dependencias entre tasks', 'Usado pelo orquestrador para scheduling'],
      example: 'Revisar PR, Lint Check',
    },
    workflows: {
      description: 'Workflows vinculados a este squad (opcional).',
      relationships: ['Workflows podem referenciar o squad pelo slug'],
    },
    tags: {
      description: 'Etiquetas para categorizacao e filtragem.',
      relationships: ['Filtraveis na Library'],
      example: 'security, review, compliance',
    },
    isPublic: {
      description: 'Se marcado, o squad fica visivel para todos os usuarios.',
      relationships: ['Afeta visibilidade na Library publica'],
    },
  },

  workflow: {
    name: {
      description: 'Nome do workflow. Descreve o processo ou pipeline automatizado.',
      relationships: ['Exibido no card da Library', 'Aparece no select de workflows do squad'],
      example: 'PR Review Pipeline\nDeploy Staging\nCompliance Check Flow',
    },
    slug: {
      description: 'Identificador unico em kebab-case para o workflow.',
      relationships: ['Referenciado por squads', 'Define o namespace no pacote gerado'],
      example: 'pr-review-pipeline\ndeploy-staging\ncompliance-check',
    },
    description: {
      description: 'Descricao do objetivo e funcionamento do workflow.',
      relationships: ['Incluida na documentacao gerada', 'Exibida no card da Library'],
      example: 'Pipeline que analisa PRs abertos, executa revisao de codigo, verifica seguranca e gera relatorio consolidado.',
    },
    pattern: {
      description: 'Padrao de execucao dos steps do workflow.',
      relationships: ['Determina como o orquestrador agenda os steps', 'Afeta performance e paralelismo'],
      example: 'Sequential — steps executam em sequencia\nParallel — steps executam simultaneamente\nConditional — steps executam baseado em condicoes',
    },
    steps: {
      description: 'Etapas do workflow. Cada step define um agente, task e condicao de saida.',
      relationships: ['Agente (agentSlug) deve existir no projeto', 'Ordem importa no pattern sequential', 'exitCondition define quando o step e considerado completo'],
      example: 'Nome: Code Review | Agente: code-reviewer | Task: Revisar arquivos alterados | Saida: Relatorio sem criticos',
    },
    triggers: {
      description: 'Eventos que iniciam a execucao do workflow.',
      relationships: ['Configurados no aios.config.yaml', 'Tipos: manual, event, schedule, webhook'],
      example: 'Tipo: event | Desc: Novo PR aberto no repositorio\nTipo: schedule | Desc: Todo dia as 09:00\nTipo: webhook | Desc: POST /api/trigger/compliance',
    },
    outputs: {
      description: 'Resultados finais produzidos pelo workflow apos todos os steps completarem.',
      relationships: ['Podem ser consumidos por outros workflows', 'Registrados no log de execucao'],
      example: 'Nome: review_report | Tipo: json | Desc: Relatorio consolidado\nNome: approval_status | Tipo: string | Desc: approved/rejected',
    },
    tags: {
      description: 'Etiquetas para categorizacao e filtragem.',
      relationships: ['Filtraveis na Library'],
      example: 'pipeline, ci-cd, review, automation',
    },
    isPublic: {
      description: 'Se marcado, o workflow fica visivel para todos os usuarios.',
      relationships: ['Afeta visibilidade na Library publica'],
    },
  },
};
