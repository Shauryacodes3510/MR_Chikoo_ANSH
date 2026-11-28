import { useState, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, ArrowLeft, Save, Sparkles, Check, ChevronRight, ChevronUp, ChevronDown, X,
  Layers, BookOpen, AlertCircle, Eye, FileSpreadsheet, Lock, Unlock, HelpCircle, Layout, Copy, Info,
  Wand2, Settings, PlayCircle, Cpu, RefreshCw, CheckCircle2, Trophy, Star, Zap, Search, CornerDownRight, Gift, Edit,
  MoreVertical, Download, Building2, Globe, LayoutGrid, BarChart2, SlidersHorizontal, Users, Smartphone,
  ExternalLink, Compass, ShieldCheck, Palette, Bell, Home, Sliders, Swords, Edit3, Brain, PartyPopper, LogOut, FileCode,
  FileJson, Volume2, Loader2, Bot
} from 'lucide-react';
import { getRewards, saveRewards, getRedemptionRequests, saveRedemptionRequests, getRewardsAsync, saveRewardAsync, deleteRewardAsync, getRedemptionRequestsAsync, saveRedemptionRequestAsync, Reward as StoreReward, RedemptionRequest as StoreRedemptionRequest } from '../lib/rewardsStore';
import { getChallengePacks, getPuzzlePacks, getBattlePools } from '../lib/practiceStoreNew';
import { Module, Lesson, Challenge, ChallengeType } from '../lib/content';
import { 
  saveCurriculumToStorage, 
  saveSingleLesson, 
  AI_CURRICULUM, 
  PRACTICE_CURRICULUM,
  getCurriculumSyncStatus,
  subscribeCurriculumSyncStatus,
  retryFailedCurriculumSync,
  removeSyncedHash,
  CurriculumSyncStatus
} from '../lib/content';
import { soundManager } from '../lib/sounds';
import PracticeArenaSettings from './PracticeArenaSettings';
import CelebrationCenter from './CelebrationCenter';
import UserManagement from '../features/admin/components/UserManagement';
import StudentIntelligence from '../features/admin/components/StudentIntelligence';
import SchoolsManagement from '../features/admin/components/SchoolsManagement';
import { OutlineMap, MobileStudioNav, CurriculumStudio, useCurriculumStudio, useScreenForm } from '../features/admin/curriculum';
import { CopilotPanel } from '../features/admin/curriculum/copilot';
import { 
  supabase,
  isSupabaseConfigured, 
  getProfile, 
  updateProfile, 
  getAllUserProfiles, 
  getCustomModules, 
  saveCustomModule, 
  batchUpdateModules,
  deleteCustomModule, 
  getCustomLessons, 
  saveCustomLesson, 
  deleteCustomLesson, 
  getWorlds,
  saveWorld,
  deleteWorld,
  World,
  SupabaseUserProfile 
} from '../lib/supabase';

// Exercise component imports for live preview sandbox in admin panel
const TapRightAnswer = lazy(() => import('./exercises/TapRightAnswer'));
const FillInBlank = lazy(() => import('./exercises/FillInBlank'));
const SpotTheAI = lazy(() => import('./exercises/SpotTheAI'));
const DragAndDrop = lazy(() => import('./exercises/DragAndDrop'));
const MatchPairs = lazy(() => import('./exercises/MatchPairs'));
const SortSequence = lazy(() => import('./exercises/SortSequence'));
const BuildAConcept = lazy(() => import('./exercises/BuildAConcept'));
const ScenarioQuest = lazy(() => import('./exercises/ScenarioQuest'));
const RapidFire = lazy(() => import('./exercises/RapidFire'));
const BeforeAfterExperiment = lazy(() => import('./exercises/BeforeAfterExperiment'));
const MysteryConcept = lazy(() => import('./exercises/MysteryConcept'));
const StepDebugger = lazy(() => import('./exercises/StepDebugger'));
const ArgumentBuilder = lazy(() => import('./exercises/ArgumentBuilder'));
const LinkBuilder = lazy(() => import('./exercises/LinkBuilder'));
const OpenResponse = lazy(() => import('./exercises/OpenResponse'));
const ImageReveal = lazy(() => import('./exercises/ImageReveal'));
const AIVsHuman = lazy(() => import('./exercises/AIVsHuman'));
const TapCorrectArea = lazy(() => import('./exercises/TapCorrectArea'));
const MemoryFlipCards = lazy(() => import('./exercises/MemoryFlipCards'));
const EmojiConcepts = lazy(() => import('./exercises/EmojiConcepts'));
const AchievementDiscovery = lazy(() => import('./exercises/AchievementDiscovery'));
const AnalogyCard = lazy(() => import('./exercises/AnalogyCard'));
const AIToolPicker = lazy(() => import('./exercises/AIToolPicker'));
const PromptBattle = lazy(() => import('./exercises/PromptBattle'));
const BeforeAfterAI = lazy(() => import('./exercises/BeforeAfterAI'));
const AIForSchool = lazy(() => import('./exercises/AIForSchool'));
const ToolMatch = lazy(() => import('./exercises/ToolMatch'));
const ResultRanker = lazy(() => import('./exercises/ResultRanker'));
const PromptFixer = lazy(() => import('./exercises/PromptFixer'));
const AIMythFact = lazy(() => import('./exercises/AIMythFact'));
const StudentMission = lazy(() => import('./exercises/StudentMission'));
const DailyLifeAI = lazy(() => import('./exercises/DailyLifeAI'));
const AIPrediction = lazy(() => import('./exercises/AIPrediction'));
const WhichOutputBetter = lazy(() => import('./exercises/WhichOutputBetter'));
const AIAssistantBuilder = lazy(() => import('./exercises/AIAssistantBuilder'));
const HiddenAI = lazy(() => import('./exercises/HiddenAI'));
const MemeScreen = lazy(() => import('./exercises/MemeScreen'));
const GIFExplainer = lazy(() => import('./exercises/GIFExplainer'));
const ComicStory = lazy(() => import('./exercises/ComicStory'));
const FunFact = lazy(() => import('./exercises/FunFact'));
const VisualAnalogy = lazy(() => import('./exercises/VisualAnalogy'));
const ImageExplainer = lazy(() => import('./exercises/ImageExplainer'));
const AIAroundYou = lazy(() => import('./exercises/AIAroundYou'));
const MythBuster = lazy(() => import('./exercises/MythBuster'));
const BeforeAfterStory = lazy(() => import('./exercises/BeforeAfterStory'));
const StudentStory = lazy(() => import('./exercises/StudentStory'));
const InteractiveReveal = lazy(() => import('./exercises/InteractiveReveal'));
const WhyShouldICare = lazy(() => import('./exercises/WhyShouldICare'));
const VisualLessonScreen = lazy(() => import('./exercises/VisualLessonScreen'));
import {
  C7SequenceBuilder,
  C8TapCorrectObject,
  C9TrueFalse,
  C10SwipeLeftRight,
  C11ImageClassification,
  C12LabelDiagram,
  C13HotspotQuestion,
  C15DragToCompleteDiagram,
  C16EliminateWrongAnswers,
  C17ArrangeImages,
  C18AudioQuiz
} from './exercises/CategoryCExercises';
import { CategoryCForms } from './admin/CategoryCForms';
import { ScreenVoiceSection } from './admin/ScreenVoiceSection';
import LearningPathBuilder from './LearningPathBuilder';
import { AILessonGenerator } from './admin/AILessonGenerator';
import BulkNarrationQueue from './admin/BulkNarrationQueue';
import ExplanationAudioManager from './admin/ExplanationAudioManager';
import { mapScreenDataForImport } from '../lib/curriculumNormalize';

const getComicValidation = (bodyText: string, mediaUrls: string) => {
  const dialogues = bodyText ? bodyText.split(',').map(s => s.trim()) : [];
  const images = mediaUrls ? mediaUrls.split(',').map(s => s.trim()) : [];

  let dialogueStatus = { type: 'success' as 'success' | 'warning' | 'error', message: '' };
  if (!bodyText) {
    dialogueStatus = { type: 'error', message: 'Comic Strip Scene requires exactly 3 panels.' };
  } else if (dialogues.length < 3) {
    dialogueStatus = { type: 'error', message: `Only ${dialogues.length} panel${dialogues.length > 1 ? 's' : ''} detected. Comic Strip Scene requires exactly 3 panels.` };
  } else {
    const emptyIdx = dialogues.findIndex((val, idx) => idx < 3 && val === '');
    if (emptyIdx !== -1) {
      dialogueStatus = { type: 'error', message: `Panel ${emptyIdx + 1} dialogue is empty.` };
    } else if (dialogues.length > 3) {
      dialogueStatus = { type: 'warning', message: 'Only the first 3 values will be used.' };
    } else {
      dialogueStatus = { type: 'success', message: '3 / 3 Panels Ready' };
    }
  }

  let imageStatus = { type: 'success' as 'success' | 'warning' | 'error', message: '' };
  if (!mediaUrls) {
    imageStatus = { type: 'error', message: 'Comic Strip Scene requires exactly 3 panels.' };
  } else if (images.length < 3) {
    imageStatus = { type: 'error', message: `Only ${images.length} panels detected. Comic Strip Scene requires exactly 3 panels.` };
  } else {
    const emptyIdx = images.findIndex((val, idx) => idx < 3 && val === '');
    if (emptyIdx !== -1) {
      imageStatus = { type: 'error', message: `Panel ${emptyIdx + 1} image missing.` };
    } else if (images.length > 3) {
      imageStatus = { type: 'warning', message: 'Only the first 3 values will be used.' };
    } else {
      imageStatus = { type: 'success', message: '3 / 3 Panels Ready' };
    }
  }

  return { dialogueStatus, imageStatus };
};

interface ChallengePreviewProps {
  challenge: Challenge;
}

function ChallengePreview({ challenge }: ChallengePreviewProps) {
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [userComment, setUserComment] = useState("");

  // When challenge changes or is re-compiled, reset the state
  useEffect(() => {
    setSelectedOption(null);
    setIsChecked(false);
    setIsCorrect(false);
    setShowExplanation(false);
    setShowSuccess(false);
    setUserRating(null);
    setUserComment("");
  }, [challenge.id, challenge.type, challenge.question]);

  if (!challenge) return null;

  const handleSelect = (option: any) => {
    setSelectedOption(option);
  };

  const handleCheck = () => {
    setIsChecked(true);
    let correct = false;

    switch (challenge.type) {
      case 'tap_right_answer':
      case 'image_reveal':
      case 'analogy_card':
      case 'emoji_concepts':
        correct = String(selectedOption || '').trim().toLowerCase() === String(challenge.correctAnswer || '').trim().toLowerCase();
        break;
      case 'fill_in_blank':
        correct = String(selectedOption || '').trim().toLowerCase() === String(challenge.correctAnswer || '').trim().toLowerCase();
        break;
      case 'ai_vs_human':
        correct = selectedOption === challenge.correctAnswer;
        break;
      case 'spot_the_ai': {
        if (Array.isArray(selectedOption)) {
          const aiItemIds = (challenge.items || []).filter(i => i.has_ai).map(i => i.id);
          correct = aiItemIds.every(id => selectedOption.includes(id)) && selectedOption.every(id => aiItemIds.includes(id));
        } else {
          correct = selectedOption === challenge.correctAnswer;
        }
        break;
      }
      case 'sort_sequence': {
        if (Array.isArray(selectedOption) && challenge.correctOrder) {
          correct = selectedOption.length === challenge.correctOrder.length && 
                    selectedOption.every((val, index) => val === challenge.correctOrder?.[index]);
        }
        break;
      }
      case 'build_concept': {
        if (Array.isArray(selectedOption)) {
          const answer = selectedOption.join(' ').toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
          const target = (challenge.targetSentence || '').toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
          correct = answer === target;
        }
        break;
      }
      case 'scenario_quest':
        correct = (selectedOption as any)?.is_best || false;
        break;
      case 'match_pairs':
        correct = selectedOption === true;
        break;
      case 'rapid_fire':
        correct = (selectedOption as number) > 0;
        break;
      case 'before_after_exp':
        correct = String(selectedOption || '').trim().toLowerCase() === String(challenge.experiment?.reflectionQuestions?.[0]?.correctAnswer || '').trim().toLowerCase();
        break;
      case 'mystery_concept':
        correct = String(selectedOption || '').toLowerCase().trim() === String(challenge.mystery?.concept || '').toLowerCase().trim();
        break;
      case 'step_debugger':
        correct = true;
        break;
      case 'argument_builder': {
        const argAssignments = (selectedOption as { [key: number]: 'for' | 'against' }) || {};
        const argCards = challenge.argument?.cards || [];
        correct = Object.keys(argAssignments).length === argCards.length && 
                  Object.entries(argAssignments).every(([idx, side]) => argCards[parseInt(idx)].side === side);
        break;
      }
      case 'link_builder': {
        const linkIndices = (selectedOption as number[]) || [];
        const linkPool = challenge.linkBuilder?.pool || [];
        correct = linkPool.every((item, idx) => item.belongs === linkIndices.includes(idx));
        break;
      }
      case 'open_response':
        correct = true;
        break;
      default:
        const expected = String(challenge.correctAnswer || '').trim().toLowerCase();
        const actual = String(selectedOption || '').trim().toLowerCase();
        correct = actual === expected;
    }

    setIsCorrect(correct);
    if (correct) {
      soundManager.play('correct');
    } else {
      soundManager.play('incorrect');
    }
  };

  const handleContinue = () => {
    soundManager.play('click');
    setShowSuccess(true);
    soundManager.play('complete');
  };

  const handleReset = () => {
    soundManager.play('click');
    setSelectedOption(null);
    setIsChecked(false);
    setIsCorrect(false);
    setShowExplanation(false);
    setShowSuccess(false);
    setUserRating(null);
    setUserComment("");
  };

  const renderExercise = () => {
    try {
      return (
        <Suspense fallback={<div>Loading preview...</div>}>
          {(() => {
            switch (challenge.type) {
        case 'tap_right_answer':
          return (
            <TapRightAnswer 
              options={challenge.options || []}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
              correctAnswer={challenge.correctAnswer as string}
            />
          );
        case 'fill_in_blank':
          return (
            <FillInBlank 
              sentence={challenge.question}
              options={challenge.options || []}
              correctAnswer={challenge.correctAnswer as string}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'image_reveal':
          return (
            <ImageReveal 
              imageUrl={challenge.imageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop'}
              options={challenge.options || []}
              correctAnswer={challenge.correctAnswer as string}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'ai_vs_human':
          return (
            <AIVsHuman 
              outputs={challenge.outputs as any || [
                { id: 'opt_human', title: 'Human Card', text: 'Correct physics fact.', authorLabel: 'Physicist', isAI: false },
                { id: 'opt_ai', title: 'AI Card', text: 'Hallucinated claim.', authorLabel: 'Machine', isAI: true }
              ]}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'spot_the_ai':
          return (
            <SpotTheAI 
              items={challenge.items || []}
              onSelect={handleSelect}
              isChecked={isChecked}
            />
          );
        case 'drag_and_drop':
          return (
            <DragAndDrop 
              buckets={challenge.buckets || []}
              items={challenge.items as any || []}
              isChecked={isChecked}
              onSelect={handleSelect}
            />
          );
        case 'match_pairs':
          return (
            <MatchPairs 
              pairs={challenge.pairs || []}
              isChecked={isChecked}
              onSelect={handleSelect}
            />
          );
        case 'sort_sequence':
          return (
            <SortSequence 
              steps={challenge.steps || []}
              correctOrder={challenge.correctOrder || []}
              isChecked={isChecked}
              onSelect={handleSelect}
            />
          );
        case 'build_concept':
          return (
            <BuildAConcept 
              targetSentence={challenge.targetSentence || ''}
              chipsCorrect={challenge.chipsCorrect || []}
              chipsDistractor={challenge.chipsDistractor || []}
              isChecked={isChecked}
              onSelect={handleSelect}
            />
          );
        case 'emoji_concepts':
          return (
            <EmojiConcepts 
              emojiClue={challenge.emojiClue || ''}
              options={challenge.options || []}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
              correctAnswer={challenge.correctAnswer as string}
            />
          );
        case 'achievement_discovery':
          return (
            <AchievementDiscovery 
              rewards={challenge.rewards || []}
              isChecked={isChecked}
              onSelect={handleSelect}
            />
          );
        case 'analogy_card':
          return (
            <AnalogyCard 
              analogy={challenge.analogy || ""}
              correctAnswer={challenge.correctAnswer as string}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'scenario_quest':
          return (
            <ScenarioQuest 
              scenario={challenge.scenario || ''}
              studentRole={challenge.studentRole || ''}
              decisionPrompt={challenge.decisionPrompt || ''}
              options={challenge.scenarioOptions || []}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
            />
          );
        case 'rapid_fire':
          return (
            <RapidFire 
              questions={challenge.questions || []}
              onComplete={handleSelect}
              isChecked={isChecked}
            />
          );
        case 'before_after_exp':
          return (
            <BeforeAfterExperiment 
              conditionA={challenge.experiment?.conditionA || ""}
              conditionB={challenge.experiment?.conditionB || ""}
              reflectionQuestions={challenge.experiment?.reflectionQuestions || []}
              onSelect={handleSelect}
              isChecked={isChecked}
            />
          );
        case 'mystery_concept':
          return (
            <MysteryConcept 
              concept={challenge.mystery?.concept || ""}
              clues={challenge.mystery?.clues || []}
              hotKeywords={challenge.mystery?.hotKeywords || []}
              warmKeywords={challenge.mystery?.warmKeywords || []}
              onSelect={handleSelect}
              isChecked={isChecked}
            />
          );
        case 'step_debugger':
          return (
            <StepDebugger 
              processName={challenge.question || ""}
              steps={challenge.steps as any || []}
              onSelect={handleSelect}
              isChecked={isChecked}
            />
          );
        case 'argument_builder':
          return (
            <ArgumentBuilder 
              statement={challenge.argument?.statement || ""}
              cards={challenge.argument?.cards || []}
              onSelect={handleSelect}
              isChecked={isChecked}
            />
          );
        case 'link_builder':
          return (
            <LinkBuilder 
              centralConcept={challenge.linkBuilder?.centralConcept || ""}
              pool={challenge.linkBuilder?.pool || []}
              onSelect={handleSelect}
              isChecked={isChecked}
            />
          );
        case 'open_response':
          return (
            <OpenResponse 
              question={challenge.question}
              onSelect={handleSelect}
              isChecked={isChecked}
              value={selectedOption || ""}
            />
          );
        case 'tap_correct_area':
          return (
            <TapCorrectArea 
              imageUrl={challenge.imageUrl || ''}
              hotspots={challenge.hotspots || []}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'ai_tool_picker':
          return (
            <AIToolPicker 
              toolPicker={challenge.toolPicker || { situation: '', tools: [] }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'prompt_battle':
          return (
            <PromptBattle 
              promptBattle={challenge.promptBattle || { promptA: '', promptB: '', whyA: '', whyB: '', outcomeA: '', outcomeB: '', correctAnswer: 'A' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'before_after_ai':
          return (
            <BeforeAfterAI 
              beforeAfterAi={challenge.beforeAfterAi || { situation: '', beforeLabel: '', beforeContent: '', beforeMetric: '', afterLabel: '', afterContent: '', afterMetric: '', question: '', options: [], correctAnswer: '', whyInsight: '' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'ai_for_school':
          return (
            <AIForSchool 
              aiForSchool={challenge.aiForSchool || { scenario: '', approaches: [] }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'tool_match':
          return (
            <ToolMatch 
              toolMatch={challenge.toolMatch || { pairs: [] }}
              isChecked={isChecked}
              onSelect={handleSelect}
            />
          );
        case 'result_ranker':
          return (
            <ResultRanker 
              resultRanker={challenge.resultRanker || { prompt: '', outputs: [], rankType: '' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'prompt_fixer':
          return (
            <PromptFixer 
              promptFixer={challenge.promptFixer || { badPrompt: '', badFeedback: '', options: [], correctAnswer: '', improvedExplanation: '' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'ai_myth_fact':
          return (
            <AIMythFact 
              aiMythFact={challenge.aiMythFact || { statement: '', isFact: false, context: '' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'student_mission':
          return (
            <StudentMission 
              studentMission={challenge.studentMission || { mission: '', steps: [] }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'daily_life_ai':
          return (
            <DailyLifeAI 
              dailyLifeAi={challenge.dailyLifeAi || { scenario: '', appName: '', appEmoji: '', options: [], correctAnswer: '' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'ai_prediction':
          return (
            <AIPrediction 
              aiPrediction={challenge.aiPrediction || { promptUsed: '', targetScenario: '', choices: [], correctAnswer: '' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'which_output_better':
          return (
            <WhichOutputBetter 
              whichOutputBetter={challenge.whichOutputBetter || { prompt: '', optionA: { title: '', text: '', explanation: '' }, optionB: { title: '', text: '', explanation: '' }, betterOption: 'A', insight: '' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'ai_assistant_builder':
          return (
            <AIAssistantBuilder 
              aiAssistantBuilder={challenge.aiAssistantBuilder || { categories: [], outcomeExplanation: '' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
            />
          );
        case 'hidden_ai':
          return (
            <HiddenAI 
              hiddenAi={challenge.hiddenAi || { scene: '', areas: [] }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'meme_screen':
          return (
            <MemeScreen 
              memeScreen={challenge.memeScreen || { imageUrl: '', title: '', explanation: '' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
            />
          );
        case 'gif_explainer':
          return (
            <GIFExplainer 
              gifExplainer={challenge.gifExplainer || { gifUrl: '', title: '', explanation: '' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
            />
          );
        case 'comic_story':
          return (
            <ComicStory 
              comicStory={challenge.comicStory || { panels: [], takeaway: '' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
            />
          );
        case 'fun_fact':
          return (
            <FunFact 
              funFact={challenge.funFact || { headline: '', text: '' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
            />
          );
        case 'visual_analogy':
          return (
            <VisualAnalogy 
              visualAnalogy={challenge.visualAnalogy || { analogyTitle: '', conceptLeft: '', conceptRight: '', explanationLeft: '', explanationRight: '', mainExplanation: '' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
            />
          );
        case 'image_explainer':
          return (
            <ImageExplainer 
              imageExplainer={challenge.imageExplainer || { imageUrl: '' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
            />
          );
        case 'ai_around_you':
          return (
            <AIAroundYou 
              aiAroundYou={challenge.aiAroundYou || { examples: [] }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
            />
          );
        case 'myth_buster':
          return (
            <MythBuster 
              mythBuster={challenge.mythBuster || { statement: '', isFact: false, explanation: '' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'before_after_story':
          return (
            <BeforeAfterStory 
              beforeAfterStory={challenge.beforeAfterStory || { situation: '', beforeText: '', afterText: '', takeaway: '' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
            />
          );
        case 'student_story':
          return (
            <StudentStory 
              studentStory={challenge.studentStory || { avatar: '🧑‍🎓', studentName: '', scenario: '', outcome: '' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
            />
          );
        case 'interactive_reveal':
          return (
            <InteractiveReveal 
              interactiveReveal={challenge.interactiveReveal || { heading: '', steps: [] }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
            />
          );
        case 'why_should_i_care':
          return (
            <WhyShouldICare 
              whyShouldICare={challenge.whyShouldICare || { challenge: '', schoolCategory: '', benefitText: '' }}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
            />
          );
        case 'c1_multiple_choice':
          return (
            <TapRightAnswer 
              options={challenge.options || []}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
              correctAnswer={challenge.correctAnswer as string}
            />
          );
        case 'c2_fill_in_blank':
          return (
            <FillInBlank 
              sentence={challenge.question || ""}
              options={challenge.options || []}
              correctAnswer={challenge.correctAnswer as string}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
              isCorrect={isCorrect}
            />
          );
        case 'c3_sentence_builder':
          return (
            <BuildAConcept 
              targetSentence={challenge.targetSentence || ''}
              chipsCorrect={challenge.chipsCorrect || []}
              chipsDistractor={challenge.chipsDistractor || []}
              isChecked={isChecked}
              onSelect={handleSelect}
            />
          );
        case 'c4_concept_matcher':
          return (
            <MatchPairs 
              pairs={challenge.pairs || []}
              isChecked={isChecked}
              onSelect={handleSelect}
            />
          );
        case 'c5_bucket_sort':
          return (
            <DragAndDrop 
              buckets={challenge.buckets || []}
              items={challenge.items as any || []}
              isChecked={isChecked}
              onSelect={handleSelect}
            />
          );
        case 'c6_timeline_sort':
          return (
            <SortSequence 
              steps={challenge.steps || []}
              correctOrder={challenge.correctOrder || []}
              isChecked={isChecked}
              onSelect={handleSelect}
            />
          );
        case 'c7_sequence_builder':
          return (
            <C7SequenceBuilder 
              steps={challenge.steps || []}
              correctOrder={challenge.correctOrder || []}
              isChecked={isChecked}
              onSelect={handleSelect}
            />
          );
        case 'c8_tap_correct_object':
          return (
            <C8TapCorrectObject 
              question={challenge.question || ""}
              options={challenge.options || []}
              correctAnswer={challenge.correctAnswer || ''}
              isChecked={isChecked}
              isCorrect={isCorrect}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              items={challenge.items || (challenge as any).images}
            />
          );
        case 'c9_true_false':
          return (
            <C9TrueFalse 
              correctAnswer={challenge.correctAnswer || ''}
              isChecked={isChecked}
              isCorrect={isCorrect}
              onSelect={handleSelect}
              selectedOption={selectedOption}
            />
          );
        case 'c10_swipe_left_right':
          return (
            <C10SwipeLeftRight 
              question={challenge.question || ""}
              correctAnswer={challenge.correctAnswer || ''}
              isChecked={isChecked}
              isCorrect={isCorrect}
              onSelect={handleSelect}
              selectedOption={selectedOption}
            />
          );
        case 'c11_image_classification':
          return (
            <C11ImageClassification 
              items={challenge.items as any || []}
              buckets={challenge.buckets || []}
              isChecked={isChecked}
              onSelect={handleSelect}
            />
          );
        case 'c12_label_diagram':
          return (
            <C12LabelDiagram 
              imageUrl={challenge.imageUrl || ''}
              hotspots={challenge.hotspots || []}
              items={challenge.items as any || []}
              isChecked={isChecked}
              onSelect={handleSelect}
            />
          );
        case 'c13_hotspot_question':
          return (
            <C13HotspotQuestion 
              imageUrl={challenge.imageUrl || ''}
              hotspots={challenge.hotspots || []}
              isChecked={isChecked}
              isCorrect={isCorrect}
              onSelect={handleSelect}
              selectedOption={selectedOption}
            />
          );
        case 'c14_memory_flip_cards':
          return (
            <MemoryFlipCards 
              cards={challenge.cards || []}
              isChecked={isChecked}
              onSelect={handleSelect}
            />
          );
        case 'c15_drag_complete_diagram':
          return (
            <C15DragToCompleteDiagram 
              steps={challenge.steps || []}
              options={challenge.options || []}
              correctAnswer={challenge.correctAnswer || ''}
              isChecked={isChecked}
              isCorrect={isCorrect}
              onSelect={handleSelect}
              selectedOption={selectedOption}
            />
          );
        case 'c16_eliminate_wrong':
          return (
            <C16EliminateWrongAnswers 
              question={challenge.question || ""}
              options={challenge.options as any || []}
              isChecked={isChecked}
              onSelect={handleSelect}
            />
          );
        case 'c17_arrange_images':
          return (
            <C17ArrangeImages 
              items={challenge.items as any || []}
              correctOrder={challenge.correctOrder || []}
              isChecked={isChecked}
              onSelect={handleSelect}
            />
          );
        case 'c18_audio_quiz':
          return (
            <C18AudioQuiz 
              audioUrl={challenge.audioUrl}
              options={challenge.options || []}
              correctAnswer={challenge.correctAnswer || ''}
              isChecked={isChecked}
              isCorrect={isCorrect}
              onSelect={handleSelect}
              selectedOption={selectedOption}
            />
          );
        case 'content_screen':
        case 'visual_lesson_screen': {
          const data = challenge.contentScreen || challenge.visualLessonScreen || {
            badge: '⚡ Interactive Lesson',
            heading: 'Understanding AI Concepts',
            subheading: 'Learn how to consume high performance tutorials seamlessly.',
            contentBody: '• This is an inline bullet item.\n• Highly configurable and responsive screen.\nEverything is optional style! Try toggling inputs.',
            highlightBox: 'Pro Tip: Customize this in the form below.',
            quote: 'This content screen simplifies lesson storytelling.',
            quoteAuthor: 'Aibo Copilot',
            bottomMessage: 'Next up: interactive challenge!'
          };
          return (
            <VisualLessonScreen
              contentData={data}
              onSelect={handleSelect}
              selectedOption={selectedOption}
              isChecked={isChecked}
            />
          );
        }
        default:
          return (
            <div className="p-6 text-center border border-dashed border-slate-200 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-400">Previewing style standard layout</span>
            </div>
          );
            }
          })()}
        </Suspense>
      );
    } catch (err: any) {
      console.error(err);
      return (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          <strong>Render Error:</strong> Ensure you complete all required forms for {challenge.type} layout inside your configurator!
        </div>
      );
    }
  };

  if (showSuccess) {
    return (
      <div className="bg-[#e8fbf0] text-slate-800 rounded-2xl border-2 border-emerald-250 overflow-hidden shadow-xl max-w-full my-3 min-h-[480px] flex flex-col justify-between p-6">
        <div className="space-y-6 flex flex-col items-center py-4 text-center">
          <motion.div 
            initial={{ scale: 0.8, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            className="w-20 h-20 bg-[#86faac] rounded-[2rem] flex items-center justify-center shadow-lg border-4 border-white relative shrink-0"
          >
            <Trophy className="w-10 h-10 text-emerald-700" />
          </motion.div>

          <div className="space-y-1">
            <h2 className="text-2xl font-display font-black text-emerald-800 leading-tight">
              Screen Walkthrough Complete!
            </h2>
            <p className="text-[#3b6447] font-bold text-xs px-2">
              This simulator mimics exactly how students experience and master the live interactive module!
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            <div className="bg-white p-3 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center shadow-sm">
              <Star className="text-emerald-500 fill-emerald-500 w-5 h-5 mb-0.5" />
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider text-center">XP Reward</p>
              <p className="text-xs font-display font-black text-emerald-600">+10 XP</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center shadow-sm">
              <Zap className="text-amber-500 fill-amber-500 w-5 h-5 mb-0.5" />
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider text-center">Status</p>
              <p className="text-xs font-display font-black text-emerald-600">PASSED</p>
            </div>
          </div>

          {/* Interactive Rating Picker */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-100 w-full space-y-2.5 shadow-sm max-w-xs">
            <h4 className="text-[10px] font-black uppercase text-emerald-800 tracking-wider text-center">
              Student experience difficulty:
            </h4>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((index) => {
                const isSelected = userRating !== null && index <= userRating;
                const emoji = index === 1 ? '😢' : index === 2 ? '😕' : index === 3 ? '😐' : index === 4 ? '🙂' : '😎';
                return (
                  <button
                    key={`difficulty-rating-${index}`}
                    onClick={() => {
                      setUserRating(index);
                      soundManager.play('click');
                    }}
                    className={`text-xl transition-transform active:scale-130 hover:scale-110 cursor-pointer ${
                      userRating !== null && userRating === index ? 'scale-125 saturate-150' : 'opacity-85'
                    }`}
                  >
                    <span>{emoji}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-100 w-full space-y-1 shadow-sm max-w-xs text-left">
            <h4 className="text-[9px] font-black uppercase text-emerald-800 tracking-wider">
              Reflection Note:
            </h4>
            <textarea
              placeholder="Test kid responses or save sandbox notes..."
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              className="w-full text-xs font-bold p-2 h-12 rounded-xl border border-slate-100 outline-none bg-slate-50 focus:bg-white resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleReset}
          className="btn-3d btn-3d-green w-full py-4 text-base uppercase tracking-wider shadow-[0_5px_0_#059669]"
        >
          Replay Exercise Option
        </button>
      </div>
    );
  }

  return (
    <div className="relative bg-white text-slate-800 rounded-3xl border-2 border-slate-250 overflow-hidden shadow-2xl max-w-full my-3 min-h-[500px] flex flex-col justify-between">
      {/* Top Bar simulating student device */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-mono tracking-wider uppercase font-black text-slate-400">
            Student UI Sandbox
          </span>
        </div>
        
        {/* Mock progress bar */}
        <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-aibo-blue-500 rounded-full transition-all duration-300" 
            style={{ width: isChecked ? '100%' : '50%' }}
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
            Preview Run
          </span>
        </div>
      </div>

      {/* Explanation Overlay */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className={`absolute inset-0 z-[50] flex flex-col p-6 overflow-y-auto ${
              isCorrect ? 'bg-gradient-to-b from-[#e8fbf0] to-white' : 'bg-gradient-to-b from-rose-50 to-white'
            }`}
          >
            <div className="max-w-md mx-auto w-full flex flex-col justify-between h-full py-2 space-y-4 text-slate-800">
              <div className="space-y-4 text-center">
                {/* Header Status & Emojis */}
                <div className="flex flex-col items-center space-y-2">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${
                    isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}>
                    {isCorrect ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                  </div>
                  <h2 className={`text-2xl font-display font-black leading-tight ${
                    isCorrect ? 'text-emerald-800' : 'text-rose-800'
                  }`}>
                    {isCorrect ? 'Awesome! Correct' : 'Not Quite Right'}
                  </h2>
                </div>

                {/* XP Banner */}
                <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400">XP Reward</span>
                  <span className="text-xs font-display font-black text-pink-500">
                    +10 XP 🎉
                  </span>
                </div>

                {/* One-Line Explanation */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2 text-left">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block text-center">LEARNING INSIGHT</span>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed text-center whitespace-pre-wrap">
                    {((typeof challenge.explanation === 'object' && challenge.explanation !== null
                      ? challenge.explanation.text
                      : challenge.explanation) || "Every core technology can be visualised simply and interactively to students!") as string}
                  </p>
                </div>

                {/* Visual Display */}
                <div className="flex justify-center p-1">
                  {challenge.imageUrl ? (
                    <img
                      src={challenge.imageUrl}
                      alt="Visual Example"
                      referrerPolicy="no-referrer"
                      className="w-full max-w-[150px] h-24 object-cover rounded-xl border-2 border-white shadow-sm"
                    />
                  ) : (
                    <span className="text-3xl text-center block animate-bounce">
                      {isCorrect ? '🌟🧠🚀' : '💡💡🛠️'}
                    </span>
                  )}
                </div>
              </div>

              {/* Incorrect Answer Box */}
              {!isCorrect && challenge.correctAnswer && (
                <div className="bg-rose-500 text-white shadow-sm rounded-xl p-3 text-center">
                  <span className="text-[8px] font-black uppercase tracking-widest block opacity-75 mb-0.5">CORRECT ANSWER</span>
                  <p className="text-xs font-display font-black leading-tight">
                    {typeof challenge.correctAnswer === 'object' 
                      ? Array.isArray(challenge.correctAnswer)
                        ? challenge.correctAnswer.join(', ')
                        : JSON.stringify(challenge.correctAnswer)
                      : String(challenge.correctAnswer)
                    }
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  setShowExplanation(false);
                  soundManager.play('click');
                }}
                className={`btn-3d w-full py-3 text-sm uppercase tracking-wider ${
                  isCorrect ? 'btn-3d-green' : 'btn-3d-red'
                }`}
              >
                Got it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main question and exercise body */}
      <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="text-[9px] bg-slate-100 text-slate-600 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-slate-200">
            {challenge.type.replace(/_/g, ' ')}
          </span>
          <h2 className="text-xl font-display font-black text-gray-800 leading-tight">
            {challenge.question}
          </h2>
        </div>

        <div className="py-2">
          {renderExercise()}
        </div>
      </div>

      {/* Interactive Bottom Check Panel */}
      <div className={`p-5 border-t-2 transition-colors duration-300 ${
        !isChecked ? 'bg-white border-slate-100' : isCorrect ? 'bg-green-100 border-green-250' : 'bg-red-100 border-red-250'
      }`}>
        <div className="flex flex-col gap-3">
          {isChecked && (
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-7 h-7 text-rose-600 shrink-0" />
              )}
              <div>
                <h4 className={`font-display font-black text-base ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isCorrect ? 'Well Done!' : 'Not Quite Right'}
                </h4>
                <button 
                  onClick={() => {
                    setShowExplanation(true);
                    soundManager.play('click');
                  }}
                  className={`text-[11px] font-black uppercase tracking-wider underline underline-offset-4 mt-0.5 ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}
                >
                  Explain my answer
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={isChecked ? handleContinue : handleCheck}
              disabled={selectedOption === null && !['spot_the_ai', 'rapid_fire'].includes(challenge?.type)}
              className={`btn-3d w-full py-3.5 text-base uppercase tracking-wider ${
                selectedOption === null && !['spot_the_ai', 'rapid_fire'].includes(challenge?.type)
                  ? 'bg-slate-200 text-slate-400 shadow-[0_4px_0_#CBD5E1] cursor-not-allowed' 
                  : isChecked 
                    ? isCorrect 
                      ? 'btn-3d-green' 
                      : 'btn-3d-red'
                    : 'btn-3d-blue'
              }`}
            >
              {isChecked ? 'Continue' : 'Check'}
            </button>
            {isChecked && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-3 bg-slate-100 border border-slate-250 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-xl transition-all uppercase tracking-wider shrink-0 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function cleanEntityForExport(type: 'screen' | 'lesson' | 'unit' | 'world', data: any): any {
  if (type === 'screen') {
    const { id, created_at, updated_at, createdAt, updatedAt, ...rest } = data;
    return rest;
  }
  
  if (type === 'lesson') {
    return {
      lessonTitle: data.title,
      lessonDescription: data.description || '',
      difficulty: data.difficulty || 'Easy',
      xp: data.xpReward || 50,
      isChallenge: data.isChallenge,
      isChest: data.isChest,
      isBonus: data.isBonus,
      category: data.category || 'Cosmos Era',
      screens: (data.challenges || []).map((c: any) => cleanEntityForExport('screen', c))
    };
  }

  if (type === 'unit') {
    return {
      unitTitle: data.title || data.unitTitle || 'Unit',
      unitDescription: data.description || data.unitDescription || '',
      difficulty: data.difficulty || 'Easy',
      world_id: data.world_id || '256e5b30-e5ec-45ba-a024-7318c96eb623',
      lessons: (data.lessons || []).map((l: any) => cleanEntityForExport('lesson', l))
    };
  }

  if (type === 'world') {
    const worldUnits = data.units || [];
    return {
      worldId: data.id || data.worldId || 'world_1',
      worldNumber: data.world_number || data.worldNumber || 1,
      worldTitle: data.title || data.worldTitle || 'World',
      worldDescription: data.description || data.worldDescription || '',
      units: worldUnits.map((u: any) => cleanEntityForExport('unit', u))
    };
  }
  return data;
}

function validateWorld(world: any): string[] {
  const errors: string[] = [];
  const prefix = 'World';
  if (!world) {
    errors.push(`${prefix}: Empty or invalid world object`);
    return errors;
  }
  if (!world.worldTitle && !world.title) {
    errors.push(`${prefix}: Missing field "worldTitle"`);
  }
  const units = world.units;
  if (!units) {
    errors.push(`${prefix}: Missing units array`);
  } else if (!Array.isArray(units)) {
    errors.push(`${prefix}: Field "units" must be an array`);
  } else {
    if (units.length === 0) {
      errors.push(`${prefix}: Units array cannot be empty`);
    }
    units.forEach((u: any, uIdx: number) => {
      const uErrors = validateUnit(u);
      uErrors.forEach(err => errors.push(`${prefix} -> Unit ${uIdx + 1}: ${err}`));
    });
  }
  return errors;
}

function validateScreen(screen: any, index?: number): string[] {
  const errors: string[] = [];
  const prefix = index !== undefined ? `Screen ${index + 1}` : 'Screen';
  
  if (!screen) {
    errors.push(`${prefix}: Empty or invalid screen object`);
    return errors;
  }
  
  const VALID_SCREEN_TYPES = [
    'story', 'concept', 'mcq', 'fill_blank', 'sentence_builder', 'sorting', 'discard', 'match_pair', 'drag_drop', 'image_choice', 'reward',
    'content_screen', 'visual_lesson_screen', 'tap_right_answer', 'image_reveal', 'fill_in_blank', 'ai_vs_human', 'spot_the_ai', 'drag_and_drop', 'sort_sequence', 'match_pairs', 'build_concept',
    'c1_multiple_choice', 'c2_fill_in_blank', 'c3_sentence_builder', 'c4_concept_matcher', 'c5_bucket_sort', 'c6_timeline_sort', 'c7_sequence_builder', 'c8_tap_correct_object', 'c9_true_false', 'c10_swipe_left_right', 'c11_image_classification', 'c12_label_diagram', 'c13_hotspot_question', 'c14_memory_flip_cards', 'c15_drag_complete_diagram', 'c16_eliminate_wrong', 'c17_arrange_images', 'c18_audio_quiz'
  ];

  if (!screen.type) {
    errors.push(`${prefix}: Missing field "type"`);
  } else if (typeof screen.type !== 'string') {
    errors.push(`${prefix}: Field "type" must be a string`);
  } else if (!VALID_SCREEN_TYPES.includes(screen.type)) {
    errors.push(`${prefix}: Invalid screen type "${screen.type}"`);
  }
  
  const mcqTypes = ['mcq', 'tap_right_answer', 'c1_multiple_choice', 'tap_correct_area', 'image_choice', 'c8_tap_correct_object'];
  if (screen.type && mcqTypes.includes(screen.type)) {
    const options = screen.options;
    if (!options) {
      errors.push(`${prefix}: Missing field "options" for multiple choice screen`);
    } else if (!Array.isArray(options)) {
      errors.push(`${prefix}: Field "options" must be an array`);
    } else {
      if (options.length < 2) {
        errors.push(`${prefix}: Options count must be at least 2`);
      }
      if (screen.correctAnswer === undefined || screen.correctAnswer === null || screen.correctAnswer === '') {
        errors.push(`${prefix}: Missing field "correctAnswer"`);
      } else {
        const optionTexts = options.map((opt: any) => {
          if (typeof opt === 'string') return opt;
          if (opt && typeof opt === 'object') return opt.text || opt.label || '';
          return '';
        });
        const hasCorrect = optionTexts.some((t: string) => t.toLowerCase().trim() === String(screen.correctAnswer).toLowerCase().trim());
        if (!hasCorrect) {
          errors.push(`${prefix}: correctAnswer "${screen.correctAnswer}" does not exist in options list [${optionTexts.join(', ')}]`);
        }
      }
    }
  }

  if (screen.imageUrl && typeof screen.imageUrl === 'string') {
    if (!screen.imageUrl.startsWith('http') && !screen.imageUrl.startsWith('/')) {
      errors.push(`${prefix}: Field "imageUrl" must be a valid absolute or relative URL`);
    }
  }
  if (screen.mediaUrl && typeof screen.mediaUrl === 'string') {
    if (!screen.mediaUrl.startsWith('http') && !screen.mediaUrl.startsWith('/')) {
      errors.push(`${prefix}: Field "mediaUrl" must be a valid absolute or relative URL`);
    }
  }
  if (Array.isArray(screen.items)) {
    screen.items.forEach((item: any, itemIdx: number) => {
      if (item && item.imageUrl && typeof item.imageUrl === 'string') {
        if (!item.imageUrl.startsWith('http') && !item.imageUrl.startsWith('/')) {
          errors.push(`${prefix}: Item ${itemIdx + 1} imageUrl must be a valid absolute or relative URL`);
        }
      }
    });
  }

  return errors;
}

function validateLesson(lesson: any, index?: number): string[] {
  const errors: string[] = [];
  const prefix = index !== undefined ? `Lesson ${index + 1}` : 'Lesson';
  
  if (!lesson) {
    errors.push(`${prefix}: Empty or invalid lesson object`);
    return errors;
  }
  
  if (!lesson.lessonTitle && !lesson.title) {
    errors.push(`${prefix}: Missing field "lessonTitle"`);
  }
  
  const screens = lesson.screens || lesson.challenges;
  if (!screens) {
    errors.push(`${prefix}: Missing screens or challenges array`);
  } else if (!Array.isArray(screens)) {
    errors.push(`${prefix}: Field "screens" / "challenges" must be an array`);
  } else {
    if (screens.length === 0) {
      errors.push(`${prefix}: Screens array cannot be empty`);
    }
    screens.forEach((scr: any, scrIdx: number) => {
      const scrErrors = validateScreen(scr, scrIdx);
      scrErrors.forEach(err => {
        errors.push(`${prefix} -> ${err}`);
      });
    });
  }
  
  return errors;
}

function validateUnit(unit: any): string[] {
  const errors: string[] = [];
  const prefix = 'Unit';
  
  if (!unit) {
    errors.push(`${prefix}: Empty or invalid unit object`);
    return errors;
  }
  
  if (!unit.unitTitle && !unit.title) {
    errors.push(`${prefix}: Missing field "unitTitle"`);
  }
  
  const lessons = unit.lessons;
  if (!lessons) {
    errors.push(`${prefix}: Missing lessons array`);
  } else if (!Array.isArray(lessons)) {
    errors.push(`${prefix}: Field "lessons" must be an array`);
  } else {
    if (lessons.length === 0) {
      errors.push(`${prefix}: Lessons array cannot be empty`);
    }
    lessons.forEach((les: any, lesIdx: number) => {
      const lesErrors = validateLesson(les, lesIdx);
      lesErrors.forEach(err => {
        errors.push(`${prefix} -> ${err}`);
      });
    });
  }
  
  return errors;
}

interface AdminPanelProps {
  onClose: () => void;
  currentUserEmail: string;
  isDbAdmin: boolean;
  onProfileUpdated?: (email: string, updates: Partial<SupabaseUserProfile>) => void;
}

export default function AdminPanel({ onClose, currentUserEmail, isDbAdmin, onProfileUpdated }: AdminPanelProps) {
  // Curriculum status state
  const [modulesList, setModulesList] = useState<Module[]>([]);
  const [practiceModulesList, setPracticeModulesList] = useState<Module[]>([]);
  const [curriculumSyncStatus, setCurriculumSyncStatus] = useState<CurriculumSyncStatus>(getCurriculumSyncStatus());

  useEffect(() => {
    return subscribeCurriculumSyncStatus((status) => {
      setCurriculumSyncStatus(status);
    });
  }, []);

  // Custom confirmation modal state to bypass browser default prompt blocks
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      }
    });
  };

  // JSON Import Feature State
  const [showJsonImportModal, setShowJsonImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importValidationErrors, setImportValidationErrors] = useState<string[]>([]);
  const [importDetectedLevel, setImportDetectedLevel] = useState<'screen' | 'lesson' | 'unit' | 'world' | null>(null);
  const [importPreviewData, setImportPreviewData] = useState<any>(null);
  const [importTargetUnitId, setImportTargetUnitId] = useState<string>('');
  const [importTargetLessonId, setImportTargetLessonId] = useState<string>('');
  const [importTargetWorldId, setImportTargetWorldId] = useState<string>('world_1');
  const [importTargetIsPractice, setImportTargetIsPractice] = useState<boolean>(false);
  const [openLessonMenuId, setOpenLessonMenuId] = useState<string | null>(null);

  const openImportModal = (options?: { level?: 'unit' | 'lesson' | 'screen' | 'world'; unitId?: string; lessonId?: string; worldId?: string; isPractice?: boolean }) => {
    const targetLevel = options?.level || null;
    const targetWorld = options?.worldId || selectedAdminWorldId || 'world_1';
    const targetUnit = options?.unitId || selectedModuleId || (modulesList[0]?.id || '');
    const targetLesson = options?.lessonId || selectedLessonId || '';
    const isPractice = options?.isPractice ?? false;

    setImportValidationErrors([]);
    setImportPreviewData(null);
    setImportDetectedLevel(targetLevel);
    setImportTargetWorldId(targetWorld);
    setImportTargetUnitId(targetUnit);
    setImportTargetLessonId(targetLesson);
    setImportTargetIsPractice(isPractice);

    if (targetLevel === 'unit') {
      const template = {
        unitTitle: "Quantum Computing Fundamentals",
        unitDescription: "Master qubits, superposition, and quantum algorithms with Chikoo.",
        difficulty: "Easy",
        world_id: targetWorld,
        lessons: [
          {
            lessonTitle: "Introduction to Qubits",
            lessonDescription: "Discover how quantum bits differ from classical bits.",
            difficulty: "Easy",
            xp: 50,
            category: "Quantum Core",
            screens: [
              {
                type: "concept",
                heading: "What is a Qubit?",
                subheading: "The basic building block of quantum computing",
                contentBody: "Unlike classical bits that are strictly 0 or 1, qubits can exist in a superposition of both states simultaneously!",
                badge: "🌌 Quantum Core"
              },
              {
                type: "mcq",
                question: "What special property allows a qubit to represent multiple states at once?",
                options: ["Superposition", "Gravitational Pull", "Digital Friction", "Clock Speed"],
                correctAnswer: "Superposition",
                explanation: "Superposition allows quantum particles to represent multiple states until measured!"
              }
            ]
          }
        ]
      };
      const formatted = JSON.stringify(template, null, 2);
      setImportJsonText(formatted);
      handleValidateAndPreview(formatted);
    } else if (targetLevel === 'lesson') {
      const template = {
        lessonTitle: "Neural Networks Deep Dive",
        lessonDescription: "Understand artificial neurons and deep learning layers.",
        difficulty: "Easy",
        xp: 50,
        category: "AI Architecture",
        screens: [
          {
            type: "concept",
            heading: "Artificial Neurons",
            subheading: "How machines mimic brain synapses",
            contentBody: "Deep learning models chain together thousands of interconnected neuron weights to spot patterns!",
            badge: "🧠 Deep Learning"
          },
          {
            type: "mcq",
            question: "What connects layers of artificial neurons?",
            options: ["Weights & Biases", "Electric Cables", "Hydraulic Valves", "Copper Gears"],
            correctAnswer: "Weights & Biases",
            explanation: "Weights and biases adjust how signals propagate across neural network layers!"
          }
        ]
      };
      const formatted = JSON.stringify(template, null, 2);
      setImportJsonText(formatted);
      handleValidateAndPreview(formatted);
    } else {
      setImportJsonText('');
    }

    setShowJsonImportModal(true);
    soundManager.play('click');
  };

  const exportLessonAsJsonFile = (lesson: any) => {
    const cleanJson = cleanEntityForExport('lesson', lesson);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanJson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const filename = (lesson.title || 'lesson').toLowerCase().replace(/[^a-z0-9]+/g, '_') + '.json';
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerNotification("Lesson JSON file downloaded!", "success");
    soundManager.play('complete');
  };

  const copyLessonJsonToClipboard = (lesson: any) => {
    const cleanJson = cleanEntityForExport('lesson', lesson);
    navigator.clipboard.writeText(JSON.stringify(cleanJson, null, 2));
    triggerNotification("Lesson JSON copied to clipboard!", "success");
    soundManager.play('complete');
  };

  const exportUnitAsJsonFile = (unit: any) => {
    const cleanJson = cleanEntityForExport('unit', unit);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanJson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const unitName = (cleanJson.unitTitle || unit.title || 'unit').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const filename = `${unitName}.json`;
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerNotification(`Unit JSON downloaded (${cleanJson.lessons?.length || 0} lessons)!`, "success");
    soundManager.play('complete');
  };

  const copyUnitJsonToClipboard = (unit: any) => {
    const cleanJson = cleanEntityForExport('unit', unit);
    navigator.clipboard.writeText(JSON.stringify(cleanJson, null, 2));
    triggerNotification(`Unit JSON copied to clipboard (${cleanJson.lessons?.length || 0} lessons)!`, "success");
    soundManager.play('complete');
  };

  const getWorldExportData = (world: any) => {
    const currentWorldObj = typeof world === 'string' ? adminWorlds.find(w => w.id === world) : (world?.id ? world : null);
    const targetWorldId = currentWorldObj?.id || world?.id || (typeof world === 'string' ? world : selectedAdminWorldId);
    const targetWorldObj = currentWorldObj || adminWorlds.find(w => w.id === targetWorldId) || {
      id: targetWorldId || 'world_1',
      world_number: 1,
      title: targetWorldId === 'world_1' ? 'World 1: AI Foundations' : 'World',
      description: ''
    };
    const isW1 = targetWorldId === 'world_1' || targetWorldObj.world_number === 1;

    const worldUnits = [...modulesList, ...practiceModulesList].filter(m => {
      if (m.world_id === targetWorldId) return true;
      if (isW1) return !m.world_id || m.world_id === 'world_1' || m.world_id === targetWorldId;
      return false;
    });

    return cleanEntityForExport('world', {
      ...targetWorldObj,
      units: worldUnits
    });
  };

  const exportWorldAsJsonFile = (world: any) => {
    const cleanJson = getWorldExportData(world);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanJson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const worldName = (cleanJson.worldTitle || 'world').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const filename = `${worldName}_units.json`;
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerNotification(`World & Units JSON downloaded (${cleanJson.units?.length || 0} units)!`, "success");
    soundManager.play('complete');
  };

  const copyWorldJsonToClipboard = (world: any) => {
    const cleanJson = getWorldExportData(world);
    navigator.clipboard.writeText(JSON.stringify(cleanJson, null, 2));
    triggerNotification(`Copied entire World JSON (${cleanJson.units?.length || 0} units) to clipboard!`, "success");
    soundManager.play('complete');
  };

  const handleDuplicateLesson = (moduleId: string, lesson: Lesson) => curriculumHook.handleDuplicateLesson(moduleId, lesson);

  const handleValidateAndPreview = (text: string) => {
    setImportJsonText(text);
    if (!text.trim()) {
      setImportValidationErrors([]);
      setImportDetectedLevel(null);
      setImportPreviewData(null);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      
      let level: 'screen' | 'lesson' | 'unit' | 'world' | null = null;
      let errors: string[] = [];

      if (parsed.worldTitle !== undefined || (parsed.units !== undefined && Array.isArray(parsed.units))) {
        level = 'world';
        errors = validateWorld(parsed);
      } else if (parsed.unitTitle !== undefined || parsed.lessons !== undefined) {
        level = 'unit';
        errors = validateUnit(parsed);
      } else if (parsed.lessonTitle !== undefined || parsed.screens !== undefined || parsed.challenges !== undefined) {
        level = 'lesson';
        errors = validateLesson(parsed);
      } else if (parsed.type !== undefined) {
        level = 'screen';
        errors = validateScreen(parsed);
      } else {
        errors = ["Could not auto-detect JSON Level. Ensure your JSON contains 'worldTitle' for Worlds, 'unitTitle' for Units, 'lessonTitle' for Lessons, or 'type' for Screens."];
      }

      setImportDetectedLevel(level);
      setImportValidationErrors(errors);
      setImportPreviewData(parsed);

      if (parsed.world_id) {
        setImportTargetWorldId(parsed.world_id);
      }

      if (level === 'lesson' && !importTargetUnitId) {
        setImportTargetUnitId(selectedModuleId || (modulesList[0]?.id || ''));
      }
      if (level === 'screen') {
        if (!importTargetUnitId) {
          setImportTargetUnitId(selectedModuleId || (modulesList[0]?.id || ''));
        }
        if (!importTargetLessonId) {
          const activeModObj = [...modulesList, ...practiceModulesList].find(m => m.id === (selectedModuleId || importTargetUnitId));
          setImportTargetLessonId(selectedLessonId || (activeModObj?.lessons[0]?.id || ''));
        }
      }

    } catch (e: any) {
      setImportDetectedLevel(null);
      setImportValidationErrors([`Malformed JSON: ${e.message}`]);
      setImportPreviewData(null);
    }
  };

  const handleImportJson = () => {
    if (!importPreviewData) return;
    if (importValidationErrors.length > 0) {
      triggerNotification("Cannot import. Please resolve validation errors first.", "error");
      soundManager.play('click');
      return;
    }

    const updatedAi = [...modulesList];
    const updatedPrac = [...practiceModulesList];

    if (importDetectedLevel === 'screen') {
      const targetUnitId = importTargetUnitId || selectedModuleId;
      const targetLesId = importTargetLessonId || selectedLessonId;

      if (!targetUnitId || !targetLesId) {
        triggerNotification("Please select a target Unit and Lesson to import this screen.", "error");
        return;
      }

      const mappedScr = mapScreenDataForImport(importPreviewData);
      const newScreen: Challenge = {
        ...mappedScr,
        id: 'scr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
      };

      const addToLessons = (lessons: Lesson[]) => lessons.map(l => {
        if (l.id === targetLesId) {
          return { ...l, challenges: [...(l.challenges || []), newScreen] };
        }
        return l;
      });

      const updatedAiFinal = updatedAi.map(m => m.id === targetUnitId ? { ...m, lessons: addToLessons(m.lessons) } : m);
      const updatedPracFinal = updatedPrac.map(m => m.id === targetUnitId ? { ...m, lessons: addToLessons(m.lessons) } : m);

      setModulesList(updatedAiFinal);
      setPracticeModulesList(updatedPracFinal);
      saveCurriculumToStorage(updatedAiFinal, updatedPracFinal);
      setRawJsonText(JSON.stringify({ spaceCurriculum: updatedAiFinal, practiceCurriculum: updatedPracFinal }, null, 2));

      setSelectedModuleId(targetUnitId);
      setSelectedLessonId(targetLesId);
      selectChallengeForEditing(targetUnitId, targetLesId, newScreen);
      triggerNotification("Successfully imported screen!", "success");

    } else if (importDetectedLevel === 'lesson') {
      const targetUnitId = importTargetUnitId || selectedModuleId;
      if (!targetUnitId) {
        triggerNotification("Please select a target Unit to import this lesson.", "error");
        return;
      }

      const screensSrc = importPreviewData.screens || importPreviewData.challenges || [];
      const mappedChallenges: Challenge[] = screensSrc.map((scr: any, idx: number) => {
        const mappedScr = mapScreenDataForImport(scr);
        return {
          ...mappedScr,
          id: 'scr_' + (Date.now() + idx) + '_' + Math.random().toString(36).slice(2, 7)
        };
      });

      const newLessonId = 'les_' + Date.now().toString().slice(-6);
      const newLesson: Lesson = {
        id: newLessonId,
        title: importPreviewData.lessonTitle || importPreviewData.title || 'Imported Lesson',
        description: importPreviewData.lessonDescription || importPreviewData.description || '',
        difficulty: importPreviewData.difficulty || 'Easy',
        xpReward: Number(importPreviewData.xp || importPreviewData.xpReward || 50),
        isChallenge: importPreviewData.isChallenge,
        isChest: importPreviewData.isChest,
        isBonus: importPreviewData.isBonus,
        category: importPreviewData.category || 'Cosmos Era',
        challenges: mappedChallenges
      };

      const addToModules = (mods: Module[]) => mods.map(m => {
        if (m.id === targetUnitId) {
          return { ...m, lessons: [...(m.lessons || []), newLesson] };
        }
        return m;
      });

      const updatedAiFinal = addToModules(updatedAi);
      const updatedPracFinal = addToModules(updatedPrac);

      setModulesList(updatedAiFinal);
      setPracticeModulesList(updatedPracFinal);
      saveCurriculumToStorage(updatedAiFinal, updatedPracFinal);
      setRawJsonText(JSON.stringify({ spaceCurriculum: updatedAiFinal, practiceCurriculum: updatedPracFinal }, null, 2));

      setSelectedModuleId(targetUnitId);
      setSelectedLessonId(newLessonId);
      setChalId('');
      triggerNotification("Successfully imported lesson!", "success");

    } else if (importDetectedLevel === 'unit') {
      const newUnitId = 'mod_' + Date.now().toString().slice(-6);
      const chosenWorldId = importTargetWorldId || importPreviewData.world_id || selectedAdminWorldId || 'world_1';
      
      const mappedLessons: Lesson[] = (importPreviewData.lessons || []).map((les: any, lesIdx: number) => {
        const screensSrc = les.screens || les.challenges || [];
        const mappedChallenges: Challenge[] = screensSrc.map((scr: any, scrIdx: number) => ({
          ...mapScreenDataForImport(scr),
          id: 'scr_' + (Date.now() + lesIdx * 100 + scrIdx) + '_' + Math.random().toString(36).slice(2, 7)
        }));

        return {
          id: 'les_' + (Date.now() + lesIdx).toString().slice(-6),
          title: les.lessonTitle || les.title || `Lesson ${lesIdx + 1}`,
          description: les.lessonDescription || les.description || '',
          difficulty: les.difficulty || 'Easy',
          xpReward: Number(les.xp || les.xpReward || 50),
          isChallenge: les.isChallenge,
          isChest: les.isChest,
          isBonus: les.isBonus,
          category: les.category || 'Cosmos Era',
          challenges: mappedChallenges
        };
      });

      const newUnit: Module = {
        id: newUnitId,
        order: importTargetIsPractice ? updatedPrac.length : updatedAi.length,
        sort_order: importTargetIsPractice ? updatedPrac.length : updatedAi.length,
        title: importPreviewData.unitTitle || importPreviewData.title || 'Imported Unit',
        description: importPreviewData.unitDescription || importPreviewData.description || '',
        difficulty: importPreviewData.difficulty || 'Easy',
        world_id: chosenWorldId,
        lessons: mappedLessons
      };

      if (importTargetIsPractice) {
        updatedPrac.push(newUnit);
      } else {
        updatedAi.push(newUnit);
      }

      setModulesList(updatedAi);
      setPracticeModulesList(updatedPrac);
      saveCurriculumToStorage(updatedAi, updatedPrac);
      setRawJsonText(JSON.stringify({ spaceCurriculum: updatedAi, practiceCurriculum: updatedPrac }, null, 2));

      if (isSupabaseConfigured) {
        saveCustomModule({
          id: newUnitId,
          title: newUnit.title,
          description: newUnit.description || '',
          order: importTargetIsPractice ? updatedPrac.length : updatedAi.length,
          world_id: chosenWorldId,
          is_practice: !!importTargetIsPractice
        }).then(() => {
          newUnit.lessons.forEach((les) => {
            saveSingleLesson(newUnitId, les).catch(console.error);
          });
        }).catch(console.error);
      }

      setSelectedAdminWorldId(chosenWorldId);
      setSelectedModuleWorldId(chosenWorldId);
      setSelectedModuleId(newUnitId);
      setSelectedLessonId(mappedLessons[0]?.id || '');
      setChalId('');
      triggerNotification(`Successfully imported Unit "${newUnit.title}" (${mappedLessons.length} lessons)!`, "success");
    } else if (importDetectedLevel === 'world') {
      const targetWorldNumber = Number(importPreviewData.worldNumber || importPreviewData.world_number || adminWorlds.length + 1);
      const targetWorldId = importPreviewData.worldId || importPreviewData.id || `world_${targetWorldNumber}`;
      const targetWorldTitle = importPreviewData.worldTitle || importPreviewData.title || `World ${targetWorldNumber}`;
      const targetWorldDesc = importPreviewData.worldDescription || importPreviewData.description || '';

      const importedUnitsList = importPreviewData.units || [];
      const createdModules: Module[] = [];

      importedUnitsList.forEach((u: any, uIdx: number) => {
        const uId = 'mod_' + (Date.now() + uIdx).toString().slice(-6);
        const mappedLessons: Lesson[] = (u.lessons || []).map((les: any, lesIdx: number) => {
          const screensSrc = les.screens || les.challenges || [];
          const mappedChallenges: Challenge[] = screensSrc.map((scr: any, scrIdx: number) => ({
            ...mapScreenDataForImport(scr),
            id: 'scr_' + (Date.now() + uIdx * 1000 + lesIdx * 100 + scrIdx) + '_' + Math.random().toString(36).slice(2, 7)
          }));

          return {
            id: 'les_' + (Date.now() + uIdx * 100 + lesIdx).toString().slice(-6),
            title: les.lessonTitle || les.title || `Lesson ${lesIdx + 1}`,
            description: les.lessonDescription || les.description || '',
            difficulty: les.difficulty || 'Easy',
            xpReward: Number(les.xp || les.xpReward || 50),
            isChallenge: les.isChallenge,
            isChest: les.isChest,
            isBonus: les.isBonus,
            category: les.category || 'Cosmos Era',
            challenges: mappedChallenges
          };
        });

        const modObj: Module = {
          id: uId,
          order: uIdx,
          sort_order: uIdx,
          title: u.unitTitle || u.title || `Unit ${uIdx + 1}`,
          description: u.unitDescription || u.description || '',
          difficulty: u.difficulty || 'Easy',
          world_id: targetWorldId,
          lessons: mappedLessons
        };

        createdModules.push(modObj);
      });

      if (importTargetIsPractice) {
        updatedPrac.push(...createdModules);
      } else {
        updatedAi.push(...createdModules);
      }

      setModulesList(updatedAi);
      setPracticeModulesList(updatedPrac);
      saveCurriculumToStorage(updatedAi, updatedPrac);
      setRawJsonText(JSON.stringify({ spaceCurriculum: updatedAi, practiceCurriculum: updatedPrac }, null, 2));

      if (isSupabaseConfigured) {
        saveWorld({
          id: targetWorldId,
          world_number: targetWorldNumber,
          title: targetWorldTitle,
          description: targetWorldDesc,
          status: 'active'
        }).then(() => {
          loadAdminWorlds();
          createdModules.forEach(modObj => {
            saveCustomModule({
              id: modObj.id,
              title: modObj.title,
              description: modObj.description || '',
              order: 0,
              world_id: targetWorldId,
              is_practice: !!importTargetIsPractice
            }).then(() => {
              modObj.lessons.forEach(les => {
                saveSingleLesson(modObj.id, les).catch(console.error);
              });
            }).catch(console.error);
          });
        }).catch(console.error);
      }

      setSelectedAdminWorldId(targetWorldId);
      setSelectedModuleWorldId(targetWorldId);
      if (createdModules.length > 0) {
        setSelectedModuleId(createdModules[0].id);
        setSelectedLessonId(createdModules[0].lessons[0]?.id || '');
      }
      setChalId('');
      triggerNotification(`Successfully imported World "${targetWorldTitle}" with ${createdModules.length} units!`, "success");
    }

    soundManager.play('complete');
    setShowJsonImportModal(false);
    setImportJsonText('');
    setImportPreviewData(null);
    setImportDetectedLevel(null);
    setImportValidationErrors([]);
  };
  
  // Tab within the workspace
  const [activeTab, setActiveTab] = useState<'manage' | 'worlds' | 'lessons' | 'modules' | 'challenges' | 'curriculum-json' | 'ai-generator' | 'ai-copilot' | 'practice-arena' | 'celebrations' | 'users-list' | 'rewards-manager' | 'student-intelligence' | 'schools' | 'bulk-narrations' | 'explanation-audio-manager'>('manage');
  const [mobileNavTab, setMobileNavTab] = useState<'home' | 'lessons' | 'create' | 'analytics' | 'settings'>('home');
  const [screenEditorTab, setScreenEditorTab] = useState<'content' | 'config' | 'mascot' | 'simulator'>('content');
  const [showMobileProfileDrawer, setShowMobileProfileDrawer] = useState(false);
  const [showMobileActionDrawer, setShowMobileActionDrawer] = useState(false);
  const [showWorldPickerSheet, setShowWorldPickerSheet] = useState(false);
  const [showMobilePreviewModal, setShowMobilePreviewModal] = useState(false);
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'users' | 'intelligence' | 'schools'>('users');
  const [settingsSubTab, setSettingsSubTab] = useState<'rewards' | 'practice' | 'celebrations' | 'json'>('rewards');
  const [createSubTab, setCreateSubTab] = useState<'ai' | 'screen' | 'lesson' | 'unit'>('ai');
  const [lessonsSubTab, setLessonsSubTab] = useState<'explorer' | 'screen-editor' | 'lesson-details' | 'unit-details' | 'worlds'>('explorer');

  const [mobileBuilderTab, setMobileBuilderTab] = useState<'editor' | 'preview'>('editor');
  const [editorLayoutMode, setEditorLayoutMode] = useState<'editor' | 'split' | 'preview'>('editor');
  const [isOutlineCollapsed, setIsOutlineCollapsed] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<'map' | 'editor'>('map');
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [screenListViewMode, setScreenListViewMode] = useState<'table' | 'cards'>('cards');
  const [lessonListViewMode, setLessonListViewMode] = useState<'table' | 'cards'>('cards');

  // Worlds Management State
  const [adminWorlds, setAdminWorlds] = useState<World[]>([]);
  const [selectedAdminWorldId, setSelectedAdminWorldId] = useState<string>('world_1');
  const [newWorldTitle, setNewWorldTitle] = useState('');
  const [newWorldDescription, setNewWorldDescription] = useState('');
  const [newWorldNumber, setNewWorldNumber] = useState(1);
  const [newWorldStatus, setNewWorldStatus] = useState('active');
  const [editingWorldId, setEditingWorldId] = useState<string | null>(null);
  const [selectedModuleWorldId, setSelectedModuleWorldId] = useState<string>('world_1');

  const loadAdminWorlds = async () => {
    try {
      const data = await getWorlds();
      setAdminWorlds(data);
      if (data.length > 0) {
        if (!newWorldNumber) {
          setNewWorldNumber(data.length + 1);
        }
        // If selectedAdminWorldId is 'world_1' or empty, ensure valid world match from database
        const world1 = data.find(w => w.world_number === 1 || w.id === 'world_1');
        if (world1 && (selectedAdminWorldId === 'world_1' || !selectedAdminWorldId)) {
          setSelectedAdminWorldId(world1.id);
          setSelectedModuleWorldId(world1.id);
        } else if (!data.some(w => w.id === selectedAdminWorldId) && data[0]) {
          setSelectedAdminWorldId(data[0].id);
          setSelectedModuleWorldId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed loading worlds in admin:', err);
    }
  };

  useEffect(() => {
    loadAdminWorlds();
  }, [activeTab]);

  // Supabase User Configuration & Management
  const [userProfiles, setUserProfiles] = useState<SupabaseUserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersSearchQuery, setUsersSearchQuery] = useState('');
  const [editingUserIdx, setEditingUserIdx] = useState<number | null>(null);

  // Real-time Rewards and Redemptions database state
  const [adminRewards, setAdminRewards] = useState<StoreReward[]>([]);
  const [adminRedemptions, setAdminRedemptions] = useState<StoreRedemptionRequest[]>([]);
  const [isLoadingRewards, setIsLoadingRewards] = useState(false);

  const loadRealTimeAdminRewards = async () => {
    setIsLoadingRewards(true);
    try {
      const rewardsData = await getRewardsAsync();
      setAdminRewards(rewardsData);
      const redemptionsData = await getRedemptionRequestsAsync();
      setAdminRedemptions(redemptionsData);
    } catch (err) {
      console.error("Failed loading realtime admin rewards:", err);
    } finally {
      setIsLoadingRewards(false);
    }
  };

  // Sync activeTab changes to load real-time rewards
  useEffect(() => {
    if (activeTab === 'rewards-manager') {
      loadRealTimeAdminRewards();
    }
  }, [activeTab]);
  
  // Edit Profile form fields
  const [editUserUsername, setEditUserUsername] = useState('');
  const [editUserXp, setEditUserXp] = useState(0);
  const [editUserGems, setEditUserGems] = useState(0);
  const [editUserStreak, setEditUserStreak] = useState(0);
  const [editUserEnergy, setEditUserEnergy] = useState(5);
  const [editUserAccuracy, setEditUserAccuracy] = useState(1.0);
  const [editUserIsAdmin, setEditUserIsAdmin] = useState(false);

  const loadAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await getAllUserProfiles();
      setUserProfiles(data);
    } catch (err) {
      console.error("Failed loading students logs:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleUpdateUsersProfile = async (idx: number) => {
    const targetUser = userProfiles[idx];
    if (!targetUser) return;
    
    soundManager.play('click');
    try {
      const updates = {
        username: editUserUsername,
        xp: editUserXp,
        gems: editUserGems,
        streak: editUserStreak,
        energy: editUserEnergy,
        accuracy: editUserAccuracy,
        is_admin: editUserIsAdmin
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (supabase) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.access_token) {
            headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
          }
        } catch (_) {}
      }

      const res = await fetch("/api/admin/users/update-profile", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: targetUser.email,
          userId: targetUser.id,
          updates
        })
      });

      if (!res.ok) {
        await updateProfile(targetUser.email, updates);
      }
      if (onProfileUpdated) {
        onProfileUpdated(targetUser.email, updates);
      }
      triggerNotification(`Config parameters for student ${editUserUsername} successfully updated in database!`, 'success');
      setEditingUserIdx(null);
      loadAllUsers();
    } catch (err) {
      console.error("Error updating profile in Supabase table:", err);
      triggerNotification("Save failed inside Supabase connection", "error");
    }
  };

  // Helper checking if a module belongs to the currently selected Admin World
  const isModuleInSelectedWorld = (mod: Module): boolean => {
    const currentWorld = adminWorlds.find(w => w.id === selectedAdminWorldId);
    const isWorld1 = selectedAdminWorldId === 'world_1' || currentWorld?.world_number === 1;

    if (mod.world_id === selectedAdminWorldId) return true;
    if (isWorld1) {
      // World 1 includes modules with world_id 'world_1', matching currentWorld.id, or null/undefined
      return !mod.world_id || mod.world_id === 'world_1' || (!!currentWorld && mod.world_id === currentWorld.id);
    }
    return mod.world_id === selectedAdminWorldId;
  };

  // Reorder state
  const [pendingModules, setPendingModules] = useState<Module[]>([]);

  // Initialize pending modules when modulesList changes
  useEffect(() => {
    setPendingModules([...modulesList].sort((a, b) => (a.sort_order ?? a.order ?? 0) - (b.sort_order ?? b.order ?? 0)));
  }, [modulesList]);

  const reorderUnit = (moduleId: string, direction: 'up' | 'down', e?: React.MouseEvent) => curriculumHook.reorderUnit(moduleId, direction, e);
  const moveModule = (idx: number, direction: 'up' | 'down') => {
    const visibleSpace = pendingModules.filter(isModuleInSelectedWorld);
    if (idx >= 0 && idx < visibleSpace.length) {
      reorderUnit(visibleSpace[idx].id, direction);
    }
  };
  const saveOrder = () => curriculumHook.saveOrder();

  const isOrderChanged = useMemo(() => {
    return JSON.stringify(pendingModules.map(m => m.id)) !== JSON.stringify([...modulesList].sort((a, b) => (a.sort_order ?? a.order ?? 0) - (b.sort_order ?? b.order ?? 0)).map(m => m.id));
  }, [pendingModules, modulesList]);

  // Selected targets for inserting challenges/lessons
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');

  // Expandable/collapsible view state for Units Management Dashboard
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});

  const toggleModuleExpand = (modId: string) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };
  const toggleLessonExpand = (lesId: string) => {
    setExpandedLessons(prev => ({ ...prev, [lesId]: !prev[lesId] }));
  };
  
  // Creator Forms
  const [resetKey, setResetKey] = useState(0);
  // A. Module Form
  const [modTitle, setModTitle] = useState('');
  const [modDifficulty, setModDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [modTargetGroup, setModTargetGroup] = useState<'space' | 'practice'>('space');

  // B. Lesson Form
  const [lesId, setLesId] = useState('');
  const [lesTitle, setLesTitle] = useState('');
  const [lesDescription, setLesDescription] = useState('');
  const [lesCategory, setLesCategory] = useState('Celestial Mechanics');
  const [lesDifficulty, setLesDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [lesXpReward, setLesXpReward] = useState<number>(50);
  const [lesChestIconUrl, setLesChestIconUrl] = useState('');
  const [lesLinkedUnitId, setLesLinkedUnitId] = useState('');

  // C. Challenge Screen Form
  const [chalId, setChalId] = useState('');
  const [chalType, setChalType] = useState<ChallengeType>('tap_right_answer');
  const [chalQuestion, setChalQuestion] = useState('');
  const [chalExplanation, setChalExplanation] = useState('');
  const [chalExplanationConfused, setChalExplanationConfused] = useState('');
  const [chalExplanationConcept, setChalExplanationConcept] = useState('');
  const [chalExplanationExample, setChalExplanationExample] = useState('');
  const [chalExplanationTakeaway, setChalExplanationTakeaway] = useState('');
  const [chalExplanationSpeechScript, setChalExplanationSpeechScript] = useState('');
  const [explanationAudioUrl, setExplanationAudioUrl] = useState('');
  const [explanationAudioDuration, setExplanationAudioDuration] = useState(0);

  // Marathi parallel explanation fields state
  const [chalExplanationMarathi, setChalExplanationMarathi] = useState('');
  const [chalExplanationMarathiConfused, setChalExplanationMarathiConfused] = useState('');
  const [chalExplanationMarathiConcept, setChalExplanationMarathiConcept] = useState('');
  const [chalExplanationMarathiExample, setChalExplanationMarathiExample] = useState('');
  const [chalExplanationMarathiTakeaway, setChalExplanationMarathiTakeaway] = useState('');
  const [chalExplanationMarathiSpeechScript, setChalExplanationMarathiSpeechScript] = useState('');
  const [explanationAudioUrlMarathi, setExplanationAudioUrlMarathi] = useState('');
  const [explanationAudioDurationMarathi, setExplanationAudioDurationMarathi] = useState(0);
  const [chalXpValue, setChalXpValue] = useState<number>(10);
  
  // Configuration options depending on the Challenge type selected
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

  // Spot the AI / Fact audits
  const [chalSpotText1, setChalSpotText1] = useState('');
  const [chalSpotIsReal1, setChalSpotIsReal1] = useState(true);
  const [chalSpotExpl1, setChalSpotExpl1] = useState('');
  const [chalSpotText2, setChalSpotText2] = useState('');
  const [chalSpotIsReal2, setChalSpotIsReal2] = useState(false);
  const [chalSpotExpl2, setChalSpotExpl2] = useState('');

  // Drag & drop
  const [chalDragBucket1, setChalDragBucket1] = useState('🪐 Space');
  const [chalDragBucket2, setChalDragBucket2] = useState('🌿 Earth');
  const [chalDragItem1Text, setChalDragItem1Text] = useState('Evaporating comets');
  const [chalDragItem1Bucket, setChalDragItem1Bucket] = useState('bucket1');
  const [chalDragItem2Text, setChalDragItem2Text] = useState('Green leaves kitchens');
  const [chalDragItem2Bucket, setChalDragItem2Bucket] = useState('bucket2');

  // Match pairs
  const [chalPairLeft1, setChalPairLeft1] = useState('');
  const [chalPairRight1, setChalPairRight1] = useState('');
  const [chalPairLeft2, setChalPairLeft2] = useState('');
  const [chalPairRight2, setChalPairRight2] = useState('');

  // Sorter
  const [chalSortStep1, setChalSortStep1] = useState('');
  const [chalSortStep2, setChalSortStep2] = useState('');
  const [chalSortStep3, setChalSortStep3] = useState('');
  const [chalSortStep4, setChalSortStep4] = useState('');

  // chip sentence builder
  const [chalSentenceTarget, setChalSentenceTarget] = useState('');
  const [chalChipsValue, setChalChipsValue] = useState(''); // comma separated chips
  const [chalChipsDistractors, setChalChipsDistractors] = useState(''); // comma separated distractors

  const [chalImageUrl, setChalImageUrl] = useState('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop');

  // Category C extra states
  const [chalHint, setChalHint] = useState('');
  const [chalDifficulty, setChalDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [chalContinueText, setChalContinueText] = useState('Continue');
  const [chalMascotMessage, setChalMascotMessage] = useState('');

  const [chalConceptPairs, setChalConceptPairs] = useState<{ left: string; right: string }[]>([{ left: 'AI', right: 'Artificial Intelligence' }]);
  const [chalBucketSortItems, setChalBucketSortItems] = useState<{ id: string; text: string; correct_bucket: 'b1' | 'b2' }[]>([{ id: 'i1', text: 'Data', correct_bucket: 'b1' }]);
  const [chalTimelineSteps, setChalTimelineSteps] = useState<{ id: string; text: string }[]>([{ id: 's1', text: 'Step A' }]);
  const [chalAudioUrl, setChalAudioUrl] = useState('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
  const [chalSwipeLeftLabel, setChalSwipeLeftLabel] = useState('Left option');
  const [chalSwipeRightLabel, setChalSwipeRightLabel] = useState('Right option');
  const [chalImgClassifyItems, setChalImgClassifyItems] = useState<{ id: string; text: string; imageUrl?: string; correct_bucket: 'b1' | 'b2' }[]>([
    { id: 'img1', text: 'Item 1', imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150', correct_bucket: 'b1' }
  ]);
  const [chalC12Hotspots, setChalC12Hotspots] = useState<{ id: string; label: string; x: number; y: number; correct_bucket: string }[]>([
    { id: 'h1', label: 'Spot A', x: 25, y: 35, correct_bucket: 'chip1' }
  ]);
  const [chalC12Chips, setChalC12Chips] = useState<{ id: string; text: string }[]>([
    { id: 'chip1', text: 'Sensor' }
  ]);
  const [chalC13Hotspots, setChalC13Hotspots] = useState<{ id: string; isCorrectSpot: boolean; x: number; y: number; description?: string }[]>([
    { id: 'hs1', isCorrectSpot: true, x: 50, y: 50, description: 'Engine' }
  ]);
  const [chalC14Cards, setChalC14Cards] = useState<{ id: string; front: string; back: string }[]>([
    { id: 'card1', front: 'Term A', back: 'Definition A' }
  ]);
  const [chalC15Steps, setChalC15Steps] = useState<{ id: string; text: string; isMissing?: boolean }[]>([
    { id: 'p1', text: 'Step 1' },
    { id: 'p2', text: 'Step 2 (Missing)', isMissing: true }
  ]);
  const [chalC16Options, setChalC16Options] = useState<{ id: string; text: string; isCorrect: boolean }[]>([
    { id: 'o1', text: 'Option A (Correct)', isCorrect: true },
    { id: 'o2', text: 'Option B (Wrong)', isCorrect: false }
  ]);
  const [chalC17Items, setChalC17Items] = useState<{ id: string; imageUrl: string; caption?: string }[]>([
    { id: 'img1', imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150', caption: 'Step 1' }
  ]);
  const [chalC8Images, setChalC8Images] = useState<string[]>(['', '', '', '']);

  // Configurable content_screen / visual_lesson_screen states
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

  // AI Image Generation states & handlers
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenerationError, setImageGenerationError] = useState<string | null>(null);
  const [imageGenerationSuccess, setImageGenerationSuccess] = useState<boolean>(false);
  const [generationAspectRatio, setGenerationAspectRatio] = useState<string>('4:3');
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  const handleGenerateLessonImage = async () => {
    if (!selectedLessonId || !chalId) {
      alert("Please select a lesson screen first.");
      return;
    }
    
    // Find the screen index
    const currentSelectedModuleObj = [...modulesList, ...practiceModulesList].find(m => m.id === selectedModuleId);
    const currentSelectedLessonObj = currentSelectedModuleObj?.lessons.find(l => l.id === selectedLessonId);
    const screenIndex = currentSelectedLessonObj?.challenges.findIndex(c => c.id === chalId) ?? -1;
    
    if (screenIndex === -1) {
      alert("Selected screen could not be resolved in the current lesson.");
      return;
    }

    setIsGeneratingImage(true);
    setImageGenerationError(null);
    setImageGenerationSuccess(false);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };

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
          screenIndex,
          contentBody: contentBody || '',
          aspectRatio: generationAspectRatio,
          adminEmail: currentUserEmail
        })
      });

      const contentType = response.headers.get("content-type") || "";
      let data: any = {};
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned status ${response.status}: ${text.slice(0, 100)}`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate image.");
      }

      setContentMediaUrl(data.mediaUrl);
      setImageGenerationSuccess(true);
      
      triggerNotification("✨ Image successfully generated and saved to this screen!", "success");
      soundManager.play('complete');
    } catch (err: any) {
      console.error("❌ Frontend Image Generation Error:", err);
      setImageGenerationError(err.message || String(err));
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleBulkGenerateImages = async () => {
    setIsBulkGenerating(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };

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
          generateAllMissing: true,
          adminEmail: currentUserEmail
        })
      });

      const contentType = response.headers.get("content-type") || "";
      let data: any = {};
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned status ${response.status}: ${text.slice(0, 100)}`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to bulk generate images.");
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('curriculumChanged'));
      }

      triggerNotification(`✨ Bulk generation complete! ${data.message || ''}`, "success");
      soundManager.play('complete');
    } catch (err: any) {
      console.error("❌ Bulk Image Generation Error:", err);
      triggerNotification(`Bulk image generation failed: ${err.message || String(err)}`, "error");
    } finally {
      setIsBulkGenerating(false);
    }
  };

  // JSON Raw text editor state
  const [rawJsonText, setRawJsonText] = useState('');

  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // AI Content Generator states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState('Superconductors & Magnetism');
  const [aiDraftLesson, setAiDraftLesson] = useState<any>(null);
  const [aiSelectedMcqIndices, setAiSelectedMcqIndices] = useState<number[]>([0, 1]);
  const [aiPreviewChallengeIndex, setAiPreviewChallengeIndex] = useState<number>(0);

  // New Simplified Workflow States
  const [isStudentViewMode, setIsStudentViewMode] = useState<boolean>(false);
  const [advancedLessonOpen, setAdvancedLessonOpen] = useState<boolean>(false);
  const [advancedModuleOpen, setAdvancedModuleOpen] = useState<boolean>(false);
  const [advancedScreenOpen, setAdvancedScreenOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Block progressive disclosure toggles for reading/content screens
  const [showMediaInput, setShowMediaInput] = useState<boolean>(false);
  const [showBadgeInput, setShowBadgeInput] = useState<boolean>(false);
  const [showHeadingInput, setShowHeadingInput] = useState<boolean>(false);
  const [showSubheadingInput, setShowSubheadingInput] = useState<boolean>(false);
  const [showHighlightInput, setShowHighlightInput] = useState<boolean>(false);
  const [showQuoteInput, setShowQuoteInput] = useState<boolean>(false);
  const [showBottomMsgInput, setShowBottomMsgInput] = useState<boolean>(false);

  // Rewards manager states moved to top-level to prevent React Hook order violations
  const [showRewardCreator, setShowRewardCreator] = useState(false);
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardDesc, setNewRewardDesc] = useState('');
  const [newRewardImg, setNewRewardImg] = useState('');
  const [newRewardCategory, setNewRewardCategory] = useState<'AI Tools' | 'Spotlight Rewards' | 'Digital Rewards' | 'Cosmetic Rewards'>('AI Tools');
  const [newRewardReqType, setNewRewardReqType] = useState<'gems' | 'xp' | 'conditional'>('gems');
  const [newRewardVal, setNewRewardVal] = useState(50);
  const [newRewardIsPlus, setNewRewardIsPlus] = useState(false);

  // Edit reward states
  const [editingReward, setEditingReward] = useState<StoreReward | null>(null);
  const [editRewardTitle, setEditRewardTitle] = useState('');
  const [editRewardDesc, setEditRewardDesc] = useState('');
  const [editRewardImg, setEditRewardImg] = useState('');
  const [editRewardCategory, setEditRewardCategory] = useState<'AI Tools' | 'Spotlight Rewards' | 'Digital Rewards' | 'Cosmetic Rewards'>('AI Tools');
  const [editRewardReqType, setEditRewardReqType] = useState<'gems' | 'xp' | 'conditional'>('gems');
  const [editRewardVal, setEditRewardVal] = useState(50);
  const [editRewardIsPlus, setEditRewardIsPlus] = useState(false);

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardTitle || !newRewardDesc) return;
    const dbRewards = adminRewards;
    const newReward: StoreReward = {
      id: 'custom_reward_' + Date.now(),
      title: newRewardTitle,
      description: newRewardDesc,
      image: newRewardImg || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80',
      category: newRewardCategory,
      requirementType: newRewardReqType,
      xpRequirement: newRewardReqType === 'xp' ? newRewardVal : 0,
      gemRequirement: newRewardReqType === 'gems' ? newRewardVal : 0,
      plusRequirement: newRewardIsPlus,
      isPlusExclusive: newRewardIsPlus,
      eligibilityRules: 'Complete lessons with outstanding standing.',
      featuredStatus: false,
      stock: 99,
      isActive: true
    };
    const updated = [newReward, ...dbRewards];
    saveRewards(updated);
    setAdminRewards(updated);
    await saveRewardAsync(newReward);
    
    // reset
    setNewRewardTitle('');
    setNewRewardDesc('');
    setNewRewardImg('');
    setNewRewardVal(50);
    setNewRewardIsPlus(false);
    setShowRewardCreator(false);
    soundManager.play('complete');
    setTimeout(() => setActiveTab('rewards-manager'), 50);
  };

  const handleEditRewardClick = (reward: StoreReward) => {
    soundManager.play('click');
    setEditingReward(reward);
    setEditRewardTitle(reward.title);
    setEditRewardDesc(reward.description || '');
    setEditRewardImg(reward.image || '');
    setEditRewardCategory(reward.category);
    setEditRewardReqType(reward.requirementType);
    setEditRewardVal(reward.requirementType === 'gems' ? (reward.gemRequirement || 0) : (reward.xpRequirement || 0));
    setEditRewardIsPlus(!!reward.isPlusExclusive || !!reward.plusRequirement);
    setShowRewardCreator(false); // Close creator if editing
  };

  const handleUpdateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReward || !editRewardTitle || !editRewardDesc) return;
    const dbRewards = adminRewards;
    const updatedReward: StoreReward = {
      ...editingReward,
      title: editRewardTitle,
      description: editRewardDesc,
      image: editRewardImg || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80',
      category: editRewardCategory,
      requirementType: editRewardReqType,
      xpRequirement: editRewardReqType === 'xp' ? editRewardVal : 0,
      gemRequirement: editRewardReqType === 'gems' ? editRewardVal : 0,
      plusRequirement: editRewardIsPlus,
      isPlusExclusive: editRewardIsPlus,
    };
    const updated = dbRewards.map(r => r.id === editingReward.id ? updatedReward : r);
    saveRewards(updated);
    setAdminRewards(updated);
    await saveRewardAsync(updatedReward);
    
    // reset
    setEditingReward(null);
    soundManager.play('complete');
    setTimeout(() => setActiveTab('rewards-manager'), 50);
  };

  const handleToggleActive = async (id: string) => {
    const dbRewards = adminRewards;
    const updated = dbRewards.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    saveRewards(updated);
    setAdminRewards(updated);
    const targeted = updated.find(r => r.id === id);
    if (targeted) {
      await saveRewardAsync(targeted);
    }
    soundManager.play('click');
    setTimeout(() => setActiveTab('rewards-manager'), 50);
  };

  const handleDeleteReward = (id: string) => {
    triggerConfirm(
      'Delete Custom Reward',
      'Are you sure you want to delete this custom reward option? This action is permanent.',
      async () => {
        const dbRewards = adminRewards;
        const updated = dbRewards.filter(r => r.id !== id);
        saveRewards(updated);
        setAdminRewards(updated);
        await deleteRewardAsync(id);
        soundManager.play('click');
        setTimeout(() => setActiveTab('rewards-manager'), 50);
      }
    );
  };



  const reorderLesson = (moduleId: string, lessonId: string, direction: 'up' | 'down', e?: React.MouseEvent) => curriculumHook.reorderLesson(moduleId, lessonId, direction, e);
  const reorderChallenge = (moduleId: string, lessonId: string, challengeId: string, direction: 'up' | 'down', e?: React.MouseEvent) => screenHook.reorderChallenge(moduleId, lessonId, challengeId, direction, e);

  useEffect(() => {
    const handleCurriculumChange = () => {
      setModulesList([...AI_CURRICULUM]);
      setPracticeModulesList([...PRACTICE_CURRICULUM]);
      setRawJsonText(JSON.stringify({ spaceCurriculum: AI_CURRICULUM, practiceCurriculum: PRACTICE_CURRICULUM }, null, 2));
    };

    setModulesList([...AI_CURRICULUM]);
    setPracticeModulesList([...PRACTICE_CURRICULUM]);
    setRawJsonText(JSON.stringify({ spaceCurriculum: AI_CURRICULUM, practiceCurriculum: PRACTICE_CURRICULUM }, null, 2));

    // Auto-select first module if available
    const firstMod = AI_CURRICULUM[0] || PRACTICE_CURRICULUM[0];
    if (firstMod) {
      setSelectedModuleId(firstMod.id);
      if (firstMod.lessons && firstMod.lessons.length > 0) {
        setSelectedLessonId(firstMod.lessons[0].id);
      }
    }

    window.addEventListener('curriculumChanged', handleCurriculumChange);
    return () => {
      window.removeEventListener('curriculumChanged', handleCurriculumChange);
    };
  }, []);

  const triggerNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const curriculumHook = useCurriculumStudio({
    modulesList,
    practiceModulesList,
    setModulesList,
    setPracticeModulesList,
    selectedAdminWorldId,
    triggerNotification,
    triggerConfirm,
    soundManager,
    setRawJsonText,
    setActiveTab,
    setMobileViewMode,
    selectedModuleId,
    setSelectedModuleId,
    selectedLessonId,
    setSelectedLessonId,
    isOutlineCollapsed,
    setIsOutlineCollapsed,
  });

  const screenHook = useScreenForm({
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
    chalId,
    setChalId,
  });

  // Modern Screen Picker and Instant Creators State
  const [showScreenPickerForLesson, setShowScreenPickerForLesson] = useState<{ moduleId: string, lessonId: string } | null>(null);

  const selectModuleProperty = (mod: Module) => {
    soundManager.play('click');
    setSelectedModuleId(mod.id);
    setSelectedLessonId('');
    setChalId('');
    setModTitle(mod.title);
    setModDifficulty(mod.difficulty as 'Easy' | 'Medium' | 'Hard');
    setModTargetGroup(modulesList.some(m => m.id === mod.id) ? 'space' : 'practice');
    setSelectedModuleWorldId(mod.world_id || selectedAdminWorldId);
    setActiveTab('manage');
    setMobileViewMode('editor');
  };

  const selectLessonProperty = (modId: string, les: Lesson) => {
    soundManager.play('click');
    setSelectedModuleId(modId);
    setSelectedLessonId(les.id);
    setChalId('');
    setLesId(les.id);
    setLesTitle(les.title);
    setLesDescription(les.description || '');
    setLesCategory((les as any).category || 'Celestial Mechanics');
    setLesDifficulty(les.difficulty);
    setLesXpReward(les.xpReward || 50);
    setLesChestIconUrl((les as any).chest_icon_url || (les as any).chestIconUrl || '');
    setLesLinkedUnitId((les as any).linked_unit_id || (les as any).linkedUnitId || '');
    setActiveTab('manage');
    setMobileViewMode('editor');
  };

  // Populates edit forms immediately with challenge properties on select
  const selectChallengeForEditing = (modId: string, lesId: string, chal: Challenge) => {
    screenHook.selectChallengeForEditing(modId, lesId, chal);
    setSelectedModuleId(modId);
    setSelectedLessonId(lesId);
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
    setExplanationAudioUrl(audioUrl);
    setExplanationAudioDuration(audioDuration);

    setChalExplanationMarathi(textMar);
    setExplanationAudioUrlMarathi(audioUrlMar);
    setExplanationAudioDurationMarathi(audioDurationMar);

    // Also check server-persisted audio in lesson_screen_audio table in case challenges JSON column hadn't refreshed
    if (chal.id) {
      fetch(`/api/screen-audio?screenId=${encodeURIComponent(chal.id)}${lesId ? `&lessonId=${encodeURIComponent(lesId)}` : ''}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.success && data.audioNarrations) {
            const mr = data.audioNarrations.marathi || data.audioNarrations.mr;
            if (mr?.url) {
              setExplanationAudioUrlMarathi(prev => prev || mr.url);
              if (mr.durationMs) setExplanationAudioDurationMarathi(prev => prev || Math.round(mr.durationMs / 1000));
            }
            if (mr?.text) {
              setChalExplanationMarathi(prev => prev || mr.text);
            }
            const hi = data.audioNarrations.hinglish || data.audioNarrations.hi;
            if (hi?.url) {
              setExplanationAudioUrl(prev => prev || hi.url);
              if (hi.durationMs) setExplanationAudioDuration(prev => prev || Math.round(hi.durationMs / 1000));
            }
          }
        })
        .catch(() => {});
    }

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
    setChalImageUrl('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop');
    
    // Category C extra resets
    setChalHint('');
    setChalDifficulty('easy');
    setChalContinueText('Continue');
    setChalMascotMessage('');
    setChalConceptPairs([{ left: 'AI', right: 'Artificial Intelligence' }]);
    setChalBucketSortItems([{ id: 'i1', text: 'Data', correct_bucket: 'b1' }]);
    setChalTimelineSteps([{ id: 's1', text: 'Step A' }]);
    setChalAudioUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    setChalSwipeLeftLabel('Left option');
    setChalSwipeRightLabel('Right option');
    setChalImgClassifyItems([{ id: 'img1', text: 'Item 1', imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150', correct_bucket: 'b1' }]);
    setChalC12Hotspots([{ id: 'h1', label: 'Spot A', x: 25, y: 35, correct_bucket: 'chip1' }]);
    setChalC12Chips([{ id: 'chip1', text: 'Sensor' }]);
    setChalC13Hotspots([{ id: 'hs1', isCorrectSpot: true, x: 50, y: 50, description: 'Engine' }]);
    setChalC14Cards([{ id: 'card1', front: 'Term A', back: 'Definition A' }]);
    setChalC15Steps([{ id: 'p1', text: 'Step 1' }, { id: 'p2', text: 'Step 2 (Missing)', isMissing: true }]);
    setChalC16Options([{ id: 'o1', text: 'Option A (Correct)', isCorrect: true }, { id: 'o2', text: 'Option B (Wrong)', isCorrect: false }]);
    setChalC17Items([{ id: 'img1', imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150', caption: 'Step 1' }]);

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

    // Load from Challenge specific values
    if (chal.type === 'tap_right_answer' || chal.type === 'image_reveal') {
      if (chal.options) {
        setChalMcqOptions([...chal.options, '', '', '', ''].slice(0, 4));
      }
      if (chal.correctAnswer) setChalMcqCorrect(chal.correctAnswer);
      if (chal.imageUrl) setChalImageUrl(chal.imageUrl);
    }
    if (chal.type === 'fill_in_blank') {
      if (chal.options) {
        setChalFillBlankOptions([...chal.options, '', '', '', ''].slice(0, 4));
      }
      if (chal.correctAnswer) setChalFillBlankCorrect(chal.correctAnswer);
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
    if (chal.type === 'drag_and_drop') {
      if (chal.buckets && chal.buckets.length >= 2) {
        setChalDragBucket1(chal.buckets[0].label || '');
        setChalDragBucket2(chal.buckets[1].label || '');
      }
      if (chal.items && chal.items.length >= 2) {
        setChalDragItem1Text(chal.items[0].text || '');
        setChalDragItem1Bucket(chal.items[0].correct_bucket === 'b1' ? 'bucket1' : 'bucket2');
        setChalDragItem2Text(chal.items[1].text || '');
        setChalDragItem2Bucket(chal.items[1].correct_bucket === 'b1' ? 'bucket1' : 'bucket2');
      }
    }
    if (chal.type === 'match_pairs') {
      if (chal.pairs && chal.pairs.length >= 2) {
        setChalPairLeft1(chal.pairs[0].left || '');
        setChalPairRight1(chal.pairs[0].right || '');
        setChalPairLeft2(chal.pairs[1].left || '');
        setChalPairRight2(chal.pairs[1].right || '');
      }
    }
    if (chal.type === 'sort_sequence') {
      if (chal.steps) {
        setChalSortStep1(chal.steps[0]?.text || '');
        setChalSortStep2(chal.steps[1]?.text || '');
        setChalSortStep3(chal.steps[2]?.text || '');
        setChalSortStep4(chal.steps[3]?.text || '');
      }
    }
    if (chal.type === 'build_concept') {
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

        // Pre-activate visual block sliders based on values present
        setShowMediaInput(!!payload.mediaUrl);
        setShowBadgeInput(!!payload.badge);
        setShowHeadingInput(!!payload.heading);
        setShowSubheadingInput(!!payload.subheading);
        setShowHighlightInput(!!payload.highlightBox);
        setShowQuoteInput(!!payload.quote);
        setShowBottomMsgInput(!!payload.bottomMessage);
      }
    }

    // Load Category C shared fields
    if (chal.hint) setChalHint(chal.hint);
    if (chal.difficulty) setChalDifficulty(chal.difficulty as any);
    if (chal.continueText) setChalContinueText(chal.continueText);
    if (chal.mascotMessage) setChalMascotMessage(chal.mascotMessage);
    
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

    // Load Category C specific fields
    if (chal.type === 'c1_multiple_choice' || chal.type === 'c8_tap_correct_object' || chal.type === 'c18_audio_quiz') {
      if (chal.options) {
        setChalMcqOptions([...chal.options, '', '', '', ''].slice(0, 4));
      }
      if (chal.correctAnswer) setChalMcqCorrect(chal.correctAnswer);
      if (chal.type === 'c8_tap_correct_object') {
        if (chal.items && Array.isArray(chal.items)) {
          setChalC8Images([...chal.items, '', '', '', ''].slice(0, 4));
        } else {
          setChalC8Images(['', '', '', '']);
        }
      }
    }
    if (chal.type === 'c2_fill_in_blank') {
      if (chal.options) {
        setChalFillBlankOptions([...chal.options, '', '', '', ''].slice(0, 4));
      }
      if (chal.correctAnswer) setChalFillBlankCorrect(chal.correctAnswer);
    }
    if (chal.type === 'c3_sentence_builder') {
      setChalSentenceTarget(chal.targetSentence || '');
      if (chal.chipsCorrect) setChalChipsValue(chal.chipsCorrect.join(', '));
      if (chal.chipsDistractor) setChalChipsDistractors(chal.chipsDistractor.join(', '));
    }
    if (chal.type === 'c4_concept_matcher') {
      if (chal.pairs) setChalConceptPairs(chal.pairs);
    }
    if (chal.type === 'c5_bucket_sort') {
      if (chal.buckets && chal.buckets.length >= 2) {
        setChalDragBucket1(chal.buckets[0].label || '');
        setChalDragBucket2(chal.buckets[1].label || '');
      }
      if (chal.items) setChalBucketSortItems(chal.items);
    }
    if (chal.type === 'c6_timeline_sort' || chal.type === 'c7_sequence_builder') {
      if (chal.steps) setChalTimelineSteps(chal.steps);
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
    if (chal.type === 'c11_image_classification') {
      if (chal.buckets && chal.buckets.length >= 2) {
        setChalDragBucket1(chal.buckets[0].label || '');
        setChalDragBucket2(chal.buckets[1].label || '');
      }
      if (chal.items) setChalImgClassifyItems(chal.items);
    }
    if (chal.type === 'c12_label_diagram') {
      if (chal.imageUrl) setChalImageUrl(chal.imageUrl);
      if (chal.hotspots) setChalC12Hotspots(chal.hotspots);
      if (chal.items) setChalC12Chips(chal.items);
    }
    if (chal.type === 'c13_hotspot_question') {
      if (chal.imageUrl) setChalImageUrl(chal.imageUrl);
      if (chal.hotspots) setChalC13Hotspots(chal.hotspots);
    }
    if (chal.type === 'c14_memory_flip_cards') {
      if (chal.cards) setChalC14Cards(chal.cards);
    }
    if (chal.type === 'c15_drag_complete_diagram') {
      if (chal.steps) setChalC15Steps(chal.steps);
      if (chal.options) {
        setChalMcqOptions([...chal.options, '', '', '', ''].slice(0, 4));
      }
      if (chal.correctAnswer) setChalMcqCorrect(chal.correctAnswer);
    }
    if (chal.type === 'c16_eliminate_wrong') {
      if (chal.options) setChalC16Options(chal.options);
    }
    if (chal.type === 'c17_arrange_images') {
      if (chal.items) setChalC17Items(chal.items);
    }
    if (chal.type === 'c18_audio_quiz') {
      if (chal.audioUrl) setChalAudioUrl(chal.audioUrl);
      if (chal.options) {
        setChalMcqOptions([...chal.options, '', '', '', ''].slice(0, 4));
      }
      if (chal.correctAnswer) setChalMcqCorrect(chal.correctAnswer);
    }

    setActiveTab('challenges');
    setMobileViewMode('editor');
    setMobileBuilderTab('editor');
    setIsStudentViewMode(false);
    soundManager.play('click');
  };

  // Instantly appends a new Unit without throwing user to form settings
  const addUnitInstantly = (targetGroup: 'space' | 'practice') => {
    curriculumHook.addUnitInstantly(selectedAdminWorldId, targetGroup);
  };

  // Instantly embeds a new lesson inside the targeted unit
  const addLessonInstantly = (moduleId: string) => {
    curriculumHook.addLessonInstantly(moduleId);
  };

  // Instantly builds a formatted mock challenge slide and loads it for direct visual editing
  const addScreenInstantly = (moduleId: string, lessonId: string, type: ChallengeType) => {
    screenHook.createInteractiveChallenge(moduleId, lessonId, type);
  };

  const saveLessonChallenges = async (modId: string, lesId: string, challenges: Challenge[]) => {
    const allMods = [...modulesList, ...practiceModulesList];
    const targetMod = allMods.find(m => m.id === modId);
    const targetLes = targetMod?.lessons?.find(l => l.id === lesId);
    if (!targetLes) return;

    const updatedLesson: Lesson = {
      ...targetLes,
      challenges
    };

    try {
      const savedLesson = await saveSingleLesson(modId, updatedLesson);

      const updatedAi = modulesList.map(m => {
        if (m.id === modId) {
          return {
            ...m,
            lessons: m.lessons.map(l => l.id === lesId ? savedLesson : l)
          };
        }
        return m;
      });
      const updatedPrac = practiceModulesList.map(m => {
        if (m.id === modId) {
          return {
            ...m,
            lessons: m.lessons.map(l => l.id === lesId ? savedLesson : l)
          };
        }
        return m;
      });
      setModulesList(updatedAi);
      setPracticeModulesList(updatedPrac);
      setRawJsonText(JSON.stringify({ spaceCurriculum: updatedAi, practiceCurriculum: updatedPrac }, null, 2));
      triggerNotification("Screen sequence updated and saved to database!", "success");
    } catch (err: any) {
      console.error("Failed to save screen sequence:", err);
      triggerNotification("Failed to update screen sequence: " + (err?.message || "Unknown error"), "error");
    }
  };

  // Helper mapping challenge icons in tree
  const getChallengeIcon = (type: ChallengeType) => {
    switch (type) {
      case 'content_screen': return '🖼️';
      case 'visual_lesson_screen': return '🎬';
      case 'tap_right_answer': return '🎯';
      case 'image_reveal': return '📸';
      case 'fill_in_blank': return '📝';
      case 'ai_vs_human': return '🪐';
      case 'spot_the_ai': return '🔍';
      case 'drag_and_drop': return '🧩';
      case 'sort_sequence': return '🔢';
      case 'match_pairs': return '🤝';
      case 'build_concept': return '💡';
      default: return '📄';
    }
  };

  // Human friendly labels for challenge slides
  const getChallengeLabel = (type: ChallengeType) => {
    switch (type) {
      case 'content_screen': return 'Concept Screen';
      case 'visual_lesson_screen': return 'Visual Story Screen';
      case 'tap_right_answer': return 'Multiple Choice Quiz';
      case 'image_reveal': return 'Image Tap Quiz';
      case 'fill_in_blank': return 'Fill standard Blank';
      case 'ai_vs_human': return 'AI Showdown Card';
      case 'spot_the_ai': return 'AI Error Audit';
      case 'drag_and_drop': return 'Bucket Sorter';
      case 'sort_sequence': return 'Timeline Sorter';
      case 'match_pairs': return 'Concepts Matcher';
      case 'build_concept': return 'Sentence Builder';
      default: return 'Interactive Card';
    }
  };

  // Save changes to module details
  const handleSaveModuleEdits = (e?: React.FormEvent) => curriculumHook.handleSaveModuleEdits(e);

  // Save changes to lesson details
  const handleSaveLessonEdits = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedModuleId || !selectedLessonId) return;

    const allMods = [...modulesList, ...practiceModulesList];
    const targetMod = allMods.find(m => m.id === selectedModuleId);
    const targetLes = targetMod?.lessons?.find(l => l.id === selectedLessonId);
    if (!targetLes) return;

    const updatedLessonData: Lesson = {
      ...targetLes,
      title: lesTitle.trim(),
      description: lesDescription.trim(),
      difficulty: lesDifficulty,
      xpReward: Number(lesXpReward) || 50,
      chest_icon_url: lesChestIconUrl.trim() || undefined,
      chestIconUrl: lesChestIconUrl.trim() || undefined,
      linked_unit_id: lesLinkedUnitId || undefined,
      linkedUnitId: lesLinkedUnitId || undefined
    };
    (updatedLessonData as any).category = lesCategory.trim();

    try {
      const savedLesson = await saveSingleLesson(selectedModuleId, updatedLessonData);

      const updateProps = (l: Lesson) => (l.id === selectedLessonId ? savedLesson : l);

      const updatedAi = modulesList.map(m => {
        if (m.id === selectedModuleId) {
          return { ...m, lessons: m.lessons.map(updateProps) };
        }
        return m;
      });

      const updatedPrac = practiceModulesList.map(m => {
        if (m.id === selectedModuleId) {
          return { ...m, lessons: m.lessons.map(updateProps) };
        }
        return m;
      });

      setModulesList(updatedAi);
      setPracticeModulesList(updatedPrac);
      setRawJsonText(JSON.stringify({ spaceCurriculum: updatedAi, practiceCurriculum: updatedPrac }, null, 2));

      triggerNotification("Lesson details updated and saved to database successfully!", "success");
      soundManager.play('complete');
    } catch (err: any) {
      console.error("Lesson save failed:", err);
      triggerNotification("Failed to save lesson: " + (err?.message || "Unknown error"), "error");
      soundManager.play('incorrect');
    }
  };

  const compileCurrentChallenge = (): Challenge => {
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
        audioUrl: explanationAudioUrl || '',
        audioDuration: Number(explanationAudioDuration) || 0,
        hinglish: {
          text: chalExplanation || 'Aibo says: Perfect observing logic!',
          audioUrl: explanationAudioUrl || '',
          audioDuration: Number(explanationAudioDuration) || 0
        },
        marathi: {
          text: chalExplanationMarathi || '',
          audioUrl: explanationAudioUrlMarathi || '',
          audioDuration: Number(explanationAudioDurationMarathi) || 0
        }
      },
      xpValue: Number(chalXpValue) || 10,
      hint: chalHint || undefined,
      difficulty: chalDifficulty || undefined,
      continueText: chalContinueText || undefined,
      mascotMessage: chalMascotMessage || undefined
    };

    switch (chalType) {
      case 'tap_right_answer': {
        const filteredOpts = (chalMcqOptions || []).map(o => safeTrim(o)).filter(Boolean);
        base.options = filteredOpts.length > 0 ? filteredOpts : ['Option 1', 'Option 2'];
        base.correctAnswer = safeTrim(chalMcqCorrect) || base.options[0];
        break;
      }
      case 'fill_in_blank': {
        const filteredOpts = (chalFillBlankOptions || []).map(o => safeTrim(o)).filter(Boolean);
        base.options = filteredOpts.length > 0 ? filteredOpts : ['Word 1', 'Word 2'];
        base.correctAnswer = safeTrim(chalFillBlankCorrect) || base.options[0];
        break;
      }
      case 'image_reveal': {
        const filteredOpts = (chalMcqOptions || []).map(o => safeTrim(o)).filter(Boolean);
        base.imageUrl = chalImageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop';
        base.options = filteredOpts.length > 0 ? filteredOpts : ['Option 1', 'Option 2'];
        base.correctAnswer = safeTrim(chalMcqCorrect) || base.options[0];
        break;
      }
      case 'ai_vs_human': {
        base.outputs = [
          {
            id: 'opt_human',
            title: chalAiCardATitle || 'Card A',
            text: chalAiCardAText || 'Gravity bends space-time fabric.',
            authorLabel: 'Fiction Card',
            isAI: false,
            emojis: '❌🌀'
          },
          {
            id: 'opt_ai',
            title: chalAiCardBTitle || 'Card B',
            text: chalAiCardBText || 'An alternate field handles gravity waves.',
            authorLabel: 'Verified Science Card',
            isAI: true,
            emojis: '✅⚡'
          }
        ];
        base.correctAnswer = chalAiCorrectCard;
        break;
      }
      case 'spot_the_ai': {
        base.items = [
          { 
            id: 'spot_1', 
            text: chalSpotText1 || 'Gravity bends space-time fabric.', 
            has_ai: chalSpotIsReal1,
            explanation: chalSpotExpl1 || 'True scientific reality!'
          },
          { 
            id: 'spot_2', 
            text: chalSpotText2 || 'Boil water inside vacuum grids.', 
            has_ai: chalSpotIsReal2,
            explanation: chalSpotExpl2 || 'Absurd mechanics scenario.'
          }
        ];
        break;
      }
      case 'drag_and_drop': {
        base.buckets = [
          { id: 'b1', label: chalDragBucket1 || 'Bucket A' },
          { id: 'b2', label: chalDragBucket2 || 'Bucket B' }
        ];
        base.items = [
          { id: 'di1', text: chalDragItem1Text || 'Item A', correct_bucket: chalDragItem1Bucket === 'bucket1' ? 'b1' : 'b2' },
          { id: 'di2', text: chalDragItem2Text || 'Item B', correct_bucket: chalDragItem2Bucket === 'bucket1' ? 'b1' : 'b2' }
        ];
        break;
      }
      case 'match_pairs': {
        base.pairs = [
          { left: chalPairLeft1 || 'Left 1', right: chalPairRight1 || 'Right 1' },
          { left: chalPairLeft2 || 'Left 2', right: chalPairRight2 || 'Right 2' }
        ];
        break;
      }
      case 'sort_sequence': {
        const stepsList = [
          { id: 's1', text: chalSortStep1 || 'Step A' },
          { id: 's2', text: chalSortStep2 || 'Step B' },
          { id: 's3', text: chalSortStep3 || 'Step C' },
          { id: 's4', text: chalSortStep4 || 'Step D' }
        ].filter(s => safeTrim(s.text));
        base.steps = stepsList.length > 0 ? stepsList : [{ id: 's1', text: 'Step A' }, { id: 's2', text: 'Step B' }];
        base.correctOrder = base.steps.map((s: any) => s.id);
        break;
      }
      case 'build_concept': {
        const targetClean = safeTrim(chalSentenceTarget);
        const primaryWords = targetClean.split(' ').filter(Boolean);
        base.targetSentence = targetClean || 'Aibo designs space machines.';
        base.chipsCorrect = chalChipsValue ? chalChipsValue.split(',').map(c => safeTrim(c)).filter(Boolean) : primaryWords;
        base.chipsDistractor = chalChipsDistractors ? chalChipsDistractors.split(',').map(c => safeTrim(c)).filter(Boolean) : ['engine', 'boiler'];
        break;
      }
      case 'content_screen':
      case 'visual_lesson_screen': {
        const payload = {
          sceneType: contentSceneType || 'hero',
          mediaType: contentMediaType || 'image',
          mediaUrl: safeTrim(contentMediaUrl) || undefined,
          badge: safeTrim(contentBadge) || undefined,
          heading: safeTrim(contentHeading) || undefined,
          subheading: safeTrim(contentSubheading) || undefined,
          contentBody: safeTrim(contentBody) || safeTrim(chalExplanation) || undefined,
          highlightBox: safeTrim(contentHighlightBox) || undefined,
          quote: safeTrim(contentQuote) || undefined,
          quoteAuthor: safeTrim(contentQuoteAuthor) || undefined,
          bottomMessage: safeTrim(contentBottomMessage) || undefined
        };
        base.contentScreen = payload;
        base.visualLessonScreen = payload;
        break;
      }
      case 'c1_multiple_choice': {
        const filteredOpts = (chalMcqOptions || []).map(o => safeTrim(o)).filter(Boolean);
        base.options = filteredOpts.length > 0 ? filteredOpts : ['Option A', 'Option B', 'Option C', 'Option D'];
        base.correctAnswer = safeTrim(chalMcqCorrect) || base.options[0];
        break;
      }
      case 'c2_fill_in_blank': {
        const filteredOpts = (chalFillBlankOptions || []).map(o => safeTrim(o)).filter(Boolean);
        base.options = filteredOpts.length > 0 ? filteredOpts : ['Intelligence', 'Internet', 'Information', 'Input'];
        base.correctAnswer = safeTrim(chalFillBlankCorrect) || base.options[0];
        break;
      }
      case 'c3_sentence_builder': {
        const targetClean = safeTrim(chalSentenceTarget);
        base.targetSentence = targetClean || 'AI learns from data.';
        base.chipsCorrect = chalChipsValue ? chalChipsValue.split(',').map(c => safeTrim(c)).filter(Boolean) : base.targetSentence.split(' ').filter(Boolean);
        base.chipsDistractor = chalChipsDistractors ? chalChipsDistractors.split(',').map(c => safeTrim(c)).filter(Boolean) : ['engine', 'boiler'];
        break;
      }
      case 'c4_concept_matcher': {
        base.pairs = (chalConceptPairs || []).filter(p => safeTrim(p?.left) && safeTrim(p?.right));
        break;
      }
      case 'c5_bucket_sort': {
        base.buckets = [
          { id: 'b1', label: chalDragBucket1 || 'Bucket A' },
          { id: 'b2', label: chalDragBucket2 || 'Bucket B' }
        ];
        base.items = (chalBucketSortItems || []).filter(i => safeTrim(i?.text));
        break;
      }
      case 'c6_timeline_sort':
      case 'c7_sequence_builder': {
        base.steps = (chalTimelineSteps || []).filter(s => safeTrim(s?.text));
        base.correctOrder = base.steps.map((s: any) => s.id);
        break;
      }
      case 'c8_tap_correct_object': {
        const filteredOpts = (chalMcqOptions || []).map(o => safeTrim(o)).filter(Boolean);
        base.options = filteredOpts.length > 0 ? filteredOpts : ['Object A', 'Object B', 'Object C', 'Object D'];
        base.correctAnswer = safeTrim(chalMcqCorrect) || base.options[0];
        base.items = chalC8Images;
        break;
      }
      case 'c9_true_false': {
        base.correctAnswer = safeTrim(chalMcqCorrect).toLowerCase() === 'true' ? 'true' : 'false';
        break;
      }
      case 'c10_swipe_left_right': {
        base.correctAnswer = safeTrim(chalMcqCorrect).toLowerCase() === 'left' ? 'left' : 'right';
        base.options = [safeTrim(chalSwipeLeftLabel) || 'Left', safeTrim(chalSwipeRightLabel) || 'Right'];
        break;
      }
      case 'c11_image_classification': {
        base.buckets = [
          { id: 'b1', label: chalDragBucket1 || 'Category A' },
          { id: 'b2', label: chalDragBucket2 || 'Category B' }
        ];
        base.items = (chalImgClassifyItems || []).filter(i => safeTrim(i?.text));
        break;
      }
      case 'c12_label_diagram': {
        base.imageUrl = chalImageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600';
        base.hotspots = chalC12Hotspots;
        base.items = (chalC12Chips || []).filter(c => safeTrim(c?.text));
        break;
      }
      case 'c13_hotspot_question': {
        base.imageUrl = chalImageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600';
        base.hotspots = chalC13Hotspots;
        break;
      }
      case 'c14_memory_flip_cards': {
        base.cards = (chalC14Cards || []).filter(c => safeTrim(c?.front) && safeTrim(c?.back));
        break;
      }
      case 'c15_drag_complete_diagram': {
        base.steps = (chalC15Steps || []).filter(s => safeTrim(s?.text));
        const filteredOpts = (chalMcqOptions || []).map(o => safeTrim(o)).filter(Boolean);
        base.options = filteredOpts.length > 0 ? filteredOpts : ['Option A', 'Option B'];
        base.correctAnswer = safeTrim(chalMcqCorrect) || base.options[0];
        break;
      }
      case 'c16_eliminate_wrong': {
        base.options = (chalC16Options || []).filter(o => safeTrim(o?.text));
        break;
      }
      case 'c17_arrange_images': {
        base.items = (chalC17Items || []).filter(i => safeTrim(i?.imageUrl));
        base.correctOrder = base.items.map((i: any) => i.id);
        break;
      }
      case 'c18_audio_quiz': {
        base.audioUrl = chalAudioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        const filteredOpts = (chalMcqOptions || []).map(o => safeTrim(o)).filter(Boolean);
        base.options = filteredOpts.length > 0 ? filteredOpts : ['Option A', 'Option B'];
        base.correctAnswer = safeTrim(chalMcqCorrect) || base.options[0];
        break;
      }
    }

    base.explanation_audio_url = explanationAudioUrl || undefined;
    base.explanation_audio_duration = Number(explanationAudioDuration) || undefined;
    base.explanation_marathi = chalExplanationMarathi || undefined;
    base.explanation_marathi_confused = chalExplanationMarathiConfused || undefined;
    base.explanation_marathi_concept = chalExplanationMarathiConcept || undefined;
    base.explanation_marathi_example = chalExplanationMarathiExample || undefined;
    base.explanation_marathi_takeaway = chalExplanationMarathiTakeaway || undefined;
    base.explanation_marathi_speech_script = chalExplanationMarathiSpeechScript || undefined;
    base.explanation_marathi_audio_url = explanationAudioUrlMarathi || undefined;
    base.explanation_marathi_audio_duration = Number(explanationAudioDurationMarathi) || undefined;

    return base as Challenge;
  };

  const handleRawJsonSave = async () => {
    try {
      const parsed = JSON.parse(rawJsonText);
      if (!parsed.spaceCurriculum || !parsed.practiceCurriculum) {
        throw new Error("Must contain both 'spaceCurriculum' and 'practiceCurriculum' fields.");
      }

      const incomingModIds = new Set<string>([
        ...parsed.spaceCurriculum.map((m: any) => m.id),
        ...parsed.practiceCurriculum.map((m: any) => m.id)
      ]);
      const incomingLesIds = new Set<string>();
      [...parsed.spaceCurriculum, ...parsed.practiceCurriculum].forEach((m: any) => {
        (m.lessons || []).forEach((l: any) => incomingLesIds.add(l.id));
      });

      let existingModIds: string[] = [];
      let existingLesIds: string[] = [];
      if (isSupabaseConfigured) {
        try {
          const [dbMods, dbLes] = await Promise.all([getCustomModules(), getCustomLessons()]);
          existingModIds = dbMods.map(m => m.id);
          existingLesIds = dbLes.map(l => l.id);
        } catch {
          existingModIds = [...modulesList, ...practiceModulesList].map(m => m.id);
          existingLesIds = [...modulesList, ...practiceModulesList].flatMap(m => (m.lessons || []).map(l => l.id));
        }
      } else {
        existingModIds = [...modulesList, ...practiceModulesList].map(m => m.id);
        existingLesIds = [...modulesList, ...practiceModulesList].flatMap(m => (m.lessons || []).map(l => l.id));
      }

      const modulesToDelete = existingModIds.filter(id => !incomingModIds.has(id));
      const lessonsToDelete = existingLesIds.filter(id => !incomingLesIds.has(id));

      const executeImport = async () => {
        try {
          for (const lesId of lessonsToDelete) {
            await deleteCustomLesson(lesId).catch(console.warn);
            removeSyncedHash(lesId);
          }
          for (const modId of modulesToDelete) {
            await deleteCustomModule(modId).catch(console.warn);
            removeSyncedHash(modId);
          }
          await saveCurriculumToStorage(parsed.spaceCurriculum, parsed.practiceCurriculum);
          setModulesList(parsed.spaceCurriculum);
          setPracticeModulesList(parsed.practiceCurriculum);
          triggerNotification("Full curriculum updated from raw JSON!", "success");
          soundManager.play('complete');
        } catch (saveErr: any) {
          triggerNotification("Curriculum saved locally, but database sync failed: " + (saveErr?.message || "Unknown error"), "error");
          soundManager.play('incorrect');
        }
      };

      if (lessonsToDelete.length > 0 || modulesToDelete.length > 0) {
        triggerConfirm(
          "Confirm Curriculum Replacement",
          `These ${lessonsToDelete.length} lessons / ${modulesToDelete.length} units will be permanently deleted from the database. Do you want to proceed?`,
          executeImport
        );
      } else {
        await executeImport();
      }
    } catch (err: any) {
      triggerNotification("Bad JSON format: " + err.message, "error");
      soundManager.play('incorrect');
    }
  };

  // 1. ADD / SAVE MODULE
  const handleCreateModule = (e: React.FormEvent) => curriculumHook.handleCreateModule(e);

  // 2. DELETE MODULE
  const handleDeleteModule = (id: string, e?: React.MouseEvent) => curriculumHook.handleDeleteModule(id, e);

  // AI CORE GENERATORS
  const handleGenerateLessonDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generationPrompt.trim()) {
      triggerNotification("Please outline a teaching topic first!", "info");
      return;
    }

    setIsGenerating(true);
    soundManager.play('click');

    try {
      const res = await fetch('/api/curriculum/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: generationPrompt })
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || "Generation endpoint errored.");
      }

      const lessonObj = await res.json();
      
      // Inject fallback identifiers
      if (!lessonObj.id) {
        lessonObj.id = 'les_ai_' + Date.now().toString().slice(-5);
      }
      lessonObj.category = lessonObj.category || 'AI Technology';
      
      setAiDraftLesson(lessonObj);
      // Automatically check all generated MCQs
      setAiSelectedMcqIndices(lessonObj.mcqs ? lessonObj.mcqs.map((_: any, idx: number) => idx) : []);
      setAiPreviewChallengeIndex(0);
      triggerNotification("Gemini successfully generated your course chapter and interactive screens!", "success");
      soundManager.play('complete');
    } catch (err: any) {
      console.error("Gemini generation failed", err);
      triggerNotification("Generation failed: " + err.message, "error");
      soundManager.play('incorrect');
    } finally {
      setIsGenerating(false);
    }
  };


  // 3. CREATE LESSON (WITH TITLE, DESCRIPTION, CATEGORY)
  const handleCreateLesson = (e: React.FormEvent) => curriculumHook.handleCreateLesson(e);

  // 4. DELETE LESSON
  const handleDeleteLesson = (moduleId: string, lessonId: string, e?: React.MouseEvent) => curriculumHook.handleDeleteLesson(moduleId, lessonId, e);

  // 5. CREATE CHALLENGE SCREEN (TASK) SCREEN-BY-SCREEN
  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleId || !selectedLessonId) {
      triggerNotification("Target Module and Lesson must be selected with the explorer!", "error");
      return;
    }
    if (!chalQuestion.trim() && chalType !== 'content_screen' && chalType !== 'visual_lesson_screen') {
      triggerNotification("Question stem prompt is required!", "error");
      return;
    }

    // Category C Validations
    if (chalType === 'c1_multiple_choice' || chalType === 'c8_tap_correct_object' || chalType === 'c18_audio_quiz') {
      const filteredOpts = chalMcqOptions.map(o => o.trim()).filter(Boolean);
      if (filteredOpts.length < 2) {
        triggerNotification("Minimum 2 options required!", "error");
        return;
      }
      if (!chalMcqCorrect.trim()) {
        triggerNotification("Correct answer missing!", "error");
        return;
      }
    }
    if (chalType === 'c2_fill_in_blank') {
      const filteredOpts = chalFillBlankOptions.map(o => o.trim()).filter(Boolean);
      if (filteredOpts.length < 2) {
        triggerNotification("Minimum 2 options required!", "error");
        return;
      }
      if (!chalFillBlankCorrect.trim()) {
        triggerNotification("Correct answer missing!", "error");
        return;
      }
    }
    if (chalType === 'c3_sentence_builder' && !chalSentenceTarget.trim()) {
      triggerNotification("Target sentence is required!", "error");
      return;
    }
    if (chalType === 'c4_concept_matcher') {
      const pairs = chalConceptPairs.filter(p => p.left.trim() && p.right.trim());
      if (pairs.length < 1) {
        triggerNotification("Please provide at least one matching pair!", "error");
        return;
      }
    }
    if (chalType === 'c5_bucket_sort') {
      if (!chalDragBucket1.trim() || !chalDragBucket2.trim()) {
        triggerNotification("Both Bucket Names are required!", "error");
        return;
      }
      const items = chalBucketSortItems.filter(i => i.text.trim());
      if (items.length < 1) {
        triggerNotification("At least one item required to sort!", "error");
        return;
      }
    }
    if (chalType === 'c6_timeline_sort' || chalType === 'c7_sequence_builder') {
      const steps = chalTimelineSteps.filter(s => s.text.trim());
      if (steps.length < 2) {
        triggerNotification("Minimum 2 chronological steps required to sort!", "error");
        return;
      }
    }
    if (chalType === 'c9_true_false' && !chalMcqCorrect.trim()) {
      triggerNotification("Correct answer missing! Select True or False.", "error");
      return;
    }
    if (chalType === 'c10_swipe_left_right') {
      if (!chalMcqCorrect.trim()) {
        triggerNotification("Correct answer missing! Select Swipe Left or Right.", "error");
        return;
      }
      if (!chalSwipeLeftLabel.trim() || !chalSwipeRightLabel.trim()) {
        triggerNotification("Both Left and Right action labels are required!", "error");
        return;
      }
    }
    if (chalType === 'c11_image_classification') {
      if (!chalDragBucket1.trim() || !chalDragBucket2.trim()) {
        triggerNotification("Both Category Names are required!", "error");
        return;
      }
      const items = chalImgClassifyItems.filter(i => i.text.trim());
      if (items.length < 1) {
        triggerNotification("Please add at least one classification item!", "error");
        return;
      }
    }
    if (chalType === 'c12_label_diagram') {
      if (!chalImageUrl.trim()) {
        triggerNotification("Upload at least one image / diagram URL!", "error");
        return;
      }
      if (chalC12Chips.filter(c => c.text.trim()).length < 1) {
        triggerNotification("Please provide at least one label chip!", "error");
        return;
      }
    }
    if (chalType === 'c13_hotspot_question') {
      if (!chalImageUrl.trim()) {
        triggerNotification("Upload at least one image URL!", "error");
        return;
      }
      if (chalC13Hotspots.length < 1) {
        triggerNotification("At least one hotspot required!", "error");
        return;
      }
    }
    if (chalType === 'c14_memory_flip_cards') {
      const cards = chalC14Cards.filter(c => c.front.trim() && c.back.trim());
      if (cards.length < 2) {
        triggerNotification("Please provide at least 2 matching card pairs!", "error");
        return;
      }
    }
    if (chalType === 'c15_drag_complete_diagram') {
      if (chalC15Steps.filter(s => s.text.trim()).length < 1) {
        triggerNotification("Please provide steps for diagram!", "error");
        return;
      }
      if (chalMcqOptions.map(o => o.trim()).filter(Boolean).length < 2) {
        triggerNotification("Minimum 2 options required!", "error");
        return;
      }
      if (!chalMcqCorrect.trim()) {
        triggerNotification("Correct answer missing!", "error");
        return;
      }
    }
    if (chalType === 'c16_eliminate_wrong') {
      const opts = chalC16Options.filter(o => o.text.trim());
      if (opts.length < 2) {
        triggerNotification("Minimum 2 options required!", "error");
        return;
      }
    }
    if (chalType === 'c17_arrange_images') {
      const items = chalC17Items.filter(i => i.imageUrl.trim());
      if (items.length < 2) {
        triggerNotification("Upload at least one image (Minimum 2 required to arrange)!", "error");
        return;
      }
    }
    if (chalType === 'c18_audio_quiz') {
      if (!chalAudioUrl.trim()) {
        triggerNotification("Audio file required!", "error");
        return;
      }
    }

    const finalChalId = chalId.trim() || 'chal_' + Date.now().toString().slice(-6);

    let finalChallenge: Challenge = {
      id: finalChalId,
      type: chalType,
      question: chalQuestion.trim(),
      explanation: {
        text: chalExplanation.trim() || "Aibo says: Perfect observing logic!",
        audioUrl: explanationAudioUrl || "",
        audioDuration: Number(explanationAudioDuration) || 0,
        hinglish: {
          text: chalExplanation.trim() || "Aibo says: Perfect observing logic!",
          audioUrl: explanationAudioUrl || "",
          audioDuration: Number(explanationAudioDuration) || 0
        },
        marathi: {
          text: chalExplanationMarathi.trim() || "",
          audioUrl: explanationAudioUrlMarathi || "",
          audioDuration: Number(explanationAudioDurationMarathi) || 0
        }
      },
      xpValue: Number(chalXpValue) || 10,
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

    // Format fields depending on type
    switch (chalType) {
      case 'tap_right_answer': {
        const filteredOpts = chalMcqOptions.map(o => o.trim()).filter(Boolean);
        if (filteredOpts.length < 2) {
          triggerNotification("Please provide at least 2 option cards for Multiple Choice!", "error");
          return;
        }
        finalChallenge.options = filteredOpts;
        finalChallenge.correctAnswer = chalMcqCorrect.trim() || filteredOpts[0];
        break;
      }
      case 'fill_in_blank': {
        const filteredOpts = chalFillBlankOptions.map(o => o.trim()).filter(Boolean);
        if (filteredOpts.length < 2) {
          triggerNotification("Provide blank fill options!", "error");
          return;
        }
        finalChallenge.options = filteredOpts;
        finalChallenge.correctAnswer = chalFillBlankCorrect.trim() || filteredOpts[0];
        break;
      }
      case 'image_reveal': {
        const filteredOpts = chalMcqOptions.map(o => o.trim()).filter(Boolean);
        finalChallenge.imageUrl = chalImageUrl;
        finalChallenge.options = filteredOpts.length > 0 ? filteredOpts : ["Core concept discovered", "Abstract visual shape"];
        finalChallenge.correctAnswer = chalMcqCorrect.trim() || finalChallenge.options[0];
        break;
      }
      case 'ai_vs_human': {
        finalChallenge.outputs = [
          {
            id: 'opt_human',
            title: chalAiCardATitle || 'Card A: Clue',
            text: chalAiCardAText || 'An imagined unscientific theory claims comets carry live engines.',
            authorLabel: 'Fiction Card',
            isAI: false,
            emojis: '❌🌀'
          },
          {
            id: 'opt_ai',
            title: chalAiCardBTitle || 'Card B: True Fact',
            text: chalAiCardBText || 'Scientific facts confirm that solar sun wind melts frozen water content.',
            authorLabel: 'Verified Science Card',
            isAI: true,
            emojis: '✅⚡'
          }
        ];
        finalChallenge.correctAnswer = chalAiCorrectCard;
        break;
      }
      case 'spot_the_ai': {
        finalChallenge.items = [
          { 
            id: 'fa1', 
            text: chalSpotText1 || 'Electric biology generates organic sparks.', 
            has_ai: chalSpotIsReal1,
            explanation: chalSpotExpl1 || 'True scientific reality!'
          },
          { 
            id: 'fa2', 
            text: chalSpotText2 || 'Water floats upwards in room temperature boilers without fire.', 
            has_ai: chalSpotIsReal2,
            explanation: chalSpotExpl2 || 'Absurd mechanics scenario.'
          }
        ];
        break;
      }
      case 'drag_and_drop': {
        finalChallenge.buckets = [
          { id: 'b1', label: chalDragBucket1 },
          { id: 'b2', label: chalDragBucket2 }
        ];
        finalChallenge.items = [
          { id: 'di1', text: chalDragItem1Text, correct_bucket: chalDragItem1Bucket === 'bucket1' ? 'b1' : 'b2' },
          { id: 'di2', text: chalDragItem2Text, correct_bucket: chalDragItem2Bucket === 'bucket1' ? 'b1' : 'b2' }
        ];
        break;
      }
      case 'match_pairs': {
        finalChallenge.pairs = [
          { left: chalPairLeft1 || 'Sunlight', right: chalPairRight1 || 'Baking Stove' },
          { left: chalPairLeft2 || 'Comet core', right: chalPairRight2 || 'Snow boulder' }
        ];
        break;
      }
      case 'sort_sequence': {
        const steps = [
          { id: 's1', text: chalSortStep1 || 'Roots draw minerals' },
          { id: 's2', text: chalSortStep2 || 'Fluids move up stem' },
          { id: 's3', text: chalSortStep3 || 'Chlorophyll traps rays' },
          { id: 's4', text: chalSortStep4 || 'Oxygen discharges' }
        ].filter(s => s.text.trim());
        if (steps.length < 2) {
          triggerNotification("Provide at least 2 chronological steps to sort!", "error");
          return;
        }
        finalChallenge.steps = steps;
        finalChallenge.correctOrder = steps.map(s => s.id);
        break;
      }
      case 'build_concept': {
        const primaryWords = chalSentenceTarget.trim().split(' ').filter(Boolean);
        finalChallenge.targetSentence = chalSentenceTarget.trim() || 'Sunlight fuels cells.';
        finalChallenge.chipsCorrect = chalChipsValue ? chalChipsValue.split(',').map(c => c.trim()) : primaryWords;
        finalChallenge.chipsDistractor = chalChipsDistractors ? chalChipsDistractors.split(',').map(c => c.trim()) : ['engine', 'boiler'];
        break;
      }
      case 'meme_screen': {
        finalChallenge.memeScreen = {
          imageUrl: chalImageUrl.trim() || "https://images.unsplash.com/photo-1531747118685-ca8fa6e08806",
          title: chalQuestion.trim(),
          explanation: chalExplanation.trim() || "Aibo says: Classic meme layout!"
        };
        break;
      }
      case 'gif_explainer': {
        finalChallenge.gifExplainer = {
          gifUrl: chalImageUrl.trim() || "https://media.giphy.com/media/l0Iy9QYI4C07M0zM4/giphy.gif",
          title: chalQuestion.trim(),
          explanation: chalExplanation.trim() || "Aibo says: High speed loops!",
          caption: "Dynamic Visual Animation"
        };
        break;
      }
      case 'comic_story': {
        finalChallenge.comicStory = {
          title: chalQuestion.trim(),
          panels: [
            { dialogue: "How do humans learn science concept?", characterName: "Aibo", caption: "Initial prompt analysis" },
            { dialogue: "With millions of beautiful flashcard sheets!", characterName: "Flora", caption: "Multi-layered visual weights" }
          ],
          takeaway: chalExplanation.trim() || "Perfect story sequencing!"
        };
        break;
      }
      case 'fun_fact': {
        finalChallenge.funFact = {
          imageUrl: chalImageUrl.trim() || undefined,
          emoji: "🤯",
          headline: chalQuestion.trim(),
          text: chalExplanation.trim() || "Underlying cosmic mechanics are fascinating!",
          triviaSource: "Aibo Curiosity Database"
        };
        break;
      }
      case 'visual_analogy': {
        finalChallenge.visualAnalogy = {
          analogyTitle: chalQuestion.trim(),
          conceptLeft: "Human Learner",
          conceptRight: "Machine Cluster",
          explanationLeft: "Studies textbooks, tests, and mock problems.",
          explanationRight: "Maps statistics of millions of raw picture matrices.",
          mainExplanation: chalExplanation.trim() || "Perfect connection mapped!",
          emojiLeft: "🧑‍🎓",
          emojiRight: "🤖"
        };
        break;
      }
      case 'image_explainer': {
        finalChallenge.imageExplainer = {
          imageUrl: chalImageUrl.trim() || "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
          title: chalQuestion.trim(),
          text: chalExplanation.trim() || "Immersive graphics study",
          caption: "Visual Concept Study Map"
        };
        break;
      }
      case 'ai_around_you': {
        finalChallenge.aiAroundYou = {
          title: chalQuestion.trim(),
          examples: [
            { itemName: "Video Selection", emoji: "📺", description: "Proposes targeted content streams matching historic taps.", hiddenML: "Deep neural filtering stacks" },
            { itemName: "Auto Maps Routing", emoji: "🗺️", description: "Recalculates traffic paths to dodge active jams.", hiddenML: "Real-time search path-finding grids" }
          ]
        };
        break;
      }
      case 'myth_buster': {
        finalChallenge.mythBuster = {
          statement: chalQuestion.trim(),
          isFact: true,
          explanation: chalExplanation.trim() || "Aibo Myth Buster Audit complete!"
        };
        break;
      }
      case 'before_after_story': {
        finalChallenge.beforeAfterStory = {
          situation: chalQuestion.trim(),
          beforeTitle: "Manual Log Crawling",
          beforeText: "Taking multiple hours scanning rows of database files.",
          afterTitle: "Automated Regex Scan",
          afterText: "Detecting malicious structures in under a single click loop.",
          takeaway: chalExplanation.trim() || "Massive efficiency improvement!"
        };
        break;
      }
      case 'student_story': {
        finalChallenge.studentStory = {
          avatar: "🧑‍🎓",
          studentName: "Ada Lovelace",
          scenario: chalQuestion.trim() || "Ada wanted to categorize 300 botany shapes for school.",
          outcome: "With a custom vision classifier, Ada counted and organized them in 10 seconds!",
          quote: chalExplanation.trim() || "Saves hours of paper drafting!"
        };
        break;
      }
      case 'interactive_reveal': {
        finalChallenge.interactiveReveal = {
          heading: chalQuestion.trim(),
          steps: [
            { title: "Understand Context", content: "AI parses the prompt weights.", emoji: "👁️" },
            { title: "Generate Prediction", content: "Statistical arrays vote on high probability.", emoji: "🧬" }
          ]
        };
        break;
      }
      case 'why_should_i_care': {
        finalChallenge.whyShouldICare = {
          challenge: chalQuestion.trim(),
          schoolCategory: "Daily Productivity Lab",
          benefitText: chalExplanation.trim() || "Allows faster homework answers!",
          practicalEmoji: "🎯",
          actionTip: "Automate boring tasks so you can focus on building games!"
        };
        break;
      }
      case 'content_screen':
      case 'visual_lesson_screen': {
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
        // Set both keys just to be totally safe
        finalChallenge.contentScreen = payload;
        finalChallenge.visualLessonScreen = payload;
        break;
      }
      case 'c1_multiple_choice': {
        const filteredOpts = chalMcqOptions.map(o => o.trim()).filter(Boolean);
        finalChallenge.options = filteredOpts.length > 0 ? filteredOpts : ['Option A', 'Option B', 'Option C', 'Option D'];
        finalChallenge.correctAnswer = chalMcqCorrect.trim() || finalChallenge.options[0];
        break;
      }
      case 'c2_fill_in_blank': {
        const filteredOpts = chalFillBlankOptions.map(o => o.trim()).filter(Boolean);
        finalChallenge.options = filteredOpts.length > 0 ? filteredOpts : ['Intelligence', 'Internet', 'Information', 'Input'];
        finalChallenge.correctAnswer = chalFillBlankCorrect.trim() || finalChallenge.options[0];
        break;
      }
      case 'c3_sentence_builder': {
        finalChallenge.targetSentence = chalSentenceTarget.trim() || 'AI learns from data.';
        finalChallenge.chipsCorrect = chalChipsValue ? chalChipsValue.split(',').map(c => c.trim()).filter(Boolean) : finalChallenge.targetSentence.split(' ').filter(Boolean);
        finalChallenge.chipsDistractor = chalChipsDistractors ? chalChipsDistractors.split(',').map(c => c.trim()).filter(Boolean) : ['engine', 'boiler'];
        break;
      }
      case 'c4_concept_matcher': {
        finalChallenge.pairs = chalConceptPairs.filter(p => p.left.trim() && p.right.trim());
        break;
      }
      case 'c5_bucket_sort': {
        finalChallenge.buckets = [
          { id: 'b1', label: chalDragBucket1 || 'Bucket A' },
          { id: 'b2', label: chalDragBucket2 || 'Bucket B' }
        ];
        finalChallenge.items = chalBucketSortItems.filter(i => i.text.trim());
        break;
      }
      case 'c6_timeline_sort':
      case 'c7_sequence_builder': {
        finalChallenge.steps = chalTimelineSteps.filter(s => s.text.trim());
        finalChallenge.correctOrder = finalChallenge.steps.map((s: any) => s.id);
        break;
      }
      case 'c8_tap_correct_object': {
        const filteredOpts = chalMcqOptions.map(o => o.trim()).filter(Boolean);
        finalChallenge.options = filteredOpts.length > 0 ? filteredOpts : ['Object A', 'Object B', 'Object C', 'Object D'];
        finalChallenge.correctAnswer = chalMcqCorrect.trim() || finalChallenge.options[0];
        finalChallenge.items = chalC8Images;
        break;
      }
      case 'c9_true_false': {
        finalChallenge.correctAnswer = chalMcqCorrect.trim().toLowerCase() === 'true' ? 'true' : 'false';
        break;
      }
      case 'c10_swipe_left_right': {
        finalChallenge.correctAnswer = chalMcqCorrect.trim().toLowerCase() === 'left' ? 'left' : 'right';
        finalChallenge.options = [chalSwipeLeftLabel.trim() || 'Left', chalSwipeRightLabel.trim() || 'Right'];
        break;
      }
      case 'c11_image_classification': {
        finalChallenge.buckets = [
          { id: 'b1', label: chalDragBucket1 || 'Category A' },
          { id: 'b2', label: chalDragBucket2 || 'Category B' }
        ];
        finalChallenge.items = chalImgClassifyItems.filter(i => i.text.trim());
        break;
      }
      case 'c12_label_diagram': {
        finalChallenge.imageUrl = chalImageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600';
        finalChallenge.hotspots = chalC12Hotspots;
        finalChallenge.items = chalC12Chips.filter(c => c.text.trim());
        break;
      }
      case 'c13_hotspot_question': {
        finalChallenge.imageUrl = chalImageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600';
        finalChallenge.hotspots = chalC13Hotspots;
        break;
      }
      case 'c14_memory_flip_cards': {
        finalChallenge.cards = chalC14Cards.filter(c => c.front.trim() && c.back.trim());
        break;
      }
      case 'c15_drag_complete_diagram': {
        finalChallenge.steps = chalC15Steps.filter(s => s.text.trim());
        const filteredOpts = chalMcqOptions.map(o => o.trim()).filter(Boolean);
        finalChallenge.options = filteredOpts.length > 0 ? filteredOpts : ['Option A', 'Option B'];
        finalChallenge.correctAnswer = chalMcqCorrect.trim() || finalChallenge.options[0];
        break;
      }
      case 'c16_eliminate_wrong': {
        finalChallenge.options = chalC16Options.filter(o => o.text.trim());
        break;
      }
      case 'c17_arrange_images': {
        finalChallenge.items = chalC17Items.filter(i => i.imageUrl.trim());
        finalChallenge.correctOrder = finalChallenge.items.map((i: any) => i.id);
        break;
      }
      case 'c18_audio_quiz': {
        finalChallenge.audioUrl = chalAudioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        const filteredOpts = chalMcqOptions.map(o => o.trim()).filter(Boolean);
        finalChallenge.options = filteredOpts.length > 0 ? filteredOpts : ['Option A', 'Option B'];
        finalChallenge.correctAnswer = chalMcqCorrect.trim() || finalChallenge.options[0];
        break;
      }
    }

    // Insert challenge into selected lesson with overwrite/duplicate support
    const allMods = [...modulesList, ...practiceModulesList];
    const targetMod = allMods.find(m => m.id === selectedModuleId);
    const targetLes = targetMod?.lessons?.find(l => l.id === selectedLessonId);
    if (!targetLes) {
      triggerNotification("Target lesson not found in state!", "error");
      return;
    }

    const exists = (targetLes.challenges || []).some(c => c.id === finalChallenge.id);
    let newChallenges = [];
    if (exists) {
      newChallenges = (targetLes.challenges || []).map(c => c.id === finalChallenge.id ? finalChallenge : c);
    } else {
      newChallenges = [...(targetLes.challenges || []), finalChallenge];
    }

    const updatedLessonData: Lesson = {
      ...targetLes,
      challenges: newChallenges
    };

    (async () => {
      try {
        const savedLesson = await saveSingleLesson(selectedModuleId, updatedLessonData);

        const updateTargetLesson = (l: Lesson) => (l.id === selectedLessonId ? savedLesson : l);
        const updatedAi = modulesList.map(m => m.id === selectedModuleId ? { ...m, lessons: m.lessons.map(updateTargetLesson) } : m);
        const updatedPrac = practiceModulesList.map(m => m.id === selectedModuleId ? { ...m, lessons: m.lessons.map(updateTargetLesson) } : m);

        setModulesList(updatedAi);
        setPracticeModulesList(updatedPrac);
        setRawJsonText(JSON.stringify({ spaceCurriculum: updatedAi, practiceCurriculum: updatedPrac }, null, 2));

        triggerNotification(`Successfully saved challenge screen to lesson and database!`, "success");
        soundManager.play('complete');
      } catch (err: any) {
        console.error("Failed to save screen to lesson:", err);
        triggerNotification("Failed to save screen to database: " + (err?.message || "Unknown error"), "error");
        soundManager.play('incorrect');
      }
    })();

    // resets
    setChalId('');
    setChalQuestion('');
    setChalExplanation('');
    setExplanationAudioUrl('');
    setExplanationAudioDuration(0);
    setChalMcqCorrect('');
    setChalMcqOptions(['', '', '', '']);
    setChalC8Images(['', '', '', '']);
    setChalFillBlankCorrect('');
    setChalFillBlankOptions(['', '', '', '']);
    setChalHint('');
    setChalDifficulty('easy');
    setChalContinueText('Continue');
    setChalMascotMessage('');
    setChalConceptPairs([{ left: 'AI', right: 'Artificial Intelligence' }]);
    setChalBucketSortItems([{ id: 'i1', text: 'Data', correct_bucket: 'b1' }]);
    setChalTimelineSteps([{ id: 's1', text: 'Step A' }]);
    setChalAudioUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    setChalSwipeLeftLabel('Left option');
    setChalSwipeRightLabel('Right option');
    setChalImgClassifyItems([{ id: 'img1', text: 'Item 1', imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150', correct_bucket: 'b1' }]);
    setChalC12Hotspots([{ id: 'h1', label: 'Spot A', x: 25, y: 35, correct_bucket: 'chip1' }]);
    setChalC12Chips([{ id: 'chip1', text: 'Sensor' }]);
    setChalC13Hotspots([{ id: 'hs1', isCorrectSpot: true, x: 50, y: 50, description: 'Engine' }]);
    setChalC14Cards([{ id: 'card1', front: 'Term A', back: 'Definition A' }]);
    setChalC15Steps([{ id: 'p1', text: 'Step 1' }, { id: 'p2', text: 'Step 2 (Missing)', isMissing: true }]);
    setChalC16Options([{ id: 'o1', text: 'Option A (Correct)', isCorrect: true }, { id: 'o2', text: 'Option B (Wrong)', isCorrect: false }]);
    setChalC17Items([{ id: 'img1', imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150', caption: 'Step 1' }]);
  };

  // 6. DELETE CHALLENGE SCREEN FROM LESSON
  const handleDeleteChallenge = (moduleId: string, lessonId: string, challengeId: string) => {
    triggerConfirm(
      "Delete Screen",
      "Are you sure you want to delete this challenge screen? This action is permanent.",
      async () => {
        const allMods = [...modulesList, ...practiceModulesList];
        const targetMod = allMods.find(m => m.id === moduleId);
        const targetLes = targetMod?.lessons?.find(l => l.id === lessonId);
        if (!targetLes) return;

        const updatedLessonData: Lesson = {
          ...targetLes,
          challenges: (targetLes.challenges || []).filter(c => c.id !== challengeId)
        };

        try {
          const savedLesson = await saveSingleLesson(moduleId, updatedLessonData);

          const updateTargetLesson = (l: Lesson) => (l.id === lessonId ? savedLesson : l);
          const updatedAi = modulesList.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.map(updateTargetLesson) } : m);
          const updatedPrac = practiceModulesList.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.map(updateTargetLesson) } : m);

          setModulesList(updatedAi);
          setPracticeModulesList(updatedPrac);
          setRawJsonText(JSON.stringify({ spaceCurriculum: updatedAi, practiceCurriculum: updatedPrac }, null, 2));

          // If the deleted screen is currently loaded for editing, reset the edit state to clear it
          if (chalId === challengeId) {
            setChalId('');
            setChalQuestion('');
            setChalExplanation('');
            setExplanationAudioUrl('');
            setExplanationAudioDuration(0);
            setChalMcqCorrect('');
            setChalMcqOptions(['', '', '', '']);
            setChalFillBlankCorrect('');
            setChalFillBlankOptions(['', '', '', '']);
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

  const selectScreenForEditing = (chal: Challenge, moduleId: string, lessonId: string) => {
    soundManager.play('click');
    setSelectedModuleId(moduleId);
    setSelectedLessonId(lessonId);
    
    setChalId(chal.id);
    setChalType(chal.type);
    setChalQuestion(chal.question);
    
    let text = '';
    let audioUrl = '';
    let audioDuration = 0;
    if (chal.explanation) {
      if (typeof chal.explanation === 'object' && chal.explanation !== null) {
        text = chal.explanation.text || '';
        audioUrl = chal.explanation.audioUrl || '';
        audioDuration = chal.explanation.audioDuration || 0;
      } else {
        text = chal.explanation as string;
      }
    }
    setChalExplanation(text);
    setExplanationAudioUrl(audioUrl);
    setExplanationAudioDuration(audioDuration);

    setChalXpValue(chal.xpValue || 10);
    
    // reset/populate specific properties
    if (chal.options) {
      setChalMcqOptions([...chal.options, '', '', ''].slice(0, 4));
      setChalMcqCorrect(chal.correctAnswer || '');
      setChalFillBlankOptions([...chal.options, '', '', ''].slice(0, 4));
      setChalFillBlankCorrect(chal.correctAnswer || '');
    }
    
    // content / visual screen properties
    const cs = chal.contentScreen || chal.visualLessonScreen;
    if (cs) {
      setContentMediaType(cs.mediaType || 'image');
      setContentMediaUrl(cs.mediaUrl || '');
      setContentBadge(cs.badge || '');
      setContentHeading(cs.heading || '');
      setContentSubheading(cs.subheading || '');
      setContentBody(cs.contentBody || '');
      setContentHighlightBox(cs.highlightBox || '');
      setContentQuote(cs.quote || '');
      setContentQuoteAuthor(cs.quoteAuthor || '');
      setContentBottomMessage(cs.bottomMessage || '');
      
      // Auto-toggle block flags if populated
      setShowMediaInput(!!cs.mediaUrl);
      setShowBadgeInput(!!cs.badge);
      setShowHeadingInput(!!cs.heading);
      setShowSubheadingInput(!!cs.subheading);
      setShowHighlightInput(!!cs.highlightBox);
      setShowQuoteInput(!!cs.quote);
      setShowBottomMsgInput(!!cs.bottomMessage);
    } else {
      setShowMediaInput(false);
      setShowBadgeInput(false);
      setShowHeadingInput(false);
      setShowSubheadingInput(false);
      setShowHighlightInput(false);
      setShowQuoteInput(false);
      setShowBottomMsgInput(false);
    }
    setActiveTab('challenges');
  };

  // Find currently selected module / lesson details
  const currentSelectedModuleObj = [...modulesList, ...practiceModulesList].find(m => m.id === selectedModuleId);
  const currentSelectedLessonObj = currentSelectedModuleObj?.lessons.find(l => l.id === selectedLessonId);

  // Resolved currently selected screen object for Screen Voice narration & editor properties
  const selectedScreenForVoice = useMemo(() => {
    if (chalId) {
      const chals = currentSelectedLessonObj?.challenges || [];
      const match = chals.find(c => c.id === chalId);
      if (match) {
        return {
          ...match,
          type: chalType || match.type,
          question: chalQuestion || match.question,
          explanation: chalExplanation || match.explanation,
          contentHeading: contentHeading || (match as any).contentHeading,
          contentBody: contentBody || (match as any).contentBody,
          contentMediaUrl: contentMediaUrl || (match as any).contentMediaUrl
        };
      }
      return compileCurrentChallenge();
    }
    if (currentSelectedLessonObj?.challenges && currentSelectedLessonObj.challenges.length > 0) {
      return currentSelectedLessonObj.challenges[0];
    }
    return null;
  }, [
    currentSelectedLessonObj,
    chalId,
    chalType,
    chalQuestion,
    chalExplanation,
    contentHeading,
    contentBody,
    contentMediaUrl
  ]);

  // When Screen Editor is active without an explicit screen selected, auto-select the first screen
  useEffect(() => {
    if (activeTab === 'challenges' && !chalId && currentSelectedLessonObj?.challenges && currentSelectedLessonObj.challenges.length > 0) {
      selectChallengeForEditing(selectedModuleId, selectedLessonId, currentSelectedLessonObj.challenges[0]);
    }
  }, [activeTab, chalId, currentSelectedLessonObj?.id, currentSelectedLessonObj?.challenges?.length]);



  const filteredSpaceModules = modulesList.filter(mod => {
    if (!isModuleInSelectedWorld(mod)) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return mod.title.toLowerCase().includes(q) || 
      mod.id.toLowerCase().includes(q) || 
      mod.lessons.some(l => 
        l.title.toLowerCase().includes(q) || 
        l.id.toLowerCase().includes(q) || 
        l.challenges.some(c => c.question?.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
      );
  });

  const filteredPracticeModules = practiceModulesList.filter(mod => {
    if (!isModuleInSelectedWorld(mod)) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return mod.title.toLowerCase().includes(q) || 
      mod.id.toLowerCase().includes(q) || 
      mod.lessons.some(l => 
        l.title.toLowerCase().includes(q) || 
        l.id.toLowerCase().includes(q) || 
        l.challenges.some(c => c.question?.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
      );
  });

  if (!isDbAdmin) {
    return (
      <div className="fixed inset-0 bg-slate-950 text-slate-100 z-[9999] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md bg-slate-900 p-8 rounded-2xl border border-rose-500/20 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5 text-rose-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white mb-2">Access Denied</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Your explorer account (<span className="text-rose-400 font-semibold select-all font-mono">{currentUserEmail || 'No Session'}</span>) does not have administrative permissions to access the Creator Studio.
          </p>
          <button 
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 active:bg-slate-950 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors text-white"
          >
            Return to Space Hub
          </button>
        </div>
      </div>
    );
  }

  const isCurriculumActive = ['manage', 'modules', 'lessons', 'challenges'].includes(activeTab);

  return (
    <div className="fixed inset-0 bg-[#f8fafc] text-slate-800 z-[9999] flex flex-col md:flex-row h-screen w-screen overflow-hidden font-sans select-none antialiased">
      
      {/* MOBILE APP TOP HEADER (STICKY ON MOBILE VIEWPORTS) */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 py-2 flex items-center justify-between gap-2 shadow-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              soundManager.play('click');
              onClose();
            }}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition-colors shrink-0"
            title="Exit Studio"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded-md truncate max-w-[120px]">
                {adminWorlds.find(w => w.id === selectedAdminWorldId)?.title?.split(':')[0] || 'World 1'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </div>
            <h1 className="text-xs font-black text-slate-900 tracking-tight truncate max-w-[170px] leading-tight mt-0.5">
              {mobileNavTab === 'home' && 'Chikoo Studio'}
              {mobileNavTab === 'lessons' && (selectedLessonId ? (currentSelectedLessonObj?.title || 'Lesson Editor') : (selectedModuleId ? (currentSelectedModuleObj?.title || 'Unit View') : 'Curriculum Studio'))}
              {mobileNavTab === 'create' && (activeTab === 'ai-copilot' ? 'AI Copilot' : 'AI Co-Creator')}
              {mobileNavTab === 'analytics' && (activeTab === 'student-intelligence' ? 'Intelligence Hub' : activeTab === 'schools' ? 'Schools Hub' : 'Student Accounts')}
              {mobileNavTab === 'settings' && (activeTab === 'practice-arena' ? 'Practice Arena' : activeTab === 'celebrations' ? 'Celebration Center' : activeTab === 'curriculum-json' ? 'Curriculum JSON' : 'Rewards Store')}
            </h1>
          </div>
        </div>

        {/* Mobile Top Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundManager.play('click');
              setShowWorldPickerSheet(true);
            }}
            className="w-9 h-9 rounded-xl bg-cyan-50 hover:bg-cyan-100 active:scale-95 text-cyan-700 flex items-center justify-center border border-cyan-200/70 transition-colors"
            title="Switch World"
          >
            <Globe size={16} />
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.play('click');
              setShowMobileActionDrawer(true);
            }}
            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center shadow-xs transition-colors"
            title="Quick Create & Actions"
          >
            <Plus size={18} className="stroke-[2.5px]" />
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.play('click');
              setShowMobileProfileDrawer(true);
            }}
            className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200/80 font-black text-xs flex items-center justify-center active:scale-95 transition-transform"
            title="Admin Profile & Tools"
          >
            {currentUserEmail ? currentUserEmail.slice(0, 2).toUpperCase() : 'AD'}
          </button>
        </div>
      </header>

      {/* 1. PRIMARY PERSISTENT SIDEBAR - LINEAR / FIGMA / NOTION WORKSPACE STYLE (DESKTOP ONLY) */}
      <aside className="hidden md:flex w-60 lg:w-64 bg-white border-r border-slate-200/80 flex-col justify-between shrink-0 z-30 select-none">
        
        {/* Top Brand Lockup */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white text-sm font-black shadow-sm shrink-0">
              ⚡
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-tight text-slate-900 font-display truncate leading-none">
                Chikoo Studio
              </h1>
              <span className="text-[10px] font-semibold text-slate-400 block mt-0.5 tracking-wide">
                Creator Platform
              </span>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => {
              soundManager.play('click');
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            title="Exit Studio"
          >
            <ArrowLeft size={16} />
          </button>
        </div>

        {/* Grouped Sidebar Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
          
          {/* SECTION: CURRICULUM */}
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Curriculum & Content
            </span>
            
            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setActiveTab('manage');
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isCurriculumActive
                  ? 'bg-indigo-50 text-indigo-700 font-extrabold shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers size={16} className={isCurriculumActive ? 'text-indigo-600' : 'text-slate-400'} />
              <span className="truncate flex-1 text-left">Curriculum Studio</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                isCurriculumActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {filteredSpaceModules.length + filteredPracticeModules.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setActiveTab('ai-generator');
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'ai-generator'
                  ? 'bg-indigo-50 text-indigo-700 font-extrabold shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles size={16} className={activeTab === 'ai-generator' ? 'text-amber-500' : 'text-amber-400'} />
              <span className="truncate flex-1 text-left">AI Co-Creator</span>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
                AI
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setActiveTab('ai-copilot');
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'ai-copilot'
                  ? 'bg-indigo-50 text-indigo-700 font-extrabold shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Bot size={16} className={activeTab === 'ai-copilot' ? 'text-indigo-600' : 'text-slate-400'} />
              <span className="truncate flex-1 text-left">AI Copilot</span>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                New
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setActiveTab('worlds');
                loadAdminWorlds();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'worlds'
                  ? 'bg-cyan-50 text-cyan-700 font-extrabold shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Globe size={16} className={activeTab === 'worlds' ? 'text-cyan-600' : 'text-slate-400'} />
              <span className="truncate flex-1 text-left">Chikoo Worlds</span>
              <span className="text-[10px] font-mono text-slate-400">
                {adminWorlds.length || 1}
              </span>
            </button>
          </div>

          {/* SECTION: STUDENTS & SCHOOLS */}
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Students & Schools
            </span>

            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setActiveTab('users-list');
                loadAllUsers();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'users-list'
                  ? 'bg-teal-50 text-teal-700 font-extrabold shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Wand2 size={16} className={activeTab === 'users-list' ? 'text-teal-600' : 'text-slate-400'} />
              <span className="truncate flex-1 text-left">Student Accounts</span>
              <span className="text-[10px] font-mono text-slate-400">
                {userProfiles.length || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setActiveTab('student-intelligence');
                loadAllUsers();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'student-intelligence'
                  ? 'bg-teal-50 text-teal-700 font-extrabold shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Cpu size={16} className={activeTab === 'student-intelligence' ? 'text-teal-600' : 'text-slate-400'} />
              <span className="truncate flex-1 text-left">Intelligence Hub</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setActiveTab('schools');
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'schools'
                  ? 'bg-indigo-50 text-indigo-700 font-extrabold shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Building2 size={16} className={activeTab === 'schools' ? 'text-indigo-600' : 'text-slate-400'} />
              <span className="truncate flex-1 text-left">Schools Hub</span>
            </button>
          </div>

          {/* SECTION: PLAY & GAMIFICATION */}
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Engagement & Play
            </span>

            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setActiveTab('practice-arena');
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'practice-arena'
                  ? 'bg-emerald-50 text-emerald-700 font-extrabold shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen size={16} className={activeTab === 'practice-arena' ? 'text-emerald-600' : 'text-slate-400'} />
              <span className="truncate flex-1 text-left">Practice Arena</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setActiveTab('rewards-manager');
                loadAllUsers();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'rewards-manager'
                  ? 'bg-amber-50 text-amber-700 font-extrabold shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Gift size={16} className={activeTab === 'rewards-manager' ? 'text-amber-600' : 'text-slate-400'} />
              <span className="truncate flex-1 text-left">Rewards Store</span>
              {adminRedemptions.filter(r => r.status === 'pending').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setActiveTab('celebrations');
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'celebrations'
                  ? 'bg-violet-50 text-violet-700 font-extrabold shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Trophy size={16} className={activeTab === 'celebrations' ? 'text-violet-600' : 'text-slate-400'} />
              <span className="truncate flex-1 text-left">Celebrations</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setActiveTab('bulk-narrations');
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'bulk-narrations'
                  ? 'bg-pink-900/10 text-pink-500 font-extrabold shadow-3xs border border-pink-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Volume2 size={16} className={activeTab === 'bulk-narrations' ? 'text-pink-500' : 'text-slate-400'} />
              <span className="truncate flex-1 text-left">Bulk Studio Narrations</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setActiveTab('explanation-audio-manager');
                setMobileViewMode('editor');
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'explanation-audio-manager'
                  ? 'bg-indigo-50 text-indigo-700 font-extrabold shadow-3xs border border-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Volume2 size={16} className={activeTab === 'explanation-audio-manager' ? 'text-indigo-600' : 'text-slate-400'} />
              <span className="truncate flex-1 text-left">Explanation Audio Manager</span>
            </button>
          </div>

          {/* SECTION: DEVELOPER & DATA */}
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Developer & Data
            </span>

            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setActiveTab('curriculum-json');
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'curriculum-json'
                  ? 'bg-slate-100 text-slate-900 font-extrabold shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet size={16} className={activeTab === 'curriculum-json' ? 'text-slate-700' : 'text-slate-400'} />
              <span className="truncate flex-1 text-left">Curriculum JSON</span>
            </button>
          </div>
        </div>

        {/* Bottom Profile / Account Strip */}
        <div className="p-3 border-t border-slate-150 bg-slate-50/70 space-y-2 shrink-0">
          <div className="flex items-center gap-2.5 p-1.5 bg-white rounded-xl border border-slate-200/80 shadow-3xs">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0">
              {currentUserEmail ? currentUserEmail.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold text-slate-800 truncate">
                Admin User
              </span>
              <span className="block text-[9px] font-mono text-slate-400 truncate">
                {currentUserEmail || 'admin@chikoo.ai'}
              </span>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => {
              soundManager.play('complete');
              onClose();
            }}
            className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft size={13} />
            <span>Return to App</span>
          </button>
        </div>
      </aside>

      {/* 2. SECONDARY CURRICULUM TREE EXPLORER (SHOWN IN CURRICULUM MODES) */}
      {isCurriculumActive && (
        <OutlineMap
          modulesList={modulesList}
          practiceModulesList={practiceModulesList}
          adminWorlds={adminWorlds}
          selectedAdminWorldId={selectedAdminWorldId}
          setSelectedAdminWorldId={setSelectedAdminWorldId}
          selectedModuleId={selectedModuleId}
          setSelectedModuleId={setSelectedModuleId}
          selectedLessonId={selectedLessonId}
          setSelectedLessonId={setSelectedLessonId}
          chalId={chalId}
          setChalId={setChalId}
          setSelectedModuleWorldId={setSelectedModuleWorldId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isOutlineCollapsed={isOutlineCollapsed}
          setIsOutlineCollapsed={setIsOutlineCollapsed}
          mobileViewMode={mobileViewMode}
          setMobileViewMode={setMobileViewMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openLessonMenuId={openLessonMenuId}
          setOpenLessonMenuId={setOpenLessonMenuId}
          onSelectModule={selectModuleProperty}
          onSelectLesson={selectLessonProperty}
          onSelectChallenge={selectChallengeForEditing}
          onDuplicateLesson={handleDuplicateLesson}
          onDeleteLesson={handleDeleteLesson}
          onDeleteModule={handleDeleteModule}
          onDeleteChallenge={handleDeleteChallenge}
          onAddUnitInstantly={addUnitInstantly}
          onAddLessonInstantly={addLessonInstantly}
          onCopyLessonJson={copyLessonJsonToClipboard}
          onExportLessonJson={exportLessonAsJsonFile}
          onCopyUnitJson={copyUnitJsonToClipboard}
          onExportUnitJson={exportUnitAsJsonFile}
          onCopyWorldJson={copyWorldJsonToClipboard}
          onExportWorldJson={exportWorldAsJsonFile}
          onOpenImportModal={openImportModal}
          onReorderUnit={reorderUnit}
          onSaveOrder={saveOrder}
          isOrderChanged={isOrderChanged}
          isModuleInSelectedWorld={isModuleInSelectedWorld}
          triggerNotification={triggerNotification}
          soundManager={soundManager}
        />
      )}

      {/* RIGHT COLUMN: INTERACTIVE CREATOR WORKSPACE CANVAS */}
      <main className={`flex-1 overflow-y-auto ${activeTab === 'ai-copilot' ? 'p-2 sm:p-3 md:p-4 pb-4 md:pb-4 space-y-2' : 'p-3 sm:p-5 md:p-8 pb-28 md:pb-8 space-y-4 md:space-y-5'} bg-[#f8fafc] ${mobileViewMode === 'editor' ? 'block' : 'hidden md:block'}`}>
          
          {/* MOBILE APP SUB-NAVIGATION SEGMENTED BAR */}
          <div className="md:hidden sticky top-0 z-30 bg-[#f8fafc]/95 backdrop-blur-md pt-1 pb-2">
            
            {/* 1. LESSONS SECTION SUB-BAR */}
            <MobileStudioNav
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              mobileNavTab={mobileNavTab}
              setMobileViewMode={setMobileViewMode}
              adminWorlds={adminWorlds}
              loadAdminWorlds={loadAdminWorlds}
              soundManager={soundManager}
            />

            {/* 2. CREATE SECTION SUB-BAR */}
            {mobileNavTab === 'create' && (
              <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-200/70 rounded-2xl custom-scrollbar-none">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('ai-generator');
                    setCreateSubTab('ai');
                    setMobileViewMode('editor');
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    activeTab === 'ai-generator' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <Sparkles size={13} className={activeTab === 'ai-generator' ? 'text-amber-300' : 'text-amber-500'} />
                  <span>AI Co-Creator</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('ai-copilot');
                    setMobileViewMode('editor');
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    activeTab === 'ai-copilot' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <Bot size={13} className={activeTab === 'ai-copilot' ? 'text-white' : 'text-indigo-500'} />
                  <span>AI Copilot</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('challenges');
                    setCreateSubTab('screen');
                    setMobileViewMode('editor');
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                    activeTab === 'challenges' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  + New Screen
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('lessons');
                    setCreateSubTab('lesson');
                    setMobileViewMode('editor');
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                    activeTab === 'lessons' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  + New Lesson
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('modules');
                    setCreateSubTab('unit');
                    setMobileViewMode('editor');
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                    activeTab === 'modules' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  + New Unit
                </button>
              </div>
            )}

            {/* 3. ANALYTICS SECTION SUB-BAR */}
            {mobileNavTab === 'analytics' && (
              <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-200/70 rounded-2xl custom-scrollbar-none">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('users-list');
                    setAnalyticsSubTab('users');
                    loadAllUsers();
                    setMobileViewMode('editor');
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    activeTab === 'users-list' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <Users size={13} />
                  <span>Student Accounts ({userProfiles.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('student-intelligence');
                    setAnalyticsSubTab('intelligence');
                    loadAllUsers();
                    setMobileViewMode('editor');
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    activeTab === 'student-intelligence' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <Cpu size={13} />
                  <span>Intelligence Hub</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('schools');
                    setAnalyticsSubTab('schools');
                    setMobileViewMode('editor');
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    activeTab === 'schools' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <Building2 size={13} />
                  <span>Schools</span>
                </button>
              </div>
            )}

            {/* 4. SETTINGS SECTION SUB-BAR */}
            {mobileNavTab === 'settings' && (
              <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-200/70 rounded-2xl custom-scrollbar-none">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('rewards-manager');
                    setSettingsSubTab('rewards');
                    loadRealTimeAdminRewards();
                    setMobileViewMode('editor');
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    activeTab === 'rewards-manager' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <Gift size={13} />
                  <span>Rewards Store</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('practice-arena');
                    setSettingsSubTab('practice');
                    setMobileViewMode('editor');
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    activeTab === 'practice-arena' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <BookOpen size={13} />
                  <span>Practice Arena</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('celebrations');
                    setSettingsSubTab('celebrations');
                    setMobileViewMode('editor');
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    activeTab === 'celebrations' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <Trophy size={13} />
                  <span>Celebrations</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('curriculum-json');
                    setSettingsSubTab('json');
                    setMobileViewMode('editor');
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    activeTab === 'curriculum-json' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <FileSpreadsheet size={13} />
                  <span>Curriculum JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('explanation-audio-manager');
                    setMobileViewMode('editor');
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    activeTab === 'explanation-audio-manager' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <Volume2 size={13} />
                  <span>Explanation Audio</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Studio Breadcrumb & Context Header (Shown outside Curriculum modes) */}
          {!['manage', 'modules', 'lessons', 'challenges'].includes(activeTab) && (
          <div className="bg-white px-3 sm:px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              {/* Outline toggle button for desktop */}
              {isCurriculumActive && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('click');
                    setIsOutlineCollapsed(prev => !prev);
                  }}
                  className={`hidden md:flex px-2 py-1 rounded-lg text-xs font-bold items-center gap-1.5 transition-all cursor-pointer border ${
                    isOutlineCollapsed
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-3xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                  }`}
                  title={isOutlineCollapsed ? "Show Curriculum Outline Map" : "Collapse Curriculum Outline for Full-Width Canvas"}
                >
                  <Layers size={13} className={isOutlineCollapsed ? 'text-indigo-600' : 'text-slate-500'} />
                  <span>{isOutlineCollapsed ? '▶ Show Map' : '◀ Hide Map'}</span>
                </button>
              )}

              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium flex-wrap">
                <span className="text-slate-800 font-bold truncate max-w-[160px]">
                  {adminWorlds.find(w => w.id === selectedAdminWorldId)?.title || 'World 1'}
                </span>
                {currentSelectedModuleObj && (
                  <>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-700 font-semibold truncate max-w-[150px]">
                      {currentSelectedModuleObj.title}
                    </span>
                  </>
                )}
                {currentSelectedLessonObj && (
                  <>
                    <span className="text-slate-300">/</span>
                    <span className="text-indigo-600 font-bold truncate max-w-[180px]">
                      {currentSelectedLessonObj.title}
                    </span>
                  </>
                )}
                {chalId && (
                  <>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-900 font-mono text-[11px] font-bold">
                      Screen ({chalType})
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Real-time Curriculum Save Status Badge */}
            {curriculumSyncStatus.state !== 'idle' && (
              <div className="flex items-center gap-2">
                {curriculumSyncStatus.state === 'saving' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-3xs animate-pulse">
                    <Loader2 size={12} className="animate-spin text-amber-600" />
                    Saving...
                  </span>
                )}
                {curriculumSyncStatus.state === 'saved' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-3xs">
                    <Check size={12} className="text-emerald-600" />
                    Saved ✓
                  </span>
                )}
                {curriculumSyncStatus.state === 'error' && (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('click');
                      retryFailedCurriculumSync();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 shadow-3xs transition cursor-pointer"
                    title={curriculumSyncStatus.message || "Click to retry saving changes"}
                  >
                    <AlertCircle size={12} className="text-rose-600" />
                    Save failed ✗ (click to retry)
                  </button>
                )}
              </div>
            )}

            {/* Context Sub-navigation pills when in Curriculum modes */}
            {['manage', 'modules', 'lessons', 'challenges'].includes(activeTab) && (
              <div className="hidden sm:flex items-center gap-1 p-0.5 bg-slate-100/80 rounded-lg border border-slate-200/60 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('manage');
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === 'manage' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Overview
                </button>

                {currentSelectedModuleObj && (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('click');
                      setActiveTab('modules');
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      activeTab === 'modules' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Unit
                  </button>
                )}

                {currentSelectedLessonObj && (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('click');
                      setActiveTab('lessons');
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      activeTab === 'lessons' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Lesson
                  </button>
                )}

                {currentSelectedLessonObj && (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('click');
                      setActiveTab('challenges');
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      activeTab === 'challenges' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Screen Editor ({currentSelectedLessonObj.challenges?.length || 0})
                  </button>
                )}
              </div>
            )}
          </div>
          )}

          {/* Toast notifications */}
          {notification && (
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 shadow-2xs ${
              notification.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : notification.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              {notification.type === 'success' ? <Check className="text-emerald-500 shrink-0" size={16} /> : <AlertCircle className="text-rose-500 shrink-0" size={16} />}
              <span className="text-xs font-semibold">{notification.text}</span>
            </div>
          )}

          {/* SHEET TAB VIEWS */}

          {activeTab === 'worlds' && (
            <div className="space-y-6 animate-fade-in animate-duration-200">
              <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-6 rounded-3xl text-white shadow-xs relative overflow-hidden">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl opacity-15 pointer-events-none select-none">🌍</div>
                <div className="relative z-10 space-y-1">
                  <h3 className="text-xl font-black font-display tracking-tight">Chikoo Worlds Management</h3>
                  <p className="text-xs text-cyan-50">
                    Manage learning worlds, create new environments, and control world access for students.
                  </p>
                </div>
              </div>

              {/* Create / Edit World Form */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-2xs space-y-4 text-left">
                <h4 className="font-display font-black text-slate-800 text-sm">
                  {editingWorldId ? 'Edit World' : 'Create New World'}
                </h4>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newWorldTitle.trim()) return;
                  const worldPayload = {
                    ...(editingWorldId ? { id: editingWorldId } : {}),
                    world_number: Number(newWorldNumber) || 1,
                    title: newWorldTitle.trim(),
                    description: newWorldDescription.trim(),
                    status: (newWorldStatus as any) || 'active'
                  };
                  try {
                    const saved = await saveWorld(worldPayload);
                    triggerNotification(`World ${saved.world_number} saved successfully!`, 'success');
                    setNewWorldTitle('');
                    setNewWorldDescription('');
                    setEditingWorldId(null);
                    soundManager.play('complete');
                    loadAdminWorlds();
                  } catch (err: any) {
                    console.error('World save error:', err);
                    triggerNotification(`Failed to save world: ${err?.message || 'Database error'}`, 'error');
                  }
                }} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-slate-500">World Number</label>
                      <input 
                        type="number"
                        value={newWorldNumber}
                        onChange={(e) => setNewWorldNumber(Number(e.target.value))}
                        min={1}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-slate-500">World Title</label>
                      <input 
                        type="text"
                        value={newWorldTitle}
                        onChange={(e) => setNewWorldTitle(e.target.value)}
                        placeholder="e.g. Prompt Mastery Realm"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-slate-500">Status</label>
                      <select
                        value={newWorldStatus}
                        onChange={(e) => setNewWorldStatus(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                      >
                        <option value="active">Active (Unlocked / Selectable)</option>
                        <option value="draft">Draft (Locked)</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-slate-500">Description</label>
                    <textarea 
                      value={newWorldDescription}
                      onChange={(e) => setNewWorldDescription(e.target.value)}
                      placeholder="Describe what students learn in this world..."
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {editingWorldId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWorldId(null);
                          setNewWorldTitle('');
                          setNewWorldDescription('');
                          setNewWorldNumber(adminWorlds.length + 1);
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
                    >
                      {editingWorldId ? 'Update World' : 'Create World'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Worlds List */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-2xs space-y-4 text-left">
                <h4 className="font-display font-black text-slate-800 text-sm">
                  Active Registered Worlds ({adminWorlds.length})
                </h4>

                {adminWorlds.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 italic text-xs">
                    No worlds registered yet. Create World 1 to get started!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adminWorlds.map((w) => (
                      <div key={w.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-md">
                              World {w.world_number}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ID: {w.id}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                              w.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {w.status}
                            </span>
                          </div>
                          <h5 className="font-extrabold text-slate-900 text-sm">{w.title}</h5>
                          {w.description && <p className="text-xs text-slate-500">{w.description}</p>}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <button
                            type="button"
                            onClick={() => openImportModal({ level: 'unit', worldId: w.id })}
                            className="p-1.5 bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 text-cyan-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-3xs"
                            title={`Import Unit directly into World ${w.world_number}`}
                          >
                            <Plus size={13} />
                            <span>Import Unit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => copyWorldJsonToClipboard(w)}
                            className="p-1.5 bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-3xs"
                            title="Copy Entire World & Units JSON to Clipboard"
                          >
                            <Copy size={13} />
                            <span className="hidden sm:inline">Copy JSON</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => exportWorldAsJsonFile(w)}
                            className="p-1.5 bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-3xs"
                            title="Download Entire World & Units JSON File"
                          >
                            <Download size={13} />
                            <span className="hidden sm:inline">Export File</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWorldId(w.id);
                              setNewWorldNumber(w.world_number);
                              setNewWorldTitle(w.title);
                              setNewWorldDescription(w.description || '');
                              setNewWorldStatus(w.status || 'active');
                              soundManager.play('click');
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 rounded-xl transition cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete World ${w.world_number} (${w.title})?`)) {
                                try {
                                  await deleteWorld(w.id);
                                  triggerNotification(`World ${w.world_number} deleted`, 'success');
                                  soundManager.play('complete');
                                  loadAdminWorlds();
                                } catch (err) {
                                  triggerNotification('Failed to delete world', 'error');
                                }
                              }
                            }}
                            className="p-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition cursor-pointer"
                            title="Delete World"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'bulk-narrations' && (
            <div className="space-y-6 animate-fade-in animate-duration-200">
              <BulkNarrationQueue 
                modulesList={modulesList}
                practiceModulesList={practiceModulesList}
                lessonTitle=""
                onSaveCurriculum={(updatedSpace, updatedPrac) => {
                  setModulesList(updatedSpace);
                  setPracticeModulesList(updatedPrac);
                  saveCurriculumToStorage(updatedSpace, updatedPrac);
                }}
              />
            </div>
          )}

          {activeTab === 'explanation-audio-manager' && (
            <div className="space-y-6 animate-fade-in animate-duration-200">
              <ExplanationAudioManager />
            </div>
          )}

          {activeTab === 'schools' && (
            <div className="space-y-6 animate-fade-in animate-duration-200">
              <SchoolsManagement
                onNotification={(msg, type) => triggerNotification(msg, type === 'error' ? 'error' : 'success')}
              />
            </div>
          )}

          {activeTab === 'student-intelligence' && (
            <div className="space-y-6 animate-fade-in animate-duration-200">
              <StudentIntelligence
                userProfiles={userProfiles}
                currentUserEmail={currentUserEmail}
              />
            </div>
          )}

          {activeTab === 'users-list' && (
            <div className="space-y-6 animate-fade-in animate-duration-200">
              <UserManagement
                userProfiles={userProfiles}
                currentUserEmail={currentUserEmail}
                onRefreshUsers={loadAllUsers}
                triggerNotification={triggerNotification}
              />
            </div>
          )}

          {false && (
            <div className="space-y-6 animate-fade-in animate-duration-200">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                  <div>
                    <div className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-widest flex items-center gap-1.5 mb-1">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-pulse'}`}></span>
                      <span>DATABASE CONNECTIVITY: {isSupabaseConfigured ? 'CONNECTED SUPABASE LIVE' : 'CLIENT-SIDE FALLBACK RUNNING'}</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Trophy className="text-teal-600" size={20} />
                      Student Accounts & User Management
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      View all registered student profiles, adjust performance metrics (XP, Gems, Streaks, Energy), modify account classifications, or reset profiles.
                    </p>
                  </div>
                  <button
                    onClick={() => { soundManager.play('click'); loadAllUsers(); }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-150 text-slate-700 text-xs font-black rounded-xl border border-slate-200 flex items-center gap-1.5 transition cursor-pointer self-start"
                  >
                    <RefreshCw size={13} className={isLoadingUsers ? 'animate-spin text-teal-600' : ''} />
                    <span>Synchronize Lists</span>
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search by student email or custom username..."
                    value={usersSearchQuery}
                    onChange={(e) => setUsersSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-teal-500 text-slate-950 placeholder-slate-400 transition-colors"
                  />
                </div>

                {isLoadingUsers ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-teal-600 rounded-full animate-spin" />
                    <span className="text-xs text-slate-400 font-mono">Fetching profiles dataset...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const filtered = userProfiles.filter(u => 
                        u.email.toLowerCase().includes(usersSearchQuery.toLowerCase()) ||
                        u.username.toLowerCase().includes(usersSearchQuery.toLowerCase())
                      );

                      if (filtered.length === 0) {
                        return (
                          <div className="p-8 text-center border-2 border-dashed border-slate-155 rounded-2xl bg-slate-50">
                            <span className="text-xs text-slate-400 font-medium">No candidate student matches current filtered search parameter.</span>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filtered.map((user, idx) => {
                            const isEditing = editingUserIdx === idx;
                            return (
                              <div key={user.email} className={`p-5 rounded-2xl border transition-all ${isEditing ? 'border-teal-400 bg-teal-50/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 uppercase font-black text-slate-600">
                                      {user.username.slice(0, 2)}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-black text-slate-900 truncate max-w-[120px]">{user.username}</h4>
                                        {user.is_admin && <span className="text-[8px] bg-rose-500 text-white font-black px-1 rounded">ADMIN</span>}
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[160px]">{user.email}</span>
                                    </div>
                                  </div>

                                  {!isEditing && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        soundManager.play('click');
                                        setEditingUserIdx(idx);
                                        setEditUserUsername(user.username);
                                        setEditUserXp(user.xp);
                                        setEditUserGems(user.gems);
                                        setEditUserStreak(user.streak);
                                        setEditUserEnergy(user.energy);
                                        setEditUserAccuracy(user.accuracy);
                                        setEditUserIsAdmin(user.is_admin);
                                      }}
                                      className="px-2.5 py-1.5 text-[10px] font-black text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                                    >
                                      Edit Stats
                                    </button>
                                  )}
                                </div>

                                {isEditing ? (
                                  <form onSubmit={(e) => { e.preventDefault(); handleUpdateUsersProfile(idx); }} className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                                    <h5 className="text-[9px] font-black uppercase text-teal-700 tracking-wider">Modify Profile Node:</h5>
                                    
                                    <div className="grid grid-cols-2 gap-3.5">
                                      <div className="space-y-1">
                                        <label className="block text-[8px] font-extrabold uppercase text-slate-400">Username</label>
                                        <input
                                          type="text"
                                          value={editUserUsername}
                                          onChange={(e) => setEditUserUsername(e.target.value)}
                                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                                          required
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="block text-[8px] font-extrabold uppercase text-slate-400">Total XP</label>
                                        <input
                                          type="number"
                                          value={editUserXp}
                                          onChange={(e) => setEditUserXp(Number(e.target.value))}
                                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                                          required
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="block text-[8px] font-extrabold uppercase text-slate-400">Cookies</label>
                                        <input
                                          type="number"
                                          value={editUserGems}
                                          onChange={(e) => setEditUserGems(Number(e.target.value))}
                                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                                          required
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="block text-[8px] font-extrabold uppercase text-slate-400">Streak</label>
                                        <input
                                          type="number"
                                          value={editUserStreak}
                                          onChange={(e) => setEditUserStreak(Number(e.target.value))}
                                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                                          required
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="block text-[8px] font-extrabold uppercase text-slate-400">Energy (1-5)</label>
                                        <input
                                          type="number"
                                          min={0}
                                          max={5}
                                          value={editUserEnergy}
                                          onChange={(e) => setEditUserEnergy(Number(e.target.value))}
                                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                                          required
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="block text-[8px] font-extrabold uppercase text-slate-400">Precision Ratio (0-1)</label>
                                        <input
                                          type="number"
                                          step="0.05"
                                          min="0"
                                          max="1"
                                          value={editUserAccuracy}
                                          onChange={(e) => setEditUserAccuracy(Number(e.target.value))}
                                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                                          required
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1 pb-1">
                                      <input
                                        type="checkbox"
                                        id={`isAdminCheck-${idx}`}
                                        checked={editUserIsAdmin}
                                        onChange={(e) => setEditUserIsAdmin(e.target.checked)}
                                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                      />
                                      <label htmlFor={`isAdminCheck-${idx}`} className="text-[10px] font-black uppercase text-slate-500 select-none">Classify as Administrative Admin</label>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                      <button
                                        type="button"
                                        onClick={() => { soundManager.play('click'); setEditingUserIdx(null); }}
                                        className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        className="px-3.5 py-1.5 text-xs font-black bg-teal-600 text-white hover:bg-teal-500 rounded-lg transition"
                                      >
                                        Save Changes
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <>
                                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-mono border-t border-slate-100/60 pt-3">
                                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <span className="text-slate-400 block text-[8px] font-extrabold tracking-wider uppercase">★ EXP</span>
                                        <span className="font-extrabold text-slate-800">{user.xp || 0}</span>
                                      </div>
                                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <span className="text-slate-400 block text-[8px] font-extrabold tracking-wider uppercase">◆ GEMS</span>
                                        <span className="font-extrabold text-slate-800">{user.gems || 0}</span>
                                      </div>
                                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <span className="text-slate-400 block text-[8px] font-extrabold tracking-wider uppercase">⚡ STREAK</span>
                                        <span className="font-extrabold text-slate-800">{user.streak || 0}d</span>
                                      </div>
                                    </div>

                                    {/* Instantly Award Diamonds */}
                                    <div className="mt-3 pt-3 border-t border-slate-100/60 space-y-2">
                                      <span className="text-[8px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                                        <img src="/cookies.webp" alt="Cookies" className="w-3.5 h-3.5 object-contain shrink-0" /> Award Cookies:
                                      </span>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {[100, 250, 500, 1000].map(qty => (
                                          <button
                                            key={qty}
                                            type="button"
                                            onClick={async () => {
                                              soundManager.play('complete');
                                              try {
                                                const newGems = (user.gems || 0) + qty;
                                                await updateProfile(user.email, { gems: newGems });
                                                if (onProfileUpdated) {
                                                  onProfileUpdated(user.email, { gems: newGems });
                                                }
                                                triggerNotification(`Awarded +${qty} Cookies to ${user.username || user.email}!`, 'success');
                                                loadAllUsers();
                                              } catch (e) {
                                                console.error(e);
                                                triggerNotification("Could not record given diamonds", "error");
                                              }
                                            }}
                                            className="px-2 py-1 text-[9px] font-black text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 rounded-lg transition active:scale-95 cursor-pointer"
                                          >
                                            +{qty}
                                          </button>
                                        ))}
                                        
                                        {/* Custom input */}
                                        <form 
                                          onSubmit={async (e) => {
                                            e.preventDefault();
                                            const formEl = e.currentTarget;
                                            const inputEl = formEl.elements.namedItem('customQty') as HTMLInputElement;
                                            const qty = parseInt(inputEl.value);
                                            if (!qty || qty <= 0) return;
                                            soundManager.play('complete');
                                            try {
                                              const newGems = (user.gems || 0) + qty;
                                              await updateProfile(user.email, { gems: newGems });
                                              if (onProfileUpdated) {
                                                onProfileUpdated(user.email, { gems: newGems });
                                              }
                                              triggerNotification(`Awarded +${qty} Cookies to ${user.username || user.email}!`, 'success');
                                              inputEl.value = '';
                                              loadAllUsers();
                                            } catch (e) {
                                              console.error(e);
                                              triggerNotification("Error saving awarded diamonds", "error");
                                            }
                                          }}
                                          className="flex items-center gap-1 min-w-[80px] flex-grow"
                                        >
                                          <input
                                            name="customQty"
                                            type="number"
                                            placeholder="..."
                                            className="w-1 focus:flex-grow flex-grow bg-slate-50 border border-slate-200 text-[10px] font-bold rounded-lg px-2 py-0.5 outline-none focus:border-indigo-400"
                                            min={1}
                                          />
                                          <button
                                            type="submit"
                                            className="px-2 py-0.5 text-[9px] font-black text-white bg-indigo-650 hover:bg-indigo-600 rounded-lg transition cursor-pointer"
                                          >
                                            Award
                                          </button>
                                        </form>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'rewards-manager' && (
            <div className="space-y-6 animate-fade-in animate-duration-250 text-left">
              {/* Header card info */}
              <div className="bg-linear-to-r from-amber-655 to-amber-800 p-6 rounded-3xl text-white shadow-xs relative overflow-hidden">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl opacity-15 pointer-events-none select-none">🎁</div>
                <div className="relative z-10 space-y-1">
                  <h3 className="text-xl font-black font-display tracking-tight">Rewards Store Registry</h3>
                  <p className="text-xs text-amber-50">
                    Curate learning aspiration goals, set required standards, and approve or reject student redemption requests below.
                  </p>
                </div>
              </div>

              {/* Grid content: Pending Approvals & List curated */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Pending Requests Column (Left on desktop) */}
                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                      <h4 className="font-display font-black text-slate-800 text-sm">Redemption Authorizations</h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100 font-bold">
                      Manual Approval Required
                    </span>
                  </div>

                  {(() => {
                    const reqs = adminRedemptions.length > 0 ? adminRedemptions : getRedemptionRequests();
                    const pending = reqs.filter(r => r.status === 'pending');

                    const handleAction = async (id: string, action: 'approve' | 'reject') => {
                      const updated = reqs.map(r => {
                        if (r.id === id) {
                          const requestOwner = r.userEmail;
                          if (action === 'reject') {
                            // Refund Gems / XP
                            try {
                              const userToRefund = userProfiles.find(p => p.email === requestOwner);
                              if (userToRefund) {
                                if (r.gemsPaid) {
                                  updateProfile(userToRefund.email, {
                                    gems: (userToRefund.gems || 0) + r.gemsPaid
                                  });
                                }
                                if (r.xpPaid) {
                                  updateProfile(userToRefund.email, {
                                    xp: (userToRefund.xp || 0) + r.xpPaid
                                  });
                                }
                              }
                            } catch (err) {
                              console.error("Refund error:", err);
                            }
                          }
                          return { ...r, status: action === 'approve' ? 'approved' as const : 'rejected' as const };
                        }
                        return r;
                      });
                      saveRedemptionRequests(updated);
                      setAdminRedemptions(updated);
                      const targetReq = updated.find(r => r.id === id);
                      if (targetReq) {
                        await saveRedemptionRequestAsync(targetReq);
                      }
                      soundManager.play('complete');
                      // trigger re-render
                      setTimeout(() => setActiveTab('rewards-manager'), 50);
                    };

                    if (pending.length === 0) {
                      return (
                        <div className="text-center py-8 text-slate-400 space-y-2">
                          <p className="text-[11px] font-extrabold uppercase mt-1">All Clear Cadet!</p>
                          <p className="text-[10px] text-slate-400">There are no pending redemption requests that require manual approval at this time.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {pending.map((req) => (
                          <div key={req.id} className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl relative space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-extrabold text-slate-800 text-xs">{req.rewardTitle}</h5>
                                <p className="text-[10px] text-indigo-600 font-bold mt-0.5">{req.username || req.userEmail}</p>
                              </div>
                              <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-lg border border-amber-100 font-semibold font-bold">
                                Pending
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Redeemed: {new Date(req.createdAt).toLocaleDateString()}</span>
                              <span className="font-bold text-slate-655 font-bold">
                                {req.gemsPaid ? `💎 ${req.gemsPaid} Gems` : `🏆 ${req.xpPaid} XP`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 pt-1 border-t border-slate-150/50">
                              <button 
                                onClick={() => handleAction(req.id, 'reject')}
                                className="flex-1 py-1 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-655 rounded-lg text-[10px] font-black transition-all cursor-pointer"
                              >
                                Reject & Refund
                              </button>
                              <button 
                                onClick={() => handleAction(req.id, 'approve')}
                                className="flex-1 py-1 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-655 rounded-lg text-[10px] font-black transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Rewards Curator Column (Right on desktop) */}
                <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-2xs space-y-6">
                  {/* Curated list & Creator */}
                  {(() => {
                    const dbRewards = adminRewards;

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-display font-black text-slate-800 text-sm">Reward Registry ({dbRewards.length})</h4>
                          <button
                            onClick={() => setShowRewardCreator(!showRewardCreator)}
                            className="text-[10px] font-sans font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-250 transition-all font-bold cursor-pointer"
                          >
                            {showRewardCreator ? 'Close Customizer' : '✦ Add Goal Reward'}
                          </button>
                        </div>

                        {showRewardCreator && (
                          <form onSubmit={handleCreateReward} className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3.5 feedback-toast text-left">
                            <h5 className="font-black text-slate-800 text-xs">Configure Custom Target Reward</h5>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-slate-400">Reward Title</label>
                                <input 
                                  type="text" 
                                  value={newRewardTitle} 
                                  onChange={(e) => setNewRewardTitle(e.target.value)}
                                  placeholder="e.g. Canva Pro (6 Months)"
                                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                                  required
                                  id="newRewardTitleInput"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-slate-400">Category</label>
                                <select 
                                  value={newRewardCategory} 
                                  onChange={(e) => setNewRewardCategory(e.target.value as any)}
                                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                                  id="newRewardCategorySelect"
                                >
                                  <option value="AI Tools">AI Tools</option>
                                  <option value="Spotlight Rewards">Spotlight Rewards</option>
                                  <option value="Digital Rewards">Digital Rewards</option>
                                  <option value="Cosmetic Rewards">Cosmetic Rewards</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-slate-400">Description</label>
                              <textarea 
                                value={newRewardDesc} 
                                onChange={(e) => setNewRewardDesc(e.target.value)}
                                placeholder="Explain terms, what they unlock, and how they redeem..."
                                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 h-14 focus:outline-none focus:border-amber-400 resize-none"
                                required
                                id="newRewardDescTextarea"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-slate-400">Thumbnail Image URL (Optional)</label>
                              <input 
                                type="url" 
                                value={newRewardImg} 
                                onChange={(e) => setNewRewardImg(e.target.value)}
                                placeholder="https://unsplash.com/... or keep blank for default illustration"
                                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2"
                                id="newRewardImgInput"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-slate-400">Cost Currency</label>
                                <select 
                                  value={newRewardReqType} 
                                  onChange={(e) => setNewRewardReqType(e.target.value as any)}
                                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-2 py-2"
                                  id="newRewardReqTypeSelect"
                                >
                                  <option value="gems">Gems</option>
                                  <option value="xp">XP (Points)</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-slate-400">Cost Amount</label>
                                <input 
                                  type="number" 
                                  value={newRewardVal} 
                                  onChange={(e) => setNewRewardVal(Number(e.target.value))}
                                  min={0}
                                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2"
                                  required
                                  id="newRewardValInput"
                                />
                              </div>

                              <div className="flex items-center gap-2 pt-4">
                                <input 
                                  type="checkbox" 
                                  id="newRewardIsPlus"
                                  className="rounded text-amber-500 pointer-events-auto"
                                  checked={newRewardIsPlus} 
                                  onChange={(e) => setNewRewardIsPlus(e.target.checked)}
                                />
                                <label htmlFor="newRewardIsPlus" className="text-[10px] font-bold text-slate-600 select-none cursor-pointer">
                                  🔒 Plus Required
                                </label>
                              </div>
                            </div>

                            <button
                              type="submit"
                              id="curateAddRewardBtn"
                              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-650 text-white font-extrabold text-xs py-2 rounded-xl transition-all cursor-pointer"
                            >
                              Curate & Add Reward
                            </button>
                          </form>
                        )}

                        {editingReward && (
                          <form onSubmit={handleUpdateReward} className="bg-amber-50/50 border border-amber-200 p-4 rounded-2xl space-y-3.5 feedback-toast text-left animate-fade-in">
                            <div className="flex items-center justify-between">
                              <h5 className="font-black text-amber-900 text-xs flex items-center gap-1.5">
                                <Edit size={14} className="text-amber-700" />
                                Edit Curated Reward: <span className="text-slate-700 font-bold font-mono">{editingReward.title}</span>
                              </h5>
                              <button
                                type="button"
                                onClick={() => { soundManager.play('click'); setEditingReward(null); }}
                                className="text-slate-450 hover:text-slate-600 transition"
                              >
                                <X size={16} />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-slate-400">Reward Title</label>
                                <input 
                                  type="text" 
                                  value={editRewardTitle} 
                                  onChange={(e) => setEditRewardTitle(e.target.value)}
                                  placeholder="e.g. Canva Pro (6 Months)"
                                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                                  required
                                  id="editRewardTitleInput"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-slate-400">Category</label>
                                <select 
                                  value={editRewardCategory} 
                                  onChange={(e) => setEditRewardCategory(e.target.value as any)}
                                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                                  id="editRewardCategorySelect"
                                >
                                  <option value="AI Tools">AI Tools</option>
                                  <option value="Spotlight Rewards">Spotlight Rewards</option>
                                  <option value="Digital Rewards">Digital Rewards</option>
                                  <option value="Cosmetic Rewards">Cosmetic Rewards</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-slate-400">Description</label>
                              <textarea 
                                value={editRewardDesc} 
                                onChange={(e) => setEditRewardDesc(e.target.value)}
                                placeholder="Explain terms, what they unlock, and how they redeem..."
                                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 h-14 focus:outline-none focus:border-amber-400 resize-none"
                                required
                                id="editRewardDescTextarea"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-slate-400">Thumbnail Image URL (Optional)</label>
                              <input 
                                type="url" 
                                value={editRewardImg} 
                                onChange={(e) => setEditRewardImg(e.target.value)}
                                placeholder="https://unsplash.com/... or keep blank for default illustration"
                                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2"
                                id="editRewardImgInput"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-slate-400">Cost Currency</label>
                                <select 
                                  value={editRewardReqType} 
                                  onChange={(e) => setEditRewardReqType(e.target.value as any)}
                                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-2 py-2"
                                  id="editRewardReqTypeSelect"
                                >
                                  <option value="gems">Gems</option>
                                  <option value="xp">XP (Points)</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-slate-400">Cost Amount</label>
                                <input 
                                  type="number" 
                                  value={editRewardVal} 
                                  onChange={(e) => setEditRewardVal(Number(e.target.value))}
                                  min={0}
                                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2"
                                  required
                                  id="editRewardValInput"
                                />
                              </div>

                              <div className="flex items-center gap-2 pt-4">
                                <input 
                                  type="checkbox" 
                                  id="editRewardIsPlus"
                                  className="rounded text-amber-500 pointer-events-auto"
                                  checked={editRewardIsPlus} 
                                  onChange={(e) => setEditRewardIsPlus(e.target.checked)}
                                />
                                <label htmlFor="editRewardIsPlus" className="text-[10px] font-bold text-slate-600 select-none cursor-pointer">
                                  🔒 Plus Required
                                </label>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => { soundManager.play('click'); setEditingReward(null); }}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-750 font-extrabold text-xs py-2 rounded-xl transition-all cursor-pointer text-center"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                id="curateUpdateRewardBtn"
                                className="flex-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-650 text-white font-extrabold text-xs py-2 rounded-xl transition-all cursor-pointer"
                              >
                                Save Changes
                              </button>
                            </div>
                          </form>
                        )}

                        {dbRewards.length === 0 ? (
                          <div className="text-center py-12 px-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 space-y-4 animate-fade-in text-slate-500" id="emptyRewardsState">
                            <div className="text-4xl">📦</div>
                            <div className="space-y-1">
                              <p className="font-extrabold text-sm text-slate-800">No rewards available yet</p>
                              <p className="text-xs text-slate-400">Create your first reward to get started.</p>
                            </div>
                            {!showRewardCreator && (
                              <button
                                onClick={() => { soundManager.play('click'); setShowRewardCreator(true); }}
                                className="px-4 py-2 text-xs font-black bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-650 text-white rounded-xl transition-all shadow-sm cursor-pointer"
                                id="createFirstRewardBtn"
                              >
                                Create Reward
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1" id="rewardsListContainer">
                            {dbRewards.map((reward) => (
                              <div key={reward.id} className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/50 rounded-2xl flex items-center gap-3 transition-all" id={`rewardCard_${reward.id}`}>
                                <img 
                                  src={reward.image} 
                                  alt={reward.title} 
                                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-slate-200"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex-1 space-y-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-extrabold text-slate-800 text-xs leading-none">{reward.title}</span>
                                    {reward.isPlusExclusive && (
                                      <span className="text-[8px] font-sans font-extrabold bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded leading-none">
                                        Plus Only
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10.5px] text-slate-400 font-medium leading-normal line-clamp-1">{reward.description}</p>
                                  <div className="flex items-center gap-3 text-[10px]">
                                    <span className="font-mono font-bold text-indigo-600 bg-indigo-50/50 px-1.5 rounded">{reward.category}</span>
                                    <span className="font-bold text-slate-655 font-bold">
                                      {reward.requirementType === 'gems' ? `💎 ${reward.gemRequirement || 0} Gems` : `🏆 ${reward.xpRequirement || 0} XP`}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1 items-end">
                                  <button
                                    onClick={() => handleToggleActive(reward.id)}
                                    className={`text-[9px] font-sans font-extrabold px-2 py-1 rounded transition-all cursor-pointer ${
                                      reward.isActive 
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100' 
                                        : 'bg-slate-100 text-slate-450 border border-slate-200 hover:bg-slate-200'
                                    }`}
                                    id={`toggleActiveBtn_${reward.id}`}
                                  >
                                    {reward.isActive ? 'Active' : 'Disabled'}
                                  </button>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleEditRewardClick(reward)}
                                      className="p-1 text-amber-600 hover:bg-amber-50 rounded cursor-pointer"
                                      title="Edit reward info"
                                      id={`editRewardBtn_${reward.id}`}
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteReward(reward.id)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                      title="Delete reward"
                                      id={`deleteRewardBtn_${reward.id}`}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'practice-arena' && (
            <PracticeArenaSettings />
          )}

          {activeTab === 'celebrations' && (
            <CelebrationCenter />
          )}

          {/* TAB AI-COPILOT: chat assistant for the selected unit/lesson/screen (Ask mode, read-only) */}
          {activeTab === 'ai-copilot' && (
            <CopilotPanel
              modulesList={modulesList.filter(isModuleInSelectedWorld)}
              practiceModulesList={practiceModulesList.filter(isModuleInSelectedWorld)}
              fullModulesList={modulesList}
              fullPracticeList={practiceModulesList}
              selectedModuleId={selectedModuleId}
              selectedLessonId={selectedLessonId}
              onCommit={(nextSpace, nextPrac) => {
                // Same save path as the other admin editors: state + saveCurriculumToStorage (hash diff, only changed lessons).
                setModulesList(nextSpace as Module[]);
                setPracticeModulesList(nextPrac as Module[]);
                saveCurriculumToStorage(nextSpace as Module[], nextPrac as Module[]);
                setRawJsonText(JSON.stringify({ spaceCurriculum: nextSpace, practiceCurriculum: nextPrac }, null, 2));
              }}
              onOpenAudioQueue={() => setActiveTab('bulk-narrations')}
            />
          )}

          {/* TAB AI-GENERATOR: GEMINI EXPERT LESSON CREATOR */}
          {activeTab === 'ai-generator' && (
            <AILessonGenerator
              modulesList={modulesList.filter(isModuleInSelectedWorld)}
              practiceModulesList={practiceModulesList.filter(isModuleInSelectedWorld)}
              onSaveLessonToModule={(moduleId, newLesson, updatedStoryBible) => {
                let found = false;
                const updatedAi = modulesList.map(mod => {
                  if (mod.id === moduleId) {
                    found = true;
                    const exists = mod.lessons.some(l => l.id === newLesson.id);
                    const updatedLessons = exists 
                      ? mod.lessons.map(l => l.id === newLesson.id ? newLesson : l)
                      : [...mod.lessons, newLesson];
                    return {
                      ...mod,
                      lessons: updatedLessons,
                      metadata: {
                        ...(mod.metadata || {}),
                        ...(updatedStoryBible ? { storyBible: updatedStoryBible } : {})
                      }
                    };
                  }
                  return mod;
                });

                const updatedPrac = practiceModulesList.map(mod => {
                  if (mod.id === moduleId) {
                    found = true;
                    const exists = mod.lessons.some(l => l.id === newLesson.id);
                    const updatedLessons = exists 
                      ? mod.lessons.map(l => l.id === newLesson.id ? newLesson : l)
                      : [...mod.lessons, newLesson];
                    return {
                      ...mod,
                      lessons: updatedLessons,
                      metadata: {
                        ...(mod.metadata || {}),
                        ...(updatedStoryBible ? { storyBible: updatedStoryBible } : {})
                      }
                    };
                  }
                  return mod;
                });

                setModulesList(updatedAi);
                setPracticeModulesList(updatedPrac);
                saveCurriculumToStorage(updatedAi, updatedPrac);
                setRawJsonText(JSON.stringify({ spaceCurriculum: updatedAi, practiceCurriculum: updatedPrac }, null, 2));

                if (isSupabaseConfigured) {
                  saveCustomLesson({
                    id: newLesson.id,
                    module_id: moduleId,
                    title: newLesson.title,
                    description: newLesson.description || '',
                    difficulty: newLesson.difficulty || 'Easy',
                    xp_reward: newLesson.xpReward ?? 100,
                    challenges: newLesson.challenges || []
                  }).catch(console.error);

                  const targetMod = updatedAi.find(m => m.id === moduleId) || updatedPrac.find(m => m.id === moduleId);
                  if (targetMod) {
                    saveCustomModule({
                      id: targetMod.id,
                      title: targetMod.title,
                      description: targetMod.description || '',
                      order: 0,
                      metadata: targetMod.metadata
                    }).catch(console.error);
                  }
                }
              }}
              triggerNotification={triggerNotification}
              selectedModuleId={selectedModuleId}
              onSelectModuleId={(id) => setSelectedModuleId(id)}
            />
          )}

          {/* SHEET TAB VIEWS */}

          {/* CURRICULUM STUDIO (MANAGE, MODULES, LESSONS, CHALLENGES) */}
          {['manage', 'modules', 'lessons', 'challenges'].includes(activeTab) && (
            <CurriculumStudio
              modulesList={modulesList}
              practiceModulesList={practiceModulesList}
              setModulesList={setModulesList}
              setPracticeModulesList={setPracticeModulesList}
              adminWorlds={adminWorlds}
              selectedAdminWorldId={selectedAdminWorldId}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              selectedModuleId={selectedModuleId}
              setSelectedModuleId={setSelectedModuleId}
              selectedLessonId={selectedLessonId}
              setSelectedLessonId={setSelectedLessonId}
              isOutlineCollapsed={isOutlineCollapsed}
              setIsOutlineCollapsed={setIsOutlineCollapsed}
              editorLayoutMode={editorLayoutMode}
              setEditorLayoutMode={setEditorLayoutMode}
              isStudentViewMode={isStudentViewMode}
              setIsStudentViewMode={setIsStudentViewMode}
              screenListViewMode={lessonListViewMode}
              setScreenListViewMode={setLessonListViewMode}
              curriculumHook={curriculumHook}
              screenHook={screenHook}
              renderChallengePreview={(compiled) => (
                <Suspense fallback={<div className="p-4 text-xs text-slate-400">Loading challenge preview...</div>}>
                  <ChallengePreview challenge={compiled} />
                </Suspense>
              )}
              selectedScreenForVoice={selectedScreenForVoice}
              triggerNotification={triggerNotification}
              triggerConfirm={triggerConfirm}
              soundManager={soundManager}
              isSupabaseConfigured={isSupabaseConfigured}
              onOpenImportModal={openImportModal}
              onCopyUnitJson={copyUnitJsonToClipboard}
              onExportUnitJson={exportUnitAsJsonFile}
            />
          )}

          {/* TAB 4: RAW JSON TEXT EDITOR AND RESTORATIONS */}
          {activeTab === 'curriculum-json' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 mb-1">State Database Raw JSON</h3>
                  <p className="text-xs text-slate-500">Directly export, copy, or paste whole chapters curriculum states safely.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => copyWorldJsonToClipboard(selectedAdminWorldId)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-indigo-150"
                  >
                    <Copy size={13} />
                    <span>Copy Active World JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportWorldAsJsonFile(selectedAdminWorldId)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-indigo-150"
                  >
                    <Download size={13} />
                    <span>Download Active World JSON File</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <textarea
                  value={rawJsonText}
                  onChange={(e) => setRawJsonText(e.target.value)}
                  className="w-full bg-slate-950 text-emerald-400 font-mono text-[11px] p-4 rounded-xl border border-slate-800 outline-none h-[400px] shadow-inner focus:border-indigo-500"
                  spellCheck="false"
                />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="text-slate-505 text-[10px] leading-snug flex items-center gap-1.5 font-medium max-w-md">
                    <Info size={14} className="text-indigo-500 shrink-0" />
                    <span>Warning: Pushing malformed JSON will cause validation failures. Ensure syntax and schema properties align with export defaults.</span>
                  </div>

                  <button
                    onClick={handleRawJsonSave}
                    className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs px-6 py-3 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <Save size={14} />
                    Commit JSON State changes
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* Mobile-Only Sticky Bottom Tab Bar */}
      <div className="md:hidden bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around shrink-0 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-[99]">
        <button
          onClick={() => {
            soundManager.play('click');
            setMobileViewMode('map');
            setIsMobileMoreOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer min-h-[44px] justify-center ${
            mobileViewMode === 'map' && !isMobileMoreOpen
              ? 'text-indigo-600 font-black'
              : 'text-slate-400 font-bold'
          }`}
        >
          <Layers size={18} />
          <span className="text-[9px] uppercase tracking-tight">Map Tree</span>
        </button>

        <button
          onClick={() => {
            soundManager.play('click');
            setMobileViewMode('editor');
            setIsMobileMoreOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer min-h-[44px] justify-center ${
            mobileViewMode === 'editor' && !isMobileMoreOpen && (activeTab === 'manage' || activeTab === 'lessons' || activeTab === 'modules' || activeTab === 'challenges')
              ? 'text-indigo-600 font-black'
              : 'text-slate-400 font-bold'
          }`}
        >
          <Edit size={18} />
          <span className="text-[9px] uppercase tracking-tight">Editor</span>
        </button>

        <button
          onClick={() => {
            soundManager.play('click');
            setActiveTab('users-list');
            setMobileViewMode('editor');
            setIsMobileMoreOpen(false);
            loadAllUsers();
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer min-h-[44px] justify-center ${
            mobileViewMode === 'editor' && !isMobileMoreOpen && activeTab === 'users-list'
              ? 'text-teal-600 font-black'
              : 'text-slate-400 font-bold'
          }`}
        >
          <Wand2 size={18} className={activeTab === 'users-list' ? 'text-teal-500' : ''} />
          <span className="text-[9px] uppercase tracking-tight">Students</span>
        </button>

        <button
          onClick={() => {
            soundManager.play('click');
            setActiveTab('schools');
            setMobileViewMode('editor');
            setIsMobileMoreOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer min-h-[44px] justify-center ${
            mobileViewMode === 'editor' && !isMobileMoreOpen && activeTab === 'schools'
              ? 'text-indigo-700 font-black'
              : 'text-slate-400 font-bold'
          }`}
        >
          <Building2 size={18} />
          <span className="text-[9px] uppercase tracking-tight">Schools</span>
        </button>

        <button
          onClick={() => {
            soundManager.play('click');
            setIsMobileMoreOpen(!isMobileMoreOpen);
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer min-h-[44px] justify-center ${
            isMobileMoreOpen
              ? 'text-violet-600 font-black'
              : 'text-slate-400 font-bold'
          }`}
        >
          <MoreVertical size={18} />
          <span className="text-[9px] uppercase tracking-tight">More</span>
        </button>
      </div>

      {/* Mobile More Drawer Bottom Sheet */}
      <AnimatePresence>
        {isMobileMoreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] md:hidden flex flex-col justify-end"
            onClick={() => setIsMobileMoreOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto space-y-4 border-t border-slate-200 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚡</span>
                  <h3 className="font-extrabold text-slate-900 text-sm">Admin Hub & Management</h3>
                </div>
                <button
                  onClick={() => setIsMobileMoreOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('student-intelligence');
                    setMobileViewMode('editor');
                    setIsMobileMoreOpen(false);
                    loadAllUsers();
                  }}
                  className="p-3 bg-teal-50 hover:bg-teal-100 border border-teal-150 rounded-2xl text-left flex flex-col gap-1 transition"
                >
                  <div className="flex items-center gap-1.5 text-teal-700 font-extrabold text-xs">
                    <Cpu size={15} />
                    <span>Intelligence Hub</span>
                  </div>
                  <span className="text-[10px] text-teal-600/80">Live student telemetry & metrics</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('rewards-manager');
                    setMobileViewMode('editor');
                    setIsMobileMoreOpen(false);
                    loadAllUsers();
                  }}
                  className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-150 rounded-2xl text-left flex flex-col gap-1 transition"
                >
                  <div className="flex items-center gap-1.5 text-amber-700 font-extrabold text-xs">
                    <Gift size={15} />
                    <span>Rewards Store</span>
                  </div>
                  <span className="text-[10px] text-amber-600/80">Manage items & redemption keys</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('celebrations');
                    setMobileViewMode('editor');
                    setIsMobileMoreOpen(false);
                  }}
                  className="p-3 bg-violet-50 hover:bg-violet-100 border border-violet-150 rounded-2xl text-left flex flex-col gap-1 transition"
                >
                  <div className="flex items-center gap-1.5 text-violet-700 font-extrabold text-xs">
                    <Sparkles size={15} className="text-amber-400" />
                    <span>Celebrations</span>
                  </div>
                  <span className="text-[10px] text-violet-600/80">Sound effects & confetti</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('ai-generator');
                    setMobileViewMode('editor');
                    setIsMobileMoreOpen(false);
                  }}
                  className="p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 rounded-2xl text-left flex flex-col gap-1 transition"
                >
                  <div className="flex items-center gap-1.5 text-indigo-700 font-extrabold text-xs">
                    <Sparkles size={15} />
                    <span>AI Co-Creator</span>
                  </div>
                  <span className="text-[10px] text-indigo-600/80">Generate lesson curriculums</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('practice-arena');
                    setMobileViewMode('editor');
                    setIsMobileMoreOpen(false);
                  }}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left flex flex-col gap-1 transition"
                >
                  <div className="flex items-center gap-1.5 text-slate-700 font-extrabold text-xs">
                    <Sparkles size={15} className="text-amber-500" />
                    <span>Practice Arena</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Battle pools & daily packs</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.play('click');
                    setActiveTab('curriculum-json');
                    setMobileViewMode('editor');
                    setIsMobileMoreOpen(false);
                  }}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left flex flex-col gap-1 transition"
                >
                  <div className="flex items-center gap-1.5 text-slate-700 font-extrabold text-xs">
                    <FileSpreadsheet size={15} />
                    <span>Export Raw JSON</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Inspect full curriculum JSON</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => {
                    soundManager.play('click');
                    setShowJsonImportModal(true);
                    setIsMobileMoreOpen(false);
                  }}
                  className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Import JSON</span>
                </button>
                <button
                  onClick={() => {
                    soundManager.play('click');
                    addUnitInstantly('space');
                    setIsMobileMoreOpen(false);
                  }}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>+ New Unit</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Interactive Screen Configuration Picker Modal */}
      {showScreenPickerForLesson && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[10000] animate-fade-in">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  ✨ Select Screen Configuration
                </h3>
                <p className="text-xs text-slate-500 font-medium">Choose a gamified interaction layout to instantly append to the active lesson.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowScreenPickerForLesson(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-450 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Grid options */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 custom-scrollbar bg-slate-50/15">
              {[
                { type: 'content_screen', label: 'Concept Screen', icon: '🖼️', desc: 'Display rich text narrative, subheadings, and a clean Pro Tip takeaway block.' },
                { type: 'visual_lesson_screen', label: 'Visual Story Screen', icon: '🎬', desc: 'Present narrative storylines, characters dialogues, or scenario simulations.' },
                { type: 'c1_multiple_choice', label: 'C1: Multiple Choice Quiz', icon: '🎯', desc: 'Interactive gamified question with large modern selectable action cards.' },
                { type: 'c2_fill_in_blank', label: 'C2: Fill-In-The-Blank', icon: '📝', desc: 'Drag-and-drop vocabulary bubbles into custom sentence gaps.' },
                { type: 'c3_sentence_builder', label: 'C3: Sentence Builder', icon: '💡', desc: 'Tap dynamic word chips to construct structural logical concepts.' },
                { type: 'c4_concept_matcher', label: 'C4: Concept Matcher', icon: '🤝', desc: 'Match pairs of key topics with their definitions on an active grid.' },
                { type: 'c5_bucket_sort', label: 'C5: Bucket Sorter', icon: '🧩', desc: 'Categorize physical digital nodes into corresponding buckets.' },
                { type: 'c6_timeline_sort', label: 'C6: Timeline Sorter', icon: '🔢', desc: 'Sort sequence actions or chronological historical milestones.' },
                { type: 'c7_sequence_builder', label: 'C7: Sequence Builder', icon: '🔄', desc: 'Assemble process sequences in correct top-to-bottom layout.' },
                { type: 'c8_tap_correct_object', label: 'C8: Tap Correct Object', icon: '👆', desc: 'Tap the correct item directly from a highly interactive set.' },
                { type: 'c9_true_false', label: 'C9: True / False', icon: '⚖️', desc: 'Evaluate a claim or core principle with animated True/False buttons.' },
                { type: 'c10_swipe_left_right', label: 'C10: Swipe Left / Right', icon: '↔️', desc: 'Swipe a card left or right to categorize or answer instant queries.' },
                { type: 'c11_image_classification', label: 'C11: Image Classifier', icon: '🖼️', desc: 'Drag visual images directly into correct system categorizations.' },
                { type: 'c12_label_diagram', label: 'C12: Label Diagram', icon: '📍', desc: 'Drag terminology bubbles onto correct indicator hotspots.' },
                { type: 'c13_hotspot_question', label: 'C13: Hotspot Question', icon: '🎯', desc: 'Inspect a physical image diagram and tap the active correct area.' },
                { type: 'c14_memory_flip_cards', label: 'C14: Memory Flip Cards', icon: '🃏', desc: 'Match interactive terms by flipping hidden memory puzzle cards.' },
                { type: 'c15_drag_complete_diagram', label: 'C15: Diagram Completer', icon: '⚙️', desc: 'Fill diagram system flowchart gaps with correct function bubbles.' },
                { type: 'c16_eliminate_wrong', label: 'C16: Wrong Eliminator', icon: '❌', desc: 'Cross out incorrect assertions to keep only valid physical truths.' },
                { type: 'c17_arrange_images', label: 'C17: Arrange Images', icon: '🎬', desc: 'Organize physical imagery workflows chronologically.' },
                { type: 'c18_audio_quiz', label: 'C18: Audio Quiz Listening', icon: '🔊', desc: 'Play digital auditory sound wave clues to resolve specific answers.' },
                { type: 'tap_right_answer', label: 'Legacy MCQ', icon: '🎯', desc: 'Standard single-select multiple choice query cards.' },
                { type: 'image_reveal', label: 'Legacy Image Tap', icon: '📸', desc: 'MCQ structure supported by an interactive image reveal viewport.' },
                { type: 'fill_in_blank', label: 'Legacy Fill-In-Blank', icon: '📝', desc: 'Sentence completion with interactive vocabulary chips.' },
                { type: 'ai_vs_human', label: 'AI Showdown', icon: '🪐', desc: 'Compare a human-written option against an AI-generated counterpart.' },
                { type: 'spot_the_ai', label: 'AI Error Audit', icon: '🔍', desc: 'Cross-examine multiple claims to spot the AI hallucination error.' },
                { type: 'drag_and_drop', label: 'Legacy Sorter', icon: '🧩', desc: 'Classify miscellaneous concept chips into two designated buckets.' },
                { type: 'sort_sequence', label: 'Legacy Sequence', icon: '🔢', desc: 'Arrange a raw list of actions into chronological order.' },
                { type: 'match_pairs', label: 'Legacy Matcher', icon: '🤝', desc: 'Pair items on the left side with their definitions on the right.' },
                { type: 'build_concept', label: 'Legacy Builder', icon: '💡', desc: 'Rebuild a key teaching principle by tapping bubble word puzzle chips.' }
              ].map((cfg) => (
                <button
                  type="button"
                  key={cfg.type}
                  onClick={() => {
                    addScreenInstantly(showScreenPickerForLesson.moduleId, showScreenPickerForLesson.lessonId, cfg.type as ChallengeType);
                    setShowScreenPickerForLesson(null);
                    setActiveTab('challenges'); // Bring them directly back to Screen Editor tab
                  }}
                  className="group/item flex flex-col items-start text-left p-4 rounded-2xl border border-slate-205/80 hover:border-indigo-400 bg-white hover:bg-indigo-50/5 cursor-pointer transition-all hover:shadow-xs active:scale-[0.98]"
                >
                  <div className="text-2xl mb-2.5 flex items-center justify-center p-3.5 bg-slate-100 group-hover/item:bg-indigo-50 rounded-xl transition-colors">
                    {cfg.icon}
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-800 group-hover/item:text-indigo-700 transition-colors">
                    {cfg.label}
                  </h4>
                  <p className="text-[10.5px] text-slate-450 mt-1 leading-relaxed font-semibold">
                    {cfg.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowScreenPickerForLesson(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal overlay */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[10000] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white max-w-sm w-full p-6 rounded-3xl border border-slate-200 shadow-2xl flex flex-col text-center space-y-4 transform scale-100 transition-all">
            <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto text-rose-500 shadow-2xs">
              <AlertCircle size={22} className="text-rose-500 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">{confirmModal.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium font-semibold">{confirmModal.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  soundManager.play('click');
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-xs hover:shadow-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import via JSON Modal */}
      {showJsonImportModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[10000] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white max-w-4xl w-full rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform scale-100 transition-all">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-2xs">
                  <Plus size={16} className="stroke-[2.5px]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Import Curriculum via JSON</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Instantly create screens, lessons, or entire units with clean JSON content</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowJsonImportModal(false);
                  setImportJsonText('');
                  setImportPreviewData(null);
                  setImportDetectedLevel(null);
                  setImportValidationErrors([]);
                  soundManager.play('click');
                }}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
              
              {/* Left Panel: JSON Input & Errors */}
              <div className="flex-1 p-6 flex flex-col gap-4 border-r border-slate-150 overflow-y-auto">
                <div className="space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400">Paste JSON Content Here</label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const template = {
                            unitTitle: "Quantum Computing Fundamentals",
                            unitDescription: "Master qubits, superposition, and quantum algorithms with Chikoo.",
                            difficulty: "Easy",
                            world_id: selectedAdminWorldId || "256e5b30-e5ec-45ba-a024-7318c96eb623",
                            lessons: [
                              {
                                lessonTitle: "Introduction to Qubits",
                                lessonDescription: "Discover how quantum bits differ from classical bits.",
                                difficulty: "Easy",
                                xp: 50,
                                category: "Quantum Core",
                                screens: [
                                  {
                                    type: "concept",
                                    heading: "What is a Qubit?",
                                    subheading: "The basic building block of quantum computers",
                                    contentBody: "Unlike classical bits that are strictly 0 or 1, qubits can exist in a superposition of both states at once!",
                                    badge: "🌌 Quantum Core"
                                  },
                                  {
                                    type: "mcq",
                                    question: "What special property allows a qubit to represent 0 and 1 simultaneously?",
                                    options: ["Superposition", "Gravitational Pull", "Digital Friction", "Clock Frequency"],
                                    correctAnswer: "Superposition",
                                    explanation: "Superposition allows quantum particles to represent multiple states simultaneously until measured!"
                                  }
                                ]
                              }
                            ]
                          };
                          handleValidateAndPreview(JSON.stringify(template, null, 2));
                          soundManager.play('click');
                        }}
                        className="text-[9px] font-bold px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md transition cursor-pointer border border-indigo-150"
                      >
                        Load Unit Template
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const template = {
                            lessonTitle: "Neural Networks Deep Dive",
                            lessonDescription: "Understand artificial neurons and deep learning layers.",
                            difficulty: "Easy",
                            xp: 50,
                            category: "AI Architecture",
                            screens: [
                              {
                                type: "concept",
                                heading: "Artificial Neurons",
                                subheading: "How machines mimic brain synapses",
                                contentBody: "Deep learning models chain together thousands of interconnected neuron weights to spot patterns!",
                                badge: "🧠 Deep Learning"
                              },
                              {
                                type: "mcq",
                                question: "What connects layers of artificial neurons?",
                                options: ["Weights & Biases", "Electric Cables", "Hydraulic Valves", "Copper Gears"],
                                correctAnswer: "Weights & Biases",
                                explanation: "Weights and biases adjust how signals propagate across neural network layers!"
                              }
                            ]
                          };
                          handleValidateAndPreview(JSON.stringify(template, null, 2));
                          soundManager.play('click');
                        }}
                        className="text-[9px] font-bold px-2 py-0.5 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-md transition cursor-pointer border border-violet-150"
                      >
                        Load Lesson Template
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const template = {
                            type: "mcq",
                            question: "What is the key component of a neural network?",
                            options: ["Digital Neurons", "Golden Gears", "Steam Pistons", "Wooden Lever"],
                            correctAnswer: "Digital Neurons",
                            explanation: "Neural networks utilize artificial digital neuron nodes to process training data!"
                          };
                          handleValidateAndPreview(JSON.stringify(template, null, 2));
                          soundManager.play('click');
                        }}
                        className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition cursor-pointer border border-emerald-150"
                      >
                        Load Screen Template
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={importJsonText}
                    onChange={(e) => handleValidateAndPreview(e.target.value)}
                    placeholder={`e.g. Single Screen, Lesson, Unit, or World JSON\n\n{\n  "unitTitle": "Quantum Computing Fundamentals",\n  "difficulty": "Easy",\n  "lessons": [\n    {\n      "lessonTitle": "Introduction to Qubits",\n      "screens": [\n        {\n          "type": "mcq",\n          "question": "Which one is AI?",\n          "options": ["ChatGPT", "Chair"],\n          "correctAnswer": "ChatGPT"\n        }\n      ]\n    }\n  ]\n}`}
                    className="w-full h-80 bg-slate-900 border border-slate-700 rounded-2xl p-4 text-xs font-mono text-emerald-400 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                    style={{ whiteSpace: 'pre', overflowWrap: 'normal' }}
                  />
                </div>

                {/* Validation errors box */}
                {importJsonText.trim() && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Validation Status</span>
                      {importValidationErrors.length === 0 ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-0.5 animate-pulse">
                          <CheckCircle2 size={9} /> Valid JSON
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center gap-0.5">
                          <AlertCircle size={9} /> {importValidationErrors.length} issues found
                        </span>
                      )}
                    </div>

                    {importValidationErrors.length > 0 ? (
                      <div className="bg-rose-50/50 border border-rose-150 rounded-2xl p-4 max-h-40 overflow-y-auto space-y-1.5">
                        {importValidationErrors.map((err, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[11px] font-bold text-rose-700">
                            <span className="mt-0.5 shrink-0">•</span>
                            <span>{err}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-emerald-50/20 border border-emerald-150/50 rounded-2xl p-3 text-[11px] font-bold text-emerald-700 flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        <span>All validation checks passed! Ready to import.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Panel: Targets Selection & Interactive Preview */}
              <div className="flex-1 p-6 bg-slate-50/50 flex flex-col gap-5 overflow-y-auto min-w-0">
                
                {/* Detection level display */}
                {importPreviewData ? (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs space-y-3">
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">JSON Type Detected</span>
                        <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                          {importDetectedLevel === 'unit' && (
                            <>
                              <Layers size={14} className="text-indigo-500" />
                              <span>Unit Level Import</span>
                            </>
                          )}
                          {importDetectedLevel === 'lesson' && (
                            <>
                              <BookOpen size={14} className="text-violet-500" />
                              <span>Lesson Level Import</span>
                            </>
                          )}
                          {importDetectedLevel === 'screen' && (
                            <>
                              <Layout size={14} className="text-emerald-500" />
                              <span>Screen/Challenge Level Import</span>
                            </>
                          )}
                          {!importDetectedLevel && (
                            <span className="text-slate-500">Undetermined Structure</span>
                          )}
                        </h4>
                      </div>

                      {/* Import Destination selections */}
                      {importDetectedLevel === 'screen' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                          <div className="space-y-1">
                            <label className="block text-[9px] uppercase font-black tracking-wider text-slate-400">Target Unit</label>
                            <select
                              value={importTargetUnitId}
                              onChange={(e) => {
                                const uid = e.target.value;
                                setImportTargetUnitId(uid);
                                const activeModObj = [...modulesList, ...practiceModulesList].find(m => m.id === uid);
                                setImportTargetLessonId(activeModObj?.lessons[0]?.id || '');
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:border-indigo-500 transition-all cursor-pointer"
                            >
                              {[...modulesList, ...practiceModulesList].map((m, idx) => (
                                <option key={`import-mod-${m.id}-${idx}`} value={m.id}>{m.title}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] uppercase font-black tracking-wider text-slate-400">Target Lesson</label>
                            <select
                              value={importTargetLessonId}
                              onChange={(e) => setImportTargetLessonId(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:border-indigo-500 transition-all cursor-pointer"
                            >
                              {(() => {
                                const targetMod = [...modulesList, ...practiceModulesList].find(m => m.id === importTargetUnitId);
                                return (targetMod?.lessons || []).map((l, lIdx) => (
                                  <option key={`import-les-${l.id}-${lIdx}`} value={l.id}>{l.title}</option>
                                ));
                              })()}
                            </select>
                          </div>
                        </div>
                      )}

                      {importDetectedLevel === 'lesson' && (
                        <div className="pt-2 border-t border-slate-100 space-y-1">
                          <label className="block text-[9px] uppercase font-black tracking-wider text-slate-400">Import Destination Unit</label>
                          <select
                            value={importTargetUnitId}
                            onChange={(e) => setImportTargetUnitId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:border-indigo-500 transition-all cursor-pointer"
                          >
                            {[...modulesList, ...practiceModulesList].map((m, idx) => (
                              <option key={`import-dest-mod-${m.id}-${idx}`} value={m.id}>{m.title}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {importDetectedLevel === 'unit' && (
                        <div className="pt-2 border-t border-slate-100 space-y-3">
                          <div className="space-y-1">
                            <label className="block text-[9px] uppercase font-black tracking-wider text-slate-400">Target World</label>
                            <select
                              value={importTargetWorldId}
                              onChange={(e) => setImportTargetWorldId(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:border-indigo-500 transition-all cursor-pointer"
                            >
                              {adminWorlds.length === 0 ? (
                                <option value="world_1">World 1: AI Foundations</option>
                              ) : (
                                adminWorlds.map((w) => (
                                  <option key={`import-world-${w.id}`} value={w.id}>
                                    World {w.world_number}: {w.title}
                                  </option>
                                ))
                              )}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] uppercase font-black tracking-wider text-slate-400">Curriculum Destination Path</label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name="isPracticeRadio"
                                  checked={!importTargetIsPractice}
                                  onChange={() => setImportTargetIsPractice(false)}
                                  className="text-indigo-600 focus:ring-indigo-100"
                                />
                                🪐 Cosmic Space Curriculum (Main)
                              </label>
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name="isPracticeRadio"
                                  checked={importTargetIsPractice}
                                  onChange={() => setImportTargetIsPractice(true)}
                                  className="text-emerald-600 focus:ring-emerald-100"
                                />
                                🌿 Practice Arena (Sandbox)
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Hierarchy Outline Preview */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Curriculum Preview Structure</span>
                      
                      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 space-y-3 max-h-60 overflow-y-auto">
                        {importDetectedLevel === 'world' && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200">
                              <Globe size={14} className="text-cyan-600 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[8px] text-slate-400 uppercase tracking-wide">WORLD TO BE CREATED</div>
                                <div className="truncate font-black">{importPreviewData.worldTitle || importPreviewData.title || 'Untitled World'}</div>
                                <div className="text-[8px] font-mono text-slate-400">{(importPreviewData.units || []).length} Units Total</div>
                              </div>
                            </div>

                            <div className="pl-4 border-l border-cyan-200 space-y-2">
                              {(importPreviewData.units || []).map((u: any, uIdx: number) => (
                                <div key={`preview-unit-${uIdx}`} className="bg-white/80 p-2 rounded-xl border border-slate-150 text-[11px] font-bold text-slate-700 space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <Layers size={11} className="text-indigo-500 shrink-0" />
                                    <span className="truncate">{u.unitTitle || u.title || `Unit ${uIdx + 1}`}</span>
                                  </div>
                                  <div className="text-[8.5px] font-medium text-slate-400 pl-4">
                                    {(u.lessons || []).length} lessons
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {importDetectedLevel === 'unit' && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200">
                              <Layers size={14} className="text-indigo-600 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[8px] text-slate-400 uppercase tracking-wide">UNIT TO BE CREATED</div>
                                <div className="truncate font-black">{importPreviewData.unitTitle || importPreviewData.title || 'Untitled Unit'}</div>
                                <div className="text-[8px] font-mono text-slate-400">{importPreviewData.lessons?.length || 0} Lessons</div>
                              </div>
                            </div>
                            
                            <div className="pl-4 border-l border-indigo-200 space-y-2">
                              {(importPreviewData.lessons || []).map((les: any, lIdx: number) => {
                                const screenList = les.screens || les.challenges || [];
                                return (
                                  <div key={lIdx} className="bg-white/80 p-2 rounded-xl border border-slate-150 text-[11px] font-bold text-slate-700 space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <BookOpen size={11} className="text-violet-500 shrink-0" />
                                      <span className="truncate">{les.lessonTitle || les.title || `Lesson ${lIdx + 1}`}</span>
                                    </div>
                                    <div className="text-[8.5px] font-medium text-slate-400 pl-4">
                                      {screenList.length} screens • {les.xp || les.xpReward || 50} XP
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {importDetectedLevel === 'lesson' && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200">
                              <BookOpen size={14} className="text-violet-600 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[8px] text-slate-400 uppercase tracking-wide">LESSON TO BE CREATED</div>
                                <div className="truncate font-black">{importPreviewData.lessonTitle || importPreviewData.title || 'Untitled Lesson'}</div>
                                <div className="text-[8px] font-mono text-slate-450">{(importPreviewData.screens || importPreviewData.challenges || []).length || 0} Screens • {importPreviewData.xp || importPreviewData.xpReward || 50} XP</div>
                              </div>
                            </div>

                            <div className="pl-4 border-l border-violet-200 space-y-1.5">
                              {(importPreviewData.screens || importPreviewData.challenges || []).map((scr: any, sIdx: number) => (
                                <div key={sIdx} className="bg-white/80 p-2 rounded-xl border border-slate-150 text-[10.5px] font-bold text-slate-600 flex items-center gap-1.5">
                                  <Layout size={10} className="text-emerald-500 shrink-0" />
                                  <span className="truncate">{sIdx + 1}. {scr.question || scr.type}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {importDetectedLevel === 'screen' && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200">
                              <Layout size={14} className="text-emerald-600 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[8px] text-slate-400 uppercase tracking-wide">SCREEN TO BE CREATED</div>
                                <div className="truncate font-black">{importPreviewData.question || 'Instructional Slide'}</div>
                                <div className="text-[8.5px] font-mono text-slate-450 uppercase mt-0.5">TYPE: {importPreviewData.type}</div>
                              </div>
                            </div>

                            {importPreviewData.options && Array.isArray(importPreviewData.options) && (
                              <div className="bg-white/80 p-3 rounded-xl border border-slate-150 space-y-1.5">
                                <div className="text-[8px] uppercase tracking-wide font-black text-slate-400">OPTIONS</div>
                                <div className="space-y-1">
                                  {importPreviewData.options.map((opt: any, oIdx: number) => {
                                    const text = typeof opt === 'string' ? opt : opt.text || opt.label || '';
                                    const isCorrect = importPreviewData.correctAnswer !== undefined 
                                      ? String(text || '').toLowerCase().trim() === String(importPreviewData.correctAnswer || '').toLowerCase().trim()
                                      : false;
                                    return (
                                      <div key={`import-opt-${oIdx}-${text.slice(0, 15)}`} className={`text-[10px] p-1 px-2 rounded-lg border flex items-center justify-between ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-extrabold' : 'bg-slate-50 border-slate-150 text-slate-600'}`}>
                                        <span className="truncate">{text}</span>
                                        {isCorrect && <Check size={10} className="text-emerald-600 stroke-[3px]" />}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-3xl">
                    <Wand2 size={36} className="text-slate-300 animate-pulse" />
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mt-3">Interactive Blueprint Preview</h4>
                    <p className="text-[10.5px] text-slate-400 max-w-[240px] leading-relaxed mt-1">Paste valid Screen, Lesson, or Unit JSON in the editor to see validation stats and a dynamic preview tree</p>
                  </div>
                )}

              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowJsonImportModal(false);
                  setImportJsonText('');
                  setImportPreviewData(null);
                  setImportDetectedLevel(null);
                  setImportValidationErrors([]);
                  soundManager.play('click');
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!importPreviewData || importValidationErrors.length > 0}
                onClick={handleImportJson}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all shadow-xs flex items-center gap-1.5 ${
                  (!importPreviewData || importValidationErrors.length > 0)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-md'
                }`}
              >
                <Check size={14} className="stroke-[3px]" />
                <span>Import Blueprint</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (FIXED ON MOBILE SCREENS < md) */}
      {/* ========================================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[9990] bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-8px_25px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-safe">
        <nav className="flex items-center justify-around max-w-lg mx-auto">
          
          {/* HOME TAB */}
          <button
            type="button"
            onClick={() => {
              setMobileNavTab('home');
              setActiveTab('manage');
              setMobileViewMode('editor');
              soundManager.play('click');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-90 ${
              mobileNavTab === 'home'
                ? 'text-indigo-600 font-black'
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
          >
            <div className={`relative p-1 rounded-xl transition-colors ${mobileNavTab === 'home' ? 'bg-indigo-50 text-indigo-600' : ''}`}>
              <Home size={20} className={mobileNavTab === 'home' ? 'stroke-[2.5px]' : 'stroke-2'} />
              {mobileNavTab === 'home' && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
          </button>

          {/* LESSONS / UNITS TAB */}
          <button
            type="button"
            onClick={() => {
              setMobileNavTab('lessons');
              if (activeTab !== 'manage' && activeTab !== 'worlds' && activeTab !== 'lessons' && activeTab !== 'modules' && activeTab !== 'challenges') {
                setActiveTab('manage');
              }
              setMobileViewMode('editor');
              soundManager.play('click');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-90 ${
              mobileNavTab === 'lessons'
                ? 'text-indigo-600 font-black'
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
          >
            <div className={`relative p-1 rounded-xl transition-colors ${mobileNavTab === 'lessons' ? 'bg-indigo-50 text-indigo-600' : ''}`}>
              <BookOpen size={20} className={mobileNavTab === 'lessons' ? 'stroke-[2.5px]' : 'stroke-2'} />
              <span className="absolute -top-0.5 -right-1 px-1 bg-amber-500 text-white text-[8px] font-black rounded-full leading-tight">
                {modulesList.length}
              </span>
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Lessons</span>
          </button>

          {/* CENTER CREATE / ACTION BUTTON */}
          <div className="flex flex-col items-center justify-center flex-1 -mt-5">
            <button
              type="button"
              onClick={() => {
                setShowMobileActionDrawer(true);
                soundManager.play('pop');
              }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/35 border-2 border-white active:scale-90 transition-transform cursor-pointer"
              title="Quick Actions"
            >
              <Plus size={24} className="stroke-[3px]" />
            </button>
            <span className="text-[9.5px] font-black text-indigo-600 mt-1">Create</span>
          </div>

          {/* ANALYTICS TAB */}
          <button
            type="button"
            onClick={() => {
              setMobileNavTab('analytics');
              if (activeTab !== 'student-intelligence' && activeTab !== 'users-list' && activeTab !== 'schools') {
                setActiveTab('student-intelligence');
              }
              setMobileViewMode('editor');
              soundManager.play('click');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-90 ${
              mobileNavTab === 'analytics'
                ? 'text-indigo-600 font-black'
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
          >
            <div className={`relative p-1 rounded-xl transition-colors ${mobileNavTab === 'analytics' ? 'bg-indigo-50 text-indigo-600' : ''}`}>
              <BarChart2 size={20} className={mobileNavTab === 'analytics' ? 'stroke-[2.5px]' : 'stroke-2'} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Analytics</span>
          </button>

          {/* SETTINGS / SYSTEM TAB */}
          <button
            type="button"
            onClick={() => {
              setMobileNavTab('settings');
              if (activeTab !== 'rewards-manager' && activeTab !== 'celebrations' && activeTab !== 'curriculum-json' && activeTab !== 'practice-arena') {
                setActiveTab('rewards-manager');
              }
              setMobileViewMode('editor');
              soundManager.play('click');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-90 ${
              mobileNavTab === 'settings'
                ? 'text-indigo-600 font-black'
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
          >
            <div className={`relative p-1 rounded-xl transition-colors ${mobileNavTab === 'settings' ? 'bg-indigo-50 text-indigo-600' : ''}`}>
              <Sliders size={20} className={mobileNavTab === 'settings' ? 'stroke-[2.5px]' : 'stroke-2'} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Settings</span>
          </button>

        </nav>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE QUICK ACTION BOTTOM SHEET */}
      {/* ========================================================================= */}
      {showMobileActionDrawer && (
        <div className="md:hidden fixed inset-0 z-[9999] flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="fixed inset-0"
            onClick={() => setShowMobileActionDrawer(false)}
          />
          <div className="relative bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-5 pb-8 max-h-[85vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom-8 duration-250">
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-1" />
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Quick Creator Actions</h3>
                <p className="text-xs text-slate-500 font-medium">What would you like to build or launch?</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileActionDrawer(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Add New Screen */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileActionDrawer(false);
                  setMobileNavTab('create');
                  setActiveTab('challenges');
                  setChalId('');
                  setMobileViewMode('editor');
                  soundManager.play('pop');
                }}
                className="p-3.5 rounded-2xl bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-150 flex flex-col items-start text-left gap-2 cursor-pointer active:scale-95 transition-all shadow-xs"
              >
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                  <Plus size={18} className="stroke-[3px]" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">New Screen</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">Add screen to current lesson</div>
                </div>
              </button>

              {/* AI Lesson Generator */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileActionDrawer(false);
                  setMobileNavTab('create');
                  setActiveTab('ai-generator');
                  setMobileViewMode('editor');
                  soundManager.play('cheer');
                }}
                className="p-3.5 rounded-2xl bg-violet-50/80 hover:bg-violet-100/80 border border-violet-150 flex flex-col items-start text-left gap-2 cursor-pointer active:scale-95 transition-all shadow-xs"
              >
                <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-xs">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">AI Generator</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">Generate lesson blueprint with AI</div>
                </div>
              </button>

              {/* Import JSON Blueprint */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileActionDrawer(false);
                  setShowJsonImportModal(true);
                  soundManager.play('pop');
                }}
                className="p-3.5 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-150 flex flex-col items-start text-left gap-2 cursor-pointer active:scale-95 transition-all shadow-xs"
              >
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                  <FileJson size={18} />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">Import JSON</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">Paste blueprint code</div>
                </div>
              </button>

              {/* Practice Arena Setup */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileActionDrawer(false);
                  setMobileNavTab('create');
                  setActiveTab('practice-arena');
                  setMobileViewMode('editor');
                  soundManager.play('click');
                }}
                className="p-3.5 rounded-2xl bg-amber-50/80 hover:bg-amber-100/80 border border-amber-150 flex flex-col items-start text-left gap-2 cursor-pointer active:scale-95 transition-all shadow-xs"
              >
                <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                  <Swords size={18} />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">Practice Arena</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">Configure arena challenges</div>
                </div>
              </button>
            </div>

            {/* Quick Action Utilities */}
            <div className="space-y-2 pt-2 border-t border-slate-150">
              <button
                type="button"
                onClick={() => {
                  setShowMobileActionDrawer(false);
                  setMobileNavTab('create');
                  setActiveTab('challenges');
                  setMobileViewMode('editor');
                  soundManager.play('click');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200/80 cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <Edit3 size={16} className="text-indigo-600" />
                  <span>Open Full Screen Studio</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMobileActionDrawer(false);
                  setMobileNavTab('settings');
                  setActiveTab('curriculum-json');
                  setMobileViewMode('editor');
                  soundManager.play('click');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200/80 cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <Download size={16} className="text-emerald-600" />
                  <span>View Curriculum JSON Database</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMobileActionDrawer(false);
                  setMobileNavTab('settings');
                  setActiveTab('explanation-audio-manager');
                  setMobileViewMode('editor');
                  soundManager.play('click');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200/80 cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <Volume2 size={16} className="text-indigo-600" />
                  <span>Explanation Audio Manager</span>
                </div>
                <ChevronRight size={16} className="text-indigo-400" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE PROFILE & WORLD SELECTOR DRAWER */}
      {/* ========================================================================= */}
      {showMobileProfileDrawer && (
        <div className="md:hidden fixed inset-0 z-[9999] flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="fixed inset-0"
            onClick={() => setShowMobileProfileDrawer(false)}
          />
          <div className="relative bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-5 pb-8 max-h-[85vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom-8 duration-250">
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-1" />
            
            {/* User Info Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-black text-white text-base shadow-sm border border-amber-200">
                  ⚡
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-slate-900">Chikoo Super Admin</h3>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-wide">Live</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium font-mono">chikoo-core-v2</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileProfileDrawer(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Active World Selector */}
            <div className="space-y-2">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">Select Active Subject World</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'world_1', label: 'Finance & Money', icon: '💰', color: 'from-amber-500/15 to-yellow-500/10 border-amber-300 text-amber-900' },
                  { id: 'world_2', label: 'Fitness & Health', icon: '💪', color: 'from-emerald-500/15 to-teal-500/10 border-emerald-300 text-emerald-900' },
                  { id: 'world_3', label: 'Coding & Tech', icon: '⚡', color: 'from-indigo-500/15 to-blue-500/10 border-indigo-300 text-indigo-900' },
                  { id: 'world_4', label: 'Design & Art', icon: '🎨', color: 'from-fuchsia-500/15 to-purple-500/10 border-fuchsia-300 text-fuchsia-900' },
                ].map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setSelectedAdminWorldId(w.id);
                      setSelectedModuleWorldId(w.id);
                      soundManager.play('click');
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer active:scale-95 ${
                      selectedAdminWorldId === w.id
                        ? `bg-gradient-to-r ${w.color} shadow-sm font-black`
                        : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100 font-bold'
                    }`}
                  >
                    <span className="text-lg">{w.icon}</span>
                    <span className="text-xs truncate">{w.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions & System Settings */}
            <div className="space-y-2 pt-2 border-t border-slate-150">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">Quick Navigation</div>
              
              <button
                type="button"
                onClick={() => {
                  setShowMobileProfileDrawer(false);
                  setMobileNavTab('settings');
                  setActiveTab('rewards-manager');
                  soundManager.play('click');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200/80 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Gift size={16} className="text-amber-500" />
                  <span>Rewards & Unlock Store</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMobileProfileDrawer(false);
                  setMobileNavTab('analytics');
                  setActiveTab('student-intelligence');
                  soundManager.play('click');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200/80 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Brain size={16} className="text-indigo-500" />
                  <span>Student Intelligence & Analytics</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMobileProfileDrawer(false);
                  setMobileNavTab('settings');
                  setActiveTab('celebrations');
                  soundManager.play('click');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200/80 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <PartyPopper size={16} className="text-fuchsia-500" />
                  <span>Celebrations & Confetti FX</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMobileProfileDrawer(false);
                  setMobileNavTab('settings');
                  setActiveTab('explanation-audio-manager');
                  setMobileViewMode('editor');
                  soundManager.play('click');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200/80 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Volume2 size={16} className="text-indigo-600" />
                  <span>Explanation Audio Manager</span>
                </div>
                <ChevronRight size={16} className="text-indigo-400" />
              </button>
            </div>

            {/* Exit / Return button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowMobileProfileDrawer(false);
                  onClose();
                }}
                className="w-full py-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs border border-rose-200 flex items-center justify-center gap-2 active:scale-98 cursor-pointer shadow-xs"
              >
                <LogOut size={16} />
                <span>Exit Admin & Return to App</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
