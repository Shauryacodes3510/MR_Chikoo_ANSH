/**
 * AI Copilot v1 – shared types.
 * Pure TypeScript, no React / no server imports, so both the client and
 * server.app.ts can use it. See docs/copilot-v1-notes.md.
 */

/** A screen (challenge) object as stored inside lessons.challenges. */
export type ScreenLike = Record<string, any> & { id: string; type: string };

export interface LessonLike {
  id: string;
  challenges?: ScreenLike[];
  [key: string]: any;
}

export interface ModuleLike {
  id: string;
  lessons?: LessonLike[];
  [key: string]: any;
}

/** What the admin selected in the Studio. Every action must stay inside it. */
export type CopilotScope =
  | { kind: 'screen'; lessonId: string; screenId: string }
  | { kind: 'lesson'; lessonId: string }
  | { kind: 'unit'; unitId: string };

/** One action proposed by the AI (the JSON contract). */
export interface CopilotAction {
  action: string;
  lessonId: string;
  screenId: string;
  fields: Record<string, unknown>;
  reason?: string;
}

/** One row of the diff preview (old vs new) shown to the admin. */
export interface DiffEntry {
  field: string;
  before: unknown;
  after: unknown;
  /** Highlight in UI: xpValue, difficulty, media, and any change of the correct answer. */
  sensitive: boolean;
}

export interface ActionResult {
  index: number;
  action: CopilotAction;
  status: 'ok' | 'rejected';
  errors: string[];
  warnings: string[];
  diff: DiffEntry[];
  /** Duplicate fields the CODE kept in sync (AI never sees these names). */
  mirrorsWritten: string[];
  /** Audio language keys (all aliases) that were flagged status:"stale". */
  staleAudioAliases: string[];
}

/** What a screen-type handler returns for one action. */
export interface HandlerOutcome {
  errors: string[];
  warnings: string[];
  next?: ScreenLike;
  diff: DiffEntry[];
  mirrorsWritten: string[];
  /** True if any text that is spoken/narrated changed → engine marks audio stale. */
  spokenTextChanged: boolean;
}

/** One handler per screen type family: schema + locked list + mirror logic + validation. */
export interface ScreenHandler {
  /** Action name in the JSON contract, e.g. "updateMcq". */
  actionName: string;
  /** Screen `type` values this handler can edit. */
  types: readonly string[];
  /** Pure: validates `fields` against `screen` and returns the edited copy. Never mutates. */
  plan(screen: ScreenLike, fields: Record<string, unknown>): HandlerOutcome;
}

export interface RunOptions {
  /** If true and ANY action is rejected, nothing is applied (all-or-nothing). Default false. */
  atomic?: boolean;
}

export interface RunResult {
  results: ActionResult[];
  /** New modules list (structural sharing; input is never mutated). Same as input if nothing applied. */
  nextModules: ModuleLike[];
  changedLessonIds: string[];
  appliedCount: number;
  rejectedCount: number;
  /** Number of screens whose audio entries were flagged stale. */
  staleAudioScreens: number;
  /** True when `atomic` was set and a rejection prevented applying anything. */
  atomicAborted: boolean;
}
