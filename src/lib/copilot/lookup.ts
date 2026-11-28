/** AI Copilot v1 – small pure helpers used by the Wave 3 UI. */
import type { ModuleLike, ScreenLike } from './types';

export interface ScreenLocation {
  moduleId: string;
  moduleTitle?: string;
  lessonId: string;
  lessonTitle?: string;
  screen: ScreenLike;
  /** 0-based position of the screen inside its lesson. */
  index: number;
}

export const locateScreen = (lists: ModuleLike[][], lessonId: string, screenId: string): ScreenLocation | null => {
  for (const list of lists)
    for (const m of list)
      for (const l of m.lessons || []) {
        if (l.id !== lessonId) continue;
        const index = (l.challenges || []).findIndex(c => c.id === screenId);
        if (index >= 0) {
          return { moduleId: m.id, moduleTitle: m.title ?? m.name, lessonId, lessonTitle: l.title, screen: l.challenges![index], index };
        }
      }
  return null;
};

/** Screens that have at least one narration entry flagged status:"stale". */
export const listStaleAudioScreens = (lists: ModuleLike[][]): { lessonId: string; screenId: string }[] => {
  const out: { lessonId: string; screenId: string }[] = [];
  for (const list of lists)
    for (const m of list)
      for (const l of m.lessons || [])
        for (const c of l.challenges || []) {
          const n = c.audioNarrations;
          if (n && typeof n === 'object' && Object.values(n).some((e: any) => e && e.status === 'stale')) {
            out.push({ lessonId: l.id, screenId: c.id });
          }
        }
  return out;
};

export const countStaleAudioScreens = (lists: ModuleLike[][]): number => listStaleAudioScreens(lists).length;
