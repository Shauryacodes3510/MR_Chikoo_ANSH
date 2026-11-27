/**
 * AI Copilot – chat panel inside Curriculum Studio (Wave 3, step 1: Ask mode only).
 * Read-only: nothing here changes lessons. Action / Audit / Review screen come in later steps.
 */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Bot, Send, Trash2, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import type { CopilotScope, ModuleLike } from '../../../../lib/copilot/types';
import { askCopilot, CopilotClientError, type ChatTurn } from './api';
import { chatStore, newMessageId, useChatStore } from './chatStore';

interface Props {
  modulesList: any[];
  practiceModulesList: any[];
  selectedModuleId?: string;
  selectedLessonId?: string;
}

const MAX_LEN = 2000;

const screenLabel = (s: any, i: number): string => {
  const text = s?.question || s?.contentScreen?.heading || s?.heading || '';
  const short = String(text).replace(/\s+/g, ' ').slice(0, 42);
  return `${i + 1}. ${String(s?.type || 'screen').replace(/^c\d+_/, '')}${short ? ` – ${short}` : ''}`;
};

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

const selectCls =
  'w-full min-h-[44px] px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-colors';

export default function CopilotPanel({ modulesList, practiceModulesList, selectedModuleId, selectedLessonId }: Props) {
  const { messages, pending } = useChatStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const units = useMemo(
    () => [
      ...modulesList.map(m => ({ m, group: 'Learning path' })),
      ...practiceModulesList.map(m => ({ m, group: 'Practice arena' })),
    ],
    [modulesList, practiceModulesList],
  );

  // Scope: unit (required) > lesson ('' = whole unit) > screen ('' = whole lesson)
  const [unitId, setUnitId] = useState(() => selectedModuleId || units[0]?.m.id || '');
  const [lessonId, setLessonId] = useState(() => selectedLessonId || '');
  const [screenId, setScreenId] = useState('');

  // Follow the Studio's selection only when the SELECTION changes (not on every data refresh).
  useEffect(() => {
    if (selectedModuleId) setUnitId(selectedModuleId);
    setLessonId(selectedLessonId ?? '');
    setScreenId('');
  }, [selectedModuleId, selectedLessonId]);

  // Make sure a valid unit is always selected (first one by default).
  useEffect(() => {
    if (!units.some(u => u.m.id === unitId)) setUnitId(units[0]?.m.id ?? '');
  }, [units, unitId]);

  const unit = units.find(u => u.m.id === unitId)?.m;
  const lessons: any[] = unit?.lessons ?? [];
  const lesson = lessons.find(l => l.id === lessonId);
  const screens: any[] = lesson?.challenges ?? [];

  const scope: CopilotScope | null = !unit
    ? null
    : lessonId && lesson
      ? screenId && screens.some(s => s.id === screenId)
        ? { kind: 'screen', lessonId, screenId }
        : { kind: 'lesson', lessonId }
      : { kind: 'unit', unitId: unit.id };

  const scopeLabel = !unit
    ? ''
    : [unit.title, lesson?.title, screenId ? `screen ${screens.findIndex(s => s.id === screenId) + 1}` : '']
        .filter(Boolean)
        .join(' › ');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, pending]);

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question || pending || !scope) return;
    // history = the chat so far (answers only count if they were real answers)
    const history: ChatTurn[] = chatStore
      .getState()
      .messages.filter(m => m.role !== 'error')
      .map(m => ({ role: m.role as 'user' | 'assistant', text: m.text }));
    chatStore.add({ id: newMessageId(), role: 'user', text: question, scopeLabel });
    setInput('');
    chatStore.setPending(true);
    try {
      const answer = await askCopilot({
        modules: [...modulesList, ...practiceModulesList] as ModuleLike[],
        scope,
        question,
        history,
      });
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
    <div className="flex flex-col w-full max-w-3xl mx-auto h-[calc(100dvh-14rem)] md:h-[calc(100dvh-6rem)] min-h-[420px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
          <Bot size={18} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold text-slate-900 leading-tight">AI Copilot</h2>
          <p className="text-xs text-slate-600 flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-600 shrink-0" aria-hidden="true" />
            <span className="truncate">Ask mode · read-only, nothing is changed</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => chatStore.clear()}
          disabled={messages.length === 0 || pending}
          aria-label="Clear chat"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Scope selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-4 py-3 border-b border-slate-200">
        <label className="text-xs font-bold text-slate-700">
          Unit
          <select
            className={`${selectCls} mt-1 font-normal`}
            value={unitId}
            onChange={e => { setUnitId(e.target.value); setLessonId(''); setScreenId(''); }}
          >
            {units.length === 0 && <option value="">No units loaded</option>}
            {['Learning path', 'Practice arena'].map(g => {
              const items = units.filter(u => u.group === g);
              return items.length ? (
                <optgroup key={g} label={g}>
                  {items.map(u => <option key={u.m.id} value={u.m.id}>{u.m.title || u.m.id}</option>)}
                </optgroup>
              ) : null;
            })}
          </select>
        </label>
        <label className="text-xs font-bold text-slate-700">
          Lesson
          <select
            className={`${selectCls} mt-1 font-normal`}
            value={lessonId}
            onChange={e => { setLessonId(e.target.value); setScreenId(''); }}
          >
            <option value="">Whole unit</option>
            {lessons.map(l => <option key={l.id} value={l.id}>{l.title || l.id}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold text-slate-700">
          Screen
          <select
            className={`${selectCls} mt-1 font-normal`}
            value={screenId}
            onChange={e => setScreenId(e.target.value)}
            disabled={!lessonId}
          >
            <option value="">Whole lesson</option>
            {screens.map((s, i) => <option key={s.id} value={s.id}>{screenLabel(s, i)}</option>)}
          </select>
        </label>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" role="log" aria-live="polite" aria-label="Copilot conversation">
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
                {m.role === 'user' && m.scopeLabel && (
                  <div className="text-[11px] text-indigo-100 mb-0.5 truncate">{m.scopeLabel}</div>
                )}
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

      {/* Composer */}
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
    </div>
  );
}
