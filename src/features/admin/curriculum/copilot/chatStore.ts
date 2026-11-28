/**
 * Tiny chat store that lives outside React, so the conversation (and an in-flight answer)
 * survives switching admin tabs. Cleared by "Clear chat" or a page refresh.
 */
import { useSyncExternalStore } from 'react';
import type { ActionResult, CopilotAction, CopilotScope } from '../../../../lib/copilot/types';
import type { AuditFinding } from './api';

export interface ChatProposal {
  id: string;
  scope: CopilotScope;
  scopeLabel: string;
  actions: CopilotAction[];
  results: ActionResult[];
  applied?: boolean;
  appliedAt?: number;
  rejected?: boolean;
}

export interface ChatAudit {
  scope: CopilotScope;
  scopeLabel: string;
  scanned: number;
  skippedUnsupported?: number;
  findings: AuditFinding[];
  fixedScreenIds?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
  /** Where the question was asked, e.g. "Unit 1 › Lesson 2". */
  scopeLabel?: string;
  proposal?: ChatProposal;
  audit?: ChatAudit;
}
interface State { messages: ChatMessage[]; pending: boolean }

let state: State = { messages: [], pending: false };
const listeners = new Set<() => void>();
const set = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach(l => l());
};

let counter = 0;
export const newMessageId = () => `m_${Date.now()}_${counter++}`;

export const chatStore = {
  getState: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  add: (m: ChatMessage) => set({ messages: [...state.messages, m] }),
  setPending: (pending: boolean) => set({ pending }),
  clear: () => set({ messages: [] }),
  updateProposal: (messageId: string, patch: Partial<ChatProposal>) => {
    set({
      messages: state.messages.map(m => {
        if (m.id !== messageId || !m.proposal) return m;
        return { ...m, proposal: { ...m.proposal, ...patch } };
      }),
    });
  },
  markFindingFixed: (messageId: string, screenId: string) => {
    set({
      messages: state.messages.map(m => {
        if (m.id !== messageId || !m.audit) return m;
        const fixedScreenIds = [...(m.audit.fixedScreenIds || []), screenId];
        return { ...m, audit: { ...m.audit, fixedScreenIds } };
      }),
    });
  },
};

export const useChatStore = (): State => useSyncExternalStore(chatStore.subscribe, chatStore.getState, chatStore.getState);
