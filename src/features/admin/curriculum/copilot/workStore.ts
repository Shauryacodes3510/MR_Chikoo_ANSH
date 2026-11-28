/**
 * Module-level store for Action / Audit work, so a proposal, the Undo history and audit results
 * survive switching admin tabs (cleared on page refresh). Ask chat has its own store (chatStore.ts).
 */
import { useSyncExternalStore } from 'react';
import type { CopilotAction, CopilotScope } from '../../../../lib/copilot/types';
import type { LessonChange } from '../../../../lib/copilot/applyToLists';
import type { AuditResponse } from './api';

export type CopilotMode = 'ask' | 'action' | 'audit';

export interface Proposal {
  id: string;
  instruction: string;
  scope: CopilotScope;
  scopeLabel: string;
  actions: CopilotAction[];
  /** Short note from the AI, if any. */
  message?: string;
  /** Problems with the AI answer itself (invalid JSON etc.). */
  errors: string[];
}

export interface UndoRecord {
  id: string;
  label: string;
  changes: LessonChange[];
  at: number;
}

export interface Notice { kind: 'success' | 'error' | 'info'; text: string }

interface State {
  mode: CopilotMode;
  actionPending: boolean;
  actionError: string | null;
  proposal: Proposal | null;
  notice: Notice | null;
  undoStack: UndoRecord[];
  auditPending: boolean;
  auditError: string | null;
  audit: { scope: CopilotScope; scopeLabel: string; data: AuditResponse } | null;
}

const MAX_UNDO = 20;
let state: State = {
  mode: 'ask', actionPending: false, actionError: null, proposal: null, notice: null,
  undoStack: [], auditPending: false, auditError: null, audit: null,
};
const listeners = new Set<() => void>();
const set = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach(l => l());
};

let counter = 0;
export const newId = (p: string) => `${p}_${Date.now()}_${counter++}`;

export const workStore = {
  getState: () => state,
  subscribe: (l: () => void) => { listeners.add(l); return () => listeners.delete(l); },
  setMode: (mode: CopilotMode) => set({ mode, notice: null }),
  setActionPending: (actionPending: boolean) => set({ actionPending }),
  setActionError: (actionError: string | null) => set({ actionError }),
  setProposal: (proposal: Proposal | null) => set({ proposal }),
  /** Remove actions (by index) from the open proposal; closes it when empty. */
  dropActions: (indices: number[]) => {
    const p = state.proposal;
    if (!p) return;
    const drop = new Set(indices);
    const actions = p.actions.filter((_, i) => !drop.has(i));
    set({ proposal: actions.length ? { ...p, actions } : null });
  },
  setNotice: (notice: Notice | null) => set({ notice }),
  pushUndo: (r: UndoRecord) => set({ undoStack: [...state.undoStack, r].slice(-MAX_UNDO) }),
  popUndo: () => set({ undoStack: state.undoStack.slice(0, -1) }),
  setAuditPending: (auditPending: boolean) => set({ auditPending }),
  setAuditError: (auditError: string | null) => set({ auditError }),
  setAudit: (audit: State['audit']) => set({ audit }),
};

export const useWorkStore = (): State => useSyncExternalStore(workStore.subscribe, workStore.getState, workStore.getState);
