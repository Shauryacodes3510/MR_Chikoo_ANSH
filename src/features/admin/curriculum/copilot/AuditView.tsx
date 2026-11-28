/**
 * Audit mode: read-only scan ("check all answers"). Each finding with a safe fix gets a Fix button
 * that turns the fix into a normal Action proposal (same diff + Apply flow). Nothing is changed here.
 */
import { Loader2, ListChecks, AlertCircle, AlertTriangle, XCircle, Wrench, Info } from 'lucide-react';
import { locateScreen } from '../../../../lib/copilot/lookup';
import { CopilotClientError, runAuditScan, type AuditResponse } from './api';
import { newId, useWorkStore, workStore } from './workStore';
import { DiffRows } from './DiffCard';
import type { CopilotContext } from './viewTypes';

type Finding = AuditResponse['findings'][number];

export default function AuditView({ ctx }: { ctx: CopilotContext }) {
  const { auditPending, auditError, audit } = useWorkStore();
  const { scope, scopeLabel, displayModules, fullSpace, fullPrac } = ctx;

  const run = async () => {
    if (!scope || auditPending) return;
    workStore.setAuditPending(true);
    workStore.setAuditError(null);
    try {
      const data = await runAuditScan({ modules: displayModules, scope });
      workStore.setAudit({ scope, scopeLabel, data });
    } catch (e) {
      workStore.setAuditError(e instanceof CopilotClientError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      workStore.setAuditPending(false);
    }
  };

  /** Fix = a normal Action. The admin still sees the diff and must press Apply. */
  const startFix = (f: Finding) => {
    if (!f.fixAction) return;
    workStore.setProposal({
      id: newId('prop'),
      instruction: `Fix: ${f.problem}`,
      scope: { kind: 'lesson', lessonId: f.lessonId },
      scopeLabel: audit?.scopeLabel ?? '',
      actions: [f.fixAction],
      message: f.why,
      errors: [],
    });
    workStore.setMode('action');
    workStore.setNotice({ kind: 'info', text: 'Review the change below, then press Apply. Nothing is saved yet.' });
  };

  const data = audit?.data;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <p className="text-sm text-slate-800">
          Scans the selected {scope?.kind === 'screen' ? 'screen' : scope?.kind === 'lesson' ? 'lesson' : 'unit'} for wrong marked answers, unclear questions and
          explanations that contradict the answer. It only <strong>reports</strong>; you decide what to fix.
        </p>
        <p className="text-xs text-slate-600">Works on Multiple choice and True/False screens (max 120 screens per scan). Other types are skipped for now.</p>
        <button
          type="button"
          onClick={() => void run()}
          disabled={!scope || auditPending}
          className="min-h-[44px] px-4 rounded-xl bg-indigo-600 text-white text-sm font-extrabold flex items-center gap-2 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed transition-colors duration-150"
        >
          {auditPending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ListChecks size={16} aria-hidden="true" />}
          {auditPending ? 'Checking…' : 'Check all answers'}
        </button>
      </div>

      {auditError && (
        <div role="alert" className="flex gap-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-900">
          <AlertCircle size={16} className="shrink-0" aria-hidden="true" /> {auditError}
        </div>
      )}

      {data && (
        <section className="space-y-3" aria-label="Audit results">
          <div className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800">
            <div className="font-extrabold truncate">{audit?.scopeLabel || 'Selection'}</div>
            Checked {data.scanned} screen(s) · {data.findings.length} problem(s) found
            {data.skippedUnsupported > 0 ? ` · ${data.skippedUnsupported} screen(s) of other types skipped` : ''}
          </div>

          {data.batchErrors.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950 space-y-1">
              <div className="font-extrabold flex items-center gap-1.5"><AlertTriangle size={14} aria-hidden="true" /> Some screens could not be checked</div>
              {data.batchErrors.map((b, i) => <div key={i}>{b}</div>)}
            </div>
          )}

          {data.findings.length === 0 && data.batchErrors.length === 0 && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-3 text-sm text-emerald-950">
              No problems found in the {data.scanned} screen(s) that were checked.
            </div>
          )}

          {data.findings.map((f, i) => {
            const loc = locateScreen([fullSpace, fullPrac], f.lessonId, f.screenId);
            const isError = f.severity === 'error';
            return (
              <article key={`${f.lessonId}_${f.screenId}_${i}`} className={`rounded-2xl border p-3.5 space-y-2.5 ${isError ? 'border-red-300 bg-red-50/40' : 'border-amber-300 bg-amber-50/40'}`}>
                <header className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 break-words min-w-0">
                    {loc ? `${loc.lessonTitle || f.lessonId} › screen ${loc.index + 1}` : `${f.lessonId} › ${f.screenId}`}
                  </h3>
                  <span className={`shrink-0 flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md ${isError ? 'bg-red-100 text-red-900' : 'bg-amber-100 text-amber-950'}`}>
                    {isError ? <XCircle size={12} aria-hidden="true" /> : <AlertTriangle size={12} aria-hidden="true" />}
                    {isError ? 'Error' : 'Warning'}
                  </span>
                </header>
                {loc?.screen?.question && <p className="text-xs text-slate-700 italic break-words">“{String(loc.screen.question).slice(0, 200)}”</p>}
                <p className="text-sm text-slate-900"><strong>Problem:</strong> {f.problem}</p>
                <p className="text-xs text-slate-800"><strong>Why:</strong> {f.why}</p>

                {f.fixResult && f.fixResult.diff.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-extrabold text-slate-900">Suggested fix</p>
                    <DiffRows diff={f.fixResult.diff} />
                  </div>
                )}
                {f.fixError && <p className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">{f.fixError}</p>}
                {!f.fixAction && !f.fixError && (
                  <p className="text-xs text-slate-700 flex items-center gap-1.5"><Info size={14} aria-hidden="true" /> No automatic fix. Please check and edit this screen yourself.</p>
                )}

                {f.fixAction && (
                  <button
                    type="button"
                    onClick={() => startFix(f)}
                    className="min-h-[44px] px-4 rounded-xl bg-indigo-600 text-white text-xs font-extrabold flex items-center gap-1.5 hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 cursor-pointer transition-colors duration-150"
                  >
                    <Wrench size={16} aria-hidden="true" /> Fix
                  </button>
                )}
              </article>
            );
          })}

          {data.findings.some(f => f.fixAction) && (
            <p className="text-xs text-slate-600">After applying fixes, run the check again to refresh this list.</p>
          )}
        </section>
      )}
    </div>
  );
}
