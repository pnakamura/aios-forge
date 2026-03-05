/**
 * @agent     EditorAiPanel
 * @persona   Painel lateral de IA assistida no editor da Library
 * @commands  render
 * @context   Chat com streaming SSE, quick actions, e cards de sugestao com apply_fields.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Send, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { useLibraryEditorStore } from '@/stores/library-editor-store';
import type { EditorAiMessage, LibraryEntityType } from '@/types/library';

const QUICK_ACTIONS: Record<LibraryEntityType, string[]> = {
  agent: ['Revisar este agente', 'Verificar padroes AIOS', 'Gerar system prompt', 'Sugerir melhorias'],
  skill: ['Revisar esta skill', 'Verificar padroes AIOS', 'Gerar prompt', 'Sugerir exemplos'],
  squad: ['Revisar este squad', 'Verificar padroes AIOS', 'Recomendar agentes', 'Gerar tasks'],
  workflow: ['Revisar este workflow', 'Verificar padroes AIOS', 'Gerar steps', 'Sugerir melhorias'],
};

interface EditorAiPanelProps {
  onClose: () => void;
}

export default function EditorAiPanel({ onClose }: EditorAiPanelProps) {
  const {
    workingCopy,
    aiMessages,
    isAiThinking,
    addAiMessage,
    setAiThinking,
    applyAiSuggestion,
    clearAiHistory,
  } = useLibraryEditorStore();

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const entityType = workingCopy?.type || 'agent';
  const quickActions = QUICK_ACTIONS[entityType];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiMessages, isAiThinking]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !workingCopy) return;

    const userMsg: EditorAiMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    addAiMessage(userMsg);
    setInput('');
    setAiThinking(true);

    const allMessages = [...aiMessages, userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      abortRef.current = new AbortController();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/library-editor-ai`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          entityType: workingCopy.type,
          currentData: workingCopy.data,
          context: { aiosCoreVersion: '4.2.13', availableAgents: [], availableSkills: [] },
        }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({ error: 'Erro desconhecido' }));
        addAiMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `❌ ${errData.error || 'Erro na comunicacao com a IA'}`,
          timestamp: new Date().toISOString(),
        });
        setAiThinking(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';
      let toolCallArgs = '';
      let hasToolCall = false;
      let messageAdded = false;
      const assistantId = crypto.randomUUID();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.content) {
              assistantContent += parsed.content;
              if (!messageAdded) {
                addAiMessage({
                  id: assistantId,
                  role: 'assistant',
                  content: assistantContent,
                  timestamp: new Date().toISOString(),
                });
                messageAdded = true;
              } else {
                useLibraryEditorStore.setState(s => ({
                  aiMessages: s.aiMessages.map(m =>
                    m.id === assistantId ? { ...m, content: assistantContent } : m
                  ),
                }));
              }
            }
            if (parsed.tool_calls) {
              hasToolCall = true;
              for (const tc of parsed.tool_calls) {
                if (tc.function?.arguments) {
                  toolCallArgs += tc.function.arguments;
                }
              }
            }
          } catch {
            // partial JSON, skip
          }
        }
      }

      // If no content message was added yet
      if (!assistantContent && !hasToolCall) {
        addAiMessage({
          id: assistantId,
          role: 'assistant',
          content: 'Resposta vazia da IA.',
          timestamp: new Date().toISOString(),
        });
      }

      // Handle tool call result
      if (hasToolCall && toolCallArgs) {
        try {
          const parsed = JSON.parse(toolCallArgs);
          if (parsed.fields) {
            // Add suggestion message
            const fieldNames = Object.keys(parsed.fields).join(', ');
            addAiMessage({
              id: crypto.randomUUID(),
              role: 'assistant',
              content: `✨ **Sugestao de alteracoes**\nCampos: ${fieldNames}\n${parsed.summary || ''}\n\n_Clique "Aplicar" para aceitar._`,
              appliedFields: Object.keys(parsed.fields),
              timestamp: new Date().toISOString(),
            });
            // Auto-apply for now (user can undo)
            applyAiSuggestion(parsed.fields);
          }
        } catch {
          // Failed to parse tool call
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        addAiMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `❌ Erro: ${(e as Error).message}`,
          timestamp: new Date().toISOString(),
        });
      }
    } finally {
      setAiThinking(false);
    }
  }, [workingCopy, aiMessages, addAiMessage, setAiThinking, applyAiSuggestion]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold">Assistente AIOS</span>
          <Badge variant="outline" className="text-[10px]">{entityType}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={clearAiHistory}>
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {aiMessages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Use o assistente para revisar, gerar e melhorar seu elemento AIOS.</p>
            </div>
          )}
          {aiMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : msg.appliedFields
                    ? 'bg-accent/10 border border-accent/30'
                    : 'bg-secondary'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm prose-invert max-w-none [&_p]:text-xs [&_p]:my-1 [&_code]:text-[10px]">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {isAiThinking && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-lg px-3 py-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-1 px-3 py-2 border-t border-border/30">
        {quickActions.map(action => (
          <button
            key={action}
            className="text-[10px] px-2 py-1 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
            onClick={() => sendMessage(action)}
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/50">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { sendMessage(input); } }}
            placeholder="Descreva o que deseja melhorar..."
            className="text-xs min-h-[36px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            size="sm"
            className="h-9 w-9 p-0 shrink-0"
            disabled={!input.trim() || isAiThinking}
            onClick={() => sendMessage(input)}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
