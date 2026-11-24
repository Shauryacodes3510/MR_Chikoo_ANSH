import { createContext, useContext, useState, ReactNode } from 'react';
import { Lesson } from '../../../lib/content';

interface LessonContextType {
  activeLesson: Lesson | null;
  setActiveLesson: (lesson: Lesson | null) => void;
  activeStudyLesson: { id: string; title: string; description: string } | null;
  setActiveStudyLesson: (lesson: { id: string; title: string; description: string } | null) => void;
}

const LessonContext = createContext<LessonContextType | undefined>(undefined);

export function LessonProvider({ children }: { children: ReactNode }) {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeStudyLesson, setActiveStudyLesson] = useState<{ id: string; title: string; description: string } | null>(null);

  return (
    <LessonContext.Provider value={{ activeLesson, setActiveLesson, activeStudyLesson, setActiveStudyLesson }}>
      {children}
    </LessonContext.Provider>
  );
}

export function useLessonContext() {
  const context = useContext(LessonContext);
  if (context === undefined) {
    throw new Error('useLessonContext must be used within a LessonProvider');
  }
  return context;
}
