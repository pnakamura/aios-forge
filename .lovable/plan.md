

# Aprimorar Criacao e Edicao de Agentes

## Resumo
Criar um editor completo de agentes com suporte a CRUD de comandos, ferramentas (tools), skills e memoria. Substituir os dialogs limitados atuais por um editor unificado e reutilizavel.

## O que muda

### 1. Novo tipo: campo `memory` no AiosAgent
Adicionar campo `memory` ao tipo `AiosAgent` em `src/types/aios.ts`:
- `memory: AgentMemory[]` - lista de entradas de memoria
- Novo tipo `AgentMemory` com campos: `id`, `key`, `content`, `type` (short_term | long_term | episodic)

### 2. Novo componente: `AgentEditor.tsx`
Criar `src/components/wizard/AgentEditor.tsx` - um dialog/sheet completo com abas para editar todos os campos de um agente:

**Aba "Geral":**
- Nome, Slug, Role, Categoria, Modelo LLM, Visibilidade
- System Prompt (textarea expandivel)

**Aba "Comandos":**
- Lista de comandos existentes com botao de remover (X)
- Input + botao "Adicionar" para novos comandos
- Cada comando exibido como badge editavel

**Aba "Ferramentas":**
- Mesmo padrao: lista + adicionar/remover
- Cada ferramenta com nome e descricao opcional

**Aba "Skills":**
- Lista + adicionar/remover
- Cada skill como tag/badge

**Aba "Memoria":**
- Lista de entradas de memoria com key/content/type
- Botao para adicionar nova entrada
- Select para tipo (short_term, long_term, episodic)
- Botao remover por entrada

Usa o componente `Tabs` do shadcn/ui para organizar as secoes.

### 3. Atualizar `AgentCatalog.tsx`
- Dialog de criacao customizado: incluir campos para comandos, tools, skills (com o mesmo padrao de lista + adicionar)
- Ao clicar em um agente ja adicionado, abrir o `AgentEditor` em modo edicao em vez do dialog de detalhes read-only
- Manter o dialog de detalhes para agentes nativos nao adicionados (visualizacao)

### 4. Atualizar `ArchitectureDiagram.tsx`
- Substituir o dialog de edicao simples (linhas 888-990) pelo componente `AgentEditor`
- Corrigir o bug de build na linha 739: usar `ConnectionLineType.SmoothStep` em vez da string `"smoothstep"`

### 5. Atualizar `wizard-store.ts`
- `updateAgent` ja funciona com `Partial<AiosAgent>`, nenhuma alteracao necessaria no store

### 6. Atualizar banco de dados
- Nao precisa de migracao: o campo `memory` sera armazenado dentro do JSONB `config` do projeto, ou podemos adicionar uma coluna `memory jsonb default '[]'` na tabela `agents`

---

## Detalhes Tecnicos

### Novo tipo `AgentMemory`
```text
interface AgentMemory {
  id: string;
  key: string;
  content: string;
  type: 'short_term' | 'long_term' | 'episodic';
}
```

### Componente `AgentEditor` - padrao de lista editavel
Cada secao (commands, tools, skills, memory) segue o mesmo padrao:
- Estado local com array de itens
- Input controlado + botao "Adicionar" (ou Enter para confirmar)
- Itens renderizados como badges/cards com botao X para remover
- Ao salvar, chama `updateAgent(slug, { commands, tools, skills, memory })`

### Correcao do bug de build
Na linha 739 de `ArchitectureDiagram.tsx`:
- Importar `ConnectionLineType` de `@xyflow/react`
- Trocar `connectionLineType="smoothstep"` por `connectionLineType={ConnectionLineType.SmoothStep}`

### Arquivos impactados
- `src/types/aios.ts` - adicionar `AgentMemory`, campo `memory` em `AiosAgent`
- `src/components/wizard/AgentEditor.tsx` - novo componente (editor completo com abas)
- `src/components/wizard/AgentCatalog.tsx` - integrar AgentEditor, melhorar dialog de criacao
- `src/components/wizard/ArchitectureDiagram.tsx` - usar AgentEditor, corrigir bug de build
- `supabase/migrations/` - adicionar coluna `memory` na tabela `agents` (opcional)
