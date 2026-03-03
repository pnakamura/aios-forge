

# Corrigir AppMaster.agent.ts e README.md no Gerador de Pacotes

## Arquivo: `src/lib/generate-aios-package.ts`

### Correção 1 — AppMaster.agent.ts: adicionar campo `agents`

Na função `generateAppMasterAgent` (linha ~385-428), o template já mapeia `squads` corretamente, mas falta um campo `agents` listando todos os agentes do projeto com seus metadados básicos.

**Adicionar** entre `squads` e `context` (após linha 421):

```typescript
  agents: {
${agents.map(a => `    '${a.slug}': { name: '${a.name}', role: '${a.role}', model: '${a.llmModel}' },`).join('\n')}
  },
```

Isso garante que o AppMaster tenha visibilidade completa de todos os agentes, não apenas via squads.

### Correção 2 — README.md: listar todos os agentes e squads

Na função `generateReadme` (linha ~2091-2120), expandir o conteúdo para incluir:

- Tabela de agentes com colunas: Agente, Role, Model, Tools, Skills
- Lista de squads com agentes membros

```markdown
## Agentes

| Agente | Role | Modelo | Tools | Skills |
|--------|------|--------|-------|--------|
${agents.map(a => `| ${a.name} | ${a.role} | ${a.llmModel} | ${a.tools.length} | ${a.skills.length} |`).join('\n')}

## Squads

${squads.map(s => {
  const members = s.agentIds.map(id => agents.find(a => a.slug === id)?.name || id).join(', ');
  return `### ${s.name}\n${s.description}\n**Agentes:** ${members}`;
}).join('\n\n')}
```

### Resultado

- `AppMaster.agent.ts` passa a ter `agents` + `squads` mapeando 100% do projeto
- `README.md` lista todos os agentes individualmente com role, modelo e contagens

