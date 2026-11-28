import { describe, it, expect } from 'vitest';
import { applyOnLists, validateOnLists, undoChanges } from '../applyToLists';
import { act, deepFreeze, getScreen, makeMcq, makeModules } from './fixtures';
import type { CopilotScope } from '../types';

const lessonScope: CopilotScope = { kind: 'lesson', lessonId: 'lessonA' };

describe('applyOnLists', () => {
  it('applies on the list that holds the lesson, other list untouched (same reference)', () => {
    const space = deepFreeze(makeModules());
    const prac = deepFreeze([{ id: 'p1', lessons: [{ id: 'lessonP', challenges: [makeMcq({ id: 'scr_p' })] }] }]);
    const r = applyOnLists(space, prac, [act({ question: 'New?' })], lessonScope);
    expect(r.appliedCount).toBe(1);
    expect(getScreen(r.nextSpace, 'lessonA', 'scr_mcq_1').question).toBe('New?');
    expect(r.nextPrac).toBe(prac);
    expect(getScreen(space, 'lessonA', 'scr_mcq_1').question).toBe('Which example uses AI?');
  });

  it('routes to the practice list when the lesson lives there', () => {
    const space = makeModules();
    const prac = [{ id: 'p1', lessons: [{ id: 'lessonP', challenges: [makeMcq({ id: 'scr_p' })] }] }];
    const r = applyOnLists(space, prac, [act({ question: 'P?' }, { lessonId: 'lessonP', screenId: 'scr_p' })], { kind: 'lesson', lessonId: 'lessonP' });
    expect(r.nextSpace).toBe(space);
    expect(getScreen(r.nextPrac, 'lessonP', 'scr_p').question).toBe('P?');
  });

  it('unknown lesson is rejected, results keep the original order', () => {
    const r = applyOnLists(makeModules(), [], [act({ question: 'a' }), act({ question: 'b' }, { lessonId: 'ghost' })], lessonScope);
    expect(r.results.map(x => [x.index, x.status])).toEqual([[0, 'ok'], [1, 'rejected']]);
  });

  it('atomic: one rejection applies nothing and records no changes', () => {
    const space = makeModules();
    const r = applyOnLists(space, [], [act({ question: 'ok' }), act({ correctOptionIndex: 99 })], lessonScope, { atomic: true });
    expect(r.atomicAborted).toBe(true);
    expect(r.nextSpace).toBe(space);
    expect(r.changes).toEqual([]);
    expect(r.appliedCount).toBe(0);
  });

  it('atomic across BOTH lists: ok in one list + rejected in the other applies nothing', () => {
    const space = makeModules();
    const prac = [{ id: 'p1', lessons: [{ id: 'lessonP', challenges: [makeMcq({ id: 'scr_p' })] }] }];
    const unitScope: CopilotScope = { kind: 'unit', unitId: 'unitA' };
    const r = applyOnLists(space, prac, [
      act({ question: 'fine' }),
      act({ question: 'x' }, { lessonId: 'lessonP', screenId: 'scr_p' }), // outside the unit scope -> rejected
    ], unitScope, { atomic: true });
    expect(r.atomicAborted).toBe(true);
    expect(r.nextSpace).toBe(space);
    expect(r.nextPrac).toBe(prac);
    expect(r.changes).toEqual([]);
  });

  it('validateOnLists never changes the input and gives the same diff', () => {
    const space = deepFreeze(makeModules());
    const a = validateOnLists(space, [], [act({ correctOptionIndex: 0 })], lessonScope);
    const b = applyOnLists(space, [], [act({ correctOptionIndex: 0 })], lessonScope);
    expect(a.results[0].diff).toEqual(b.results[0].diff);
    expect(a.results[0].diff.some(d => d.sensitive)).toBe(true);
  });

  it('counts stale audio screens', () => {
    const r = applyOnLists(makeModules(), [], [act({ question: 'Changed spoken text?' })], lessonScope);
    expect(r.staleAudioScreens).toBe(1);
    expect(getScreen(r.nextSpace, 'lessonA', 'scr_mcq_1').audioNarrations.en.status).toBe('stale');
  });
});

describe('undoChanges', () => {
  it('restores the exact previous lesson', () => {
    const space = makeModules();
    const r = applyOnLists(space, [], [act({ question: 'Changed?' })], lessonScope);
    const u = undoChanges(r.nextSpace, [], r.changes);
    expect(u.restoredLessonIds).toEqual(['lessonA']);
    expect(JSON.stringify(u.nextSpace)).toBe(JSON.stringify(space));
  });

  it('does NOT overwrite a lesson that was edited again after Apply', () => {
    const r = applyOnLists(makeModules(), [], [act({ question: 'Changed?' })], lessonScope);
    const edited = r.nextSpace.map(m => ({
      ...m,
      lessons: m.lessons!.map(l => (l.id === 'lessonA' ? { ...l, title: 'Edited by hand' } : l)),
    }));
    const u = undoChanges(edited, [], r.changes);
    expect(u.conflictLessonIds).toEqual(['lessonA']);
    expect(u.restoredLessonIds).toEqual([]);
    expect(u.nextSpace).toBe(edited);
  });

  it('restores in the practice list too', () => {
    const prac = [{ id: 'p1', lessons: [{ id: 'lessonP', challenges: [makeMcq({ id: 'scr_p' })] }] }];
    const r = applyOnLists([], prac, [act({ question: 'P2?' }, { lessonId: 'lessonP', screenId: 'scr_p' })], { kind: 'lesson', lessonId: 'lessonP' });
    const u = undoChanges([], r.nextPrac, r.changes);
    expect(JSON.stringify(u.nextPrac)).toBe(JSON.stringify(prac));
  });
});
