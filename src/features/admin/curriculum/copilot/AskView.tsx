/** Ask mode: read-only chat about the selected scope. */
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { askCopilot, CopilotClientError, type ChatTurn } from './api';
import { chatStore, newMessageId, useChatStore } from './chatStore';
import type { CopilotContext } from './viewTypes';

const MAX_LEN = 2000;

/** Minimal inline formatting for AI answers: **bold** and `code`. */
const renderInline = (text: string): ReactNode[] =>
  text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="px-1 py-0.5 rounded bg-slate-100 text-[0.85em] font-mono">{part.slice(1, -1)}</code>;
    return <span key={i}>{part}</span>;
  });

const SUGGESTIONS = [
  'Check if the marked correct answers are right',
  'Summarize what this lesson teaches',
  'Are the explanations simple enough for students?',
  'Find typos or unclear questions',
];

export default function AskView({ ctx }: { ctx: CopilotContext }) {
  const { messages, pending } = useChatStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { scope, scopeLabel, displayModules } = ctx;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, pending]);

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question || pending || !scope) return;
    const history: ChatTurn[] = chatStore
      .getState()
      .messages.filter(m => m.role !== 'error')
      .map(m => ({ role: m.role as 'user' | 'assistant', text: m.text }));
    chatStore.add({ id: newMessageId(), role: 'user', text: question, scopeLabel });
    setInput('');
    chatStore.setPending(true);
    try {
      const answer = await askCopilot({ modules: displayModules, scope, question, history });
      chatStore.add({ id: newMessageId(), role: 'assistant', text: answer });
    } catch (e) {
      const msg = e instanceof CopilotClientError ? e.message : 'Something went wrong. Please try again.';
      chatStore.add({ id: newMessageId(), role: 'error', text: msg });
    } finally {
      chatStore.setPending(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  };

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3" role="log" aria-live="polite" aria-label="Copilot conversation">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-6">
            <p className="text-sm text-slate-700 max-w-sm">
              Pick a unit, lesson or screen above and ask anything about it. Copilot only sees what you selected.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  disabled={!scope || pending}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-bold text-indigo-800 hover:bg-indigo-100 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : m.role === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-md flex gap-2'
                    : 'bg-slate-100 text-slate-900 rounded-bl-md'
              }`}
            >
              {m.role === 'error' && <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />}
              <div>
                {m.role === 'user' && m.scopeLabel && <div className="text-[11px] text-indigo-100 mb-0.5 truncate">{m.scopeLabel}</div>}
                {m.role === 'assistant' ? renderInline(m.text) : m.text}
              </div>
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-700 rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Copilot is thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-3 border-t border-slate-200 bg-white">
        <div className="flex items-end gap-2">
          <label htmlFor="copilot-input" className="sr-only">Ask Copilot</label>
          <textarea
            id="copilot-input"
            value={input}
            onChange={e => setInput(e.target.value.slice(0, MAX_LEN))}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder={scope ? 'Ask about the selected content…' : 'Select a unit first'}
            disabled={!scope}
            className="flex-1 resize-none min-h-[44px] max-h-40 px-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 disabled:bg-slate-100"
          />
          <button
            type="button"
            onClick={() => void send(input)}
            disabled={!input.trim() || pending || !scope}
            aria-label="Send question"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-600">Enter to send · Shift+Enter for a new line · Copilot answers in English</p>
      </div>
    </>
  );
}
