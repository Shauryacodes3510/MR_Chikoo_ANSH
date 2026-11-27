import { describe, it, expect } from 'vitest';
import { applyActions, validateActions } from '../applyActions';
import { parseActionPayload } from '../validate';
import type { CopilotScope } from '../types';
import { act, deepFreeze, getScreen, makeModules } from './fixtures';

const lessonScope: CopilotScope = { kind: 'lesson', lessonId: 'lessonA' };

describe('scope checks', () => {
  it('screen scope: only that exact screen', () => {
    const s: CopilotScope = { kind: 'screen', lessonId: 'lessonA', screenId: 'scr_mcq_1' };
    const m = makeModules();
    expect(applyActions(m, [act({ question: 'Q1?' })], s).results[0].status).toBe('ok');
    const other = applyActions(m, [act({ question: 'Q?' }, { lessonId: 'lessonB', screenId: 'scr_mcq_other' })], s);
    expect(other.results[0].status).toBe('rejected');
    expect(other.results[0].errors[0]).toMatch(/outside the selected scope/);
    const sameLessonOtherScreen = applyActions(m, [act({ correctOptionIndex: 1 }, { screenId: 'scr_tf_1' })], s);
    expect(sameLessonOtherScreen.results[0].status).toBe('rejected');
  });

  it('lesson scope: other lesson rejected, even in the same unit', () => {
    const r = applyActions(makeModules(), [act({ question: 'Q?' }, { lessonId: 'lessonB', screenId: 'scr_mcq_other' })], lessonScope);
    expect(r.results[0].status).toBe('rejected');
  });

  it('unit scope: lesson in the unit is OK, lesson in another unit is rejected', () => {
    const s: CopilotScope = { kind: 'unit', unitId: 'unitA' };
    const inUnit = applyActions(makeModules(), [act({ question: 'Q?' }, { lessonId: 'lessonB', screenId: 'scr_mcq_other' })], s);
    expect(inUnit.results[0].status).toBe('ok');
    const outUnit = applyActions(makeModules(), [act({ question: 'Q?' }, { lessonId: 'lessonC', screenId: 'scr_mcq_c' })], s);
    expect(outUnit.results[0].status).toBe('rejected');
  });

  it('unknown lesson / screen ids are rejected', () => {
    const r = applyActions(makeModules(), [act({ question: 'Q?' }, { lessonId: 'nope' }), act({ question: 'Q?' }, { screenId: 'nope' })], lessonScope);
    expect(r.results.map(x => x.status)).toEqual(['rejected', 'rejected']);
    expect(r.results[0].errors[0]).toMatch(/not found/);
    expect(r.results[1].errors[0]).toMatch(/not found/);
  });
});

describe('unsupported types and actions', () => {
  it('content_screen is rejected by updateMcq in v1', () => {
    const r = applyActions(makeModules(), [act({ question: 'Q?' }, { screenId: 'scr_content_1' })], lessonScope);
    expect(r.results[0].status).toBe('rejected');
    expect(r.results[0].errors[0]).toMatch(/not supported/);
  });

  it('unknown action name is rejected (e.g. a delete action does not exist)', () => {
    for (const name of ['deleteScreen', 'updateScreenText', 'dropTable']) {
      const r = applyActions(makeModules(), [act({ question: 'Q?' }, { action: name })], lessonScope);
      expect(r.results[0].status).toBe('rejected');
      expect(r.results[0].errors[0]).toMatch(/Unknown action/);
    }
  });
});

describe('purity and structural sharing', () => {
  it('never mutates the input (deep-frozen input does not throw)', () => {
    const m = deepFreeze(makeModules());
    expect(() => applyActions(m, [act({ question: 'Q?', explanation: 'E.' })], lessonScope)).not.toThrow();
  });

  it('untouched screens, lessons and units keep their reference; changed ones are new', () => {
    const m = makeModules();
    const r = applyActions(m, [act({ question: 'Q?' })], lessonScope);
    expect(r.nextModules).not.toBe(m);
    expect(r.nextModules[1]).toBe(m[1]); // unitB untouched
    expect(r.nextModules[0].lessons![1]).toBe(m[0].lessons![1]); // lessonB untouched
    expect(getScreen(r.nextModules, 'lessonA', 'scr_tf_1')).toBe(getScreen(m, 'lessonA', 'scr_tf_1'));
    expect(getScreen(r.nextModules, 'lessonA', 'scr_mcq_1')).not.toBe(getScreen(m, 'lessonA', 'scr_mcq_1'));
  });

  it('nothing applied → nextModules is the SAME reference (Undo/no-op safe)', () => {
    const m = makeModules();
    const r = applyActions(m, [act({ id: 'x' })], lessonScope);
    expect(r.nextModules).toBe(m);
    expect(r.changedLessonIds).toEqual([]);
  });

  it('validateActions (dry run) returns the same diff as applyActions', () => {
    const m = makeModules();
    const actions = [act({ question: 'Q?', xpValue: 12 })];
    expect(validateActions(m, actions, lessonScope).results[0].diff).toEqual(applyActions(m, actions, lessonScope).results[0].diff);
  });
});

describe('multiple actions', () => {
  it('apply sequentially; the second sees the result of the first', () => {
    const r = applyActions(makeModules(), [act({ question: 'First?' }), act({ explanation: 'Second.' })], lessonScope);
    expect(r.appliedCount).toBe(2);
    const s = getScreen(r.nextModules, 'lessonA', 'scr_mcq_1');
    expect(s.question).toBe('First?');
    expect(s.explanation.text).toBe('Second.');
  });

  it('a rejected action is skipped, valid ones still apply (default)', () => {
    const r = applyActions(makeModules(), [act({ id: 'bad' }), act({ question: 'Good?' })], lessonScope);
    expect(r.appliedCount).toBe(1);
    expect(r.rejectedCount).toBe(1);
    expect(getScreen(r.nextModules, 'lessonA', 'scr_mcq_1').question).toBe('Good?');
  });

  it('atomic: any rejection → nothing applied', () => {
    const m = makeModules();
    const r = applyActions(m, [act({ question: 'Good?' }), act({ id: 'bad' })], lessonScope, { atomic: true });
    expect(r.atomicAborted).toBe(true);
    expect(r.appliedCount).toBe(0);
    expect(r.nextModules).toBe(m);
  });

  it('reports changed lesson ids and the number of screens flagged stale', () => {
    const r = applyActions(
      makeModules(),
      [act({ question: 'Q?' }), act({ xpValue: 11 }, { screenId: 'scr_mcq_1' })],
      { kind: 'unit', unitId: 'unitA' },
    );
    expect(r.changedLessonIds).toEqual(['lessonA']);
    expect(r.staleAudioScreens).toBe(1);
  });
});

describe('parseActionPayload', () => {
  const good = { actions: [{ action: 'updateMcq', lessonId: 'l', screenId: 's', fields: { question: 'Q?' }, reason: 'why' }] };

  it('accepts an object and a JSON string (also inside ```json fences)', () => {
    expect(parseActionPayload(good).actions).toHaveLength(1);
    expect(parseActionPayload(JSON.stringify(good)).actions).toHaveLength(1);
    expect(parseActionPayload('```json\n' + JSON.stringify(good) + '\n```').actions).toHaveLength(1);
  });

  it('reports invalid JSON and wrong top-level shape', () => {
    expect(parseActionPayload('not json').errors[0]).toMatch(/not valid JSON/);
    expect(parseActionPayload({ foo: 1 }).errors[0]).toMatch(/"actions" array/);
    expect(parseActionPayload([]).errors[0]).toMatch(/"actions" array/);
  });

  it('drops malformed actions and reports each', () => {
    const p = parseActionPayload({
      actions: [
        { action: 'updateMcq', lessonId: 'l', screenId: 's', fields: {} },
        { action: 'updateMcq', lessonId: 'l', fields: {} },
        { action: 'updateMcq', lessonId: 'l', screenId: 's', fields: [] },
        'string',
      ],
    });
    expect(p.actions).toHaveLength(1);
    expect(p.errors).toHaveLength(3);
  });

  it('rejects too many actions', () => {
    const many = { actions: Array.from({ length: 51 }, () => good.actions[0]) };
    expect(parseActionPayload(many).errors[0]).toMatch(/Too many/);
  });
});
