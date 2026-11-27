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
  setActiveTab?: (tab: any) => void;
  setMobileViewMode?: (mode: 'map' | 'editor') => void;
  chalId?: string;
  setChalId?: (id: string) => void;
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
  setMobileViewMode,
  chalId: propChalId,
  setChalId: propSetChalId,
}: UseScreenFormOptions): ScreenFormStateAndHandlers {
  // Core Challenge State
  const [internalChalId, setInternalChalId] = useState('');
  const chalId = propChalId !== undefined ? propChalId : internalChalId;
  const setChalId = propSetChalId !== undefined ? propSetChalId : setInternalChalId;
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

  // Extended challenge form states from AdminPanel
  const [chalMcqOptions, setChalMcqOptions] = useState<string[]>(['', '', '', '']);
  const [chalMcqCorrect, setChalMcqCorrect] = useState<string>('');
  const [chalFillBlankOptions, setChalFillBlankOptions] = useState<string[]>(['', '', '', '']);
  const [chalFillBlankCorrect, setChalFillBlankCorrect] = useState<string>('');
  const [chalAiTextClue, setChalAiTextClue] = useState('');
  const [chalAiCardATitle, setChalAiCardATitle] = useState('Card A: Theory');
  const [chalAiCardAText, setChalAiCardAText] = useState('');
  const [chalAiCardBTitle, setChalAiCardBTitle] = useState('Card B: True Science');
  const [chalAiCardBText, setChalAiCardBText] = useState('');
  const [chalAiCorrectCard, setChalAiCorrectCard] = useState<string>('opt_ai');
  const [chalSpotText1, setChalSpotText1] = useState('');
  const [chalSpotIsReal1, setChalSpotIsReal1] = useState(true);
  const [chalSpotExpl1, setChalSpotExpl1] = useState('');
  const [chalSpotText2, setChalSpotText2] = useState('');
  const [chalSpotIsReal2, setChalSpotIsReal2] = useState(false);
  const [chalSpotExpl2, setChalSpotExpl2] = useState('');
  const [chalDragBucket1, setChalDragBucket1] = useState('🪐 Space');
  const [chalDragBucket2, setChalDragBucket2] = useState('🌿 Earth');
  const [chalDragItem1Text, setChalDragItem1Text] = useState('Evaporating comets');
  const [chalDragItem1Bucket, setChalDragItem1Bucket] = useState('bucket1');
  const [chalDragItem2Text, setChalDragItem2Text] = useState('Green leaves kitchens');
  const [chalDragItem2Bucket, setChalDragItem2Bucket] = useState('bucket2');
  const [chalPairLeft1, setChalPairLeft1] = useState('');
  const [chalPairRight1, setChalPairRight1] = useState('');
  const [chalPairLeft2, setChalPairLeft2] = useState('');
  const [chalPairRight2, setChalPairRight2] = useState('');
  const [chalSortStep1, setChalSortStep1] = useState('');
  const [chalSortStep2, setChalSortStep2] = useState('');
  const [chalSortStep3, setChalSortStep3] = useState('');
  const [chalSortStep4, setChalSortStep4] = useState('');
  const [chalSentenceTarget, setChalSentenceTarget] = useState('');
  const [chalChipsValue, setChalChipsValue] = useState('');
  const [chalChipsDistractors, setChalChipsDistractors] = useState('');
  const [chalImageUrl, setChalImageUrl] = useState('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop');
  const [chalHint, setChalHint] = useState('');
  const [chalDifficulty, setChalDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [chalContinueText, setChalContinueText] = useState('Continue');
  const [chalMascotMessage, setChalMascotMessage] = useState('');
  const [chalBucketSortItems, setChalBucketSortItems] = useState<any[]>([{ id: 'i1', text: 'Data', correct_bucket: 'b1' }]);
  const [chalAudioUrl, setChalAudioUrl] = useState('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
  const [chalSwipeLeftLabel, setChalSwipeLeftLabel] = useState('Left option');
  const [chalSwipeRightLabel, setChalSwipeRightLabel] = useState('Right option');
  const [chalImgClassifyItems, setChalImgClassifyItems] = useState<any[]>([
    { id: 'img1', text: 'Item 1', imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150', correct_bucket: 'b1' }
  ]);
  const [chalC12Hotspots, setChalC12Hotspots] = useState<any[]>([
    { id: 'h1', label: 'Spot A', x: 25, y: 35, correct_bucket: 'chip1' }
  ]);
  const [chalC12Chips, setChalC12Chips] = useState<any[]>([
    { id: 'chip1', text: 'Sensor' }
  ]);
  const [chalC13Hotspots, setChalC13Hotspots] = useState<any[]>([
    { id: 'hs1', isCorrectSpot: true, x: 50, y: 50, description: 'Engine' }
  ]);
  const [chalC14Cards, setChalC14Cards] = useState<any[]>([
    { id: 'card1', front: 'Term A', back: 'Definition A' }
  ]);
  const [chalC15Steps, setChalC15Steps] = useState<any[]>([
    { id: 'p1', text: 'Step 1' },
    { id: 'p2', text: 'Step 2 (Missing)', isMissing: true }
  ]);
  const [chalC16Options, setChalC16Options] = useState<any[]>([
    { id: 'o1', text: 'Option A (Correct)', isCorrect: true },
    { id: 'o2', text: 'Option B (Wrong)', isCorrect: false }
  ]);
  const [chalC17Items, setChalC17Items] = useState<any[]>([
    { id: 'img1', imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150', caption: 'Step 1' }
  ]);
  const [chalC8Images, setChalC8Images] = useState<string[]>(['', '', '', '']);
  const [contentSceneType, setContentSceneType] = useState<string>('hero');
  const [contentMediaType, setContentMediaType] = useState<'image' | 'gif' | 'video'>('image');
  const [contentMediaUrl, setContentMediaUrl] = useState('');
  const [contentBadge, setContentBadge] = useState('');
  const [contentHeading, setContentHeading] = useState('');
  const [contentSubheading, setContentSubheading] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [contentHighlightBox, setContentHighlightBox] = useState('');
  const [contentQuote, setContentQuote] = useState('');
  const [contentQuoteAuthor, setContentQuoteAuthor] = useState('');
  const [contentBottomMessage, setContentBottomMessage] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenerationError, setImageGenerationError] = useState<string | null>(null);
  const [imageGenerationSuccess, setImageGenerationSuccess] = useState<boolean>(false);
  const [generationAspectRatio, setGenerationAspectRatio] = useState<string>('4:3');
  const [chalXpValue, setChalXpValue] = useState<number>(10);
  const [chalExplanationConfused, setChalExplanationConfused] = useState('');
  const [chalExplanationConcept, setChalExplanationConcept] = useState('');
  const [chalExplanationExample, setChalExplanationExample] = useState('');
  const [chalExplanationTakeaway, setChalExplanationTakeaway] = useState('');
  const [chalExplanationSpeechScript, setChalExplanationSpeechScript] = useState('');
  const [explanationAudioUrl, setExplanationAudioUrl] = useState('');
  const [explanationAudioDuration, setExplanationAudioDuration] = useState(0);

  const syncJsonText = (ai: Module[], prac: Module[]) => {
    if (setRawJsonText) {
      setRawJsonText(JSON.stringify({ spaceCurriculum: ai, practiceCurriculum: prac }, null, 2));
    }
  };

  // Build compiled challenge object
  // Build compiled challenge object
  const buildChallengePayload = (): Challenge => {
    const safeTrim = (val?: string | null) => (typeof val === 'string' ? val.trim() : '');
    const cleanQ = safeTrim(chalQuestion);

    const filteredMcq = chalMcqOptions.map(o => o.trim()).filter(Boolean);
    const filteredFillBlank = chalFillBlankOptions.map(o => o.trim()).filter(Boolean);

    let finalOptions = chalOptions.filter(Boolean);
    let finalCorrect = chalCorrectAnswer || chalOptions[0] || '';

    if (
      chalType === 'tap_right_answer' ||
      chalType === 'image_reveal' ||
      chalType === 'c1_multiple_choice' ||
      chalType === 'c8_tap_correct_object' ||
      chalType === 'c18_audio_quiz' ||
      chalType === 'c15_drag_complete_diagram'
    ) {
      finalOptions = filteredMcq.length > 0 ? filteredMcq : ['Option A', 'Option B', 'Option C', 'Option D'];
      finalCorrect = chalMcqCorrect.trim() || finalOptions[0];
    } else if (chalType === 'fill_in_blank' || chalType === 'c2_fill_in_blank') {
      finalOptions = filteredFillBlank.length > 0 ? filteredFillBlank : ['Option A', 'Option B'];
      finalCorrect = chalFillBlankCorrect.trim() || finalOptions[0];
    }

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
      options: finalOptions,
      correctAnswer: finalCorrect,
      imageUrl: chalImageUrl || chalImage || undefined,
      hint: chalHint || undefined,
      difficulty: chalDifficulty || undefined,
      continueText: chalContinueText || undefined,
      mascotMessage: chalMascotMessage || undefined,
      explanation_confused: chalExplanationConfused.trim() || undefined,
      explanation_concept: chalExplanationConcept.trim() || undefined,
      explanation_example: chalExplanationExample.trim() || undefined,
      explanation_takeaway: chalExplanationTakeaway.trim() || undefined,
      explanation_speech_script: chalExplanationSpeechScript.trim() || undefined,
      explanation_audio_url: explanationAudioUrl || undefined,
      explanation_audio_duration: Number(explanationAudioDuration) || undefined,
      explanation_marathi: chalExplanationMarathi.trim() || undefined,
      explanation_marathi_confused: chalExplanationMarathiConfused.trim() || undefined,
      explanation_marathi_concept: chalExplanationMarathiConcept.trim() || undefined,
      explanation_marathi_example: chalExplanationMarathiExample.trim() || undefined,
      explanation_marathi_takeaway: chalExplanationMarathiTakeaway.trim() || undefined,
      explanation_marathi_speech_script: chalExplanationMarathiSpeechScript.trim() || undefined,
      explanation_marathi_audio_url: explanationAudioUrlMarathi.trim() || undefined,
      explanation_marathi_audio_duration: Number(explanationAudioDurationMarathi) || undefined,
    };

    if (chalType === 'content_screen' || chalType === 'visual_lesson_screen') {
      const payload = {
        sceneType: contentSceneType || 'hero',
        mediaType: contentMediaType || 'image',
        mediaUrl: contentMediaUrl.trim() || undefined,
        badge: contentBadge.trim() || undefined,
        heading: contentHeading.trim() || undefined,
        subheading: contentSubheading.trim() || undefined,
        contentBody: contentBody.trim() || chalExplanation.trim() || undefined,
        highlightBox: contentHighlightBox.trim() || undefined,
        quote: contentQuote.trim() || undefined,
        quoteAuthor: contentQuoteAuthor.trim() || undefined,
        bottomMessage: contentBottomMessage.trim() || undefined
      };
      base.contentScreen = payload;
      base.visualLessonScreen = payload;
    }

    if (chalType === 'c3_sentence_builder' || chalType === 'build_concept') {
      base.targetSentence = chalSentenceTarget.trim() || 'AI learns from data.';
      base.chipsCorrect = chalChipsValue ? chalChipsValue.split(',').map(c => c.trim()).filter(Boolean) : base.targetSentence.split(' ').filter(Boolean);
      base.chipsDistractor = chalChipsDistractors ? chalChipsDistractors.split(',').map(c => c.trim()).filter(Boolean) : ['engine', 'boiler'];
    }

    if (chalType === 'c4_concept_matcher' || chalType === 'match_pairs') {
      base.pairs = chalConceptPairs.filter((p: any) => p.left && p.right);
      base.conceptPairs = base.pairs;
    }

    if (chalType === 'c5_bucket_sort' || chalType === 'drag_and_drop') {
      base.buckets = [
        { id: 'b1', label: chalDragBucket1 || 'Bucket A' },
        { id: 'b2', label: chalDragBucket2 || 'Bucket B' }
      ];
      base.items = chalBucketSortItems.filter((i: any) => i.text && i.text.trim());
      base.bucketItems = base.items;
      base.bucketCategories = [chalDragBucket1, chalDragBucket2];
    }

    if (chalType === 'c6_timeline_sort' || chalType === 'c7_sequence_builder' || chalType === 'sort_sequence') {
      base.steps = chalTimelineSteps.filter((s: any) => s.text && s.text.trim());
      base.correctOrder = base.steps.map((s: any) => s.id);
      base.timelineSteps = base.steps;
    }

    if (chalType === 'c8_tap_correct_object') {
      base.items = chalC8Images;
    }

    if (chalType === 'c9_true_false') {
      base.correctAnswer = chalMcqCorrect.trim().toLowerCase() === 'true' ? 'true' : 'false';
    }

    if (chalType === 'c10_swipe_left_right') {
      base.correctAnswer = chalMcqCorrect.trim().toLowerCase() === 'left' ? 'left' : 'right';
      base.options = [chalSwipeLeftLabel.trim() || 'Left', chalSwipeRightLabel.trim() || 'Right'];
    }

    if (chalType === 'c11_image_classification') {
      base.buckets = [
        { id: 'b1', label: chalDragBucket1 || 'Category A' },
        { id: 'b2', label: chalDragBucket2 || 'Category B' }
      ];
      base.items = chalImgClassifyItems.filter((i: any) => i.text && i.text.trim());
      base.classifyImages = base.items;
    }

    if (chalType === 'c12_label_diagram') {
      base.imageUrl = chalImageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600';
      base.hotspots = chalC12Hotspots;
      base.items = chalC12Chips.filter((c: any) => c.text && c.text.trim());
    }

    if (chalType === 'c13_hotspot_question') {
      base.imageUrl = chalImageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600';
      base.hotspots = chalC13Hotspots;
    }

    if (chalType === 'c14_memory_flip_cards') {
      base.cards = chalC14Cards.filter((c: any) => c.front && c.front.trim() && c.back && c.back.trim());
    }

    if (chalType === 'c15_drag_complete_diagram') {
      base.steps = chalC15Steps.filter((s: any) => s.text && s.text.trim());
    }

    if (chalType === 'c16_eliminate_wrong') {
      base.options = chalC16Options.filter((o: any) => o.text && o.text.trim());
    }

    if (chalType === 'c17_arrange_images') {
      base.items = chalC17Items.filter((i: any) => i.imageUrl && i.imageUrl.trim());
      base.correctOrder = base.items.map((i: any) => i.id);
    }

    if (chalType === 'c18_audio_quiz') {
      base.audioUrl = chalAudioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    }

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

    if (!text) {
      text = chal.explanation_speech_script || chal.explanation_concept || '';
    }
    if (!audioUrl) {
      audioUrl = chal.explanation_audio_url || chal.audioUrl || (chal as any).audioNarrations?.hinglish?.url || (chal as any).audioNarrations?.hi?.url || '';
      audioDuration = chal.explanation_audio_duration || 0;
    }
    if (!textMar) {
      textMar = chal.explanation_marathi_speech_script || chal.explanation_marathi || chal.explanation_marathi_concept || '';
    }
    if (!audioUrlMar) {
      audioUrlMar = chal.explanation_marathi_audio_url || (chal as any).audioNarrations?.marathi?.url || (chal as any).audioNarrations?.mr?.url || '';
      audioDurationMar = chal.explanation_marathi_audio_duration || 0;
    }

    setChalExplanation(text);
    setChalExplanationText(text);
    setChalExplanationAudioUrl(audioUrl);
    setExplanationAudioUrl(audioUrl);
    setChalExplanationAudioDuration(audioDuration);
    setExplanationAudioDuration(audioDuration);

    setChalExplanationMarathi(textMar);
    setExplanationAudioUrlMarathi(audioUrlMar);
    setExplanationAudioDurationMarathi(audioDurationMar);

    setChalPoints(chal.xpValue || 10);
    setChalXpValue(chal.xpValue || 10);

    // Reset conditional inputs to ensure clean state transitions
    setChalMcqOptions(['', '', '', '']);
    setChalMcqCorrect('');
    setChalC8Images(['', '', '', '']);
    setChalFillBlankOptions(['', '', '', '']);
    setChalFillBlankCorrect('');
    setChalAiTextClue('');
    setChalAiCardATitle('Card A: Theory');
    setChalAiCardAText('');
    setChalAiCardBTitle('Card B: True Science');
    setChalAiCardBText('');
    setChalAiCorrectCard('opt_ai');
    setChalSpotText1('');
    setChalSpotIsReal1(true);
    setChalSpotExpl1('');
    setChalSpotText2('');
    setChalSpotIsReal2(false);
    setChalSpotExpl2('');
    setChalDragBucket1('🪐 Space');
    setChalDragBucket2('🌿 Earth');
    setChalDragItem1Text('Evaporating comets');
    setChalDragItem1Bucket('bucket1');
    setChalDragItem2Text('Green leaves kitchens');
    setChalDragItem2Bucket('bucket2');
    setChalPairLeft1('');
    setChalPairRight1('');
    setChalPairLeft2('');
    setChalPairRight2('');
    setChalSortStep1('');
    setChalSortStep2('');
    setChalSortStep3('');
    setChalSortStep4('');
    setChalSentenceTarget('');
    setChalChipsValue('');
    setChalChipsDistractors('');
    setChalImageUrl(chal.imageUrl || (chal as any).image || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop');
    setChalImage(chal.imageUrl || (chal as any).image || '');

    // Category C extra resets
    setChalHint(chal.hint || '');
    setChalDifficulty((chal.difficulty as any) || 'easy');
    setChalContinueText(chal.continueText || 'Continue');
    setChalMascotMessage(chal.mascotMessage || '');
    setChalExplanationConfused(chal.explanation_confused || '');
    setChalExplanationConcept(chal.explanation_concept || '');
    setChalExplanationExample(chal.explanation_example || '');
    setChalExplanationTakeaway(chal.explanation_takeaway || '');
    setChalExplanationSpeechScript(chal.explanation_speech_script || '');
    setChalExplanationMarathiConfused(chal.explanation_marathi_confused || '');
    setChalExplanationMarathiConcept(chal.explanation_marathi_concept || '');
    setChalExplanationMarathiExample(chal.explanation_marathi_example || '');
    setChalExplanationMarathiTakeaway(chal.explanation_marathi_takeaway || '');
    setChalExplanationMarathiSpeechScript(chal.explanation_marathi_speech_script || '');

    setChalConceptPairs(chal.pairs || (chal as any).conceptPairs || [{ left: 'AI', right: 'Artificial Intelligence' }]);
    setChalBucketSortItems(chal.items || (chal as any).bucketItems || [{ id: 'i1', text: 'Data', correct_bucket: 'b1' }]);
    setChalTimelineSteps(chal.steps || (chal as any).timelineSteps || [{ id: 's1', text: 'Step A' }]);
    setChalAudioUrl(chal.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    setChalSwipeLeftLabel((chal.options && chal.options[0]) || 'Left option');
    setChalSwipeRightLabel((chal.options && chal.options[1]) || 'Right option');
    setChalImgClassifyItems(chal.items || (chal as any).classifyImages || [
      { id: 'img1', text: 'Item 1', imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150', correct_bucket: 'b1' }
    ]);
    setChalC12Hotspots(chal.hotspots || [{ id: 'h1', label: 'Spot A', x: 25, y: 35, correct_bucket: 'chip1' }]);
    setChalC12Chips(chal.items || [{ id: 'chip1', text: 'Sensor' }]);
    setChalC13Hotspots(chal.hotspots || [{ id: 'hs1', isCorrectSpot: true, x: 50, y: 50, description: 'Engine' }]);
    setChalC14Cards(chal.cards || [{ id: 'card1', front: 'Term A', back: 'Definition A' }]);
    setChalC15Steps(chal.steps || [{ id: 'p1', text: 'Step 1' }, { id: 'p2', text: 'Step 2 (Missing)', isMissing: true }]);
    setChalC16Options(chal.options || [{ id: 'o1', text: 'Option A (Correct)', isCorrect: true }, { id: 'o2', text: 'Option B (Wrong)', isCorrect: false }]);
    setChalC17Items(chal.items || [{ id: 'img1', imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150', caption: 'Step 1' }]);

    setContentSceneType('hero');
    setContentMediaType('image');
    setContentMediaUrl('');
    setContentBadge('');
    setContentHeading('');
    setContentSubheading('');
    setContentBody('');
    setContentHighlightBox('');
    setContentQuote('');
    setContentQuoteAuthor('');
    setContentBottomMessage('');

    // Load options & answers for MCQs
    if (
      chal.type === 'tap_right_answer' ||
      chal.type === 'image_reveal' ||
      chal.type === 'c1_multiple_choice' ||
      chal.type === 'c8_tap_correct_object' ||
      chal.type === 'c18_audio_quiz' ||
      chal.type === 'c15_drag_complete_diagram'
    ) {
      if (chal.options && chal.options.length > 0) {
        setChalMcqOptions([...chal.options, '', '', '', ''].slice(0, 4));
        setChalOptions([...chal.options]);
      }
      if (chal.correctAnswer) {
        setChalMcqCorrect(chal.correctAnswer);
        setChalCorrectAnswer(chal.correctAnswer);
      }
      if (chal.imageUrl) setChalImageUrl(chal.imageUrl);
      if (chal.type === 'c8_tap_correct_object' && chal.items && Array.isArray(chal.items)) {
        setChalC8Images([...chal.items, '', '', '', ''].slice(0, 4));
      }
    }

    if (chal.type === 'fill_in_blank' || chal.type === 'c2_fill_in_blank') {
      if (chal.options && chal.options.length > 0) {
        setChalFillBlankOptions([...chal.options, '', '', '', ''].slice(0, 4));
        setChalOptions([...chal.options]);
      }
      if (chal.correctAnswer) {
        setChalFillBlankCorrect(chal.correctAnswer);
        setChalCorrectAnswer(chal.correctAnswer);
      }
    }

    if (chal.type === 'ai_vs_human') {
      if (chal.outputs && chal.outputs.length >= 2) {
        setChalAiCardATitle(chal.outputs[0].title || '');
        setChalAiCardAText(chal.outputs[0].text || '');
        setChalAiCardBTitle(chal.outputs[1].title || '');
        setChalAiCardBText(chal.outputs[1].text || '');
      }
      if (chal.correctAnswer) setChalAiCorrectCard(chal.correctAnswer);
    }

    if (chal.type === 'spot_the_ai') {
      if (chal.items && chal.items.length >= 2) {
        setChalSpotText1(chal.items[0].text || '');
        setChalSpotIsReal1(!!chal.items[0].has_ai);
        setChalSpotExpl1(chal.items[0].explanation || '');
        setChalSpotText2(chal.items[1].text || '');
        setChalSpotIsReal2(!!chal.items[1].has_ai);
        setChalSpotExpl2(chal.items[1].explanation || '');
      }
    }

    if (chal.type === 'drag_and_drop' || chal.type === 'c5_bucket_sort') {
      if (chal.buckets && chal.buckets.length >= 2) {
        setChalDragBucket1(chal.buckets[0].label || '');
        setChalDragBucket2(chal.buckets[1].label || '');
      }
      if (chal.items) {
        setChalBucketSortItems(chal.items);
      }
    }

    if (chal.type === 'match_pairs' || chal.type === 'c4_concept_matcher') {
      if (chal.pairs) setChalConceptPairs(chal.pairs);
    }

    if (chal.type === 'sort_sequence' || chal.type === 'c6_timeline_sort' || chal.type === 'c7_sequence_builder') {
      if (chal.steps) setChalTimelineSteps(chal.steps);
    }

    if (chal.type === 'build_concept' || chal.type === 'c3_sentence_builder') {
      setChalSentenceTarget(chal.targetSentence || '');
      if (chal.chipsCorrect) setChalChipsValue(chal.chipsCorrect.join(', '));
      if (chal.chipsDistractor) setChalChipsDistractors(chal.chipsDistractor.join(', '));
    }

    if (chal.type === 'content_screen' || chal.type === 'visual_lesson_screen') {
      const payload = chal.contentScreen || chal.visualLessonScreen;
      if (payload) {
        setContentSceneType(payload.sceneType || 'hero');
        setContentMediaType(payload.mediaType || 'image');
        setContentMediaUrl(payload.mediaUrl || '');
        setContentBadge(payload.badge || '');
        setContentHeading(payload.heading || '');
        setContentSubheading(payload.subheading || '');
        setContentBody(payload.contentBody || '');
        setContentHighlightBox(payload.highlightBox || '');
        setContentQuote(payload.quote || '');
        setContentQuoteAuthor(payload.quoteAuthor || '');
        setContentBottomMessage(payload.bottomMessage || '');
      }
    }

    if (chal.type === 'c9_true_false') {
      setChalMcqCorrect(chal.correctAnswer || 'true');
    }

    if (chal.type === 'c10_swipe_left_right') {
      setChalMcqCorrect(chal.correctAnswer || 'left');
      if (chal.options) {
        setChalSwipeLeftLabel(chal.options[0] || 'Left option');
        setChalSwipeRightLabel(chal.options[1] || 'Right option');
      }
    }

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
    const newId = 'step_' + Date.now().toString().slice(-6);
    const baseChallenge: Challenge = {
      id: newId,
      type: baseType,
      question: (baseType === 'content_screen' || baseType === 'visual_lesson_screen') 
        ? 'Aibo Concept Slide' 
        : 'Task Question: Which option is correct?',
      explanation: {
        text: 'Aibo says: High performance research complete!',
        audioUrl: '',
        audioDuration: 0,
        hinglish: { text: 'Aibo says: High performance research complete!', audioUrl: '', audioDuration: 0 },
        marathi: { text: '', audioUrl: '', audioDuration: 0 }
      },
      xpValue: 10
    };

    switch (baseType as string) {
      case 'tap_right_answer':
      case 'image_reveal':
        baseChallenge.options = ['Standard Answer Opt A', 'Mistaken Choice B', 'Alternative Opt C', 'Query Opt D'];
        baseChallenge.correctAnswer = 'Standard Answer Opt A';
        if (baseType === 'image_reveal') {
          baseChallenge.imageUrl = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop';
        }
        break;
      case 'fill_in_blank':
        baseChallenge.question = 'Space research uses [BLANK] computing systems.';
        baseChallenge.options = ['intelligent', 'manual', 'unstable', 'antiquated'];
        baseChallenge.correctAnswer = 'intelligent';
        break;
      case 'ai_vs_human':
        baseChallenge.outputs = [
          {
            id: 'opt_human',
            title: 'Card A: Science Reality',
            text: 'Planets orbit following strict gravitational vectors.',
            authorLabel: 'Physicists Theory',
            isAI: false,
            emojis: '🪐✨'
          },
          {
            id: 'opt_ai',
            title: 'Card B: AI Draft Output',
            text: 'Stars fly randomly coordinate systems inside standard space loops.',
            authorLabel: 'Generated GPT Hallucination',
            isAI: true,
            emojis: '🤖❗'
          }
        ];
        baseChallenge.correctAnswer = 'opt_ai';
        break;
      case 'spot_the_ai':
        baseChallenge.items = [
          {
            id: 'spot_1',
            text: 'Telescopes resolve far stellar light waves.',
            has_ai: false,
            explanation: 'Accurate lens observations.'
          },
          {
            id: 'spot_2',
            text: 'Artificial engines manufacture gravity fields out of solar rocks.',
            has_ai: true,
            explanation: 'Silly computer sci-fi error!'
          }
        ];
        break;
      case 'drag_and_drop':
        baseChallenge.buckets = [{ id: 'b1', label: '🪐 Solar Systems' }, { id: 'b2', label: '🌿 Earth Biosphere' }];
        baseChallenge.items = [
          { id: 'di1', text: 'Jupiter gas giant', correct_bucket: 'b1' },
          { id: 'di2', text: 'Amazon Rainforest', correct_bucket: 'b2' },
          { id: 'di3', text: 'Saturn Ice Rings', correct_bucket: 'b1' }
        ];
        break;
      case 'swipe_sorter':
        baseChallenge.left_category = '🛸 Extraterrestrial';
        baseChallenge.right_category = '🌍 Terrestrial';
        baseChallenge.items = [
          { id: 'sw1', text: 'Martian Rover Curiosity', correct_direction: 'left' },
          { id: 'sw2', text: 'Mount Everest Peak', correct_direction: 'right' }
        ];
        break;
      case 'dialogue':
      case 'story_dialogue':
        baseChallenge.dialoguePanels = [
          { speaker: 'Aibo', text: 'Greetings voyager! Ready to explore?', avatar: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=120&auto=format&fit=crop' },
          { speaker: 'Student', text: 'Engines armed. Let us launch!', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop' }
        ];
        break;
      case 'bubble_pop':
        baseChallenge.bubbleTargetPrompt = 'Pop all real cosmic bodies!';
        baseChallenge.bubbleItems = [
          { id: 'b1', label: 'Mars', isCorrect: true },
          { id: 'b2', label: 'Asteroid Belt', isCorrect: true },
          { id: 'b3', label: 'Krypton', isCorrect: false }
        ];
        break;
      case 'ai_playground':
        baseChallenge.playgroundMode = 'prompt_experiment';
        baseChallenge.starterPrompt = 'Explain neural weights simply:';
        break;
      default:
        baseChallenge.options = ['Option A', 'Option B', 'Option C', 'Option D'];
        baseChallenge.correctAnswer = 'Option A';
        break;
    }

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
    buildChallengePayload,
    chalMcqOptions,
    setChalMcqOptions,
    chalMcqCorrect,
    setChalMcqCorrect,
    chalFillBlankOptions,
    setChalFillBlankOptions,
    chalFillBlankCorrect,
    setChalFillBlankCorrect,
    chalAiTextClue,
    setChalAiTextClue,
    chalAiCardATitle,
    setChalAiCardATitle,
    chalAiCardAText,
    setChalAiCardAText,
    chalAiCardBTitle,
    setChalAiCardBTitle,
    chalAiCardBText,
    setChalAiCardBText,
    chalAiCorrectCard,
    setChalAiCorrectCard,
    chalSpotText1,
    setChalSpotText1,
    chalSpotIsReal1,
    setChalSpotIsReal1,
    chalSpotExpl1,
    setChalSpotExpl1,
    chalSpotText2,
    setChalSpotText2,
    chalSpotIsReal2,
    setChalSpotIsReal2,
    chalSpotExpl2,
    setChalSpotExpl2,
    chalDragBucket1,
    setChalDragBucket1,
    chalDragBucket2,
    setChalDragBucket2,
    chalDragItem1Text,
    setChalDragItem1Text,
    chalDragItem1Bucket,
    setChalDragItem1Bucket,
    chalDragItem2Text,
    setChalDragItem2Text,
    chalDragItem2Bucket,
    setChalDragItem2Bucket,
    chalPairLeft1,
    setChalPairLeft1,
    chalPairRight1,
    setChalPairRight1,
    chalPairLeft2,
    setChalPairLeft2,
    chalPairRight2,
    setChalPairRight2,
    chalSortStep1,
    setChalSortStep1,
    chalSortStep2,
    setChalSortStep2,
    chalSortStep3,
    setChalSortStep3,
    chalSortStep4,
    setChalSortStep4,
    chalSentenceTarget,
    setChalSentenceTarget,
    chalChipsValue,
    setChalChipsValue,
    chalChipsDistractors,
    setChalChipsDistractors,
    chalImageUrl,
    setChalImageUrl,
    chalHint,
    setChalHint,
    chalDifficulty,
    setChalDifficulty,
    chalContinueText,
    setChalContinueText,
    chalMascotMessage,
    setChalMascotMessage,
    chalBucketSortItems,
    setChalBucketSortItems,
    chalAudioUrl,
    setChalAudioUrl,
    chalSwipeLeftLabel,
    setChalSwipeLeftLabel,
    chalSwipeRightLabel,
    setChalSwipeRightLabel,
    chalImgClassifyItems,
    setChalImgClassifyItems,
    chalC12Hotspots,
    setChalC12Hotspots,
    chalC12Chips,
    setChalC12Chips,
    chalC13Hotspots,
    setChalC13Hotspots,
    chalC14Cards,
    setChalC14Cards,
    chalC15Steps,
    setChalC15Steps,
    chalC16Options,
    setChalC16Options,
    chalC17Items,
    setChalC17Items,
    chalC8Images,
    setChalC8Images,
    contentSceneType,
    setContentSceneType,
    contentMediaType,
    setContentMediaType,
    contentMediaUrl,
    setContentMediaUrl,
    contentBadge,
    setContentBadge,
    contentHeading,
    setContentHeading,
    contentSubheading,
    setContentSubheading,
    contentBody,
    setContentBody,
    contentHighlightBox,
    setContentHighlightBox,
    contentQuote,
    setContentQuote,
    contentQuoteAuthor,
    setContentQuoteAuthor,
    contentBottomMessage,
    setContentBottomMessage,
    isGeneratingImage,
    setIsGeneratingImage,
    imageGenerationError,
    setImageGenerationError,
    imageGenerationSuccess,
    setImageGenerationSuccess,
    generationAspectRatio,
    setGenerationAspectRatio,
    chalXpValue,
    setChalXpValue,
    chalExplanationConfused,
    setChalExplanationConfused,
    chalExplanationConcept,
    setChalExplanationConcept,
    chalExplanationExample,
    setChalExplanationExample,
    chalExplanationTakeaway,
    setChalExplanationTakeaway,
    chalExplanationSpeechScript,
    setChalExplanationSpeechScript,
    explanationAudioUrl,
    setExplanationAudioUrl,
    explanationAudioDuration,
    setExplanationAudioDuration
  };
}
