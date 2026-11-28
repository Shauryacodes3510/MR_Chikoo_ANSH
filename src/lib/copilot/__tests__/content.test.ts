import { describe, it, expect } from 'vitest';
import { contentHandler } from '../handlers/content';
import { deepFreeze } from './fixtures';

describe('contentHandler (content_screen / visual_lesson_screen)', () => {
  const baseScreen = () => ({
    id: 'scr_cs_1',
    type: 'content_screen',
    heading: 'Welcome to AI',
    subheading: 'A gentle intro',
    contentBody: 'AI is when computers learn from data.',
    badge: 'Introduction',
    quote: 'Learning is fun.',
    mascotMessage: 'Ready to learn?',
    contentScreen: {
      heading: 'Welcome to AI',
      subheading: 'A gentle intro',
      contentBody: 'AI is when computers learn from data.',
    },
    visualLessonScreen: {
      heading: 'Welcome to AI',
    },
    explanation: 'AI is when computers learn from data.',
    explanation_concept: 'AI is when computers learn from data.',
  });

  it('updates heading and contentBody, writing mirrors and flagging audio stale', () => {
    const screen = deepFreeze(baseScreen());
    const r = contentHandler.plan(screen, {
      heading: 'Intro to Artificial Intelligence',
      contentBody: 'Smart machines learn from examples.',
    });
    expect(r.errors).toEqual([]);
    expect(r.spokenTextChanged).toBe(true);
    expect(r.diff).toHaveLength(2);
    expect(r.next?.heading).toBe('Intro to Artificial Intelligence');
    expect(r.next?.contentBody).toBe('Smart machines learn from examples.');
    // Mirrors written
    expect(r.next?.contentScreen?.heading).toBe('Intro to Artificial Intelligence');
    expect(r.next?.visualLessonScreen?.heading).toBe('Intro to Artificial Intelligence');
    expect(r.next?.explanation).toBe('Smart machines learn from examples.');
    expect(r.next?.explanation_concept).toBe('Smart machines learn from examples.');
  });

  it('rejects locked fields like quoteAuthor and audio fields', () => {
    const screen = baseScreen();
    const r = contentHandler.plan(screen, { quoteAuthor: 'Famous Author' });
    expect(r.errors).toContain('Field "quoteAuthor" is locked and cannot be edited by the AI.');
  });

  it('rejects unchanged payload', () => {
    const screen = baseScreen();
    const r = contentHandler.plan(screen, { heading: 'Welcome to AI' });
    expect(r.errors).toContain('The proposed changes are identical to the current screen.');
  });
});
