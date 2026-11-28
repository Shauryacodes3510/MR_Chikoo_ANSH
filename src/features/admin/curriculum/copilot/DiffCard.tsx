/** One proposed change: old vs new, sensitive rows highlighted, Apply / Reject (/ Review). */
import { AlertTriangle, Check, Eye, X, Volume2 } from 'lucide-react';
import type { ActionResult, DiffEntry } from '../../../../lib/copilot/types';
import type { ScreenLocation } from '../../../../lib/copilot/lookup';

export const fmt = (v: unknown): string => {
  if (v === undefined || v === null || v === '') return '—';
  if (typeof v === 'string') return v.length > 400 ? v.slice(0, 400) + '…' : v;
  if (Array.isArray(v)) return v.map(fmt).join('  |  ');
  return JSON.stringify(v);
};

/** Old vs new rows. Sensitive rows (correct answer, XP, difficulty, media) are highlighted. */
export function DiffRows({ diff }: { diff: DiffEntry[] }) {
  return (
    <ul className="space-y-2">
      {diff.map(d => (
        <li key={d.field} className={`rounded-xl border p-2.5 text-xs space-y-1.5 ${d.sensitive ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
            {d.field}
            {d.sensitive && (
              <span className="flex items-center gap-1 text-[11px] text-amber-900 font-extrabold">
                <AlertTriangle size={12} aria-hidden="true" /> Sensitive change
              </span>
            )}
          </div>
          <div className="rounded-lg bg-red-50 text-red-900 border border-red-200 px-2 py-1.5 break-words whitespace-pre-wrap">
            <span className="font-extrabold">Before: </span>{fmt(d.before)}
          </div>
          <div className="rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-1.5 break-words whitespace-pre-wrap">
            <span className="font-extrabold">After: </span>{fmt(d.after)}
          </div>
        </li>
      ))}
    </ul>
  );
}

interface Props {
  result: ActionResult;
  location: ScreenLocation | null;
  busy?: boolean;
  onApply?: () => void;
  onReject?: () => void;
  onReview?: () => void;
  /** Hide Apply/Reject (e.g. a read-only list). */
  readOnly?: boolean;
}

const btn =
  'min-h-[44px] px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed';

export default function DiffCard({ result, location, busy, onApply, onReject, onReview, readOnly }: Props) {
  const rejected = result.status === 'rejected';
  const where = location
    ? `${location.lessonTitle || location.lessonId} › screen ${location.index + 1} (${String(location.screen.type).replace(/^c\d+_/, '')})`
    : `${result.action.lessonId} › ${result.action.screenId}`;

  return (
    <article className={`rounded-2xl border p-3.5 space-y-3 ${rejected ? 'border-red-200 bg-red-50/40' : 'border-slate-200 bg-white'}`}>
      <header className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-extrabold text-slate-900 break-words min-w-0">{where}</h3>
        <span className={`shrink-0 text-[11px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md ${rejected ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
          {rejected ? 'Rejected by checks' : 'Ready'}
        </span>
      </header>

      {result.action.reason && <p className="text-xs text-slate-700 italic">Why: {result.action.reason}</p>}

      {result.diff.length > 0 && <DiffRows diff={result.diff} />}

      {result.errors.map((e, i) => (
        <p key={`e${i}`} className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">{e}</p>
      ))}
      {result.warnings.map((w, i) => (
        <p key={`w${i}`} className="text-xs text-amber-900 bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1.5">{w}</p>
      ))}

      {!rejected && result.staleAudioAliases.length > 0 && (
        <p className="text-xs text-slate-700 flex items-center gap-1.5">
          <Volume2 size={14} className="shrink-0 text-slate-600" aria-hidden="true" />
          The narration text changed, so this screen&apos;s audio will be marked outdated (students keep hearing the old audio until you regenerate it).
        </p>
      )}
      {!rejected && result.mirrorsWritten.length > 0 && (
        <p className="text-xs text-slate-600">{result.mirrorsWritten.length} linked copy field(s) are kept in sync automatically.</p>
      )}

      {!readOnly && (
        <footer className="flex flex-wrap gap-2 pt-1">
          <button type="button" onClick={onApply} disabled={rejected || busy} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-600`}>
            <Check size={16} aria-hidden="true" /> Apply
          </button>
          <button type="button" onClick={onReject} disabled={busy} className={`${btn} border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 disabled:opacity-50`}>
            <X size={16} aria-hidden="true" /> Reject
          </button>
          {onReview && (
            <button type="button" onClick={onReview} disabled={rejected || busy} className={`${btn} border border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 disabled:opacity-50`}>
              <Eye size={16} aria-hidden="true" /> Review screen
            </button>
          )}
        </footer>
      )}
    </article>
  );
}
