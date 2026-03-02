import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Voce e o AIOS Compliance Reviewer, um agente especializado em validar artefatos contra o padrao Synkra AIOS v4.2.13.

REGRAS POR TIPO DE ARQUIVO:

1. Arquivos .agent.ts (src/agents/*.agent.ts):
   - OBRIGATORIO: header JSDoc com @agent, @persona, @version, @squad, @commands, @deps, @context
   - OBRIGATORIO: export const [Name]Agent com campos: name, slug, persona, version, squad, model, commands, context
   - OBRIGATORIO: export type [Name]Commands
   - Cada comando deve ter visibility (full|quick|key) e description
   - O AppMaster.agent.ts deve ter campo squads mapeando todos os squads do projeto

2. Arquivos .md (agents/*.md):
   - OBRIGATORIO: frontmatter YAML com agent, slug, version, squad, model
   - OBRIGATORIO: secao persona_profile como tabela Markdown com colunas Campo e Valor, contendo name, role, style, visibility, constraints
   - OBRIGATORIO: secoes System Prompt, Commands (tabela com Comando, Visibilidade, Descricao), Tools, Skills, Dependencies, Context
   - Commands devem ter visibilidade inferida corretamente (full, quick ou key)

3. Arquivos .yaml (agents/*.yaml):
   - OBRIGATORIO: slug, name, role, version
   - OBRIGATORIO: bloco llm com model, temperature, max_tokens
   - OBRIGATORIO: visibility, system_prompt, commands, tools, skills

4. Squad YAML (squads/*/squad.yaml):
   - OBRIGATORIO: name, slug, version, agents, tasks, workflows
   - Cada task: id, name, description, agent, dependencies, checklist
   - Cada workflow: id, name, steps (cada step com id, name, agent)
   - Cross-check: agentes referenciados nos tasks/workflows devem existir nos arquivos de agente

5. aios.config.yaml:
   - OBRIGATORIO: name, version, domain, orchestration.pattern, agents, squads, logging, runtime
   - Cross-check: slugs de agentes e squads devem corresponder aos arquivos individuais

6. FIRST-RUN.md:
   - OBRIGATORIO: secoes Pre-requisitos, Setup Inicial, First-Value, tabela "incluido vs necessario"

7. README.md:
   - OBRIGATORIO: titulo do projeto, descricao, instrucoes de setup, lista de agentes

CROSS-VALIDATION (analise todos os arquivos em conjunto):
- Todo agente listado em aios.config.yaml deve ter correspondente .md, .yaml e .agent.ts
- Todo agente referenciado em um squad.yaml deve existir em aios.config.yaml
- O AppMaster.agent.ts deve listar todos os squads do projeto no campo squads
- Comandos devem ser consistentes entre .md, .yaml e .agent.ts do mesmo agente

SEVERIDADE:
- failed: campo obrigatorio ausente, cross-reference quebrada, header @agent faltando
- warning: campo opcional ausente, descricao vazia, inconsistencia menor entre arquivos
- passed: totalmente conforme ao padrao v4.2.13

Para cada arquivo, retorne o status geral e uma lista detalhada de violations encontradas.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { files } = await req.json();
    if (!Array.isArray(files) || files.length === 0) {
      return new Response(JSON.stringify({ error: "No files provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const filesDescription = files.map((f: any) => `--- ${f.path} (${f.type}) ---\n${f.content}`).join("\n\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Valide estes ${files.length} arquivos AIOS contra o padrao v4.2.13. Faca cross-validation entre todos os arquivos:\n\n${filesDescription}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "validate_files",
            description: "Return compliance validation results with detailed violations for each file",
            parameters: {
              type: "object",
              properties: {
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      path: { type: "string", description: "File path" },
                      status: { type: "string", enum: ["passed", "warning", "failed"], description: "Overall compliance status" },
                      notes: { type: "string", description: "Summary of compliance findings" },
                      violations: {
                        type: "array",
                        description: "List of individual rule violations found",
                        items: {
                          type: "object",
                          properties: {
                            rule: { type: "string", description: "Rule identifier (e.g. missing_header, cross_ref_broken, missing_section, empty_field, missing_visibility)" },
                            severity: { type: "string", enum: ["error", "warning", "info"], description: "Violation severity" },
                            detail: { type: "string", description: "Human-readable explanation of the violation" },
                          },
                          required: ["rule", "severity", "detail"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["path", "status", "notes", "violations"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["results"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "validate_files" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Add credits to your workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call response from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("compliance review error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
