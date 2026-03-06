/**
 * @agent     AiosPackageParser
 * @persona   Parser de pacotes AIOS (.skill, .agent, .squad, .workflow) gerados pelo Claude Code
 * @commands  parseAiosPackage
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

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Parses simple YAML front-matter between --- markers.
 * Handles: strings, arrays (inline [...] and dash lists), booleans, numbers.
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

    // Dash list item (continuation of previous key)
    if (trimmed.startsWith('- ') && inArray) {
      arrayItems.push(trimmed.slice(2).replace(/^["']|["']$/g, '').trim());
      continue;
    }

    // Key-value pair
    const kvMatch = trimmed.match(/^([a-z_][a-z0-9_]*)\s*:\s*(.*)/i);
    if (kvMatch) {
      flushArray();
      const [, key, rawVal] = kvMatch;
      currentKey = key;
      const val = rawVal.trim();

      if (!val) {
        // Possibly an array starting on next line
        inArray = true;
        continue;
      }

      // Inline array [a, b, c]
      const inlineArr = val.match(/^\[(.*)\]$/);
      if (inlineArr) {
        result[key] = inlineArr[1]
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
        continue;
      }

      // Boolean
      if (val === 'true' || val === 'false') {
        result[key] = val === 'true';
        continue;
      }

      // Number
      if (/^\d+(\.\d+)?$/.test(val)) {
        result[key] = Number(val);
        continue;
      }

      // String (strip quotes)
      result[key] = val.replace(/^["']|["']$/g, '');
    } else if (trimmed.startsWith('- ')) {
      // Start of array for previous key
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
    if (!trimmed.startsWith('-')) continue;

    const content = trimmed.replace(/^-\s*/, '');

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

    // Pattern: name: description
    const simpleMatch = content.match(/^([a-z_][a-z0-9_]*)\s*:\s*(.*)/i);
    if (simpleMatch) {
      items.push({
        name: simpleMatch[1].trim(),
        type: 'string',
        description: simpleMatch[2]?.trim() || '',
      });
    }
  }

  return items;
}

/**
 * Parses examples from markdown:
 *   ### Example Title
 *   Input: ...
 *   Output: ...
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
 * Splits markdown content into sections by ## headers.
 * Returns a map of lowercase header → content.
 */
function splitSections(md: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const parts = md.split(/^##\s+/m);

  for (const part of parts.slice(1)) {
    const newlineIdx = part.indexOf('\n');
    if (newlineIdx === -1) continue;
    const header = part.slice(0, newlineIdx).trim().toLowerCase();
    sections[header] = part.slice(newlineIdx + 1).trim();
  }

  return sections;
}

/**
 * Parses a SKILL.md / AGENT.md / SQUAD.md / WORKFLOW.md file content
 * into a data object suitable for DB insertion.
 */
function parseMdDefinition(
  content: string,
  entityType: LibraryEntityType,
  fallbackSlug: string
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

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

  // Split sections
  const sections = splitSections(body);

  // Extract title from first # header if no name yet
  if (!data.name) {
    const h1Match = body.match(/^#\s+(.+)/m);
    if (h1Match) data.name = h1Match[1].trim();
  }

  // Ensure slug
  if (!data.slug) {
    data.slug = data.name ? toSlug(data.name as string) : fallbackSlug;
  }

  // Map sections to fields based on entity type
  if (sections['description'] || sections['descrição'] || sections['descricao']) {
    data.description = (sections['description'] || sections['descrição'] || sections['descricao']).trim();
  }

  if (entityType === 'skill' || entityType === 'agent') {
    // Prompt
    if (sections['prompt'] || sections['system prompt'] || sections['system_prompt']) {
      const promptKey = entityType === 'skill' ? 'prompt' : 'system_prompt';
      data[promptKey] = (sections['prompt'] || sections['system prompt'] || sections['system_prompt']).trim();
    }

    // Inputs
    if (sections['inputs'] || sections['entradas']) {
      data.inputs = parseIOList(sections['inputs'] || sections['entradas']);
    }

    // Outputs
    if (sections['outputs'] || sections['saídas'] || sections['saidas']) {
      data.outputs = parseIOList(sections['outputs'] || sections['saídas'] || sections['saidas']);
    }

    // Examples
    if (sections['examples'] || sections['exemplos']) {
      data.examples = parseExamples(sections['examples'] || sections['exemplos']);
    }
  }

  if (entityType === 'agent') {
    if (sections['role'] || sections['papel']) {
      data.role = (sections['role'] || sections['papel']).trim();
    }
    if (sections['commands'] || sections['comandos']) {
      data.commands = parseIOList(sections['commands'] || sections['comandos']).map((c) => ({
        name: c.name,
        description: c.description,
      }));
    }
    if (sections['tools'] || sections['ferramentas']) {
      data.tools = parseIOList(sections['tools'] || sections['ferramentas']).map((t) => t.name);
    }
  }

  if (entityType === 'squad') {
    if (sections['agents'] || sections['agentes']) {
      const agentItems = parseIOList(sections['agents'] || sections['agentes']);
      data.agent_ids = agentItems.map((a) => a.name);
    }
    if (sections['tasks'] || sections['tarefas']) {
      data.tasks = parseIOList(sections['tasks'] || sections['tarefas']).map((t) => ({
        name: t.name,
        description: t.description,
      }));
    }
  }

  if (entityType === 'workflow') {
    if (sections['pattern'] || sections['padrao'] || sections['padrão']) {
      data.pattern = (sections['pattern'] || sections['padrao'] || sections['padrão']).trim().split('\n')[0].trim();
    }
    if (sections['steps'] || sections['etapas']) {
      data.steps = parseIOList(sections['steps'] || sections['etapas']).map((s) => ({
        name: s.name,
        agentSlug: s.type !== 'string' ? s.type : undefined,
        task: s.description,
      }));
    }
    if (sections['triggers'] || sections['gatilhos']) {
      data.triggers = parseIOList(sections['triggers'] || sections['gatilhos']).map((t) => ({
        type: t.name,
        description: t.description,
      }));
    }
  }

  return data;
}

/**
 * Detects entity type from file extension.
 * Returns null if extension is not an AIOS package.
 */
export function detectAiosPackageType(fileName: string): LibraryEntityType | null {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return EXT_TO_TYPE[ext] || null;
}

/**
 * Checks if a file is an AIOS package (ZIP with .skill/.agent/.squad/.workflow extension).
 */
export function isAiosPackage(fileName: string): boolean {
  return detectAiosPackageType(fileName) !== null;
}

/**
 * Parses an AIOS package file (ZIP) and returns the extracted data
 * ready for DB insertion.
 */
export async function parseAiosPackage(
  file: File
): Promise<{ entityType: LibraryEntityType; data: Record<string, unknown>; errors: string[] }> {
  const errors: string[] = [];
  const entityType = detectAiosPackageType(file.name);

  if (!entityType) {
    return { entityType: 'skill', data: {}, errors: ['Extensao de arquivo nao reconhecida como pacote AIOS.'] };
  }

  const expectedMd = TYPE_TO_MD[entityType];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Find the main MD file — could be at root or inside a subdirectory
    let mdContent: string | null = null;
    let dirSlug = '';

    for (const [path, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) {
        // Extract slug from directory name
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
          // Try to extract slug from path
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
      return { entityType, data: {}, errors };
    }

    const data = parseMdDefinition(mdContent, entityType, dirSlug || toSlug(file.name.replace(/\.[^.]+$/, '')));

    // Validate required fields
    if (!data.name) {
      // Try to derive name from slug or directory
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

    return { entityType, data, errors };
  } catch (e) {
    errors.push(`Erro ao processar pacote AIOS: ${(e as Error).message}`);
    return { entityType, data: {}, errors };
  }
}
