import { supabase } from './supabase';
import { Lesson, Challenge } from './curriculumTypes';

export interface LightweightLesson {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  xpReward: number;
  isChallenge?: boolean;
  isChest?: boolean;
  isBonus?: boolean;
  isPuzzle?: boolean;
  isCheckpoint?: boolean;
  isStory?: boolean;
  lane?: 'left' | 'right' | 'center' | string;
  category?: string;
  chest_icon_url?: string;
  chestIconUrl?: string;
  linked_unit_id?: string;
  linkedUnitId?: string;
}

export async function getLessonDetails(lessonId: string): Promise<Lesson | null> {
  const cleanId = lessonId.trim();
  try {
    const res = await fetch(`/api/database/lessons/${encodeURIComponent(cleanId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.lesson) {
        const l = json.lesson;
        return {
          id: l.id,
          moduleId: l.module_id,
          title: l.title,
          description: l.description || '',
          difficulty: l.difficulty || 'Easy',
          xpReward: l.xp_reward ?? 100,
          challenges: Array.isArray(l.challenges) ? l.challenges : [],
          orderIndex: l.order_index ?? 0,
          isChallenge: l.is_challenge || false,
          isBonus: l.is_bonus || false
        } as Lesson;
      }
    }
  } catch (apiErr) {
    // Continue to direct Supabase fallback
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', cleanId)
        .maybeSingle();

      if (data && !error) {
        return {
          id: data.id,
          moduleId: data.module_id,
          title: data.title,
          description: data.description || '',
          difficulty: data.difficulty || 'Easy',
          xpReward: data.xp_reward ?? 100,
          challenges: Array.isArray(data.challenges) ? data.challenges : [],
          orderIndex: data.order_index ?? 0,
          isChallenge: data.is_challenge || false,
          isBonus: data.is_bonus || false
        } as Lesson;
      }
    } catch (dbErr) {
      console.error(`Error fetching lesson details for ${lessonId}:`, dbErr);
    }
  }

  return null;
}

export async function updateLessonProgress(
  userId: string,
  lessonId: string,
  progress: {
    completed: boolean;
    score?: number;
    stars?: number;
    xpEarned?: number;
    cookiesEarned?: number;
    attempts?: number;
  }
) {
  const { data, error } = await supabase
    .from('user_lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      ...progress,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error(`Error updating progress for lesson ${lessonId}:`, error);
    throw error;
  }
  return data;
}

export async function getUserProgress(userId: string) {
  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error(`Error fetching progress for user ${userId}:`, error);
    return [];
  }
  return data;
}
