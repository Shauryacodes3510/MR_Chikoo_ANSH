import { useState, useEffect, useRef, useCallback } from 'react';
import { ArenaQuestion, ArenaResult, RaceTelemetry, RivalProfile, VehicleMotionState } from '../types/arena.types';
import { 
  RACE_TARGET_DISTANCE, 
  QUESTION_TIME_SECONDS, 
  FAST_ANSWER_THRESHOLD 
} from '../constants/arena.constants';
import { soundManager } from '../../../lib/sounds';

export function useArenaBattle(
  questions: ArenaQuestion[], 
  rival: RivalProfile,
  boosterBonus: number = 0
) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);
  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState<ArenaResult | null>(null);

  // Racing Physics State
  const [playerDistance, setPlayerDistance] = useState(0);
  const [opponentDistance, setOpponentDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(240); // km/h
  const [topSpeed, setTopSpeed] = useState(240);
  const [playerStreak, setPlayerStreak] = useState(0);
  const [playerState, setPlayerState] = useState<VehicleMotionState>('cruising');
  const [opponentState, setOpponentState] = useState<VehicleMotionState>('cruising');
  const [activeRivalQuote, setActiveRivalQuote] = useState<string | null>(rival.quotes.intro);
  const [lastAnswerResult, setLastAnswerResult] = useState<RaceTelemetry['lastAnswerResult']>(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [fastAnswersCount, setFastAnswersCount] = useState(0);

  const isOverdrive = playerStreak >= 3;

  // Background Cruising Physics (Vehicles naturally advance along the track)
  useEffect(() => {
    if (isFinished) return;

    const interval = setInterval(() => {
      setPlayerDistance((prev) => {
        const delta = (currentSpeed / 3600) * 1000 * 0.15; // meters in 150ms
        const next = prev + delta;
        return Math.min(RACE_TARGET_DISTANCE, next);
      });

      setOpponentDistance((prev) => {
        const botSpeed = opponentState === 'boost' ? rival.topSpeed * 0.9 : rival.botBaseSpeed;
        const delta = (botSpeed / 3600) * 1000 * 0.15;
        const next = prev + delta;
        return Math.min(RACE_TARGET_DISTANCE, next);
      });
    }, 150);

    return () => clearInterval(interval);
  }, [currentSpeed, opponentState, isFinished, rival]);

  // Per-Question Timer Loop
  useEffect(() => {
    if (isFinished || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired -> automatic wrong answer
          handleAnswer(null, QUESTION_TIME_SECONDS);
          return QUESTION_TIME_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  // Decay vehicle state back to cruising after boost / stall
  useEffect(() => {
    if (playerState !== 'cruising') {
      const timer = setTimeout(() => {
        setPlayerState('cruising');
        setCurrentSpeed(isOverdrive ? 360 : 260);
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [playerState, isOverdrive]);

  useEffect(() => {
    if (opponentState !== 'cruising') {
      const timer = setTimeout(() => {
        setOpponentState('cruising');
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [opponentState]);

  // Clear opponent quote after display
  useEffect(() => {
    if (activeRivalQuote) {
      const timer = setTimeout(() => {
        setActiveRivalQuote(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeRivalQuote]);

  // Answer handler
  const handleAnswer = useCallback((answer: string | null, answerTime: number = 5) => {
    const currentQ = questions[questionIndex];
    if (!currentQ || isFinished) return;

    const isCorrect = answer === currentQ.correctAnswer;
    const isFast = answerTime <= FAST_ANSWER_THRESHOLD;

    let nextPlayerScore = playerScore;
    let nextOpponentScore = opponentScore;
    let nextPlayerDistance = playerDistance;
    let nextOpponentDistance = opponentDistance;
    let nextTopSpeed = topSpeed;
    let nextCorrectCount = correctAnswersCount;
    let nextFastCount = fastAnswersCount;

    if (isCorrect) {
      const newStreak = playerStreak + 1;
      setPlayerStreak(newStreak);
      nextCorrectCount = correctAnswersCount + 1;
      setCorrectAnswersCount(nextCorrectCount);
      if (isFast) {
        nextFastCount = fastAnswersCount + 1;
        setFastAnswersCount(nextFastCount);
      }

      // Speed Calculation
      const boostSpeed = isFast ? 520 + boosterBonus : 420 + boosterBonus;
      const finalSpeed = newStreak >= 3 ? boostSpeed + 80 : boostSpeed;
      setCurrentSpeed(finalSpeed);
      nextTopSpeed = Math.max(topSpeed, finalSpeed);
      setTopSpeed(nextTopSpeed);

      const boostDistance = isFast ? 220 : 160;
      nextPlayerDistance = Math.min(RACE_TARGET_DISTANCE, playerDistance + boostDistance);
      setPlayerDistance(nextPlayerDistance);
      nextPlayerScore = playerScore + (isFast ? 150 : 100);
      setPlayerScore(nextPlayerScore);

      setPlayerState(isFast ? 'hyper' : 'boost');

      const label = isFast ? '⚡ HYPER NITRO BOOST!' : '⚡ NITRO BOOST!';
      setLastAnswerResult({
        isCorrect: true,
        answerTime,
        speedDelta: finalSpeed - 240,
        xpEarned: isFast ? 150 : 100,
        boostLabel: label
      });

      // Rival reaction when overtaken/blasted
      const quotes = rival.quotes.overtaken;
      if (quotes.length > 0) {
        setActiveRivalQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      }

    } else {
      // Wrong or timeout
      setPlayerStreak(0);
      setPlayerState('stall');
      setCurrentSpeed(140);

      // Opponent gains speed and taunts
      setOpponentState('boost');
      nextOpponentDistance = Math.min(RACE_TARGET_DISTANCE, opponentDistance + 180);
      setOpponentDistance(nextOpponentDistance);
      nextOpponentScore = opponentScore + 120;
      setOpponentScore(nextOpponentScore);

      setLastAnswerResult({
        isCorrect: false,
        answerTime,
        speedDelta: -100,
        xpEarned: 0,
        boostLabel: 'ENGINE STALL!'
      });

      const quotes = rival.quotes.overtake;
      if (quotes.length > 0) {
        setActiveRivalQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      }
    }

    // Advance to next question or finish race
    if (questionIndex + 1 < questions.length) {
      setQuestionIndex(prev => prev + 1);
      setTimeLeft(QUESTION_TIME_SECONDS);
    } else {
      // Race completed!
      setIsFinished(true);
      const isWinner =
        nextPlayerScore >= nextOpponentScore ||
        nextPlayerDistance >= nextOpponentDistance;
      const finalAccuracy = Math.round(
        (nextCorrectCount / Math.max(1, questions.length)) * 100
      );

      setResult({
        winnerId: isWinner ? 'player' : 'opponent',
        playerScore: nextPlayerScore,
        opponentScore: nextOpponentScore,
        playerDistance: nextPlayerDistance,
        opponentDistance: nextOpponentDistance,
        topSpeed: nextTopSpeed,
        accuracy: finalAccuracy,
        fastAnswersCount: nextFastCount,
        xpEarned: isWinner ? 150 : 50,
        cookiesEarned: isWinner ? 50 : 15,
        trophiesEarned: isWinner ? 25 : 5,
        completedAt: Date.now()
      });
    }
  }, [
    questionIndex,
    questions,
    isFinished,
    playerStreak,
    boosterBonus,
    rival,
    playerScore,
    opponentScore,
    playerDistance,
    opponentDistance,
    topSpeed,
    correctAnswersCount,
    fastAnswersCount
  ]);

  // Position calculation
  const isFirst = playerDistance >= opponentDistance;
  const gapMeters = Math.round(Math.abs(playerDistance - opponentDistance));

  const telemetry: RaceTelemetry = {
    playerDistance,
    opponentDistance,
    targetDistance: RACE_TARGET_DISTANCE,
    currentSpeed,
    topSpeed,
    playerStreak,
    isOverdrive,
    position: isFirst ? 1 : 2,
    gapMeters,
    playerState,
    opponentState,
    activeRivalQuote,
    lastAnswerResult
  };

  return {
    currentQuestion: questions[questionIndex],
    questionIndex,
    totalQuestions: questions.length,
    playerScore,
    opponentScore,
    timeLeft,
    isFinished,
    telemetry,
    result,
    handleAnswer
  };
}
