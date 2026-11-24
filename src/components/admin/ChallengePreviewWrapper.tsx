import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Sparkles, HelpCircle, ArrowRight, RefreshCw, Volume2 } from 'lucide-react';
import { Challenge, isStoryScreen } from '../../lib/curriculumTypes';
import { soundManager } from '../../lib/sounds';

import TapRightAnswer from '../exercises/TapRightAnswer';
import FillInBlank from '../exercises/FillInBlank';
import SpotTheAI from '../exercises/SpotTheAI';
import DragAndDrop from '../exercises/DragAndDrop';
import MatchPairs from '../exercises/MatchPairs';
import SortSequence from '../exercises/SortSequence';
import BuildAConcept from '../exercises/BuildAConcept';
import AnalogyCard from '../exercises/AnalogyCard';
import AIVsHuman from '../exercises/AIVsHuman';
import VisualLessonScreen from '../exercises/VisualLessonScreen';
import { 
  C9TrueFalse, 
  C8TapCorrectObject, 
  C10SwipeLeftRight, 
  C16EliminateWrongAnswers,
  C7SequenceBuilder 
} from '../exercises/CategoryCExercises';

export interface ChallengePreviewProps {
  challenge: Challenge;
}

export const ChallengePreview: React.FC<ChallengePreviewProps> = ({ challenge }) => {
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setSelectedOption(null);
    setIsChecked(false);
    setIsCorrect(false);
    setShowExplanation(false);
    setShowSuccess(false);
  }, [challenge.id, challenge.type, challenge.question]);

  if (!challenge) return null;

  const isStory = isStoryScreen(challenge);

  const handleSelect = (option: any) => {
    setSelectedOption(option);
  };

  const handleCheck = () => {
    setIsChecked(true);
    let correct = false;

    switch (challenge.type) {
      case 'c1_multiple_choice':
      case 'tap_right_answer':
      case 'analogy_card':
      case 'c9_true_false':
      case 'fill_in_blank':
      case 'c2_fill_in_blank':
        correct = String(selectedOption || '').trim().toLowerCase() === String(challenge.correctAnswer || '').trim().toLowerCase();
        break;
      case 'ai_vs_human':
        correct = selectedOption === challenge.correctAnswer;
        break;
      case 'c4_concept_matcher':
      case 'match_pairs':
        correct = selectedOption === true;
        break;
      case 'c5_bucket_sort':
      case 'drag_and_drop':
        correct = true;
        break;
      case 'sort_sequence':
      case 'c7_sequence_builder':
        if (Array.isArray(selectedOption) && challenge.correctOrder) {
          correct = selectedOption.length === challenge.correctOrder.length && 
                    selectedOption.every((val, index) => val === challenge.correctOrder?.[index]);
        } else {
          correct = true;
        }
        break;
      case 'build_concept':
      case 'c3_sentence_builder':
        if (Array.isArray(selectedOption)) {
          const answer = selectedOption.join(' ').toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
          const target = (challenge.targetSentence || '').toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
          correct = answer === target;
        } else {
          correct = true;
        }
        break;
      default:
        const expected = String(challenge.correctAnswer || '').trim().toLowerCase();
        const actual = String(selectedOption || '').trim().toLowerCase();
        correct = actual === expected || isStory;
    }

    setIsCorrect(correct);
    if (correct) {
      soundManager.play('correct');
    } else {
      soundManager.play('incorrect');
    }
  };

  const handleReset = () => {
    soundManager.play('click');
    setSelectedOption(null);
    setIsChecked(false);
    setIsCorrect(false);
    setShowExplanation(false);
    setShowSuccess(false);
  };

  const explanationText = typeof challenge.explanation === 'string' 
    ? challenge.explanation 
    : challenge.explanation?.text || 'Chikoo says: Awesome job!';

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner flex flex-col min-h-[380px]">
      
      {/* Header bar of the simulation */}
      <div className="bg-white px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isStory ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 font-mono">
            {challenge.type}
          </span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
          title="Reset Simulation"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Main Viewport Content */}
      <div className="p-4 sm:p-6 flex-1 flex flex-col justify-center">
        {isStory ? (
          <VisualLessonScreen
            contentData={challenge.contentScreen || {
              heading: challenge.question || 'Story Scene',
              contentBody: typeof challenge.explanation === 'string' ? challenge.explanation : challenge.explanation?.text || 'Scene narration...',
              badge: (challenge.type === 'hero_scene' ? 'HERO SCENE' : 
                      challenge.type === 'cinematic_scene' ? 'CINEMATIC' : 
                      challenge.type === 'dialogue_strip_scene' ? 'STORY DIALOGUE' : 
                      challenge.type === 'celebration_scene' ? 'CELEBRATION' : 'STORY SCENE'),
              sceneType: challenge.sceneType || challenge.type || 'hero'
            }}
            onSelect={() => {}}
            selectedOption={null}
            isChecked={false}
            onContinue={() => {
              soundManager.play('complete');
              setShowSuccess(true);
            }}
          />
        ) : (
          <div className="space-y-4">
            
            {/* Exercise renderer */}
            {challenge.type === 'fill_in_blank' || challenge.type === 'c2_fill_in_blank' ? (
              <FillInBlank
                sentence={challenge.question}
                options={challenge.options || []}
                correctAnswer={challenge.correctAnswer as string}
                onSelect={handleSelect}
                selectedOption={selectedOption}
                isChecked={isChecked}
                isCorrect={isCorrect}
              />
            ) : challenge.type === 'c9_true_false' ? (
              <C9TrueFalse
                correctAnswer={String(challenge.correctAnswer || 'true')}
                isChecked={isChecked}
                isCorrect={isCorrect}
                onSelect={handleSelect}
                selectedOption={selectedOption}
              />
            ) : challenge.type === 'c4_concept_matcher' || challenge.type === 'match_pairs' ? (
              <MatchPairs
                pairs={challenge.pairs || []}
                isChecked={isChecked}
                onSelect={handleSelect}
              />
            ) : challenge.type === 'c5_bucket_sort' || challenge.type === 'drag_and_drop' ? (
              <DragAndDrop
                buckets={challenge.buckets || []}
                items={challenge.items as any || []}
                isChecked={isChecked}
                onSelect={handleSelect}
              />
            ) : challenge.type === 'c7_sequence_builder' || challenge.type === 'sort_sequence' ? (
              <SortSequence
                steps={challenge.steps || []}
                correctOrder={challenge.correctOrder || []}
                isChecked={isChecked}
                onSelect={handleSelect}
              />
            ) : challenge.type === 'c3_sentence_builder' || challenge.type === 'build_concept' ? (
              <BuildAConcept
                targetSentence={challenge.targetSentence || ''}
                chipsCorrect={challenge.chipsCorrect || []}
                chipsDistractor={challenge.chipsDistractor || []}
                isChecked={isChecked}
                onSelect={handleSelect}
              />
            ) : challenge.type === 'c16_eliminate_wrong' ? (
              <C16EliminateWrongAnswers
                question={challenge.question || ''}
                options={(challenge.options || []).map((opt, i) => ({
                  id: `opt_${i}`,
                  text: opt,
                  isCorrect: opt === challenge.correctAnswer
                }))}
                isChecked={isChecked}
                onSelect={handleSelect}
              />
            ) : challenge.type === 'ai_vs_human' ? (
              <AIVsHuman
                outputs={challenge.outputs as any || [
                  { id: 'opt_1', title: 'Human Card', text: 'Clean fact.', isAI: false },
                  { id: 'opt_2', title: 'AI Card', text: 'Generated claim.', isAI: true }
                ]}
                onSelect={handleSelect}
                selectedOption={selectedOption}
                isChecked={isChecked}
                isCorrect={isCorrect}
              />
            ) : (
              <TapRightAnswer
                options={challenge.options || []}
                onSelect={handleSelect}
                selectedOption={selectedOption}
                isChecked={isChecked}
                isCorrect={isCorrect}
                correctAnswer={challenge.correctAnswer as string}
              />
            )}

            {/* Verification / Action Button */}
            {!isChecked ? (
              <button
                type="button"
                onClick={handleCheck}
                disabled={selectedOption === null && challenge.type !== 'match_pairs'}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs"
              >
                Check Answer
              </button>
            ) : (
              <div className="space-y-2 animate-in fade-in">
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <span className="font-bold shrink-0">{isCorrect ? '🎉 Correct!' : '❌ Not quite!'}</span>
                  <span className="font-medium leading-relaxed">{explanationText}</span>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
};
