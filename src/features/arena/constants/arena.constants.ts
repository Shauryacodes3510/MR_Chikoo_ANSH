import { ArenaQuestion, RivalProfile, VehicleBooster } from '../types/arena.types';

export const MAX_SCORE = 1000;
export const RACE_TARGET_DISTANCE = 1000; // 1,000 meters to finish line
export const QUESTION_TIME_SECONDS = 15;
export const FAST_ANSWER_THRESHOLD = 5; // < 5s is Fast Answer -> HYPER BOOST!
export const COUNTDOWN_SECONDS = 3;
export const MIN_PLAYERS = 2;

export const RIVAL_PROFILES: RivalProfile[] = [
  {
    id: 'rival_nova_bot',
    name: 'Nova-Bot 9000',
    title: 'Adaptive AI Rookie',
    avatar: '🤖',
    difficulty: 'easy',
    vehicleName: 'Volt-Speeder X1',
    colorTheme: '#38bdf8', // Sky Cyan
    topSpeed: 460,
    botBaseSpeed: 140,
    quotes: {
      intro: 'Calibrating neural engines... Prepare to test your AI knowledge!',
      overtake: [
        '⚡ Data acceleration activated!',
        '💨 Just optimized my speed algorithm!',
        '🤖 Catch my neural slipstream!'
      ],
      overtaken: [
        '⚠️ Logic anomaly! How did you boost so fast?!',
        '⚙️ Recalculating race trajectory...',
        '🔥 Your prediction accuracy is off the charts!'
      ],
      victory: 'Race simulation complete. Neural speed victory achieved!',
      defeat: 'Incredible race! Your AI knowledge surpassed my calculations!'
    }
  },
  {
    id: 'rival_vector_x',
    name: 'Vector-X',
    title: 'High-Velocity Neural Racer',
    avatar: '⚡',
    difficulty: 'medium',
    vehicleName: 'Plasma-Streak Mk-II',
    colorTheme: '#a855f7', // Purple/Violet
    topSpeed: 540,
    botBaseSpeed: 165,
    quotes: {
      intro: 'Vector calculations locked. Let’s see if you can match my inference speed!',
      overtake: [
        '⚡ Parallel processing speed engaged!',
        '🚀 Overfitting your racing line!',
        '💨 01000010 01011001 01000101 (BYE)!'
      ],
      overtaken: [
        '💥 Gradient descent surge detected in your vehicle!',
        '⚡ What model architecture are you running?!',
        '🏎️ Clean overtake! I need more training epochs!'
      ],
      victory: 'Optimal outcome logged. Vector-X claims the checkered flag!',
      defeat: 'Outstanding driving and AI mastery! Respect, racer!'
    }
  },
  {
    id: 'rival_cyber_chikoo',
    name: 'Mecha-Chikoo',
    title: 'Grand Prix Arena Champion',
    avatar: '🏆',
    difficulty: 'hard',
    vehicleName: 'Cosmic Quantum Turbo',
    colorTheme: '#f59e0b', // Amber/Gold
    topSpeed: 620,
    botBaseSpeed: 190,
    quotes: {
      intro: 'Welcome to the Championship League. Push your AI brain to the limit!',
      overtake: [
        '🔥 Maximum Overdrive initiated!',
        '⚡ Pure algorithmic horsepower!',
        '👑 The Arena crown stays with the master!'
      ],
      overtaken: [
        '🌟 Whoa! That was a supersonic inference boost!',
        '⚡ Your streak is unstoppable!',
        '🎯 Flawless answer execution!'
      ],
      victory: 'The championship remains undisputed! Great effort, racer!',
      defeat: 'A new AI Grand Prix Legend is born! Take the trophy!'
    }
  }
];

export const VEHICLE_BOOSTERS: VehicleBooster[] = [
  {
    id: 'boost_quantum_nitro',
    name: 'Quantum Nitro',
    tagline: '+25% Boost on Fast Answers',
    icon: '⚡',
    nitroBonus: 25,
    unlocked: true
  },
  {
    id: 'boost_neural_overdrive',
    name: 'Neural Overdrive',
    tagline: 'Streak Multiplier x2 Speed',
    icon: '🧠',
    nitroBonus: 40,
    unlocked: true
  },
  {
    id: 'boost_photon_shield',
    name: 'Photon Slipstream',
    tagline: 'Faster recovery on mistakes',
    icon: '🛡️',
    nitroBonus: 20,
    unlocked: true
  }
];

export const DEFAULT_ARENA_QUESTIONS: ArenaQuestion[] = [
  {
    id: 'aq_1',
    category: 'Predictions & Data',
    question: 'What helps an Artificial Intelligence make an accurate prediction?',
    options: [
      'High-quality training data & pattern recognition',
      'Longer physical power cables and wires',
      'Installing heavier computer cooling fans',
      'Picking random answers from a coin toss'
    ],
    correctAnswer: 'High-quality training data & pattern recognition',
    explanation: 'AI models analyze patterns across vast datasets to make intelligent, data-backed predictions!'
  },
  {
    id: 'aq_2',
    category: 'Neural Networks',
    question: 'What is the primary inspiration behind Artificial Neural Networks?',
    options: [
      'Biological neurons and synapses in the human brain',
      'Mechanical clockwork gear teeth and springs',
      'Chemical reactions inside car batteries',
      'Sorting library books alphabetically'
    ],
    correctAnswer: 'Biological neurons and synapses in the human brain',
    explanation: 'Neural networks are mathematically modeled after how interconnected neurons pass electrical signals in brains.'
  },
  {
    id: 'aq_3',
    category: 'Computer Vision',
    question: 'Which AI technology allows self-driving race vehicles to detect track obstacles?',
    options: [
      'Computer Vision & camera sensor fusion',
      'Audio volume booster equalizers',
      'Digital spreadsheet recalculations',
      'Typing speed spell-checkers'
    ],
    correctAnswer: 'Computer Vision & camera sensor fusion',
    explanation: 'Computer Vision processes video pixels in real-time to identify lanes, obstacles, and rivals!'
  },
  {
    id: 'aq_4',
    category: 'Machine Learning',
    question: 'In Machine Learning, what is "Training Data" primarily used for?',
    options: [
      'Teaching mathematical algorithms to recognize patterns',
      'Wiping out temporary browser search cookies',
      'Encrypting user passwords into hash keys',
      'Generating random static on computer monitors'
    ],
    correctAnswer: 'Teaching mathematical algorithms to recognize patterns',
    explanation: 'Training data acts as the textbook from which machine learning models learn rules and patterns.'
  },
  {
    id: 'aq_5',
    category: 'AI Ethics & Safety',
    question: 'Why is AI Ethics critical when building autonomous decision systems?',
    options: [
      'To prevent bias, ensure human safety, and guarantee fairness',
      'To make computer screens shine brighter at night',
      'To force software programs to use fewer fonts',
      'To hide how algorithms make decisions from everyone'
    ],
    correctAnswer: 'To prevent bias, ensure human safety, and guarantee fairness',
    explanation: 'Ethical AI ensures systems are safe, unbiased, inclusive, and beneficial to everyone.'
  },
  {
    id: 'aq_6',
    category: 'Reinforcement Learning',
    question: 'How does an AI racer learn the optimal racing line via Reinforcement Learning?',
    options: [
      'Through trial-and-error with rewards for speed and penalties for crashes',
      'By copying a static printed text document once',
      'By turning the vehicle power switch on and off repeatedly',
      'By calculating only the color of the track barriers'
    ],
    correctAnswer: 'Through trial-and-error with rewards for speed and penalties for crashes',
    explanation: 'Reinforcement Learning trains agents by awarding positive points for good actions and negative points for mistakes!'
  },
  {
    id: 'aq_7',
    category: 'Prompt Engineering',
    question: 'What is "Prompt Engineering" in modern Generative AI?',
    options: [
      'Crafting clear, contextual instructions to guide model outputs',
      'Soldering microchips onto physical motherboard circuits',
      'Measuring the physical temperature of GPU processors',
      'Designing plastic casings for electronic computer mice'
    ],
    correctAnswer: 'Crafting clear, contextual instructions to guide model outputs',
    explanation: 'Prompt engineering involves formulating precise, structured text prompts to unlock optimal generative answers.'
  },
  {
    id: 'aq_8',
    category: 'Robotics & Sensors',
    question: 'What device do robots use to measure distance and map surrounding environments with laser pulses?',
    options: [
      'LiDAR (Light Detection and Ranging)',
      'Digital Quartz Clockwork Timer',
      'Standard Bluetooth Speaker',
      'Mechanical Barometer Gauge'
    ],
    correctAnswer: 'LiDAR (Light Detection and Ranging)',
    explanation: 'LiDAR fires thousands of laser beams per second to create high-precision 3D spatial maps of surroundings.'
  },
  {
    id: 'aq_9',
    category: 'Natural Language Processing',
    question: 'What does "Tokenization" do in large language models?',
    options: [
      'Breaks sentences and text into smaller digestible units/tokens',
      'Converts physical currency coins into arcade tokens',
      'Deletes punctuation marks permanently from documents',
      'Locks the computer keyboard with a digital passcode'
    ],
    correctAnswer: 'Breaks sentences and text into smaller digestible units/tokens',
    explanation: 'Tokenization segments raw text into words or subwords so neural networks can process them numerically.'
  },
  {
    id: 'aq_10',
    category: 'Generative AI',
    question: 'How do Diffusion Models generate high-definition realistic images?',
    options: [
      'By progressively removing random noise until a crisp picture emerges',
      'By cutting and pasting pre-made internet photos together',
      'By scanning physical paper photographs with a desktop scanner',
      'By zooming in on pixelated icons until they look smooth'
    ],
    correctAnswer: 'By progressively removing random noise until a crisp picture emerges',
    explanation: 'Diffusion models start with pure visual static/noise and iteratively denoise it step-by-step into detailed art!'
  }
];
