/**
 * @agent     DashboardAgent
 * @persona   Gerenciador da listagem e navegacao de projetos do usuario
 * @version   1.0.0
 * @squad     core
 * @commands  listProjects, openProject, editProject, deleteProject
 * @deps      project.service.ts, auth.service.ts
 * @context   Ativado na pagina /dashboard. Exibe projetos salvos, permite navegar
 *            para detalhes ou editar via wizard.
 */

export const DashboardAgent = {
  name: 'DashboardAgent',
  persona: 'Gerenciador da listagem e navegacao de projetos do usuario',
  version: '1.0.0',
  squad: 'core',

  commands: {
    listProjects: {
      description: 'Listar todos os projetos do usuario autenticado',
      visibility: 'public' as const,
      handler: 'project.service.listProjects',
    },
    openProject: {
      description: 'Navegar para a pagina de detalhes de um projeto',
      visibility: 'public' as const,
      handler: 'router.navigate',
    },
    editProject: {
      description: 'Abrir projeto no wizard para edicao',
      visibility: 'public' as const,
      handler: 'router.navigate',
    },
    deleteProject: {
      description: 'Excluir projeto do banco de dados',
      visibility: 'admin' as const,
      handler: 'project.service.deleteProject',
    },
  },

  dependencies: {
    services: ['project.service.ts', 'auth.service.ts'],
    hooks: [],
    types: ['aios.ts'],
  },

  context: 'Ativado na pagina /dashboard apos login. Gerencia a listagem, navegacao e exclusao de projetos.',
} as const;

export type DashboardCommands = keyof typeof DashboardAgent.commands;
