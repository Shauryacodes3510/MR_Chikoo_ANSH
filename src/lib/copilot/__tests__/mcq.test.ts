import { describe, it, expect } from 'vitest';
import { applyActions } from '../applyActions';
import type { CopilotScope } from '../types';
import { act, deepFreeze, getScreen, makeModules, makeMcq, makeTf } from './fixtures';

const scope: CopilotScope = { kind: 'lesson', lessonId: 'lessonA' };
const run = (fields: Record<string, unknown>, screenId = 'scr_mcq_1', actionName = 'updateMcq', mods = makeModules()) => {
  const modules = deepFreeze(mods);
  const r = applyActions(modules, [act(fields, { screenId, action: actionName })], scope);
  return { r, res: r.results[0], screen: getScreen(r.nextModules, 'lessonA', screenId), before: getScreen(modules, 'lessonA', screenId) };
};

describe('c1 MCQ – question / explanation / mirrors', () => {
  it('updates question and records a diff', () => {
    const { res, screen } = run({ question: '  Which one uses AI today?  ' });
    expect(res.status).toBe('ok');
    expect(screen.question).toBe('Which one uses AI today?');
    expect(res.diff).toEqual([{ field: 'question', before: 'Which example uses AI?', after: 'Which one uses AI today?', sensitive: false }]);
  });

  it('keeps explanation as an OBJECT and preserves audioUrl/audioDuration', () => {
    const { screen } = run({ explanation: 'Spam filters learn patterns.' });
    expect(screen.explanation).toEqual({ text: 'Spam filters learn patterns.', audioUrl: 'https://cdn/x/exp.mp3', audioDuration: 7 });
  });

  it('keeps explanation as a STRING when it was a string', () => {
    const { screen } = run({ explanation: 'New text.' }, 'scr_mcq_1', 'updateMcq', [
      { id: 'unitA', lessons: [{ id: 'lessonA', challenges: [makeMcq({ explanation: 'Old text.', explanation_concept: 'Old text.' })] }] },
    ]);
    expect(screen.explanation).toBe('New text.');
  });

  it('writes mirrors that equal the old text', () => {
    const { res, screen } = run({ explanation: 'Spam filters learn patterns.' });
    expect(screen.explanation_concept).toBe('Spam filters learn patterns.');
    expect(screen.explanation_takeaway).toBe('Spam filters learn patterns.');
    expect(screen.explanation_speech_script).toBe('Spam filters learn patterns.');
    expect(res.mirrorsWritten.sort()).toEqual(['explanation_concept', 'explanation_speech_script', 'explanation_takeaway']);
  });

  it('does NOT overwrite a mirror that was written manually (differs from old text)', () => {
    const { screen, res } = run({ explanation: 'Brand new.' }, 'scr_mcq_1', 'updateMcq', [
      { id: 'unitA', lessons: [{ id: 'lessonA', challenges: [makeMcq({ explanation_takeaway: 'My own takeaway' })] }] },
    ]);
    expect(screen.explanation_takeaway).toBe('My own takeaway');
    expect(screen.explanation_concept).toBe('Brand new.');
    expect(res.mirrorsWritten).not.toContain('explanation_takeaway');
  });

  it('never touches explanation_example / explanation_confused / audio urls', () => {
    const { screen, before } = run({ explanation: 'Changed.', question: 'Changed?' });
    expect(screen.explanation_example).toBe(before.explanation_example);
    expect(screen.explanation_confused).toBe(before.explanation_confused);
    expect(screen.explanation_audio_url).toBe(before.explanation_audio_url);
    expect(screen.id).toBe(before.id);
    expect(screen.type).toBe(before.type);
  });

  it('rejects an identical (no-op) change', () => {
    const { res } = run({ question: 'Which example uses AI?' });
    expect(res.status).toBe('rejected');
    expect(res.errors[0]).toMatch(/No changes/);
  });

  it('rejects empty / too long / non-string text', () => {
    expect(run({ question: '   ' }).res.status).toBe('rejected');
    expect(run({ question: 'x'.repeat(601) }).res.status).toBe('rejected');
    expect(run({ question: 42 }).res.status).toBe('rejected');
    expect(run({ explanation: '' }).res.status).toBe('rejected');
  });

  it('updates mascotMessage', () => {
    const { res, screen } = run({ mascotMessage: 'You can do it!' });
    expect(res.status).toBe('ok');
    expect(screen.mascotMessage).toBe('You can do it!');
  });
});

describe('c1 MCQ – options and correctAnswer', () => {
  it('options change without index keeps the SAME index and warns when the correct text changes', () => {
    const { res, screen } = run({ options: ['A calculator', 'An email spam filter', 'A light switch', 'A ruler'] });
    expect(res.status).toBe('ok');
    expect(screen.correctAnswer).toBe('An email spam filter');
    expect(res.warnings.length).toBe(1);
    const d = res.diff.find(x => x.field === 'correctAnswer')!;
    expect(d.sensitive).toBe(true);
  });

  it('options + correctOptionIndex → correctAnswer = options[index]', () => {
    const { screen, res } = run({ options: ['W', 'X', 'Y', 'Z'], correctOptionIndex: 2 });
    expect(screen.options).toEqual(['W', 'X', 'Y', 'Z']);
    expect(screen.correctAnswer).toBe('Y');
    expect(res.warnings).toEqual([]);
  });

  it('correctOptionIndex alone updates correctAnswer text (answer fix)', () => {
    const { screen, res } = run({ correctOptionIndex: 0 });
    expect(screen.correctAnswer).toBe('A calculator');
    expect(res.diff[0]).toMatchObject({ field: 'correctAnswer', before: 'A spam filter', after: 'A calculator', sensitive: true });
  });

  it('rejects an out-of-range / non-integer / non-number index', () => {
    for (const bad of [4, 7, -1, 1.5, '1', null]) {
      expect(run({ correctOptionIndex: bad }).res.status).toBe('rejected');
    }
  });

  it('range is checked against the NEW options', () => {
    expect(run({ options: ['W', 'X', 'Y', 'Z'], correctOptionIndex: 3 }).res.status).toBe('ok');
  });

  it('rejects a different option count', () => {
    expect(run({ options: ['W', 'X', 'Y'] }).res.status).toBe('rejected');
    expect(run({ options: ['W', 'X', 'Y', 'Z', 'Q'] }).res.status).toBe('rejected');
  });

  it('rejects duplicate (case-insensitive), empty, or non-string options', () => {
    expect(run({ options: ['A', 'a', 'B', 'C'] }).res.status).toBe('rejected');
    expect(run({ options: ['A', '', 'B', 'C'] }).res.status).toBe('rejected');
    expect(run({ options: ['A', 2, 'B', 'C'] }).res.status).toBe('rejected');
    expect(run({ options: 'A,B,C,D' }).res.status).toBe('rejected');
  });

  it('rejects options change without index when the current correct option cannot be found', () => {
    const { res } = run({ options: ['W', 'X', 'Y', 'Z'] }, 'scr_mcq_1', 'updateMcq', [
      { id: 'unitA', lessons: [{ id: 'lessonA', challenges: [makeMcq({ correctAnswer: 'something not in options' })] }] },
    ]);
    expect(res.status).toBe('rejected');
    expect(res.errors[0]).toMatch(/correctOptionIndex/);
  });
});

describe('c1 MCQ – sensitive fields', () => {
  it('xpValue: valid change is flagged sensitive; invalid values rejected', () => {
    const ok = run({ xpValue: 20 });
    expect(ok.res.status).toBe('ok');
    expect(ok.screen.xpValue).toBe(20);
    expect(ok.res.diff[0].sensitive).toBe(true);
    for (const bad of [-1, 1001, 2.5, '20', NaN]) expect(run({ xpValue: bad }).res.status).toBe('rejected');
  });

  it('difficulty must keep the type of the current value', () => {
    expect(run({ difficulty: 'hard' }).res.status).toBe('ok');
    expect(run({ difficulty: 3 }).res.status).toBe('rejected');
    expect(run({ difficulty: '' }).res.status).toBe('rejected');
  });
});

describe('c1 MCQ – locked and unknown fields', () => {
  it.each([
    'id', 'type', 'correctAnswer', 'audioNarrations', 'audioUrl', 'explanation_concept',
    'explanation_example', 'explanation_confused', 'explanation_audio_url', 'quoteAuthor', 'contentScreen',
  ])('rejects locked field %s', field => {
    const { res, screen, before } = run({ [field]: 'hack' });
    expect(res.status).toBe('rejected');
    expect(res.errors[0]).toMatch(/locked/);
    expect(screen).toBe(before); // untouched
  });

  it('rejects fields that do not exist on this type (e.g. mediaUrl) and unknown fields', () => {
    expect(run({ mediaUrl: 'https://x' }).res.errors[0]).toMatch(/not editable/);
    expect(run({ foo: 1 }).res.errors[0]).toMatch(/not editable/);
  });

  it('one bad field rejects the whole action (no partial apply)', () => {
    const { res, screen, before } = run({ question: 'Fine?', id: 'new_id' });
    expect(res.status).toBe('rejected');
    expect(screen.question).toBe(before.question);
  });

  it('rejects empty fields', () => {
    expect(run({}).res.errors[0]).toMatch(/No fields/);
  });
});

describe('stale audio marking', () => {
  it('flags ALL existing aliases stale, never touches url/hash/text/voiceId, never creates entries', () => {
    const { res, screen, before } = run({ explanation: 'Changed.' });
    expect(res.staleAudioAliases.sort()).toEqual(['en', 'hinglish', 'marathi']);
    for (const k of ['en', 'marathi', 'hinglish']) {
      expect(screen.audioNarrations[k].status).toBe('stale');
      expect(screen.audioNarrations[k].url).toBe(before.audioNarrations[k].url);
      expect(screen.audioNarrations[k].hash).toBe(before.audioNarrations[k].hash);
      expect(screen.audioNarrations[k].text).toBe(before.audioNarrations[k].text);
    }
    expect(screen.audioNarrations.en.voiceId).toBe('v1');
    expect(Object.keys(screen.audioNarrations)).toEqual(['en', 'marathi', 'hinglish']);
  });

  it('works with long alias names too and ignores screens without audio', () => {
    const { res, screen } = run({ question: 'New?' }, 'scr_mcq_1', 'updateMcq', [
      { id: 'unitA', lessons: [{ id: 'lessonA', challenges: [makeMcq({ audioNarrations: { english: { url: 'u', hash: 'h', status: 'ready' } } }), makeMcq({ id: 'noaudio', audioNarrations: undefined })] }] },
    ]);
    expect(res.staleAudioAliases).toEqual(['english']);
    expect(screen.audioNarrations.english.status).toBe('stale');
    const r2 = run({ question: 'New?' }, 'noaudio', 'updateMcq', [
      { id: 'unitA', lessons: [{ id: 'lessonA', challenges: [makeMcq({ id: 'noaudio', audioNarrations: undefined })] }] },
    ]);
    expect(r2.res.status).toBe('ok');
    expect(r2.res.staleAudioAliases).toEqual([]);
    expect(r2.screen.audioNarrations).toBeUndefined();
  });

  it('does NOT flag stale when no spoken text changed (xpValue only)', () => {
    const { res, screen } = run({ xpValue: 15 });
    expect(res.staleAudioAliases).toEqual([]);
    expect(screen.audioNarrations.en.status).toBe('ready');
  });

  it('spoken fields: question, options, explanation, mascotMessage', () => {
    for (const f of [{ question: 'Q?' }, { options: ['W', 'X', 'Y', 'Z'], correctOptionIndex: 0 }, { explanation: 'E.' }, { mascotMessage: 'M!' }]) {
      expect(run(f).res.staleAudioAliases.length).toBeGreaterThan(0);
    }
    expect(run({ correctOptionIndex: 0 }).res.staleAudioAliases).toEqual([]);
  });
});

describe('c9 True/False', () => {
  const tf = (fields: Record<string, unknown>) => run(fields, 'scr_tf_1', 'updateMcq');

  it('correctOptionIndex flips correctAnswer between "True" and "False"', () => {
    const r = tf({ correctOptionIndex: 1 });
    expect(r.res.status).toBe('ok');
    expect(r.screen.correctAnswer).toBe('False');
    expect(r.screen.options).toEqual(['True', 'False']);
  });

  it('index 2 is out of range', () => {
    expect(tf({ correctOptionIndex: 2 }).res.status).toBe('rejected');
  });

  it('options are locked', () => {
    const r = tf({ options: ['Yes', 'No'] });
    expect(r.res.status).toBe('rejected');
    expect(r.res.errors.join(' ')).toMatch(/locked/);
  });

  it('can edit question + explanation (mirror synced)', () => {
    const r = tf({ question: 'Can AI learn from data?', explanation: 'Yes, from data.' });
    expect(r.res.status).toBe('ok');
    expect(r.screen.explanation).toBe('Yes, from data.');
    expect(r.screen.explanation_concept).toBe('Yes, from data.');
  });

  it('rejects a True/False screen with unexpected options', () => {
    const r = run({ question: 'Q?' }, 'scr_tf_1', 'updateMcq', [
      { id: 'unitA', lessons: [{ id: 'lessonA', challenges: [makeTf({ options: ['Yes', 'No'] })] }] },
    ]);
    expect(r.res.status).toBe('rejected');
  });
});
