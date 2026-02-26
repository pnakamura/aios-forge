import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const systemPrompt = `You are an AIOS compliance validator. Review each file against these rules:

YAML files (aios.config.yaml):
- Must have: name, version, domain, orchestration, agents list, squads list
- Each agent entry needs: slug, name, model
- Each squad entry needs: slug, name, agents list

Agent MD files (agents/*.md):
- Must have YAML frontmatter with: name, slug, role, model, visibility, version
- Must have sections: Role, System Prompt, Commands

Squad YAML files (squads/*/squad.yaml):
- Must have: name, slug, version, agents list, tasks list, workflows list
- Each task needs: name, agent, description
- Each workflow needs: name, steps (each step needs name, agent)

README.md: Must have project title and setup instructions.
.env.example: Should list required environment variables.

For each file, determine: passed (fully compliant), warning (minor issues), or failed (missing required fields/sections).
Return results using the validate_files tool.`;

    const filesDescription = files.map((f: any) => `--- ${f.path} (${f.type}) ---\n${f.content}`).join("\n\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Validate these ${files.length} AIOS files:\n\n${filesDescription}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "validate_files",
            description: "Return compliance validation results for each file",
            parameters: {
              type: "object",
              properties: {
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      path: { type: "string", description: "File path" },
                      status: { type: "string", enum: ["passed", "warning", "failed"] },
                      notes: { type: "string", description: "Compliance notes explaining the result" },
                    },
                    required: ["path", "status", "notes"],
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
