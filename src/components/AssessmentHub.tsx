import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, BookOpen, Layers, Award, Sparkles, Zap, Brain, 
  CheckCircle2, ChevronRight, RefreshCw, BarChart2, Star, Calendar 
} from 'lucide-react';
import { 
  getQuestionsByChapter, 
  getQuestionsByDifficulty, 
  getRandomQuestions, 
  getMockTest, 
  getFinalAssessment, 
  getChapterAssessment, 
  getQuizResults,
  getQuestionBank 
} from '../lib/questionService';
import { Lesson, Challenge } from '../lib/content';
import { soundManager } from '../lib/sounds';
import { trackEvent } from '../lib/intelligence';

interface AssessmentHubProps {
  onStartAssessment: (lesson: Lesson) => void;
  completedLessons: string[];
}

export default function AssessmentHub({ onStartAssessment, completedLessons }: AssessmentHubProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedChapter, setSelectedChapter] = useState<string>('l1.1');
  const [resultsHistory, setResultsHistory] = useState(() => getQuizResults());

  // Available unique chapters and categories for filtering
  const questionBank = getQuestionBank();
  
  const uniqueChapters = useMemo(() => {
    const chapters = questionBank.questions.map(q => q.chapterId);
    return Array.from(new Set(chapters)).sort();
  }, [questionBank]);

  const uniqueCategories = useMemo(() => {
    const categories = questionBank.questions.map(q => q.category);
    return Array.from(new Set(categories)).sort();
  }, [questionBank]);

  const filteredQuestionsCount = useMemo(() => {
    let list = questionBank.questions;
    if (selectedDifficulty !== 'All') {
      list = list.filter(q => q.difficulty === selectedDifficulty);
    }
    if (selectedCategory !== 'All') {
      list = list.filter(q => q.category === selectedCategory);
    }
    return list.length;
  }, [questionBank, selectedDifficulty, selectedCategory]);

  const handleRefreshHistory = () => {
    setResultsHistory(getQuizResults());
  };

  /**
   * Helper to map our Question Bank Question to Challenge interface
   */
  const mapQuestionsToChallenges = (questionsList: any[]): Challenge[] => {
    return (questionsList || []).map((q, idx) => ({
      id: q?.id || `q_mapped_${idx}`,
      type: q?.questionType === 'FillInBlank' ? 'fill_in_blank' : 'tap_right_answer',
      question: q?.question,
      options: (q?.options || []).map((opt: any) => opt?.text || ''),
      correctAnswer: q?.correctAnswer,
      explanation: q?.explanation,
      xpValue: q?.difficulty === 'Advanced' ? 15 : q?.difficulty === 'Intermediate' ? 10 : 5
    }));
  };

  /**
   * Starts a dynamic Randomized Quiz (Practice Mode)
   */
  const handleLaunchPracticeMode = () => {
    soundManager.play('click');
    trackEvent('Practice Button Clicked', {
      difficulty_filter: selectedDifficulty,
      category_filter: selectedCategory
    });
    let pool = questionBank.questions;
    if (selectedDifficulty !== 'All') {
      pool = pool.filter(q => q.difficulty === selectedDifficulty);
    }
    if (selectedCategory !== 'All') {
      pool = pool.filter(q => q.category === selectedCategory);
    }

    const selectedQuestions = getRandomQuestions(5, pool.length > 0 ? pool : undefined);
    const lesson: Lesson = {
      id: `practice_blitz_${Date.now()}`,
      title: 'Practice Mode Blitz',
      description: 'Quick randomized practice session mapped directly from our Question Bank.',
      difficulty: 'Easy',
      challenges: mapQuestionsToChallenges(selectedQuestions),
      xpReward: 30
    };

    onStartAssessment(lesson);
  };

  /**
   * Starts a focused Chapter Test
   */
  const handleLaunchChapterTest = () => {
    soundManager.play('click');
    const assessmentModel = getChapterAssessment(selectedChapter);
    const lesson: Lesson = {
      id: assessmentModel.id,
      title: assessmentModel.title,
      description: assessmentModel.description,
      difficulty: assessmentModel.difficulty === 'Advanced' ? 'Hard' : assessmentModel.difficulty === 'Intermediate' ? 'Medium' : 'Easy',
      challenges: mapQuestionsToChallenges(assessmentModel.questions),
      xpReward: 50
    };
    onStartAssessment(lesson);
  };

  /**
   * Starts a simulated Mock Exam
   */
  const handleLaunchMockExam = (levelName: string) => {
    soundManager.play('click');
    const assessmentModel = getMockTest(levelName);
    const lesson: Lesson = {
      id: assessmentModel.id,
      title: assessmentModel.title,
      description: assessmentModel.description,
      difficulty: 'Medium',
      challenges: mapQuestionsToChallenges(assessmentModel.questions),
      xpReward: 75
    };
    onStartAssessment(lesson);
  };

  /**
   * Starts a Final Level Certificate Exam
   */
  const handleLaunchFinalExam = (levelName: string) => {
    soundManager.play('click');
    const assessmentModel = getFinalAssessment(levelName);
    const lesson: Lesson = {
      id: assessmentModel.id,
      title: assessmentModel.title,
      description: assessmentModel.description,
      difficulty: 'Hard',
      challenges: mapQuestionsToChallenges(assessmentModel.questions),
      xpReward: 150
    };
    onStartAssessment(lesson);
  };

  /**
   * Starts a targeted Revision Test based on topics in completed chapters
   */
  const handleLaunchRevisionMode = () => {
    soundManager.play('click');
    // If no completed lessons, use all
    const activeChapters = completedLessons.length > 0 ? completedLessons : ['l1.1', 'l1.2'];
    const pool = questionBank.questions.filter(q => activeChapters.includes(q.chapterId));
    const selectedQuestions = getRandomQuestions(5, pool.length > 0 ? pool : undefined);

    const lesson: Lesson = {
      id: `assess_revision_${Date.now()}`,
      title: 'Memory Match Quiz',
      description: 'Review what you learned and keep your focus super sharp.',
      difficulty: 'Medium',
      challenges: mapQuestionsToChallenges(selectedQuestions),
      xpReward: 40
    };
    onStartAssessment(lesson);
  };

  return (
    <div className="flex flex-col gap-4.5 w-full pt-1.5 font-sans">

      {/* Mode 1: Dynamic Practice Arena & Filters */}
      <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="text-amber-500 fill-amber-500" size={18} />
          <h3 className="font-display font-black text-xs text-slate-700 uppercase tracking-widest">1. Quick Quiz</h3>
        </div>
        <p className="text-[11px] text-gray-500 font-medium leading-relaxed leading-normal">
          Pick a level and a topic group, and let's start a custom quiz instantly!
        </p>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div>
            <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Choose Level</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as any)}
              className="w-full text-xs font-bold p-2 mt-1 rounded-xl bg-slate-50 border border-slate-100 outline-none"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Choose Topic</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs font-bold p-2 mt-1 rounded-xl bg-slate-50 border border-slate-100 outline-none"
            >
              <option value="All">All Topics</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleLaunchPracticeMode}
          className="w-full btn-3d btn-3d-blue py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
        >
          <Brain size={14} className="fill-current" />
          Start Quick Quiz ({filteredQuestionsCount || 0} Matches)
        </button>
      </div>

      {/* Mode 2: Targeted Chapter-wise Test */}
      <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="text-chikoo-blue-500" size={18} />
          <h3 className="font-display font-black text-xs text-slate-700 uppercase tracking-widest">2. Chapter Quiz</h3>
        </div>
        <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
          Pick a chapter to test what you have learned so far!
        </p>

        <div className="flex gap-2 pt-1">
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            className="flex-1 text-xs font-black p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none"
          >
            {uniqueChapters.map(chap => {
              const name = chap.toUpperCase().replace('L', 'Chapter ');
              return <option key={chap} value={chap}>{name}</option>;
            })}
          </select>

          <button
            onClick={handleLaunchChapterTest}
            className="btn-3d btn-3d-secondary px-5 text-xs font-black uppercase tracking-wider whitespace-nowrap"
          >
            Start Chapter Quiz
          </button>
        </div>
      </div>

      {/* Mode 3: mock & certifications */}
      <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <Award className="text-purple-500" size={18} />
          <h3 className="font-display font-black text-xs text-slate-700 uppercase tracking-widest">3. Special Exams</h3>
        </div>
        <p className="text-[11px] text-gray-500 font-medium leading-relaxed leading-normal">
          Special quizzes to test your super powers and win cool certificates!
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => handleLaunchMockExam('level_1')}
            className="p-4 rounded-2xl border-2 border-dashed border-slate-200 text-left hover:border-indigo-300 transition group flex flex-col justify-between h-28"
          >
            <div>
              <span className="bg-indigo-50 text-indigo-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Level 1 Test</span>
              <h4 className="font-display font-black text-xs text-slate-700 mt-1.5 leading-snug">The Noticer Test</h4>
            </div>
            <span className="text-[10px] text-indigo-500 font-black uppercase tracking-tight flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Start Quiz <ChevronRight size={10} />
            </span>
          </button>

          <button
            onClick={() => handleLaunchFinalExam('level_1')}
            className="p-4 rounded-2xl border-2 border-dashed border-slate-200 text-left hover:border-pink-300 transition group flex flex-col justify-between h-28"
          >
            <div>
              <span className="bg-pink-50 text-pink-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Level 1 Final</span>
              <h4 className="font-display font-black text-xs text-slate-700 mt-1.5 leading-snug">Topic Certificate</h4>
            </div>
            <span className="text-[10px] text-pink-500 font-black uppercase tracking-tight flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Start Quiz <ChevronRight size={10} />
            </span>
          </button>
        </div>
      </div>

      {/* Mode 4: Revision and History */}
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={handleLaunchRevisionMode}
          className="w-full bg-gradient-to-r from-pink-500 to-indigo-500 text-white p-5 rounded-3xl shadow-[0_5px_0_#4338ca] hover:brightness-110 active:translate-y-1 active:shadow-none transition-all text-left flex items-center justify-between"
        >
          <div className="space-y-1">
            <h4 className="font-display font-black text-sm uppercase tracking-wider">Review My Lessons</h4>
            <p className="text-[10px] opacity-90 leading-tight">Go through lessons you have finished to secure your scores.</p>
          </div>
          <RefreshCw size={20} className="animate-spin-slow shrink-0 ml-4 opacity-90" />
        </button>
      </div>

      {/* Progress tracking display logs */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="text-slate-400" size={16} />
            <h4 className="font-display font-black text-xs text-slate-500 uppercase tracking-wider">Saved Quiz Scores</h4>
          </div>
          <button 
            onClick={handleRefreshHistory}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-lg transition-transform active:rotate-45"
          >
            <RefreshCw size={10} />
          </button>
        </div>

        {resultsHistory.length === 0 ? (
          <p className="text-[10px] font-semibold text-slate-400 italic text-center py-4">No scores yet. Complete any quiz to track your grades here!</p>
        ) : (
          <div className="space-y-2 max-h-36 overflow-y-auto scrollbar-hide pr-1">
            {resultsHistory.map((log, idx) => (
              <div key={`history-log-${log.assessmentId || 'log'}-${log.timestamp || idx}-${idx}`} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-700 truncate capitalize-first">
                      {log.assessmentId.replace('assess_', '').replace('_', ' ').substring(0, 18)}
                    </span>
                    {log.passed ? (
                      <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-600 px-1 rounded">Pass</span>
                    ) : (
                      <span className="text-[8px] font-black uppercase bg-rose-50 text-rose-600 px-1 rounded">Fail</span>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Calendar size={8} />
                    <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 font-display font-black text-slate-800">
                  <Star size={10} className="text-yellow-400 fill-yellow-400" />
                  <span>{log.score} / {log.totalQuestions}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
