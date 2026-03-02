/**
 * @agent     AuthAgent
 * @persona   Gerenciador de autenticacao e sessao do usuario
 * @version   1.0.0
 * @squad     core
 * @commands  login, signup, logout, checkSession
 * @deps      auth.service.ts
 * @context   Ativado nas paginas de autenticacao (/auth) e verificacao de sessao
 *            em rotas protegidas (/dashboard, /wizard, /project).
 */

export const AuthAgent = {
  name: 'AuthAgent',
  persona: 'Gerenciador de autenticacao e sessao do usuario',
  version: '1.0.0',
  squad: 'core',

  commands: {
    login: {
      description: 'Autenticar usuario com email e senha',
      visibility: 'public' as const,
      handler: 'auth.service.signIn',
    },
    signup: {
      description: 'Criar nova conta de usuario',
      visibility: 'public' as const,
      handler: 'auth.service.signUp',
    },
    logout: {
      description: 'Encerrar sessao do usuario',
      visibility: 'public' as const,
      handler: 'auth.service.signOut',
    },
    checkSession: {
      description: 'Verificar se ha sessao ativa e redirecionar se necessario',
      visibility: 'internal' as const,
      handler: 'auth.service.getSession',
    },
  },

  dependencies: {
    services: ['auth.service.ts'],
    hooks: [],
    types: [],
  },

  context: 'Ativado na pagina /auth para login/signup e em rotas protegidas para verificacao de sessao.',
} as const;

export type AuthCommands = keyof typeof AuthAgent.commands;
