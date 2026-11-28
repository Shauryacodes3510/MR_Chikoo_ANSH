/**
 * AI Copilot – Unified conversational panel inside Curriculum Studio.
 * Seamless single-chat experience:
 *   - Questions are answered in plain text / markdown (Ask).
 *   - Edit instructions produce structured diffs with Review / Apply / Reject right in chat (Action).
 *   - Audits scan screens and provide inline "Fix" buttons right in chat (Audit).
 *   - One continuous history, undo stack, and scope context.
 */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  Bot,
  Trash2,
  RotateCcw,
  ShieldCheck,
  Volume2,
  X,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Wrench,
  Sparkles,
  Info,
  ListChecks,
  AlertTriangle,
} from 'lucide-react';
import type { CopilotAction, CopilotScope, ModuleLike, ScreenLike } from '../../../../lib/copilot/types';
import { countStaleAudioScreens, locateScreen } from '../../../../lib/copilot/lookup';
import { applyOnLists, undoChanges, validateOnLists } from '../../../../lib/copilot/applyToLists';
import { chatStore, newMessageId, useChatStore, type ChatProposal, type ChatAudit } from './chatStore';
import { newId, useWorkStore, workStore } from './workStore';
import { sendCopilotChat, CopilotClientError, type ChatTurn, type AuditFinding } from './api';
import DiffCard, { DiffRows } from './DiffCard';
import ReviewModal from './ReviewModal';

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

/** Minimal inline formatting for AI answers: **bold** and `code`. */
const renderInline = (text: string): ReactNode[] =>
  text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="px-1 py-0.5 rounded bg-slate-100 text-[0.85em] font-mono">{part.slice(1, -1)}</code>;
    return <span key={i}>{part}</span>;
  });

const PROMPT_SUGGESTIONS = [
  { label: '🔍 Audit this lesson', text: 'Audit all screens in this lesson for wrong answers or errors' },
  { label: '🪄 Make questions simpler', text: 'Review the questions in this lesson and make them simpler for students' },
  { label: '💡 Explain key concepts', text: 'Explain the main concepts and flow of this lesson' },
  { label: '🎯 Distractor quality', text: 'Check the MCQ options and suggest better distractors where needed' },
];

export default function CopilotPanel({
  modulesList, practiceModulesList, fullModulesList, fullPracticeList,
  selectedModuleId, selectedLessonId, onCommit, onOpenAudioQueue,
}: Props) {
  const { messages, pending } = useChatStore();
  const { undoStack } = useWorkStore();
  const [audioBannerHidden, setAudioBannerHidden] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [input, setInput] = useState('');
  const [reviewModalData, setReviewModalData] = useState<{ title: string; proposed: ScreenLike; current: ScreenLike | null } | null>(null);
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

  // Follow the Studio's selection only when the SELECTION changes
  useEffect(() => {
    if (selectedModuleId) setUnitId(selectedModuleId);
    setLessonId(selectedLessonId ?? '');
    setScreenId('');
  }, [selectedModuleId, selectedLessonId]);

  // Make sure a valid unit is always selected (first one by default)
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

  const displayModules = useMemo(
    () => [...modulesList, ...practiceModulesList] as ModuleLike[],
    [modulesList, practiceModulesList],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, pending]);

  // Send unified message to Copilot
  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || pending || !scope) return;

    const history: ChatTurn[] = chatStore
      .getState()
      .messages.filter(m => m.role !== 'error')
      .map(m => ({ role: m.role as 'user' | 'assistant', text: m.text }));

    chatStore.add({ id: newMessageId(), role: 'user', text, scopeLabel });
    setInput('');
    chatStore.setPending(true);
    setNotice(null);

    try {
      const res = await sendCopilotChat({
        modules: displayModules,
        scope,
        message: text,
        history,
      });

      const msgId = newMessageId();
      let proposal: ChatProposal | undefined;
      let audit: ChatAudit | undefined;

      if (res.intent === 'action' && res.actions && res.actions.length > 0) {
        proposal = {
          id: newId('prop'),
          scope,
          scopeLabel,
          actions: res.actions,
          results: res.results || [],
        };
      } else if (res.intent === 'audit') {
        audit = {
          scope,
          scopeLabel,
          scanned: res.scanned || 0,
          skippedUnsupported: res.skippedUnsupported,
          findings: res.findings || [],
          fixedScreenIds: [],
        };
      }

      chatStore.add({
        id: msgId,
        role: 'assistant',
        text: res.reply,
        proposal,
        audit,
      });
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

  // Open the student-style review modal for any action
  const openReview = (a: CopilotAction, actionScope: CopilotScope) => {
    const r = validateOnLists(fullModulesList, fullPracticeList, [a], actionScope);
    const proposed = locateScreen([r.nextSpace, r.nextPrac], a.lessonId, a.screenId);
    const current = locateScreen([fullModulesList, fullPracticeList], a.lessonId, a.screenId);
    if (proposed) {
      setReviewModalData({
        title: `${proposed.lessonTitle || a.lessonId} › screen ${proposed.index + 1}`,
        proposed: proposed.screen,
        current: current?.screen ?? null,
      });
    }
  };

  // Apply proposed actions from chat
  const handleApplyProposal = (messageId: string, actions: CopilotAction[], propScope: CopilotScope) => {
    const r = applyOnLists(fullModulesList, fullPracticeList, actions, propScope);
    if (r.appliedCount === 0) {
      setNotice({ kind: 'error', text: r.results[0]?.errors[0] || 'Nothing could be applied.' });
      return;
    }
    onCommit(r.nextSpace, r.nextPrac);
    workStore.pushUndo({
      id: newId('undo'),
      label: `${r.appliedCount} change(s) in ${scopeLabel || 'selection'}`,
      changes: r.changes,
      at: Date.now(),
    });
    chatStore.updateProposal(messageId, { applied: true, appliedAt: Date.now() });
    setNotice({
      kind: 'success',
      text: `Applied ${r.appliedCount} change(s) and saved.${r.staleAudioScreens ? ` Audio is now outdated on ${r.staleAudioScreens} screen(s).` : ''}`,
    });
  };

  // Reject proposed actions
  const handleRejectProposal = (messageId: string) => {
    chatStore.updateProposal(messageId, { rejected: true });
    setNotice({ kind: 'info', text: 'Proposed changes dismissed.' });
  };

  // Apply fix for a specific audit finding
  const handleApplyFix = (messageId: string, finding: AuditFinding, auditScope: CopilotScope) => {
    if (!finding.fixAction) return;
    const r = applyOnLists(fullModulesList, fullPracticeList, [finding.fixAction], auditScope);
    if (r.appliedCount === 0) {
      setNotice({ kind: 'error', text: r.results[0]?.errors[0] || 'Fix could not be applied.' });
      return;
    }
    onCommit(r.nextSpace, r.nextPrac);
    workStore.pushUndo({
      id: newId('undo'),
      label: `Fix on ${finding.screenId}`,
      changes: r.changes,
      at: Date.now(),
    });
    chatStore.markFindingFixed(messageId, finding.screenId);
    setNotice({
      kind: 'success',
      text: `Applied fix to ${finding.screenId} and saved.${r.staleAudioScreens ? ` Audio marked stale on ${r.staleAudioScreens} screen(s).` : ''}`,
    });
  };

  // Global Undo
  const handleUndo = () => {
    const rec = undoStack[undoStack.length - 1];
    if (!rec) return;
    const u = undoChanges(fullModulesList, fullPracticeList, rec.changes);
    if (u.restoredLessonIds.length) onCommit(u.nextSpace, u.nextPrac);
    workStore.popUndo();
    setNotice(
      u.conflictLessonIds.length === 0
        ? { kind: 'success', text: 'Undone. The previous curriculum version is restored.' }
        : u.restoredLessonIds.length
          ? { kind: 'info', text: `Undone for ${u.restoredLessonIds.length} lesson(s). ${u.conflictLessonIds.length} lesson(s) had newer edits and were left unchanged.` }
          : { kind: 'error', text: 'Cannot undo: this lesson was edited again after the change.' },
    );
  };

  const lastUndo = undoStack[undoStack.length - 1];

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto h-[calc(100dvh-14rem)] md:h-[calc(100dvh-6rem)] min-h-[440px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
          <Bot size={18} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-slate-900 leading-tight">AI Copilot</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              Unified Chat
            </span>
          </div>
          <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
            <ShieldCheck size={12} className="text-emerald-600 shrink-0" aria-hidden="true" />
            <span className="truncate">Ask questions, request edits, or audit lessons – all in one place</span>
          </p>
        </div>

        {/* Undo button in header */}
        {lastUndo && (
          <button
            type="button"
            onClick={handleUndo}
            title={lastUndo.label}
            className="min-h-[38px] px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-800 flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer transition-colors duration-150"
          >
            <RotateCcw size={14} className="text-indigo-600" aria-hidden="true" />
            <span>Undo ({undoStack.length})</span>
          </button>
        )}

        {/* Clear chat button */}
        <button
          type="button"
          onClick={() => { chatStore.clear(); setNotice(null); }}
          disabled={messages.length === 0 || pending}
          aria-label="Clear chat"
          title="Clear chat history"
          className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Scope selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-4 py-2.5 border-b border-slate-200 bg-slate-50/50">
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

      {/* Audio outdated banner */}
      {staleCount > 0 && !audioBannerHidden && (
        <div role="status" className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-300 text-xs text-amber-950">
          <Volume2 size={16} className="shrink-0 text-amber-700" aria-hidden="true" />
          <p className="flex-1 min-w-0">
            <strong>Audio outdated on {staleCount} screen{staleCount === 1 ? '' : 's'}.</strong> Students still hear the previous narration until regenerated.
          </p>
          {onOpenAudioQueue && (
            <button
              type="button"
              onClick={onOpenAudioQueue}
              className="min-h-[36px] px-3 rounded-lg border border-amber-500 bg-white text-xs font-extrabold text-amber-950 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 cursor-pointer transition-colors duration-150 shrink-0"
            >
              Open audio queue
            </button>
          )}
          <button
            type="button"
            onClick={() => setAudioBannerHidden(true)}
            aria-label="Hide audio notice"
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 cursor-pointer transition-colors duration-150 shrink-0"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Action / Undo Notice toast */}
      {notice && (
        <div
          role="status"
          className={`flex items-center gap-2 px-4 py-2 text-xs border-b ${
            notice.kind === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : notice.kind === 'error'
                ? 'bg-red-50 border-red-300 text-red-950'
                : 'bg-indigo-50 border-indigo-200 text-indigo-950'
          }`}
        >
          {notice.kind === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" aria-hidden="true" />
          ) : notice.kind === 'error' ? (
            <AlertCircle size={16} className="text-red-600 shrink-0" aria-hidden="true" />
          ) : (
            <Info size={16} className="text-indigo-600 shrink-0" aria-hidden="true" />
          )}
          <p className="flex-1 min-w-0 font-medium">{notice.text}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notice"
            className="p-1 rounded hover:bg-black/5 cursor-pointer"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Chat scroll area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4" role="log" aria-live="polite" aria-label="Copilot conversation">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles size={24} aria-hidden="true" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">How can I help you with this curriculum?</h3>
              <p className="text-xs text-slate-600">
                You can ask questions, ask to edit or fix screens, or audit for incorrect answers. I will suggest changes with a diff preview before anything is saved.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg mt-2">
              {PROMPT_SUGGESTIONS.map(s => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => void send(s.text)}
                  disabled={!scope || pending}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-xs font-bold text-indigo-900 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[94%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-3 ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : m.role === 'error'
                    ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-md'
                    : 'bg-slate-50 text-slate-900 border border-slate-200 rounded-bl-md'
              }`}
            >
              {/* User Scope label */}
              {m.role === 'user' && m.scopeLabel && (
                <div className="text-[11px] text-indigo-200 font-semibold mb-1 truncate">{m.scopeLabel}</div>
              )}

              {/* Error icon */}
              {m.role === 'error' && (
                <div className="flex items-center gap-2 font-bold text-xs text-red-800">
                  <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
                  <span>Request Error</span>
                </div>
              )}

              {/* Message text */}
              <div className="whitespace-pre-wrap break-words">
                {m.role === 'assistant' ? renderInline(m.text) : m.text}
              </div>

              {/* INLINE ACTION PROPOSAL */}
              {m.proposal && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-600" aria-hidden="true" />
                      Proposed Changes ({m.proposal.actions.length})
                    </span>
                    {m.proposal.applied && (
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <CheckCircle2 size={12} aria-hidden="true" /> Applied
                      </span>
                    )}
                    {m.proposal.rejected && (
                      <span className="text-xs font-extrabold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-lg">
                        Dismissed
                      </span>
                    )}
                  </div>

                  {/* Diffs */}
                  <div className="space-y-2">
                    {m.proposal.results.map((res, i) => {
                      const a = m.proposal!.actions[i];
                      const loc = locateScreen([fullModulesList, fullPracticeList], a.lessonId, a.screenId);
                      return (
                        <DiffCard
                          key={`${a.lessonId}_${a.screenId}_${i}`}
                          result={res}
                          location={loc}
                          busy={pending}
                          readOnly={m.proposal!.applied || m.proposal!.rejected}
                          onReview={() => openReview(a, m.proposal!.scope)}
                          onApply={() => handleApplyProposal(m.id, [a], m.proposal!.scope)}
                          onReject={() => handleRejectProposal(m.id)}
                        />
                      );
                    })}
                  </div>

                  {/* Action buttons if not yet applied or rejected */}
                  {!m.proposal.applied && !m.proposal.rejected && m.proposal.actions.length > 1 && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleApplyProposal(m.id, m.proposal!.actions, m.proposal!.scope)}
                        disabled={pending}
                        className="flex-1 min-h-[40px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        Apply all ({m.proposal.actions.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectProposal(m.id)}
                        disabled={pending}
                        className="min-h-[40px] px-3 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-extrabold flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        Reject all
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* INLINE AUDIT FINDINGS */}
              {m.audit && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <ListChecks size={15} className="text-indigo-600" aria-hidden="true" />
                      Scanned {m.audit.scanned} screen(s)
                    </span>
                    <span className="text-slate-500">
                      {m.audit.findings.length === 0 ? 'No issues found' : `${m.audit.findings.length} issue(s) detected`}
                    </span>
                  </div>

                  {m.audit.findings.length === 0 ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" aria-hidden="true" />
                      <span>All questions, options and answers in this selection are verified correct.</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {m.audit.findings.map((f, i) => {
                        const isFixed = m.audit!.fixedScreenIds?.includes(f.screenId);
                        const loc = locateScreen([fullModulesList, fullPracticeList], f.lessonId, f.screenId);
                        return (
                          <div
                            key={`${f.lessonId}_${f.screenId}_${i}`}
                            className={`rounded-xl border p-3 text-xs space-y-2 ${
                              isFixed
                                ? 'border-emerald-200 bg-emerald-50/50'
                                : f.severity === 'error'
                                  ? 'border-red-200 bg-white'
                                  : 'border-amber-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                                  f.severity === 'error' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {f.severity}
                              </span>
                              <span className="text-[11px] text-slate-600 font-bold">
                                {loc ? `Screen ${loc.index + 1} (${String(loc.screen.type).replace(/^c\d+_/, '')})` : f.screenId}
                              </span>
                            </div>

                            {loc?.screen?.question && (
                              <p className="text-xs text-slate-700 italic">“{String(loc.screen.question).slice(0, 160)}”</p>
                            )}

                            <p className="text-xs text-slate-900"><strong>Problem:</strong> {f.problem}</p>
                            <p className="text-xs text-slate-700"><strong>Why:</strong> {f.why}</p>

                            {/* Fix preview rows */}
                            {f.fixResult?.diff && f.fixResult.diff.length > 0 && !isFixed && (
                              <div className="space-y-1 pt-1">
                                <span className="text-[11px] font-extrabold text-slate-800">Suggested Fix:</span>
                                <DiffRows diff={f.fixResult.diff} />
                              </div>
                            )}

                            {/* Fix action button */}
                            {f.fixAction && (
                              <div className="pt-1 flex items-center gap-2">
                                {isFixed ? (
                                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                                    <CheckCircle2 size={14} className="text-emerald-600" aria-hidden="true" /> Fix Applied
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleApplyFix(m.id, f, m.audit!.scope)}
                                      disabled={pending}
                                      className="min-h-[36px] px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer disabled:opacity-50 transition-colors"
                                    >
                                      <Wrench size={13} aria-hidden="true" /> Apply Fix
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openReview(f.fixAction!, m.audit!.scope)}
                                      className="min-h-[36px] px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer transition-colors"
                                    >
                                      Preview
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-700 rounded-2xl rounded-bl-md px-4 py-3 text-sm flex items-center gap-2.5">
              <Loader2 size={16} className="animate-spin text-indigo-600" aria-hidden="true" />
              <span>Copilot is analyzing curriculum…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-3 py-3 border-t border-slate-200 bg-white space-y-2">
        {/* Quick prompt chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => void send('Audit all screens in this lesson for incorrect answers or errors')}
            disabled={!scope || pending}
            className="min-h-[32px] px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-[11px] font-bold text-indigo-800 shrink-0 cursor-pointer disabled:opacity-50"
          >
            🔍 Audit this lesson
          </button>
          <button
            type="button"
            onClick={() => void send('Make the questions in this lesson simpler and clearer for students')}
            disabled={!scope || pending}
            className="min-h-[32px] px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-800 shrink-0 cursor-pointer disabled:opacity-50"
          >
            🪄 Simplify questions
          </button>
          <button
            type="button"
            onClick={() => void send('Explain what this lesson teaches')}
            disabled={!scope || pending}
            className="min-h-[32px] px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-800 shrink-0 cursor-pointer disabled:opacity-50"
          >
            💡 Explain lesson
          </button>
        </div>

        {/* Input box */}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              !scope
                ? 'Select a unit above to begin…'
                : 'Ask a question, propose an edit (e.g. "change option 2 to..."), or type "audit this lesson"…'
            }
            disabled={!scope || pending}
            rows={1}
            maxLength={2000}
            className="flex-1 min-h-[44px] max-h-32 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 resize-none disabled:bg-slate-100 disabled:cursor-not-allowed leading-relaxed"
          />
          <button
            type="button"
            onClick={() => void send(input)}
            disabled={!input.trim() || !scope || pending}
            aria-label="Send message"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-200 disabled:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed transition-colors duration-150 shrink-0"
          >
            {pending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Student-style screen review preview modal */}
      {reviewModalData && (
        <ReviewModal
          title={reviewModalData.title}
          proposed={reviewModalData.proposed}
          current={reviewModalData.current}
          onClose={() => setReviewModalData(null)}
        />
      )}
    </div>
  );
}
