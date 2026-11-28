import { describe, it, expect } from 'vitest';
import type { LlmAdapter, LlmRequest } from '../server/llm';
import { runAsk, runAction, runAudit, runChat, CopilotInputError, AUDIT_MAX_SCREENS } from '../server/service';
import { toAiScreenView, resolveScope } from '../server/context';
import { deepFreeze, makeMcq, makeModules } from './fixtures';

const fake = (replies: string[]) => {
  const calls: LlmRequest[] = [];
  const llm: LlmAdapter = { async generate(r) { calls.push(r); return replies[Math.min(calls.length - 1, replies.length - 1)]; } };
  return { llm, calls };
};
const lessonScope = { kind: 'lesson', lessonId: 'lessonA' };
const act = (fields: object, over: object = {}) =>
  JSON.stringify({ actions: [{ action: 'updateMcq', lessonId: 'lessonA', screenId: 'scr_mcq_1', fields, ...over }] });

describe('context (what the LLM sees)', () => {
  it('hides audio, mirrors and correctAnswer; shows correctOptionIndex', () => {
    const v = JSON.stringify(toAiScreenView(makeMcq()));
    expect(v).not.toMatch(/audio|cdn\/|hash|explanation_|correctAnswer/i);
    expect(JSON.parse(v).correctOptionIndex).toBe(1);
    expect(JSON.parse(v).explanation).toBe('A spam filter learns from examples.');
  });
  it('other screen types expose real fields (options, answer) but never audio/mirrors', () => {
    const v = toAiScreenView({
      id: 'x', type: 'c2_fill_in_blank', sentence: 'AI ___ data', options: ['learns', 'sleeps'], correctAnswer: 'learns',
      audioNarrations: { en: { url: 'https://cdn/a.mp3', hash: 'h' } }, explanation_audio_url: 'https://cdn/e.mp3',
      explanation_concept: 'dup', explanation: { text: 'Why', audioUrl: 'https://cdn/z.mp3' },
    } as any);
    expect(v.options).toEqual(['learns', 'sleeps']);
    expect(v.correctAnswer).toBe('learns');
    expect(v.editable).toBe(false);
    expect(JSON.stringify(v)).not.toMatch(/cdn\/|hash|audioNarrations|explanation_concept/);
  });
  it('MCQ whose answer is not an option text still shows the raw answer', () => {
    const v: any = toAiScreenView(makeMcq({ correctAnswer: { id: 'b' } }));
    expect(v.correctOptionIndex).toBeNull();
    expect(v.rawCorrectAnswer).toEqual({ id: 'b' });
  });
  it('scope filters to the selection only', () => {
    const r = resolveScope(makeModules(), { kind: 'screen', lessonId: 'lessonA', screenId: 'scr_tf_1' });
    expect(r.modules![0].lessons![0].challenges!.map(c => c.id)).toEqual(['scr_tf_1']);
    expect(resolveScope(makeModules(), { kind: 'lesson', lessonId: 'nope' }).error).toBeTruthy();
  });
});

describe('ask', () => {
  it('returns text only, never actions, and sends no audio urls', async () => {
    const { llm, calls } = fake(['It is about spam filters.']);
    const r = await runAsk(llm, { modules: makeModules(), scope: lessonScope, question: 'What is this?' });
    expect(r).toEqual({ answer: 'It is about spam filters.' });
    expect(calls[0].json).toBeFalsy();
    expect(calls[0].user).not.toMatch(/cdn\//);
  });
  it('rejects empty/too long question and bad scope', async () => {
    const { llm } = fake(['x']);
    await expect(runAsk(llm, { modules: makeModules(), scope: lessonScope, question: '  ' })).rejects.toThrow(CopilotInputError);
    await expect(runAsk(llm, { modules: makeModules(), scope: lessonScope, question: 'a'.repeat(2001) })).rejects.toThrow(CopilotInputError);
    await expect(runAsk(llm, { modules: makeModules(), scope: { kind: 'x' }, question: 'hi' })).rejects.toThrow(CopilotInputError);
  });
});

describe('action', () => {
  it('valid proposal -> diff, input untouched, nothing saved', async () => {
    const modules = deepFreeze(makeModules());
    const { llm } = fake([act({ correctOptionIndex: 0 })]);
    const r = await runAction(llm, { modules, scope: lessonScope, instruction: 'fix answer' });
    expect(r.results[0].status).toBe('ok');
    expect(r.results[0].diff.some(d => d.field === 'correctAnswer' && d.sensitive)).toBe(true);
    expect(r.retried).toBe(false);
  });
  it('retries once on invalid JSON, then succeeds', async () => {
    const { llm, calls } = fake(['not json', act({ question: 'Which one uses AI?' })]);
    const r = await runAction(llm, { modules: makeModules(), scope: lessonScope, instruction: 'reword' });
    expect(calls.length).toBe(2);
    expect(calls[1].user).toMatch(/previous answer was invalid/);
    expect(r.retried).toBe(true);
    expect(r.results[0].status).toBe('ok');
  });
  it('gives up after one retry (2 calls max)', async () => {
    const { llm, calls } = fake(['bad', 'still bad']);
    const r = await runAction(llm, { modules: makeModules(), scope: lessonScope, instruction: 'x' });
    expect(calls.length).toBe(2);
    expect(r.actions).toEqual([]);
    expect(r.errors.length).toBeGreaterThan(0);
  });
  it('out-of-scope, locked field, bad index and unknown action are rejected by code', async () => {
    const payload = JSON.stringify({ actions: [
      { action: 'updateMcq', lessonId: 'lessonB', screenId: 'scr_mcq_other', fields: { question: 'x' } },
      { action: 'updateMcq', lessonId: 'lessonA', screenId: 'scr_mcq_1', fields: { audioNarrations: {} } },
      { action: 'updateMcq', lessonId: 'lessonA', screenId: 'scr_mcq_1', fields: { correctOptionIndex: 9 } },
      { action: 'deleteScreen', lessonId: 'lessonA', screenId: 'scr_mcq_1', fields: {} },
    ] });
    const r = await runAction(fake([payload]).llm, { modules: makeModules(), scope: lessonScope, instruction: 'x' });
    expect(r.results.map(x => x.status)).toEqual(['rejected', 'rejected', 'rejected', 'rejected']);
  });
  it('passes the optional message through', async () => {
    const r = await runAction(fake([JSON.stringify({ actions: [], message: 'Nothing to change.' })]).llm, { modules: makeModules(), scope: lessonScope, instruction: 'x' });
    expect(r.message).toBe('Nothing to change.');
  });
});

describe('audit', () => {
  const planted = () => {
    const m = makeModules();
    m[0].lessons![0].challenges![0] = makeMcq({ correctAnswer: 'A ruler' }); // wrong answer planted
    return m;
  };
  it('finds the planted error and the Fix is a validated action', async () => {
    const reply = JSON.stringify({ findings: [{ lessonId: 'lessonA', screenId: 'scr_mcq_1', severity: 'error', problem: 'Wrong answer', why: 'A ruler is not AI', fix: { fields: { correctOptionIndex: 1 } } }] });
    const r = await runAudit(fake([reply]).llm, { modules: planted(), scope: lessonScope });
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0].fixAction?.fields).toEqual({ correctOptionIndex: 1 });
    expect(r.findings[0].fixResult?.status).toBe('ok');
    expect(r.skippedUnsupported).toBe(1); // content_screen
  });
  it('drops hallucinated ids and keeps invalid fixes as finding without fix', async () => {
    const reply = JSON.stringify({ findings: [
      { lessonId: 'lessonA', screenId: 'ghost', problem: 'x', why: 'y' },
      { lessonId: 'lessonA', screenId: 'scr_mcq_1', problem: 'p', why: 'w', fix: { fields: { correctOptionIndex: 99 } } },
    ] });
    const r = await runAudit(fake([reply]).llm, { modules: makeModules(), scope: lessonScope });
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0].fixAction).toBeUndefined();
    expect(r.findings[0].fixError).toMatch(/rejected/);
  });
  it('invalid AI answer becomes a batch error, not a crash', async () => {
    const r = await runAudit(fake(['garbage']).llm, { modules: makeModules(), scope: lessonScope });
    expect(r.findings).toEqual([]);
    expect(r.batchErrors).toHaveLength(1);
  });
  it('refuses huge audits', async () => {
    const many = [{ id: 'u', lessons: [{ id: 'L', challenges: Array.from({ length: AUDIT_MAX_SCREENS + 1 }, (_, i) => makeMcq({ id: `s${i}` })) }] }];
    await expect(runAudit(fake(['{}']).llm, { modules: many, scope: { kind: 'unit', unitId: 'u' } })).rejects.toThrow(/Too many/);
  });
});

describe('unified chat', () => {
  it('handles general questions with ask intent', async () => {
    const reply = JSON.stringify({ intent: 'ask', reply: 'This lesson explains machine learning.' });
    const { llm } = fake([reply]);
    const r = await runChat(llm, { modules: makeModules(), scope: lessonScope, message: 'What is this lesson?' });
    expect(r.intent).toBe('ask');
    expect(r.reply).toBe('This lesson explains machine learning.');
  });

  it('handles edit instructions with action intent and returns validated results', async () => {
    const reply = JSON.stringify({
      intent: 'action',
      reply: 'Changed option index.',
      actions: [{ action: 'updateMcq', lessonId: 'lessonA', screenId: 'scr_mcq_1', fields: { correctOptionIndex: 0 } }],
    });
    const { llm } = fake([reply]);
    const r = await runChat(llm, { modules: makeModules(), scope: lessonScope, message: 'Make option 1 correct' });
    expect(r.intent).toBe('action');
    expect(r.actions).toHaveLength(1);
    expect(r.results![0].status).toBe('ok');
    expect(r.results![0].diff.some(d => d.field === 'correctAnswer')).toBe(true);
  });

  it('triggers audit scan directly when audit keywords are in message', async () => {
    const auditReply = JSON.stringify({ findings: [] });
    const { llm } = fake([auditReply]);
    const r = await runChat(llm, { modules: makeModules(), scope: lessonScope, message: 'audit this lesson please' });
    expect(r.intent).toBe('audit');
    expect(r.findings).toEqual([]);
    expect(r.scanned).toBe(2);
  });
});
