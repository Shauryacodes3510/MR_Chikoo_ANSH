import { CORE_UI_DICTIONARY, MASTER_LANGUAGE_CODE } from '../lib/translation/languages';

export type TranslationDictionary = Record<string, string>;

export const en: TranslationDictionary = {
  // Navigation
  'navigation.map': 'Adventure Map',
  'navigation.practice': 'Battle Arena',
  'navigation.arena': 'Battle Arena',
  'navigation.leaderboard': 'Leaderboard',
  'navigation.quests': 'Daily Quests',
  'navigation.rewards': 'Rewards Store',
  'navigation.profile': 'Player Profile',
  'navigation.explore_world': 'Explore World',
  'navigation.special_portals': 'Special Portals',
  'navigation.school_portal': 'School Portal',
  'navigation.creator_studio': 'Creator Studio',
  'navigation.universe_overview': 'Universe Overview',
  'navigation.sign_out': 'Sign Out',

  // Header & Status
  'header.switch_world': 'Switch Learning World',
  'header.daily_streak': 'Daily Streak',
  'header.cookies': 'Cookies',
  'header.w1_to_wn': '{count} Worlds',

  // Common UI
  'common.active': 'Active',
  'common.close': 'Close',
  'common.claim': 'Claim',
  'common.locked': 'Locked',
  'common.try_again': 'Retry',
  'common.cookies': 'Cookies',
  'common.day': 'Day',
  'common.days': 'Days',
  'common.streak': 'Streak',
  'common.energy': 'Energy',
  'common.back': 'Back',
  'common.continue': 'Continue',
  'common.check': 'Check',
  'common.loading': 'Loading...',

  // Home & Lesson
  'home.unit': 'Unit',
  'home.lesson': 'Lesson',
  'home.of': 'of',
  'home.completed': 'Completed',
  'home.start': 'Start',

  // Quests & Challenges
  'quests.title': 'Daily Quests',
  'quests.subtitle': 'Complete challenges every day to earn bonus Cookies & XP',
  'quests.daily_chest': 'Daily Mystery Chest',
  'quests.come_back_tomorrow': 'Come back tomorrow for a new chest',
  'quests.chest_reward_desc': 'Open your daily cosmic chest for surprise Cookies and XP!',
  'quests.claimed_desc': 'Treasure claimed for today! Check back tomorrow.',
  'quests.claim_desc': 'Unlock your daily bounty to win 50 bonus cookies!',
  'quests.next_in': 'Next in {time}',
  'quests.claim_button': 'Claim 50 Cookies 🍪',
  'quests.view_all': 'View All',

  // Rewards
  'rewards.title': 'Rewards Vault',
  'rewards.wheel_title': 'Cookie Wheel 🎡',
  'rewards.wheel_desc': 'Spin & win up to 250 Cookies!',
  'rewards.spin_button': 'Spin Now',
  'rewards.visit_store': 'Visit Store',
  'rewards.inspect': 'Inspect',

  // Leaderboard
  'leaderboard.title': 'Cosmic Leaderboard',
  'leaderboard.weekly_league': 'Weekly League Active',

  // Profile & Settings
  'profile.cadet': 'Space Cadet',
  'profile.language': 'Interface Language',
  'settings.language': 'Language',
};

export const hi: TranslationDictionary = {
  // Navigation
  'navigation.map': 'रोमांचक नक्शा',
  'navigation.practice': 'अभ्यास एरीना',
  'navigation.leaderboard': 'लीडरबोर्ड',
  'navigation.quests': 'दैनिक मिशन',
  'navigation.rewards': 'इनाम स्टोर',
  'navigation.profile': 'खिलाड़ी प्रोफाइल',
  'navigation.explore_world': 'दुनिया देखें',
  'navigation.special_portals': 'विशेष पोर्टल',
  'navigation.school_portal': 'स्कूल पोर्टल',
  'navigation.creator_studio': 'क्रिएटर स्टूडियो',
  'navigation.universe_overview': 'ब्रह्मांड अवलोकन',
  'navigation.sign_out': 'साइन आउट',

  // Header & Status
  'header.switch_world': 'सीखने की दुनिया बदलें',
  'header.daily_streak': 'दैनिक स्ट्रीक',
  'header.cookies': 'कुकीज़',
  'header.w1_to_wn': '{count} दुनिया',

  // Common UI
  'common.active': 'सक्रिय',
  'common.close': 'बंद करें',
  'common.claim': 'प्राप्त करें',
  'common.locked': 'बंद है',
  'common.try_again': 'पुनः प्रयास करें',
  'common.cookies': 'कुकीज़',
  'common.day': 'दिन',
  'common.days': 'दिन',
  'common.streak': 'स्ट्रीक',
  'common.energy': 'ऊर्जा',
  'common.back': 'वापस',
  'common.continue': 'आगे बढ़ें',
  'common.check': 'जाँचें',
  'common.loading': 'लोड हो रहा है...',

  // Home & Lesson
  'home.unit': 'यूनिट',
  'home.lesson': 'पाठ',
  'home.of': 'का',
  'home.completed': 'पूरा हुआ',
  'home.start': 'शुरू करें',

  // Quests & Challenges
  'quests.title': 'दैनिक मिशन',
  'quests.subtitle': 'अतिरिक्त कुकीज़ और XP पाने के लिए हर दिन चुनौतियाँ पूरी करें',
  'quests.daily_chest': 'दैनिक रहस्यमयी चेस्ट',
  'quests.come_back_tomorrow': 'नई चेस्ट के लिए कल वापस आएं',
  'quests.chest_reward_desc': 'आश्चर्यजनक कुकीज़ और XP के लिए अपनी दैनिक चेस्ट खोलें!',
  'quests.claimed_desc': 'आज का खज़ाना प्राप्त कर लिया! कल फिर देखें।',
  'quests.claim_desc': '50 बोनस कुकीज़ जीतने के लिए अपनी दैनिक खोज पूरी करें!',
  'quests.next_in': '{time} में उपलब्ध',
  'quests.claim_button': '50 कुकीज़ प्राप्त करें 🍪',
  'quests.view_all': 'सभी देखें',

  // Rewards
  'rewards.title': 'रिवार्ड्स वॉल्ट',
  'rewards.wheel_title': 'कुकी व्हील 🎡',
  'rewards.wheel_desc': 'घुमाएं और 250 तक कुकीज़ जीतें!',
  'rewards.spin_button': 'अभी घुमाएं',
  'rewards.visit_store': 'स्टोर पर जाएं',
  'rewards.inspect': 'निरीक्षण करें',

  // Leaderboard
  'leaderboard.title': 'कॉस्मिक लीडरबोर्ड',
  'leaderboard.weekly_league': 'साप्ताहिक लीग सक्रिय',

  // Profile & Settings
  'profile.cadet': 'अंतरिक्ष कैडेट',
  'profile.language': 'इंटरफ़ेस भाषा',
  'settings.language': 'भाषा',
};

export const mr: TranslationDictionary = {
  // Navigation
  'navigation.map': 'साहसी नकाशा',
  'navigation.practice': 'सराव रिंगण',
  'navigation.leaderboard': 'लीडरबोर्ड',
  'navigation.quests': 'दैनंदिन मोहीम',
  'navigation.rewards': 'बक्षीस स्टोअर',
  'navigation.profile': 'खेळाडू प्रोफाइल',
  'navigation.explore_world': 'विश्व एक्सप्लोर करा',
  'navigation.special_portals': 'विशेष पोर्टल',
  'navigation.school_portal': 'शाळा पोर्टल',
  'navigation.creator_studio': 'क्रिएटर स्टुडिओ',
  'navigation.universe_overview': 'ब्रह्मांड विहंगावलोकन',
  'navigation.sign_out': 'साइन आउट',

  // Header & Status
  'header.switch_world': 'शिकण्याचे जग बदला',
  'header.daily_streak': 'दैनंदिन स्ट्रीक',
  'header.cookies': 'कुकीज',
  'header.w1_to_wn': '{count} जग',

  // Common UI
  'common.active': 'सक्रिय',
  'common.close': 'बंद करा',
  'common.claim': 'मिळवा',
  'common.locked': 'कुलूपबंद',
  'common.try_again': 'पुन्हा प्रयत्न करा',
  'common.cookies': 'कुकीज',
  'common.day': 'दिवस',
  'common.days': 'दिवस',
  'common.streak': 'स्ट्रीक',
  'common.energy': 'ऊर्जा',
  'common.back': 'मागे',
  'common.continue': 'पुढे चला',
  'common.check': 'तपासा',
  'common.loading': 'लोड होत आहे...',

  // Home & Lesson
  'home.unit': 'युनिट',
  'home.lesson': 'धडा',
  'home.of': 'पैकी',
  'home.completed': 'पूर्ण झाले',
  'home.start': 'सुरू करा',

  // Quests & Challenges
  'quests.title': 'दैनंदिन मोहीम',
  'quests.subtitle': 'बोनस कुकीज आणि XP मिळविण्यासाठी दररोज आव्हाने पूर्ण करा',
  'quests.daily_chest': 'दैनंदिन गूढ पेटी',
  'quests.come_back_tomorrow': 'नवीन पेटीसाठी उद्या परत या',
  'quests.chest_reward_desc': 'आश्चर्यकारक कुकीज आणि XP साठी तुमची पेटी उघडा!',
  'quests.claimed_desc': 'आजचा खजिना मिळवला! उद्या परत या.',
  'quests.claim_desc': '50 बोनस कुकीज जिंकण्यासाठी अनलॉक करा!',
  'quests.next_in': '{time} नंतर उपलब्ध',
  'quests.claim_button': '50 कुकीज मिळवा 🍪',
  'quests.view_all': 'सर्व पहा',

  // Rewards
  'rewards.title': 'बक्षीस तिजोरी',
  'rewards.wheel_title': 'कुकी चाक 🎡',
  'rewards.wheel_desc': 'फिरवा आणि 250 पर्यंत कुकीज जिंका!',
  'rewards.spin_button': 'आता फिरवा',
  'rewards.visit_store': 'स्टोअरला भेट द्या',
  'rewards.inspect': 'तपासा',

  // Leaderboard
  'leaderboard.title': 'कॉस्मिक लीडरबोर्ड',
  'leaderboard.weekly_league': 'साप्ताहिक लीग सुरू',

  // Profile & Settings
  'profile.cadet': 'स्पेस कॅडेट',
  'profile.language': 'भाषा निवडा',
  'settings.language': 'भाषा',
};

export const gu: TranslationDictionary = {
  // Navigation
  'navigation.map': 'સાહસ નકશો',
  'navigation.practice': 'પ્રેક્ટિસ અખાડો',
  'navigation.leaderboard': 'લીડરબોર્ડ',
  'navigation.quests': 'દૈનિક ક્વેસ્ટ્સ',
  'navigation.rewards': 'ઇનામ સ્ટોર',
  'navigation.profile': 'પ્લેયર પ્રોફાઇલ',
  'navigation.explore_world': 'વિશ્વનું અન્વેષણ કરો',
  'navigation.special_portals': 'વિશેષ પોર્ટલ',
  'navigation.school_portal': 'શાળા પોર્ટલ',
  'navigation.creator_studio': 'ક્રિએટર સ્ટુડિયો',
  'navigation.universe_overview': 'બ્રહ્માંડ ઝાંખી',
  'navigation.sign_out': 'સાઇન આઉટ',

  // Header & Status
  'header.switch_world': 'શિક્ષણ વિશ્વ બદલો',
  'header.daily_streak': 'દૈનિક સ્ટ્રીક',
  'header.cookies': 'કુકીઝ',
  'header.w1_to_wn': '{count} વિશ્વ',

  // Common UI
  'common.active': 'સક્રિય',
  'common.close': 'બંધ કરો',
  'common.claim': 'મેળવો',
  'common.locked': 'લોક કરેલ',
  'common.try_again': 'ફરી પ્રયાસ કરો',
  'common.cookies': 'કુકીઝ',
  'common.day': 'દિવસ',
  'common.days': 'દિવસો',
  'common.streak': 'સ્ટ્રીક',
  'common.energy': 'ઊર્જા',
  'common.back': 'પાછા',
  'common.continue': 'આગળ વધો',
  'common.check': 'ચકાસો',
  'common.loading': 'લોડ થઈ રહ્યું છે...',

  // Home & Lesson
  'home.unit': 'યુનિટ',
  'home.lesson': 'પાઠ',
  'home.of': 'માંથી',
  'home.completed': 'પૂર્ણ',
  'home.start': 'શરૂ કરો',

  // Quests & Challenges
  'quests.title': 'દૈનિક ક્વેસ્ટ્સ',
  'quests.subtitle': 'બોનસ કુકીઝ અને XP મેળવવા દરરોજ પડકારો પૂર્ણ કરો',
  'quests.daily_chest': 'દૈનિક મિસ્ટ્રી ચેસ્ટ',
  'quests.come_back_tomorrow': 'નવી ચેસ્ટ માટે કાલે પાછા આવો',
  'quests.chest_reward_desc': 'સરપ્રાઈઝ કુકીઝ અને XP માટે તમારી દૈનિક ચેસ્ટ ખોલો!',
  'quests.claimed_desc': 'આજનો ખજાનો મેળવ્યો! કાલે પાછા આવો.',
  'quests.claim_desc': '50 બોનસ કુકીઝ જીતવા માટે ક્વેસ્ટ ખોલો!',
  'quests.next_in': '{time} માં ઉપલબ્ધ',
  'quests.claim_button': '50 કુકીઝ મેળવો 🍪',
  'quests.view_all': 'બધું જુઓ',

  // Rewards
  'rewards.title': 'રિવોર્ડ્સ વૉલ્ટ',
  'rewards.wheel_title': 'કુકી વ્હીલ 🎡',
  'rewards.wheel_desc': 'સ્પિન કરો અને 250 સુધી કુકીઝ જીતો!',
  'rewards.spin_button': 'હમણાં સ્પિન કરો',
  'rewards.visit_store': 'સ્ટોરની મુલાકાત લો',
  'rewards.inspect': 'તપાસો',

  // Leaderboard
  'leaderboard.title': 'કોસ્મિક લીડરબોર્ડ',
  'leaderboard.weekly_league': 'સાપ્તાહિક લીગ સક્રિય',

  // Profile & Settings
  'profile.cadet': 'સ્પેસ કેડેટ',
  'profile.language': 'ઇન્ટરફેસ ભાષા',
  'settings.language': 'ભાષા',
};

export const ta: TranslationDictionary = {
  // Navigation
  'navigation.map': 'சாகச வரைபடம்',
  'navigation.practice': 'பயிற்சி அரங்கம்',
  'navigation.leaderboard': 'தரவரிசை பட்டியல்',
  'navigation.quests': 'தினசரி பணிகள்',
  'navigation.rewards': 'வெகுமதி அங்காடி',
  'navigation.profile': 'வீரர் சுயவிவரம்',
  'navigation.explore_world': 'உலகை ஆராயுங்கள்',
  'navigation.special_portals': 'சிறப்பு போர்ட்டல்கள்',
  'navigation.school_portal': 'பள்ளி போர்ட்டல்',
  'navigation.creator_studio': 'படைப்பாளர் அரங்கம்',
  'navigation.universe_overview': 'பிரபஞ்ச கண்ணோட்டம்',
  'navigation.sign_out': 'வெளியேறு',

  // Header & Status
  'header.switch_world': 'கற்றல் உலகத்தை மாற்றவும்',
  'header.daily_streak': 'தினசரி தொடர்',
  'header.cookies': 'குக்கீகள்',
  'header.w1_to_wn': '{count} உலகங்கள்',

  // Common UI
  'common.active': 'செயலில்',
  'common.close': 'மூடு',
  'common.claim': 'பெறுக',
  'common.locked': 'பூட்டப்பட்டது',
  'common.try_again': 'மீண்டும் முயற்சிக்கவும்',
  'common.cookies': 'குக்கீகள்',
  'common.day': 'நாள்',
  'common.days': 'நாட்கள்',
  'common.streak': 'தொடர்ச்சி',
  'common.energy': 'ஆற்றல்',
  'common.back': 'பின்செல்க',
  'common.continue': 'தொடரவும்',
  'common.check': 'சரிபார்க்கவும்',
  'common.loading': 'ஏற்றப்படுகிறது...',

  // Home & Lesson
  'home.unit': 'அலகு',
  'home.lesson': 'பாடம்',
  'home.of': '/',
  'home.completed': 'முடிந்தது',
  'home.start': 'தொடங்கு',

  // Quests & Challenges
  'quests.title': 'தினசரி பணிகள்',
  'quests.subtitle': 'கூடுதல் குக்கீகள் மற்றும் XP பெற தினசரி சவால்களை முடிக்கவும்',
  'quests.daily_chest': 'தினசரி மர்மப் பெட்டகம்',
  'quests.come_back_tomorrow': 'புதிய பெட்டகத்திற்கு நாளை வாருங்கள்',
  'quests.chest_reward_desc': 'வியப்பூட்டும் குக்கீகள் பெற உங்கள் தினசரி பெட்டகத்தைத் திறக்கவும்!',
  'quests.claimed_desc': 'இன்றைய புதையல் பெறப்பட்டது! நாளை வாருங்கள்.',
  'quests.claim_desc': '50 போனஸ் குக்கீகளை வெல்ல உங்கள் பணியை முடிக்கவும்!',
  'quests.next_in': '{time} இல் அடுத்தது',
  'quests.claim_button': '50 குக்கீகளைப் பெறுக 🍪',
  'quests.view_all': 'அனைத்தையும் பார்',

  // Rewards
  'rewards.title': 'வெகுமதி பெட்டகம்',
  'rewards.wheel_title': 'குக்கீ சக்கரம் 🎡',
  'rewards.wheel_desc': 'சுழற்றி 250 குக்கீகள் வரை வெல்லுங்கள்!',
  'rewards.spin_button': 'சுழற்றுக',
  'rewards.visit_store': 'அங்காடிக்குச் செல்க',
  'rewards.inspect': 'ஆராய்க',

  // Leaderboard
  'leaderboard.title': 'காஸ்மிக் தரவரிசை',
  'leaderboard.weekly_league': 'வாராந்திர லீக் செயலில் உள்ளது',

  // Profile & Settings
  'profile.cadet': 'விண்வெளி கேடட்',
  'profile.language': 'இடைமுக மொழி',
  'settings.language': 'மொழி',
};

export const te: TranslationDictionary = {
  // Navigation
  'navigation.map': 'సాహస మ్యాప్',
  'navigation.practice': 'అభ్యాస అరేనా',
  'navigation.leaderboard': 'లీడర్‌బోర్డ్',
  'navigation.quests': 'రోజువారీ టాస్క్‌లు',
  'navigation.rewards': 'రివార్డుల స్టోర్',
  'navigation.profile': 'ప్లేయర్ ప్రొఫైల్',
  'navigation.explore_world': 'ప్రపంచాన్ని అన్వేషించండి',
  'navigation.special_portals': 'ప్రత్యేక పోర్టల్స్',
  'navigation.school_portal': 'పాఠశాల పోర్టల్',
  'navigation.creator_studio': 'క్రియేటర్ స్టూడియో',
  'navigation.universe_overview': 'విశ్వం అవలోకనం',
  'navigation.sign_out': 'లాగ్ అవుట్',

  // Header & Status
  'header.switch_world': 'లెర్నింగ్ ప్రపంచాన్ని మార్చండి',
  'header.daily_streak': 'రోజువారీ స్ట్రీక్',
  'header.cookies': 'కుకీలు',
  'header.w1_to_wn': '{count} ప్రపంచాలు',

  // Common UI
  'common.active': 'క్రియాశీలం',
  'common.close': 'మూసివేయి',
  'common.claim': 'పొందండి',
  'common.locked': 'లాక్ చేయబడింది',
  'common.try_again': 'మళ్లీ ప్రయత్నించండి',
  'common.cookies': 'కుకీలు',
  'common.day': 'రోజు',
  'common.days': 'రోజులు',
  'common.streak': 'స్ట్రీక్',
  'common.energy': 'శక్తి',
  'common.back': 'వెనుకకు',
  'common.continue': 'కొనసాగించండి',
  'common.check': 'పరిశీలించండి',
  'common.loading': 'లోడ్ అవుతోంది...',

  // Home & Lesson
  'home.unit': 'యూనిట్',
  'home.lesson': 'పాఠం',
  'home.of': '/',
  'home.completed': 'పూర్తయింది',
  'home.start': 'ప్రారంభించండి',

  // Quests & Challenges
  'quests.title': 'రోజువారీ టాస్క్‌లు',
  'quests.subtitle': 'బోనస్ కుకీలు & XP గెలుచుకోవడానికి రోజూ టాస్క్‌లను పూర్తి చేయండి',
  'quests.daily_chest': 'రోజువారీ మిస్టరీ బాక్స్',
  'quests.come_back_tomorrow': 'కొత్త బాక్స్ కోసం రేపు రండి',
  'quests.chest_reward_desc': 'ఆశ్చర్యకరమైన కుకీల కోసం మీ బాక్స్‌ను తెరవండి!',
  'quests.claimed_desc': 'నేటి బహుమతి పొందబడింది! రేపు మళ్లీ చూడండి.',
  'quests.claim_desc': '50 బోనస్ కుకీలను గెలుచుకోవడానికి అన్‌లాక్ చేయండి!',
  'quests.next_in': '{time} లో అందుబాటులో ఉంటుంది',
  'quests.claim_button': '50 కుకీలను పొందండి 🍪',
  'quests.view_all': 'అన్నీ చూడండి',

  // Rewards
  'rewards.title': 'రివార్డుల ఖజానా',
  'rewards.wheel_title': 'కుకీ చక్రం 🎡',
  'rewards.wheel_desc': 'తిప్పి 250 వరకు కుకీలను గెలుచుకోండి!',
  'rewards.spin_button': 'ఇప్పుడే తిప్పండి',
  'rewards.visit_store': 'స్టోర్ సందర్శించండి',
  'rewards.inspect': 'పరిశీలించండి',

  // Leaderboard
  'leaderboard.title': 'కాస్మిక్ లీడర్‌బోర్డ్',
  'leaderboard.weekly_league': 'వీక్లీ లీగ్ చురుకుగా ఉంది',

  // Profile & Settings
  'profile.cadet': 'స్పేస్ క్యాడెట్',
  'profile.language': 'ఇంటర్‌ఫేస్ భాష',
  'settings.language': 'భాష',
};

export const es: TranslationDictionary = {
  // Navigation
  'navigation.map': 'Mapa de aventuras',
  'navigation.practice': 'Arena de práctica',
  'navigation.leaderboard': 'Clasificación',
  'navigation.quests': 'Misiones diarias',
  'navigation.rewards': 'Tienda de premios',
  'navigation.profile': 'Perfil de jugador',
  'navigation.explore_world': 'Explorar mundo',
  'navigation.special_portals': 'Portales especiales',
  'navigation.school_portal': 'Portal escolar',
  'navigation.creator_studio': 'Estudio creador',
  'navigation.universe_overview': 'Vista del universo',
  'navigation.sign_out': 'Cerrar sesión',

  // Header & Status
  'header.switch_world': 'Cambiar mundo de aprendizaje',
  'header.daily_streak': 'Racha diaria',
  'header.cookies': 'Galletas',
  'header.w1_to_wn': '{count} Mundos',

  // Common UI
  'common.active': 'Activo',
  'common.close': 'Cerrar',
  'common.claim': 'Reclamar',
  'common.locked': 'Bloqueado',
  'common.try_again': 'Reintentar',
  'common.cookies': 'Galletas',
  'common.day': 'Día',
  'common.days': 'Días',
  'common.streak': 'Racha',
  'common.energy': 'Energía',
  'common.back': 'Volver',
  'common.continue': 'Continuar',
  'common.check': 'Comprobar',
  'common.loading': 'Cargando...',

  // Home & Lesson
  'home.unit': 'Unidad',
  'home.lesson': 'Lección',
  'home.of': 'de',
  'home.completed': 'Completado',
  'home.start': 'Empezar',

  // Quests & Challenges
  'quests.title': 'Misiones diarias',
  'quests.subtitle': 'Completa desafíos cada día para ganar galletas y XP adicionales',
  'quests.daily_chest': 'Cofre misterioso diario',
  'quests.come_back_tomorrow': 'Vuelve mañana por un nuevo cofre',
  'quests.chest_reward_desc': '¡Abre tu cofre cósmico diario para ganar galletas y XP sorpresa!',
  'quests.claimed_desc': '¡Tesoro reclamado por hoy! Vuelve mañana.',
  'quests.claim_desc': '¡Desbloquea tu recompensa para ganar 50 galletas!',
  'quests.next_in': 'Siguiente en {time}',
  'quests.claim_button': 'Reclamar 50 galletas 🍪',
  'quests.view_all': 'Ver todo',

  // Rewards
  'rewards.title': 'Bóveda de recompensas',
  'rewards.wheel_title': 'Rueda de galletas 🎡',
  'rewards.wheel_desc': '¡Gira y gana hasta 250 galletas!',
  'rewards.spin_button': 'Girar ahora',
  'rewards.visit_store': 'Visitar tienda',
  'rewards.inspect': 'Inspeccionar',

  // Leaderboard
  'leaderboard.title': 'Clasificación cósmica',
  'leaderboard.weekly_league': 'Liga semanal activa',

  // Profile & Settings
  'profile.cadet': 'Cadete espacial',
  'profile.language': 'Idioma de la interfaz',
  'settings.language': 'Idioma',
};

export const fr: TranslationDictionary = {
  // Navigation
  'navigation.map': 'Carte d\'aventure',
  'navigation.practice': 'Arène d\'entraînement',
  'navigation.leaderboard': 'Classement',
  'navigation.quests': 'Quêtes quotidiennes',
  'navigation.rewards': 'Boutique de récompenses',
  'navigation.profile': 'Profil du joueur',
  'navigation.explore_world': 'Explorer le monde',
  'navigation.special_portals': 'Portails spéciaux',
  'navigation.school_portal': 'Portail scolaire',
  'navigation.creator_studio': 'Studio de création',
  'navigation.universe_overview': 'Aperçu de l\'univers',
  'navigation.sign_out': 'Déconnexion',

  // Header & Status
  'header.switch_world': 'Changer de monde d\'apprentissage',
  'header.daily_streak': 'Série quotidienne',
  'header.cookies': 'Cookies',
  'header.w1_to_wn': '{count} Mondes',

  // Common UI
  'common.active': 'Actif',
  'common.close': 'Fermer',
  'common.claim': 'Réclamer',
  'common.locked': 'Verrouillé',
  'common.try_again': 'Réessayer',
  'common.cookies': 'Cookies',
  'common.day': 'Jour',
  'common.days': 'Jours',
  'common.streak': 'Série',
  'common.energy': 'Énergie',
  'common.back': 'Retour',
  'common.continue': 'Continuer',
  'common.check': 'Vérifier',
  'common.loading': 'Chargement...',

  // Home & Lesson
  'home.unit': 'Unité',
  'home.lesson': 'Leçon',
  'home.of': 'sur',
  'home.completed': 'Terminé',
  'home.start': 'Commencer',

  // Quests & Challenges
  'quests.title': 'Quêtes quotidiennes',
  'quests.subtitle': 'Terminez des défis chaque jour pour gagner des bonus de cookies et d\'XP',
  'quests.daily_chest': 'Coffre mystère quotidien',
  'quests.come_back_tomorrow': 'Revenez demain pour un nouveau coffre',
  'quests.chest_reward_desc': 'Ouvrez votre coffre cosmique pour des cookies et de l\'XP surprise !',
  'quests.claimed_desc': 'Trésor réclamé pour aujourd\'hui ! Revenez demain.',
  'quests.claim_desc': 'Débloquez votre prime pour remporter 50 cookies bonus !',
  'quests.next_in': 'Prochain dans {time}',
  'quests.claim_button': 'Réclamer 50 cookies 🍪',
  'quests.view_all': 'Voir tout',

  // Rewards
  'rewards.title': 'Chambre des récompenses',
  'rewards.wheel_title': 'Roue des cookies 🎡',
  'rewards.wheel_desc': 'Tournez et gagnez jusqu\'à 250 cookies !',
  'rewards.spin_button': 'Tourner maintenant',
  'rewards.visit_store': 'Visiter la boutique',
  'rewards.inspect': 'Inspecter',

  // Leaderboard
  'leaderboard.title': 'Classement cosmique',
  'leaderboard.weekly_league': 'Ligue hebdomadaire active',

  // Profile & Settings
  'profile.cadet': 'Cadet de l\'espace',
  'profile.language': 'Langue de l\'interface',
  'settings.language': 'Langue',
};

export const de: TranslationDictionary = {
  // Navigation
  'navigation.map': 'Abenteuer-Karte',
  'navigation.practice': 'Übungs-Arena',
  'navigation.leaderboard': 'Bestenliste',
  'navigation.quests': 'Tägliche Quests',
  'navigation.rewards': 'Belohnungs-Shop',
  'navigation.profile': 'Spielerprofil',
  'navigation.explore_world': 'Welt erkunden',
  'navigation.special_portals': 'Spezial-Portale',
  'navigation.school_portal': 'Schul-Portal',
  'navigation.creator_studio': 'Creator-Studio',
  'navigation.universe_overview': 'Universums-Übersicht',
  'navigation.sign_out': 'Abmelden',

  // Header & Status
  'header.switch_world': 'Lernwelt wechseln',
  'header.daily_streak': 'Tägliche Serie',
  'header.cookies': 'Kekse',
  'header.w1_to_wn': '{count} Welten',

  // Common UI
  'common.active': 'Aktiv',
  'common.close': 'Schließen',
  'common.claim': 'Einfordern',
  'common.locked': 'Gesperrt',
  'common.try_again': 'Wiederholen',
  'common.cookies': 'Kekse',
  'common.day': 'Tag',
  'common.days': 'Tage',
  'common.streak': 'Serie',
  'common.energy': 'Energie',
  'common.back': 'Zurück',
  'common.continue': 'Weiter',
  'common.check': 'Prüfen',
  'common.loading': 'Laden...',

  // Home & Lesson
  'home.unit': 'Einheit',
  'home.lesson': 'Lektion',
  'home.of': 'von',
  'home.completed': 'Abgeschlossen',
  'home.start': 'Starten',

  // Quests & Challenges
  'quests.title': 'Tägliche Quests',
  'quests.subtitle': 'Schließe täglich Herausforderungen ab, um Bonus-Kekse & XP zu verdienen',
  'quests.daily_chest': 'Tägliche Mysterien-Truhe',
  'quests.come_back_tomorrow': 'Komm morgen für eine neue Truhe wieder',
  'quests.chest_reward_desc': 'Öffne deine tägliche kosmische Truhe für Überraschungskekse und XP!',
  'quests.claimed_desc': 'Schatz für heute beansprucht! Komm morgen wieder.',
  'quests.claim_desc': 'Schalte deine tägliche Belohnung frei, um 50 Kekse zu gewinnen!',
  'quests.next_in': 'Nächste in {time}',
  'quests.claim_button': '50 Kekse einfordern 🍪',
  'quests.view_all': 'Alle anzeigen',

  // Rewards
  'rewards.title': 'Belohnungs-Tresor',
  'rewards.wheel_title': 'Kekse-Glücksrad 🎡',
  'rewards.wheel_desc': 'Drehe und gewinne bis zu 250 Kekse!',
  'rewards.spin_button': 'Jetzt drehen',
  'rewards.visit_store': 'Shop besuchen',
  'rewards.inspect': 'Prüfen',

  // Leaderboard
  'leaderboard.title': 'Kosmische Bestenliste',
  'leaderboard.weekly_league': 'Wöchentliche Liga aktiv',

  // Profile & Settings
  'profile.cadet': 'Weltraum-Kadett',
  'profile.language': 'Sprache der Benutzeroberfläche',
  'settings.language': 'Sprache',
};

export const dictionaries: Record<string, TranslationDictionary> = {
  en,
  hi,
  mr,
  gu,
  ta,
  te,
  es,
  fr,
  de,
};

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

/**
 * Universal synchronous translation resolver.
 * Handles key paths ('quests.daily_chest'), direct phrases ('Home', 'Cookies'),
 * language fallback, parameter replacement ({count}), and CORE_UI_DICTIONARY.
 */
export function translate(
  keyOrText: string,
  lang: string = MASTER_LANGUAGE_CODE,
  params?: Record<string, string | number>
): string {
  if (!keyOrText) return '';

  const normalizedLang = (lang || MASTER_LANGUAGE_CODE).toLowerCase();

  // 1. Direct check in target language dictionary
  const targetDict = dictionaries[normalizedLang];
  if (targetDict && targetDict[keyOrText] !== undefined) {
    return interpolate(targetDict[keyOrText], params);
  }

  // 2. Direct check in CORE_UI_DICTIONARY (instant-switch cache from languages.ts)
  const coreDict = CORE_UI_DICTIONARY[normalizedLang];
  if (coreDict && coreDict[keyOrText] !== undefined) {
    return interpolate(coreDict[keyOrText], params);
  }

  // 3. If English (master) requested, check en dictionary
  if (normalizedLang === MASTER_LANGUAGE_CODE || normalizedLang === 'english') {
    if (en[keyOrText] !== undefined) {
      return interpolate(en[keyOrText], params);
    }
    return interpolate(keyOrText, params);
  }

  // 4. Fallback to English dictionary if key exists there
  if (en[keyOrText] !== undefined) {
    return interpolate(en[keyOrText], params);
  }

  // 5. Default back to keyOrText with interpolated params
  return interpolate(keyOrText, params);
}

export default translate;
