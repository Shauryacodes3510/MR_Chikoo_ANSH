import { describe, it, expect } from 'vitest';
import { countStaleAudioScreens, listStaleAudioScreens, locateScreen } from '../lookup';
import { act, makeMcq, makeModules } from './fixtures';
import { applyOnLists } from '../applyToLists';

describe('lookup helpers', () => {
  it('locateScreen finds a screen in either list, with its position', () => {
    const prac = [{ id: 'p', lessons: [{ id: 'lp', title: 'LP', challenges: [makeMcq({ id: 'a' }), makeMcq({ id: 'b' })] }] }];
    const hit = locateScreen([makeModules(), prac], 'lp', 'b');
    expect(hit?.index).toBe(1);
    expect(hit?.lessonTitle).toBe('LP');
    expect(locateScreen([makeModules(), prac], 'lessonA', 'nope')).toBeNull();
  });

  it('counts only screens with a stale narration entry', () => {
    const base = makeModules();
    expect(countStaleAudioScreens([base])).toBe(0);
    const r = applyOnLists(base, [], [act({ question: 'Changed spoken text?' })], { kind: 'lesson', lessonId: 'lessonA' });
    expect(countStaleAudioScreens([r.nextSpace])).toBe(1);
    expect(listStaleAudioScreens([r.nextSpace])).toEqual([{ lessonId: 'lessonA', screenId: 'scr_mcq_1' }]);
  });

  it('XP-only change does not make audio stale', () => {
    const r = applyOnLists(makeModules(), [], [act({ xpValue: 20 })], { kind: 'lesson', lessonId: 'lessonA' });
    expect(countStaleAudioScreens([r.nextSpace])).toBe(0);
  });
});
