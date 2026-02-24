import { useState, useRef, useEffect } from 'react';
import { useWizardStore } from '@/stores/wizard-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const STEP_PROMPTS: Record<string, { title: string; subtitle: string; suggestions: string[]; quickChips: string[] }> = {
  welcome: {
    title: 'Assistente AIOS',
    subtitle: 'Descreva seu projeto e eu vou ajudar a configurar agentes, squads e toda a arquitetura.',
    suggestions: [
      'Quero criar um sistema de agentes para desenvolvimento de software',
      'Preciso de um AIOS para gerar conteudo automatizado',
      'Quero orquestrar agentes para gestao de projetos',
    ],
    quickChips: [],
  },
  context_analysis: {
    title: 'Analise de Contexto',
    subtitle: 'Vou analisar o contexto e sugerir a melhor configuracao. Pergunte-me sobre padroes e agentes.',
    suggestions: [
      'Quais agentes voce recomenda para meu caso?',
      'Qual padrao de orquestracao e mais adequado?',
      'Quais integracoes devo configurar?',
    ],
    quickChips: [
      'Recomende agentes',
      'Melhor padrao de orquestracao',
      'Quais integracoes?',
    ],
  },
  agents: {
    title: 'Configuracao de Agentes',
    subtitle: 'Adicione agentes no painel a direita ou me peca sugestoes.',
    suggestions: [
      'Quais agentes nativos sao recomendados para meu projeto?',
      'Me ajude a criar um agente customizado',
      'Explique o papel de cada agente disponivel',
    ],
    quickChips: [
      'Agentes recomendados',
      'Criar agente customizado',
      'Explicar agentes',
    ],
  },
  squads: {
    title: 'Montagem de Squads',
    subtitle: 'Crie squads no painel a direita ou me peca sugestoes de organizacao.',
    suggestions: [
      'Sugira squads para os agentes que adicionei',
      'Como devo organizar as tasks entre squads?',
      'Crie um workflow para o squad de desenvolvimento',
    ],
    quickChips: [
      'Sugerir squads',
      'Organizar tasks',
      'Criar workflow',
    ],
  },
};

export function ChatPanel() {
  const { messages, addMessage, isLoading, setLoading, currentStep, project, agents, squads } = useWizardStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const stepConfig = STEP_PROMPTS[currentStep] || STEP_PROMPTS.welcome;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentStep]);

  const sendMessage = async (content?: string) => {
    const messageContent = content || input.trim();
    if (!messageContent || isLoading) return;

    const userMsg = { role: 'user' as const, content: messageContent };
    addMessage(userMsg);
    setInput('');
    setLoading(true);

    try {
      const allMessages = [...messages, userMsg];
      const { data, error } = await supabase.functions.invoke('aios-chat', {
        body: {
          messages: allMessages,
          wizardState: { currentStep, project, agents, squads },
        },
      });

      if (error) throw error;
      addMessage({ role: 'assistant', content: data.content || data.message || 'Sem resposta' });
    } catch (err: any) {
      addMessage({ role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' });
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 shadow-[0_0_30px_-10px_hsl(var(--glow-primary)/0.3)]">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-1">{stepConfig.title}</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              {stepConfig.subtitle}
            </p>
            <div className="space-y-2 w-full max-w-md">
              {stepConfig.suggestions.map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  disabled={isLoading}
                  className="w-full text-left px-4 py-3 rounded-lg border border-border/50 bg-card/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm text-muted-foreground hover:text-foreground group"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary/50 group-hover:text-primary transition-colors shrink-0" />
                    {suggestion}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex gap-3 max-w-[85%]',
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            <div className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1',
              msg.role === 'user' ? 'bg-primary/20' : 'bg-accent/20'
            )}>
              {msg.role === 'user' ? (
                <User className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-accent" />
              )}
            </div>
            <div className={cn(
              'rounded-xl px-4 py-3 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-primary/10 border border-primary/20'
                : 'bg-secondary/80 border border-border/50'
            )}>
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  code: ({ children }) => (
                    <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">{children}</code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted rounded-lg p-3 overflow-x-auto my-2 text-xs">{children}</pre>
                  ),
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                  strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 mr-auto">
            <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="rounded-xl px-4 py-3 bg-secondary/80 border border-border/50 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Pensando...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick suggestion chips - always visible when messages exist */}
      {messages.length > 0 && stepConfig.quickChips.length > 0 && (
        <div className="px-4 py-2 border-t border-border/30 bg-card/20 flex items-center gap-2 flex-wrap shrink-0">
          <ArrowRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          {stepConfig.quickChips.map(chip => (
            <button
              key={chip}
              onClick={() => sendMessage(STEP_PROMPTS[currentStep]?.suggestions.find(s => s.toLowerCase().includes(chip.toLowerCase().split(' ')[0])) || chip)}
              disabled={isLoading}
              className="text-[11px] px-3 py-1 rounded-full border border-border/50 bg-secondary/30 hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border/50 bg-card/30">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={stepConfig.subtitle || 'Descreva seu projeto ou peca sugestoes...'}
            className="flex-1 bg-secondary/50"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
