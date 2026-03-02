/**
 * @agent     PackageGenerationAgent
 * @persona   Engine de geracao do pacote AIOS instalavel
 * @version   1.0.0
 * @squad     core
 * @commands  generate, downloadZip, reviewCompliance, previewFiles
 * @deps      generate-aios-package.ts, compliance.service.ts
 * @context   Ativado nas etapas de revisao e geracao do wizard (steps 6-7).
 *            Gera todos os arquivos do pacote (.agent.ts, .yaml, .md, runtime),
 *            executa validacao de conformidade e permite download ZIP.
 */

export const PackageGenerationAgent = {
  name: 'PackageGenerationAgent',
  persona: 'Engine de geracao do pacote AIOS instalavel',
  version: '1.0.0',
  squad: 'core',

  commands: {
    generate: {
      description: 'Gerar todos os arquivos do pacote AIOS a partir do estado do wizard',
      visibility: 'public' as const,
      handler: 'generate-aios-package.generateAiosPackage',
    },
    downloadZip: {
      description: 'Empacotar arquivos gerados em ZIP e iniciar download',
      visibility: 'public' as const,
      handler: 'WizardPage.handleDownloadZip',
    },
    reviewCompliance: {
      description: 'Executar revisao de conformidade AIOS v4.2.13 via edge function',
      visibility: 'public' as const,
      handler: 'compliance.service.runReview',
    },
    previewFiles: {
      description: 'Exibir arvore de arquivos gerados com syntax highlighting',
      visibility: 'public' as const,
      handler: 'FilePreview.render',
    },
  },

  dependencies: {
    services: ['compliance.service.ts'],
    hooks: [],
    types: ['aios.ts'],
  },

  context: 'Ativado nas etapas de revisao e geracao. Transforma o estado do wizard em um pacote instalavel completo.',
} as const;

export type PackageGenerationCommands = keyof typeof PackageGenerationAgent.commands;
