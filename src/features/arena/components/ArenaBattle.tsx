import React, { useState, useEffect } from 'react';
import { useArenaBattle } from '../hooks/useArenaBattle';
import { ArenaQuestion, ArenaResult, RivalProfile } from '../types/arena.types';
import { PixiRaceScene } from './PixiRaceScene';
import { RaceHUD } from './RaceHUD';
import { RaceQuestionTerminal } from './RaceQuestionTerminal';
import { soundManager } from '../../../lib/sounds';
import { QUESTION_TIME_SECONDS } from '../constants/arena.constants';
import { Bot } from 'lucide-react';

interface ArenaBattleProps {
  questions: ArenaQuestion[];
  rival: RivalProfile;
  boosterBonus?: number;
  onFinished: (result: ArenaResult) => void;
}

export default function ArenaBattle({
  questions,
  rival,
  boosterBonus = 0,
  onFinished
}: ArenaBattleProps) {
  const {
    currentQuestion,
    questionIndex,
    totalQuestions,
    playerScore,
    opponentScore,
    timeLeft,
    isFinished,
    telemetry,
    result,
    handleAnswer
  } = useArenaBattle(questions, rival, boosterBonus);

  const [isAnswering, setIsAnswering] = useState(false);

  useEffect(() => {
    soundManager.playBattleMusic();
    return () => soundManager.stopBattleMusic();
  }, []);

  useEffect(() => {
    if (timeLeft <= 4 && timeLeft > 0) {
      soundManager.play('cms_tick');
    }
  }, [timeLeft]);

  useEffect(() => {
    if (isFinished && result) {
      soundManager.stopBattleMusic();
      if (result.winnerId === 'player') {
        soundManager.play('complete');
        soundManager.play('cheer');
      } else {
        soundManager.play('pop');
      }
      onFinished(result);
    }
  }, [isFinished, result, onFinished]);

  const onSelectOption = (opt: string, answerTime: number) => {
    if (isAnswering) return;
    setIsAnswering(true);

    const isCorrect = opt === currentQuestion?.correctAnswer;
    if (isCorrect) {
      soundManager.play('correct');
      soundManager.play('turbo_boost');
    } else {
      soundManager.play('stall_buzz');
      soundManager.play('incorrect');
    }

    setTimeout(() => {
      handleAnswer(opt, answerTime);
      setIsAnswering(false);
    }, 450);
  };

  if (!currentQuestion) {
    return (
      <div className="relative w-full h-full min-h-screen flex items-center justify-center bg-[#060919] text-white">
        <div className="flex flex-col items-center gap-2">
          <Bot className="w-8 h-8 text-cyan-400 animate-bounce" />
          <span className="text-xs font-bold text-slate-300">Loading AI Speedway...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh] flex flex-col items-center overflow-hidden select-none font-sans bg-slate-950 text-white px-4 py-3 sm:px-6 sm:py-4">
      <div className="w-full max-w-2xl flex-1 min-h-0 flex flex-col gap-3 sm:gap-4">
        {/* TOP MINIMAL RACE HUD */}
        <header className="relative z-30 w-full shrink-0">
          <RaceHUD
            telemetry={telemetry}
            rival={rival}
            currentLap={questionIndex + 1}
            totalLaps={totalQuestions}
          />
        </header>

        {/* LIVE ANIMATED RACE SCENE */}
        <section className="relative z-10 w-full flex-1 min-h-[190px] sm:min-h-[240px] rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
          <PixiRaceScene
            currentSpeed={telemetry.currentSpeed}
            playerState={telemetry.playerState}
            isOverdrive={telemetry.isOverdrive}
            playerProgress={telemetry.playerDistance / telemetry.targetDistance}
            opponentProgress={telemetry.opponentDistance / telemetry.targetDistance}
            position={telemetry.position}
            gapMeters={telemetry.gapMeters}
            rival={rival}
            currentLap={questionIndex + 1}
            totalLaps={totalQuestions}
            lastAnswerResult={telemetry.lastAnswerResult}
          />
        </section>

        {/* QUESTION & ANSWER CARD */}
        <section className="relative z-20 w-full shrink-0 max-h-[56dvh] overflow-y-auto no-scrollbar">
          <RaceQuestionTerminal
            key={currentQuestion.id}
            question={currentQuestion}
            timeLeft={timeLeft}
            totalTime={QUESTION_TIME_SECONDS}
            onSelectOption={onSelectOption}
            isAnswering={isAnswering}
            isOverdrive={telemetry.isOverdrive}
          />
        </section>
      </div>
    </div>
  );
}
