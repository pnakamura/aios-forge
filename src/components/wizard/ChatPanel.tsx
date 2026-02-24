import { useState, useRef, useEffect } from 'react';
import { useWizardStore } from '@/stores/wizard-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export function ChatPanel() {
  const { messages, addMessage, isLoading, setLoading, currentStep, project, agents, squads } = useWizardStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = { role: 'user' as const, content: input };
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
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Bot className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Assistente AIOS</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Olá! Sou seu assistente para construção do AIOS. 
              Descreva seu projeto e eu vou ajudar a configurar agentes, squads e toda a arquitetura.
            </p>
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
            <div className="rounded-xl px-4 py-3 bg-secondary/80 border border-border/50">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Descreva seu projeto ou peça sugestões..."
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
