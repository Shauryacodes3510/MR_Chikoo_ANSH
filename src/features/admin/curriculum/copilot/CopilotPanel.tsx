/**
 * AI Copilot – panel inside Curriculum Studio.
 * Modes: Ask (read-only chat) · Action (propose → diff → Apply/Reject → Undo).
 * The shell owns the Unit › Lesson › Screen scope, the audio-outdated banner and the mode switch.
 */
import { useEffect, useMemo, useState } from 'react';
import { Bot, Trash2, ShieldCheck, MessageSquare, Wand2, Volume2, X } from 'lucide-react';
import type { CopilotScope, ModuleLike } from '../../../../lib/copilot/types';
import { countStaleAudioScreens } from '../../../../lib/copilot/lookup';
import { chatStore, useChatStore } from './chatStore';
import { workStore, useWorkStore, type CopilotMode } from './workStore';
import AskView from './AskView';
import ActionView from './ActionView';
import type { CopilotContext } from './viewTypes';

interface Props {
  /** World-filtered lists (what the admin sees; used for the selectors and sent to the AI). */
  modulesList: any[];
  practiceModulesList: any[];
  /** FULL lists: Apply / Undo / the audio banner work on these. */
  fullModulesList: any[];
  fullPracticeList: any[];
  selectedModuleId?: string;
  selectedLessonId?: string;
  /** Save both lists (setModulesList + setPracticeModulesList + saveCurriculumToStorage). */
  onCommit: (nextSpace: any[], nextPrac: any[]) => void;
  /** Opens the audio queue tab. */
  onOpenAudioQueue?: () => void;
}

const screenLabel = (s: any, i: number): string => {
  const text = s?.question || s?.contentScreen?.heading || s?.heading || '';
  const short = String(text).replace(/\s+/g, ' ').slice(0, 42);
  return `${i + 1}. ${String(s?.type || 'screen').replace(/^c\d+_/, '')}${short ? ` – ${short}` : ''}`;
};

const selectCls =
  'w-full min-h-[44px] px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-colors';

const MODES: { id: CopilotMode; label: string; icon: typeof MessageSquare; hint: string }[] = [
  { id: 'ask', label: 'Ask', icon: MessageSquare, hint: 'Ask mode · read-only, nothing is changed' },
  { id: 'action', label: 'Action', icon: Wand2, hint: 'Action mode · you approve every change' },
];

export default function CopilotPanel({
  modulesList, practiceModulesList, fullModulesList, fullPracticeList,
  selectedModuleId, selectedLessonId, onCommit, onOpenAudioQueue,
}: Props) {
  const { messages, pending } = useChatStore();
  const { mode, actionPending } = useWorkStore();
  const [audioBannerHidden, setAudioBannerHidden] = useState(false);

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

  const staleCount = useMemo(
    () => countStaleAudioScreens([fullModulesList as ModuleLike[], fullPracticeList as ModuleLike[]]),
    [fullModulesList, fullPracticeList],
  );

  const ctx: CopilotContext = {
    scope,
    scopeLabel,
    displayModules: [...modulesList, ...practiceModulesList] as ModuleLike[],
    fullSpace: fullModulesList as ModuleLike[],
    fullPrac: fullPracticeList as ModuleLike[],
    onCommit: onCommit as CopilotContext['onCommit'],
  };

  const current = MODES.find(m => m.id === mode) ?? MODES[0];
  const busy = pending || actionPending;

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
            <span className="truncate">{current.hint}</span>
          </p>
        </div>
        {mode === 'ask' && (
          <button
            type="button"
            onClick={() => chatStore.clear()}
            disabled={messages.length === 0 || pending}
            aria-label="Clear chat"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Mode switch */}
      <div role="tablist" aria-label="Copilot mode" className="flex gap-1 px-3 pt-2 border-b border-slate-200">
        {MODES.map(m => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              role="tab"
              type="button"
              aria-selected={active}
              disabled={busy && !active}
              onClick={() => workStore.setMode(m.id)}
              className={`min-h-[44px] px-4 rounded-t-xl text-sm font-extrabold flex items-center gap-1.5 border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                active ? 'border-indigo-600 text-indigo-800 bg-indigo-50' : 'border-transparent text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon size={16} aria-hidden="true" /> {m.label}
            </button>
          );
        })}
      </div>

      {/* Scope selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-4 py-3 border-b border-slate-200">
        <label className="text-xs font-bold text-slate-700">
          Unit
          <select className={`${selectCls} mt-1 font-normal`} value={unitId} onChange={e => { setUnitId(e.target.value); setLessonId(''); setScreenId(''); }}>
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
          <select className={`${selectCls} mt-1 font-normal`} value={lessonId} onChange={e => { setLessonId(e.target.value); setScreenId(''); }}>
            <option value="">Whole unit</option>
            {lessons.map(l => <option key={l.id} value={l.id}>{l.title || l.id}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold text-slate-700">
          Screen
          <select className={`${selectCls} mt-1 font-normal`} value={screenId} onChange={e => setScreenId(e.target.value)} disabled={!lessonId}>
            <option value="">Whole lesson</option>
            {screens.map((s, i) => <option key={s.id} value={s.id}>{screenLabel(s, i)}</option>)}
          </select>
        </label>
      </div>

      {/* Audio outdated banner (counts screens whose narration is flagged stale, e.g. after an Apply) */}
      {staleCount > 0 && !audioBannerHidden && (
        <div role="status" className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-300 text-xs text-amber-950">
          <Volume2 size={16} className="shrink-0" aria-hidden="true" />
          <p className="flex-1 min-w-0">
            <strong>Audio outdated on {staleCount} screen{staleCount === 1 ? '' : 's'}.</strong> Students still hear the old audio until it is regenerated.
          </p>
          {onOpenAudioQueue && (
            <button type="button" onClick={onOpenAudioQueue}
              className="min-h-[44px] px-3 rounded-xl border border-amber-500 bg-white text-xs font-extrabold text-amber-950 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 cursor-pointer transition-colors duration-150 shrink-0">
              Open audio queue
            </button>
          )}
          <button type="button" onClick={() => setAudioBannerHidden(true)} aria-label="Hide audio notice"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 cursor-pointer transition-colors duration-150 shrink-0">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {mode === 'ask' ? <AskView ctx={ctx} /> : <ActionView ctx={ctx} />}
    </div>
  );
}
