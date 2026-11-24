import { Challenge } from './content';

/**
 * Dynamically generates 15 visual, interactive, mobile-friendly,
 * and dopamine-driven challenges, tailored to study-topic coordinates, completely free of any AI teaching content!
 */
export function getFifteenPremiumChallenges(lessonId: string, lessonTitle: string): Challenge[] {
  const normalizedId = lessonId.toLowerCase().trim();
  const normalizedTitle = lessonTitle.toLowerCase().trim();

  // Determine topic
  let topic = "General Science Curiosity";
  let topicEmoji = "🌿";
  let topicImageUrl = "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop";

  if (normalizedTitle.includes('comet') || normalizedTitle.includes('space') || normalizedId.includes('l1.1')) {
    topic = "Comets & Stardust";
    topicEmoji = "☄️";
    topicImageUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop";
  } else if (normalizedTitle.includes('mars') || normalizedId.includes('l1.2')) {
    topic = "The Red Planet Mars";
    topicEmoji = "🪐";
    topicImageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop";
  } else if (normalizedTitle.includes('eclipse') || normalizedId.includes('l1.3')) {
    topic = "Solar Shadow Eclipses";
    topicEmoji = "☀️";
    topicImageUrl = "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=600&auto=format&fit=crop";
  } else if (normalizedTitle.includes('star') || normalizedId.includes('l1.4')) {
    topic = "Star Time-Travel";
    topicEmoji = "🔭";
    topicImageUrl = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop";
  } else if (normalizedTitle.includes('photosynthesis') || normalizedTitle.includes('leaf') || normalizedId.includes('l2.1')) {
    topic = "Photosynthesis Powerhouse";
    topicEmoji = "🧬";
    topicImageUrl = "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop";
  } else if (normalizedTitle.includes('volcano') || normalizedId.includes('l2.2')) {
    topic = "Volcanic Magma Boilers";
    topicEmoji = "🌋";
    topicImageUrl = "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=600&auto=format&fit=crop";
  }

  const prefix = `pc_${normalizedId}_`;

  const originalChallenges: Challenge[] = [
    // 1. Image Reveal (Explorer Mystery)
    {
      id: `${prefix}img_reveal`,
      type: 'image_reveal' as any,
      question: `${topicEmoji} Mystery Image Reveal!`,
      imageUrl: topicImageUrl,
      options: getImageRevealOptions(topic),
      correctAnswer: getImageRevealAnswer(topic),
      explanation: getKidExplanation(topic, "Mystery Image Revealed!"),
      xpValue: 5
    },

    // 2. Truth Audit (Analyze the fact cards)
    {
      id: `${prefix}ai_vs_human`,
      type: 'ai_vs_human' as any,
      question: `🔍 Detective Challenge: Pick the scientifically TRUE card about our planet!`,
      outputs: [
        {
          id: "opt_human",
          title: "Card A: Fake Theory",
          text: getFakeOptionText(topic),
          authorLabel: "Imaginary Fact",
          isAI: false,
          emojis: "✍️🌀"
        },
        {
          id: "opt_ai",
          title: "Card B: True Science",
          text: getRealOptionText(topic),
          authorLabel: "Scientific Fact",
          isAI: true,
          emojis: "⚡🔭"
        }
      ],
      correctAnswer: "opt_ai",
      explanation: getKidExplanation(topic, "True Science Spotted!"),
      xpValue: 5
    },

    // 3. Tap Correct Area (Visual hotspot)
    {
      id: `${prefix}tap_area`,
      type: 'tap_correct_area' as any,
      question: `🎯 Target Finder: Pinpoint the core anomaly in our visual observatory map!`,
      imageUrl: topicImageUrl,
      hotspots: [
        {
          id: "spot_normal",
          label: "[A]: Normal Star Dust",
          topPct: 10,
          leftPct: 20,
          widthPct: 25,
          heightPct: 25,
          isCorrectSpot: false,
          explanation: "That is just background atmosphere scattering. Try again!"
        },
        {
          id: "spot_bug",
          label: "[B]: Solar Magnetic Loop",
          topPct: 45,
          leftPct: 35,
          widthPct: 30,
          heightPct: 30,
          isCorrectSpot: true,
          explanation: "Magnificent spotting! This plasma loop stretches thousands of miles from the corona!"
        },
        {
          id: "spot_shadow",
          label: "[C]: Normal Soil Bed",
          topPct: 70,
          leftPct: 75,
          widthPct: 20,
          heightPct: 25,
          isCorrectSpot: false,
          explanation: "Standard sand particles. Look for the energy hotspots!"
        }
      ],
      correctAnswer: "spot_bug",
      explanation: getKidExplanation(topic, "Solar Energy Target Ticked!"),
      xpValue: 5
    },

    // 4. Memory Flip Cards
    {
      id: `${prefix}mem_flip`,
      type: 'memory_flip_cards' as any,
      question: `🧠 Matchup Game: Connect matching science concepts and details!`,
      cards: getMemoryCards(topic),
      explanation: getKidExplanation(topic, "Excellent Concept Map!"),
      xpValue: 5
    },

    // 5. Emoji Concepts
    {
      id: `${prefix}emoji_concept`,
      type: 'emoji_concepts' as any,
      question: `🧩 Decoder Game: Translate this cosmic-nature riddle into its scientific term!`,
      emojiClue: getTopicEmojiClue(topic),
      options: getEmojiOptions(topic),
      correctAnswer: getEmojiAnswer(topic),
      explanation: getKidExplanation(topic, "Brilliant Decoded Target!"),
      xpValue: 5
    },

    // 6. Science Fact Check
    {
      id: `${prefix}fact_check_mid`,
      type: 'tap_right_answer' as any,
      question: `⚡ Quick Check: What drives the main phenomenon behind ${topic}?`,
      options: [
        `✨ Natural energy principles governing ${topic}`,
        "🌀 Magic spells from wizard books",
        "⚙️ Mechanical clock gears in the sky",
        "🎨 Random paints falling from space"
      ],
      correctAnswer: `✨ Natural energy principles governing ${topic}`,
      explanation: getKidExplanation(topic, "Core Principle Verified!"),
      xpValue: 5
    },

    // 7. Fact Check Game (Spot the Science)
    {
      id: `${prefix}spot_expanded`,
      type: 'spot_the_ai' as any,
      question: `👾 True Fact Auditor: Audit and tap all cards that are scientifically CORRECT statements:`,
      items: getTopicSpotItems(topic),
      explanation: getKidExplanation(topic, "Superb Scientific Auditor!"),
      xpValue: 5
    },

    // 8. Tap Right Answer
    {
      id: `${prefix}mcq_visual`,
      type: 'tap_right_answer' as any,
      question: `${topicEmoji} ${getTopicMCQQuestion(topic)}`,
      options: getTopicMCQOptions(topic),
      correctAnswer: getTopicMCQAnswer(topic),
      explanation: getKidExplanation(topic, "Incredible Question Solved!"),
      xpValue: 5
    },

    // 9. Category Triage (Drag & Drop)
    {
      id: `${prefix}drag_visual`,
      type: 'drag_and_drop' as any,
      question: `📥 Drag these active variables into their correct chemical or cosmic buckets:`,
      buckets: getTopicDragBuckets(topic),
      items: getTopicDragItems(topic),
      explanation: getKidExplanation(topic, "Splendid Category Sorter!"),
      xpValue: 5
    },

    // 10. Match Pairs
    {
      id: `${prefix}match_visual`,
      type: 'match_pairs' as any,
      question: `🔗 Connect Emojis & Metaphors: Match each category with its corresponding physical analogy:`,
      pairs: getTopicPairs(topic),
      explanation: getKidExplanation(topic, "Wonderful Analogy Matchmaker!"),
      xpValue: 5
    },

    // 11. Sort Sequence (Step-by-step chronology)
    {
      id: `${prefix}sort_visual`,
      type: 'sort_sequence' as any,
      question: `⏳ Chronological Sorter: Order the processing stages of this scientific phenomenon correctly:`,
      steps: getTopicSortSteps(topic),
      correctOrder: getTopicSortOrder(topic),
      explanation: getKidExplanation(topic, "Flawless Sequence Arranged!"),
      xpValue: 5
    },

    // 12. chip Builder
    {
      id: `${prefix}build_visual`,
      type: 'build_concept' as any,
      question: `🧱 chip Builder: Assemble these chips into the core scientific formula of ${topic}:`,
      targetSentence: getTopicBuildTarget(topic),
      chipsCorrect: getTopicBuildChips(topic),
      chipsDistractor: getTopicBuildDistractors(topic),
      explanation: getKidExplanation(topic, "Flawless chip Assembler!"),
      xpValue: 5
    },

    // 13. Science vs Myths
    {
      id: `${prefix}spot_double`,
      type: 'spot_the_ai' as any,
      question: `🔮 Reality Audit: Identify all synthetic or completely fake space myths:`,
      items: getTopicFakeFactsItems(topic),
      explanation: getKidExplanation(topic, "Astute Myth Buster!"),
      xpValue: 5
    },

    // 14. Speed MCQ
    {
      id: `${prefix}mcq_bonus`,
      type: 'tap_right_answer' as any,
      question: `🚀 Speed Booster: What celestial body governs all lunar tides on Earth?`,
      options: ["🌊 Gravity of our orbiting Moon", "🔧 Human submarine engines", "💾 Metal compass rocks", "🕒 The high rotations of Saturn"],
      correctAnswer: "🌊 Gravity of our orbiting Moon",
      explanation: getKidExplanation(topic, "Solar Speed Master!"),
      xpValue: 5
    },

    // 15. Final Mastery Synthesis
    {
      id: `${prefix}final_mastery`,
      type: 'tap_right_answer' as any,
      question: `🎓 Final Mastery: What is the most important takeaway about ${topic}?`,
      options: [
        `🌟 ${topic} follows observable scientific patterns in our universe`,
        "💤 It only happens when people are sleeping",
        "🔒 It is a secret locked in an underground vault",
        "🎈 It is lighter than air and floats away"
      ],
      correctAnswer: `🌟 ${topic} follows observable scientific patterns in our universe`,
      explanation: getKidExplanation(topic, "Lesson Concept Mastered!"),
      xpValue: 5
    }
  ];

  // Substitute 5 of the original challenges with 5 creative practical AI-use challenge types
  // This deterministic map ensures we maintain a perfect 70/30 balance (10 items vs 5 items)
  // We use char-codes from normalizedId to decide WHICH 5 of the 14 AI-screen generators we render for this lesson.
  const lessonHash = normalizedId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const aiChallengePool = [
    getAIToolPicker(prefix, topic),
    getPromptBattle(prefix, topic),
    getBeforeAfterAI(prefix, topic),
    getAIForSchool(prefix, topic),
    getToolMatch(prefix),
    getResultRanker(prefix, topic),
    getPromptFixer(prefix, topic),
    getAIMythFact(prefix, topic),
    getStudentMission(prefix, topic),
    getDailyLifeAI(prefix, topic),
    getAIPrediction(prefix, topic),
    getWhichOutputBetter(prefix, topic),
    getAIAssistantBuilder(prefix, topic),
    getHiddenAI(prefix, topic)
  ];

  // Pick 5 unique AI challenges deterministically for this lesson
  const chosenAIChallenges: Challenge[] = [];
  for (let i = 0; i < 5; i++) {
    const aiIndex = (lessonHash + i * 3) % aiChallengePool.length;
    // ensure unique choice if possible
    let finalIdx = aiIndex;
    let attempts = 0;
    while (chosenAIChallenges.some(c => c.type === aiChallengePool[finalIdx].type) && attempts < aiChallengePool.length) {
      finalIdx = (finalIdx + 1) % aiChallengePool.length;
      attempts++;
    }
    chosenAIChallenges.push(aiChallengePool[finalIdx]);
  }

  // Swap original indices: 2, 4, 6, 9, 12 (5 items out of 15)
  const swapIndices = [2, 4, 6, 9, 12];
  const finalChallenges = [...originalChallenges];
  
  for (let i = 0; i < swapIndices.length; i++) {
    const targetIdx = swapIndices[i];
    finalChallenges[targetIdx] = chosenAIChallenges[i];
  }

  return finalChallenges;
}

// ==========================================
// 14 BRAND NEW PRACTICAL AI USE SCREEN GENERATORS
// ==========================================

function getAIToolPicker(prefix: string, topic: string): Challenge {
  return {
    id: `${prefix}ai_tool_picker`,
    type: 'ai_tool_picker' as any,
    question: "Select the best AI tool helper!",
    toolPicker: {
      situation: `You want to write a funny cartoon comic strip set on ${topic} to present in school tomorrow. Which tool would write scripts and draw the scenes?`,
      tools: [
        {
          id: "t_img",
          name: "Midjourney / DALL-E AI",
          emoji: "🎨",
          description: "Visual Scene Generator",
          whyCorrect: "Perfect! Generative art models excel at creating completely original visual panels representing Mars dunes or leaf cells instantly.",
          isCorrect: true
        },
        {
          id: "t_calc",
          name: "WolframAlpha Engine",
          emoji: "🔢",
          description: "Calculations & Physics",
          whyCorrect: "A high-powered calculator doesn't build drawings or cartoon text. It only returns complex math!",
          isCorrect: false
        }
      ]
    },
    xpValue: 5
  };
}

function getPromptBattle(prefix: string, topic: string): Challenge {
  return {
    id: `${prefix}prompt_battle`,
    type: 'prompt_battle' as any,
    question: "Predict which prompt wins the battle!",
    promptBattle: {
      promptA: `Explain how ${topic} works.`,
      promptB: `Explain the process of ${topic} to a 5th grader. Use a fun household kitchen analogy and list the key ingredients as raw bullet points formatting.`,
      whyA: "Prompt A is highly vague and simple. It will return a very dry, generic, textbook essay.",
      whyB: "Prompt B specifies a clear audience (5th grader), requests a cooking comparison (kitchen analogy), and defines a custom layout (bullet points)!",
      outcomeA: "A long textbook summary on plants / solar physics that is hard for kids to memorize.",
      outcomeB: "Chloroplast Bakeries! Leaves acting like small chefs baking sugar cookies on солнечный ovens. Perfect and memorable!",
      correctAnswer: "B"
    },
    xpValue: 5
  };
}

function getBeforeAfterAI(prefix: string, topic: string): Challenge {
  return {
    id: `${prefix}before_after_ai`,
    type: 'before_after_ai' as any,
    question: "Reflect on how AI optimizes work methods!",
    beforeAfterAi: {
      situation: `A group of students is designing 10 custom slide graphics representing ${topic} for a school biology fair.`,
      beforeLabel: "Traditional Manual Drawing",
      beforeContent: "Opening drawing apps, designing each layout by hand, checking scientific accuracy, saving files manually",
      beforeMetric: "⏳ 8 Hours of tedious labor",
      afterLabel: "Co-Pilot Sketching",
      afterContent: "Describing concepts to an image generator, choosing the best slides, and using vector tools to polish",
      afterMetric: "⚡ 15 Minutes!",
      question: "Which of the following is the PRIMARY benefit of utilizing AI in scientific illustrations?",
      options: [
        "It replaces learning physics completely.",
        "It eliminates the need for human teachers.",
        "It acts as a rapid multiplier, letting us iterate dozens of draft diagrams instantly.",
        "It makes the computer run faster."
      ],
      correctAnswer: "It acts as a rapid multiplier, letting us iterate dozens of draft diagrams instantly.",
      whyInsight: "AI doesn't do the thinking for us, but it boosts our velocity! We spend less hours drawing from zero and more time editing and mastering the scientific details."
    },
    xpValue: 5
  };
}

function getAIForSchool(prefix: string, topic: string): Challenge {
  return {
    id: `${prefix}ai_for_school`,
    type: 'ai_for_school' as any,
    question: "Evaluate the best AI study strategy!",
    aiForSchool: {
      scenario: `You are preparing study cards for a biology test on ${topic} tomorrow and want to evaluate your understanding.`,
      approaches: [
        {
          id: "shortcut",
          title: "The Shortcut Strategy",
          desc: "Have AI write the quiz answers and copy-paste them onto worksheets without reading.",
          emoji: "⚠️",
          isBest: false,
          feedback: "Copy-pasting bypasses the neural pathways in your brain! You get a completed sheet but failure on India exam centers."
        },
        {
          id: "active_recall",
          title: "The Active Recall Partner",
          desc: "Prompt AI to play trivia doctor. Tell it to ask you one question at a time and critique your guesses.",
          emoji: "🧠",
          isBest: true,
          feedback: "Brilliant! Prompting the model as a strict but encouraging drill practice teacher optimizes your study velocity."
        }
      ]
    },
    xpValue: 5
  };
}

function getToolMatch(prefix: string): Challenge {
  return {
    id: `${prefix}tool_match`,
    type: 'tool_match' as any,
    question: "Match AI tools with their best practical school uses!",
    toolMatch: {
      pairs: [
        { tool: "Midjourney AI", toolEmoji: "🎨", useCase: "Draft rapid cover drawings and scientific infographics" },
        { tool: "ChatGPT / Gemini", toolEmoji: "💬", useCase: "Socratic tutoring, checking grammar, and code troubleshooting" },
        { tool: "Gamma App", toolEmoji: "📊", useCase: "Auto-generating slides and school presentations from bullet points" }
      ]
    },
    xpValue: 5
  };
}

function getResultRanker(prefix: string, topic: string): Challenge {
  return {
    id: `${prefix}result_ranker`,
    type: 'result_ranker' as any,
    question: "Evaluate quality in context!",
    resultRanker: {
      prompt: `Translate the complex chemistry formula of ${topic} into a simplified rhyming poem for elementary school students.`,
      rankType: "Select the Best Answer (High Creativity & Perfect Simple Rhyming)",
      outputs: [
        {
          id: "bad_bot",
          title: "Output A: The Robotic Textbook",
          content: "Photosynthesis operates as light triggers chlorophyll conversion. Carbon plus water equals glucose chemical bonds.",
          emoji: "🤖",
          criteria: "Too dry & failed poetry",
          isCorrect: false,
          reason: "This totally ignored structural directions! It did not rhyme and sounded highly boring."
        },
        {
          id: "best_bot",
          title: "Output B: The Musical Chef",
          content: "With sunlight bright, chloroplasts bake, cooking up sweet cookies for the tree to take! Water and carbon go into the pan, making delicious sugars as fast as they can!",
          emoji: "🎵",
          criteria: "Perfect simple rhyming",
          isCorrect: true,
          reason: "Beautiful! It paired chemistry with a memorable cartoon chef metaphor and perfect rhyming structure."
        }
      ]
    },
    xpValue: 5
  };
}

function getPromptFixer(prefix: string, topic: string): Challenge {
  return {
    id: `${prefix}prompt_fixer`,
    type: 'prompt_fixer' as any,
    question: "Build an upgrade fix for the vague draft!",
    promptFixer: {
      badPrompt: `write some words on plant biology or space topic ${topic}`,
      badFeedback: "It does not define character level, length constraints, or formatting structures.",
      options: [
        {
          text: `Explain 3 key points of ${topic} to a 5th grader. Structure it as a bulleted checklist labeled with nature emojis.`,
          isCorrect: true,
          feedback: "Spot on! This introduces role play, precise output formatting, and clear tone modifiers."
        },
        {
          text: `give me plant definitions in Hindi and English.`,
          isCorrect: false,
          feedback: "Vague. While adding language is helpful, it still lacks structured constraints or grade levels."
        }
      ],
      correctAnswer: `Explain 3 key points of ${topic} to a 5th grader. Structure it as a bulleted checklist labeled with nature emojis.`,
      improvedExplanation: `Explain 3 key points of ${topic} to a 5th grader. Structure it as a bulleted checklist labeled with nature emojis.`
    },
    xpValue: 5
  };
}

function getAIMythFact(prefix: string, topic: string): Challenge {
  return {
    id: `${prefix}ai_myth_fact`,
    type: 'ai_myth_fact' as any,
    question: "Truth check: Is this common claim real?",
    aiMythFact: {
      statement: "AI models possess true conscious insights and physically observe stars or cells under laboratory microscopes.",
      isFact: false,
      context: "Complete Myth! AI models are statistical mathematics algorithms predicting logical word sequences based on text data patterns. They do not have eyes, feel organic cells, or experience active curiosity."
    },
    xpValue: 5
  };
}

function getStudentMission(prefix: string, topic: string): Challenge {
  return {
    id: `${prefix}student_mission`,
    type: 'student_mission' as any,
    question: "Deploy AI responsibly to complete your mission!",
    studentMission: {
      mission: `Your science class has been assigned a study project describing ${topic}. You want to use AI to build a high-scoring project presentation responsibly.`,
      steps: [
        {
          id: "s_cheat",
          action: "Copy-paste the prompt 'write my biology project for me' and turn in the raw text straight to the teacher.",
          feedback: "Plagiarism bypasses reading! If the teacher asks clarifying questions, you won't know the material, which leads to grades losing points.",
          isCorrect: false
        },
        {
          id: "s_study",
          action: "Use AI to outline the core 3 steps of the topic, search textbook sources to confirm accuracy, and write slides in your own words.",
          feedback: "Outstanding explorer strategy! This leverages artificial intelligence for structure and planning while verifying facts manually.",
          isCorrect: true
        }
      ]
    },
    xpValue: 5
  };
}

function getDailyLifeAI(prefix: string, topic: string): Challenge {
  return {
    id: `${prefix}daily_life_ai`,
    type: 'daily_life_ai' as any,
    question: "Spot where machine learning operates behind everyday social apps!",
    dailyLifeAi: {
      scenario: "You open your favorite video app like YouTube or Netflix and notice a series of planetary and comet space clips featured at the very top.",
      appName: "Streaming Recommendation Engines",
      appEmoji: "🎬",
      options: [
        {
          id: "manual",
          optionText: "A human engineer at Netflix manually updates your homepage dashboard every single hour.",
          isCorrect: false,
          explanation: "Impossible! Billions of humans watch clips daily. Human administrators can't make personalized feeds for everyone."
        },
        {
          id: "algo",
          optionText: "Recommendation algorithms track watch histories, calculate pattern similarities, and push videos you're likely to watch.",
          isCorrect: true,
          explanation: "Perfect! By processing billions of viewing data data points, AI matches specialized topics to your profile."
        }
      ],
      correctAnswer: "algo"
    },
    xpValue: 5
  };
}

function getAIPrediction(prefix: string, topic: string): Challenge {
  return {
    id: `${prefix}ai_prediction`,
    type: 'ai_prediction' as any,
    question: "Predict how AI behaves under pressure!",
    aiPrediction: {
      targetScenario: "You prompt a standard text writer model with a logic riddle that relies on counting, but has misleading space synonyms.",
      promptUsed: "Indian space probes found 3 ice comets. Indian astronomers destroyed one of them. Indian scientists discovered 2 more. How many Indian comets are currently in outer space?",
      choices: [
        {
          id: "p_hallucinate",
          text: "Vague models sometimes make simple math errors on logic riddles because they predict words based on common templates rather than active counting.",
          isCorrect: true,
          explanation: "Spot-on! Models don't have built-in physical calculators. They process word correlations, which means logic loops can trigger math slip-ups."
        },
        {
          id: "p_perfect",
          text: "AI models never slip up and can calculate millions of comets with 100% biological accuracy on every attempt.",
          isCorrect: false,
          explanation: "False! AI models frequently make simple arithmetic slip-ups, which is why manual verification is always crucial."
        }
      ],
      correctAnswer: "p_hallucinate"
    },
    xpValue: 5
  };
}

function getWhichOutputBetter(prefix: string, topic: string): Challenge {
  return {
    id: `${prefix}which_output_better`,
    type: 'which_output_better' as any,
    question: "Compare and critique AI output quality!",
    whichOutputBetter: {
      prompt: `Outline a simple safety guide for school students studying ${topic}.`,
      optionA: {
        title: "Model Output A (Text Outline)",
        text: "Make sure you wear safety goggles. Do not inhale dangerous volcano gases. Stay close to supervisors.",
        explanation: "Simple and clear, but lacks structural formatting or engaging text style wrappers."
      },
      optionB: {
        title: "Model Output B (Structured Alert list)",
        text: "🚨 EXTREME LAB SAFETY PROTOCOLS:\n\n1. 🥽 Goggles On: Cover eyes before heat experiments.\n2. 🌋 Gas Warning: Keep laboratory windows fully open.",
        explanation: "Contains custom headers, high-contrast alerts, descriptive emoticons, and clear safety steps!"
      },
      betterOption: "B",
      insight: "Adding clear design formatting instructions (like emojis or step numbering) generates outputs that are much easier to read!"
    },
    xpValue: 5
  };
}

function getAIAssistantBuilder(prefix: string, topic: string): Challenge {
  return {
    id: `${prefix}ai_assistant_builder`,
    type: 'ai_assistant_builder' as any,
    question: "Configure your customized study assistant!",
    aiAssistantBuilder: {
      categories: [
        {
          category: "tone",
          label: "Assistant Tone",
          emoji: "🗣️",
          items: [
            { id: "e_enthusiastic", text: "Enthusiastic Cheerleader", emoji: "🥳" },
            { id: "e_professional", text: "Strict Space Professor", emoji: "🧐" }
          ]
        },
        {
          category: "purpose",
          label: "Primary Goal",
          emoji: "🎯",
          items: [
            { id: "p_explanations", text: "Create Everyday Metaphors", emoji: "🍳" },
            { id: "p_trivia", text: "Drill Me with Speed Trivia", emoji: "⚡" }
          ]
        },
        {
          category: "subject",
          label: "Expert Area",
          emoji: "🔬",
          items: [
            { id: "s_stars", text: topic, emoji: "🔭" },
            { id: "s_code", text: "General Sciences", emoji: "🧬" }
          ]
        }
      ],
      outcomeExplanation: "Your customized AI companion has been constructed! Experiment with its custom study workflows inside the practice screen."
    },
    xpValue: 5
  };
}

function getHiddenAI(prefix: string, topic: string): Challenge {
  return {
    id: `${prefix}hidden_ai`,
    type: 'hidden_ai' as any,
    question: "Find where AI works invisibly nearby!",
    hiddenAi: {
      scene: `You walk into a modern school research laboratory studying ${topic} trends. Several high-tech devices are active.`,
      areas: [
        {
          id: "a_camera",
          label: "[📸] Smart Security Camera",
          locationText: "A camera mounted on the ceiling focuses on the entry gate.",
          techName: "Face Clustering Filter",
          description: "This camera instantly scans student faces, matches facial grid patterns, and opens gates automatically using computer vision algorithms without manual keycards.",
          isCorrectSpot: true
        },
        {
          id: "a_glass",
          label: "[🧪] Glass Test Tubes",
          locationText: "An ordinary glass test tube filled with plant chlorophyll liquid sitting on a tray.",
          techName: "Traditional Glass Tube",
          description: "This tube is made of standard glass and silica materials. It does not contain any machine learning software.",
          isCorrectSpot: false
        }
      ]
    },
    xpValue: 5
  };
}

function getKidExplanation(topic: string, resultLabel: string = "Awesome!"): string {
  let explanation = "Everyday wonder is governed by natural cosmic laws.";
  let realWorld = "Just like watching water drops condense on a cold cup of coke.";
  let funFact = "Curious kids acquire core vocabulary 3x faster through interactive play!";

  if (topic.includes("Comets")) {
    explanation = "Comets are cosmic snowballs stored in the freezer of deep dark outer space.";
    realWorld = "Like holding a snowball near a candle and watching it vaporize!";
    funFact = "A comet's dust tail can trail behind it for over 100 million kilometers!";
  } else if (topic.includes("Mars")) {
    explanation = "Mars is covered in iron dust that reacts with elements to form rust, giving it a pinkish-orange glow.";
    realWorld = "Like leaving your steel bicycle out in Pune rain until it turns orange-rusty!";
    funFact = "Mars has a giant volcano called Olympus Mons which is three times taller than Mount Everest!";
  } else if (topic.includes("Photosynthesis")) {
    explanation = "Green plant leaves use raw sunlight to split water particles and cook sweet sugars.";
    realWorld = "Like a solar-powered cookie bakery operating inside green foliage!";
    funFact = "A single large forest tree can supply breathable daily oxygen for 4 school students!";
  }

  return `✅ ${resultLabel}\n🧠 ${explanation}\n🌎 ${realWorld}\n⭐ ${funFact}`;
}

function getImageRevealOptions(topic: string): string[] {
  if (topic.includes("Comets")) return ["☄️ Ice Dust Comet Core", "🎨 Abstract Oil Canvas", "🍔 Ripe Golden Samosa", "🕒 Antique Desk Calendar"];
  if (topic.includes("Mars")) return ["🪐 Rusty Martian Dunes", "🎵 Sound Vibration Curves", "🚗 Steam Engine Valve", "🏠 Local Concrete Building"];
  return ["🌿 Photosynthesis Chloroplasts", "📂 Document Sorting Folders", "📐 Geometric Equation Tables", "🕒 Electrical Power Grid"];
}

function getImageRevealAnswer(topic: string): string {
  if (topic.includes("Comets")) return "☄️ Ice Dust Comet Core";
  if (topic.includes("Mars")) return "🪐 Rusty Martian Dunes";
  return "🌿 Photosynthesis Chloroplasts";
}

function getFakeOptionText(topic: string): string {
  if (topic.includes("Comets")) return "Comet tails are made of glowing alien neon lightbulbs powered by batteries.";
  if (topic.includes("Mars")) return "Mars looks orange-red because it is constantly covered in tomato soup.";
  return "Plants survive purely on underground soil nutrients without needing solar rays.";
}

function getRealOptionText(topic: string): string {
  if (topic.includes("Comets")) return "Comet tails form as solar heat vaporizes ice, ejecting glowing gas streams.";
  if (topic.includes("Mars")) return "Iron-rich rust dust gives Mars its characteristic rusty orange surface.";
  return "Leaves use tiny green chloroplast cells to turn sunlight into food energy.";
}

function getMemoryCards(topic: string): any[] {
  return [
    { id: "c1", pairId: "p1", content: "Sunlight ☀️", type: "concept" },
    { id: "e1", pairId: "p1", content: "Provides raw energy to leaf kitchens.", type: "example" },
    { id: "c2", pairId: "p2", content: "Gravity 🌌", type: "concept" },
    { id: "e2", pairId: "p2", content: "Keeps planetary objects locked in orbit.", type: "example" },
    { id: "c3", pairId: "p3", content: "Rust Sand 🪐", type: "concept" },
    { id: "e3", pairId: "p3", content: "Covers the dry dunes of the red planet Mars.", type: "example" }
  ];
}

function getTopicEmojiClue(topic: string): string {
  if (topic.includes("Comets")) return "☄️ + ❄️ + ☀️";
  if (topic.includes("Mars")) return "🪐 + 🛡️ + ⛰️";
  return "🍃 + ☀️ + 🧪";
}

function getEmojiOptions(topic: string): string[] {
  if (topic.includes("Comets")) return ["☄️ Frozen Comet Vaporization", "🍔 Fast Food Baking", "🕒 Digital Watch Sync"];
  if (topic.includes("Mars")) return ["🪐 Geological Rust on Mars", "📱 Contact Telephone Book", "🎵 Voice waveform curves"];
  return ["🌿 Photosynthesis Energy", "📂 File Sorting System", "📐 Algebra Geometry Lines"];
}

function getEmojiAnswer(topic: string): string {
  if (topic.includes("Comets")) return "☄️ Frozen Comet Vaporization";
  if (topic.includes("Mars")) return "🪐 Geological Rust on Mars";
  return "🌿 Photosynthesis Energy";
}

function getTopicFunFact(topic: string): string {
  if (topic.includes("Comets")) return "Comets carry ancient water ice left over from the formation of our solar system 4.6 billion years ago!";
  if (topic.includes("Mars")) return "Because Mars has less gravity than Earth, you could jump nearly three times higher there!";
  return "Plants look green because chlorophyll absorbs red and blue light waves, reflecting the green rays back!";
}

function getTopicMCQQuestion(topic: string): string {
  if (topic.includes("Comets")) return "Which cosmic force pushes a comet's tail so it always points away from the Sun?";
  if (topic.includes("Mars")) return "What is the name of the colossal Martian volcano that dwarfs Mount Everest?";
  return "What critical water bypass transport system in trees carries nutrients upward?";
}

function getTopicMCQOptions(topic: string): string[] {
  if (topic.includes("Comets")) return ["💨 Pressure from Solar Winds", "🛡️ Magnetic fields of Mars", "🕒 Elastic string forces", "💾 Gravity from deep black holes"];
  if (topic.includes("Mars")) return ["🌋 Olympus Mons Volcano", "⛰️ Rocky Samosa Peak", "🏰 Pune Castle Ridge", "🍟 McDonald Crater"];
  return ["🌱 Xylem cells (plant capillaries)", "🍔 Fast delivery drivers", "🕒 Local garden sprinklers", "💾 Electric copper wires"];
}

function getTopicMCQAnswer(topic: string): string {
  if (topic.includes("Comets")) return "💨 Pressure from Solar Winds";
  if (topic.includes("Mars")) return "🌋 Olympus Mons Volcano";
  return "🌱 Xylem cells (plant capillaries)";
}

function getTopicDragBuckets(topic: string): { id: string; label: string }[] {
  return [
    { id: "cosmic", label: "🪐 Outer Space" },
    { id: "earthly", label: "🌿 Earthly Biosphere" }
  ];
}

function getTopicDragItems(topic: string): { id: string; text: string; correct_bucket: string }[] {
  return [
    { id: "i1", text: "Vaporizing comet tails", correct_bucket: "cosmic" },
    { id: "i2", text: "Forest leaf kitchens", correct_bucket: "earthly" },
    { id: "i3", text: "Martian rust sandstorms", correct_bucket: "cosmic" },
    { id: "i4", text: "Volcanic magma boilers", correct_bucket: "earthly" }
  ];
}

function getTopicPairs(topic: string): { left: string; right: string }[] {
  return [
    { left: "☀️ Sunlight rays", right: "🍳 Kitchen hot stove" },
    { left: "🪐 Mars rust dust", right: "🚲 Rusty bicycle frames" },
    { left: "☄️ Comet core", right: "❄️ Melting snow boulder" }
  ];
}

function getTopicSortSteps(topic: string): { id: string; text: string }[] {
  return [
    { id: "u1", text: "🌱 Roots absorb moisture from the dirt" },
    { id: "u2", text: "📐 Plant tubes carry fluids up the stalk" },
    { id: "u3", text: "☀️ Chlorophyll captures solar rays" },
    { id: "u4", text: "🍃 Leaf pores release fresh oxygen" }
  ];
}

function getTopicSortOrder(topic: string): string[] {
  return ["u1", "u2", "u3", "u4"];
}

function getTopicBuildTarget(topic: string): string {
  return "Sunlight fuels leaf cells.";
}

function getTopicBuildChips(topic: string): string[] {
  return ["Sunlight", "fuels", "leaf", "cells."];
}

function getTopicBuildDistractors(topic: string): string[] {
  return ["engine", "keyboard", "robot"];
}

function getTopicSpotItems(topic: string): { id: string; text: string; has_ai: boolean; explanation?: string }[] {
  return [
    { id: "t1", text: "🌿 Green plant leaves produce sugars using chloroplasts", has_ai: true, explanation: "Completely true biological fact! Photosynthesis transforms light into glucose." },
    { id: "t2", text: "🛸 Stars are tiny electric lightbulbs screwed into space canvas", has_ai: false },
    { id: "t3", text: "🪐 Olympus Mons is a Martian volcano three times taller than Mount Everest", has_ai: true, explanation: "True! Olympus Mons is a massive shield volcano stretching 22 kilometers high." },
    { id: "t4", text: "🌿 Sunflowers turn their heads towards the cold moon at midnight", has_ai: false }
  ];
}

function getTopicFakeFactsItems(topic: string): { id: string; text: string; has_ai: boolean; explanation?: string }[] {
  return [
    { id: "ff1", text: "🛸 Myth: 'Our Sun is an artificial space projector managed by astronauts.'", has_ai: true, explanation: "An absurd space myth! The Sun is a massive ball of real nuclear hydrogen fusion!" },
    { id: "ff2", text: "🌿 Fact: 'Mycelium fungus acts like wires letting trees chat underground.'", has_ai: false },
    { id: "ff3", text: "🛸 Myth: 'If you travel to Mars, you will float off instantly because it has zero gravity.'", has_ai: true, explanation: "False space myth! Mars has 38% of Earth's gravity, which is smaller but solid!" },
    { id: "ff4", text: "🌿 Fact: 'Chlorophyll looks green because it reflects green sunlight rays back to our eyes.'", has_ai: false }
  ];
}
