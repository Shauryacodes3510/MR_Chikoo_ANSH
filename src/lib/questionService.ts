import { Question, QuestionOption, Assessment, QuizResult, QuestionBank } from './curriculumTypes';

// Statically defined general-knowledge curiosity science questions
const SCIENCE_QUESTIONS: any[] = [
  {
    id: 'sb_l1.1_1',
    chapterId: 'l1.1',
    category: 'Cosmic Science',
    difficulty: 'Beginner',
    questionType: 'MCQ',
    question: 'What is a comet\'s tail primarily made of?',
    options: [
      { id: 'A', text: 'Vaporized icy gases and cosmic dust' },
      { id: 'B', text: 'Hot melted iron magma' },
      { id: 'C', text: 'Liquid sea water and salt' },
      { id: 'D', text: 'Sparks of static electricity' }
    ],
    correctAnswer: 'Vaporized icy gases and cosmic dust',
    explanation: 'Chikoo says: High five! Sun\'s thermal rays vaporize the comet\'s ice, generating a beautiful dusty trail.'
  },
  {
    id: 'sb_l1.1_2',
    chapterId: 'l1.1',
    category: 'Cosmic Science',
    difficulty: 'Beginner',
    questionType: 'FillInBlank',
    question: 'A comet trail always points [BLANK] from the Sun due to solar winds.',
    options: [
      { id: 'A', text: 'away' },
      { id: 'B', text: 'towards' },
      { id: 'C', text: 'sideways' },
      { id: 'D', text: 'backwards' }
    ],
    correctAnswer: 'away',
    explanation: 'Solar pressure! The solar wind pushes loose particles and gases away, steering the tail directly away from the Sun.'
  },
  {
    id: 'sb_l1.2_1',
    chapterId: 'l1.2',
    category: 'Planetary Geology',
    difficulty: 'Intermediate',
    questionType: 'MCQ',
    question: 'Why does Mars have a distinctive red orange appearance?',
    options: [
      { id: 'A', text: 'Its soil contains a high volume of iron oxide (rust)' },
      { id: 'B', text: 'It has vast oceans of red strawberry syrup' },
      { id: 'C', text: 'It is closer to the red star Betelgeuse' },
      { id: 'D', text: 'Its plants have orange-colored leaves' }
    ],
    correctAnswer: 'Its soil contains a high volume of iron oxide (rust)',
    explanation: 'Rust in space! Iron in the Mars sand reacting with trace elements creates rust, painting the whole surface orange-red!'
  },
  {
    id: 'sb_l2.1_1',
    chapterId: 'l2.1',
    category: 'Plant Biology',
    difficulty: 'Advanced',
    questionType: 'MCQ',
    question: 'What is the green kitchen pigment that captures sunlight for photosynthesis?',
    options: [
      { id: 'A', text: 'Chlorophyll' },
      { id: 'B', text: 'Citric Acid' },
      { id: 'C', text: 'Iron Oxide' },
      { id: 'D', text: 'Rust Sand' }
    ],
    correctAnswer: 'Chlorophyll',
    explanation: 'Green Power! Chlorophyll absorbs red and blue light waves, reflecting the beautiful green color we see in leaves.'
  }
];

let cachedQuestionBank: QuestionBank | null = null;

export function getQuestionBank(): QuestionBank {
  if (!cachedQuestionBank) {
    const questions: Question[] = SCIENCE_QUESTIONS.map(q => ({
      id: q.id,
      chapterId: q.chapterId,
      category: q.category,
      difficulty: q.difficulty as 'Beginner' | 'Intermediate' | 'Advanced',
      questionType: q.questionType as 'MCQ' | 'FillInBlank' | 'Scenario' | 'MatchPairs',
      question: q.question,
      options: q.options as QuestionOption[],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation
    }));

    cachedQuestionBank = {
      questions,
      version: '2.0.0',
      lastUpdated: Date.now()
    };
  }
  return cachedQuestionBank;
}

export function getQuestionsByChapter(chapterId: string): Question[] {
  const bank = getQuestionBank();
  return bank.questions.filter(q => q.chapterId === chapterId);
}

export function getQuestionsByDifficulty(difficulty: 'Beginner' | 'Intermediate' | 'Advanced'): Question[] {
  const bank = getQuestionBank();
  return bank.questions.filter(q => q.difficulty === difficulty);
}

export function getRandomQuestions(limit: number, questionsPool?: Question[]): Question[] {
  const pool = questionsPool || getQuestionBank().questions;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

export function getQuestionById(questionId: string): Question | undefined {
  const bank = getQuestionBank();
  return bank.questions.find(q => q.id === questionId);
}

export function getChapterAssessment(chapterId: string): Assessment {
  const questions = getQuestionsByChapter(chapterId);
  return {
    id: `assess_chapter_${chapterId}`,
    title: `Assessment: ${chapterId.toUpperCase()}`,
    description: `Evaluate your comprehension of natural science covered in chapter ${chapterId}.`,
    questions: questions.length > 0 ? questions : getQuestionBank().questions.slice(0, 1),
    difficulty: 'Beginner',
    type: 'Chapter'
  };
}

export function getMockTest(levelId: string): Assessment {
  const questions = getRandomQuestions(3);
  return {
    id: `assess_mock_${levelId}`,
    title: `Mock Exam: General Explorer Science`,
    description: `A simulated comprehensive practice test covering key concepts of this level.`,
    questions,
    difficulty: 'Intermediate',
    type: 'Mock'
  };
}

export function getFinalAssessment(levelId: string): Assessment {
  const questions = getQuestionBank().questions;
  return {
    id: `assess_final_${levelId}`,
    title: `Final Science Exam`,
    description: `Demonstrate your complete mastery and earn your Level Certificate!`,
    questions,
    difficulty: 'Advanced',
    type: 'Final'
  };
}

export function trackQuizResult(result: QuizResult): void {
  try {
    const historical = localStorage.getItem('chikoo_assessment_results');
    const list: QuizResult[] = historical ? JSON.parse(historical) : [];
    list.push(result);
    localStorage.setItem('chikoo_assessment_results', JSON.stringify(list));
  } catch (err) {
    console.error('Failed to track quiz results locally:', err);
  }
}

export function getQuizResults(): QuizResult[] {
  try {
    const historical = localStorage.getItem('chikoo_assessment_results');
    return historical ? JSON.parse(historical) : [];
  } catch (err) {
    console.error('Failed to load quiz results history:', err);
    return [];
  }
}
