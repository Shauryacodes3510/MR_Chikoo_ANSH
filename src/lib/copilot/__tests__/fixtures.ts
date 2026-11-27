import type { CopilotAction, ModuleLike } from '../types';

export const deepFreeze = <T>(obj: T): T => {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    Object.values(obj as any).forEach(deepFreeze);
  }
  return obj;
};

/** A realistic c1 MCQ screen (shapes observed in production, see docs/copilot-v1-notes.md). */
export const makeMcq = (over: Record<string, any> = {}) => ({
  id: 'scr_mcq_1',
  type: 'c1_multiple_choice',
  question: 'Which example uses AI?',
  options: ['A calculator', 'A spam filter', 'A light switch', 'A ruler'],
  correctAnswer: 'A spam filter',
  explanation: { text: 'A spam filter learns from examples.', audioUrl: 'https://cdn/x/exp.mp3', audioDuration: 7 },
  explanation_concept: 'A spam filter learns from examples.',
  explanation_takeaway: 'A spam filter learns from examples.',
  explanation_speech_script: 'A spam filter learns from examples.',
  explanation_example: 'Gmail moves junk mail away.',
  explanation_confused: 'A calculator only follows fixed rules.',
  explanation_audio_url: 'https://cdn/x/explain.mp3',
  mascotMessage: 'Think about learning!',
  xpValue: 10,
  difficulty: 'easy',
  continueText: 'Continue',
  audioNarrations: {
    en: { url: 'https://cdn/en.mp3', hash: 'h_en', text: 'Which example uses AI?', status: 'ready', voiceId: 'v1' },
    marathi: { url: 'https://cdn/mr.mp3', hash: 'h_mr', text: 'कोणते उदाहरण AI वापरते?', status: 'ready' },
    hinglish: { url: 'https://cdn/hi.mp3', hash: 'h_hi', text: 'Kaun sa example AI use karta hai?', status: 'ready' },
  },
  ...over,
});

export const makeTf = (over: Record<string, any> = {}) => ({
  id: 'scr_tf_1',
  type: 'c9_true_false',
  question: 'AI can learn from examples.',
  options: ['True', 'False'],
  correctAnswer: 'True',
  explanation: 'Machine learning learns from data.',
  explanation_concept: 'Machine learning learns from data.',
  xpValue: 5,
  difficulty: 'easy',
  ...over,
});

export const makeContent = () => ({
  id: 'scr_content_1',
  type: 'content_screen',
  contentScreen: { heading: 'Hello', contentBody: 'Body' },
});

/** Two units. Unit A has lessonA (mcq, tf, content) and lessonB; unit B has lessonC. */
export const makeModules = (): ModuleLike[] => [
  {
    id: 'unitA',
    lessons: [
      { id: 'lessonA', challenges: [makeMcq(), makeTf(), makeContent()] },
      { id: 'lessonB', challenges: [makeMcq({ id: 'scr_mcq_other' })] },
    ],
  },
  {
    id: 'unitB',
    lessons: [{ id: 'lessonC', challenges: [makeMcq({ id: 'scr_mcq_c' })] }],
  },
];

export const act = (fields: Record<string, unknown>, over: Partial<CopilotAction> = {}): CopilotAction => ({
  action: 'updateMcq',
  lessonId: 'lessonA',
  screenId: 'scr_mcq_1',
  fields,
  ...over,
});

export const getScreen = (modules: ModuleLike[], lessonId: string, screenId: string): any => {
  for (const m of modules) for (const l of m.lessons || []) {
    if (l.id === lessonId) return (l.challenges || []).find(c => c.id === screenId);
  }
};
