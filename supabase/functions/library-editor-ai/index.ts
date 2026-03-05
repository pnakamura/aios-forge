import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getSystemPrompt(entityType: string, currentData: Record<string, unknown>, context: Record<string, unknown>) {
  const typeLabel = entityType.toUpperCase();
  const aiosVersion = context?.aiosCoreVersion || '4.2.13';
  const availableAgents = (context?.availableAgents as string[]) || [];
  const availableSkills = (context?.availableSkills as string[]) || [];
  const pattern = context?.orchestrationPattern || '';

  const typeRules: Record<string, string> = {
    agent: `### Para Agents:
- O system prompt deve ter as secoes: ROLE, CONTEXT, RESPONSIBILITIES, COMMANDS, OUTPUT FORMAT
- O slug deve ser lowercase-kebab-case sem prefixo "aios-" (reservado para nativos)
- Comandos devem ter prefixo *, descricao clara e retorno esperado definido
- A visibilidade "key" e para agentes que devem aparecer em resumos de squads
- O modelo LLM deve ser compativel com as tools configuradas
- Agents de categoria "Meta" orquestram outros; nao devem ter responsabilidades de execucao direta`,
    skill: `### Para Skills:
- Inputs e outputs devem ser tipados (string, json, file, url, markdown, code)
- O prompt da skill deve ter uma secao OBJECTIVE e uma secao CONSTRAINTS
- Skills nao devem ter efeitos colaterais nao declarados nos outputs
- Exemplos devem cobrir o happy path e pelo menos 1 caso de borda`,
    squad: `### Para Squads:
- Todo squad deve ter ao menos 1 agente de planejamento (analyst, pm ou architect)
- Tasks devem ter um agente responsavel claramente definido
- Workflows devem ter condicoes de saida explicitas em cada step
- Squads nao devem ter dependencias circulares entre tasks`,
    workflow: `### Para Workflows:
- Pattern "sequential" requer ordem explicita sem paralelismo
- Pattern "parallel" requer definicao de como os resultados serao mergeados
- Pattern "conditional" requer branches com condicoes booleanas claras
- Todo workflow deve ter pelo menos 1 trigger definido
- O ultimo step deve ter um output de "completion" definido`,
  };

  return `Voce e um especialista senior em AIOS Core v${aiosVersion} e arquitetura de agentes IA.
Voce esta auxiliando na criacao/refinamento de um elemento do tipo: ${typeLabel}.

## Seu papel
Voce e um consultor tecnico, nao um assistente generico. Suas respostas devem:
- Ser precisas e baseadas nos padroes oficiais do AIOS Core v4.x
- Sugerir melhorias concretas com justificativa tecnica
- Apontar inconsistencias ou anti-patterns
- Propor exemplos reais de uso do elemento sendo editado
- Quando sugerir mudancas nos campos, use a tool apply_fields

## Padroes AIOS Core:
${typeRules[entityType] || ''}

## Contexto atual:
- AIOS Core Version: ${aiosVersion}
- Agentes disponiveis: ${availableAgents.join(', ') || '(nenhum)'}
- Skills disponiveis: ${availableSkills.join(', ') || '(nenhuma)'}
${pattern ? `- Padrao de orquestracao: ${pattern}` : ''}

## Estado atual do elemento:
\`\`\`json
${JSON.stringify(currentData, null, 2)}
\`\`\`

## Instrucoes:
- Responda sempre em PT-BR
- Quando sugerir conteudo para campos, use SEMPRE a tool apply_fields
- Antes de aplicar, explique o que esta mudando e por que
- Se o estado atual estiver bem estruturado, diga isso
- Nao invente capacidades que nao existem no AIOS Core
- Quando o usuario pedir "revisar" ou "validar", faca analise sistematica como checklist`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, entityType, currentData, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = getSystemPrompt(entityType || 'agent', currentData || {}, context || {});

    const tools = [
      {
        type: "function",
        function: {
          name: "apply_fields",
          description: "Aplica sugestoes de alteracao diretamente nos campos do formulario do editor.",
          parameters: {
            type: "object",
            properties: {
              fields: {
                type: "object",
                description: "Objeto parcial com os campos a atualizar. Ex: { systemPrompt: '...', commands: [...] }",
              },
              summary: {
                type: "string",
                description: "Resumo curto das alteracoes aplicadas.",
              },
            },
            required: ["fields", "summary"],
            additionalProperties: false,
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        max_tokens: 8192,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisicoes excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Creditos insuficientes. Adicione creditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("Erro no gateway de IA");
    }

    // Stream SSE back
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;
              const data = trimmed.slice(6);
              if (data === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                const choice = parsed.choices?.[0];
                const delta = choice?.delta;
                if (delta?.content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta.content })}\n\n`));
                }
                if (delta?.tool_calls) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ tool_calls: delta.tool_calls })}\n\n`));
                }
              } catch {
                // skip malformed
              }
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e) {
    console.error("library-editor-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
