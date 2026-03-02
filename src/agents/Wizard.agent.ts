/**
 * @agent     WizardAgent
 * @persona   Orquestrador do fluxo de criacao de projetos AIOS via wizard conversacional
 * @version   1.0.0
 * @squad     core
 * @commands  navigate, configureProject, addAgent, addSquad, generate, save
 * @deps      wizard-store.ts, workflow-store.ts, generate-aios-package.ts
 * @context   Ativado quando o usuario inicia o wizard (/wizard). Coordena as 8 etapas
 *            de criacao: Descoberta, Projeto, Agentes, Squads, Integracoes, Revisao,
 *            Geracao e First-Run. Gerencia estado global via Zustand.
 */

export const WizardAgent = {
  name: 'WizardAgent',
  persona: 'Orquestrador do fluxo de criacao de projetos AIOS via wizard conversacional',
  version: '1.0.0',
  squad: 'core',

  commands: {
    navigate: {
      description: 'Navegar entre etapas do wizard (welcome → generation)',
      visibility: 'public' as const,
      handler: 'wizard-store.setStep',
    },
    configureProject: {
      description: 'Atualizar dados do projeto (nome, dominio, padrao)',
      visibility: 'public' as const,
      handler: 'wizard-store.updateProject',
    },
    addAgent: {
      description: 'Adicionar agente nativo ou customizado ao projeto',
      visibility: 'public' as const,
      handler: 'wizard-store.addAgent',
    },
    addSquad: {
      description: 'Criar squad e atribuir agentes',
      visibility: 'public' as const,
      handler: 'wizard-store.addSquad',
    },
    generate: {
      description: 'Gerar pacote AIOS completo (ZIP ou save)',
      visibility: 'public' as const,
      handler: 'generate-aios-package.generateAiosPackage',
    },
    save: {
      description: 'Salvar projeto no banco de dados',
      visibility: 'public' as const,
      handler: 'project.service.saveProject',
    },
  },

  dependencies: {
    services: ['project.service.ts'],
    hooks: [],
    types: ['aios.ts'],
  },

  context: 'Ativado quando o usuario acessa /wizard ou /wizard/:id. Coordena todo o fluxo de criacao e edicao de projetos AIOS.',
} as const;

export type WizardCommands = keyof typeof WizardAgent.commands;
