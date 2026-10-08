import { useState, useRef, useEffect } from 'react';
import { useDataStore, useAiSessionStore } from '../core/state';
import { repos } from '../core/db';
import { Button, Card, Input, Badge } from '../core/ui';
import { Send, StopCircle, Plus, Bot, User, Zap } from 'lucide-react';
import { nanoid } from 'nanoid';
import { createProvider, getToolsForRequest, executeTool } from '../core/ai';
import type { AiSession, AiMessage } from '../core/db';

export default function ChatModule() {
  const { aiSessions, setAiSessions, settings } = useDataStore();
  const { currentSessionId, isStreaming, setCurrentSession, setStreaming, abortController, setAbortController } = useAiSessionStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentSession = aiSessions.find(s => s.id === currentSessionId);

  useEffect(() => {
    if (currentSession) {
      setMessages(currentSession.messages);
    } else if (aiSessions.length > 0 && !currentSessionId) {
      setCurrentSession(aiSessions[0].id);
    }
  }, [currentSessionId, currentSession, aiSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createNewSession = async () => {
    const session: AiSession = {
      id: nanoid(), title: 'Neuer Chat', messages: [],
      totalTokens: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await repos.aiSessions.create(session);
    const all = await repos.aiSessions.getAll();
    setAiSessions(all);
    setCurrentSession(session.id);
    setMessages([]);
    inputRef.current?.focus();
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    
    let sessionId = currentSessionId;
    if (!sessionId) {
      const session: AiSession = {
        id: nanoid(), title: input.slice(0, 40), messages: [],
        totalTokens: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      await repos.aiSessions.create(session);
      sessionId = session.id;
      setCurrentSession(sessionId);
    }

    const userMsg: AiMessage = {
      id: nanoid(), role: 'user', content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const providerSettings = {
        provider: settings?.aiProvider || 'openai',
        apiKey: settings?.aiApiKey || '',
        baseUrl: settings?.aiBaseUrl || '',
        model: settings?.aiModel || 'gpt-4o-mini',
      };
      
      const provider = createProvider(providerSettings);
      const tools = getToolsForRequest(input);
      
      let assistantContent = '';
      const toolResults: { name: string; args: Record<string, unknown>; result: string }[] = [];
      let usage = { prompt: 0, completion: 0 };

      const stream = provider.stream(newMessages, tools, controller.signal);
      
      for await (const chunk of stream) {
        if (chunk.type === 'text' && chunk.content) {
          assistantContent += chunk.content;
          setMessages([...newMessages, { id: 'streaming', role: 'assistant', content: assistantContent, createdAt: new Date().toISOString() }]);
        } else if (chunk.type === 'tool_call' && chunk.toolCall) {
          const result = await executeTool(chunk.toolCall.name, chunk.toolCall.args);
          toolResults.push({ name: chunk.toolCall.name, args: chunk.toolCall.args, result });
          setMessages([...newMessages, { id: 'streaming', role: 'assistant', content: assistantContent || `Tool: ${chunk.toolCall.name}`, toolCalls: toolResults, createdAt: new Date().toISOString() }]);
        } else if (chunk.type === 'done' && chunk.usage) {
          usage = chunk.usage;
        }
      }

      const assistantMsg: AiMessage = {
        id: nanoid(), role: 'assistant',
        content: assistantContent || (toolResults.length > 0 ? 'Aktion ausgeführt.' : 'Keine Antwort.'),
        toolCalls: toolResults.length > 0 ? toolResults : undefined,
        tokens: usage,
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);

      // Save session
      const session = await repos.aiSessions.getById(sessionId);
      if (session) {
        await repos.aiSessions.update(sessionId, {
          messages: finalMessages,
          title: session.title === 'Neuer Chat' ? input.slice(0, 40) : session.title,
          totalTokens: session.totalTokens + (usage.prompt + usage.completion),
          updatedAt: new Date().toISOString(),
        });
        const all = await repos.aiSessions.getAll();
        setAiSessions(all);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const errorMsg: AiMessage = {
          id: nanoid(), role: 'assistant',
          content: `Fehler: ${(err as Error).message}`,
          createdAt: new Date().toISOString(),
        };
        setMessages([...newMessages, errorMsg]);
      }
    } finally {
      setStreaming(false);
      setAbortController(null);
    }
  };

  const abortStream = () => {
    abortController?.abort();
    setStreaming(false);
  };

  const suggestions = ['Was steht heute an?', 'Erstelle eine Aufgabe', 'Zeige meine Gewohnheiten', 'Wochenrückblick'];

  return (
    <div className="flex h-[calc(100vh-var(--header-height))] animate-fade-in">
      {/* Session Sidebar */}
      <div className="hidden md:flex w-56 border-r border-[var(--color-border)] flex-col bg-[var(--color-surface-alt)]">
        <div className="p-3 border-b border-[var(--color-border)]">
          <Button onClick={createNewSession} size="sm" className="w-full"><Plus className="w-3 h-3" /> Neuer Chat</Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {aiSessions.slice(0, 20).map(session => (
            <button key={session.id} onClick={() => { setCurrentSession(session.id); setMessages(session.messages); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors focus-ring ${currentSessionId === session.id ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'}`}>
              {session.title || 'Chat'}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-4xl mb-3">🤖</div>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">LifeOS KI-Assistent</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">Wie kann ich dir helfen?</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {suggestions.map(s => (
                  <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                    className="px-3 py-1.5 text-xs rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] focus-ring">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''} animate-fade-in`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-[var(--color-accent)]" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-[var(--color-accent)] text-white rounded-2xl rounded-br-sm px-4 py-2' : 'bg-[var(--color-surface-alt)] rounded-2xl rounded-bl-sm px-4 py-2'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {msg.toolCalls.map((tc, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-[var(--color-surface)] rounded-lg px-2 py-1.5 border border-[var(--color-border)]">
                        <Zap className="w-3 h-3 text-[var(--color-warning)]" />
                        <span className="font-medium">{tc.name}</span>
                        <Badge color="success">✓</Badge>
                      </div>
                    ))}
                  </div>
                )}
                {msg.tokens && (
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-1">
                    {msg.tokens.prompt + msg.tokens.completion} Tokens
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-[var(--color-surface-alt)] flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-[var(--color-text-secondary)]" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[var(--color-border)] p-4">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder="Nachricht schreiben..." className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] flex-1" />
            {isStreaming ? (
              <Button onClick={abortStream} variant="danger"><StopCircle className="w-4 h-4" /></Button>
            ) : (
              <Button onClick={sendMessage} disabled={!input.trim()}><Send className="w-4 h-4" /></Button>
            )}
          </div>
          {currentSession && (
            <div className="text-center text-[10px] text-[var(--color-text-muted)] mt-2">
              Gesamt: {currentSession.totalTokens} Tokens · {currentSession.messages.length} Nachrichten
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
