/**
 * Action mode: the AI proposes edits → fresh dry run on the CURRENT data → diff → admin clicks
 * Apply / Reject / Apply all → save. Undo restores the lessons an Apply touched.
 * Nothing is applied or saved without a click.
 */
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Loader2, Undo2, Send, Check, X, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { applyOnLists, undoChanges, validateOnLists } from '../../../../lib/copilot/applyToLists';
import { locateScreen } from '../../../../lib/copilot/lookup';
import { CopilotClientError, proposeActions } from './api';
import { newId, useWorkStore, workStore } from './workStore';
import DiffCard from './DiffCard';
import ReviewModal from './ReviewModal';
import type { CopilotContext } from './viewTypes';

const MAX_LEN = 2000;
const SUGGESTIONS = [
  'Make the question simpler',
  'Rewrite the explanation in simple words',
  'Fix the correct answer if it is wrong',
  'Fix spelling and grammar',
];

export default function ActionView({ ctx }: { ctx: CopilotContext }) {
  const { proposal, actionPending, actionError, notice, undoStack } = useWorkStore();
  const { scope, scopeLabel, displayModules, fullSpace, fullPrac, onCommit } = ctx;
  const [input, setInput] = useState('');
  const [reviewIdx, setReviewIdx] = useState<number | null>(null);

  // A different proposal (or none) always closes the preview.
  useEffect(() => { setReviewIdx(null); }, [proposal?.id]);

  // Fresh dry run on the data as it is RIGHT NOW (the admin may have edited since the AI answered).
  const dry = useMemo(
    () => (proposal ? validateOnLists(fullSpace, fullPrac, proposal.actions, proposal.scope) : null),
    [proposal, fullSpace, fullPrac],
  );

  const send = async (raw: string) => {
    const instruction = raw.trim();
    if (!instruction || actionPending || !scope) return;
    workStore.setActionPending(true);
    workStore.setActionError(null);
    workStore.setNotice(null);
    try {
      const r = await proposeActions({ modules: displayModules, scope, instruction });
      if (!r.actions.length) {
        workStore.setProposal(null);
        workStore.setNotice({ kind: 'info', text: r.message || r.errors[0] || 'The AI did not propose any change.' });
      } else {
        workStore.setProposal({ id: newId('prop'), instruction, scope, scopeLabel, actions: r.actions, message: r.message, errors: r.errors });
      }
      setInput('');
    } catch (e) {
      workStore.setActionError(e instanceof CopilotClientError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      workStore.setActionPending(false);
    }
  };

  /** Apply the given proposal indices. The client is the authority: it re-validates and then saves. */
  const apply = (indices: number[]) => {
    if (!proposal) return;
    const actions = indices.map(i => proposal.actions[i]);
    const r = applyOnLists(fullSpace, fullPrac, actions, proposal.scope);
    if (r.appliedCount === 0) {
      workStore.setNotice({ kind: 'error', text: r.results[0]?.errors[0] || 'Nothing could be applied.' });
      return;
    }
    setReviewIdx(null);
    onCommit(r.nextSpace, r.nextPrac);
    workStore.pushUndo({
      id: newId('undo'),
      label: `${r.appliedCount} change(s) in ${proposal.scopeLabel || 'selection'}`,
      changes: r.changes,
      at: Date.now(),
    });
    // keep rejected ones visible, drop the applied ones
    const appliedIdx = indices.filter((_, k) => r.results[k]?.status === 'ok');
    workStore.dropActions(appliedIdx);
    workStore.setNotice({
      kind: 'success',
      text: `Applied ${r.appliedCount} change(s) and saved.${r.staleAudioScreens ? ` Audio is now outdated on ${r.staleAudioScreens} screen(s).` : ''}${r.rejectedCount ? ` ${r.rejectedCount} could not be applied.` : ''}`,
    });
  };

  const undo = () => {
    const rec = undoStack[undoStack.length - 1];
    if (!rec) return;
    const u = undoChanges(fullSpace, fullPrac, rec.changes);
    if (u.restoredLessonIds.length) onCommit(u.nextSpace, u.nextPrac);
    workStore.popUndo();
    workStore.setNotice(
      u.conflictLessonIds.length === 0
        ? { kind: 'success', text: 'Undone. The previous version is saved again.' }
        : u.restoredLessonIds.length
          ? { kind: 'info', text: `Undone for ${u.restoredLessonIds.length} lesson(s). ${u.conflictLessonIds.length} lesson(s) were edited after the change and were left as they are.` }
          : { kind: 'error', text: 'Cannot undo: this lesson was edited again after the change, and undoing would erase that edit.' },
    );
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  };

  // Review screen: the screen as it would look after ONLY this action (dry run, nothing saved).
  const review = useMemo(() => {
    if (!proposal || reviewIdx === null || !proposal.actions[reviewIdx]) return null;
    const a = proposal.actions[reviewIdx];
    const r = validateOnLists(fullSpace, fullPrac, [a], proposal.scope);
    const proposed = locateScreen([r.nextSpace, r.nextPrac], a.lessonId, a.screenId);
    const current = locateScreen([fullSpace, fullPrac], a.lessonId, a.screenId);
    if (!proposed) return null;
    return {
      title: `${proposed.lessonTitle || a.lessonId} › screen ${proposed.index + 1}`,
      proposed: proposed.screen,
      current: current?.screen ?? null,
    };
  }, [proposal, reviewIdx, fullSpace, fullPrac]);

  const okIdx = dry ? dry.results.map((r, i) => (r.status === 'ok' ? i : -1)).filter(i => i >= 0) : [];
  const lastUndo = undoStack[undoStack.length - 1];

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite">
        {lastUndo && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2">
            <p className="flex-1 min-w-0 text-xs text-slate-800 truncate">
              Last saved change: <strong>{lastUndo.label}</strong>
              {undoStack.length > 1 ? ` (+${undoStack.length - 1} earlier)` : ''}
            </p>
            <button type="button" onClick={undo} className="min-h-[44px] px-3 rounded-xl border border-slate-300 bg-white text-xs font-extrabold text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer transition-colors duration-150">
              <Undo2 size={16} aria-hidden="true" /> Undo
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className={`flex gap-2 rounded-xl border px-3 py-2 text-xs ${
              notice.kind === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : notice.kind === 'error' ? 'bg-red-50 border-red-300 text-red-900'
              : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            {notice.kind === 'success' ? <CheckCircle2 size={16} className="shrink-0" aria-hidden="true" />
              : notice.kind === 'error' ? <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
              : <Info size={16} className="shrink-0" aria-hidden="true" />}
            <span>{notice.text}</span>
          </div>
        )}

        {actionError && (
          <div role="alert" className="flex gap-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-900">
            <AlertCircle size={16} className="shrink-0" aria-hidden="true" /> {actionError}
          </div>
        )}

        {!proposal && !actionPending && (
          <div className="flex flex-col items-center text-center gap-4 py-6">
            <p className="text-sm text-slate-700 max-w-md">
              Tell Copilot what to change in the selected unit, lesson or screen. You will see the old and new text side by side, and
              <strong> nothing changes until you press Apply</strong>.
            </p>
            <p className="text-xs text-slate-600 max-w-md">Right now Action works on Multiple choice and True/False screens. Other types can be read in Ask mode.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} type="button" onClick={() => void send(s)} disabled={!scope}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-bold text-indigo-800 hover:bg-indigo-100 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {actionPending && (
          <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-100 rounded-2xl px-3.5 py-2.5 w-fit">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Copilot is preparing changes…
          </div>
        )}

        {proposal && dry && (
          <section className="space-y-3" aria-label="Proposed changes">
            <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-2 text-xs text-indigo-950">
              <div className="font-extrabold truncate">Request: {proposal.instruction}</div>
              {proposal.scopeLabel && <div className="text-indigo-900 truncate">{proposal.scopeLabel}</div>}
              {proposal.message && <div className="mt-1">{proposal.message}</div>}
            </div>
            {proposal.errors.length > 0 && (
              <p className="text-xs text-amber-900 bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1.5">{proposal.errors.join(' ')}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => apply(okIdx)} disabled={okIdx.length === 0}
                className="min-h-[44px] px-4 rounded-xl bg-indigo-600 text-white text-xs font-extrabold flex items-center gap-1.5 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed transition-colors duration-150">
                <Check size={16} aria-hidden="true" /> Apply all ({okIdx.length})
              </button>
              <button type="button" onClick={() => workStore.setProposal(null)}
                className="min-h-[44px] px-4 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-extrabold flex items-center gap-1.5 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer transition-colors duration-150">
                <X size={16} aria-hidden="true" /> Reject all
              </button>
            </div>

            {dry.results.map((r, i) => (
              <DiffCard
                key={`${proposal.id}_${i}`}
                result={r}
                location={locateScreen([fullSpace, fullPrac], r.action.lessonId, r.action.screenId)}
                onApply={() => apply([i])}
                onReject={() => { setReviewIdx(null); workStore.dropActions([i]); }}
                onReview={() => setReviewIdx(i)}
              />
            ))}
          </section>
        )}
      </div>

      <div className="px-3 py-3 border-t border-slate-200 bg-white">
        <div className="flex items-end gap-2">
          <label htmlFor="copilot-action-input" className="sr-only">What should Copilot change?</label>
          <textarea
            id="copilot-action-input"
            value={input}
            onChange={e => setInput(e.target.value.slice(0, MAX_LEN))}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder={scope ? 'What should be changed? e.g. “Make the question simpler”' : 'Select a unit first'}
            disabled={!scope || actionPending}
            className="flex-1 resize-none min-h-[44px] max-h-40 px-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 disabled:bg-slate-100"
          />
          <button type="button" onClick={() => void send(input)} disabled={!input.trim() || actionPending || !scope} aria-label="Propose changes"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed">
            <Send size={18} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-600">A new request replaces the changes still waiting for your decision.</p>
      </div>
      {review && <ReviewModal title={review.title} proposed={review.proposed} current={review.current} onClose={() => setReviewIdx(null)} />}
    </>
  );
}
