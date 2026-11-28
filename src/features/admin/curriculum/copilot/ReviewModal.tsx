/**
 * "Review screen": shows the screen the way a student sees it, with the proposed edit already
 * applied (and the current version one tab away), BEFORE the admin presses Apply.
 * Reuses the existing student preview (ChallengePreviewWrapper); no second renderer.
 */
import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ChallengePreview } from '../../../../components/admin/ChallengePreviewWrapper';
import type { ScreenLike } from '../../../../lib/copilot/types';

class PreviewBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? (
      <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl p-3">
        This screen type cannot be previewed here. Use the diff above to review the change.
      </p>
    ) : this.props.children;
  }
}

interface Props {
  title: string;
  proposed: ScreenLike;
  current: ScreenLike | null;
  onClose: () => void;
}

export default function ReviewModal({ title, proposed, current, onClose }: Props) {
  const [tab, setTab] = useState<'proposed' | 'current'>('proposed');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const shown = tab === 'proposed' ? proposed : current ?? proposed;
  // The shared admin preview draws only the options / True-False buttons for these two types
  // (the student app shows the question in its own header), so show the question here too.
  const showQuestion = (shown.type === 'c1_multiple_choice' || shown.type === 'c9_true_false') && typeof shown.question === 'string' && shown.question;

  // Portal to <body>: a transformed ancestor in the admin layout would otherwise trap `fixed`.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="copilot-review-title"
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92dvh] flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
          <h2 id="copilot-review-title" className="flex-1 min-w-0 text-sm font-extrabold text-slate-900 truncate">Review screen · {title}</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close preview"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer transition-colors duration-150">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div role="tablist" aria-label="Which version" className="flex gap-1 px-3 pt-2 border-b border-slate-200">
          {([['proposed', 'With the change'], ['current', 'Current']] as const).map(([id, label]) => (
            <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)} disabled={id === 'current' && !current}
              className={`min-h-[44px] px-4 rounded-t-xl text-sm font-extrabold border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 ${
                tab === id ? 'border-indigo-600 text-indigo-800 bg-indigo-50' : 'border-transparent text-slate-700 hover:bg-slate-100'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-slate-50">
          {showQuestion && (
            <div className="mb-3 rounded-xl bg-white border border-slate-200 p-3">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600">Question</p>
              <p className="text-sm font-bold text-slate-900 break-words">{String(shown.question)}</p>
            </div>
          )}
          <PreviewBoundary resetKey={`${tab}_${shown.id}`}>
            <ChallengePreview challenge={shown as any} />
          </PreviewBoundary>
        </div>

        <p className="px-4 py-2 text-[11px] text-slate-600 border-t border-slate-200 bg-white">
          Preview only. Nothing is saved until you press Apply.
        </p>
      </div>
    </div>,
    document.body,
  );
}
