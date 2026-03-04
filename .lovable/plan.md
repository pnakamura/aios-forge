

# Correcao: Squad "core" orfao e inconsistencias de nomenclatura

## Problema Raiz

Quando um agente **nao pertence a nenhum squad** criado pelo usuario, o motor de geracao usa o fallback `'core'` como squad (linhas 238, 275, 321, 415, 427 de `generate-aios-package.ts`). Porem, esse squad `core` **nunca e declarado** no `aios.config.yaml` nem gera pasta `squads/core/`. Resultado: agentes orfaos que referenciam um squad inexistente.

O AppMaster sempre usa `squad: 'core'` hardcoded (linha 415/427), independente dos squads existentes.

## Correcao

### Arquivo: `src/lib/generate-aios-package.ts`

**1. Auto-gerar squad "core" quando necessario**

No inicio de `generateAiosPackage()` (apos linha 38), verificar se existem agentes sem squad. Se sim, criar automaticamente um squad `core` com esses agentes e adiciona-lo a lista de squads usada na geracao. O AppMaster tambem sera incluido nesse squad.

```
const orphanAgents = agents.filter(a => !squads.some(s => (s.agentIds || []).includes(a.slug)));
const needsCoreSquad = orphanAgents.length > 0;
const effectiveSquads = needsCoreSquad
  ? [...squads, { id: 'core', slug: 'core', name: 'Core', agentIds: [...orphanAgents.map(a => a.slug), 'app-master'] }]
  : squads;
```

Substituir todas as referencias a `squads` por `effectiveSquads` nas chamadas de geracao.

**2. AppMaster usa squad dinamico**

O `generateAppMasterAgent` passara a receber os squads efetivos e usara o slug do squad core (ou o primeiro squad disponivel) em vez de hardcodar `'core'`.

**3. Fallback com squad real em vez de string magica**

Nas funcoes `generateAgentMd`, `generateAgentTs`, e `generateAgentConfig`, o fallback `|| 'core'` sera substituido por referencia ao squad core auto-gerado, garantindo consistencia.

### Resultado

- Todo agente orfao sera atribuido ao squad `core` auto-gerado
- O `aios.config.yaml` listara o squad `core` com sua pasta `squads/core/`
- O `squads/core/squad.yaml` e `squads/core/README.md` serao gerados
- O AppMaster pertencera ao squad `core` de forma consistente
- A revisao de conformidade nao reportara mais squad inexistente

