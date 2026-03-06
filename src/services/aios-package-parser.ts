/**
 * @agent     AiosPackageParser
 * @persona   Parser de pacotes AIOS (.skill, .agent, .squad, .workflow) gerados pelo Claude Code
 * @commands  parseAiosPackage, detectAiosPackageType, isAiosPackage
 * @deps      jszip
 * @context   Extrai e converte arquivos ZIP do padrao AIOS em objetos compativeis com o schema do banco.
 */

import JSZip from 'jszip';
import type { LibraryEntityType } from '@/types/library';

/** Maps file extension to entity type */
const EXT_TO_TYPE: Record<string, LibraryEntityType> = {
  skill: 'skill',
  agent: 'agent',
  squad: 'squad',
  workflow: 'workflow',
};

/** Maps entity type to expected main MD file name */
const TYPE_TO_MD: Record<LibraryEntityType, string> = {
  skill: 'SKILL.md',
  agent: 'AGENT.md',
  squad: 'SQUAD.md',
  workflow: 'WORKFLOW.md',
};

/** Alternate section header names (PT-BR, EN, variants) mapped to canonical keys */
const SECTION_ALIASES: Record<string, string> = {
  // description
  description: 'description',
  'descrição': 'description',
  descricao: 'description',
  objetivo: 'description',
  overview: 'description',
  resumo: 'description',
  about: 'description',
  // prompt
  prompt: 'prompt',
  'system prompt': 'prompt',
  system_prompt: 'prompt',
  instrucoes: 'prompt',
  'instruções': 'prompt',
  instructions: 'prompt',
  contexto: 'prompt',
  context: 'prompt',
  checklist: 'prompt',
  regras: 'prompt',
  rules: 'prompt',
  comportamento: 'prompt',
  behavior: 'prompt',
  // inputs
  inputs: 'inputs',
  entradas: 'inputs',
  parametros: 'inputs',
  'parâmetros': 'inputs',
  parameters: 'inputs',
  // outputs
  outputs: 'outputs',
  'saídas': 'outputs',
  saidas: 'outputs',
  resultados: 'outputs',
  results: 'outputs',
  // examples
  examples: 'examples',
  exemplos: 'examples',
  // role
  role: 'role',
  papel: 'role',
  // commands
  commands: 'commands',
  comandos: 'commands',
  // tools
  tools: 'tools',
  ferramentas: 'tools',
  // agents (for squads)
  agents: 'agents',
  agentes: 'agents',
  // tasks
  tasks: 'tasks',
  tarefas: 'tasks',
  // pattern (for workflows)
  pattern: 'pattern',
  padrao: 'pattern',
  'padrão': 'pattern',
  // steps
  steps: 'steps',
  etapas: 'steps',
  // triggers
  triggers: 'triggers',
  gatilhos: 'triggers',
};

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Parses simple YAML front-matter between --- markers.
 */
function parseYamlFrontMatter(raw: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = raw.split('\n');

  let currentKey = '';
  let inArray = false;
  const arrayItems: string[] = [];

  const flushArray = () => {
    if (inArray && currentKey) {
      result[currentKey] = arrayItems.slice();
      arrayItems.length = 0;
      inArray = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('- ') && inArray) {
      arrayItems.push(trimmed.slice(2).replace(/^["']|["']$/g, '').trim());
      continue;
    }

    const kvMatch = trimmed.match(/^([a-z_][a-z0-9_]*)\s*:\s*(.*)/i);
    if (kvMatch) {
      flushArray();
      const [, key, rawVal] = kvMatch;
      currentKey = key;
      const val = rawVal.trim();

      if (!val) {
        inArray = true;
        continue;
      }

      const inlineArr = val.match(/^\[(.*)\]$/);
      if (inlineArr) {
        result[key] = inlineArr[1]
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
        continue;
      }

      if (val === 'true' || val === 'false') {
        result[key] = val === 'true';
        continue;
      }

      if (/^\d+(\.\d+)?$/.test(val)) {
        result[key] = Number(val);
        continue;
      }

      result[key] = val.replace(/^["']|["']$/g, '');
    } else if (trimmed.startsWith('- ')) {
      inArray = true;
      arrayItems.push(trimmed.slice(2).replace(/^["']|["']$/g, '').trim());
    }
  }
  flushArray();

  return result;
}

/**
 * Parses structured list items like:
 *   - **param_name** (type): description
 *   - param_name: description
 */
function parseIOList(section: string): { name: string; type: string; description: string }[] {
  const items: { name: string; type: string; description: string }[] = [];
  const lines = section.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('-') && !trimmed.startsWith('*')) continue;

    const content = trimmed.replace(/^[-*]\s*/, '');

    // Pattern: **name** (type): description
    const boldMatch = content.match(/^\*\*(.+?)\*\*\s*(?:\((.+?)\))?\s*:?\s*(.*)/);
    if (boldMatch) {
      items.push({
        name: boldMatch[1].trim(),
        type: boldMatch[2]?.trim() || 'string',
        description: boldMatch[3]?.trim() || '',
      });
      continue;
    }

    // Pattern: `name` (type): description
    const codeMatch = content.match(/^`(.+?)`\s*(?:\((.+?)\))?\s*:?\s*(.*)/);
    if (codeMatch) {
      items.push({
        name: codeMatch[1].trim(),
        type: codeMatch[2]?.trim() || 'string',
        description: codeMatch[3]?.trim() || '',
      });
      continue;
    }

    // Pattern: name: description  OR  name — description  OR  name - description
    const simpleMatch = content.match(/^([a-z_][a-z0-9_]*)\s*[:—–-]\s*(.*)/i);
    if (simpleMatch) {
      items.push({
        name: simpleMatch[1].trim(),
        type: 'string',
        description: simpleMatch[2]?.trim() || '',
      });
      continue;
    }

    // Fallback: entire line as name
    if (content.length > 0 && content.length < 60) {
      items.push({ name: content, type: 'string', description: '' });
    }
  }

  return items;
}

/**
 * Parses examples from markdown.
 */
function parseExamples(section: string): { title: string; input: string; output: string }[] {
  const examples: { title: string; input: string; output: string }[] = [];
  const blocks = section.split(/^###\s+/m).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n');
    const title = lines[0]?.trim() || 'Exemplo';
    const rest = lines.slice(1).join('\n');

    const inputMatch = rest.match(/(?:^|\n)\s*(?:\*\*)?Input(?:\*\*)?[:\s]*([\s\S]*?)(?=(?:\n\s*(?:\*\*)?Output|\n###|$))/i);
    const outputMatch = rest.match(/(?:^|\n)\s*(?:\*\*)?Output(?:\*\*)?[:\s]*([\s\S]*?)(?=\n###|$)/i);

    examples.push({
      title,
      input: inputMatch?.[1]?.trim() || '',
      output: outputMatch?.[1]?.trim() || '',
    });
  }

  return examples;
}

/**
 * Strips blockquote markers (`> `) from text.
 */
function stripBlockquotes(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/^>\s?/, ''))
    .join('\n')
    .trim();
}

/**
 * Splits markdown content into sections by ## headers.
 * Returns a map of canonical key → content using SECTION_ALIASES.
 */
function splitSections(md: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const parts = md.split(/^##\s+/m);

  for (const part of parts.slice(1)) {
    const newlineIdx = part.indexOf('\n');
    if (newlineIdx === -1) continue;
    const rawHeader = part.slice(0, newlineIdx).trim().toLowerCase();
    const content = part.slice(newlineIdx + 1).trim();

    // Resolve alias to canonical key
    const canonical = SECTION_ALIASES[rawHeader] || rawHeader;
    // First match wins (don't overwrite if already set)
    if (!sections[canonical]) {
      sections[canonical] = content;
    }
  }

  return sections;
}

/**
 * Extracts the preamble text between the first # title and the first ## section.
 * Handles blockquotes and returns clean text.
 */
function extractPreamble(body: string): string {
  // Remove the first # title line
  const withoutTitle = body.replace(/^#\s+.+\n?/, '').trim();
  // Take everything before the first ## section
  const firstSectionIdx = withoutTitle.search(/^##\s+/m);
  const preamble = firstSectionIdx === -1 ? withoutTitle : withoutTitle.slice(0, firstSectionIdx).trim();
  return stripBlockquotes(preamble);
}

/**
 * Parses a SKILL.md / AGENT.md / SQUAD.md / WORKFLOW.md file content
 * into a data object suitable for DB insertion.
 */
function parseMdDefinition(
  content: string,
  entityType: LibraryEntityType,
  fallbackSlug: string
): { data: Record<string, unknown>; rawContent: string } {
  const data: Record<string, unknown> = {};
  const rawContent = content;

  // Extract YAML front-matter
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (fmMatch) {
    Object.assign(data, parseYamlFrontMatter(fmMatch[1]));
  }

  // Extract body after front-matter
  const body = fmMatch ? content.slice(fmMatch[0].length).trim() : content.trim();

  // If no front-matter, try @agent docblock style
  if (!fmMatch) {
    const nameMatch = body.match(/@(?:agent|name|skill|squad|workflow)\s+(.*)/i);
    const roleMatch = body.match(/@(?:persona|role)\s+(.*)/i);
    const slugMatch = body.match(/@slug\s+(.*)/i);
    const versionMatch = body.match(/@version\s+(.*)/i);
    const categoryMatch = body.match(/@category\s+(.*)/i);

    if (nameMatch) data.name = nameMatch[1].trim();
    if (roleMatch) data.role = roleMatch[1].trim();
    if (slugMatch) data.slug = slugMatch[1].trim();
    if (versionMatch) data.version = versionMatch[1].trim();
    if (categoryMatch) data.category = categoryMatch[1].trim();
  }

  // Split sections using aliases
  const sections = splitSections(body);
  const hasSections = Object.keys(sections).length > 0;

  // Extract title from first # header if no name yet
  if (!data.name) {
    const h1Match = body.match(/^#\s+(.+)/m);
    if (h1Match) data.name = h1Match[1].trim();
  }

  // Ensure slug
  if (!data.slug) {
    data.slug = data.name ? toSlug(data.name as string) : fallbackSlug;
  }

  // --- Extract description ---
  if (sections['description']) {
    data.description = stripBlockquotes(sections['description']);
  }

  // If no description from sections, try preamble (text between # title and first ##)
  if (!data.description || (data.description as string).length < 3) {
    const preamble = extractPreamble(body);
    if (preamble && preamble.length > 2) {
      data.description = preamble;
    }
  }

  // --- Type-specific extraction ---
  if (entityType === 'skill' || entityType === 'agent') {
    const promptKey = entityType === 'skill' ? 'prompt' : 'system_prompt';

    if (sections['prompt']) {
      data[promptKey] = stripBlockquotes(sections['prompt']);
    }

    if (sections['inputs']) {
      data.inputs = parseIOList(sections['inputs']);
    }

    if (sections['outputs']) {
      data.outputs = parseIOList(sections['outputs']);
    }

    if (sections['examples']) {
      data.examples = parseExamples(sections['examples']);
    }

    // === FALLBACK for skills: if no structured prompt found, use the whole body ===
    if (entityType === 'skill' && !data[promptKey]) {
      if (hasSections) {
        // Combine all section contents as the prompt
        const combinedSections = Object.entries(sections)
          .filter(([key]) => key !== 'description')
          .map(([, val]) => stripBlockquotes(val))
          .join('\n\n');
        if (combinedSections.trim()) {
          data[promptKey] = combinedSections.trim();
        }
      }
      // Ultimate fallback: entire body minus the title
      if (!data[promptKey]) {
        const bodyWithoutTitle = body.replace(/^#\s+.+\n?/, '').trim();
        const cleaned = stripBlockquotes(bodyWithoutTitle);
        if (cleaned.length > 10) {
          data[promptKey] = cleaned;
        }
      }
    }

    // Same fallback for agent system_prompt
    if (entityType === 'agent' && !data[promptKey]) {
      const bodyWithoutTitle = body.replace(/^#\s+.+\n?/, '').trim();
      const cleaned = stripBlockquotes(bodyWithoutTitle);
      if (cleaned.length > 10) {
        data[promptKey] = cleaned;
      }
    }
  }

  if (entityType === 'agent') {
    if (sections['role']) {
      data.role = stripBlockquotes(sections['role']);
    }
    if (sections['commands']) {
      data.commands = parseIOList(sections['commands']).map((c) => ({
        name: c.name,
        description: c.description,
      }));
    }
    if (sections['tools']) {
      data.tools = parseIOList(sections['tools']).map((t) => t.name);
    }
  }

  if (entityType === 'squad') {
    if (sections['agents']) {
      const agentItems = parseIOList(sections['agents']);
      data.agent_ids = agentItems.map((a) => a.name);
    }
    if (sections['tasks']) {
      data.tasks = parseIOList(sections['tasks']).map((t) => ({
        name: t.name,
        description: t.description,
      }));
    }
  }

  if (entityType === 'workflow') {
    if (sections['pattern']) {
      data.pattern = stripBlockquotes(sections['pattern']).split('\n')[0].trim();
    }
    if (sections['steps']) {
      data.steps = parseIOList(sections['steps']).map((s) => ({
        name: s.name,
        agentSlug: s.type !== 'string' ? s.type : undefined,
        task: s.description,
      }));
    }
    if (sections['triggers']) {
      data.triggers = parseIOList(sections['triggers']).map((t) => ({
        type: t.name,
        description: t.description,
      }));
    }
  }

  return { data, rawContent };
}

/**
 * Detects entity type from file extension.
 */
export function detectAiosPackageType(fileName: string): LibraryEntityType | null {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return EXT_TO_TYPE[ext] || null;
}

/**
 * Checks if a file is an AIOS package.
 */
export function isAiosPackage(fileName: string): boolean {
  return detectAiosPackageType(fileName) !== null;
}

/**
 * Parses an AIOS package file (ZIP) and returns the extracted data.
 */
export async function parseAiosPackage(
  file: File
): Promise<{ entityType: LibraryEntityType; data: Record<string, unknown>; errors: string[]; warnings: string[]; rawContent: string }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const entityType = detectAiosPackageType(file.name);

  if (!entityType) {
    return { entityType: 'skill', data: {}, errors: ['Extensao de arquivo nao reconhecida como pacote AIOS.'], warnings: [], rawContent: '' };
  }

  const expectedMd = TYPE_TO_MD[entityType];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    let mdContent: string | null = null;
    let dirSlug = '';

    for (const [path, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) {
        const dirName = path.replace(/\/$/, '');
        if (!dirName.includes('/')) {
          dirSlug = toSlug(dirName);
        }
        continue;
      }

      const fileName = path.split('/').pop()?.toUpperCase();
      if (fileName === expectedMd.toUpperCase()) {
        mdContent = await zipEntry.async('string');
        break;
      }
    }

    // Fallback: look for any .md file
    if (!mdContent) {
      for (const [path, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir && path.toLowerCase().endsWith('.md')) {
          mdContent = await zipEntry.async('string');
          const parts = path.split('/');
          if (parts.length > 1) {
            dirSlug = toSlug(parts[0]);
          }
          break;
        }
      }
    }

    if (!mdContent) {
      errors.push(`Arquivo ${expectedMd} nao encontrado no pacote. Certifique-se de que o ZIP contem o arquivo de definicao.`);
      return { entityType, data: {}, errors, warnings, rawContent: '' };
    }

    const { data, rawContent } = parseMdDefinition(mdContent, entityType, dirSlug || toSlug(file.name.replace(/\.[^.]+$/, '')));

    // Validate required fields
    if (!data.name) {
      if (dirSlug) {
        data.name = dirSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      } else {
        errors.push('Campo obrigatorio ausente: name. Adicione um campo name no front-matter ou um header # no MD.');
      }
    }

    if (!data.slug && data.name) {
      data.slug = toSlug(data.name as string);
    }

    if (entityType === 'agent' && !data.role) {
      data.role = (data.description as string) || 'Agente importado via pacote AIOS';
    }

    // Generate warnings for empty important fields
    if (entityType === 'skill') {
      if (!data.prompt) warnings.push('Campo "prompt" esta vazio. O conteudo da skill pode nao ter sido extraido corretamente.');
      if (!data.description || (data.description as string).length < 3) warnings.push('Campo "description" esta vazio ou muito curto.');
      if (!data.inputs || (data.inputs as unknown[]).length === 0) warnings.push('Nenhum input detectado.');
    }
    if (entityType === 'agent') {
      if (!data.system_prompt) warnings.push('Campo "system_prompt" esta vazio.');
      if (!data.description || (data.description as string).length < 3) warnings.push('Campo "description" esta vazio ou muito curto.');
    }

    return { entityType, data, errors, warnings, rawContent };
  } catch (e) {
    errors.push(`Erro ao processar pacote AIOS: ${(e as Error).message}`);
    return { entityType, data: {}, errors, warnings, rawContent: '' };
  }
}
