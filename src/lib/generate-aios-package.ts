/**
 * @agent     GenerateAiosPackage
 * @persona   Engine de geracao de arquivos do pacote AIOS instalavel
 * @version   1.0.0
 * @commands  generateAiosPackage
 * @deps      aios.ts, orchestration-patterns.ts
 * @context   Chamado nas etapas de revisao e geracao do wizard para produzir o pacote completo.
 */

import { AiosAgent, AiosSquad, AiosProject, GeneratedFile, OrchestrationPatternType, ProjectWorkflow } from '@/types/aios';
import { ORCHESTRATION_PATTERNS } from '@/data/orchestration-patterns';

type IntegrationType = 'N8N' | 'CLAUDE_API' | 'MCP_SERVER' | 'NOTION' | 'MIRO' | 'OPENAI_API';

interface ConfiguredIntegration {
  type: IntegrationType;
  config?: Record<string, unknown>;
}

interface GenerationInput {
  project: Partial<AiosProject>;
  agents: AiosAgent[];
  squads: AiosSquad[];
  workflows?: ProjectWorkflow[];
  integrations?: ConfiguredIntegration[];
  complianceResults?: Record<string, { status: string; notes: string }>;
}

/**
 * Generates a complete, installable AIOS package with all necessary
 * configuration, runtime scaffolding, and documentation files.
 */
export function generateAiosPackage(input: GenerationInput): GeneratedFile[] {
  const { project, agents, squads, workflows = [], integrations = [], complianceResults } = input;
  const files: GeneratedFile[] = [];
  const name = project.name || 'meu-aios';
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const pattern = project.orchestrationPattern || 'TASK_FIRST';
  const patternInfo = ORCHESTRATION_PATTERNS.find(p => p.id === pattern);

  // ── Core config ──────────────────────────────────────────────
  files.push(generateAiosConfig(name, project, agents, squads, workflows, pattern));

  // ── Agent definitions ────────────────────────────────────────
  agents.forEach(agent => {
    files.push(generateAgentMd(agent, squads, project));
    files.push(generateAgentConfig(agent));
    files.push(generateAgentTs(agent, squads, project));
  });

  // ── App Master agent (root orchestrator) ────────────────────
  files.push(generateAppMasterAgent(name, project, agents, squads, workflows));

  // ── Squad manifests ──────────────────────────────────────────
  squads.forEach(squad => {
    files.push(generateSquadYaml(squad, agents));
    files.push(generateSquadReadme(squad, agents));
  });

  // ── Workflow definitions ──────────────────────────────────────
  workflows.forEach(wf => {
    files.push(generateWorkflowYaml(wf, agents));
  });

  // ── Runtime scaffolding ──────────────────────────────────────
  files.push(generatePackageJson(slug, name, agents));
  files.push(generateTsConfig());
  files.push(generateMainEntryPoint(name, pattern, agents, squads, workflows));
  files.push(generateOrchestratorEngine(pattern, agents, squads));
  files.push(generateAgentRunner());
  files.push(generateLogger());
  files.push(generateTypes(agents, squads));

  // ── Integration & environment ────────────────────────────────
  files.push(generateEnvExample(project, integrations));
  files.push(generateEnvValidator());
  files.push(generateValidateScript(agents));
  files.push(generateDockerfile(slug));
  files.push(generateDockerCompose(slug));
  files.push(generateDockerIgnore());

  // ── Documentation ────────────────────────────────────────────
  files.push(generateClaudeMd(name, slug, project, agents, squads, pattern, patternInfo));
  files.push(generateReadme(name, project, agents, squads, patternInfo));
  files.push(generateInstallationManual(name, slug, project, agents, squads, pattern, patternInfo));
  files.push(generateSetupGuide(name, agents));
  files.push(generateArchitectureDoc(name, pattern, agents, squads, patternInfo));

  // ── Institutional Memory (.aios/) ───────────────────────────
  files.push(generateProjectStatus(name, pattern));
  files.push(generateDecisionsJson());
  files.push(generateCodebaseMap(agents, squads, workflows));

  // ── Story-Driven structure ─────────────────────────────────
  files.push(generateStoryTemplate());

  // ── CI / Scripts ─────────────────────────────────────────────
  files.push(generateGitignore());
  files.push(generateSetupScript(slug));

  // ── First-Run checklist ──────────────────────────────────────
  files.push(generateFirstRunMd(name, slug, project, agents, squads, integrations));

  // ── Apply compliance results ─────────────────────────────────
  if (complianceResults) {
    files.forEach(f => {
      const result = complianceResults[f.path];
      if (result) {
        f.complianceStatus = result.status as GeneratedFile['complianceStatus'];
        f.complianceNotes = result.notes;
      }
    });
  }

  return files;
}

// ════════════════════════════════════════════════════════════════
// Individual file generators
// ════════════════════════════════════════════════════════════════

function generateWorkflowYaml(wf: ProjectWorkflow, agents: AiosAgent[]): GeneratedFile {
  const stepsYaml = wf.steps.length > 0
    ? wf.steps.map(s => {
        const agent = agents.find(a => a.slug === s.agentSlug);
        return `  - id: "${s.id}"
    name: "${s.name}"
    agent: "${s.agentSlug}"
    agent_name: "${agent?.name || s.agentSlug}"${s.taskId ? `\n    task_id: "${s.taskId}"` : ''}${s.condition ? `\n    condition: "${s.condition}"` : ''}${(s.dependsOn || []).length > 0 ? `\n    depends_on: [${s.dependsOn!.map(d => `"${d}"`).join(', ')}]` : ''}${s.timeout_ms ? `\n    timeout_ms: ${s.timeout_ms}` : ''}${s.retryPolicy ? `\n    retry_policy:\n      max_retries: ${s.retryPolicy.maxRetries}\n      backoff_ms: ${s.retryPolicy.backoffMs}` : ''}`;
      }).join('\n')
    : '  []';

  return {
    path: `workflows/${wf.slug}.yaml`,
    type: 'yaml',
    complianceStatus: 'pending',
    content: `# Workflow: ${wf.name}
name: "${wf.name}"
slug: "${wf.slug}"
description: "${wf.description || ''}"
trigger: "${wf.trigger}"
${wf.squadSlug ? `squad: "${wf.squadSlug}"` : ''}

steps:
${stepsYaml}
`,
  };
}

function generateAiosConfig(
  name: string,
  project: Partial<AiosProject>,
  agents: AiosAgent[],
  squads: AiosSquad[],
  workflows: ProjectWorkflow[],
  pattern: OrchestrationPatternType,
): GeneratedFile {
  return {
    path: 'aios.config.yaml',
    type: 'yaml',
    complianceStatus: 'pending',
    content: `# ══════════════════════════════════════════════════
# AIOS Configuration - ${name}
# Generated by AIOS Builder
# ══════════════════════════════════════════════════

name: "${name}"
version: "1.0.0"
domain: "${project.domain || 'software'}"
description: "${(project.description || '').replace(/"/g, '\\"')}"

# Orchestration
orchestration:
  pattern: "${pattern}"
  max_concurrent_tasks: ${pattern === 'PARALLEL_SWARM' ? 10 : pattern === 'SEQUENTIAL_PIPELINE' ? 1 : 5}
  retry_policy:
    max_retries: 3
    backoff_ms: 1000
  timeout_ms: 300000

# Framework Protection (required by npx aios-core doctor)
framework:
  frameworkProtection: true

# Agents
agents:
${agents.map(a => `  - slug: "${a.slug}"
    name: "${a.name}"
    role: "${a.role}"
    model: "${a.llmModel}"
    visibility: "${a.visibility}"
    config: "agents/${a.slug}.yaml"`).join('\n')}

# Squads
squads:
${squads.length > 0 ? squads.map(s => `  - slug: "${s.slug}"
    name: "${s.name}"
    config: "squads/${s.slug}/squad.yaml"
    agents: [${(s.agentIds || []).map(id => `"${id}"`).join(', ')}]`).join('\n') : '  []'}

# Logging
logging:
  level: "info"
  format: "json"
  output: "stdout"

# Workflows
workflows:
${workflows.length > 0 ? workflows.map(w => `  - slug: "${w.slug}"
    name: "${w.name}"
    trigger: "${w.trigger}"
    config: "workflows/${w.slug}.yaml"`).join('\n') : '  []'}

# Runtime
runtime:
  entry: "src/main.ts"
  engine: "node"
  min_version: "20.0.0"
`,
  };
}

function slugToPascal(slug: string): string {
  return slug
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

function inferCommandVisibility(cmd: string): 'full' | 'quick' | 'key' {
  const lower = cmd.replace(/^\*/, '').toLowerCase();
  if (['status', 'help', 'info', 'ping'].includes(lower)) return 'quick';
  return 'full';
}

function generateAgentMd(agent: AiosAgent, squads: AiosSquad[], project: Partial<AiosProject>): GeneratedFile {
  const agentSquad = squads.find(s => (s.agentIds || []).includes(agent.slug));
  const squadName = agentSquad?.name || 'core';
  const commands = agent.commands || [];
  const structured = agent.structuredCommands || [];
  const tools = agent.tools || [];
  const skills = agent.skills || [];
  const agentContext = agent.context || `Agente do projeto ${project.name || 'AIOS'}. Squad: ${squadName}. ${agent.role}`;

  // Use structured commands for richer table if available
  const commandsTable = structured.length > 0
    ? structured.map(c => `| ${c.name} | ${c.visibility} | ${c.description || '—'} | ${c.handler || '—'} |`).join('\n')
    : commands.length > 0
      ? commands.map(c => `| ${c} | ${inferCommandVisibility(c)} | — | — |`).join('\n')
      : '| (nenhum) | — | — | — |';

  const commandsHeader = structured.length > 0
    ? `| Comando       | Visibilidade | Descricao                              | Handler                  |\n|---------------|-------------|----------------------------------------|--------------------------|`
    : `| Comando       | Visibilidade | Descricao                              | Handler                  |\n|---------------|-------------|----------------------------------------|--------------------------|`;

  const depsAgents = agentSquad
    ? (agentSquad.agentIds || []).filter(id => id !== agent.slug)
    : [];

  // File dependencies section
  const deps = agent.dependencies || { services: [], hooks: [], types: [] };
  const hasDeps = deps.services.length > 0 || deps.hooks.length > 0 || deps.types.length > 0;
  const depsSection = hasDeps
    ? `\n### Arquivos\n\n- **Services**: ${deps.services.length > 0 ? deps.services.join(', ') : '(nenhum)'}\n- **Hooks**: ${deps.hooks.length > 0 ? deps.hooks.join(', ') : '(nenhum)'}\n- **Types**: ${deps.types.length > 0 ? deps.types.join(', ') : '(nenhum)'}\n`
    : '';

  return {
    path: `agents/${agent.slug}.md`,
    type: 'md',
    complianceStatus: 'pending',
    content: `---
agent: "${agent.name}"
slug: "${agent.slug}"
version: "1.0.0"
squad: "${agentSquad?.slug || 'core'}"
model: "${agent.llmModel}"
---

## persona_profile

| Campo       | Valor                                          |
|-------------|------------------------------------------------|
| name        | ${agent.name}                                  |
| role        | ${agent.role}                                  |
| style       | Direto, tecnico, orientado a resultados        |
| visibility  | ${agent.visibility}                            |
| constraints | Segue o padrao AIOS v4.2.13                    |

## System Prompt

${agent.systemPrompt || '(a definir)'}

## Commands

${commandsHeader}
${commandsTable}

## Tools

${tools.length > 0 ? tools.map(t => `- ${t}`).join('\n') : '- (nenhuma ferramenta configurada)'}

## Skills

${skills.length > 0 ? skills.map(s => `- ${s}`).join('\n') : '- (nenhuma skill configurada)'}

## Dependencies

- **Squads**: ${squadName}
- **Agents**: ${depsAgents.length > 0 ? depsAgents.join(', ') : '(nenhum)'}
${depsSection}
## Context

${agentContext}
`,
  };
}

function generateAgentTs(agent: AiosAgent, squads: AiosSquad[], project: Partial<AiosProject>): GeneratedFile {
  const pascal = slugToPascal(agent.slug);
  const agentSquad = squads.find(s => (s.agentIds || []).includes(agent.slug));
  const squadSlug = agentSquad?.slug || 'core';
  const commands = agent.commands || [];
  const structured = agent.structuredCommands || [];
  const deps = agent.dependencies || { services: [], hooks: [], types: [] };
  const agentContext = agent.context || `Agente do projeto ${project.name || 'AIOS'}. ${agent.role}`;
  const depsAgents = agentSquad
    ? (agentSquad.agentIds || []).filter(id => id !== agent.slug)
    : [];

  // Use structured commands if available, fallback to simple
  const hasStructured = structured.length > 0;
  const commandsObj = hasStructured
    ? structured.map(c => `    '${c.name}': {\n      description: '${c.description.replace(/'/g, "\\'")}',\n      visibility: '${c.visibility}' as const,\n      handler: '${c.handler}',\n    },`).join('\n')
    : commands.map(c => `    '${c}': { visibility: '${inferCommandVisibility(c)}' as const, description: '' },`).join('\n');

  const commandNames = hasStructured ? structured.map(c => c.name).join(', ') : commands.join(', ');

  // Dependencies block
  const hasDeps = deps.services.length > 0 || deps.hooks.length > 0 || deps.types.length > 0;
  const depsBlock = hasDeps
    ? `\n  dependencies: {\n    services: [${deps.services.map(s => `'${s}'`).join(', ')}],\n    hooks: [${deps.hooks.map(h => `'${h}'`).join(', ')}],\n    types: [${deps.types.map(t => `'${t}'`).join(', ')}],\n  },\n`
    : '';

  // Deps string for header
  const depsStr = [
    ...deps.services,
    ...deps.hooks,
    ...depsAgents,
  ].join(', ') || '(nenhum)';

  return {
    path: `src/agents/${pascal}.agent.ts`,
    type: 'ts',
    complianceStatus: 'pending',
    content: `/**
 * @agent     ${pascal}
 * @persona   ${agent.role}
 * @version   1.0.0
 * @squad     ${squadSlug}
 * @commands  ${commandNames || '(nenhum)'}
 * @deps      ${depsStr}
 * @context   ${agentContext}
 */

export const ${pascal}Agent = {
  name: '${agent.name}',
  slug: '${agent.slug}',
  persona: '${agent.role}',
  version: '1.0.0',
  squad: '${squadSlug}',
  model: '${agent.llmModel}',

  commands: {
${commandsObj || '    // (nenhum comando configurado)'}
  },
${depsBlock}
  context: '${agentContext.replace(/'/g, "\\'")}',
} as const;

export type ${pascal}Commands = keyof typeof ${pascal}Agent.commands;
`,
  };
}

function generateAppMasterAgent(
  name: string,
  project: Partial<AiosProject>,
  agents: AiosAgent[],
  squads: AiosSquad[],
  workflows: ProjectWorkflow[] = [],
): GeneratedFile {
  const squadsObj = squads
    .map(s => {
      const agentSlugs = (s.agentIds || []).map(id => `'${id}'`).join(', ');
      return `    '${s.slug}': { name: '${s.name}', agents: [${agentSlugs}] },`;
    })
    .join('\n');

  const workflowsObj = workflows
    .map(w => `    '${w.slug}': { name: '${w.name}', trigger: '${w.trigger}' },`)
    .join('\n');

  const allAgentSlugs = agents.map(a => a.slug).join(', ');

  return {
    path: 'src/agents/AppMaster.agent.ts',
    type: 'ts',
    complianceStatus: 'pending',
    content: `/**
 * @agent     AppMaster
 * @persona   Orquestrador principal do ${name}.
 *            Coordena todos os modulos, define o roteamento de
 *            responsabilidades e mantem a coerencia arquitetural.
 * @version   1.0.0
 * @squad     core
 * @commands  navigate, orchestrate, loadModule, validateContext
 * @deps      ${allAgentSlugs || '(nenhum)'}
 * @context   Ativado na inicializacao do app. Define a arquitetura
 *            de squads e roteia requisicoes para o modulo correto.
 */

export const AppMasterAgent = {
  name: 'AppMaster',
  slug: 'app-master',
  persona: 'Orquestrador principal do ${name}',
  version: '1.0.0',
  squad: 'core',
  model: 'gemini-3-flash-preview',

  commands: {
    'navigate': { visibility: 'full' as const, description: 'Navegar entre modulos' },
    'orchestrate': { visibility: 'full' as const, description: 'Orquestrar execucao de tarefa' },
    'loadModule': { visibility: 'full' as const, description: 'Carregar modulo especifico' },
    'validateContext': { visibility: 'quick' as const, description: 'Validar contexto atual' },
  },

  agents: {
${agents.map(a => `    '${a.slug}': { name: '${a.name}', role: '${a.role}', model: '${a.llmModel}' },`).join('\n')}
  },

  squads: {
${squadsObj || '    // (nenhum squad configurado)'}
  },

  workflows: {
${workflowsObj || '    // (nenhum workflow configurado)'}
  },

  context: 'Ativado na inicializacao do app ${name}. Orquestra ${agents.length} agente(s) em ${squads.length} squad(s) com ${workflows.length} workflow(s).',
} as const;

export type AppMasterCommands = keyof typeof AppMasterAgent.commands;
`,
  };
}

function generateAgentConfig(agent: AiosAgent): GeneratedFile {
  return {
    path: `agents/${agent.slug}.yaml`,
    type: 'yaml',
    complianceStatus: 'pending',
    content: `# Agent: ${agent.name}
slug: "${agent.slug}"
name: "${agent.name}"
role: "${agent.role}"
version: "1.0.0"

llm:
  model: "${agent.llmModel}"
  temperature: 0.7
  max_tokens: 4096

visibility: "${agent.visibility}"
is_custom: ${agent.isCustom}

system_prompt: |
  ${(agent.systemPrompt || '').split('\n').join('\n  ')}

commands:
${(agent.commands || []).map(c => `  - "${c}"`).join('\n') || '  []'}

tools:
${(agent.tools || []).map(t => `  - "${t}"`).join('\n') || '  []'}

skills:
${(agent.skills || []).map(s => `  - "${s}"`).join('\n') || '  []'}
`,
  };
}

function generateSquadYaml(squad: AiosSquad, agents: AiosAgent[]): GeneratedFile {
  const squadAgentIds = squad.agentIds || [];
  const squadTasks = squad.tasks || [];
  const squadWorkflows = squad.workflows || [];

  // Generate enriched tasks — fill empty descriptions/checklists with useful defaults
  const tasksYaml = squadTasks.length > 0
    ? squadTasks.map(t => {
        const desc = t.description || `Tarefa "${t.name}" executada pelo agente @${t.agentSlug}`;
        const checklist = (t.checklist || []).length > 0
          ? t.checklist
          : ['Analisar requisitos da tarefa', 'Executar implementacao', 'Validar resultado'];
        return `  - id: "${t.id}"
    name: "${t.name}"
    description: "${desc}"
    agent: "${t.agentSlug}"
    dependencies: [${t.dependencies.map(d => `"${d}"`).join(', ')}]
    checklist:
${checklist.map(c => `      - "${c}"`).join('\n')}`;
      }).join('\n')
    : '  []';

  // Generate enriched workflows — fill empty steps with agent sequence
  const workflowsYaml = squadWorkflows.length > 0
    ? squadWorkflows.map(w => {
        const steps = (w.steps || []).length > 0
          ? w.steps
          : squadAgentIds.map((id, i) => ({
              id: `step-${i + 1}`,
              name: `Etapa ${i + 1}: ${agents.find(a => a.slug === id)?.name || id}`,
              agentSlug: id,
              condition: undefined as string | undefined,
            }));
        return `  - id: "${w.id}"
    name: "${w.name}"
    steps:
${steps.map(s => `      - id: "${s.id}"
        name: "${s.name}"
        agent: "${s.agentSlug}"${s.condition ? `\n        condition: "${s.condition}"` : ''}`).join('\n')}`;
      }).join('\n')
    : '  []';

  return {
    path: `squads/${squad.slug}/squad.yaml`,
    type: 'yaml',
    complianceStatus: 'pending',
    content: `# Squad: ${squad.name}
name: "${squad.name}"
slug: "${squad.slug}"
description: "${squad.description || ''}"
version: "1.0.0"

agents:
${squadAgentIds.map(id => {
  const agent = agents.find(a => a.slug === id);
  return `  - slug: "${id}"
    name: "${agent?.name || id}"
    role: "${agent?.role || ''}"`;
}).join('\n') || '  []'}

tasks:
${tasksYaml}

workflows:
${workflowsYaml}
`,
  };
}

function generateSquadReadme(squad: AiosSquad, agents: AiosAgent[]): GeneratedFile {
  const squadAgents = (squad.agentIds || []).map(id => agents.find(a => a.slug === id)).filter(Boolean);
  return {
    path: `squads/${squad.slug}/README.md`,
    type: 'md',
    complianceStatus: 'pending',
    content: `# Squad: ${squad.name}

${squad.description || 'Sem descricao.'}

## Agentes

| Agente | Role | Modelo |
|--------|------|--------|
${squadAgents.map(a => `| ${a!.name} | ${a!.role} | \`${a!.llmModel}\` |`).join('\n') || '| (vazio) | - | - |'}

## Tasks

${(squad.tasks || []).length > 0 ? squad.tasks.map((t, i) => `${i + 1}. **${t.name}** - ${t.description || 'Sem descricao'} (agente: \`${t.agentSlug}\`)`).join('\n') : '(nenhuma task definida)'}

## Workflows

${(squad.workflows || []).length > 0 ? squad.workflows.map(w => `### ${w.name}\n${(w.steps || []).map((s, i) => `${i + 1}. ${s.name} (\`${s.agentSlug}\`)`).join('\n')}`).join('\n\n') : '(nenhum workflow definido)'}
`,
  };
}

function generatePackageJson(slug: string, name: string, agents: AiosAgent[]): GeneratedFile {
  const deps: Record<string, string> = {
    'yaml': '^2.4.0',
    'dotenv': '^16.4.0',
    'winston': '^3.14.0',
    'zod': '^3.23.0',
    // Always include all LLM SDKs so agents can be reconfigured without reinstalling
    'openai': '^4.60.0',
    '@anthropic-ai/sdk': '^0.30.0',
    '@google/generative-ai': '^0.21.0',
  };

  return {
    path: 'package.json',
    type: 'json',
    complianceStatus: 'pending',
    content: JSON.stringify({
      name: slug,
      version: '1.0.0',
      description: `AIOS System - ${name}`,
      type: 'module',
      main: 'dist/main.js',
      scripts: {
        'build': 'tsc',
        'start': 'node dist/main.js',
        'dev': 'tsx src/main.ts',
        'lint': 'tsc --noEmit',
        'setup': 'bash scripts/setup.sh',
        'validate': 'tsx src/validate.ts',
      },
      dependencies: deps,
      devDependencies: {
        'typescript': '^5.5.0',
        'tsx': '^4.19.0',
        '@types/node': '^22.0.0',
      },
      engines: {
        node: '>=20.0.0',
      },
    }, null, 2) + '\n',
  };
}

function generateTsConfig(): GeneratedFile {
  return {
    path: 'tsconfig.json',
    type: 'json',
    complianceStatus: 'pending',
    content: JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        lib: ['ES2022'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        baseUrl: '.',
        paths: {
          '@/*': ['./src/*'],
          '@agents/*': ['./agents/*'],
          '@squads/*': ['./squads/*'],
        },
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    }, null, 2) + '\n',
  };
}

function generateMainEntryPoint(
  name: string,
  pattern: OrchestrationPatternType,
  agents: AiosAgent[],
  squads: AiosSquad[],
  workflows: ProjectWorkflow[] = [],
): GeneratedFile {
  return {
    path: 'src/main.ts',
    type: 'ts',
    complianceStatus: 'pending',
    content: `/**
 * ${name} - AIOS Main Entry Point
 * Orchestration: ${pattern}
 * Generated by AIOS Builder
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { createInterface } from 'readline';
import { validateEnv } from './env.js';
import { createOrchestrator } from './orchestrator.js';
import { createAgentRunner } from './agent-runner.js';
import { logger } from './logger.js';
import type { AiosConfig } from './types.js';

config();

// Load config from YAML (single source of truth)
function loadConfig(): AiosConfig {
  try {
    const raw = readFileSync('aios.config.yaml', 'utf-8');
    const yaml = parse(raw) as any;
    return {
      name: yaml.name || '${name}',
      pattern: yaml.orchestration?.pattern || '${pattern}',
      agents: (yaml.agents || []).map((a: any) => ({
        slug: a.slug,
        name: a.name,
        role: a.role,
        model: a.model,
      })),
      squads: (yaml.squads || []).map((s: any) => ({
        slug: s.slug,
        name: s.name,
        agentSlugs: s.agents || [],
      })),
      workflows: (yaml.workflows || []).map((w: any) => ({
        slug: w.slug,
        name: w.name,
        trigger: w.trigger,
        configPath: w.config,
      })),
      retryPolicy: yaml.orchestration?.retry_policy || undefined,
      timeoutMs: yaml.orchestration?.timeout_ms || undefined,
    };
  } catch (err) {
    logger.warn('Falha ao ler aios.config.yaml, usando config padrao');
    return {
      name: "${name}",
      pattern: "${pattern}",
      agents: [
${agents.map(a => `        { slug: "${a.slug}", name: "${a.name}", role: "${a.role}", model: "${a.llmModel}" },`).join('\n')}
      ],
      squads: [
${squads.map(s => `        { slug: "${s.slug}", name: "${s.name}", agentSlugs: [${(s.agentIds || []).map(id => `"${id}"`).join(', ')}] },`).join('\n')}
      ],
      workflows: [
${workflows.map(w => `        { slug: "${w.slug}", name: "${w.name}", trigger: "${w.trigger}", configPath: "workflows/${w.slug}.yaml" },`).join('\n')}
      ],
    };
  }
}

const aiosConfig = loadConfig();

async function main() {
  logger.info(\`Iniciando \${aiosConfig.name} (padrao: \${aiosConfig.pattern})\`);

  // Validate environment
  const env = validateEnv();
  logger.info('Variaveis de ambiente validadas');

  // Create agent runner (handles LLM calls)
  const runner = createAgentRunner(env);

  // Create orchestrator with the configured pattern
  const orchestrator = createOrchestrator(aiosConfig, runner);

  logger.info(\`\${aiosConfig.agents.length} agente(s) registrado(s)\`);
  logger.info(\`\${aiosConfig.squads.length} squad(s) configurado(s)\`);
  logger.info(\`\${(aiosConfig.workflows || []).length} workflow(s) disponivel(is)\`);
  logger.info('Sistema AIOS pronto.');

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Encerrando AIOS...');
    process.exit(0);
  });

  // Interactive readline loop
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('');
  console.log('='.repeat(50));
  console.log('  AIOS Interativo — digite uma tarefa ou "sair"');
  console.log('='.repeat(50));
  console.log('');

  const prompt = () => rl.question('aios> ', async (input) => {
    const trimmed = input.trim();
    if (!trimmed) return prompt();
    if (trimmed === 'sair' || trimmed === 'exit' || trimmed === 'quit') {
      logger.info('Encerrando AIOS...');
      rl.close();
      process.exit(0);
    }
    if (trimmed === 'status') {
      console.log(\`\\nSistema: \${aiosConfig.name}\`);
      console.log(\`Padrao: \${aiosConfig.pattern}\`);
      console.log(\`Agentes: \${aiosConfig.agents.map(a => a.name).join(', ')}\`);
      console.log(\`Squads: \${aiosConfig.squads.map(s => s.name).join(', ') || '(nenhum)'}\`);
      const wfs = aiosConfig.workflows || [];
      console.log(\`Workflows: \${wfs.length > 0 ? wfs.map(w => \`\${w.slug} (\${w.trigger})\`).join(', ') : '(nenhum)'}\\n\`);
      return prompt();
    }

    // /squad <slug> <tarefa> — route task to a specific squad (item 3)
    if (trimmed.startsWith('/squad ')) {
      const parts = trimmed.slice(7).match(/^(\\S+)\\s+(.+)$/);
      if (!parts) {
        console.log('Uso: /squad <slug> <descricao da tarefa>');
        return prompt();
      }
      const [, squadSlug, squadTask] = parts;
      try {
        const result = await orchestrator.run({ task: squadTask, context: {}, targetSquad: squadSlug });
        console.log(\`\\n--- Resultado (Squad: \${squadSlug}) ---\\n\${result.output}\\n\`);
      } catch (err) {
        logger.error(\`Erro no squad: \${err}\`);
      }
      return prompt();
    }

    // @<slug> <tarefa> — route task directly to a specific agent (item 14)
    if (trimmed.startsWith('@')) {
      const parts = trimmed.match(/^@(\\S+)\\s+(.+)$/);
      if (!parts) {
        console.log('Uso: @<slug-do-agente> <descricao da tarefa>');
        return prompt();
      }
      const [, agentSlug, agentTask] = parts;
      try {
        const result = await orchestrator.run({ task: agentTask, context: {}, targetAgent: agentSlug });
        console.log(\`\\n--- Resultado (@\${agentSlug}) ---\\n\${result.output}\\n\`);
      } catch (err) {
        logger.error(\`Erro no agente: \${err}\`);
      }
      return prompt();
    }

    if (trimmed.startsWith('/workflow ')) {
      const parts = trimmed.slice(10).match(/^(\\S+)\\s+(.+)$/);
      if (!parts) {
        console.log('Uso: /workflow <slug> <descricao da tarefa>');
        return prompt();
      }
      const [, wfSlug, wfTask] = parts;
      try {
        const result = await orchestrator.runWorkflow(wfSlug, wfTask);
        console.log(\`\\n--- Resultado do Workflow ---\\n\${result.output}\\n\`);
      } catch (err) {
        logger.error(\`Erro no workflow: \${err}\`);
      }
      return prompt();
    }

    try {
      logger.info(\`Processando tarefa: \${trimmed}\`);
      const result = await orchestrator.run({ task: trimmed, context: {} });
      console.log(\`\\n--- Resultado ---\\n\${result.output}\\n\`);
    } catch (err) {
      logger.error(\`Erro ao processar tarefa: \${err}\`);
    }
    prompt();
  });

  prompt();
}

main().catch((err) => {
  logger.error('Erro fatal:', err);
  process.exit(1);
});

export { aiosConfig };
`,
  };
}

function generateOrchestratorEngine(
  pattern: OrchestrationPatternType,
  agents: AiosAgent[],
  squads: AiosSquad[],
): GeneratedFile {
  return {
    path: 'src/orchestrator.ts',
    type: 'ts',
    complianceStatus: 'pending',
    content: `/**
 * Orchestrator Engine
 * Pattern: ${pattern}
 */

import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { logger } from './logger.js';
import type { AiosConfig, AgentRunner, TaskRequest, TaskResult } from './types.js';

interface RetryPolicy {
  max_retries: number;
  backoff_ms: number;
}

// ── Retry helper with exponential backoff ────────────────────────
async function withRetry<T>(
  fn: () => Promise<T>,
  policy: RetryPolicy,
  label: string,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= policy.max_retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < policy.max_retries) {
        const delay = policy.backoff_ms * Math.pow(2, attempt);
        logger.warn(\`[Retry] \${label} — tentativa \${attempt + 1}/\${policy.max_retries} falhou, retry em \${delay}ms\`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// ── Timeout helper ───────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  if (!ms || ms <= 0) return promise;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(\`Timeout de \${ms}ms excedido para \${label}\`)), ms)
    ),
  ]);
}

export function createOrchestrator(config: AiosConfig, runner: AgentRunner) {
  const agentMap = new Map(config.agents.map(a => [a.slug, a]));
  const squadMap = new Map(config.squads.map(s => [s.slug, s]));

  // Read orchestration-level retry/timeout from config (loaded from YAML)
  const globalRetry: RetryPolicy = (config as any).retryPolicy || { max_retries: 3, backoff_ms: 1000 };
  const globalTimeout: number = (config as any).timeoutMs || 300000;

  // ── Invoke agent with retry + timeout ───────────────────────
  async function invokeAgent(
    agentSlug: string,
    invocation: { task: string; context: Record<string, unknown>; previousResults?: string[] },
    retryOverride?: RetryPolicy,
    timeoutOverride?: number,
  ) {
    const retry = retryOverride || globalRetry;
    const timeout = timeoutOverride || globalTimeout;
    return withTimeout(
      withRetry(() => runner.invoke(agentSlug, invocation), retry, agentSlug),
      timeout,
      agentSlug,
    );
  }

  // ── Filter agents by squad ──────────────────────────────────
  function getAgentsForSquad(squadSlug: string) {
    const squad = squadMap.get(squadSlug);
    if (!squad) return config.agents;
    return config.agents.filter(a => squad.agentSlugs.includes(a.slug));
  }

  async function runTask(request: TaskRequest): Promise<TaskResult> {
    logger.info(\`[Orchestrator] Nova tarefa: \${request.task}\`);

    // Direct agent routing (item 14) — bypass orchestration pattern
    if (request.targetAgent) {
      const agent = agentMap.get(request.targetAgent);
      if (!agent) return { success: false, output: \`Agente '\${request.targetAgent}' nao encontrado\`, agentResults: [] };
      logger.info(\`[Direct] Roteamento direto para agente: \${agent.name}\`);
      const result = await invokeAgent(agent.slug, { task: request.task, context: request.context || {} });
      return { success: true, output: result.output, agentResults: [result.output] };
    }

    // Squad-scoped routing (item 3)
    const activeAgents = request.targetSquad
      ? getAgentsForSquad(request.targetSquad)
      : config.agents;

    if (request.targetSquad) {
      logger.info(\`[Squad] Filtrando para squad '\${request.targetSquad}': \${activeAgents.map(a => a.name).join(', ')}\`);
    }

    switch (config.pattern) {
      case 'SEQUENTIAL_PIPELINE':
        return runSequential(request, activeAgents);
      case 'PARALLEL_SWARM':
        return runParallel(request, activeAgents);
      case 'HIERARCHICAL':
        return runHierarchical(request, activeAgents);
      case 'WATCHDOG':
        return runWatchdog(request, activeAgents);
      case 'COLLABORATIVE':
        return runCollaborative(request, activeAgents);
      case 'TASK_FIRST':
      default:
        return runTaskFirst(request, activeAgents);
    }
  }

  async function runSequential(request: TaskRequest, agents = config.agents): Promise<TaskResult> {
    let context = request.context || {};
    const results: string[] = [];

    for (const agent of agents) {
      logger.info(\`[Pipeline] Executando agente: \${agent.name}\`);
      const result = await invokeAgent(agent.slug, {
        task: request.task,
        context,
        previousResults: results,
      });
      results.push(result.output);
      context = { ...context, [\`\${agent.slug}_output\`]: result.output };
    }

    return { success: true, output: results[results.length - 1] || '', agentResults: results };
  }

  async function runParallel(request: TaskRequest, agents = config.agents): Promise<TaskResult> {
    logger.info(\`[Swarm] Executando \${agents.length} agentes em paralelo\`);
    const promises = agents.map(agent =>
      invokeAgent(agent.slug, { task: request.task, context: request.context || {} })
    );
    const results = await Promise.allSettled(promises);
    const outputs = results.map((r, i) =>
      r.status === 'fulfilled' ? r.value.output : \`Erro em \${agents[i].name}: \${r.reason}\`
    );
    return { success: true, output: outputs.join('\\n---\\n'), agentResults: outputs };
  }

  async function runHierarchical(request: TaskRequest, agents = config.agents): Promise<TaskResult> {
    const master = agents.find(a => a.slug === 'aios-master') || agents[0];
    if (!master) return { success: false, output: 'Nenhum agente master encontrado', agentResults: [] };

    logger.info(\`[Hierarquico] Master: \${master.name}\`);
    const plan = await invokeAgent(master.slug, {
      task: \`Planeje a execucao da tarefa: \${request.task}. Agentes disponiveis: \${agents.map(a => a.name).join(', ')}\`,
      context: request.context || {},
    });

    return { success: true, output: plan.output, agentResults: [plan.output] };
  }

  async function runWatchdog(request: TaskRequest, agents = config.agents): Promise<TaskResult> {
    const workers = agents.filter(a => a.slug !== 'aios-master');
    const supervisor = agents.find(a => a.slug === 'aios-master') || agents[0];

    const workerResults = await Promise.all(
      workers.map(w => invokeAgent(w.slug, { task: request.task, context: request.context || {} }))
    );

    if (supervisor) {
      const review = await invokeAgent(supervisor.slug, {
        task: \`Revise os seguintes resultados da tarefa "\${request.task}": \${workerResults.map((r, i) => \`\${workers[i].name}: \${r.output}\`).join('\\n')}\`,
        context: request.context || {},
      });
      return { success: true, output: review.output, agentResults: [...workerResults.map(r => r.output), review.output] };
    }

    return { success: true, output: workerResults.map(r => r.output).join('\\n'), agentResults: workerResults.map(r => r.output) };
  }

  async function runCollaborative(request: TaskRequest, agents = config.agents): Promise<TaskResult> {
    const sharedContext: Record<string, string> = {};
    const rounds = 2;

    for (let round = 0; round < rounds; round++) {
      for (const agent of agents) {
        const result = await invokeAgent(agent.slug, {
          task: \`\${request.task}\\n\\nContexto compartilhado:\\n\${JSON.stringify(sharedContext, null, 2)}\`,
          context: request.context || {},
        });
        sharedContext[agent.slug] = result.output;
      }
    }

    return { success: true, output: JSON.stringify(sharedContext, null, 2), agentResults: Object.values(sharedContext) };
  }

  async function runTaskFirst(request: TaskRequest, agents = config.agents): Promise<TaskResult> {
    const orchestrator = agents.find(a => a.slug === 'aios-orchestrator') || agents[0];
    if (!orchestrator) return { success: false, output: 'Nenhum orchestrator encontrado', agentResults: [] };

    const plan = await invokeAgent(orchestrator.slug, {
      task: \`Analise a tarefa e atribua ao agente mais adequado: "\${request.task}". Agentes: \${agents.map(a => \`\${a.name} (\${a.role})\`).join(', ')}\`,
      context: request.context || {},
    });

    return { success: true, output: plan.output, agentResults: [plan.output] };
  }

  // ── Workflow execution with DAG, timeout, retry (item 4) ────
  async function runWorkflow(slug: string, task: string): Promise<TaskResult> {
    const wf = (config.workflows || []).find(w => w.slug === slug);
    if (!wf) {
      throw new Error(\`Workflow '\${slug}' nao encontrado\`);
    }

    logger.info(\`[Workflow: \${wf.name}] Iniciando\`);

    // Load workflow YAML if configPath exists
    interface WfStep {
      id: string;
      name: string;
      agent: string;
      depends_on?: string[];
      timeout_ms?: number;
      retry_policy?: { max_retries: number; backoff_ms: number };
    }
    let steps: WfStep[] = [];
    if (wf.configPath) {
      try {
        const raw = readFileSync(wf.configPath, 'utf-8');
        const wfYaml = parse(raw) as any;
        steps = (wfYaml.steps || []).map((s: any) => ({
          id: s.id || s.name || 'unnamed',
          name: s.name || s.step || 'unnamed',
          agent: s.agent || s.agentSlug,
          depends_on: s.depends_on || [],
          timeout_ms: s.timeout_ms,
          retry_policy: s.retry_policy,
        }));
      } catch (err) {
        logger.warn(\`Falha ao ler \${wf.configPath}, usando steps inline\`);
      }
    }

    // Fallback to inline steps from config
    if (steps.length === 0 && wf.steps) {
      steps = wf.steps.map((s: any) => ({
        id: s.id || s.name,
        name: s.name,
        agent: s.agentSlug || s.agent,
        depends_on: s.dependsOn || [],
        timeout_ms: s.timeout_ms,
        retry_policy: s.retry_policy,
      }));
    }

    if (steps.length === 0) {
      return { success: false, output: \`Workflow '\${slug}' nao possui steps definidos\`, agentResults: [] };
    }

    // Validate all agents exist
    for (const step of steps) {
      if (!agentMap.has(step.agent)) {
        logger.warn(\`[Workflow: \${wf.name}] Agente '\${step.agent}' nao encontrado no registro\`);
      }
    }

    // DAG-based execution: resolve dependencies
    const completed = new Map<string, string>(); // stepId → output
    const allResults: string[] = [];
    const pending = new Set(steps.map(s => s.id));

    while (pending.size > 0) {
      // Find steps whose dependencies are all completed
      const ready = steps.filter(s =>
        pending.has(s.id) && (s.depends_on || []).every(dep => completed.has(dep))
      );

      if (ready.length === 0 && pending.size > 0) {
        const unresolvedIds = [...pending].join(', ');
        return { success: false, output: \`Dependencias circulares ou ausentes detectadas nos steps: \${unresolvedIds}\`, agentResults: allResults };
      }

      // Execute ready steps in parallel
      const batchResults = await Promise.allSettled(
        ready.map(async (step) => {
          const depContext = Object.fromEntries(
            (step.depends_on || []).map(dep => [\`\${dep}_output\`, completed.get(dep) || ''])
          );
          logger.info(\`[Workflow: \${wf.name}] Step '\${step.name}' → agent: \${step.agent}\`);

          const stepRetry = step.retry_policy || globalRetry;
          const stepTimeout = step.timeout_ms || globalTimeout;

          const result = await invokeAgent(
            step.agent,
            { task, context: { ...depContext, stepId: step.id, totalSteps: steps.length } },
            stepRetry,
            stepTimeout,
          );
          return { id: step.id, output: result.output };
        })
      );

      for (let i = 0; i < ready.length; i++) {
        const step = ready[i];
        const result = batchResults[i];
        if (result.status === 'fulfilled') {
          completed.set(result.value.id, result.value.output);
          allResults.push(result.value.output);
        } else {
          const errMsg = \`Erro no step '\${step.name}': \${result.reason}\`;
          logger.error(errMsg);
          completed.set(step.id, errMsg);
          allResults.push(errMsg);
        }
        pending.delete(step.id);
      }
    }

    const lastOutput = allResults[allResults.length - 1] || '';
    logger.info(\`[Workflow: \${wf.name}] Concluido — \${steps.length} step(s) executado(s)\`);
    return { success: true, output: lastOutput, agentResults: allResults };
  }

  return { run: runTask, runWorkflow, agents: agentMap, squads: squadMap };
}
`,
  };
}

function generateAgentRunner(): GeneratedFile {
  return {
    path: 'src/agent-runner.ts',
    type: 'ts',
    complianceStatus: 'pending',
    content: `/**
 * Agent Runner - Handles LLM calls for each agent
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { parse } from 'yaml';
import { logger } from './logger.js';
import type { AgentRunner, AgentInvocation, AgentResult, ValidatedEnv } from './types.js';

interface AgentDefinition {
  slug: string;
  name: string;
  system_prompt: string;
  llm: { model: string; temperature: number; max_tokens: number };
}

function loadAgentDefinition(slug: string): AgentDefinition | null {
  const yamlPath = resolve('agents', \`\${slug}.yaml\`);
  if (!existsSync(yamlPath)) return null;
  try {
    const content = readFileSync(yamlPath, 'utf-8');
    return parse(content) as AgentDefinition;
  } catch {
    return null;
  }
}

export function createAgentRunner(env: ValidatedEnv): AgentRunner {
  async function invoke(agentSlug: string, invocation: AgentInvocation): Promise<AgentResult> {
    const definition = loadAgentDefinition(agentSlug);
    const systemPrompt = definition?.system_prompt || \`Voce e o agente \${agentSlug}.\`;
    const model = definition?.llm?.model || 'gpt-5-mini';
    const temperature = definition?.llm?.temperature ?? 0.7;
    const maxTokens = definition?.llm?.max_tokens ?? 4096;

    logger.debug(\`[Agent:\${agentSlug}] Invocando modelo \${model} (temp=\${temperature}, max_tokens=\${maxTokens})\`);

    const userMessage = [
      invocation.task,
      invocation.previousResults?.length
        ? \`\\nResultados anteriores:\\n\${invocation.previousResults.join('\\n---\\n')}\`
        : '',
      invocation.context && Object.keys(invocation.context).length > 0
        ? \`\\nContexto:\\n\${JSON.stringify(invocation.context, null, 2)}\`
        : '',
    ].filter(Boolean).join('\\n');

    try {
      // Route to appropriate LLM provider based on model name
      if (model.includes('claude') || model.includes('anthropic')) {
        return await callAnthropic(systemPrompt, userMessage, model, temperature, maxTokens, env);
      } else if (model.includes('gemini') || model.includes('google')) {
        return await callGoogle(systemPrompt, userMessage, model, temperature, maxTokens, env);
      } else {
        return await callOpenAI(systemPrompt, userMessage, model, temperature, maxTokens, env);
      }
    } catch (error) {
      logger.error(\`[Agent:\${agentSlug}] Erro: \${error}\`);
      return { output: \`Erro ao invocar agente \${agentSlug}: \${error}\`, success: false };
    }
  }

  async function callOpenAI(system: string, user: string, model: string, temperature: number, maxTokens: number, env: ValidatedEnv): Promise<AgentResult> {
    if (!env.OPENAI_API_KEY) {
      return { output: '[OpenAI] API key nao configurada. Configure OPENAI_API_KEY no .env', success: false };
    }
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    });
    return { output: response.choices[0]?.message?.content || '', success: true };
  }

  async function callAnthropic(system: string, user: string, model: string, temperature: number, maxTokens: number, env: ValidatedEnv): Promise<AgentResult> {
    if (!env.ANTHROPIC_API_KEY) {
      return { output: '[Anthropic] API key nao configurada. Configure ANTHROPIC_API_KEY no .env', success: false };
    }
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: model.replace('anthropic/', ''),
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: 'user', content: user }],
    });
    const text = response.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    return { output: text, success: true };
  }

  async function callGoogle(system: string, user: string, model: string, temperature: number, maxTokens: number, env: ValidatedEnv): Promise<AgentResult> {
    if (!env.GOOGLE_API_KEY) {
      return { output: '[Google] API key nao configurada. Configure GOOGLE_API_KEY no .env', success: false };
    }
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
    // Remove provider prefix if present (e.g. 'google/gemini-3-flash-preview' -> 'gemini-3-flash-preview')
    const modelName = model.replace(/^google\\\\//, '');
    const genModel = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: system,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });
    const result = await genModel.generateContent(user);
    const text = result.response.text();
    return { output: text, success: true };
  }

  return { invoke };
}
`,
  };
}

function generateLogger(): GeneratedFile {
  return {
    path: 'src/logger.ts',
    type: 'ts',
    complianceStatus: 'pending',
    content: `/**
 * Logger - Structured logging for AIOS
 *
 * Provides timestamped, leveled logging to stdout/stderr.
 * Configure via LOG_LEVEL env var: debug | info | warn | error
 *
 * Usage:
 *   import { logger } from './logger.js';
 *   logger.info('System started');
 *   logger.debug('Agent invoked', { slug: 'dev' });
 *   logger.error('Failed to connect', error);
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LogLevel = keyof typeof LEVELS;

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function log(level: LogLevel, ...args: unknown[]) {
  if (LEVELS[level] < LEVELS[currentLevel]) return;
  const timestamp = new Date().toISOString();
  const prefix = \`[\${timestamp}] [\${level.toUpperCase()}]\`;
  switch (level) {
    case 'debug': console.debug(prefix, ...args); break;
    case 'info':  console.info(prefix, ...args); break;
    case 'warn':  console.warn(prefix, ...args); break;
    case 'error': console.error(prefix, ...args); break;
  }
}

export const logger = {
  debug: (...args: unknown[]) => log('debug', ...args),
  info:  (...args: unknown[]) => log('info', ...args),
  warn:  (...args: unknown[]) => log('warn', ...args),
  error: (...args: unknown[]) => log('error', ...args),
};
`,
  };
}

function generateTypes(agents: AiosAgent[], squads: AiosSquad[]): GeneratedFile {
  return {
    path: 'src/types.ts',
    type: 'ts',
    complianceStatus: 'pending',
    content: `/**
 * AIOS Type Definitions
 */

export interface AiosConfig {
  name: string;
  pattern: string;
  agents: AgentConfig[];
  squads: SquadConfig[];
  workflows: WorkflowConfig[];
  retryPolicy?: { max_retries: number; backoff_ms: number };
  timeoutMs?: number;
}

export interface AgentConfig {
  slug: string;
  name: string;
  role: string;
  model: string;
}

export interface SquadConfig {
  slug: string;
  name: string;
  agentSlugs: string[];
}

export interface WorkflowConfig {
  slug: string;
  name: string;
  trigger: string;
  configPath?: string;
  steps?: WorkflowStepConfig[];
}

export interface WorkflowStepConfig {
  id: string;
  name: string;
  agentSlug: string;
  taskId?: string;
  condition?: string;
  dependsOn?: string[];
  timeout_ms?: number;
  retry_policy?: { max_retries: number; backoff_ms: number };
}

export interface TaskRequest {
  task: string;
  context?: Record<string, unknown>;
  targetAgent?: string;
  targetSquad?: string;
}

export interface TaskResult {
  success: boolean;
  output: string;
  agentResults: string[];
}

export interface AgentInvocation {
  task: string;
  context: Record<string, unknown>;
  previousResults?: string[];
}

export interface AgentResult {
  output: string;
  success: boolean;
}

export interface AgentRunner {
  invoke: (agentSlug: string, invocation: AgentInvocation) => Promise<AgentResult>;
}

export interface ValidatedEnv {
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  DATABASE_URL?: string;
  LOG_LEVEL?: string;
  [key: string]: string | undefined;
}
`,
  };
}

function generateEnvExample(project: Partial<AiosProject>, integrations: ConfiguredIntegration[] = []): GeneratedFile {
  const hasN8N = integrations.some(i => i.type === 'N8N');
  const hasNotion = integrations.some(i => i.type === 'NOTION');
  const hasMiro = integrations.some(i => i.type === 'MIRO');
  const hasMCP = integrations.some(i => i.type === 'MCP_SERVER');

  const n8nVars = hasN8N ? `
# N8N Integration
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=
` : '';

  const notionVars = hasNotion ? `
# Notion Integration
NOTION_API_KEY=
NOTION_ROOT_PAGE_ID=
` : '';

  const miroVars = hasMiro ? `
# Miro Integration
MIRO_ACCESS_TOKEN=
MIRO_BOARD_ID=
` : '';

  const mcpVars = hasMCP ? `
# MCP Server
MCP_SERVER_URL=
MCP_SERVER_TOKEN=
` : '';

  return {
    path: '.env.example',
    type: 'env',
    complianceStatus: 'pending',
    content: `# ══════════════════════════════════════════════════
# Environment Variables - ${project.name || 'AIOS'}
# Copy this file to .env and fill in the values
# ══════════════════════════════════════════════════

# LLM API Keys (configure at least one)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=

# Database (optional)
DATABASE_URL=

# Logging
LOG_LEVEL=info

# Runtime
NODE_ENV=production
PORT=3000
${n8nVars}${notionVars}${miroVars}${mcpVars}`,
  };
}

function generateEnvValidator(): GeneratedFile {
  return {
    path: 'src/env.ts',
    type: 'ts',
    complianceStatus: 'pending',
    content: `/**
 * Environment Variable Validator
 */

import type { ValidatedEnv } from './types.js';
import { logger } from './logger.js';

export function validateEnv(): ValidatedEnv {
  const env: ValidatedEnv = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  };

  const hasAnyKey = env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY || env.GOOGLE_API_KEY;
  if (!hasAnyKey) {
    logger.warn('Nenhuma API key configurada. Configure OPENAI_API_KEY, ANTHROPIC_API_KEY ou GOOGLE_API_KEY no .env');
  }

  return env;
}
`,
  };
}

function generateValidateScript(agents: AiosAgent[]): GeneratedFile {
  return {
    path: 'src/validate.ts',
    type: 'ts',
    complianceStatus: 'pending',
    content: `/**
 * AIOS Validate Script
 * Verifies project integrity before first run.
 * Run with: npm run validate
 */

import { existsSync, readFileSync } from 'fs';
import { parse } from 'yaml';

let hasErrors = false;

function check(label: string, ok: boolean, hint?: string) {
  if (ok) {
    console.log(\`  ✅ \${label}\`);
  } else {
    console.log(\`  ❌ \${label}\${hint ? ' — ' + hint : ''}\`);
    hasErrors = true;
  }
}

console.log('\\n🔍 AIOS Validate\\n');

// 1. Check .env exists
console.log('📁 Arquivos:');
check('.env existe', existsSync('.env'), 'Copie .env.example para .env e preencha as keys');
check('aios.config.yaml existe', existsSync('aios.config.yaml'));

// 2. Validate aios.config.yaml
let config: any = null;
if (existsSync('aios.config.yaml')) {
  try {
    const raw = readFileSync('aios.config.yaml', 'utf-8');
    config = parse(raw);
    check('aios.config.yaml é YAML válido', !!config);
    check('config tem campo "name"', !!config?.name);
    check('config tem campo "orchestration.pattern"', !!config?.orchestration?.pattern);
  } catch (err) {
    check('aios.config.yaml é YAML válido', false, String(err));
  }
}

// 3. Check API keys
console.log('\\n🔑 API Keys:');
if (existsSync('.env')) {
  const envContent = readFileSync('.env', 'utf-8');
  const hasOpenAI = /OPENAI_API_KEY=.+/.test(envContent);
  const hasAnthropic = /ANTHROPIC_API_KEY=.+/.test(envContent);
  const hasGoogle = /GOOGLE_API_KEY=.+/.test(envContent);
  check('Pelo menos 1 API key configurada', hasOpenAI || hasAnthropic || hasGoogle, 'Configure OPENAI_API_KEY, ANTHROPIC_API_KEY ou GOOGLE_API_KEY');
} else {
  check('Pelo menos 1 API key configurada', false, '.env não encontrado');
}

// 4. Check agent YAML files exist
console.log('\\n🤖 Agentes:');
const agentSlugs = config?.agents?.map((a: any) => a.slug) || [];
for (const slug of agentSlugs) {
  const yamlPath = \`agents/\${slug}.yaml\`;
  check(\`Agente \${slug} (\${yamlPath})\`, existsSync(yamlPath));
}

// 5. Check squads
if (config?.squads?.length > 0) {
  console.log('\\n👥 Squads:');
  for (const squad of config.squads) {
    const squadPath = squad.config || \`squads/\${squad.slug}/squad.yaml\`;
    check(\`Squad \${squad.slug} (\${squadPath})\`, existsSync(squadPath));
  }
}

// 6. Check workflows
if (config?.workflows?.length > 0) {
  console.log('\\n🔄 Workflows:');
  for (const wf of config.workflows) {
    const wfPath = wf.config || \`workflows/\${wf.slug}.yaml\`;
    check(\`Workflow \${wf.slug} (\${wfPath})\`, existsSync(wfPath));
  }
}

console.log('');
if (hasErrors) {
  console.log('⚠️  Validação concluída com erros. Corrija os itens acima antes de executar.');
  process.exit(1);
} else {
  console.log('✅ Validação concluída com sucesso! Execute: npm run dev');
  process.exit(0);
}
`,
  };
}

function generateDockerfile(slug: string): GeneratedFile {
  return {
    path: 'Dockerfile',
    type: 'other',
    complianceStatus: 'pending',
    content: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/agents ./agents
COPY --from=builder /app/squads ./squads
COPY --from=builder /app/workflows ./workflows
COPY --from=builder /app/aios.config.yaml ./
COPY --from=builder /app/.aios ./.aios
COPY --from=builder /app/docs ./docs
ENV NODE_ENV=production
CMD ["node", "dist/main.js"]
`,
  };
}

function generateDockerCompose(slug: string): GeneratedFile {
  return {
    path: 'docker-compose.yaml',
    type: 'yaml',
    complianceStatus: 'pending',
    content: `version: "3.8"

services:
  aios:
    build: .
    container_name: ${slug}
    restart: unless-stopped
    env_file: .env
    stdin_open: true
    tty: true
    volumes:
      - ./agents:/app/agents:ro
      - ./squads:/app/squads:ro
      - ./workflows:/app/workflows:ro
      - ./aios.config.yaml:/app/aios.config.yaml:ro
      - ./.aios:/app/.aios
`,
  };
}

function generateDockerIgnore(): GeneratedFile {
  return {
    path: '.dockerignore',
    type: 'other',
    complianceStatus: 'pending',
    content: `node_modules
dist
.env
.git
*.md
!README.md
`,
  };
}

function generateClaudeMd(
  name: string,
  slug: string,
  project: Partial<AiosProject>,
  agents: AiosAgent[],
  squads: AiosSquad[],
  pattern: OrchestrationPatternType,
  patternInfo?: any,
): GeneratedFile {
  const agentsByCategory = new Map<string, AiosAgent[]>();
  agents.forEach(a => {
    const cat = a.category || (a.isCustom ? 'Custom' : 'Outros');
    if (!agentsByCategory.has(cat)) agentsByCategory.set(cat, []);
    agentsByCategory.get(cat)!.push(a);
  });

  const agentCategorySection = Array.from(agentsByCategory.entries())
    .map(([cat, catAgents]) => `- **${cat}**: ${catAgents.map(a => `${a.name} (\`${a.slug}\`)`).join(', ')}`)
    .join('\n');

  const agentDetailSection = agents.map(a =>
    `### ${a.name} (\`${a.slug}\`)
- **Role**: ${a.role}
- **Modelo LLM**: \`${a.llmModel}\`
- **Visibilidade**: ${a.visibility}
- **Custom**: ${a.isCustom ? 'sim' : 'nao'}
- **Comandos**: ${(a.commands || []).length > 0 ? a.commands.map(c => `\`${c}\``).join(', ') : '(nenhum)'}
- **Tools**: ${(a.tools || []).length > 0 ? a.tools.join(', ') : '(nenhum)'}
- **Skills**: ${(a.skills || []).length > 0 ? a.skills.join(', ') : '(nenhum)'}`
  ).join('\n\n');

  const squadSection = squads.map(s => {
    const squadAgents = (s.agentIds || []).map(id => agents.find(a => a.slug === id)).filter(Boolean);
    const taskSection = (s.tasks || []).length > 0
      ? s.tasks.map((t, i) => `  ${i + 1}. **${t.name}** — agente: \`${t.agentSlug}\`${t.dependencies.length > 0 ? `, depende de: ${t.dependencies.join(', ')}` : ''}`).join('\n')
      : '  (nenhuma task definida)';
    const workflowSection = (s.workflows || []).length > 0
      ? s.workflows.map(w => `  - **${w.name}**: ${(w.steps || []).map(st => `${st.name} (\`${st.agentSlug}\`)`).join(' → ')}`).join('\n')
      : '  (nenhum workflow definido)';

    return `### ${s.name} (\`${s.slug}\`)
- **Descricao**: ${s.description || '(sem descricao)'}
- **Agentes**: ${squadAgents.map(a => `${a!.name} (\`${a!.slug}\`)`).join(', ') || '(vazio)'}
- **Tasks**:
${taskSection}
- **Workflows**:
${workflowSection}`;
  }).join('\n\n');

  // Build agent commands table (m6)
  const agentCommandsTable = agents.map(a => {
    const cmds = (a.commands || []).map(c => `\`${c}\``).join(', ') || '(nenhum)';
    return `| @${a.slug} | ${a.category || 'Outros'} | ${cmds} |`;
  }).join('\n');

  return {
    path: 'CLAUDE.md',
    type: 'md',
    complianceStatus: 'pending',
    content: `# ${name} — AIOS v1.0.0

${project.description || 'Sistema AIOS de orquestracao de agentes IA.'}
Dominio: ${project.domain || 'software'} | Orquestracao: ${patternInfo?.name || pattern} | Runtime: Node.js 20+

## Contexto do Dominio

${project.domain && project.domain !== 'software' ? `Este sistema opera no dominio de **${project.domain}**. Todos os agentes devem gerar outputs contextualizados para este dominio, utilizando terminologia, padroes e regulamentacoes aplicaveis ao setor.` : 'Dominio de software. Os agentes devem seguir boas praticas de engenharia de software.'}

${project.description ? `**Descricao do projeto**: ${project.description}` : ''}

## Principios Constitucionais (nao-negociaveis)

1. **CLI First**: toda funcionalidade deve operar 100% via CLI antes de qualquer UI
2. **Story-Driven**: nenhum codigo sem Story ID associado em \`docs/stories/\`
3. **Agent Authority**: apenas @devops executa deploy e push para producao
4. **No Invention**: implementar exatamente o especificado na Story, sem adicoes
5. **Quality Gates**: \`npm run lint && npm test\` devem passar antes de qualquer merge

## Stack

- **Runtime**: Node.js >= 20 + TypeScript 5
- **Orquestracao**: AIOS Engine (padrao: ${patternInfo?.name || pattern})
- **LLMs**: ${[...new Set(agents.map(a => a.llmModel))].join(', ') || '(nenhum definido)'}
- **Containerizacao**: Docker + Docker Compose

## Estrutura do projeto

\`\`\`
${slug}/
  aios.config.yaml        → Configuracao central do sistema AIOS
  CLAUDE.md                → Este arquivo (documentacao para IA)
  package.json             → Dependencias Node.js
  tsconfig.json            → Configuracao TypeScript
  Dockerfile               → Build de producao
  docker-compose.yaml      → Orquestracao de containers
  .env.example             → Template de variaveis de ambiente
  .gitignore               → Arquivos ignorados pelo git
  src/
    main.ts                → Entry point do sistema
    orchestrator.ts        → Motor de orquestracao (${patternInfo?.name || pattern})
    agent-runner.ts        → Executor de agentes (chamadas LLM)
    logger.ts              → Logging estruturado
    env.ts                 → Validacao de variaveis de ambiente
    types.ts               → Definicoes de tipos TypeScript
  agents/                  → Definicoes de agentes
${agents.map(a => `    ${a.slug}.yaml          → Config do agente ${a.name}\n    ${a.slug}.md            → Documentacao do agente ${a.name}`).join('\n')}
  squads/                  → Definicoes de squads
${squads.map(s => `    ${s.slug}/\n      squad.yaml          → Manifesto do squad ${s.name}\n      README.md           → Documentacao do squad ${s.name}`).join('\n')}
  docs/
    setup.md               → Guia de instalacao
    architecture.md        → Documentacao de arquitetura
    stories/
      TEMPLATE.md          → Template padrao para stories
  .aios/
    memory/
      project-status.yaml  → Status atual do projeto
      decisions.json       → Decisoes arquiteturais
      codebase-map.json    → Mapa do codebase
  scripts/
    setup.sh               → Script de setup automatizado
\`\`\`

## Padrao de orquestracao: ${patternInfo?.name || pattern}

${patternInfo?.description || ''}

${patternInfo?.useCases ? `**Casos de uso**: ${patternInfo.useCases.join(', ')}` : ''}

### Como funciona

- **Configuracao**: \`aios.config.yaml\` define o padrao, agentes e squads
- **Entry point**: \`src/main.ts\` inicializa o sistema e cria o orquestrador
- **Orquestrador**: \`src/orchestrator.ts\` implementa o padrao ${pattern} com estrategias para roteamento e execucao de tarefas
- **Agentes**: \`src/agent-runner.ts\` carrega definicoes YAML e invoca o LLM correto para cada agente

## Agentes (${agents.length})

${agentCategorySection || '(nenhum agente configurado)'}

${agentDetailSection || ''}

## Squads (${squads.length})

${squads.length > 0 ? squadSection : '(nenhum squad configurado)'}

## Hierarquia do sistema

\`\`\`
[Orquestrador: ${patternInfo?.name || pattern}]
${agents.length > 0 ? agents.map(a => {
  const memberOf = squads.filter(s => (s.agentIds || []).includes(a.slug));
  return `  ├── ${a.name} (${a.role})${memberOf.length > 0 ? ` → squads: ${memberOf.map(s => s.name).join(', ')}` : ''}`;
}).join('\n') : '  (sem agentes)'}
${squads.length > 0 ? '\n' + squads.map(s => {
  const members = (s.agentIds || []).map(id => agents.find(a => a.slug === id)?.name || id);
  return `  [Squad: ${s.name}]\n${members.map(m => `    └── ${m}`).join('\n')}`;
}).join('\n') : ''}
\`\`\`

## Integracoes LLM

| Agente | Modelo | Provider |
|--------|--------|----------|
${agents.map(a => {
  let provider = 'OpenAI';
  if (a.llmModel.includes('claude') || a.llmModel.includes('anthropic')) provider = 'Anthropic';
  else if (a.llmModel.includes('gemini') || a.llmModel.includes('google')) provider = 'Google';
  return `| ${a.name} | \`${a.llmModel}\` | ${provider} |`;
}).join('\n') || '| (vazio) | - | - |'}

## Comandos

\`\`\`bash
npm install        # Instalar dependencias
npm run dev        # Executar em modo desenvolvimento (tsx)
npm run build      # Compilar TypeScript
npm start          # Executar em producao
npm run setup      # Script de setup completo
\`\`\`

### Docker

\`\`\`bash
docker compose up --build    # Build e executar
docker build -t ${slug} .    # Apenas build
\`\`\`

## Comandos por Agente

| Agente | Categoria | Comandos |
|--------|-----------|----------|
${agentCommandsTable || '| (vazio) | - | - |'}

## Memoria Institucional

Diretorio \`.aios/memory/\` armazena estado persistente entre sessoes:

- \`project-status.yaml\` — Status atual do projeto, fase, proximos passos
- \`decisions.json\` — Registro de decisoes arquiteturais (ADRs)
- \`codebase-map.json\` — Mapa de arquivos e componentes do projeto
- \`patterns.json\` — Padroes identificados no codigo
- \`gotchas.md\` — Armadilhas e problemas conhecidos

## Convencoes

- Configuracao central em \`aios.config.yaml\` (YAML) — unica fonte de verdade
- Definicoes de agentes em \`agents/<slug>.yaml\` e \`agents/<slug>.md\`
- Definicoes de squads em \`squads/<slug>/squad.yaml\`
- Stories em \`docs/stories/\` — obrigatorio antes de implementar
- Variaveis de ambiente em \`.env\` (nunca commitadas)
- Logs estruturados via \`src/logger.ts\`
- Tipos TypeScript centralizados em \`src/types.ts\`
- Cada agente e um arquivo YAML independente, editavel sem recompilar
- Squads agrupam agentes para tarefas coordenadas
`,
  };
}

function generateInstallationManual(
  name: string,
  slug: string,
  project: Partial<AiosProject>,
  agents: AiosAgent[],
  squads: AiosSquad[],
  pattern: OrchestrationPatternType,
  patternInfo?: any,
): GeneratedFile {
  const usesOpenAI = agents.some(a => a.llmModel.includes('gpt') || a.llmModel.includes('openai'));
  const usesClaude = agents.some(a => a.llmModel.includes('claude') || a.llmModel.includes('anthropic'));
  const usesGemini = agents.some(a => a.llmModel.includes('gemini') || a.llmModel.includes('google'));

  const providerSections: string[] = [];
  if (usesOpenAI) providerSections.push(`#### OpenAI
- Acesse https://platform.openai.com/api-keys
- Crie uma nova API key
- Defina no \`.env\`: \`OPENAI_API_KEY=sk-...\`
- Modelos usados: ${agents.filter(a => a.llmModel.includes('gpt') || a.llmModel.includes('openai')).map(a => `\`${a.llmModel}\` (${a.name})`).join(', ')}`);
  if (usesClaude) providerSections.push(`#### Anthropic (Claude)
- Acesse https://console.anthropic.com/settings/keys
- Crie uma nova API key
- Defina no \`.env\`: \`ANTHROPIC_API_KEY=sk-ant-...\`
- Modelos usados: ${agents.filter(a => a.llmModel.includes('claude') || a.llmModel.includes('anthropic')).map(a => `\`${a.llmModel}\` (${a.name})`).join(', ')}`);
  if (usesGemini) providerSections.push(`#### Google (Gemini)
- Acesse https://aistudio.google.com/apikey
- Crie uma nova API key
- Defina no \`.env\`: \`GOOGLE_API_KEY=...\`
- Modelos usados: ${agents.filter(a => a.llmModel.includes('gemini') || a.llmModel.includes('google')).map(a => `\`${a.llmModel}\` (${a.name})`).join(', ')}`);
  if (providerSections.length === 0) providerSections.push(`#### Provider padrao
- Configure ao menos uma chave: \`OPENAI_API_KEY\`, \`ANTHROPIC_API_KEY\` ou \`GOOGLE_API_KEY\``);

  const agentOpsSection = agents.map(a =>
    `| \`${a.slug}\` | ${a.name} | ${a.role} | \`${a.llmModel}\` | \`agents/${a.slug}.yaml\` |`
  ).join('\n');

  const squadOpsSection = squads.map(s => {
    const members = (s.agentIds || []).map(id => agents.find(a => a.slug === id)?.name || id).join(', ');
    return `| \`${s.slug}\` | ${s.name} | ${members || '(vazio)'} | ${s.tasks.length} | \`squads/${s.slug}/squad.yaml\` |`;
  }).join('\n');

  return {
    path: 'docs/manual.md',
    type: 'md',
    complianceStatus: 'pending',
    content: `# Manual de Instalacao e Operacao

## ${name}

> ${project.description || 'Sistema AIOS de orquestracao de agentes IA'}
> Dominio: ${project.domain || 'software'} | Orquestracao: ${patternInfo?.name || pattern}

---

## Indice

1. [Pre-requisitos](#1-pre-requisitos)
2. [Instalacao](#2-instalacao)
3. [Configuracao](#3-configuracao)
4. [Executando o Sistema](#4-executando-o-sistema)
5. [Operacao](#5-operacao)
6. [Agentes](#6-agentes)
7. [Squads](#7-squads)
8. [Orquestracao](#8-orquestracao)
9. [Docker](#9-docker)
10. [Personalizacao](#10-personalizacao)
11. [Monitoramento e Logs](#11-monitoramento-e-logs)
12. [Troubleshooting](#12-troubleshooting)
13. [Referencia de Comandos](#13-referencia-de-comandos)

---

## 1. Pre-requisitos

### Software necessario

| Requisito | Versao minima | Verificacao |
|-----------|---------------|-------------|
| Node.js | >= 20.0.0 | \`node -v\` |
| npm | >= 10.0.0 | \`npm -v\` |
| Git | >= 2.30 | \`git --version\` |
| Docker (opcional) | >= 24.0 | \`docker --version\` |
| Docker Compose (opcional) | >= 2.20 | \`docker compose version\` |

### API Keys necessarias

Este sistema utiliza ${agents.length} agente(s) que requerem acesso a LLMs:

${providerSections.join('\n\n')}

### Recursos de hardware recomendados

- **Desenvolvimento**: 4GB RAM, 2 CPU cores
- **Producao**: 8GB RAM, 4 CPU cores (varia com carga)
- **Disco**: 500MB para o projeto + dependencias

---

## 2. Instalacao

### 2.1 Setup automatizado (recomendado)

\`\`\`bash
# Extraia o pacote e entre no diretorio
cd ${slug}

# Execute o script de setup
bash scripts/setup.sh
\`\`\`

O script ira:
- Verificar a versao do Node.js
- Instalar dependencias via \`npm install\`
- Criar o arquivo \`.env\` a partir de \`.env.example\`
- Compilar o TypeScript

### 2.2 Setup manual

\`\`\`bash
# 1. Entre no diretorio do projeto
cd ${slug}

# 2. Instale as dependencias
npm install

# 3. Crie o arquivo de configuracao de ambiente
cp .env.example .env

# 4. Edite o .env com suas API keys
# Use seu editor preferido (vim, nano, code, etc.)

# 5. Compile o TypeScript
npm run build
\`\`\`

### 2.3 Verificacao da instalacao

\`\`\`bash
# Verificar que a compilacao foi bem-sucedida
ls dist/main.js

# Verificar configuracao
cat aios.config.yaml

# Teste rapido (deve iniciar e mostrar logs)
npm run dev
\`\`\`

---

## 3. Configuracao

### 3.1 Variaveis de ambiente (\`.env\`)

| Variavel | Obrigatoria | Descricao |
|----------|-------------|-----------|
| \`OPENAI_API_KEY\` | ${usesOpenAI ? 'Sim' : 'Condicional'} | Chave da API OpenAI |
| \`ANTHROPIC_API_KEY\` | ${usesClaude ? 'Sim' : 'Condicional'} | Chave da API Anthropic |
| \`GOOGLE_API_KEY\` | ${usesGemini ? 'Sim' : 'Condicional'} | Chave da API Google (Gemini) |
| \`DATABASE_URL\` | Nao | URL de conexao do banco de dados |
| \`LOG_LEVEL\` | Nao | Nivel de log: debug, info, warn, error (padrao: info) |
| \`NODE_ENV\` | Nao | Ambiente: development, production (padrao: production) |
| \`PORT\` | Nao | Porta do servidor (padrao: 3000) |

> **Importante**: Nunca commite o arquivo \`.env\`. Ele ja esta no \`.gitignore\`.

### 3.2 Configuracao central (\`aios.config.yaml\`)

O arquivo \`aios.config.yaml\` e a configuracao principal do sistema. Ele define:

- **Nome e dominio** do sistema
- **Padrao de orquestracao** (${patternInfo?.name || pattern})
- **Lista de agentes** registrados com seus modelos
- **Lista de squads** com composicao de agentes
- **Politica de retry** e timeouts
- **Configuracao de logging**

Para alterar o padrao de orquestracao:
\`\`\`yaml
orchestration:
  pattern: "${pattern}"  # Altere para outro padrao se necessario
\`\`\`

Padroes disponiveis: \`SEQUENTIAL_PIPELINE\`, \`PARALLEL_SWARM\`, \`HIERARCHICAL\`, \`WATCHDOG\`, \`COLLABORATIVE\`, \`TASK_FIRST\`

### 3.3 Configuracao de agentes

Cada agente possui dois arquivos em \`agents/\`:

- **\`<slug>.yaml\`** — Configuracao tecnica (modelo, temperatura, comandos)
- **\`<slug>.md\`** — Documentacao e system prompt

Para modificar o comportamento de um agente, edite seu arquivo YAML:
\`\`\`yaml
llm:
  model: "gemini-3-flash-preview"  # Modelo LLM
  temperature: 0.7                         # Criatividade (0.0 a 1.0)
  max_tokens: 4096                         # Tamanho maximo da resposta

system_prompt: |
  Seu prompt de sistema aqui...
\`\`\`

### 3.4 Configuracao de squads

Cada squad possui um diretorio em \`squads/<slug>/\` com:

- **\`squad.yaml\`** — Manifesto com agentes, tasks e workflows
- **\`README.md\`** — Documentacao do squad

---

## 4. Executando o Sistema

### 4.1 Modo desenvolvimento

\`\`\`bash
npm run dev
\`\`\`

Usa \`tsx\` para execucao direta de TypeScript com hot-reload.
Ideal para testes e iteracao rapida.

### 4.2 Modo producao

\`\`\`bash
# Compilar
npm run build

# Executar
npm start
\`\`\`

### 4.3 Via Docker

\`\`\`bash
# Build e executar
docker compose up --build

# Executar em background
docker compose up -d --build

# Parar
docker compose down

# Ver logs
docker compose logs -f
\`\`\`

### 4.4 Saida esperada ao iniciar

\`\`\`
[INFO] Iniciando ${name} (padrao: ${pattern})
[INFO] Variaveis de ambiente validadas
[INFO] ${agents.length} agente(s) registrado(s)
[INFO] ${squads.length} squad(s) configurado(s)
[INFO] Sistema AIOS pronto. Aguardando tarefas...
\`\`\`

---

## 5. Operacao

### 5.1 Fluxo de execucao

1. O sistema inicia via \`src/main.ts\`
2. Variaveis de ambiente sao validadas (\`src/env.ts\`)
3. O \`AgentRunner\` e criado para gerenciar chamadas LLM (\`src/agent-runner.ts\`)
4. O \`Orchestrator\` e configurado com o padrao **${patternInfo?.name || pattern}** (\`src/orchestrator.ts\`)
5. Agentes sao carregados a partir dos arquivos YAML em \`agents/\`
6. O sistema aguarda tarefas para orquestrar

### 5.2 Enviando tarefas

Atualmente o sistema opera via importacao programatica:

\`\`\`typescript
import { aiosConfig } from './main.js';
import { createOrchestrator } from './orchestrator.js';
import { createAgentRunner } from './agent-runner.js';

const runner = createAgentRunner(env);
const orchestrator = createOrchestrator(aiosConfig, runner);

const result = await orchestrator.run({
  task: "Descreva a tarefa aqui",
  context: { chave: "valor" }
});

console.log(result.output);
\`\`\`

---

## 6. Agentes

### 6.1 Registro de agentes

| Slug | Nome | Role | Modelo | Config |
|------|------|------|--------|--------|
${agentOpsSection || '| (nenhum) | - | - | - | - |'}

### 6.2 Ciclo de vida de um agente

1. **Carregamento**: O \`AgentRunner\` le o arquivo \`agents/<slug>.yaml\`
2. **System Prompt**: O prompt de sistema e extraido da configuracao
3. **Invocacao**: O orquestrador envia a tarefa ao agente via LLM
4. **Resposta**: O agente retorna o resultado ao orquestrador
5. **Roteamento**: O resultado pode ser passado ao proximo agente (dependendo do padrao)

### 6.3 Adicionando um novo agente

1. Crie \`agents/novo-agente.yaml\`:
\`\`\`yaml
slug: "novo-agente"
name: "Novo Agente"
role: "Descricao do role"
version: "1.0.0"
llm:
  model: "gemini-3-flash-preview"
  temperature: 0.7
  max_tokens: 4096
system_prompt: |
  Voce e o Novo Agente...
commands: []
tools: []
skills: []
\`\`\`

2. Registre em \`aios.config.yaml\`:
\`\`\`yaml
agents:
  - slug: "novo-agente"
    name: "Novo Agente"
    role: "Descricao do role"
    model: "gemini-3-flash-preview"
    config: "agents/novo-agente.yaml"
\`\`\`

3. O \`src/main.ts\` carrega automaticamente do YAML — nenhuma alteracao necessaria

### 6.4 Removendo um agente

1. Delete os arquivos \`agents/<slug>.yaml\` e \`agents/<slug>.md\`
2. Remova a entrada de \`aios.config.yaml\`
3. Remova de qualquer squad que o contenha

---

## 7. Squads

### 7.1 Registro de squads

| Slug | Nome | Agentes | Tasks | Config |
|------|------|---------|-------|--------|
${squadOpsSection || '| (nenhum) | - | - | - | - |'}

### 7.2 Estrutura de um squad

Um squad agrupa agentes para trabalhar em tarefas coordenadas:

- **Agentes**: Lista de agentes que compoem o squad
- **Tasks**: Tarefas individuais assignadas a agentes especificos
- **Workflows**: Sequencias de passos que definem o fluxo de trabalho

### 7.3 Adicionando um novo squad

1. Crie o diretorio \`squads/novo-squad/\`
2. Crie \`squads/novo-squad/squad.yaml\`:
\`\`\`yaml
name: "Novo Squad"
slug: "novo-squad"
description: "Descricao do squad"
agents:
  - slug: "dev"
    name: "Developer"
tasks: []
workflows: []
\`\`\`
3. Registre em \`aios.config.yaml\`

---

## 8. Orquestracao

### 8.1 Padrao atual: ${patternInfo?.name || pattern}

${patternInfo?.description || ''}

${pattern === 'SEQUENTIAL_PIPELINE' ? `**Como funciona**: Cada agente recebe a saida do agente anterior como contexto, formando um pipeline linear.

\`\`\`
Agente A → Agente B → Agente C → Resultado final
\`\`\`` : ''}${pattern === 'PARALLEL_SWARM' ? `**Como funciona**: Todos os agentes recebem a mesma tarefa simultaneamente. Os resultados sao agregados.

\`\`\`
         ┌→ Agente A ─┐
Tarefa ──┼→ Agente B ──┼→ Resultado agregado
         └→ Agente C ─┘
\`\`\`` : ''}${pattern === 'HIERARCHICAL' ? `**Como funciona**: Um agente master planeja e delega tarefas para agentes subordinados.

\`\`\`
        [Master]
       /   |   \\
  Agent A  B    C
\`\`\`` : ''}${pattern === 'WATCHDOG' ? `**Como funciona**: Agentes executam tarefas enquanto um supervisor monitora e valida os resultados.

\`\`\`
[Supervisor] ← monitora ← [Workers A, B, C]
\`\`\`` : ''}${pattern === 'COLLABORATIVE' ? `**Como funciona**: Agentes compartilham contexto e iteram em multiplas rodadas de colaboracao.

\`\`\`
[Agente A] ↔ [Contexto Compartilhado] ↔ [Agente B]
\`\`\`` : ''}${pattern === 'TASK_FIRST' ? `**Como funciona**: O orquestrador analisa cada tarefa e a atribui dinamicamente ao agente mais adequado.

\`\`\`
Tarefa → [Orchestrator] → seleciona → [Agente mais adequado] → Resultado
\`\`\`` : ''}

### 8.2 Alterando o padrao

Para mudar o padrao de orquestracao:

1. Edite \`aios.config.yaml\`: altere \`orchestration.pattern\`
2. Recompile: \`npm run build\`
3. O \`src/main.ts\` carrega automaticamente do YAML

---

## 9. Docker

### 9.1 Build

\`\`\`bash
docker build -t ${slug} .
\`\`\`

### 9.2 Executar

\`\`\`bash
docker run --env-file .env -p 3000:3000 ${slug}
\`\`\`

### 9.3 Docker Compose

\`\`\`bash
# Iniciar
docker compose up -d --build

# Parar
docker compose down

# Reconstruir apos mudancas
docker compose up -d --build --force-recreate
\`\`\`

### 9.4 Volumes montados

O \`docker-compose.yaml\` monta os seguintes volumes em modo leitura:
- \`./agents\` → Definicoes de agentes (editavel sem rebuild)
- \`./squads\` → Definicoes de squads (editavel sem rebuild)
- \`./aios.config.yaml\` → Configuracao central (editavel sem rebuild)

---

## 10. Personalizacao

### 10.1 Modificar system prompt de um agente

Edite \`agents/<slug>.yaml\` na secao \`system_prompt\`. Nao requer recompilacao — o prompt e lido em runtime.

### 10.2 Trocar modelo LLM de um agente

Edite \`agents/<slug>.yaml\`:
\`\`\`yaml
llm:
  model: "claude-sonnet-4-20250514"  # Novo modelo
\`\`\`

Modelos suportados:
- OpenAI: \`gpt-5\`, \`gpt-5-mini\`, \`gpt-5.2\`
- Anthropic: \`claude-sonnet-4-20250514\`, \`claude-haiku-4-20250414\`
- Google: \`gemini-3-flash-preview\`, \`gemini-3-pro-preview\`

### 10.3 Ajustar politica de retry

Edite \`aios.config.yaml\`:
\`\`\`yaml
orchestration:
  retry_policy:
    max_retries: 5      # Numero de tentativas
    backoff_ms: 2000     # Delay entre tentativas
  timeout_ms: 600000     # Timeout total (10 min)
\`\`\`

---

## 11. Monitoramento e Logs

### 11.1 Niveis de log

| Nivel | Uso |
|-------|-----|
| \`debug\` | Detalhes de cada chamada LLM e roteamento |
| \`info\` | Eventos operacionais (padrao) |
| \`warn\` | Avisos (API key ausente, retry) |
| \`error\` | Erros (falha de agente, timeout) |

Configure via \`.env\`:
\`\`\`bash
LOG_LEVEL=debug  # Para troubleshooting
LOG_LEVEL=info   # Para operacao normal
\`\`\`

### 11.2 Formato de saida

\`\`\`
[2024-01-15T10:30:00.000Z] [INFO] Iniciando ${name} (padrao: ${pattern})
[2024-01-15T10:30:00.050Z] [INFO] Variaveis de ambiente validadas
[2024-01-15T10:30:00.100Z] [DEBUG] [Agent:dev] Invocando modelo gemini-3-flash-preview
\`\`\`

---

## 12. Troubleshooting

### Erro: "Nenhuma API key configurada"
- **Causa**: Arquivo \`.env\` nao existe ou as chaves estao vazias
- **Solucao**: \`cp .env.example .env\` e preencha as chaves

### Erro: "Node.js >= 20 necessario"
- **Causa**: Versao do Node.js desatualizada
- **Solucao**: Atualize via \`nvm install 20\` ou baixe em nodejs.org

### Erro: "Erro ao invocar agente"
- **Causa**: API key invalida, modelo incorreto ou limite de rate
- **Solucao**: Verifique a chave, o nome do modelo e os limites da sua conta

### Erro de compilacao TypeScript
- **Causa**: Dependencias desatualizadas
- **Solucao**: \`rm -rf node_modules && npm install && npm run build\`

### Docker: "port already in use"
- **Causa**: Porta 3000 ocupada
- **Solucao**: Altere \`PORT\` no \`.env\` ou pare o processo que usa a porta

---

## 13. Referencia de Comandos

| Comando | Descricao |
|---------|-----------|
| \`npm install\` | Instalar dependencias |
| \`npm run dev\` | Executar em modo desenvolvimento |
| \`npm run build\` | Compilar TypeScript |
| \`npm start\` | Executar em modo producao |
| \`npm run lint\` | Verificar tipos TypeScript |
| \`npm run setup\` | Executar script de setup completo |
| \`docker compose up --build\` | Build e executar via Docker |
| \`docker compose down\` | Parar containers |
| \`docker compose logs -f\` | Seguir logs do container |

---

*Manual gerado automaticamente por AIOS Forge.*
*Projeto: ${name} | Dominio: ${project.domain || 'software'} | Padrao: ${patternInfo?.name || pattern}*
*Agentes: ${agents.length} | Squads: ${squads.length}*
`,
  };
}

function generateReadme(
  name: string,
  project: Partial<AiosProject>,
  agents: AiosAgent[],
  squads: AiosSquad[],
  patternInfo?: any,
): GeneratedFile {
  return {
    path: 'README.md',
    type: 'md',
    complianceStatus: 'pending',
    content: `# ${name}

${project.description || 'Sistema AIOS de orquestracao de agentes IA.'}

| Propriedade | Valor |
|-------------|-------|
| Dominio | ${project.domain || 'software'} |
| Orquestracao | ${patternInfo?.name || project.orchestrationPattern || 'Task-First'} |
| Agentes | ${agents.length} |
| Squads | ${squads.length} |

## Agentes

| Agente | Role | Modelo | Tools | Skills |
|--------|------|--------|-------|--------|
${agents.map(a => `| ${a.name} | ${a.role} | ${a.llmModel} | ${a.tools.length} | ${a.skills.length} |`).join('\n')}

## Squads

${squads.length > 0 ? squads.map(s => {
  const members = (s.agentIds || []).map(id => { const found = agents.find(a => a.slug === id); return found ? found.name : id; }).join(', ');
  return '### ' + s.name + '\n' + (s.description || '_Sem descricao_') + '\n\n**Agentes:** ' + (members || '_Nenhum agente atribuido_');
}).join('\n\n') : '_Nenhum squad configurado._'}

## Quick Start

\`\`\`bash
npm install
cp .env.example .env   # Edite com suas API keys
npm run dev             # Inicia modo interativo
\`\`\`

## Documentacao

- **[Manual de Instalacao e Operacao](docs/manual.md)** — Guia completo
- **[Guia de Setup](docs/setup.md)** — Instalacao passo a passo
- **[Arquitetura](docs/architecture.md)** — Diagramas e decisoes tecnicas
- **[CLAUDE.md](CLAUDE.md)** — Contexto para instancias IA

## Licenca

Projeto privado. Todos os direitos reservados.
`,
  };
}

function generateSetupGuide(name: string, agents: AiosAgent[]): GeneratedFile {
  return {
    path: 'docs/setup.md',
    type: 'md',
    complianceStatus: 'pending',
    content: `# Guia de Instalacao - ${name}

## Pre-requisitos

- Node.js >= 20.0.0
- npm ou yarn
- Uma API key de LLM (OpenAI, Anthropic, ou Google)

## Passo a Passo

### 1. Instalar Dependencias

\`\`\`bash
npm install
\`\`\`

### 2. Configurar Ambiente

\`\`\`bash
cp .env.example .env
\`\`\`

Edite o arquivo \`.env\` e configure pelo menos uma API key:

- \`OPENAI_API_KEY\` - Para modelos GPT
- \`ANTHROPIC_API_KEY\` - Para modelos Claude
- \`GOOGLE_API_KEY\` - Para modelos Gemini

### 3. Verificar Configuracao

Revise o arquivo \`aios.config.yaml\` para ajustar:
- Padrao de orquestracao
- Agentes ativos
- Configuracoes de runtime

### 4. Executar

\`\`\`bash
# Modo desenvolvimento (com hot-reload)
npm run dev

# Modo producao
npm run build && npm start
\`\`\`

### 5. Docker (Opcional)

\`\`\`bash
docker compose up --build
\`\`\`

## Personalizacao

### Modificar Agentes

Edite os arquivos em \`agents/\` para customizar:
- System prompts
- Modelos LLM
- Comandos e ferramentas

### Modificar Squads

Edite os arquivos em \`squads/\` para ajustar:
- Composicao de agentes
- Tasks e workflows
- Dependencias entre tarefas
`,
  };
}

function generateArchitectureDoc(
  name: string,
  pattern: OrchestrationPatternType,
  agents: AiosAgent[],
  squads: AiosSquad[],
  patternInfo?: any,
): GeneratedFile {
  return {
    path: 'docs/architecture.md',
    type: 'md',
    complianceStatus: 'pending',
    content: `# Arquitetura - ${name}

## Padrao de Orquestracao: ${patternInfo?.name || pattern}

${patternInfo?.description || ''}

## Diagrama de Fluxo

\`\`\`
${generateAsciiDiagram(pattern, agents, squads)}
\`\`\`

## Agentes

${agents.map(a => `### ${a.name}
- **Role:** ${a.role}
- **Modelo:** \`${a.llmModel}\`
- **Visibilidade:** ${a.visibility}
- **Comandos:** ${(a.commands || []).map(c => `\`${c}\``).join(', ') || 'nenhum'}
`).join('\n')}

## Squads

${squads.map(s => `### ${s.name}
- **Descricao:** ${s.description || 'N/A'}
- **Agentes:** ${(s.agentIds || []).join(', ') || 'vazio'}
- **Tasks:** ${s.tasks.length}
- **Workflows:** ${s.workflows.length}
`).join('\n') || '(nenhum squad)'}
`,
  };
}

function generateAsciiDiagram(
  pattern: OrchestrationPatternType,
  agents: AiosAgent[],
  squads: AiosSquad[],
): string {
  const names = agents.map(a => a.name.substring(0, 12));
  if (names.length === 0) return '  (sem agentes)';

  switch (pattern) {
    case 'SEQUENTIAL_PIPELINE':
      return `  ${names.join(' --> ')}`;
    case 'PARALLEL_SWARM':
      return `        ┌─ ${names[0] || '?'}\n  Start ─┼─ ${names[1] || '?'}\n        └─ ${names.slice(2).join('\n        └─ ') || '...'}`;
    case 'HIERARCHICAL':
      return `       [Master]\n     /    |    \\\n  ${names.slice(0, 3).join('  ')}`;
    default:
      return `  [Orchestrator] --> [${names.join(', ')}]`;
  }
}

function generateProjectStatus(name: string, pattern: string): GeneratedFile {
  return {
    path: '.aios/memory/project-status.yaml',
    type: 'yaml',
    complianceStatus: 'pending',
    content: `# AIOS Institutional Memory - Project Status
# Updated automatically by agents during execution

project: "${name}"
version: "1.0.0"
phase: "setup"
pattern: "${pattern}"
created_at: "${new Date().toISOString().split('T')[0]}"

current_sprint:
  number: 0
  goal: "Setup inicial do sistema AIOS"
  status: "not_started"

next_steps:
  - "Configurar variaveis de ambiente (.env)"
  - "Validar conexao com API do LLM"
  - "Executar primeira tarefa de teste"
  - "Definir stories iniciais em docs/stories/"

blockers: []

notes: |
  Pacote recem-gerado. Executar setup inicial antes de operar.
`,
  };
}

function generateDecisionsJson(): GeneratedFile {
  return {
    path: '.aios/memory/decisions.json',
    type: 'json',
    complianceStatus: 'pending',
    content: JSON.stringify([], null, 2) + '\n',
  };
}

function generateCodebaseMap(agents: AiosAgent[], squads: AiosSquad[], workflows: ProjectWorkflow[] = []): GeneratedFile {
  const map = {
    generated_at: new Date().toISOString(),
    structure: {
      config: ['aios.config.yaml', '.env.example'],
      runtime: ['src/main.ts', 'src/orchestrator.ts', 'src/agent-runner.ts', 'src/logger.ts', 'src/env.ts', 'src/types.ts', 'src/validate.ts'],
      agents: agents.map(a => ({ slug: a.slug, files: [`agents/${a.slug}.yaml`, `agents/${a.slug}.md`, `src/agents/${slugToPascal(a.slug)}.agent.ts`] })),
      squads: squads.map(s => ({ slug: s.slug, files: [`squads/${s.slug}/squad.yaml`, `squads/${s.slug}/README.md`] })),
      workflows: workflows.map(w => ({ slug: w.slug, files: [`workflows/${w.slug}.yaml`] })),
      docs: ['README.md', 'FIRST-RUN.md', 'CLAUDE.md', 'docs/manual.md', 'docs/setup.md', 'docs/architecture.md', 'docs/stories/'],
      infra: ['Dockerfile', 'docker-compose.yaml', 'scripts/setup.sh'],
    },
    patterns: [],
    gotchas: [],
  };
  return {
    path: '.aios/memory/codebase-map.json',
    type: 'json',
    complianceStatus: 'pending',
    content: JSON.stringify(map, null, 2) + '\n',
  };
}

function generateStoryTemplate(): GeneratedFile {
  return {
    path: 'docs/stories/TEMPLATE.md',
    type: 'md',
    complianceStatus: 'pending',
    content: `# Story: [STORY-ID] — [Titulo]

## Descricao
Como [persona], eu quero [acao], para que [beneficio].

## Criterios de Aceite
- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3

## Agente Responsavel
@dev (ou o agente designado)

## Dependencias
- Nenhuma

## Notas Tecnicas
(detalhes de implementacao, se necessario)

## Status
- [ ] Em analise
- [ ] Aprovada pelo @po
- [ ] Em desenvolvimento
- [ ] Em teste (@qa)
- [ ] Concluida
`,
  };
}

function generateGitignore(): GeneratedFile {
  return {
    path: '.gitignore',
    type: 'other',
    complianceStatus: 'pending',
    content: `node_modules/
dist/
.env
*.log
.DS_Store
.aios/memory/*.log
.aios/memory/runtime-*.json
`,
  };
}

function generateSetupScript(slug: string): GeneratedFile {
  return {
    path: 'scripts/setup.sh',
    type: 'other',
    complianceStatus: 'pending',
    content: `#!/bin/bash
set -e

echo "================================================"
echo "  Setup: ${slug}"
echo "================================================"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 20 ]; then
  echo "ERRO: Node.js >= 20 necessario. Versao atual: $(node -v 2>/dev/null || echo 'nao instalado')"
  exit 1
fi
echo "Node.js: $(node -v)"

# Install dependencies
echo ""
echo "Instalando dependencias..."
npm install

# Setup .env
if [ ! -f .env ]; then
  echo ""
  echo "Criando .env a partir de .env.example..."
  cp .env.example .env
  echo "IMPORTANTE: Edite .env e configure suas API keys."
fi

# Build
echo ""
echo "Compilando TypeScript..."
npm run build

echo ""
echo "================================================"
echo "  Setup concluido!"
echo "  Execute: npm run dev"
echo "================================================"
`,
  };
}

function generateFirstRunMd(
  name: string,
  _slug: string,
  project: Partial<AiosProject>,
  agents: AiosAgent[],
  squads: AiosSquad[],
  integrations: ConfiguredIntegration[] = [],
): GeneratedFile {
  const hasN8N = integrations.some(i => i.type === 'N8N');
  const hasNotion = integrations.some(i => i.type === 'NOTION');
  const hasMiro = integrations.some(i => i.type === 'MIRO');
  const hasMCP = integrations.some(i => i.type === 'MCP_SERVER');

  // Dynamic provider detection based on actual agent models (item 9)
  const usesOpenAI = agents.some(a => a.llmModel.includes('gpt') || a.llmModel.includes('openai'));
  const usesClaude = agents.some(a => a.llmModel.includes('claude') || a.llmModel.includes('anthropic'));
  const usesGemini = agents.some(a => a.llmModel.includes('gemini') || a.llmModel.includes('google'));

  const providerRows: string[] = [];
  if (usesOpenAI) providerRows.push(`| API Key OpenAI | \`OPENAI_API_KEY\` | ${agents.filter(a => a.llmModel.includes('gpt') || a.llmModel.includes('openai')).map(a => a.name).join(', ')} |`);
  if (usesClaude) providerRows.push(`| API Key Anthropic | \`ANTHROPIC_API_KEY\` | ${agents.filter(a => a.llmModel.includes('claude') || a.llmModel.includes('anthropic')).map(a => a.name).join(', ')} |`);
  if (usesGemini) providerRows.push(`| API Key Google | \`GOOGLE_API_KEY\` | ${agents.filter(a => a.llmModel.includes('gemini') || a.llmModel.includes('google')).map(a => a.name).join(', ')} |`);
  if (providerRows.length === 0) providerRows.push('| API Key (qualquer provider) | `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_API_KEY` | Todos |');

  const providerPrereqs: string[] = [];
  if (usesOpenAI) providerPrereqs.push('- [ ] **API Key OpenAI** válida em mãos');
  if (usesClaude) providerPrereqs.push('- [ ] **API Key Anthropic** válida em mãos');
  if (usesGemini) providerPrereqs.push('- [ ] **API Key Google** válida em mãos');
  if (providerPrereqs.length === 0) providerPrereqs.push('- [ ] **API Key de LLM** (OpenAI, Anthropic ou Google) válida em mãos');

  const envKeys: string[] = [];
  if (usesOpenAI) envKeys.push('OPENAI_API_KEY');
  if (usesClaude) envKeys.push('ANTHROPIC_API_KEY');
  if (usesGemini) envKeys.push('GOOGLE_API_KEY');
  if (envKeys.length === 0) envKeys.push('sua API key de LLM');

  const integrationChecklist: string[] = [];
  if (hasN8N) integrationChecklist.push('- [ ] Testar conectividade N8N — verificar que a instância responde em `N8N_BASE_URL`');
  if (hasNotion) integrationChecklist.push('- [ ] Testar conectividade Notion — verificar `NOTION_API_KEY` e acesso a páginas (`NOTION_ROOT_PAGE_ID`)');
  if (hasMiro) integrationChecklist.push('- [ ] Testar conectividade Miro — verificar `MIRO_ACCESS_TOKEN` e acesso ao board (`MIRO_BOARD_ID`)');
  if (hasMCP) integrationChecklist.push('- [ ] Testar conectividade MCP Server — verificar `MCP_SERVER_URL` e autenticação');

  const integrationSection = integrationChecklist.length > 0 ? `
## 🔌 Integrações Configuradas

${integrationChecklist.join('\n')}
` : '';

  return {
    path: 'FIRST-RUN.md',
    content: `# FIRST-RUN.md — ${name}

> Checklist de primeiro uso do seu AIOS. Siga as seções em ordem.
> **Tempo estimado para first-value: ≤ 10 minutos.**

---

## ✅ O que está incluído vs. o que você precisa prover

| Incluído no Pacote | Você Precisa Prover |
|---|---|
| aios.config.yaml configurado | Node.js 20+ e npm 10+ |
| Definições de ${agents.length} agente(s) | ${providerRows.length > 0 ? 'API Key(s) conforme tabela abaixo' : 'API Key de LLM'} |
| ${squads.length} squad(s) com manifests | IDE compatível (Claude Code, Cursor, etc.) |
| .env.example com variáveis | .env preenchido com suas keys |
| package.json com dependências | \`npm install\` executado |
| Configurações de IDE | Autenticação na IDE |
| README.md e documentação | — |

### API Keys necessárias por provider

| Provider | Variável | Agentes que utilizam |
|----------|----------|---------------------|
${providerRows.join('\n')}

---

## 🔧 Pré-requisitos

- [ ] **Node.js 20+** instalado → verifique com \`node --version\`
- [ ] **npm 10+** disponível → verifique com \`npm --version\`
- [ ] **IDE compatível** instalada (Claude Code, Cursor, Codex CLI ou Gemini CLI)
${providerPrereqs.join('\n')}
${hasN8N ? '- [ ] **N8N** — instância acessível com API key\n' : ''}${hasNotion ? '- [ ] **Notion** — API key e ID da página raiz\n' : ''}${hasMiro ? '- [ ] **Miro** — Access token e ID do board\n' : ''}${hasMCP ? '- [ ] **MCP Server** — URL e token de autenticação\n' : ''}
## 📦 Setup Inicial

- [ ] Extraia o pacote ZIP em um diretório de sua escolha
- [ ] Execute \`npm install\` na raiz do projeto
- [ ] Copie \`.env.example\` para \`.env\` e preencha suas API keys:
  \`\`\`bash
  cp .env.example .env
  # Edite .env e configure ${envKeys.join(', ')}${hasN8N ? ', N8N_API_KEY' : ''}${hasNotion ? ', NOTION_API_KEY' : ''}${hasMiro ? ', MIRO_ACCESS_TOKEN' : ''}
  \`\`\`
- [ ] Execute \`npm run validate\` (ou \`npx aios-core doctor\`) para verificar integridade

## 🚀 Validação de First-Value (≤ 10 min)

> Se estes 3 passos funcionarem, seu AIOS está operacional.

- [ ] **Ativar um agente** na IDE — abra a IDE e ative um agente (ex: \`@dev\`)
- [ ] **Confirmar greeting** — o agente deve responder com sua apresentação e papel
- [ ] **Executar \`*help\`** — verifique a lista de comandos disponíveis
${integrationSection}
## 📊 Observabilidade (Opcional)

- [ ] Instalar o [AIOS Dashboard](https://github.com/SynkraAI/aios-dashboard) para monitoramento visual
- [ ] Iniciar o server de eventos SSE
- [ ] Acessar o dashboard em \`http://localhost:3001\`

---

**Padrão de orquestração**: ${project.orchestrationPattern || 'TASK_FIRST'}
**Agentes**: ${agents.map(a => a.name).join(', ') || 'Nenhum'}
**Squads**: ${squads.map(s => s.name).join(', ') || 'Nenhum'}

> Gerado pelo AIOS Builder v1.1 — ${new Date().toISOString().split('T')[0]}
`,
    type: 'md',
    complianceStatus: 'passed',
  };
}
