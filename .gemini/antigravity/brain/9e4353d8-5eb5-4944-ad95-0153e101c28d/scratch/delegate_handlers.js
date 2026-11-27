const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// 1. handleDuplicateLesson (lines ~1697-1751)
code = code.replace(
  /const handleDuplicateLesson = \(moduleId: string, lesson: Lesson\) => \{[\s\S]*?selectLessonProperty\(moduleId, clonedLesson\);\s*\};/,
  'const handleDuplicateLesson = (moduleId: string, lesson: Lesson) => curriculumHook.handleDuplicateLesson(moduleId, lesson);'
);

// 2. reorderUnit & saveOrder (lines ~2310-2394)
code = code.replace(
  /\/\/ Robust unit reordering with instant state update[\s\S]*?const isOrderChanged = useMemo/,
  `const reorderUnit = (moduleId: string, direction: 'up' | 'down', e?: React.MouseEvent) => curriculumHook.reorderUnit(moduleId, direction, e);
  const moveModule = (idx: number, direction: 'up' | 'down') => {
    const visibleSpace = pendingModules.filter(isModuleInSelectedWorld);
    if (idx >= 0 && idx < visibleSpace.length) {
      reorderUnit(visibleSpace[idx].id, direction);
    }
  };
  const saveOrder = () => curriculumHook.saveOrder();

  const isOrderChanged = useMemo`
);

// 3. reorderLesson & reorderChallenge (lines ~2840-2935)
code = code.replace(
  /const reorderLesson = \(moduleId: string, lessonId: string, direction: 'up' \| 'down', e\?: React\.MouseEvent\) => \{[\s\S]*?soundManager\.play\('complete'\);\s*\};\s*const reorderChallenge = \(moduleId: string, lessonId: string, challengeId: string, direction: 'up' \| 'down', e\?: React\.MouseEvent\) => \{[\s\S]*?soundManager\.play\('complete'\);\s*\};/,
  `const reorderLesson = (moduleId: string, lessonId: string, direction: 'up' | 'down', e?: React.MouseEvent) => curriculumHook.reorderLesson(moduleId, lessonId, direction, e);
  const reorderChallenge = (moduleId: string, lessonId: string, challengeId: string, direction: 'up' | 'down', e?: React.MouseEvent) => screenHook.reorderChallenge(moduleId, lessonId, challengeId, direction, e);`
);

// 4. addUnitInstantly & addLessonInstantly (lines ~3400-3492)
code = code.replace(
  /\/\/ Instantly adds an empty container unit[\s\S]*?soundManager\.play\('complete'\);\s*\};\s*\/\/ Instantly embeds a new lesson inside the targeted unit[\s\S]*?soundManager\.play\('complete'\);\s*\};/,
  `const addUnitInstantly = (targetGroup: 'space' | 'practice') => curriculumHook.addUnitInstantly(selectedAdminWorldId, targetGroup);
  const addLessonInstantly = (moduleId: string) => curriculumHook.addLessonInstantly(moduleId);`
);

// 5. createInteractiveChallenge (lines ~3700-3752)
code = code.replace(
  /const createInteractiveChallenge = \(moduleId: string, lessonId: string, baseType: ChallengeType = 'tap_right_answer'\) => \{[\s\S]*?soundManager\.play\('complete'\);\s*\};/,
  `const createInteractiveChallenge = (moduleId: string, lessonId: string, baseType?: ChallengeType) => screenHook.handleCreateChallenge();`
);

// 6. handleSaveModuleEdits (lines ~3830-3882)
code = code.replace(
  /const handleSaveModuleEdits = async \(e\?: React\.FormEvent\) => \{[\s\S]*?soundManager\.play\('incorrect'\);\s*\}\s*\};/,
  `const handleSaveModuleEdits = (e?: React.FormEvent) => curriculumHook.handleSaveModuleEdits(e);`
);

// 7. handleCreateModule & handleDeleteModule (lines ~4270-4370)
code = code.replace(
  /\/\/ 1\. CREATE MODULE \(AI OR PRACTICE\)[\s\S]*?setSelectedModuleId\(''\);\s*setSelectedLessonId\(''\);\s*\}\s*\}\s*\);\s*\};/,
  `const handleCreateModule = (e: React.FormEvent) => curriculumHook.handleSaveModuleEdits(e);
  const handleDeleteModule = (id: string, e?: React.MouseEvent) => curriculumHook.handleDeleteModule(id, e);`
);

// 8. handleDeleteLesson (lines ~4460-4595)
code = code.replace(
  /\/\/ 3\. DELETE LESSON[\s\S]*?setSelectedLessonId\(''\);\s*\}\s*\}\s*\);\s*\};/,
  `const handleDeleteLesson = (moduleId: string, lessonId: string, e?: React.MouseEvent) => curriculumHook.handleDeleteLesson(moduleId, lessonId, e);`
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('Script completed.');
