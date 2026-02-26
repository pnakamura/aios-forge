
# Filtro de Workflows no Diagrama de Arquitetura

## Objetivo

Adicionar um seletor multi-escolha no painel do diagrama que permita ao usuario escolher quais workflows visualizar como edges. Quando ha multiplos workflows, o usuario pode ativar/desativar cada um individualmente.

## Abordagem

### 1. Estado local de workflows visiveis

Adicionar `useState<Set<string>>` chamado `visibleWorkflowIds` inicializado com todos os IDs dos workflows. Sempre que a lista de workflows mudar (novo workflow adicionado/removido), sincronizar o Set para incluir novos e remover inexistentes.

### 2. Filtrar workflows antes de passar para `buildDiagramData`

Em vez de passar `workflows` direto, filtrar apenas os que estao no `visibleWorkflowIds`:

```text
const filteredWorkflows = workflows.filter(w => visibleWorkflowIds.has(w.id));
```

Passar `filteredWorkflows` para `buildDiagramData` no `useMemo`.

### 3. UI: Painel de selecao de workflows

Adicionar um componente no `Panel position="top-right"` (ao lado do botao "+ Squad") com:

- Um botao dropdown "Workflows" com icone `Zap` que abre/fecha uma lista
- A lista mostra cada workflow com:
  - Checkbox colorido (laranja/coral, a cor do tipo `workflow`)
  - Nome do workflow
  - Contagem de steps
- Botoes rapidos "Todos" e "Nenhum" para toggle em massa
- O painel so aparece quando `workflows.length > 0`
- Quando ha apenas 1 workflow, ele fica ativo por padrao e o seletor aparece simplificado (apenas toggle on/off)

### 4. Estilo visual

- Background `bg-card/95 backdrop-blur-sm` consistente com os outros paineis do diagrama
- Texto `text-[10px]` e `text-[11px]` seguindo o padrao existente
- Indicador visual (bolinha laranja) ao lado de cada workflow para reforcar a cor dos edges
- Border e shadow consistentes com os paineis existentes

## Arquivo impactado

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/wizard/ArchitectureDiagram.tsx` | Adicionar estado `visibleWorkflowIds`, filtrar workflows no `useMemo`, renderizar painel de selecao no `Panel` top-right |

## Detalhes tecnicos

```text
// Novo estado
const [visibleWorkflowIds, setVisibleWorkflowIds] = useState<Set<string>>(new Set());

// Sync com workflows disponveis
useEffect(() => {
  setVisibleWorkflowIds(prev => {
    const allIds = new Set(workflows.map(w => w.id));
    const next = new Set<string>();
    // Manter selecionados que ainda existem + adicionar novos
    for (const id of allIds) {
      if (prev.size === 0 || prev.has(id) || !prev.has(id)) next.add(id);
    }
    return next;
  });
}, [workflows]);

// Filtrar antes do useMemo
const filteredWorkflows = useMemo(
  () => workflows.filter(w => visibleWorkflowIds.has(w.id)),
  [workflows, visibleWorkflowIds]
);

// Passar filteredWorkflows em vez de workflows para buildDiagramData
```

O painel de selecao sera um dropdown colapsavel renderizado dentro do `Panel position="top-right"` existente, usando estado local `showWorkflowFilter` para toggle.
