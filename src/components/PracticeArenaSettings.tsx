import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, Plus, Check, AlertCircle, Save, Info, Copy, 
  Gamepad2, Zap, Brain, ShieldAlert, Search, Filter, ArrowUpDown, 
  Upload, Sparkles, Image, CheckCircle, Flame, Target, BookOpen,
  Edit3, HelpCircle, Archive, Sliders, ChevronDown, CheckCircle2,
  FileSpreadsheet, FileJson, AlertTriangle, Play, RefreshCw, BarChart3, HelpCircle as HelpIcon,
  Gift
} from 'lucide-react';
import { 
  getChallengePacks, saveChallengePacks, ChallengePack, ChallengeQuestion,
  getPuzzlePacks, savePuzzlePacks, PuzzlePack, PuzzleQuestion,
  getBattlePools, saveBattlePools, BattlePool, BattleQuestion,
  getChallengePacksAsync, getPuzzlePacksAsync, getBattlePoolsAsync
} from '../lib/practiceStoreNew';
import { soundManager } from '../lib/sounds';
import { AI_CURRICULUM, PRACTICE_CURRICULUM } from '../lib/content';
import { getAdminAuthHeaders } from '../lib/supabase';

// Preset high-quality images for puzzles to make editing extremely simple and fun
const PRESET_PUZZLE_IMAGES = [
  { name: '🤖 OpenAI Cyber Glow', url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&fit=crop&q=80' },
  { name: '🎨 AI Abstract Canvas', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&fit=crop&q=80' },
  { name: '🦾 Robotic Mechanical Hand', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&fit=crop&q=80' },
  { name: '🧠 Glowing Neural Nodes', url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&fit=crop&q=80' },
  { name: '📱 Cyber Phone Interface', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&fit=crop&q=80' },
  { name: '🔍 Suspicious Fake Portrait', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&fit=crop&q=80' }
];

export default function PracticeArenaSettings() {
  const [activeTab, setActiveTab] = useState<'challenges' | 'puzzles' | 'battles' | 'importer' | 'analytics'>('challenges');
  
  // Storage states linked directly to localStorage for immediate play verification
  const [challengePacks, setChallengePacks] = useState<ChallengePack[]>(() => getChallengePacks());
  const [puzzlePacks, setPuzzlePacks] = useState<PuzzlePack[]>(() => getPuzzlePacks());
  const [battlePools, setBattlePools] = useState<BattlePool[]>(() => getBattlePools());

  // Synchronise practice data with Supabase on mount
  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const chal = await getChallengePacksAsync();
        if (active && Array.isArray(chal)) {
          setChallengePacks(chal);
        }
        const puz = await getPuzzlePacksAsync();
        if (active && Array.isArray(puz)) {
          setPuzzlePacks(puz);
        }
        const bat = await getBattlePoolsAsync();
        if (active && Array.isArray(bat)) {
          setBattlePools(bat);
        }
      } catch (err) {
        console.error("Failed loading real time CMS data from Supabase:", err);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'xp' | 'count'>('name');

  // Multi-select bulk actions
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>([]);
  const [expandedPreviewPackIds, setExpandedPreviewPackIds] = useState<string[]>([]);

  // Active Creator/Editor Modal States
  const [isEditingChal, setIsEditingChal] = useState<boolean>(false);
  const [activeChalPack, setActiveChalPack] = useState<ChallengePack | null>(null);
  const [challengesMobileTab, setChallengesMobileTab] = useState<'catalog' | 'editor'>('catalog');
  const [chalEditQuestionIndex, setChalEditQuestionIndex] = useState<number | null>(null);

  const [isEditingPuz, setIsEditingPuz] = useState<boolean>(false);
  const [activePuzPack, setActivePuzPack] = useState<PuzzlePack | null>(null);
  const [puzEditQuestionIndex, setPuzEditQuestionIndex] = useState<number | null>(null);

  const [isEditingBat, setIsEditingBat] = useState<boolean>(false);
  const [activeBatPool, setActiveBatPool] = useState<BattlePool | null>(null);
  const [batEditQuestionIndex, setBatEditQuestionIndex] = useState<number | null>(null);

  // AI Generation States
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiTopicInput, setAiTopicInput] = useState<string>('');
  const [aiCountInput, setAiCountInput] = useState<number>(5);
  const [aiError, setAiError] = useState<string | null>(null);

  // General Notification Banners
  const [bannerMsg, setBannerMsg] = useState<{ type: 'success' | 'detail' | 'error', text: string } | null>(null);

  // Importer state
  const [importText, setImportText] = useState('');
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('json');
  const [importTarget, setImportTarget] = useState<'challenges' | 'puzzles' | 'battles'>('challenges');
  const [importLog, setImportLog] = useState<string>('');

  // Auto Dismiss Alert banner helper
  const triggerBanner = (type: 'success' | 'detail' | 'error', text: string) => {
    setBannerMsg({ type, text });
    setTimeout(() => setBannerMsg(null), 4000);
  };

  // ==================== A. HELPER GENERICS ====================
  const handleSelectPack = (id: string) => {
    setSelectedPackIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (packs: any[]) => {
    if (selectedPackIds.length === packs.length) {
      setSelectedPackIds([]);
    } else {
      setSelectedPackIds(packs.map(p => p.id));
    }
  };

  // ==================== B. CHALLENGES LOGIC ====================
  const handleCreateNewChallengePack = () => {
    soundManager.play('click');
    const template: ChallengePack = {
      id: `chal_${Date.now()}`,
      topic: 'New Challenge Pack',
      difficulty: 'Easy',
      questionsCount: 1,
      xpReward: 50,
      linked_unit_id: '',
      linkedUnitId: '',
      questions: [
        {
          id: `cq_${Date.now()}_0`,
          type: 'MCQ',
          question: 'Sample AI Question: What is an LLM?',
          options: ['Large Language Model', 'Linear Logical Machine', 'Lite List Manager', 'Logarithmic Link Module'],
          correctAnswer: 'Large Language Model',
          explanation: 'LLM stands for Large Language Model, which processes text templates.'
        }
      ]
    };
    setActiveChalPack(template);
    setIsEditingChal(true);
    setChallengesMobileTab('editor');
    setChalEditQuestionIndex(0);
    setAiTopicInput('');
    setAiError(null);
  };

  const handleSaveChallengePack = () => {
    if (!activeChalPack) return;
    soundManager.play('complete');

    // Validation
    if (!activeChalPack.topic.trim()) {
      triggerBanner('error', 'Pack title cannot be blank.');
      return;
    }

    if (!activeChalPack.questions || activeChalPack.questions.length === 0) {
      triggerBanner('error', 'A challenge pack must have at least one question. Silent/partially empty saves are not allowed.');
      return;
    }

    console.log(`[CHALLENGE PACK CMS] Saving Pack ID: ${activeChalPack.id}, Topic: "${activeChalPack.topic}", Questions Count: ${activeChalPack.questions.length}`);

    const index = challengePacks.findIndex(p => p.id === activeChalPack.id);
    let updated;
    if (index > -1) {
      updated = [...challengePacks];
      updated[index] = {
        ...activeChalPack,
        questionsCount: activeChalPack.questions.length
      };
    } else {
      updated = [...challengePacks, {
        ...activeChalPack,
        questionsCount: activeChalPack.questions.length
      }];
    }

    const saved = saveChallengePacks(updated);
    setChallengePacks(saved);
    setIsEditingChal(false);
    setActiveChalPack(null);
    setChallengesMobileTab('catalog');
    triggerBanner('success', `Saved challenge pack "${activeChalPack.topic}" with ${activeChalPack.questions.length} Questions!`);
  };

  const handleDeleteChallengePack = (id: string) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return;
    soundManager.play('incorrect');
    const updated = challengePacks.filter(p => p.id !== id);
    const saved = saveChallengePacks(updated);
    setChallengePacks(saved);
    triggerBanner('success', 'Challenge pack deleted permanently.');
  };

  const handleDuplicateChallengePack = (pack: ChallengePack) => {
    soundManager.play('click');
    const duplicated: ChallengePack = {
      ...pack,
      id: `chal_${Date.now()}`,
      topic: `${pack.topic} (Copy)`,
      questions: pack.questions.map((q, idx) => ({
        ...q,
        id: `cq_${Date.now()}_dup_${idx}`
      }))
    };
    const updated = [...challengePacks, duplicated];
    const saved = saveChallengePacks(updated);
    setChallengePacks(saved);
    triggerBanner('success', `Duplicated "${pack.topic}" successfully!`);
  };

  const handleBulkDelete = () => {
    if (selectedPackIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedPackIds.length} selected item(s)?`)) return;
    soundManager.play('incorrect');

    if (activeTab === 'challenges') {
      const updated = challengePacks.filter(p => !selectedPackIds.includes(p.id));
      const saved = saveChallengePacks(updated);
      setChallengePacks(saved);
    } else if (activeTab === 'puzzles') {
      const updated = puzzlePacks.filter(p => !selectedPackIds.includes(p.id));
      const saved = savePuzzlePacks(updated);
      setPuzzlePacks(saved);
    } else if (activeTab === 'battles') {
      const updated = battlePools.filter(p => !selectedPackIds.includes(p.id));
      const saved = saveBattlePools(updated);
      setBattlePools(saved);
    }

    setSelectedPackIds([]);
    triggerBanner('success', 'Bulk deletion complete!');
  };

  const handleAIGenerateSystem = async (systemType: 'challenges' | 'puzzles' | 'battles', currentTopic: string) => {
    if (!currentTopic.trim()) {
      triggerBanner('error', 'Please provide a topic for generation.');
      return;
    }
    
    setIsGeneratingAI(true);
    setAiError(null);
    soundManager.play('click');
    
    try {
      const headers = await getAdminAuthHeaders();
      const response = await fetch('/api/practice-systems/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          systemType,
          topic: currentTopic,
          category: systemType === 'puzzles' ? (activePuzPack?.category || 'AI Detective') : undefined,
          difficulty: systemType === 'challenges' ? (activeChalPack?.difficulty || 'Medium') : undefined,
          questionCount: aiCountInput
        })
      });
      
      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || 'Server error generating questions.');
      }
      
      const data = await response.json();
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('No valid questions received from AI server.');
      }
      
      soundManager.play('complete');
      
      if (systemType === 'challenges' && activeChalPack) {
        const mappedQuestions: ChallengeQuestion[] = data.questions.map((q: any, idx: number) => ({
          id: `cq_gen_${Date.now()}_${idx}`,
          type: 'MCQ',
          question: q.question,
          options: q.options || ['Option A', 'B', 'C', 'D'],
          correctAnswer: q.correctAnswer || q.options?.[0] || 'Option A',
          explanation: q.explanation || 'Curated explanation.'
        }));
        
        setActiveChalPack({
          ...activeChalPack,
          topic: currentTopic,
          questions: mappedQuestions,
          questionsCount: mappedQuestions.length
        });
        setChalEditQuestionIndex(0);
        triggerBanner('success', `Successfully generated ${mappedQuestions.length} unique challenge questions!`);
      } else if (systemType === 'puzzles' && activePuzPack) {
        const mappedQuestions: PuzzleQuestion[] = data.questions.map((q: any, idx: number) => ({
          id: `pq_gen_${Date.now()}_${idx}`,
          question: q.question,
          options: q.options || ['Option A', 'B', 'C', 'D'],
          correctAnswer: q.correctAnswer || q.options?.[0] || 'Option A',
          explanation: q.explanation || 'Curated explanation.',
          type: (q.type === 'Visual' || q.type === 'Logic' || q.type === 'Scenario') ? q.type : 'Logic',
          logicClue: q.logicClue || 'Seek details.',
          imageUrl: PRESET_PUZZLE_IMAGES[Math.floor(Math.random() * PRESET_PUZZLE_IMAGES.length)].url
        }));
        
        setActivePuzPack({
          ...activePuzPack,
          title: currentTopic,
          questions: mappedQuestions,
          questionsCount: mappedQuestions.length
        });
        setPuzEditQuestionIndex(0);
        triggerBanner('success', `Successfully generated ${mappedQuestions.length} unique puzzle questions!`);
      } else if (systemType === 'battles' && activeBatPool) {
        const mappedQuestions: BattleQuestion[] = data.questions.map((q: any, idx: number) => ({
          id: `bq_gen_${Date.now()}_${idx}`,
          question: q.question,
          options: q.options || ['Option A', 'B', 'C', 'D'],
          correctAnswer: q.correctAnswer || q.options?.[0] || 'Option A',
          explanation: q.explanation || 'Curated explanation.'
        }));
        
        setActiveBatPool({
          ...activeBatPool,
          topic: currentTopic,
          questions: mappedQuestions
        });
        setBatEditQuestionIndex(0);
        triggerBanner('success', `Successfully generated ${mappedQuestions.length} unique speed dual questions!`);
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Error communicating with AI engine.');
      triggerBanner('error', err.message || 'Generation failed.');
      soundManager.play('incorrect');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // ==================== C. PUZZLES LOGIC ====================
  const handleCreateNewPuzzlePack = () => {
    soundManager.play('click');
    const template: PuzzlePack = {
      id: `puz_${Date.now()}`,
      title: 'New Specimen Mystery',
      category: 'AI Detective',
      costXP: 100,
      xpReward: 300,
      questionsCount: 1,
      badgeReward: '🕵️‍♂️ Cyber Analyst',
      linked_unit_id: '',
      linkedUnitId: '',
      chest_icon_url: '',
      chestIconUrl: '',
      chest_image_url: '',
      chestImageUrl: '',
      questions: [
        {
          id: `pq_${Date.now()}_0`,
          type: 'Visual',
          question: 'What visual artifact in this picture suggests it was AI-generated?',
          options: [
            'There are floating cables connected to nothing',
            'The color palette is normal real ink',
            'The artist signed it in cursive',
            'The portrait shows a standard window'
          ],
          correctAnswer: 'There are floating cables connected to nothing',
          explanation: 'AI vision models frequently generate wires or details that fade out into thin air due to rendering constraints.',
          logicClue: 'Look at background lines and wire trajectories.',
          imageUrl: PRESET_PUZZLE_IMAGES[0].url
        }
      ]
    };
    setActivePuzPack(template);
    setIsEditingPuz(true);
    setPuzEditQuestionIndex(0);
    setAiTopicInput('');
    setAiError(null);
  };

  const handleSavePuzzlePack = () => {
    if (!activePuzPack) return;
    soundManager.play('complete');

    if (!activePuzPack.title.trim()) {
      triggerBanner('error', 'Puzzle Title cannot be blank.');
      return;
    }

    const index = puzzlePacks.findIndex(p => p.id === activePuzPack.id);
    let updated;
    if (index > -1) {
      updated = [...puzzlePacks];
      updated[index] = {
        ...activePuzPack,
        questionsCount: activePuzPack.questions.length
      };
    } else {
      updated = [...puzzlePacks, {
        ...activePuzPack,
        questionsCount: activePuzPack.questions.length
      }];
    }

    const saved = savePuzzlePacks(updated);
    setPuzzlePacks(saved);
    setIsEditingPuz(false);
    setActivePuzPack(null);
    triggerBanner('success', `Saved puzzle pack "${activePuzPack.title}"!`);
  };

  const handleDeletePuzzlePack = (id: string) => {
    if (!confirm('Confirm deletion of this puzzle pack?')) return;
    soundManager.play('incorrect');
    const updated = puzzlePacks.filter(p => p.id !== id);
    const saved = savePuzzlePacks(updated);
    setPuzzlePacks(saved);
    triggerBanner('success', 'Puzzle pack dropped.');
  };

  const handleDuplicatePuzzlePack = (pack: PuzzlePack) => {
    soundManager.play('click');
    const duplicated: PuzzlePack = {
      ...pack,
      id: `puz_${Date.now()}`,
      title: `${pack.title} (Copy)`,
      questions: pack.questions.map((q, idx) => ({
        ...q,
        id: `pq_${Date.now()}_dup_${idx}`
      }))
    };
    const updated = [...puzzlePacks, duplicated];
    const saved = savePuzzlePacks(updated);
    setPuzzlePacks(saved);
    triggerBanner('success', `Duplicated Puzzle "${pack.title}" successfully!`);
  };

  // ==================== D. BATTLE SPEED RUN LOGIC ====================
  const handleCreateNewBattlePool = () => {
    soundManager.play('click');
    const template: BattlePool = {
      id: `pool_${Date.now()}`,
      topic: 'Rapid Fire Speedrun',
      questions: [
        {
          id: `bq_${Date.now()}_0`,
          question: 'Which tool is best for instant code debugging?',
          options: ['ChatGPT', 'Keynote', 'Unsplash', 'Slack'],
          correctAnswer: 'ChatGPT',
          explanation: 'LLMs are superior code assistants.'
        }
      ]
    };
    setActiveBatPool(template);
    setIsEditingBat(true);
    setBatEditQuestionIndex(0);
    setAiTopicInput('');
    setAiError(null);
  };

  const handleSaveBattlePool = () => {
    if (!activeBatPool) return;
    soundManager.play('complete');

    if (!activeBatPool.topic.trim()) {
      triggerBanner('error', 'Topic cannot be blank.');
      return;
    }

    const index = battlePools.findIndex(p => p.id === activeBatPool.id);
    let updated;
    if (index > -1) {
      updated = [...battlePools];
      updated[index] = activeBatPool;
    } else {
      updated = [...battlePools, activeBatPool];
    }

    const saved = saveBattlePools(updated);
    setBattlePools(saved);
    setIsEditingBat(false);
    setActiveBatPool(null);
    triggerBanner('success', `Saved Battle Pool topic "${activeBatPool.topic}"!`);
  };

  const handleDeleteBattlePool = (id: string) => {
    if (!confirm('Delete this speed duel battle pool?')) return;
    soundManager.play('incorrect');
    const updated = battlePools.filter(p => p.id !== id);
    const saved = saveBattlePools(updated);
    setBattlePools(saved);
    triggerBanner('success', 'Battle Pool deleted.');
  };

  const handleDuplicateBattlePool = (pool: BattlePool) => {
    soundManager.play('click');
    const duplicated: BattlePool = {
      ...pool,
      id: `pool_${Date.now()}`,
      topic: `${pool.topic} (Copy)`,
      questions: pool.questions.map((q, idx) => ({
        ...q,
        id: `bq_${Date.now()}_dup_${idx}`
      }))
    };
    const updated = [...battlePools, duplicated];
    const saved = saveBattlePools(updated);
    setBattlePools(saved);
    triggerBanner('success', `Duplicated Battle Pool "${pool.topic}"!`);
  };

  // ==================== E. BULK IMPORTER SYSTEM ====================
  const handleBulkImport = () => {
    soundManager.play('click');
    setImportLog('');

    if (!importText.trim()) {
      triggerBanner('error', 'Please paste import content first.');
      return;
    }

    try {
      let parsedQuestions: any[] = [];
      
      if (importFormat === 'json') {
        const parsed = JSON.parse(importText);
        if (Array.isArray(parsed)) {
          parsedQuestions = parsed;
        } else if (parsed.questions && Array.isArray(parsed.questions)) {
          parsedQuestions = parsed.questions;
        } else {
          throw new Error('Data must be an array of questions or an object containing a "questions" array.');
        }
      } else {
        // Simple intelligent CSV parsing
        const lines = importText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          throw new Error('CSV must contain header line and at least 1 record.');
        }

        // Detect separators
        const header = lines[0];
        let separator = ',';
        if (header.includes('\t')) separator = '\t';
        else if (header.includes(';')) separator = ';';

        const keys = header.split(separator).map(k => k.replace(/["']/g, '').trim().toLowerCase());
        
        for (let i = 1; i < lines.length; i++) {
          const rowVals = lines[i].split(separator).map(v => v.replace(/^["']|["']$/g, '').trim());
          const item: any = {};
          keys.forEach((key, kIndex) => {
            item[key] = rowVals[kIndex] || '';
          });

          // Standardize fields
          const questionText = item.question || item.title || '';
          const optionsText = [item.a || item.optiona || '', item.b || item.optionb || '', item.c || item.optionc || '', item.d || item.optiond || ''].filter(Boolean);
          // If options didn't parse individual options columns, look for a pipe-separated options column
          const options = optionsText.length > 0 ? optionsText : (item.options ? item.options.split('|') : ['Option 1', 'Option 2', 'Option 3', 'Option 4']);
          const correctAnswer = item.answer || item.correct || item.correctanswer || options[0];
          const explanation = item.explanation || item.reason || 'Curated explanation.';
          const logicClue = item.hint || item.clue || item.logicclue || 'Solve carefully.';
          const type = item.type || 'MCQ';
          const imageUrl = item.imageurl || item.image || '';

          if (questionText) {
            parsedQuestions.push({
              question: questionText,
              options,
              correctAnswer,
              explanation,
              logicClue,
              type,
              imageUrl
            });
          }
        }
      }

      if (parsedQuestions.length === 0) {
        throw new Error('No valid questions parsed from input source.');
      }

      // Add to Database Target
      if (importTarget === 'challenges') {
        const newPack: ChallengePack = {
          id: `chal_imported_${Date.now()}`,
          topic: `Bulk Pack - ${new Date().toLocaleDateString()}`,
          difficulty: 'Medium',
          questionsCount: parsedQuestions.length,
          xpReward: 100,
          questions: parsedQuestions.map((q, idx) => ({
            id: `cq_imp_${Date.now()}_${idx}`,
            type: q.type || 'MCQ',
            question: q.question,
            options: q.options || ['A', 'B', 'C', 'D'],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || 'Curated explanation node.'
          }))
        };
        const updated = [...challengePacks, newPack];
        const saved = saveChallengePacks(updated);
        setChallengePacks(saved);
        setImportLog(`Successfully parsed & imported ⚡ CHALLENGE PACK with ${parsedQuestions.length} questions.`);
      } else if (importTarget === 'puzzles') {
        const newPack: PuzzlePack = {
          id: `puz_imported_${Date.now()}`,
          title: `Bulk Puzzle - ${new Date().toLocaleDateString()}`,
          category: 'AI Detective',
          costXP: 100,
          xpReward: 300,
          questionsCount: parsedQuestions.length,
          questions: parsedQuestions.map((q, idx) => ({
            id: `pq_imp_${Date.now()}_${idx}`,
            question: q.question,
            options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || 'Curated explanation.',
            type: q.type || 'Visual',
            logicClue: q.logicClue || 'Seek detail markers.',
            imageUrl: q.imageUrl || PRESET_PUZZLE_IMAGES[0].url
          }))
        };
        const updated = [...puzzlePacks, newPack];
        const saved = savePuzzlePacks(updated);
        setPuzzlePacks(saved);
        setImportLog(`Successfully parsed & imported 🧩 PUZZLE PACK with ${parsedQuestions.length} questions.`);
      } else if (importTarget === 'battles') {
        const newPool: BattlePool = {
          id: `pool_imported_${Date.now()}`,
          topic: `Bulk Battles - ${new Date().toLocaleDateString()}`,
          questions: parsedQuestions.map((q, idx) => ({
            id: `bq_imp_${Date.now()}_${idx}`,
            question: q.question,
            options: q.options || ['A', 'B', 'C', 'D'],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || 'Rapid speed answers.'
          }))
        };
        const updated = [...battlePools, newPool];
        const saved = saveBattlePools(updated);
        setBattlePools(saved);
        setImportLog(`Successfully parsed & imported 🚀 BATTLE POOL with ${parsedQuestions.length} rapid-shot questions.`);
      }

      setImportText('');
      soundManager.play('complete');
      triggerBanner('success', 'Bulk import processed perfectly!');
    } catch (err: any) {
      console.error(err);
      soundManager.play('incorrect');
      setImportLog(`🚨 Parse Error: ${err.message}. Ensure your payload reflects correct CSV columns or JSON brackets.`);
    }
  };

  // ==================== F. EXPERT ANALYTICS SIMULATOR ====================
  const analyticsData = useMemo(() => {
    const totalChallenges = challengePacks.length;
    const totalPuzzles = puzzlePacks.length;
    const totalBattles = battlePools.reduce((sum, p) => sum + p.questions.length, 0);
    const avgQuestionsChallenge = totalChallenges > 0 
      ? Math.round((challengePacks.reduce((sum, p) => sum + p.questions.length, 0)) / totalChallenges) 
      : 0;

    return {
      totalChallenges,
      totalPuzzles,
      totalBattles,
      avgQuestionsChallenge,
      completionRateChallenges: 78,
      completionRatePuzzles: 44,
      accuracyBattles: 67,
      popularQuestions: [
        { q: 'Identify the AI-generated paragraph: One of these is written...', type: 'FactVsMyth', plays: 142, anomaly: 'None' },
        { q: 'An AI assistant is giving advice about pet care. Which...', type: 'Scenario', plays: 112, anomaly: '5% fail to check warning' },
        { q: 'What is "Machine Learning"?', type: 'Concept', plays: 98, anomaly: 'Normal curve' }
      ]
    };
  }, [challengePacks, puzzlePacks, battlePools]);

  // Query filtering list selectors
  const filteredChallengePacks = useMemo(() => {
    return challengePacks.filter(pack => {
      const matchSearch = pack.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pack.questions.some(q => q.question.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchDiff = selectedDifficulty === 'all' || pack.difficulty === selectedDifficulty;
      return matchSearch && matchDiff;
    });
  }, [challengePacks, searchQuery, selectedDifficulty]);

  const filteredPuzzlePacks = useMemo(() => {
    return puzzlePacks.filter(pack => {
      const matchSearch = pack.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pack.questions.some(q => q.question.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = selectedCategory === 'all' || pack.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [puzzlePacks, searchQuery, selectedCategory]);

  const filteredBattlePools = useMemo(() => {
    return battlePools.filter(pool => {
      const matchSearch = pool.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pool.questions.some(q => q.question.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSearch;
    });
  }, [battlePools, searchQuery]);

  return (
    <div className="bg-slate-50 rounded-3xl border-2 border-slate-200/90 shadow-xl overflow-hidden font-sans text-slate-800 flex flex-col md:flex-row min-h-[720px] select-text">
      
      {/* 1. LEFT DIRECTORY WORKSPACE RAIL - Responsive sidebar/header */}
      <div className="w-full md:w-64 bg-slate-900 text-slate-350 border-b md:border-b-0 md:border-r border-slate-950 p-4 md:p-5 flex flex-col shrink-0">
        <div className="mb-4 md:mb-6 flex items-center justify-between md:block space-y-1">
          <div>
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider text-purple-400 font-mono bg-purple-950/80 px-2 py-0.5 rounded border border-purple-900/40 inline-block">
              Practice CMS v4.0
            </span>
            <h3 className="text-xs md:text-sm font-extrabold text-white uppercase tracking-tight flex items-center gap-1.5 mt-1">
              <Sliders size={14} className="text-purple-400" />
              <span>Curriculum Core</span>
            </h3>
          </div>
          <p className="hidden md:block text-[10px] text-slate-450">Manage hand-crafted interactive database questions.</p>
        </div>

        {/* Primary Navigation Buttons - Horizontal Slider on Mobile, Vertical Stack on Desktop */}
        <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible no-scrollbar pb-2 md:pb-0 scroll-smooth w-full -mx-4 px-4 md:mx-0 md:px-0">
          <button
            onClick={() => { setActiveTab('challenges'); setSelectedPackIds([]); }}
            className={`whitespace-nowrap px-3.5 py-2 md:px-4 md:py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 shrink-0 md:w-full cursor-pointer ${
              activeTab === 'challenges' 
                ? 'bg-indigo-600 text-white shadow-md font-black' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40 bg-slate-800/20 md:bg-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <Zap size={14} className={activeTab === 'challenges' ? 'text-amber-300 fill-amber-300 animate-pulse' : 'text-slate-400'} />
              <span>Challenges CMS</span>
            </span>
            <span className="bg-slate-950/80 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
              {challengePacks.length}
            </span>
          </button>
          
          <button
            onClick={() => { setActiveTab('puzzles'); setSelectedPackIds([]); }}
            className={`whitespace-nowrap px-3.5 py-2 md:px-4 md:py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 shrink-0 md:w-full cursor-pointer ${
              activeTab === 'puzzles' 
                ? 'bg-[#8b5cf6] text-white shadow-md font-black' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40 bg-slate-800/20 md:bg-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <Brain size={14} className={activeTab === 'puzzles' ? 'text-purple-300 fill-purple-300' : 'text-slate-400'} />
              <span>Puzzles Studio</span>
            </span>
            <span className="bg-slate-950/80 text-purple-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
              {puzzlePacks.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('battles'); setSelectedPackIds([]); }}
            className={`whitespace-nowrap px-3.5 py-2 md:px-4 md:py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 shrink-0 md:w-full cursor-pointer ${
              activeTab === 'battles' 
                ? 'bg-rose-600 text-white shadow-md font-black' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40 bg-slate-800/20 md:bg-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <Gamepad2 size={14} className={activeTab === 'battles' ? 'text-rose-300 fill-rose-300' : 'text-slate-400'} />
              <span>Battles Library</span>
            </span>
            <span className="bg-slate-950/80 text-rose-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
              {battlePools.length}
            </span>
          </button>

          <div className="hidden md:block border-t border-slate-800/60 my-2 pt-2" />

          <button
            onClick={() => { setActiveTab('importer'); setSelectedPackIds([]); }}
            className={`whitespace-nowrap px-3.5 py-2 md:px-4 md:py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 md:w-full cursor-pointer ${
              activeTab === 'importer' 
                ? 'bg-emerald-600 text-white shadow-md font-black' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40 bg-slate-800/20 md:bg-transparent'
            }`}
          >
            <Upload size={14} />
            <span>Bulk Importer</span>
          </button>

          <button
            onClick={() => { setActiveTab('analytics'); setSelectedPackIds([]); }}
            className={`whitespace-nowrap px-3.5 py-2 md:px-4 md:py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 md:w-full cursor-pointer ${
              activeTab === 'analytics' 
                ? 'bg-amber-600 text-white shadow-md font-black' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40 bg-slate-800/20 md:bg-transparent'
            }`}
          >
            <BarChart3 size={14} />
            <span>Live Stats</span>
          </button>
        </div>

        {/* Security Warning Bottom Lock bar */}
        <div className="hidden md:block bg-slate-950 p-3 rounded-2xl text-[9px] text-slate-450 border border-slate-850 space-y-1 mt-auto">
          <p className="font-mono text-purple-400 uppercase font-black tracking-widest flex items-center gap-1">
            <span>🛡️ CURATION EXCLUSIVE</span>
          </p>
          <p className="leading-relaxed text-slate-500">AI assistance disabled. Content is fully sandboxed, manually reviewed, and locally persistent.</p>
        </div>
      </div>

      {/* 2. MAIN HUB VIEWPORT */}
      <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 overflow-y-auto max-h-[95vh]">
        
        {/* Banner Alert Display */}
        {bannerMsg && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl flex items-center gap-3 border text-xs font-bold ${
              bannerMsg.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : bannerMsg.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-indigo-50 border-indigo-200 text-indigo-800'
            }`}
          >
            <CheckCircle2 size={16} />
            <span>{bannerMsg.text}</span>
          </motion.div>
        )}

        {/* ==================== SCREEN A: CHALLENGES (CONVOLUTED UNIFIED C1 SCREEN) ==================== */}
        {activeTab === 'challenges' && (
          <div className="space-y-6">
            
            {/* Gamified HUD Top Stats Bar */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="space-y-1.5 relative z-10">
                <span className="text-[10px] font-black uppercase text-indigo-400 font-mono tracking-widest bg-indigo-950 px-2.5 py-1 rounded-md border border-indigo-900">
                  Curriculum Console-1 (C1)
                </span>
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <span>⚡ Quest Challenges Registry</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium">Design and calibrate interactive gamified diagnostic question nodes.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 relative z-10 font-mono">
                <div className="bg-slate-850 px-3.5 py-2 rounded-2xl border border-slate-800 text-center min-w-[70px]">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Total Quests</span>
                  <span className="text-sm font-black text-white">{challengePacks.length}</span>
                </div>
                <div className="bg-slate-850 px-3.5 py-2 rounded-2xl border border-slate-800 text-center min-w-[70px]">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Avg Cookies</span>
                  <span className="text-sm font-black text-indigo-400">
                    {challengePacks.length ? Math.round(challengePacks.reduce((acc, curr) => acc + curr.xpReward, 0) / challengePacks.length) : 0}
                  </span>
                </div>
                <button
                  onClick={handleCreateNewChallengePack}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black px-4.5 py-3 rounded-2xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[42px]"
                >
                  <Plus size={14} />
                  <span>Manual Quest</span>
                </button>
              </div>
            </div>

            {/* Mobile View Toggle Switcher */}
            <div className="lg:hidden flex p-1.5 bg-slate-100 rounded-2xl max-w-sm mx-auto items-center justify-between border border-slate-200/50 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  soundManager.play('click');
                  setChallengesMobileTab('catalog');
                }}
                className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition-all cursor-pointer ${
                  challengesMobileTab === 'catalog'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🗂️ Registry Directory ({challengePacks.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  soundManager.play('click');
                  setChallengesMobileTab('editor');
                }}
                className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition-all cursor-pointer ${
                  challengesMobileTab === 'editor'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ⚙️ C1 Workspace Editor {activeChalPack ? '• ' + activeChalPack.topic.substring(0, 10) + '...' : ''}
              </button>
            </div>

            {/* Double-Pane C1 Workspace Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
              
              {/* ==================== LEFT PANE: CATALOG DIRECTORY (GRID 4/12) ==================== */}
              <div className={`lg:col-span-4 space-y-4 ${challengesMobileTab === 'editor' ? 'hidden lg:block' : 'block'}`}>
                
                {/* Directory Controls Box */}
                <div className="bg-white rounded-2.5xl border border-slate-200 p-4 space-y-3.5 shadow-3xs">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" size={13} />
                    <input
                      type="text"
                      placeholder="Query quest database..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-hidden focus:border-indigo-400 focus:bg-white transition-all text-slate-850"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t pt-2 border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                        Rank:
                      </span>
                      <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        className="text-xs font-bold p-1 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-slate-700 focus:bg-white"
                      >
                        <option value="all">Every Level</option>
                        <option value="Easy">Easy (Common)</option>
                        <option value="Medium">Medium (Rare)</option>
                        <option value="Hard">Hard (Legendary)</option>
                      </select>
                    </div>

                    {selectedPackIds.length > 0 && (
                      <button
                        onClick={handleBulkDelete}
                        className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-150 text-[10.5px] font-extrabold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 size={11} />
                        <span>Drop ({selectedPackIds.length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Scrollable Quest Directory Registry */}
                <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1 no-scrollbar">
                  {filteredChallengePacks.map(pack => {
                    const isSelected = activeChalPack && activeChalPack.id === pack.id;
                    
                    let cardBorderStyle = isSelected 
                      ? "border-indigo-600 bg-indigo-50/20 shadow-[0_4px_16px_rgba(99,102,241,0.06)]" 
                      : "border-slate-200 hover:border-indigo-300 hover:bg-slate-25 bg-white";
                    
                    let badgeColor = "bg-emerald-50 text-emerald-700 border border-emerald-150";
                    let badgeText = "Common";
                    
                    if (pack.difficulty === 'Medium') {
                      badgeColor = "bg-indigo-50 text-indigo-750 border border-indigo-150";
                      badgeText = "Rare";
                    } else if (pack.difficulty === 'Hard') {
                      badgeColor = "bg-amber-50 text-amber-700 border border-amber-150";
                      badgeText = "Legendary";
                    }

                    return (
                      <motion.div
                        key={pack.id}
                        layoutId={`quest-card-${pack.id}`}
                        onClick={() => {
                          soundManager.play('click');
                          setActiveChalPack(pack);
                          setIsEditingChal(true);
                          setChalEditQuestionIndex(0);
                          setAiTopicInput(pack.topic);
                          setAiError(null);
                          setChallengesMobileTab('editor');
                        }}
                        className={`rounded-2.5xl border-2 p-4.5 ${cardBorderStyle} cursor-pointer transition-all flex items-start gap-3 relative`}
                      >
                        {isSelected && (
                          <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-600 rounded-l-2xl" />
                        )}

                        <div className="flex items-center h-5 mt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedPackIds.includes(pack.id)}
                            onChange={() => handleSelectPack(pack.id)}
                            className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                          />
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-md font-mono ${badgeColor}`}>
                              {badgeText}
                            </span>
                            <span className="text-[9px] text-slate-500 font-bold font-mono bg-slate-100 px-1.5 py-0.5 rounded-md">
                              {pack.questions.length} Questions
                            </span>
                            <span className="text-[9px] text-indigo-600 font-extrabold font-mono bg-indigo-50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              <img src="/cookies.webp" alt="Cookies" className="w-3 h-3 object-contain shrink-0" /> {pack.xpReward} Cookies
                            </span>
                          </div>

                          <h4 className="text-xs font-black text-slate-900 tracking-tight leading-tight truncate">
                            {pack.topic}
                          </h4>
                          
                          <p className="text-[10.5px] text-slate-400 font-semibold truncate leading-relaxed">
                            {pack.description || 'Custom interactive question set.'}
                          </p>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-50 mt-1">
                            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider font-mono">
                              Click to configure
                            </span>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleDuplicateChallengePack(pack)}
                                className="bg-slate-50 hover:bg-slate-100 text-slate-500 p-1 rounded-md border border-slate-200/50"
                                title="Duplicate Quest"
                              >
                                <Copy size={11} />
                              </button>
                              <button
                                onClick={() => handleDeleteChallengePack(pack.id)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1 rounded-md border border-rose-150/50"
                                title="Delete Quest"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {filteredChallengePacks.length === 0 && (
                    <div className="text-center p-8 bg-white rounded-2.5xl border border-slate-200 space-y-2">
                      <span className="text-2xl text-slate-350 block uppercase font-mono">🔍 Sleuth Empty</span>
                      <p className="text-[11px] text-slate-400 font-semibold">No Quests match your queries.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ==================== RIGHT PANE: ACTIVE QUEST EDITOR (GRID 8/12) ==================== */}
              <div className={`lg:col-span-8 ${challengesMobileTab === 'catalog' ? 'hidden lg:block' : 'block'}`}>
                
                {!activeChalPack ? (
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4 shadow-sm flex flex-col justify-center items-center min-h-[500px]">
                    <div className="p-4.5 bg-indigo-50 text-indigo-600 rounded-full animate-pulse border border-indigo-100">
                      <Zap size={32} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-slate-800">C1: Curriculum Workspace Active</h3>
                      <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-semibold">
                        Select an interactive quest from the registry catalog on the left, or create a brand new manual quest to customize diagnostic challenge items.
                      </p>
                    </div>
                    <button
                      onClick={handleCreateNewChallengePack}
                      className="bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-black px-5 py-3 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all mt-2"
                    >
                      <Plus size={14} />
                      <span>Create New Quest Pack</span>
                    </button>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-6 text-left relative"
                  >
                    {/* Active Pack Title & Header Controls */}
                    <div className="flex items-start justify-between border-b pb-3.5 gap-4">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <span className="text-[9px] font-black text-indigo-600 uppercase font-mono tracking-widest bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                          ⚡ CONSOLE WORKSPACE ACTIVE
                        </span>
                        <input
                          type="text"
                          value={activeChalPack.topic}
                          onChange={(e) => setActiveChalPack({ ...activeChalPack, topic: e.target.value })}
                          placeholder="Challenge Topic Name..."
                          className="font-black text-base md:text-lg text-slate-800 outline-hidden border-b border-transparent hover:border-slate-250 focus:border-indigo-400 w-full mt-1 pb-0.5 transition-colors font-sans"
                        />
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0 pt-1">
                        <button
                          onClick={() => {
                            soundManager.play('click');
                            setActiveChalPack(null);
                            setChallengesMobileTab('catalog');
                          }}
                          className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-500 font-extrabold px-3 py-2 rounded-xl border border-slate-200 flex items-center gap-1 cursor-pointer"
                        >
                          Close Workspace
                        </button>
                      </div>
                    </div>

                    {/* Quest settings config dashboard */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50/70 p-4 rounded-2.5xl border border-slate-200/60 text-xs text-left">
                      <div className="space-y-1.5">
                        <label className="font-extrabold text-slate-500 uppercase text-[9px] font-mono tracking-wider">Quest Difficulty</label>
                        <select
                          value={activeChalPack.difficulty}
                          onChange={(e: any) => setActiveChalPack({ ...activeChalPack, difficulty: e.target.value })}
                          className="w-full text-xs font-bold p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer focus:border-indigo-400"
                        >
                          <option value="Easy">Easy (Common)</option>
                          <option value="Medium">Medium (Rare)</option>
                          <option value="Hard">Hard (Legendary)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-extrabold text-slate-500 uppercase text-[9px] font-mono tracking-wider">Cookie Completion Reward</label>
                        <input
                          type="number"
                          value={activeChalPack.xpReward}
                          onChange={(e) => setActiveChalPack({ ...activeChalPack, xpReward: Number(e.target.value) })}
                          className="w-full text-xs font-bold p-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400"
                          min="10"
                          max="1000"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-extrabold text-slate-500 uppercase text-[9px] font-mono tracking-wider">Outcome Core Objective</label>
                        <input
                          type="text"
                          placeholder="Outcome description..."
                          value={activeChalPack.description || ''}
                          onChange={(e) => setActiveChalPack({ ...activeChalPack, description: e.target.value })}
                          className="w-full text-xs font-bold p-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-extrabold text-slate-500 uppercase text-[9px] font-mono tracking-wider">Linked Learning Unit (Module)</label>
                        <select
                          value={activeChalPack.linked_unit_id || activeChalPack.linkedUnitId || ''}
                          onChange={(e) => setActiveChalPack({ ...activeChalPack, linked_unit_id: e.target.value, linkedUnitId: e.target.value })}
                          className="w-full text-xs font-bold p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer focus:border-indigo-400 text-slate-900"
                        >
                          <option value="">None / Not Linked</option>
                          {[...AI_CURRICULUM, ...PRACTICE_CURRICULUM].map(m => (
                            <option key={m.id} value={m.id}>
                              {m.title} ({m.id})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* ✨ AI ASSISTANT AUTOGENERATOR DOCK */}
                    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2.5xl border border-indigo-100/60 p-4.5 space-y-3.5 relative overflow-hidden">
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                            <Sparkles size={14} className="animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Gemini AI Generator</h4>
                            <p className="text-[10px] text-slate-500 font-semibold leading-tight">Instantly populate high-quality non-repetitive diagnostic queries.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                          <span className="text-[9px] font-black text-slate-450 uppercase font-mono">Count:</span>
                          <select
                            value={aiCountInput}
                            onChange={(e) => setAiCountInput(Number(e.target.value))}
                            className="text-[10px] font-black border-0 bg-transparent rounded-md font-mono focus:ring-0 p-0 cursor-pointer"
                          >
                            <option value="3">3</option>
                            <option value="5">5</option>
                            <option value="8">8</option>
                            <option value="10">10</option>
                          </select>
                        </div>
                      </div>

                      {aiError && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-700 text-[10.5px] p-2.5 rounded-xl font-semibold flex items-center gap-1.5 animate-bounce">
                          <AlertCircle size={13} className="shrink-0" />
                          <span>{aiError}</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center relative z-10">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-indigo-500 font-mono uppercase">Topic:</span>
                          <input
                            type="text"
                            value={aiTopicInput || activeChalPack.topic}
                            onChange={(e) => setAiTopicInput(e.target.value)}
                            placeholder="Enter curriculum topic for generation..."
                            className="w-full text-xs pl-15 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl font-bold outline-hidden focus:border-indigo-400 focus:bg-white text-indigo-950"
                          />
                        </div>
                        <button
                          onClick={() => handleAIGenerateSystem('challenges', aiTopicInput || activeChalPack.topic)}
                          disabled={isGeneratingAI}
                          className="bg-indigo-600 hover:bg-indigo-750 disabled:bg-indigo-400 text-white text-xs font-black px-4.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer min-h-[40px]"
                        >
                          {isGeneratingAI ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              <span>Drafting with AI...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={13} />
                              <span>Auto-Generate</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Question selector and Creator Layout split */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Question rail list - Desktop sidebar */}
                      <div className="hidden md:block md:col-span-1 space-y-2 border-r pr-4 border-slate-100 max-h-[420px] overflow-y-auto no-scrollbar">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider">
                            Index ({activeChalPack.questions.length})
                          </span>
                          <button
                            onClick={() => {
                              soundManager.play('click');
                              const copy = [...activeChalPack.questions];
                              copy.push({
                                id: `cq_${Date.now()}_idx_${copy.length}`,
                                type: 'MCQ',
                                question: 'Double click to edit question text.',
                                options: ['Option Correct', 'B', 'C', 'D'],
                                correctAnswer: 'Option Correct',
                                explanation: 'Required explanation.'
                              });
                              setActiveChalPack({ ...activeChalPack, questions: copy });
                              setChalEditQuestionIndex(copy.length - 1);
                            }}
                            className="text-[10.5px] bg-indigo-50 text-indigo-750 hover:bg-indigo-100 font-extrabold px-2 py-1 rounded flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={12} />
                            <span>Append</span>
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {activeChalPack.questions.map((q, idx) => (
                            <div
                              key={idx}
                              onClick={() => setChalEditQuestionIndex(idx)}
                              className={`p-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-between gap-2 shrink-0 ${
                                chalEditQuestionIndex === idx 
                                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-2xs' 
                                  : 'border-slate-150 bg-white hover:bg-slate-50 text-slate-650'
                              }`}
                            >
                              <div className="min-w-0 flex-1 flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-400">Q{idx + 1}</span>
                                <span className="truncate pr-1 text-[11.5px] font-black">{q.question}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (activeChalPack.questions.length <= 1) {
                                    alert('Pack must contain at least 1 question.');
                                    return;
                                  }
                                  soundManager.play('incorrect');
                                  const copy = activeChalPack.questions.filter((_, qIdx) => qIdx !== idx);
                                  setActiveChalPack({ ...activeChalPack, questions: copy });
                                  setChalEditQuestionIndex(0);
                                }}
                                className="text-slate-400 hover:text-rose-600 p-0.5 shrink-0"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Question rail list - Mobile Horizontal Step Selector */}
                      <div className="block md:hidden space-y-2.5 pb-2 border-b border-slate-100 w-full">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider">
                            Questions ({activeChalPack.questions.length})
                          </span>
                          <button
                            onClick={() => {
                              soundManager.play('click');
                              const copy = [...activeChalPack.questions];
                              copy.push({
                                id: `cq_${Date.now()}_idx_${copy.length}`,
                                type: 'MCQ',
                                question: 'Double click to edit question text.',
                                options: ['Option Correct', 'B', 'C', 'D'],
                                correctAnswer: 'Option Correct',
                                explanation: 'Required explanation.'
                              });
                              setActiveChalPack({ ...activeChalPack, questions: copy });
                              setChalEditQuestionIndex(copy.length - 1);
                            }}
                            className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-extrabold px-2.5 py-1 rounded-xl flex items-center gap-1 cursor-pointer min-h-[32px]"
                          >
                            <Plus size={12} />
                            <span>Append</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scroll-smooth no-scrollbar w-full">
                          {activeChalPack.questions.map((q, idx) => (
                            <div 
                              key={idx}
                              onClick={() => setChalEditQuestionIndex(idx)}
                              className={`px-3.5 py-2 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 min-h-[40px] ${
                                chalEditQuestionIndex === idx 
                                  ? 'border-indigo-450 bg-indigo-50/80 text-indigo-900 shadow-sm' 
                                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-650'
                              }`}
                            >
                              <span>Q{idx + 1}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (activeChalPack.questions.length <= 1) {
                                    alert('Pack must contain at least 1 question.');
                                    return;
                                  }
                                  soundManager.play('incorrect');
                                  const copy = activeChalPack.questions.filter((_, qIdx) => qIdx !== idx);
                                  setActiveChalPack({ ...activeChalPack, questions: copy });
                                  setChalEditQuestionIndex(0);
                                }}
                                className="text-slate-400 hover:text-rose-600 p-0.5"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Active question layout builder (Google Form style) */}
                      <div className="md:col-span-2 space-y-4 bg-slate-25/50 border border-slate-150 p-5 rounded-2.5xl text-xs">
                        {chalEditQuestionIndex !== null && activeChalPack.questions[chalEditQuestionIndex] ? (() => {
                          const qItem = activeChalPack.questions[chalEditQuestionIndex];
                          const setQValue = (field: string, val: any) => {
                            const questionsCopy = [...activeChalPack.questions];
                            questionsCopy[chalEditQuestionIndex] = {
                              ...qItem,
                              [field]: val
                            };
                            setActiveChalPack({ ...activeChalPack, questions: questionsCopy });
                          };

                          return (
                            <div className="space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
                                <span className="text-[10px] font-black uppercase text-indigo-600 font-mono">
                                  ACTIVE QUESTION FORM: ITEM Q{chalEditQuestionIndex + 1}
                                </span>

                                <div className="flex items-center gap-1">
                                  <span className="text-[10.5px] font-bold text-slate-500">Format:</span>
                                  <select
                                    value={qItem.type || 'MCQ'}
                                    onChange={(e: any) => setQValue('type', e.target.value)}
                                    className="p-1 font-bold bg-white border border-slate-200 rounded text-[11px] cursor-pointer"
                                  >
                                    <option value="MCQ">Standard MCQ</option>
                                    <option value="Image MCQ">Image MCQ</option>
                                    <option value="AIVsHuman">AI vs Human comparison</option>
                                    <option value="FactVsMyth">Fact vs Myth</option>
                                    <option value="ToolPicker">Tool Picker</option>
                                    <option value="Logo Recognition">Logo Recognition</option>
                                    <option value="Prompt Selection">Prompt Selection</option>
                                  </select>
                                </div>
                              </div>

                              {/* Question Text */}
                              <div className="space-y-1">
                                <label className="font-extrabold text-slate-700 uppercase text-[9px] font-mono tracking-wider">Question Prompt / Scenario Description</label>
                                <input
                                  type="text"
                                  value={qItem.question}
                                  onChange={(e) => setQValue('question', e.target.value)}
                                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-indigo-400"
                                />
                              </div>

                              {/* CONDITIONAL EXTRA INPUT BASED ON TYPE */}
                              {qItem.type === 'AIVsHuman' && (
                                <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/40 rounded-xl border border-indigo-100">
                                  <div className="space-y-1">
                                    <label className="font-extrabold text-indigo-900 text-[10px] block font-mono">ROBOT PARAGRAPH (Text A)</label>
                                    <textarea
                                      rows={3}
                                      value={qItem.extraData?.textA || ''}
                                      onChange={(e) => setQValue('extraData', { ...qItem.extraData, textA: e.target.value })}
                                      placeholder="Copy paste AI text..."
                                      className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="font-extrabold text-indigo-900 text-[10px] block font-mono">HUMAN PARAGRAPH (Text B)</label>
                                    <textarea
                                      rows={3}
                                      value={qItem.extraData?.textB || ''}
                                      onChange={(e) => setQValue('extraData', { ...qItem.extraData, textB: e.target.value })}
                                      placeholder="Personal blogger human paragraph..."
                                      className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                                    />
                                  </div>
                                </div>
                              )}

                              {qItem.type === 'FactVsMyth' && (
                                <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100 grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="font-extrabold text-amber-900 text-[10px] block font-mono">FACT HEADER PILL LABEL</label>
                                    <input
                                      type="text"
                                      value={qItem.extraData?.factLabel || ''}
                                      onChange={(e) => setQValue('extraData', { ...qItem.extraData, factLabel: e.target.value })}
                                      placeholder="Confidence vs Knowledge"
                                      className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1 flex items-center gap-2 pt-5">
                                    <input
                                      type="checkbox"
                                      checked={qItem.extraData?.isFact || false}
                                      onChange={(e) => setQValue('extraData', { ...qItem.extraData, isFact: e.target.checked })}
                                      className="rounded focus:ring-amber-500 cursor-pointer"
                                      id="is_fact_chk"
                                    />
                                    <label htmlFor="is_fact_chk" className="font-extrabold text-amber-900 text-[11px] cursor-pointer">True Fact, Otherwise Myth</label>
                                  </div>
                                </div>
                              )}

                              {/* Options List */}
                              <div className="space-y-2">
                                <label className="font-extrabold text-slate-700 block uppercase text-[9px] font-mono tracking-wider">Answer Choice Targets</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {(qItem.options || []).map((opt, oIdx) => (
                                    <div key={oIdx} className="flex items-center gap-1.5 bg-white p-2 border border-slate-150 rounded-lg">
                                      <span className="font-bold text-slate-400 font-mono text-[10px]">{String.fromCharCode(65 + oIdx)})</span>
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                          const optCopy = [...qItem.options];
                                          optCopy[oIdx] = e.target.value;
                                          setQValue('options', optCopy);
                                        }}
                                        className="flex-1 bg-transparent pr-2 font-medium text-xs focus:ring-0 outline-hidden border-0 p-0"
                                      />
                                      <button
                                        onClick={() => {
                                          soundManager.play('click');
                                          setQValue('correctAnswer', opt);
                                        }}
                                        className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-1 rounded-md transition-all cursor-pointer ${
                                          opt === qItem.correctAnswer 
                                            ? 'bg-emerald-600 text-white shadow-xs' 
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                      >
                                        {opt === qItem.correctAnswer ? 'Correct' : 'Mark'}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      soundManager.play('click');
                                      const optCopy = [...(qItem.options || []), 'New Option Option'];
                                      setQValue('options', optCopy);
                                    }}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg font-bold text-[10.5px] cursor-pointer transition-colors"
                                  >
                                    + Add Selection Option
                                  </button>
                                </div>
                              </div>

                              {/* Explanation Nodes */}
                              <div className="space-y-1">
                                <label className="font-extrabold text-slate-700 uppercase text-[9px] font-mono tracking-wider">Detailed Diagnostic Explanation (Post-submit feedback)</label>
                                <textarea
                                  rows={2}
                                  value={qItem.explanation}
                                  onChange={(e) => setQValue('explanation', e.target.value)}
                                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:border-indigo-400"
                                />
                              </div>
                            </div>
                          );
                        })() : (
                          <p className="text-slate-400 text-center font-bold">Please select or insert a question node from the left rail.</p>
                        )}
                      </div>

                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-end gap-3 border-t pt-4">
                      <button
                        onClick={() => {
                          soundManager.play('click');
                          setActiveChalPack(null);
                          setChallengesMobileTab('catalog');
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs px-5 py-3 rounded-xl transition-all cursor-pointer border border-slate-200"
                      >
                        Exit Workspace
                      </button>
                      <button
                        onClick={handleSaveChallengePack}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-3 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                      >
                        <Save size={13} />
                        <span>Publish Changes</span>
                      </button>
                    </div>

                  </motion.div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* ==================== SCREEN B: PUZZLES ==================== */}
        {activeTab === 'puzzles' && !isEditingPuz && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>🧩 Puzzles Content Library</span>
                </h2>
                <p className="text-xs text-slate-500 font-semibold">Image-heavy diagnostic locks testing spatial and logical anomalies.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateNewPuzzlePack}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-black px-4 py-3 rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Manual Puzzle spec</span>
                </button>
              </div>
            </div>

            {/* Sub-Filters and search */}
            <div className="bg-white rounded-2.5xl border border-slate-200 p-4 space-y-3 shadow-3xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" size={14} />
                <input
                  type="text"
                  placeholder="Query puzzle specs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-hidden focus:border-purple-400 focus:bg-white transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center gap-1">
                  <Filter size={10} />
                  Category:
                </span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="all">Every Category</option>
                  <option value="AI Detective">🕵️‍♂️ AI Detective</option>
                  <option value="AI Art Mystery">🎨 AI Art Mystery</option>
                  <option value="Hidden AI">🔍 Hidden AI</option>
                  <option value="AI vs Human">🎭 AI vs Human</option>
                  <option value="Prompt Master">💬 Prompt Master</option>
                  <option value="Logic Lab">🔮 Logic Lab</option>
                </select>

                {selectedPackIds.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 size={13} />
                    <span>Remove Selected ({selectedPackIds.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* List Table of Puzzles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPuzzlePacks.map(pack => {
                const firstImg = pack.questions[0]?.imageUrl || PRESET_PUZZLE_IMAGES[0].url;
                return (
                  <div key={pack.id} className="bg-white rounded-3xl border-2 border-slate-200 p-4 shadow-3xs flex flex-col justify-between gap-4 transition-all hover:border-purple-300">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedPackIds.includes(pack.id)}
                        onChange={() => handleSelectPack(pack.id)}
                        className="mt-1 rounded border-slate-350 text-purple-605 focus:ring-purple-500 cursor-pointer text-purple-600"
                      />
                      
                      <div className="space-y-2 flex-1">
                        <div className="h-28 rounded-2xl overflow-hidden relative border border-slate-100 bg-slate-900">
                          <img src={firstImg} alt="Preview" className="w-full h-full object-cover opacity-85" referrerPolicy="no-referrer" />
                          <div className="absolute top-2 left-2 bg-purple-900/80 backdrop-blur-xs text-[8.5px] font-black text-purple-100 border border-purple-700/50 px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                            {pack.category}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-slate-850">{pack.title}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 font-bold font-mono">
                              Unlock: {pack.costXP} Cookies • Reward: {pack.xpReward} Cookies
                            </span>
                            {(() => {
                              const linkedUnitId = pack.linked_unit_id || pack.linkedUnitId;
                              const linkedUnit = linkedUnitId ? [...AI_CURRICULUM, ...PRACTICE_CURRICULUM].find(m => m.id === linkedUnitId) : null;
                              if (linkedUnit) {
                                return (
                                  <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    🎁 Linked: {linkedUnit.title}
                                  </span>
                                );
                              }
                              return (
                                <span className="text-[9.5px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  Unlinked (No Chest)
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t pt-3 border-slate-100">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 font-mono">
                        {pack.questions.length} Visual Stage(s)
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            soundManager.play('click');
                            setActivePuzPack(pack);
                            setIsEditingPuz(true);
                            setPuzEditQuestionIndex(0);
                            setAiTopicInput(pack.title);
                            setAiError(null);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit3 size={11} />
                          <span>Layout Spec</span>
                        </button>
                        <button
                          onClick={() => handleDuplicatePuzzlePack(pack)}
                          className="bg-slate-50 hover:bg-slate-150 text-slate-500 p-2 rounded-lg cursor-pointer"
                        >
                          <Copy size={11} />
                        </button>
                        <button
                          onClick={() => handleDeletePuzzlePack(pack.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-500 p-2 rounded-lg cursor-pointer border border-rose-100"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredPuzzlePacks.length === 0 && (
                <div className="md:col-span-2 text-center p-12 bg-white rounded-3xl border border-slate-200 space-y-2">
                  <span className="text-3xl text-slate-400 block uppercase font-mono">🔍 Sleuth Empty</span>
                  <p className="text-xs text-slate-500 font-semibold">No visual puzzles match your queries.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== SCREEN C: BATTLES ==================== */}
        {activeTab === 'battles' && !isEditingBat && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-rose-950 tracking-tight flex items-center gap-2">
                  <span>🚀 Arena Battle Questions</span>
                </h2>
                <p className="text-xs text-slate-500 font-semibold">Speed MCQs under strict constraints: short, read in under 3s, no paragraphs.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateNewBattlePool}
                  className="bg-rose-600 hover:bg-rose-750 text-white text-xs font-black px-4 py-3 rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Manual Battle Pool</span>
                </button>
              </div>
            </div>

            {/* List of battle pools */}
            <div className="grid grid-cols-1 gap-4">
              {filteredBattlePools.map(pool => (
                <div key={pool.id} className="bg-white rounded-3xl border-2 border-slate-200 p-5 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all hover:border-rose-400">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold font-mono">
                      <span className="bg-rose-50 text-rose-700 border border-rose-150 px-2 py-0.5 rounded font-black uppercase text-[8.5px]">
                        ACTIVE ARENA POOL
                      </span>
                      <span>• {pool.questions.length} speed questions</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900">{pool.topic}</h4>
                    
                    <div className="flex flex-wrap gap-2 pt-1">
                      {pool.questions.map((q, idx) => (
                        <div key={idx} className="bg-slate-50 text-[10.5px] font-semibold text-slate-600 border border-slate-150 px-2 py-1 rounded-lg">
                          Q{idx+1}: {q.question.substring(0, 35)}...
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 justify-end border-t pt-3 md:border-0 md:pt-0">
                    <button
                      onClick={() => {
                        soundManager.play('click');
                        setActiveBatPool(pool);
                        setIsEditingBat(true);
                        setBatEditQuestionIndex(0);
                        setAiTopicInput(pool.topic);
                        setAiError(null);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-black px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 size={11} />
                      <span>Configure Pool</span>
                    </button>
                    <button
                      onClick={() => handleDuplicateBattlePool(pool)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-xl cursor-pointer"
                    >
                      <Copy size={11} />
                    </button>
                    <button
                      onClick={() => handleDeleteBattlePool(pool.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-500 p-2 rounded-xl cursor-pointer border border-rose-100"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== SCREEN D: MANUAL DOCK EDITOR (CHALLENGES - INTEGRATED IN C1 WORKSPACE) ==================== */}
        {false && isEditingChal && activeChalPack && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-6 text-left">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase font-mono">⚡ Challenges Unit Designer</span>
                <input
                  type="text"
                  value={activeChalPack.topic}
                  onChange={(e) => setActiveChalPack({ ...activeChalPack, topic: e.target.value })}
                  placeholder="Challenge Topic Name..."
                  className="font-black text-lg text-slate-800 outline-hidden border-b border-transparent focus:border-slate-300 w-full mt-1"
                />
              </div>
              <button
                onClick={() => { setIsEditingChal(false); soundManager.play('click'); }}
                className="text-xs font-black uppercase text-slate-400 hover:text-slate-600"
              >
                Cancel Edit
              </button>
            </div>

            {/* Pack configuration panel */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Global Difficulty</label>
                <select
                  value={activeChalPack.difficulty}
                  onChange={(e: any) => setActiveChalPack({ ...activeChalPack, difficulty: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-slate-200 rounded-lg"
                >
                  <option value="Easy">Easy (Lower Grades)</option>
                  <option value="Medium">Medium (Average)</option>
                  <option value="Hard">Hard (Expert)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Cookie Completion Reward</label>
                <input
                  type="number"
                  value={activeChalPack.xpReward}
                  onChange={(e) => setActiveChalPack({ ...activeChalPack, xpReward: Number(e.target.value) })}
                  className="w-full text-xs font-bold p-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Unit Outcome Description</label>
                <input
                  type="text"
                  placeholder="Master how neural text parses..."
                  value={activeChalPack.description || ''}
                  onChange={(e) => setActiveChalPack({ ...activeChalPack, description: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Linked Learning Unit</label>
                <select
                  value={activeChalPack.linked_unit_id || activeChalPack.linkedUnitId || ''}
                  onChange={(e) => setActiveChalPack({ ...activeChalPack, linked_unit_id: e.target.value, linkedUnitId: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                >
                  <option value="">None / Not Linked</option>
                  {[...AI_CURRICULUM, ...PRACTICE_CURRICULUM].map(m => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ✨ AI ASSISTANT AUTOGENERATOR DOCK */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Gemini Curriculum Generator</h4>
                    <p className="text-[10px] text-slate-500 font-semibold">Automatically populate this pack with different, high-quality questions instantly.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500">Count:</span>
                  <select
                    value={aiCountInput}
                    onChange={(e) => setAiCountInput(Number(e.target.value))}
                    className="p-1 text-[11px] font-black border border-slate-250 bg-white rounded-md font-mono"
                  >
                    <option value="3">3</option>
                    <option value="5">5</option>
                    <option value="8">8</option>
                    <option value="10">10</option>
                  </select>
                </div>
              </div>

              {aiError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-[11px] p-2 rounded-lg font-semibold flex items-center gap-1.5 animate-bounce">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-500 font-mono">TOPIC:</span>
                  <input
                    type="text"
                    value={aiTopicInput || activeChalPack.topic}
                    onChange={(e) => setAiTopicInput(e.target.value)}
                    placeholder="Enter generation focus topic..."
                    className="w-full text-xs pl-14 pr-3 py-2 bg-white border border-slate-200 rounded-xl font-bold outline-hidden focus:border-indigo-400 focus:bg-white transition-all text-indigo-950"
                  />
                </div>
                <button
                  onClick={() => handleAIGenerateSystem('challenges', aiTopicInput || activeChalPack.topic)}
                  disabled={isGeneratingAI}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  {isGeneratingAI ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Drafting Questions...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} className="animate-pulse" />
                      <span>Auto-Generate with Gemini</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Question selector and Creator */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Question rail list - Desktop sidebar */}
              <div className="hidden md:block md:col-span-1 space-y-2 border-r pr-4 border-slate-100 max-h-[420px] overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider">
                    Question Index list ({activeChalPack.questions.length})
                  </span>
                  <button
                    onClick={() => {
                      soundManager.play('click');
                      const copy = [...activeChalPack.questions];
                      copy.push({
                        id: `cq_${Date.now()}_idx_${copy.length}`,
                        type: 'MCQ',
                        question: 'Double click to edit question text.',
                        options: ['Option Correct', 'B', 'C', 'D'],
                        correctAnswer: 'Option Correct',
                        explanation: 'Required explanation.'
                      });
                      setActiveChalPack({ ...activeChalPack, questions: copy });
                      setChalEditQuestionIndex(copy.length - 1);
                    }}
                    className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-2 py-1 rounded flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Append</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {activeChalPack.questions.map((q, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setChalEditQuestionIndex(idx)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                        chalEditQuestionIndex === idx 
                          ? 'border-indigo-400 bg-indigo-50/50 text-indigo-900' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-650'
                      }`}
                    >
                      <span className="truncate pr-2">Q{idx + 1}: {q.question}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeChalPack.questions.length <= 1) {
                            alert('Pack must contain at least 1 question.');
                            return;
                          }
                          soundManager.play('incorrect');
                          const copy = activeChalPack.questions.filter((_, qIdx) => qIdx !== idx);
                          setActiveChalPack({ ...activeChalPack, questions: copy });
                          setChalEditQuestionIndex(0);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question rail list - Mobile Horizontal Step Selector */}
              <div className="block md:hidden space-y-2.5 pb-2 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider">
                    Quest Questions ({activeChalPack.questions.length})
                  </span>
                  <button
                    onClick={() => {
                      soundManager.play('click');
                      const copy = [...activeChalPack.questions];
                      copy.push({
                        id: `cq_${Date.now()}_idx_${copy.length}`,
                        type: 'MCQ',
                        question: 'Double click to edit question text.',
                        options: ['Option Correct', 'B', 'C', 'D'],
                        correctAnswer: 'Option Correct',
                        explanation: 'Required explanation.'
                      });
                      setActiveChalPack({ ...activeChalPack, questions: copy });
                      setChalEditQuestionIndex(copy.length - 1);
                    }}
                    className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-extrabold px-2.5 py-1 rounded-xl flex items-center gap-1 cursor-pointer min-h-[32px]"
                  >
                    <Plus size={12} />
                    <span>Append</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scroll-smooth no-scrollbar w-full">
                  {activeChalPack.questions.map((q, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setChalEditQuestionIndex(idx)}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 min-h-[40px] ${
                        chalEditQuestionIndex === idx 
                          ? 'border-indigo-450 bg-indigo-50/80 text-indigo-900 shadow-sm' 
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-650'
                      }`}
                    >
                      <span>Q{idx + 1}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeChalPack.questions.length <= 1) {
                            alert('Pack must contain at least 1 question.');
                            return;
                          }
                          soundManager.play('incorrect');
                          const copy = activeChalPack.questions.filter((_, qIdx) => qIdx !== idx);
                          setActiveChalPack({ ...activeChalPack, questions: copy });
                          setChalEditQuestionIndex(0);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active question layout builder (Google Form style) */}
              <div className="md:col-span-2 space-y-4 bg-slate-25/50 border border-slate-150 p-5 rounded-2.5xl text-xs">
                {chalEditQuestionIndex !== null && activeChalPack.questions[chalEditQuestionIndex] ? (() => {
                  const qItem = activeChalPack.questions[chalEditQuestionIndex];
                  const setQValue = (field: string, val: any) => {
                    const questionsCopy = [...activeChalPack.questions];
                    questionsCopy[chalEditQuestionIndex] = {
                      ...qItem,
                      [field]: val
                    };
                    setActiveChalPack({ ...activeChalPack, questions: questionsCopy });
                  };

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-indigo-600 font-mono">
                          ACTIVE FORM OUTLINE: ITEM #{chalEditQuestionIndex + 1}
                        </span>

                        <div className="flex items-center gap-1.1">
                          <span className="text-[10.5px] font-bold text-slate-500">Format Template:</span>
                          <select
                            value={qItem.type || 'MCQ'}
                            onChange={(e: any) => setQValue('type', e.target.value)}
                            className="p-1 font-bold bg-white border border-slate-200 rounded text-[11px]"
                          >
                            <option value="MCQ">Standard MCQ</option>
                            <option value="Image MCQ">Image MCQ</option>
                            <option value="AIVsHuman">AI vs Human comparison</option>
                            <option value="FactVsMyth">Fact vs Myth</option>
                            <option value="ToolPicker">Tool Picker</option>
                            <option value="Logo Recognition">Logo Recognition</option>
                            <option value="Prompt Selection">Prompt Selection</option>
                          </select>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-700">Question Title / Prompt Description</label>
                        <input
                          type="text"
                          value={qItem.question}
                          onChange={(e) => setQValue('question', e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      {/* CONDITIONAL EXTRA INPUT BASED ON TYPE */}
                      {qItem.type === 'AIVsHuman' && (
                        <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/40 rounded-xl border border-indigo-100">
                          <div className="space-y-1">
                            <label className="font-extrabold text-indigo-900 text-[10px] block">ROBOT PARAGRAPH (Text A)</label>
                            <textarea
                              rows={3}
                              value={qItem.extraData?.textA || ''}
                              onChange={(e) => setQValue('extraData', { ...qItem.extraData, textA: e.target.value })}
                              placeholder="Copy paste AI text..."
                              className="w-full p-2 bg-white border border-slate-200 rounded"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-extrabold text-indigo-900 text-[10px] block">HUMAN PARAGRAPH (Text B)</label>
                            <textarea
                              rows={3}
                              value={qItem.extraData?.textB || ''}
                              onChange={(e) => setQValue('extraData', { ...qItem.extraData, textB: e.target.value })}
                              placeholder="Personal blogger human paragraph..."
                              className="w-full p-2 bg-white border border-slate-200 rounded"
                            />
                          </div>
                        </div>
                      )}

                      {qItem.type === 'FactVsMyth' && (
                        <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100 grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-extrabold text-amber-900 text-[10px] block">FACT HEADER PILL LABEL</label>
                            <input
                              type="text"
                              value={qItem.extraData?.factLabel || ''}
                              onChange={(e) => setQValue('extraData', { ...qItem.extraData, factLabel: e.target.value })}
                              placeholder="Confidence vs Knowledge"
                              className="w-full p-2 bg-white border border-slate-200 rounded"
                            />
                          </div>
                          <div className="space-y-1 flex items-center gap-2 pt-5">
                            <input
                              type="checkbox"
                              checked={qItem.extraData?.isFact || false}
                              onChange={(e) => setQValue('extraData', { ...qItem.extraData, isFact: e.target.checked })}
                              className="rounded focus:ring-amber-500"
                              id="is_fact_chk"
                            />
                            <label htmlFor="is_fact_chk" className="font-extrabold text-amber-900 text-[11px] cursor-pointer">True Fact, Otherwise Myth</label>
                          </div>
                        </div>
                      )}

                      {/* Options List */}
                      <div className="space-y-2">
                        <label className="font-extrabold text-slate-700 block">MCQ Answer Choices Options</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(qItem.options || []).map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-1.5 bg-white p-2 border border-slate-150 rounded-lg">
                              <span className="font-bold text-slate-400 font-mono">{String.fromCharCode(65 + oIdx)})</span>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const optCopy = [...qItem.options];
                                  optCopy[oIdx] = e.target.value;
                                  setQValue('options', optCopy);
                                }}
                                className="flex-1 bg-transparent pr-2 font-medium"
                              />
                              <button
                                onClick={() => {
                                  soundManager.play('click');
                                  setQValue('correctAnswer', opt);
                                }}
                                className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded transition-all ${
                                  opt === qItem.correctAnswer 
                                    ? 'bg-emerald-600 text-white shadow-xs' 
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {opt === qItem.correctAnswer ? 'Correct' : 'Mark'}
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const optCopy = [...(qItem.options || []), 'New Option Option'];
                              setQValue('options', optCopy);
                            }}
                            className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-2 py-1.5 rounded-lg font-bold"
                          >
                            + Option choice
                          </button>
                        </div>
                      </div>

                      {/* Explanation Nodes */}
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-700">Detailed Diagnostic Explanation (Shown after submit)</label>
                        <textarea
                          rows={2}
                          value={qItem.explanation}
                          onChange={(e) => setQValue('explanation', e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  );
                })() : (
                  <p className="text-slate-400 text-center font-bold">Please select or insert a question node from the left rail.</p>
                )}
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <button
                onClick={() => { setIsEditingChal(false); soundManager.play('click'); }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs px-5 py-3 rounded-xl transition-all"
              >
                Exit Curing
              </button>
              <button
                onClick={handleSaveChallengePack}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-3 rounded-xl flex items-center gap-1.5 shadow-md"
              >
                <Save size={13} />
                <span>Publish Challenge Pack</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== SCREEN E: DOCK EDITOR (PUZZLES) ==================== */}
        {isEditingPuz && activePuzPack && (
          <div className="bg-white rounded-3xl border border-slate-200/95 p-6 space-y-6 text-left">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-black text-purple-600 uppercase font-mono">🧩 Puzzles Studio Workshop</span>
                <input
                  type="text"
                  value={activePuzPack.title}
                  onChange={(e) => setActivePuzPack({ ...activePuzPack, title: e.target.value })}
                  className="font-black text-lg text-slate-800 outline-hidden border-b border-transparent focus:border-slate-300 w-full mt-1"
                />
              </div>
              <button
                onClick={() => { setIsEditingPuz(false); soundManager.play('click'); }}
                className="text-xs font-black uppercase text-slate-400 hover:text-slate-600"
              >
                Discard Layout
              </button>
            </div>

            {/* General parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Puzzle Category</label>
                <select
                  value={activePuzPack.category}
                  onChange={(e: any) => setActivePuzPack({ ...activePuzPack, category: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-slate-200 rounded-lg"
                >
                  <option value="AI Detective">🕵️‍♂️ AI Detective</option>
                  <option value="AI Art Mystery">🎨 AI Art Mystery</option>
                  <option value="Hidden AI">🔍 Hidden AI</option>
                  <option value="AI vs Human">🎭 AI vs Human</option>
                  <option value="Prompt Master">💬 Prompt Master</option>
                  <option value="Logic Lab">🌡️ Logic Lab</option>
                  <option value="AI Challenge">🛡️ AI Challenge</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Required Unlock cost (Cookies)</label>
                <input
                  type="number"
                  value={activePuzPack.costXP}
                  onChange={(e) => setActivePuzPack({ ...activePuzPack, costXP: Number(e.target.value) })}
                  className="w-full text-xs font-bold p-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Award Cookies Completion</label>
                <input
                  type="number"
                  value={activePuzPack.xpReward}
                  onChange={(e) => setActivePuzPack({ ...activePuzPack, xpReward: Number(e.target.value) })}
                  className="w-full text-xs font-bold p-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Unlock Badge Title</label>
                <input
                  type="text"
                  value={activePuzPack.badgeReward || ''}
                  onChange={(e) => setActivePuzPack({ ...activePuzPack, badgeReward: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-slate-200 rounded-lg"
                  placeholder="Master Artist"
                />
              </div>
            </div>

            {/* Chest / Treasure Node Configuration section */}
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <span className="bg-amber-500 text-white p-1 rounded-md text-[10px]">🎁</span>
                Secret Treasure Vault & Chest Configuration
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold">
                This puzzle pack can act as a decryptable Secret Treasure Vault or Chest. Link it to a learning unit / module and specify a custom image URL if desired.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Column 1: URL Input & Presets */}
                <div className="space-y-1 text-left">
                  <label className="font-bold text-amber-900">Chest Image URL</label>
                  <input 
                    type="text"
                    value={activePuzPack.chest_image_url || activePuzPack.chestImageUrl || activePuzPack.chest_icon_url || activePuzPack.chestIconUrl || ''}
                    onChange={(e) => setActivePuzPack({ 
                      ...activePuzPack, 
                      chest_image_url: e.target.value,
                      chestImageUrl: e.target.value,
                      chest_icon_url: e.target.value,
                      chestIconUrl: e.target.value
                    })}
                    placeholder="e.g. https://images.unsplash.com/... or relative path"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 font-sans"
                  />
                  <div className="flex gap-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => setActivePuzPack({ 
                        ...activePuzPack, 
                        chest_image_url: 'https://i.postimg.cc/bvpyTJh1/Chest.webp',
                        chestImageUrl: 'https://i.postimg.cc/bvpyTJh1/Chest.webp',
                        chest_icon_url: 'https://i.postimg.cc/bvpyTJh1/Chest.webp',
                        chestIconUrl: 'https://i.postimg.cc/bvpyTJh1/Chest.webp'
                      })}
                      className="text-[9px] bg-white border border-slate-200 hover:bg-slate-50 px-2 py-0.5 rounded text-slate-600 font-bold cursor-pointer"
                    >
                      Preset Gold
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePuzPack({ 
                        ...activePuzPack, 
                        chest_image_url: '',
                        chestImageUrl: '',
                        chest_icon_url: '',
                        chestIconUrl: ''
                      })}
                      className="text-[9px] bg-white border border-slate-200 hover:bg-slate-50 px-2 py-0.5 rounded text-slate-600 font-bold cursor-pointer"
                    >
                      Reset Default
                    </button>
                  </div>
                </div>

                {/* Column 2: Live Preview */}
                <div className="space-y-1 text-left flex flex-col justify-center items-center bg-white/40 border border-amber-100 p-2 rounded-xl">
                  <span className="text-[9px] font-bold text-amber-900 uppercase tracking-wider mb-1">Live Chest Preview</span>
                  <div className="relative w-20 h-20 flex items-center justify-center bg-white border border-dashed border-amber-200 rounded-xl overflow-hidden shadow-xs">
                    {(activePuzPack.chest_image_url || activePuzPack.chestImageUrl || activePuzPack.chest_icon_url || activePuzPack.chestIconUrl) ? (
                      <img 
                        src={activePuzPack.chest_image_url || activePuzPack.chestImageUrl || activePuzPack.chest_icon_url || activePuzPack.chestIconUrl} 
                        alt="Chest Live Preview" 
                        className="w-16 h-16 object-contain transition-transform duration-300 filter drop-shadow-[0_4px_8px_rgba(234,179,8,0.25)] hover:scale-110"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://i.postimg.cc/bvpyTJh1/Chest.webp';
                        }}
                      />
                    ) : (
                      <div className="text-center p-1">
                        <Gift className="w-6 h-6 text-amber-500 mx-auto mb-1 animate-pulse" />
                        <span className="text-[9px] font-bold text-slate-400">Default Chest</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 3: Linked learning unit */}
                <div className="space-y-1 text-left">
                  <label className="font-bold text-amber-900">Linked Learning Unit (Module)</label>
                  <select 
                    value={activePuzPack.linked_unit_id || activePuzPack.linkedUnitId || ''}
                    onChange={(e) => setActivePuzPack({ ...activePuzPack, linked_unit_id: e.target.value, linkedUnitId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                  >
                    <option value="">None / Not Linked</option>
                    {[...AI_CURRICULUM, ...PRACTICE_CURRICULUM].map(m => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ✨ AI ASSISTANT AUTOGENERATOR DOCK (PUZZLES) */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-600 text-white p-1.5 rounded-lg">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-purple-950 uppercase tracking-wide">Gemini Puzzles Builder</h4>
                    <p className="text-[10px] text-slate-500 font-semibold">Instantly generate high-quality, non-repetitive scenario or logic puzzles with Gemini.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500">Count:</span>
                  <select
                    value={aiCountInput}
                    onChange={(e) => setAiCountInput(Number(e.target.value))}
                    className="p-1 text-[11px] font-black border border-slate-250 bg-white rounded-md font-mono"
                  >
                    <option value="3">3</option>
                    <option value="5">5</option>
                    <option value="8">8</option>
                    <option value="10">10</option>
                  </select>
                </div>
              </div>

              {aiError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-[11px] p-2 rounded-lg font-semibold flex items-center gap-1.5 animate-bounce">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-purple-500 font-mono">TOPIC:</span>
                  <input
                    type="text"
                    value={aiTopicInput || activePuzPack.title}
                    onChange={(e) => setAiTopicInput(e.target.value)}
                    placeholder="Enter puzzle topic/mystery focus..."
                    className="w-full text-xs pl-14 pr-3 py-2 bg-white border border-slate-200 rounded-xl font-bold outline-hidden focus:border-purple-400 focus:bg-white transition-all text-purple-950"
                  />
                </div>
                <button
                  onClick={() => handleAIGenerateSystem('puzzles', aiTopicInput || activePuzPack.title)}
                  disabled={isGeneratingAI}
                  className="bg-purple-600 hover:bg-purple-750 disabled:bg-purple-400 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  {isGeneratingAI ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Drafting Puzzles...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} className="animate-pulse" />
                      <span>Auto-Generate with Gemini</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Question list rail */}
              <div className="md:col-span-1 space-y-2 border-r pr-4 border-slate-100 max-h-[420px] overflow-y-auto w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider">
                    Anomalous Chambers ({activePuzPack.questions.length})
                  </span>
                  <button
                    onClick={() => {
                      soundManager.play('click');
                      const copy = [...activePuzPack.questions];
                      copy.push({
                        id: `pq_${Date.now()}_idx_${copy.length}`,
                        type: 'Visual',
                        question: 'Evaluate pixel distortion details.',
                        options: ['A', 'B', 'C', 'D'],
                        correctAnswer: 'A',
                        explanation: 'Visual clue explain.',
                        logicClue: 'Look for symmetry.',
                        imageUrl: PRESET_PUZZLE_IMAGES[0].url
                      });
                      setActivePuzPack({ ...activePuzPack, questions: copy });
                      setPuzEditQuestionIndex(copy.length - 1);
                    }}
                    className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>Append</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {activePuzPack.questions.map((q, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setPuzEditQuestionIndex(idx)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                        puzEditQuestionIndex === idx 
                          ? 'border-purple-400 bg-purple-50/50 text-purple-900' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-650'
                      }`}
                    >
                      <span className="truncate pr-2">Stage {idx + 1}: {q.question}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activePuzPack.questions.length <= 1) {
                            alert('Visual files require at least 1 image.');
                            return;
                          }
                          soundManager.play('incorrect');
                          const copy = activePuzPack.questions.filter((_, qIdx) => qIdx !== idx);
                          setActivePuzPack({ ...activePuzPack, questions: copy });
                          setPuzEditQuestionIndex(0);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graphic Editor with blur simulator uploader */}
              <div className="md:col-span-2 space-y-4 bg-slate-25/50 border border-slate-150 p-5 rounded-2.5xl text-xs w-full">
                {puzEditQuestionIndex !== null && activePuzPack.questions[puzEditQuestionIndex] ? (() => {
                  const qItem = activePuzPack.questions[puzEditQuestionIndex];
                  const setQValue = (field: string, val: any) => {
                    const questionsCopy = [...activePuzPack.questions];
                    questionsCopy[puzEditQuestionIndex] = {
                      ...qItem,
                      [field]: val
                    };
                    setActivePuzPack({ ...activePuzPack, questions: questionsCopy });
                  };

                  return (
                    <div className="space-y-4">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase text-purple-650 font-mono">
                          STAGE RECONNAISSANCE ASSIGNMENT #{puzEditQuestionIndex + 1}
                        </span>

                        <select
                          value={qItem.type || 'Visual'}
                          onChange={(e: any) => setQValue('type', e.target.value)}
                          className="p-1 font-bold bg-white border border-slate-200 rounded text-[11px]"
                        >
                          <option value="Visual">Guess the AI Tool (Blurred/Cropped)</option>
                          <option value="Logic">AI Image Detective</option>
                          <option value="Scenario">Prompt Mystery</option>
                        </select>
                      </div>

                      {/* Visual Live Scope Preview with CSS slider */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="font-extrabold text-slate-700 block">Specimen image URL</label>
                          <input
                            type="text"
                            value={qItem.imageUrl || ''}
                            onChange={(e) => setQValue('imageUrl', e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                            placeholder="https://images.unsplash..."
                          />

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Or Select from high-contrast presets:</span>
                            <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto">
                              {PRESET_PUZZLE_IMAGES.map((preset, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    soundManager.play('click');
                                    setQValue('imageUrl', preset.url);
                                  }}
                                  className="p-1 border border-slate-200 hover:border-purple-400 rounded-lg text-[9.5px] bg-white font-semibold text-left truncate"
                                >
                                  {preset.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* LIVE PREVIEW SHIELD WITH EXPERIMENTAL FILTERS */}
                        <div className="relative h-40 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-2 group">
                          {qItem.imageUrl ? (
                            <img 
                              src={qItem.imageUrl} 
                              alt="Sleuth Scope" 
                              className="w-full h-full object-cover transition-all"
                              style={{ 
                                filter: activePuzPack.category === 'AI Art Mystery' ? 'none' : 'blur(8px)',
                                transform: activePuzPack.category === 'Hidden AI' ? 'scale(2.5)' : 'none'
                              }}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-slate-500 font-bold">No image loaded</span>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-[8.5px] font-black text-white bg-slate-900 border border-slate-700/50 px-2 py-0.5 rounded uppercase font-mono">
                              Simulation Radar View
                            </span>
                          </div>
                          <span className="absolute bottom-1 right-2.5 text-[8.5px] font-mono text-purple-400 font-bold bg-slate-900 px-1 py-0.5 rounded select-none">
                            {activePuzPack.category} mode
                          </span>
                        </div>
                      </div>

                      {/* Question Detail */}
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-700">Audit Challenge Question text</label>
                        <input
                          type="text"
                          value={qItem.question}
                          onChange={(e) => setQValue('question', e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-semibold"
                        />
                      </div>

                      {/* Options */}
                      <div className="space-y-2">
                        <label className="font-extrabold text-slate-700 block">MCQ answers</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(qItem.options || []).map((opt, oIdx) => (
                            <div key={`mcq-opt-${qItem.id || 'arena'}-${oIdx}`} className="flex items-center gap-1 bg-white p-1.5 border border-slate-200 rounded-lg">
                              <span className="text-slate-400 font-mono font-bold">{String.fromCharCode(65 + oIdx)})</span>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const optCopy = [...qItem.options];
                                  optCopy[oIdx] = e.target.value;
                                  setQValue('options', optCopy);
                                }}
                                className="flex-1 bg-transparent pr-1 font-bold text-[11px]"
                              />
                              <button
                                onClick={() => setQValue('correctAnswer', opt)}
                                className={`text-[9px] font-black uppercase px-2 py-1 rounded ${
                                  opt === qItem.correctAnswer ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                Match
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Hints Clues */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-700">Investigating Clue (Clue button hint)</label>
                          <input
                            type="text"
                            value={qItem.logicClue || ''}
                            onChange={(e) => setQValue('logicClue', e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-700">Detailed Verdict explanation</label>
                          <input
                            type="text"
                            value={qItem.explanation}
                            onChange={(e) => setQValue('explanation', e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>

                    </div>
                  );
                })() : (
                  <p className="text-slate-400 text-center font-bold">Select a target Specimen level index.</p>
                )}
              </div>

            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <button
                onClick={() => { setIsEditingPuz(false); soundManager.play('click'); }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-black text-xs px-5 py-3 rounded-xl cursor-pointer"
              >
                Discard Specimen
              </button>
              <button
                onClick={handleSavePuzzlePack}
                className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-6 py-3 rounded-xl flex items-center gap-1 px-4 shadow-md cursor-pointer"
              >
                <Save size={13} />
                <span>Save visual puzzle pack</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== SCREEN F: DOCK EDITOR (BATTLES) ==================== */}
        {isEditingBat && activeBatPool && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 text-left">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-black text-rose-600 uppercase font-mono">🚀 Battle Speed Duals</span>
                <input
                  type="text"
                  value={activeBatPool.topic}
                  onChange={(e) => setActiveBatPool({ ...activeBatPool, topic: e.target.value })}
                  placeholder="Pool Topic Matchmaking..."
                  className="font-black text-lg text-slate-800 outline-hidden border-b border-transparent focus:border-slate-300 w-full mt-1"
                />
              </div>
              <button
                onClick={() => { setIsEditingBat(false); soundManager.play('click'); }}
                className="text-xs font-black uppercase text-slate-400 hover:text-slate-600"
              >
                Cancel Setup
              </button>
            </div>

            {/* ✨ AI ASSISTANT AUTOGENERATOR DOCK (BATTLES) */}
            <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-2xl border border-rose-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-rose-600 text-white p-1.5 rounded-lg">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-rose-950 uppercase tracking-wide">Gemini Speed Duel Matchmaker</h4>
                    <p className="text-[10px] text-slate-500 font-semibold">Instantly generate high-octane, speed-optimized MCQ questions for battles with Gemini.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500">Count:</span>
                  <select
                    value={aiCountInput}
                    onChange={(e) => setAiCountInput(Number(e.target.value))}
                    className="p-1 text-[11px] font-black border border-slate-250 bg-white rounded-md font-mono"
                  >
                    <option value="3">3</option>
                    <option value="5">5</option>
                    <option value="8">8</option>
                    <option value="10">10</option>
                  </select>
                </div>
              </div>

              {aiError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-[11px] p-2 rounded-lg font-semibold flex items-center gap-1.5 animate-bounce">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-rose-500 font-mono">TOPIC:</span>
                  <input
                    type="text"
                    value={aiTopicInput || activeBatPool.topic}
                    onChange={(e) => setAiTopicInput(e.target.value)}
                    placeholder="Enter battle arena focus topic..."
                    className="w-full text-xs pl-14 pr-3 py-2 bg-white border border-slate-200 rounded-xl font-bold outline-hidden focus:border-rose-400 focus:bg-white transition-all text-rose-950"
                  />
                </div>
                <button
                  onClick={() => handleAIGenerateSystem('battles', aiTopicInput || activeBatPool.topic)}
                  disabled={isGeneratingAI}
                  className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  {isGeneratingAI ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Drafting Speed Duals...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} className="animate-pulse" />
                      <span>Auto-Generate with Gemini</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Question list rail */}
              <div className="md:col-span-1 space-y-2 border-r pr-4 border-slate-100 max-h-[420px] overflow-y-auto w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-black text-slate-405 font-mono tracking-wider">
                    DUAL BARRAGES ({activeBatPool.questions.length})
                  </span>
                  <button
                    onClick={() => {
                      soundManager.play('click');
                      const copy = [...activeBatPool.questions];
                      copy.push({
                        id: `bq_${Date.now()}_idx_${copy.length}`,
                        question: 'What is 10 + 20?',
                        options: ['30', '40', '50', '60'],
                        correctAnswer: '30',
                        explanation: 'Arithmetic calculation.'
                      });
                      setActiveBatPool({ ...activeBatPool, questions: copy });
                      setBatEditQuestionIndex(copy.length - 1);
                    }}
                    className="text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>Append</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {activeBatPool.questions.map((q, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setBatEditQuestionIndex(idx)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                        batEditQuestionIndex === idx 
                          ? 'border-rose-450 bg-rose-50/50 text-rose-900' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-650'
                      }`}
                    >
                      <span className="truncate pr-2">Q{idx + 1}: {q.question}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeBatPool.questions.length <= 1) {
                            alert('Pool require at least 1 battle query.');
                            return;
                          }
                          soundManager.play('incorrect');
                          const copy = activeBatPool.questions.filter((_, qIdx) => qIdx !== idx);
                          setActiveBatPool({ ...activeBatPool, questions: copy });
                          setBatEditQuestionIndex(0);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fast question detail */}
              <div className="md:col-span-2 space-y-4 bg-slate-25/50 border border-slate-150 p-5 rounded-2.5xl text-xs w-full">
                {batEditQuestionIndex !== null && activeBatPool.questions[batEditQuestionIndex] ? (() => {
                  const qItem = activeBatPool.questions[batEditQuestionIndex];
                  const setQValue = (field: string, val: any) => {
                    const questionsCopy = [...activeBatPool.questions];
                    questionsCopy[batEditQuestionIndex] = {
                      ...qItem,
                      [field]: val
                    };
                    setActiveBatPool({ ...activeBatPool, questions: questionsCopy });
                  };

                  // Check for under-3-second visual limit
                  const isTooLong = qItem.question.length > 90 || qItem.explanation.length > 100;

                  return (
                    <div className="space-y-4">
                      
                      {isTooLong && (
                        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-amber-900 flex items-start gap-2 leading-relaxed">
                          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                          <span>
                            <strong>Combat Speed warning:</strong> This question has more than ninety characters. Keeps questions short/fast to ensure under 3s quick read.
                          </span>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-700">Question (Short & mobile friendly)</label>
                        <input
                          type="text"
                          value={qItem.question}
                          onChange={(e) => setQValue('question', e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      {/* Options */}
                      <div className="space-y-2">
                        <label className="font-extrabold text-slate-70 block">Choices (Exactly 4 short options)</label>
                        <div className="grid grid-cols-2 gap-2">
                          {qItem.options.map((opt, oIdx) => (
                            <div key={`setting-choice-${qItem.id || 'setting'}-${oIdx}`} className="flex items-center gap-1.5 bg-white p-2 border border-slate-200 rounded-lg">
                              <span className="font-mono text-rose-500 font-bold">{String.fromCharCode(65 + oIdx)})</span>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const copy = [...qItem.options];
                                  copy[oIdx] = e.target.value;
                                  setQValue('options', copy);
                                }}
                                className="flex-1 bg-transparent pr-1 font-semibold"
                              />
                              <button
                                onClick={() => setQValue('correctAnswer', opt)}
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                  opt === qItem.correctAnswer ? 'bg-rose-600 text-white' : 'bg-slate-100 hover:bg-slate-200'
                                }`}
                              >
                                Set
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-700">Quick Context Explanation</label>
                        <input
                          type="text"
                          value={qItem.explanation}
                          onChange={(e) => setQValue('explanation', e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg"
                        />
                      </div>

                    </div>
                  );
                })() : (
                  <p className="text-slate-400 text-center font-bold">Select dual question index.</p>
                )}
              </div>

            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <button
                onClick={() => { setIsEditingBat(false); soundManager.play('click'); }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-black text-xs px-5 py-3 rounded-xl cursor-pointer"
              >
                Cancel Setup
              </button>
              <button
                onClick={handleSaveBattlePool}
                className="bg-rose-600 hover:bg-rose-705 text-white font-black text-xs px-6 py-3 rounded-xl flex items-center gap-1 px-4 shadow-md cursor-pointer"
              >
                <Save size={13} />
                <span>Commit Battle Pool</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== SCREEN G: BULK IMPORTER FRAME ==================== */}
        {activeTab === 'importer' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 text-left">
            <div>
              <h3 className="text-lg font-black text-slate-900">📥 Universal CSV / JSON Bulk Importer</h3>
              <p className="text-xs text-slate-500 font-semibold">Instantly load raw files directly into active practice databases without typing manually.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Form entries */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-black text-slate-600">INPUT DECODER</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setImportFormat('json')}
                        className={`flex-1 p-2 rounded-xl text-xs font-bold border transition-all ${
                          importFormat === 'json' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        JSON Array Brackets
                      </button>
                      <button
                        onClick={() => setImportFormat('csv')}
                        className={`flex-1 p-2 rounded-xl text-xs font-bold border transition-all ${
                          importFormat === 'csv' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        CSV / Tab-Delimited text
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-slate-600">TARGET STORAGE LIBRARY</label>
                    <select
                      value={importTarget}
                      onChange={(e: any) => setImportTarget(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      <option value="challenges">⚡ Challenges Library</option>
                      <option value="puzzles">🧩 Puzzles Library</option>
                      <option value="battles">🚀 Battles Library</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-black text-slate-600 block">Copy paste raw data string below:</label>
                  <textarea
                    rows={8}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={
                      importFormat === 'json' 
                        ? '[\n  {\n    "question": "What is Deep Learning?",\n    "options": ["Neural structures", "Web server", "Database tables", "Gears"],\n    "correctAnswer": "Neural structures",\n    "explanation": "Deep learning mimics brain neurons."\n  }\n]'
                        : 'question,option_a,option_b,option_c,option_d,correctAnswer,explanation\n"What is Claude AI?","Anthropic LLM","Search Engine","Clock","Game", "Anthropic LLM","Claude is developed by Anthropic."'
                    }
                    className="w-full font-mono text-[11px] p-3 border border-slate-200/90 rounded-2xl outline-hidden focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={handleBulkImport}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
                >
                  <CheckCircle size={14} />
                  <span>Parse & Build Questions</span>
                </button>
              </div>

              {/* Informative instructions side */}
              <div className="space-y-4 bg-slate-50 p-5 rounded-2.5xl text-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5 uppercase font-mono text-emerald-700">
                    <FileSpreadsheet size={14} />
                    Import Payload Rules
                  </h4>
                  
                  <div className="space-y-2 border-l-2 border-emerald-500 pl-3 leading-relaxed text-slate-600">
                    <p><strong>Option arrays:</strong> If CSV does not define individual columns, the parser automatically splits options by pipes, e.g. <code>Alpha|Beta|Gamma|Delta</code>.</p>
                    <p><strong>Correct Answer:</strong> Must match exactly one of the options you typed.</p>
                    <p>No technical coding or database expertise required! All changes update in real-time, sandbox-persistent in active practice mode.</p>
                  </div>
                </div>

                {importLog && (
                  <div className="bg-emerald-900 text-emerald-100 p-4 rounded-2xl font-mono text-[11px] mt-4 border border-emerald-800 leading-normal">
                    {importLog}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ==================== SCREEN H: LIVE ANALYTICS ==================== */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 text-left">
            <div>
              <h3 className="text-lg font-black text-slate-900">📊 Diagnostic & Playback Analytics</h3>
              <p className="text-xs text-slate-500 font-semibold">Monitor diagnostic metrics, completion curves, and question-level error vectors.</p>
            </div>

            {/* Micro Dashboard grids */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-indigo-50/50 p-4 border border-indigo-100 rounded-2.5xl space-y-1">
                <span className="text-[10px] text-indigo-900 font-black tracking-wider uppercase font-mono block">Challenges Pack</span>
                <span className="text-2xl font-black text-indigo-755 font-mono block">{analyticsData.totalChallenges}</span>
                <span className="text-[9px] text-slate-400 font-semibold">{analyticsData.avgQuestionsChallenge} Average MCQ/Pack</span>
              </div>
              <div className="bg-purple-50/50 p-4 border border-purple-100 rounded-2.5xl space-y-1">
                <span className="text-[10px] text-purple-900 font-black tracking-wider uppercase font-mono block">Puzzle Specimens</span>
                <span className="text-2xl font-black text-purple-755 font-mono block">{analyticsData.totalPuzzles}</span>
                <span className="text-[9px] text-indigo-400 font-semibold">{analyticsData.completionRatePuzzles}% Completion</span>
              </div>
              <div className="bg-rose-50/50 p-4 border border-rose-100 rounded-2.5xl space-y-1">
                <span className="text-[10px] text-rose-900 font-black tracking-wider uppercase font-mono block">Battle Speedrun</span>
                <span className="text-2xl font-black text-rose-755 font-mono block">{analyticsData.totalBattles}</span>
                <span className="text-[9px] text-slate-400 font-semibold">Consistent 4-Choice Limit</span>
              </div>
              <div className="bg-emerald-50/50 p-4 border border-emerald-150 rounded-2.5xl space-y-1">
                <span className="text-[10px] text-emerald-900 font-black tracking-wider uppercase font-mono block">Mean Accuracy</span>
                <span className="text-2xl font-black text-emerald-755 font-mono block">{analyticsData.accuracyBattles}%</span>
                <span className="text-[9px] text-slate-400 font-semibold">66 Correct Answers logged</span>
              </div>
            </div>

            {/* High level visual graph simulation with Tailwind bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Question Anomalies Tracker */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2.5xl text-xs space-y-4">
                <h4 className="font-black text-xs text-slate-700 uppercase tracking-wider font-mono">⚠️ Question Error Anomaly Log</h4>
                
                <div className="space-y-3">
                  {analyticsData.popularQuestions.map((item, idx) => (
                    <div key={idx} className="bg-white p-3 border border-slate-150 rounded-xl flex items-center justify-between gap-4">
                      <div className="space-y-0.5 truncate flex-1">
                        <span className="bg-slate-100 text-slate-600 font-mono text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase">{item.type}</span>
                        <p className="font-extrabold text-[11px] text-slate-800 truncate leading-none pt-1">{item.q}</p>
                      </div>
                      <div className="text-right space-y-0.5 shrink-0">
                        <span className="text-[10.5px] font-black text-slate-900 block">{item.plays} Duals</span>
                        <span className="text-[9.5px] text-indigo-600 block">{item.anomaly}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completion metrics simulated charts */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2.5xl text-xs space-y-4">
                <h4 className="font-black text-xs text-slate-700 uppercase tracking-wider font-mono">📊 System completion curve</h4>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-650">
                      <span>Challenges Packs Completion</span>
                      <span>{analyticsData.completionRateChallenges}% Completed</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${analyticsData.completionRateChallenges}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-650">
                      <span>Visual Sleuth Puzzles Completion</span>
                      <span>{analyticsData.completionRatePuzzles}% Completed</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-[#8b5cf6] rounded-full" style={{ width: `${analyticsData.completionRatePuzzles}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-650">
                      <span>Rapid-fire Battle Arena Accuracy</span>
                      <span>{analyticsData.accuracyBattles}% Avg Accuracy</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-600 rounded-full" style={{ width: `${analyticsData.accuracyBattles}%` }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
