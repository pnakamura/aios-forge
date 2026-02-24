import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getSystemPrompt(wizardState: any) {
  const step = wizardState?.currentStep || 'welcome';
  const project = wizardState?.project || {};
  const agents = wizardState?.agents || [];
  const squads = wizardState?.squads || [];

  const basePrompt = `Você é o assistente do AIOS Builder, um sistema de orquestração de agentes IA. 
Você ajuda usuários a configurar projetos AIOS com agentes, squads, padrões de orquestração e integrações.
Responda sempre em português do Brasil. Seja conciso e objetivo.

O sistema AIOS possui 11 agentes nativos:
1. AIOS Master - Orquestrador principal
2. AIOS Orchestrator - Motor de execução
3. Analyst - Analista de negócios
4. Product Manager - Gerente de produto
5. Architect - Arquiteto de software
6. UX Expert - Especialista em UX
7. Scrum Master - Facilitador ágil
8. Developer - Desenvolvedor
9. QA Engineer - Engenheiro de qualidade
10. Product Owner - Dono do produto
11. DevOps Engineer - Engenheiro de infraestrutura

Padrões de orquestração disponíveis:
- Pipeline Sequencial: Agentes em cadeia
- Enxame Paralelo: Agentes simultâneos
- Hierárquico: Estrutura em árvore
- Watchdog: Supervisor contínuo
- Colaborativo: Espaço compartilhado
- Task-First: Tarefas como unidade central

Estado atual do projeto:
- Nome: ${project.name || '(não definido)'}
- Domínio: ${project.domain || '(não definido)'}
- Padrão: ${project.orchestrationPattern || '(não definido)'}
- Agentes adicionados: ${agents.length > 0 ? agents.map((a: any) => a.name).join(', ') : '(nenhum)'}
- Squads: ${squads.length > 0 ? squads.map((s: any) => s.name).join(', ') : '(nenhum)'}`;

  const stepInstructions: Record<string, string> = {
    welcome: `\nEstamos na etapa de descoberta. Pergunte ao usuário sobre o projeto: qual é o domínio, o objetivo, o contexto e o tipo de sistema. Sugira o melhor padrão de orquestração e agentes iniciais. Seja acolhedor e guie a conversa. NÃO peça informações que serão coletadas no formulário (nome, descrição) — foque no contexto e estratégia.`,
    project_config: `\nO usuário está preenchendo o formulário do projeto. Ajude a confirmar o padrão de orquestração se perguntado.`,
    agents: `\nO usuário está selecionando agentes no catálogo. Sugira quais agentes são mais adequados se perguntado.`,
    squads: `\nO usuário está montando squads no builder. Sugira como agrupar os agentes em equipes se perguntado.`,
    integrations: `\nEstamos configurando integrações. Pergunte sobre ferramentas externas que o usuário usa.`,
    review: `\nEstamos na revisão final. Resuma a configuração e peça confirmação.`,
    generation: `\nO projeto está pronto para geração. Oriente o usuário a salvar ou exportar.`,
  };

  return basePrompt + (stepInstructions[step] || '');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, wizardState } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = getSystemPrompt(wizardState);

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
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("Erro no gateway de IA");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Sem resposta";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("aios-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
