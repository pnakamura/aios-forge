
# Correcao: Conectores ignoram opacidade do estilo

## Causa raiz

O componente customizado `RelationEdge` (linha 377) **nao recebe nem utiliza** a propriedade `style` do edge. Ele define seu proprio `style` inline no `BaseEdge` com opacidade fixa (0.8 ou 0.9). Por isso, a opacidade `0.1` aplicada via `setEdges` e completamente ignorada pelo React Flow -- o edge sempre renderiza opaco.

## Correcao

### 1. Receber `style` no `RelationEdge`

Adicionar `style` aos props desestruturados do `RelationEdge` (extrair de `EdgeProps`).

### 2. Propagar opacidade externa para o `BaseEdge` e label

Dentro do componente, usar a opacidade do `style` externo (quando presente) multiplicando-a com a opacidade interna, ou simplesmente aplicando-a como override. A abordagem mais simples: usar `style?.opacity` se definida, senao manter o padrao atual.

```text
// No BaseEdge:
style={{
  stroke: color,
  strokeDasharray: cfg.dash || undefined,
  strokeWidth: selected ? 3 : 2,
  opacity: style?.opacity ?? (selected ? 1 : (isLight ? 0.9 : 0.8)),
  filter: selected ? ... : undefined,
  transition: style?.transition,
}}

// No label (EdgeLabelRenderer div):
style={{
  ...existingStyles,
  opacity: style?.opacity ?? 1,
  transition: style?.transition,
}}
```

Isso garante que tanto a linha do conector quanto seu label de texto fiquem transparentes quando o edge nao pertence ao workflow selecionado.

## Arquivo impactado

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/wizard/ArchitectureDiagram.tsx` | Linhas 377-422: adicionar `style` aos props de `RelationEdge` e propagar `opacity` e `transition` para `BaseEdge` e label |
