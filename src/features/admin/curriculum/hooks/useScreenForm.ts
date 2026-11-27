import React, { useState } from 'react';
import { 
  Challenge, 
  ChallengeType, 
  Module, 
  Lesson, 
  saveCurriculumToStorage, 
  saveSingleLesson 
} from '../../../../lib/content';
import { supabase } from '../../../../lib/supabase';
import { ScreenFormStateAndHandlers } from '../types';

export interface UseScreenFormOptions {
  modulesList: Module[];
  practiceModulesList: Module[];
  setModulesList: React.Dispatch<React.SetStateAction<Module[]>>;
  setPracticeModulesList: React.Dispatch<React.SetStateAction<Module[]>>;
  selectedModuleId: string;
  selectedLessonId: string;
  currentUserEmail?: string;
  triggerNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
  triggerConfirm: (title: string, message: string, onConfirm: () => void) => void;
  soundManager: any;
  setRawJsonText?: (text: string) => void;
  setActiveTab?: (tab: string) => void;
  setMobileViewMode?: (mode: 'map' | 'editor') => void;
}

export function useScreenForm({
  modulesList,
  practiceModulesList,
  setModulesList,
  setPracticeModulesList,
  selectedModuleId,
  selectedLessonId,
  currentUserEmail,
  triggerNotification,
  triggerConfirm,
  soundManager,
  setRawJsonText,
  setActiveTab,
  setMobileViewMode
}: UseScreenFormOptions): ScreenFormStateAndHandlers {
  // Core Challenge State
  const [chalId, setChalId] = useState('');
  const [chalType, setChalType] = useState<ChallengeType>('tap_right_answer');
  const [chalQuestion, setChalQuestion] = useState('');
  const [chalExplanation, setChalExplanation] = useState('');
  const [chalExplanationText, setChalExplanationText] = useState('');
  const [chalExplanationAudioUrl, setChalExplanationAudioUrl] = useState('');
  const [chalExplanationAudioDuration, setChalExplanationAudioDuration] = useState<number>(0);
  const [chalExplanationMarathi, setChalExplanationMarathi] = useState('');
  const [chalExplanationMarathiConfused, setChalExplanationMarathiConfused] = useState('');
  const [chalExplanationMarathiConcept, setChalExplanationMarathiConcept] = useState('');
  const [chalExplanationMarathiExample, setChalExplanationMarathiExample] = useState('');
  const [chalExplanationMarathiTakeaway, setChalExplanationMarathiTakeaway] = useState('');
  const [chalExplanationMarathiSpeechScript, setChalExplanationMarathiSpeechScript] = useState('');
  const [explanationAudioUrlMarathi, setExplanationAudioUrlMarathi] = useState('');
  const [explanationAudioDurationMarathi, setExplanationAudioDurationMarathi] = useState<number>(0);
  const [chalPoints, setChalPoints] = useState<number>(10);
  const [chalImage, setChalImage] = useState('');
  const [chalOptions, setChalOptions] = useState<string[]>(['', '', '', '']);
  const [chalCorrectAnswer, setChalCorrectAnswer] = useState('');
  const [chalConceptPairs, setChalConceptPairs] = useState<Array<{ id: string; left: string; right: string }>>([
    { id: 'p1', left: 'AI', right: 'Artificial Intelligence' }
  ]);
  const [chalBucketCategories, setChalBucketCategories] = useState<string[]>(['Category 1', 'Category 2']);
  const [chalBucketItems, setChalBucketItems] = useState<Array<{ id: string; text: string; category: string }>>([
    { id: 'i1', text: 'Item 1', category: 'Category 1' }
  ]);
  const [chalTimelineSteps, setChalTimelineSteps] = useState<Array<{ id: string; text: string; correctOrder: number }>>([
    { id: 's1', text: 'Step 1', correctOrder: 1 },
    { id: 's2', text: 'Step 2', correctOrder: 2 }
  ]);
  const [chalClassifyImages, setChalClassifyImages] = useState<Array<{ id: string; url: string; label: string; isAi: boolean }>>([]);
  const [chalRevealClues, setChalRevealClues] = useState<string[]>(['Clue 1', 'Clue 2']);
  const [chalRevealFinalAnswer, setChalRevealFinalAnswer] = useState('');
  const [chalStoryPanels, setChalStoryPanels] = useState<Array<{ id: string; speaker: string; text: string; avatarUrl?: string }>>([]);
  const [chalArgumentPremises, setChalArgumentPremises] = useState<Array<{ id: string; text: string; isFlawed: boolean }>>([]);
  const [chalCodeSnippet, setChalCodeSnippet] = useState('');
  const [chalCodeLanguage, setChalCodeLanguage] = useState('javascript');
  const [chalVisualAnalogy, setChalVisualAnalogy] = useState<{ conceptA: string; conceptB: string; visualUrl?: string }>({
    conceptA: '',
    conceptB: ''
  });
  const [chalRoleplayCharacter, setChalRoleplayCharacter] = useState<{ name: string; avatar: string; role: string }>({
    name: 'Aibo',
    avatar: '🤖',
    role: 'Guide'
  });
  const [isGeneratingChallengeImage, setIsGeneratingChallengeImage] = useState(false);

  const syncJsonText = (ai: Module[], prac: Module[]) => {
    if (setRawJsonText) {
      setRawJsonText(JSON.stringify({ spaceCurriculum: ai, practiceCurriculum: prac }, null, 2));
    }
  };

  // Build compiled challenge object
  const buildChallengePayload = (): Challenge => {
    const safeTrim = (val?: string | null) => (typeof val === 'string' ? val.trim() : '');
    const cleanQ = safeTrim(chalQuestion);

    const base: any = {
      id: chalId || 'temp_preview_id',
      type: chalType,
      question: (chalType === 'content_screen' || chalType === 'visual_lesson_screen') 
        ? (cleanQ || 'Visual Storytelling') 
        : (cleanQ || 'Which of these processes generates energy?'),
      explanation: {
        text: chalExplanation || 'Aibo says: Perfect observing logic!',
        audioUrl: chalExplanationAudioUrl || '',
        audioDuration: Number(chalExplanationAudioDuration) || 0,
        hinglish: {
          text: chalExplanation || 'Aibo says: Perfect observing logic!',
          audioUrl: chalExplanationAudioUrl || '',
          audioDuration: Number(chalExplanationAudioDuration) || 0
        },
        marathi: {
          text: chalExplanationMarathi || '',
          audioUrl: explanationAudioUrlMarathi || '',
          audioDuration: Number(explanationAudioDurationMarathi) || 0
        }
      },
      xpValue: Number(chalPoints) || 10,
      options: chalOptions.filter(Boolean),
      correctAnswer: chalCorrectAnswer || chalOptions[0] || '',
      imageUrl: chalImage || undefined,
      conceptPairs: chalConceptPairs.length > 0 ? chalConceptPairs : undefined,
      bucketCategories: chalBucketCategories.length > 0 ? chalBucketCategories : undefined,
      bucketItems: chalBucketItems.length > 0 ? chalBucketItems : undefined,
      timelineSteps: chalTimelineSteps.length > 0 ? chalTimelineSteps : undefined,
      classifyImages: chalClassifyImages.length > 0 ? chalClassifyImages : undefined,
      revealClues: chalRevealClues.length > 0 ? chalRevealClues : undefined,
      revealFinalAnswer: chalRevealFinalAnswer || undefined,
      storyPanels: chalStoryPanels.length > 0 ? chalStoryPanels : undefined,
      argumentPremises: chalArgumentPremises.length > 0 ? chalArgumentPremises : undefined,
      codeSnippet: chalCodeSnippet || undefined,
      codeLanguage: chalCodeLanguage || undefined,
      visualAnalogy: chalVisualAnalogy.conceptA ? chalVisualAnalogy : undefined,
      roleplayCharacter: chalRoleplayCharacter.name ? chalRoleplayCharacter : undefined
    };

    return base as Challenge;
  };

  // Select Challenge For Editing
  const selectChallengeForEditing = (modId: string, lesId: string, chal: Challenge) => {
    setChalId(chal.id);
    setChalType(chal.type);
    setChalQuestion(chal.question || '');

    let text = '';
    let audioUrl = '';
    let audioDuration = 0;
    let textMar = '';
    let audioUrlMar = '';
    let audioDurationMar = 0;

    if (chal.explanation) {
      if (typeof chal.explanation === 'object' && chal.explanation !== null) {
        if (chal.explanation.hinglish) {
          text = chal.explanation.hinglish.text || chal.explanation.text || '';
          audioUrl = chal.explanation.hinglish.audioUrl || chal.explanation.audioUrl || '';
          audioDuration = chal.explanation.hinglish.audioDuration || chal.explanation.audioDuration || 0;
        } else {
          text = chal.explanation.text || '';
          audioUrl = chal.explanation.audioUrl || '';
          audioDuration = chal.explanation.audioDuration || 0;
        }

        if (chal.explanation.marathi) {
          textMar = chal.explanation.marathi.text || '';
          audioUrlMar = chal.explanation.marathi.audioUrl || '';
          audioDurationMar = chal.explanation.marathi.audioDuration || 0;
        }
      } else {
        text = chal.explanation as string;
      }
    }

    setChalExplanation(text);
    setChalExplanationAudioUrl(audioUrl);
    setChalExplanationAudioDuration(audioDuration);
    setChalExplanationMarathi(textMar);
    setExplanationAudioUrlMarathi(audioUrlMar);
    setExplanationAudioDurationMarathi(audioDurationMar);
    setChalPoints(chal.xpValue || 10);
    setChalImage(chal.imageUrl || (chal as any).image || '');
    setChalOptions(chal.options && chal.options.length > 0 ? [...chal.options] : ['', '', '', '']);
    setChalCorrectAnswer(chal.correctAnswer || (chal.options && chal.options[0]) || '');

    if ((chal as any).conceptPairs) setChalConceptPairs((chal as any).conceptPairs);
    if ((chal as any).bucketCategories) setChalBucketCategories((chal as any).bucketCategories);
    if ((chal as any).bucketItems) setChalBucketItems((chal as any).bucketItems);
    if ((chal as any).timelineSteps) setChalTimelineSteps((chal as any).timelineSteps);
    if ((chal as any).classifyImages) setChalClassifyImages((chal as any).classifyImages);
    if ((chal as any).revealClues) setChalRevealClues((chal as any).revealClues);
    if ((chal as any).revealFinalAnswer) setChalRevealFinalAnswer((chal as any).revealFinalAnswer);
    if ((chal as any).storyPanels) setChalStoryPanels((chal as any).storyPanels);
    if ((chal as any).argumentPremises) setChalArgumentPremises((chal as any).argumentPremises);
    if ((chal as any).codeSnippet) setChalCodeSnippet((chal as any).codeSnippet);
    if ((chal as any).codeLanguage) setChalCodeLanguage((chal as any).codeLanguage);
    if ((chal as any).visualAnalogy) setChalVisualAnalogy((chal as any).visualAnalogy);
    if ((chal as any).roleplayCharacter) setChalRoleplayCharacter((chal as any).roleplayCharacter);

    if (setActiveTab) setActiveTab('challenges');
    if (setMobileViewMode) setMobileViewMode('editor');
  };

  // Create / Save Challenge Submit Handler
  const handleCreateChallenge = (modId: string, lesId: string) => {
    const finalChallenge = buildChallengePayload();
    if (!finalChallenge.id || finalChallenge.id === 'temp_preview_id') {
      finalChallenge.id = 'scr_' + Date.now().toString().slice(-6);
    }

    const allMods = [...modulesList, ...practiceModulesList];
    const targetMod = allMods.find(m => m.id === modId);
    const targetLes = targetMod?.lessons?.find(l => l.id === lesId);
    if (!targetLes) {
      triggerNotification("Target lesson not found in state!", "error");
      return;
    }

    const exists = (targetLes.challenges || []).some(c => c.id === finalChallenge.id);
    let newChallenges: Challenge[] = [];
    if (exists) {
      newChallenges = (targetLes.challenges || []).map(c => c.id === finalChallenge.id ? finalChallenge : c);
    } else {
      newChallenges = [...(targetLes.challenges || []), finalChallenge];
    }

    const updatedLessonData: Lesson = {
      ...targetLes,
      challenges: newChallenges
    };

    saveSingleLesson(modId, updatedLessonData)
      .then((savedLesson) => {
        const updateTargetLesson = (l: Lesson) => (l.id === lesId ? savedLesson : l);
        const updatedAi = modulesList.map(m => m.id === modId ? { ...m, lessons: m.lessons.map(updateTargetLesson) } : m);
        const updatedPrac = practiceModulesList.map(m => m.id === modId ? { ...m, lessons: m.lessons.map(updateTargetLesson) } : m);

        setModulesList(updatedAi);
        setPracticeModulesList(updatedPrac);
        syncJsonText(updatedAi, updatedPrac);

        triggerNotification(`Successfully saved challenge screen to lesson and database!`, "success");
        soundManager.play('complete');
      })
      .catch((err: any) => {
        console.error("Failed to save screen to lesson:", err);
        triggerNotification("Failed to save screen to database: " + (err?.message || "Unknown error"), "error");
        soundManager.play('incorrect');
      });

    setChalId('');
  };

  // Delete Challenge
  const handleDeleteChallenge = (modId: string, lesId: string, challengeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerConfirm(
      "Delete Screen",
      "Are you sure you want to delete this challenge screen? This action is permanent.",
      async () => {
        const allMods = [...modulesList, ...practiceModulesList];
        const targetMod = allMods.find(m => m.id === modId);
        const targetLes = targetMod?.lessons?.find(l => l.id === lesId);
        if (!targetLes) return;

        const updatedLessonData: Lesson = {
          ...targetLes,
          challenges: (targetLes.challenges || []).filter(c => c.id !== challengeId)
        };

        try {
          const savedLesson = await saveSingleLesson(modId, updatedLessonData);

          const updateTargetLesson = (l: Lesson) => (l.id === lesId ? savedLesson : l);
          const updatedAi = modulesList.map(m => m.id === modId ? { ...m, lessons: m.lessons.map(updateTargetLesson) } : m);
          const updatedPrac = practiceModulesList.map(m => m.id === modId ? { ...m, lessons: m.lessons.map(updateTargetLesson) } : m);

          setModulesList(updatedAi);
          setPracticeModulesList(updatedPrac);
          syncJsonText(updatedAi, updatedPrac);

          if (chalId === challengeId) {
            setChalId('');
            setChalQuestion('');
            setChalExplanation('');
          }

          triggerNotification("Challenge screen removed and database updated!", "success");
          soundManager.play('incorrect');
        } catch (err: any) {
          console.error("Failed to delete screen:", err);
          triggerNotification("Failed to delete screen from database: " + (err?.message || "Unknown error"), "error");
        }
      }
    );
  };

  // Save Challenge Edits (wrapper for handleCreateChallenge)
  const handleSaveChallengeEdits = (modId: string, lesId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleCreateChallenge(modId, lesId);
  };

  // Reorder Challenge
  const reorderChallenge = (modId: string, lesId: string, challengeId: string, direction: 'up' | 'down', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updatedAi = [...modulesList];
    let updatedPrac = [...practiceModulesList];
    let found = false;

    const processList = (list: Module[]) => {
      return list.map(m => {
        if (m.id === modId) {
          return {
            ...m,
            lessons: m.lessons.map(l => {
              if (l.id === lesId) {
                found = true;
                const chalList = [...l.challenges];
                const idx = chalList.findIndex(c => c.id === challengeId);
                if (idx !== -1) {
                  const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
                  if (nextIdx >= 0 && nextIdx < chalList.length) {
                    const temp = chalList[idx];
                    chalList[idx] = chalList[nextIdx];
                    chalList[nextIdx] = temp;
                  }
                }
                return { ...l, challenges: chalList };
              }
              return l;
            })
          };
        }
        return m;
      });
    };

    updatedAi = processList(updatedAi);
    if (!found) {
      updatedPrac = processList(updatedPrac);
    }

    setModulesList(updatedAi);
    setPracticeModulesList(updatedPrac);
    saveCurriculumToStorage(updatedAi, updatedPrac);
    syncJsonText(updatedAi, updatedPrac);
    triggerNotification("Screen successfully reordered!", "success");
    soundManager.play('complete');
  };

  // Create Interactive Challenge
  const createInteractiveChallenge = (modId: string, lesId: string, baseType: ChallengeType = 'tap_right_answer') => {
    const baseChallenge: Challenge = {
      id: 'scr_' + Date.now().toString().slice(-6),
      type: baseType,
      question: 'New Question Stem',
      explanation: {
        text: 'Aibo says: Perfect observing logic!',
        audioUrl: '',
        audioDuration: 0,
        hinglish: { text: 'Aibo says: Perfect observing logic!', audioUrl: '', audioDuration: 0 },
        marathi: { text: '', audioUrl: '', audioDuration: 0 }
      },
      xpValue: 10,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A'
    };

    const updateLessons = (lessons: Lesson[]) => lessons.map(l => {
      if (l.id === lesId) {
        return { ...l, challenges: [...l.challenges, baseChallenge] };
      }
      return l;
    });

    const updatedAi = modulesList.map(m => m.id === modId ? { ...m, lessons: updateLessons(m.lessons) } : m);
    const updatedPrac = practiceModulesList.map(m => m.id === modId ? { ...m, lessons: updateLessons(m.lessons) } : m);

    setModulesList(updatedAi);
    setPracticeModulesList(updatedPrac);
    saveCurriculumToStorage(updatedAi, updatedPrac);
    syncJsonText(updatedAi, updatedPrac);

    selectChallengeForEditing(modId, lesId, baseChallenge);
    triggerNotification("Interactive screen created and loaded for live editing!", "success");
    soundManager.play('complete');
  };

  // Generate Challenge Image
  const handleGenerateChallengeImage = async () => {
    if (!selectedLessonId || !chalId) {
      alert("Please select a lesson screen first.");
      return;
    }

    setIsGeneratingChallengeImage(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (supabase) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.access_token) {
            headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
          }
        } catch (_) {}
      }
      if (currentUserEmail) {
        headers["x-admin-email"] = currentUserEmail;
      }

      const response = await fetch("/api/generate-lesson-image", {
        method: "POST",
        headers,
        body: JSON.stringify({
          lessonId: selectedLessonId,
          screenId: chalId,
          contentBody: chalQuestion,
          adminEmail: currentUserEmail
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate image.");
      }

      setChalImage(data.mediaUrl);
      triggerNotification("✨ Image successfully generated and applied!", "success");
      soundManager.play('complete');
    } catch (err: any) {
      console.error("Image generation error:", err);
      triggerNotification("Failed to generate image: " + err.message, "error");
    } finally {
      setIsGeneratingChallengeImage(false);
    }
  };

  return {
    chalId,
    setChalId,
    chalType,
    setChalType,
    chalQuestion,
    setChalQuestion,
    chalExplanation,
    setChalExplanation,
    chalExplanationText,
    setChalExplanationText,
    chalExplanationAudioUrl,
    setChalExplanationAudioUrl,
    chalExplanationAudioDuration,
    setChalExplanationAudioDuration,
    chalExplanationMarathi,
    setChalExplanationMarathi,
    chalExplanationMarathiConfused,
    setChalExplanationMarathiConfused,
    chalExplanationMarathiConcept,
    setChalExplanationMarathiConcept,
    chalExplanationMarathiExample,
    setChalExplanationMarathiExample,
    chalExplanationMarathiTakeaway,
    setChalExplanationMarathiTakeaway,
    chalExplanationMarathiSpeechScript,
    setChalExplanationMarathiSpeechScript,
    explanationAudioUrlMarathi,
    setExplanationAudioUrlMarathi,
    explanationAudioDurationMarathi,
    setExplanationAudioDurationMarathi,
    chalPoints,
    setChalPoints,
    chalImage,
    setChalImage,
    chalOptions,
    setChalOptions,
    chalCorrectAnswer,
    setChalCorrectAnswer,
    chalConceptPairs,
    setChalConceptPairs,
    chalBucketCategories,
    setChalBucketCategories,
    chalBucketItems,
    setChalBucketItems,
    chalTimelineSteps,
    setChalTimelineSteps,
    chalClassifyImages,
    setChalClassifyImages,
    chalRevealClues,
    setChalRevealClues,
    chalRevealFinalAnswer,
    setChalRevealFinalAnswer,
    chalStoryPanels,
    setChalStoryPanels,
    chalArgumentPremises,
    setChalArgumentPremises,
    chalCodeSnippet,
    setChalCodeSnippet,
    chalCodeLanguage,
    setChalCodeLanguage,
    chalVisualAnalogy,
    setChalVisualAnalogy,
    chalRoleplayCharacter,
    setChalRoleplayCharacter,
    isGeneratingChallengeImage,
    selectChallengeForEditing,
    handleCreateChallenge,
    handleDeleteChallenge,
    handleSaveChallengeEdits,
    reorderChallenge,
    createInteractiveChallenge,
    handleGenerateChallengeImage,
    buildChallengePayload
  };
}
