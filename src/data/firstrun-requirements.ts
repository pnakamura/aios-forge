export type FirstRunSection =
  | 'prerequisites'
  | 'setup'
  | 'first_value'
  | 'integrations'
  | 'observability';

export interface FirstRunItem {
  id: string;
  section: FirstRunSection;
  title: string;
  description: string;
  verifyCommand?: string;
  isConditional: boolean;
  conditionType?: 'N8N' | 'CLAUDE_API' | 'MCP_SERVER' | 'NOTION' | 'MIRO';
}

export const FIRSTRUN_SECTIONS: { id: FirstRunSection; title: string; emoji: string }[] = [
  { id: 'prerequisites', title: 'Pré-requisitos', emoji: '🔧' },
  { id: 'setup', title: 'Setup Inicial', emoji: '📦' },
  { id: 'first_value', title: 'Validação de First-Value (≤ 10 min)', emoji: '🚀' },
  { id: 'integrations', title: 'Integrações', emoji: '🔌' },
  { id: 'observability', title: 'Observabilidade (Opcional)', emoji: '📊' },
];

export const FIRSTRUN_ITEMS: FirstRunItem[] = [
  // Prerequisites
  { id: 'prereq-node', section: 'prerequisites', title: 'Node.js 18+ instalado', description: 'Necessário para executar o runtime AIOS.', verifyCommand: 'node --version', isConditional: false },
  { id: 'prereq-npm', section: 'prerequisites', title: 'npm 9+ disponível', description: 'Gerenciador de pacotes para instalar dependências.', verifyCommand: 'npm --version', isConditional: false },
  { id: 'prereq-ide', section: 'prerequisites', title: 'IDE compatível instalada', description: 'Claude Code, Cursor, Codex CLI ou Gemini CLI.', isConditional: false },
  { id: 'prereq-apikey', section: 'prerequisites', title: 'API Key Anthropic válida', description: 'Necessária para os agentes Claude funcionarem.', isConditional: false },

  // Setup
  { id: 'setup-extract', section: 'setup', title: 'Extrair o pacote ZIP', description: 'Extraia o conteúdo em um diretório de sua escolha.', isConditional: false },
  { id: 'setup-install', section: 'setup', title: 'Instalar dependências', description: 'Execute o comando de instalação na raiz do projeto.', verifyCommand: 'npm install', isConditional: false },
  { id: 'setup-env', section: 'setup', title: 'Configurar .env', description: 'Copie .env.example para .env e preencha suas API keys.', verifyCommand: 'cp .env.example .env', isConditional: false },
  { id: 'setup-validate', section: 'setup', title: 'Validar instalação', description: 'Execute o doctor para verificar a integridade do projeto.', verifyCommand: 'npm run validate', isConditional: false },

  // First Value
  { id: 'fv-activate', section: 'first_value', title: 'Ativar um agente na IDE', description: 'Abra a IDE e ative um agente (ex: @dev). Deve receber o greeting.', isConditional: false },
  { id: 'fv-greeting', section: 'first_value', title: 'Confirmar greeting do agente', description: 'O agente deve responder com sua apresentação e papel.', isConditional: false },
  { id: 'fv-help', section: 'first_value', title: 'Executar *help', description: 'Rode o comando *help e verifique a lista de comandos disponíveis.', verifyCommand: '*help', isConditional: false },

  // Integrations (conditional)
  { id: 'int-n8n', section: 'integrations', title: 'Testar conectividade N8N', description: 'Verificar que a instância N8N responde e os workflows estão acessíveis.', isConditional: true, conditionType: 'N8N' },
  { id: 'int-notion', section: 'integrations', title: 'Testar conectividade Notion', description: 'Verificar que o token Notion é válido e as páginas estão acessíveis.', isConditional: true, conditionType: 'NOTION' },
  { id: 'int-miro', section: 'integrations', title: 'Testar conectividade Miro', description: 'Verificar que o token Miro é válido e os boards estão acessíveis.', isConditional: true, conditionType: 'MIRO' },
  { id: 'int-mcp', section: 'integrations', title: 'Testar MCP Servers', description: 'Verificar que os servidores MCP customizados respondem e listam ferramentas.', isConditional: true, conditionType: 'MCP_SERVER' },

  // Observability
  { id: 'obs-dashboard', section: 'observability', title: 'Instalar AIOS Dashboard', description: 'Clone e configure o AIOS Dashboard para monitoramento.', isConditional: false },
];

export function getActiveFirstRunItems(configuredIntegrations: string[]): FirstRunItem[] {
  return FIRSTRUN_ITEMS.filter(item => {
    if (!item.isConditional) return true;
    return item.conditionType && configuredIntegrations.includes(item.conditionType);
  });
}
