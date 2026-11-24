import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  User, 
  Mail, 
  GraduationCap, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle,
  Sparkles,
  Rocket,
  Zap
} from 'lucide-react';
import { soundManager } from '../lib/sounds';
import { 
  supabase, 
  isSupabaseConfigured, 
  getProfile, 
  updateProfile, 
  createOrEnsureProfile, 
  clearProfileCache, 
  clearUserSessionData 
} from '../lib/supabase';
import { progressService } from '../lib/progressService';
import { syncUserProfileToServer, trackEvent } from '../lib/intelligence';
import ChikooOnboarding, { OnboardingAnswers } from './ChikooOnboarding';

async function hashCredential(text: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${text}:chikoo_auth_v1`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface AuthScreenProps {
  onLoginSuccess: (email: string, isNewSignup?: boolean) => void;
  onboardingEmail?: string;
  initialMode?: 'signup' | 'login' | 'onboarding';
  onBackToLanding?: () => void;
}

export default function AuthScreen({ onLoginSuccess, onboardingEmail, initialMode, onBackToLanding }: AuthScreenProps) {
  // Mode can be: 'signup' (email signup entry), 'login' (email login entry), 'onboarding' (onboarding steps)
  const [flowMode, setFlowMode] = useState<'signup' | 'login' | 'onboarding'>(() => {
    if (onboardingEmail) return 'onboarding';
    if (initialMode) return initialMode;
    return 'signup';
  });

  // Onboarding steps: 1 = Name, 2 = School, 3 = Grade, 4 = Learning Style, 5 = Ready/Success
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Form states
  const [name, setName] = useState<string>('');
  const [school, setSchool] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [learningStyle, setLearningStyle] = useState<string>('');
  const [email, setEmail] = useState<string>(onboardingEmail || '');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // School Suggestions
  const schoolSuggestions = [
    "Greenwood High", 
    "Oakridge Academy", 
    "Delhi Public School", 
    "St. Mary's School", 
    "Stanford Prep"
  ];

  // Learning Styles
  const learningStylesList = [
    { id: 'videos', title: "🎥 Videos", subtitle: "Visual quests" },
    { id: 'interactive', title: "🎮 Interactive", subtitle: "Hands-on labs" },
    { id: 'reading', title: "📖 Reading", subtitle: "Lore & guides" },
    { id: 'practice', title: "⚡ Practice", subtitle: "Bite-sized battles" }
  ];

  // Primary action click on Entry Form
  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMsg('');

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      soundManager.play('incorrect');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      soundManager.play('incorrect');
      return;
    }

    if (flowMode === 'signup') {
      if (!name.trim()) {
        setErrorMsg('Please enter your name.');
        soundManager.play('incorrect');
        return;
      }
      setIsLoading(true);
      soundManager.play('pop');

      // Clear any stale local cached data for this email
      clearUserSessionData(cleanEmail);

      if (isSupabaseConfigured && supabase) {
        try {
          console.log("[Auth Trace] Calling supabase.auth.signUp for:", cleanEmail);
          const { data: signUpData, error: authErr } = await supabase.auth.signUp({
            email: cleanEmail,
            password: password,
            options: {
              data: {
                username: name.trim() || cleanEmail.split('@')[0]
              }
            }
          });

          if (authErr) {
            console.error("[Supabase Auth Signup Technical Error]:", authErr);
            const msg = (authErr.message || '').toLowerCase();
            const code = authErr.code || '';

            if (msg.includes('failed to fetch') || msg.includes('fetch') || msg.includes('network')) {
              console.warn("[Auth Trace] Supabase signup network/fetch error. Falling back to local onboarding.");
              hashCredential(password, cleanEmail).then(h => {
                localStorage.setItem(`CHIKOO_USER_PWD_HASH_${cleanEmail}`, h);
                localStorage.removeItem(`CHIKOO_USER_PASSWORD_${cleanEmail}`);
              });
              localStorage.setItem(`CHIKOO_USER_NICKNAME_${cleanEmail}`, name.trim() || cleanEmail.split('@')[0]);
              setIsLoading(false);
              setFlowMode('onboarding');
              setOnboardingStep(1);
              return;
            }

            if (
              code === 'user_already_exists' ||
              msg.includes('already registered') ||
              msg.includes('already exists') ||
              msg.includes('already in use') ||
              msg.includes('user_already_exists')
            ) {
              console.log("[Auth Trace] Existing account detected via authErr.");
              setErrorMsg('Account already exists. Please log in.');
              soundManager.play('incorrect');
              setFlowMode('login');
              setIsLoading(false);
              return;
            }

            if (msg.includes('password') || msg.includes('weak') || code === 'weak_password') {
              setErrorMsg('Password must be at least 8 characters.');
              soundManager.play('incorrect');
              setIsLoading(false);
              return;
            }

            setErrorMsg('Sign up failed. Please try again.');
            soundManager.play('incorrect');
            setIsLoading(false);
            return;
          }

          if (signUpData?.user) {
            if (Array.isArray(signUpData.user.identities) && signUpData.user.identities.length === 0) {
              console.log("[Auth Trace] Existing user detected via empty identities list.");
              setErrorMsg('Account already exists. Please log in.');
              soundManager.play('incorrect');
              setFlowMode('login');
              setIsLoading(false);
              return;
            }

            if (signUpData.session) {
              console.log("[Auth Trace] Auth signup result: Success. User ID:", signUpData.session.user.id);

              const initialUsername = name.trim() || cleanEmail.split('@')[0];
              await createOrEnsureProfile(signUpData.session.user.id, cleanEmail, {
                username: initialUsername
              });

              await progressService.initProfile(cleanEmail, true);

              setIsLoading(false);
              setFlowMode('onboarding');
              setOnboardingStep(1);
              return;
            } else {
              console.log("[Auth Trace] Auth signup result: Unconfirmed Email");

              try {
                await createOrEnsureProfile(signUpData.user.id, cleanEmail, {
                  username: name.trim() || cleanEmail.split('@')[0]
                });
              } catch (e) {
                console.warn("[Auth Trace] Non-blocking unconfirmed profile pre-init:", e);
              }

              setErrorMsg('Account created! Please verify your email to begin.');
              soundManager.play('pop');
              setFlowMode('login');
              setIsLoading(false);
              return;
            }
          }
        } catch (err: any) {
          console.error("[Supabase Auth Signup Exception]:", err);
          setErrorMsg('Sign up failed. Please try again.');
          soundManager.play('incorrect');
          setIsLoading(false);
          return;
        }
      } else {
        // Fallback for environment without Supabase credentials configured
        setIsLoading(false);
        setFlowMode('onboarding');
        setOnboardingStep(1);
      }
    } else {
      // Login flow
      setIsLoading(true);
      soundManager.play('pop');

      try {
        if (isSupabaseConfigured && supabase) {
          const { data: signInData, error: authErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: password
          });

          if (authErr) {
            console.error("[Supabase Login Technical Error]:", authErr);
            const msg = (authErr.message || '').toLowerCase();

            if (msg.includes('failed to fetch') || msg.includes('fetch') || msg.includes('network')) {
              console.warn("[Auth Trace] Supabase login fetch/network error. Checking local credentials fallback.");
              const savedHash = localStorage.getItem(`CHIKOO_USER_PWD_HASH_${cleanEmail}`);
              const legacyPass = localStorage.getItem(`CHIKOO_USER_PASSWORD_${cleanEmail}`);
              const currentHash = await hashCredential(password, cleanEmail);

              if (savedHash || legacyPass) {
                if (savedHash === currentHash || legacyPass === password) {
                  console.log("[Auth Trace] Local credentials confirmed after network fetch failure.");
                  localStorage.removeItem(`CHIKOO_USER_PASSWORD_${cleanEmail}`);
                  localStorage.setItem(`CHIKOO_USER_PWD_HASH_${cleanEmail}`, currentHash);
                  localStorage.setItem(`chikoo_onboarding_completed_${cleanEmail}`, 'true');
                  localStorage.setItem(`chikoo_welcome_video_seen_${cleanEmail}`, 'true');
                  localStorage.removeItem(`chikoo_new_signup_${cleanEmail}`);
                  localStorage.setItem('CHIKOO_SESSION_USER', cleanEmail);
                  setIsLoading(false);
                  onLoginSuccess(cleanEmail, false);
                  return;
                } else {
                  setErrorMsg('Incorrect email or password.');
                  soundManager.play('incorrect');
                  setIsLoading(false);
                  return;
                }
              }
              // If no saved local password exists, log them in or show clear network message
              localStorage.setItem(`chikoo_onboarding_completed_${cleanEmail}`, 'true');
              localStorage.setItem(`chikoo_welcome_video_seen_${cleanEmail}`, 'true');
              localStorage.removeItem(`chikoo_new_signup_${cleanEmail}`);
              localStorage.setItem('CHIKOO_SESSION_USER', cleanEmail);
              setIsLoading(false);
              onLoginSuccess(cleanEmail, false);
              return;
            }

            if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
              setErrorMsg('Please verify your email before logging in.');
            } else if (
              msg.includes('invalid login credentials') || 
              msg.includes('invalid_credentials') || 
              msg.includes('wrong') || 
              msg.includes('password')
            ) {
              setErrorMsg('Incorrect email or password.');
            } else {
              setErrorMsg('Log in failed. Please try again.');
            }
            soundManager.play('incorrect');
            setIsLoading(false);
            return;
          }

          if (signInData?.session) {
            console.log("[Auth Trace] Login result: Success. User ID:", signInData.session.user.id);

            const profile = await getProfile(cleanEmail);

            const hasCompletedOnboarding = 
              localStorage.getItem(`chikoo_onboarding_completed_${cleanEmail}`) === 'true' ||
              !!localStorage.getItem(`CHIKOO_USER_REASON_${cleanEmail}`) ||
              profile?.onboarding_completed === true;

            if (!hasCompletedOnboarding) {
              console.log("[Auth Trace] User logged in but has not completed onboarding. Directing to ChikooOnboarding.");
              setEmail(cleanEmail);
              if (profile?.username) {
                setName(profile.username);
              }
              setIsLoading(false);
              setFlowMode('onboarding');
              return;
            }

            localStorage.setItem(`chikoo_onboarding_completed_${cleanEmail}`, 'true');

            if (!localStorage.getItem(`CHIKOO_USER_NICKNAME_${cleanEmail}`)) {
              localStorage.setItem(`CHIKOO_USER_NICKNAME_${cleanEmail}`, profile?.username || cleanEmail.split('@')[0]);
            }

            localStorage.setItem(`chikoo_welcome_video_seen_${cleanEmail}`, 'true');
            localStorage.removeItem(`chikoo_new_signup_${cleanEmail}`);

            localStorage.setItem('CHIKOO_SESSION_USER', cleanEmail);
            clearProfileCache(cleanEmail);
            setIsLoading(false);
            onLoginSuccess(cleanEmail, false);
            return;
          }
        } else {
          // Local storage verification fallback
          const savedPass = localStorage.getItem(`CHIKOO_USER_PASSWORD_${cleanEmail}`);
          if (savedPass && savedPass !== password) {
            setErrorMsg('Incorrect email or password.');
            soundManager.play('incorrect');
            setIsLoading(false);
            return;
          }
        }

        localStorage.setItem(`chikoo_welcome_video_seen_${cleanEmail}`, 'true');
        localStorage.removeItem(`chikoo_new_signup_${cleanEmail}`);
        localStorage.setItem('CHIKOO_SESSION_USER', cleanEmail);
        setIsLoading(false);
        onLoginSuccess(cleanEmail, false);
      } catch (err: any) {
        console.error("[Login Exception]:", err);
        const msg = (err?.message || '').toLowerCase();
        if (msg.includes('failed to fetch') || msg.includes('fetch') || msg.includes('network')) {
          console.warn("[Auth Trace] Network exception during login. Falling back to session establishment.");
          localStorage.setItem(`chikoo_onboarding_completed_${cleanEmail}`, 'true');
          localStorage.setItem(`chikoo_welcome_video_seen_${cleanEmail}`, 'true');
          localStorage.removeItem(`chikoo_new_signup_${cleanEmail}`);
          localStorage.setItem('CHIKOO_SESSION_USER', cleanEmail);
          setIsLoading(false);
          onLoginSuccess(cleanEmail, false);
          return;
        }
        setErrorMsg('Log in failed. Please try again.');
        soundManager.play('incorrect');
        setIsLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    soundManager.play('pop');
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) {
          console.error("[Google OAuth Error]:", error);
          setErrorMsg('Google login failed. Please try again.');
          soundManager.play('incorrect');
        }
      } catch (err: any) {
        console.error("[Google OAuth Exception]:", err);
        setErrorMsg('Google login failed. Please try again.');
        soundManager.play('incorrect');
      }
    } else {
      // Simulate Google OAuth
      setIsLoading(true);
      setTimeout(() => {
        const dummyEmail = "google.explorer@gmail.com";
        setEmail(dummyEmail);
        setFlowMode('onboarding');
        setOnboardingStep(1);
        setIsLoading(false);
      }, 800);
    }
  };

  // Onboarding Complete Handler
  const handleOnboardingComplete = async (answers: OnboardingAnswers) => {
    setIsLoading(true);
    setErrorMsg('');
    soundManager.play('complete');
    const cleanEmail = (email || onboardingEmail || '').toLowerCase().trim();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUserId = sessionData?.session?.user?.id;

        if (currentUserId) {
          await createOrEnsureProfile(currentUserId, cleanEmail, {
            username: answers.name || cleanEmail.split('@')[0]
          });
        }

        await updateProfile(cleanEmail, { 
          username: answers.name || undefined,
          onboarding_completed: true
        });

        // Persist onboarding status and answers into auth.users user_metadata as source of truth
        try {
          await supabase.auth.updateUser({
            data: {
              onboarding_completed: true,
              onboarding_answers: answers,
              username: answers.name || cleanEmail.split('@')[0]
            }
          });
        } catch (metaErr) {
          console.warn("[Onboarding] Could not update auth user_metadata:", metaErr);
        }

        await progressService.initProfile(cleanEmail, true);
      } catch (err: any) {
        console.error("[Onboarding Profile Update Error]:", err);
        setErrorMsg('Failed to save onboarding data. Please check connection and try again.');
        soundManager.play('incorrect');
        setIsLoading(false);
        return; // Do NOT mark complete if save fails!
      }
    }

    // Save variables in local storage & mark onboarding complete
    localStorage.setItem(`chikoo_onboarding_completed_${cleanEmail}`, 'true');
    localStorage.setItem(`CHIKOO_USER_NICKNAME_${cleanEmail}`, answers.name);
    localStorage.setItem(`CHIKOO_USER_REASON_${cleanEmail}`, answers.reason);
    localStorage.setItem(`CHIKOO_USER_KNOWLEDGE_${cleanEmail}`, answers.knowledge);
    localStorage.setItem(`CHIKOO_USER_DAILY_TIME_${cleanEmail}`, answers.dailyTime);
    localStorage.setItem(`CHIKOO_USER_INTERESTS_${cleanEmail}`, JSON.stringify(answers.interests));
    localStorage.setItem(`CHIKOO_USER_LEARNING_STYLE_${cleanEmail}`, answers.learningStyle);
    localStorage.setItem(`CHIKOO_USER_GOAL_${cleanEmail}`, answers.goal);
    localStorage.setItem(`CHIKOO_ONBOARDING_DATA_${cleanEmail}`, JSON.stringify(answers));

    if (password) {
      hashCredential(password, cleanEmail).then(h => {
        localStorage.setItem(`CHIKOO_USER_PWD_HASH_${cleanEmail}`, h);
        localStorage.removeItem(`CHIKOO_USER_PASSWORD_${cleanEmail}`);
      });
    }

    try {
      await syncUserProfileToServer({
        email: cleanEmail,
        username: answers.name,
        learningStyle: answers.learningStyle
      });
      trackEvent('Onboarding Completed', answers as any, cleanEmail);
    } catch (analyticsErr) {
      console.warn("Analytics onboarding sync warning:", analyticsErr);
    }

    localStorage.setItem(`chikoo_new_signup_${cleanEmail}`, 'true');
    localStorage.setItem(`chikoo_welcome_video_seen_${cleanEmail}`, 'false');
    localStorage.setItem('CHIKOO_SESSION_USER', cleanEmail);
    clearProfileCache(cleanEmail);

    onLoginSuccess(cleanEmail, true);
    setIsLoading(false);
  };

  if (flowMode === 'onboarding') {
    return (
      <ChikooOnboarding
        email={email || onboardingEmail || ''}
        initialName={name}
        onComplete={handleOnboardingComplete}
        onBackToAuth={() => {
          if (onboardingEmail && isSupabaseConfigured && supabase) {
            supabase.auth.signOut();
          }
          localStorage.removeItem('CHIKOO_SESSION_USER');
          setFlowMode('signup');
        }}
      />
    );
  }

  const isSignUp = flowMode === 'signup';

  return (
    <div 
      id="chikoo-auth-container"
      className="fixed inset-0 w-full h-full flex flex-col justify-between overflow-y-auto overflow-x-hidden bg-[#70c7fa] text-slate-900 z-[999] select-none font-sans"
    >
      {/* 1. GAME-WORLD SCENERY BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <img 
          src="/chikoo-bg.webp" 
          alt="Chikoo Background" 
          className="w-full h-full object-cover object-center select-none pointer-events-none"
          referrerPolicy="no-referrer"
        />
        {/* Soft atmospheric gradient for text and card legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/15 via-sky-800/10 to-sky-950/30 pointer-events-none" />
      </div>

      {/* 2. TOP BAR */}
      <header className="relative z-30 w-full max-w-sm sm:max-w-md mx-auto px-4 pt-3.5 flex items-center justify-between min-h-[44px]">
        {onBackToLanding ? (
          <div className="w-full flex items-center justify-between">
            <button
              id="auth-back-to-landing-btn"
              type="button"
              onClick={onBackToLanding}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-sky-600 text-xs font-bold shadow-sm border border-slate-200 transition-all cursor-pointer"
            >
              <ChevronLeft size={16} className="stroke-[2.5]" />
              <span>Back to Chikoo</span>
            </button>
          </div>
        ) : (
          <div className="w-full h-2" />
        )}
      </header>

      {/* 3. MAIN CENTERED CARD CONTAINER */}
      <main className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto px-4 py-2 my-auto flex flex-col items-center">
        
        {/* CLEAN, WELL-STRUCTURED AUTH CARD */}
        <div 
          id="auth-card"
          className="w-full bg-white/95 rounded-3xl p-6 sm:p-7 shadow-[0_16px_48px_rgba(15,23,42,0.18)] border border-sky-100"
        >
          {/* TOP SEGMENTED TOGGLE (Sign Up / Log In) */}
          <div className="flex p-1 bg-slate-100/90 rounded-2xl mb-5 border border-slate-200/60">
            <button
              type="button"
              id="tab-signup-btn"
              onClick={() => {
                if (!isSignUp) {
                  soundManager.play('click');
                  setFlowMode('signup');
                  setErrorMsg('');
                }
              }}
              className={`flex-1 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                isSignUp 
                  ? 'bg-white text-slate-900 shadow-sm font-extrabold' 
                  : 'text-slate-500 hover:text-slate-800 font-semibold'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              id="tab-login-btn"
              onClick={() => {
                if (isSignUp) {
                  soundManager.play('click');
                  setFlowMode('login');
                  setErrorMsg('');
                }
              }}
              className={`flex-1 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                !isSignUp 
                  ? 'bg-white text-slate-900 shadow-sm font-extrabold' 
                  : 'text-slate-500 hover:text-slate-800 font-semibold'
              }`}
            >
              Log In
            </button>
          </div>

          {/* HEADINGS */}
          <div className="text-center mb-5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {isSignUp ? "Start Your Adventure 🚀" : "Welcome Back! 👋"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {isSignUp ? "Create your Chikoo account" : "Continue your adventure"}
            </p>
          </div>

          {/* FORM AREA */}
          <AnimatePresence mode="wait">
            <motion.form
              key={flowMode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
                onSubmit={handleEntrySubmit}
                className="space-y-3.5"
              >
                {/* NAME INPUT (SIGN UP ONLY) */}
                {isSignUp && (
                  <div className="relative flex items-center h-12 rounded-2xl bg-slate-50/90 border border-slate-200 hover:border-sky-300 focus-within:border-sky-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100 transition-all">
                    <div className="w-11 flex items-center justify-center text-slate-400 shrink-0">
                      <User size={18} className="stroke-[2]" />
                    </div>
                    <input 
                      id="auth-name-input"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrorMsg('');
                      }}
                      className="w-full h-full bg-transparent border-none outline-none text-sm font-semibold text-slate-800 pr-4 placeholder:text-slate-400"
                    />
                  </div>
                )}

                {/* EMAIL INPUT */}
                <div className="relative flex items-center h-12 rounded-2xl bg-slate-50/90 border border-slate-200 hover:border-sky-300 focus-within:border-sky-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100 transition-all">
                  <div className="w-11 flex items-center justify-center text-slate-400 shrink-0">
                    <Mail size={18} className="stroke-[2]" />
                  </div>
                  <input 
                    id="auth-email-input"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMsg('');
                    }}
                    className="w-full h-full bg-transparent border-none outline-none text-sm font-semibold text-slate-800 pr-4 placeholder:text-slate-400"
                  />
                </div>

                {/* PASSWORD INPUT */}
                <div className="relative flex items-center h-12 rounded-2xl bg-slate-50/90 border border-slate-200 hover:border-sky-300 focus-within:border-sky-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100 transition-all">
                  <div className="w-11 flex items-center justify-center text-slate-400 shrink-0">
                    <Lock size={18} className="stroke-[2]" />
                  </div>
                  <input 
                    id="auth-password-input"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    placeholder={isSignUp ? "Password (8+ characters)" : "Password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg('');
                    }}
                    className="w-full h-full bg-transparent border-none outline-none text-sm font-semibold text-slate-800 pr-11 placeholder:text-slate-400"
                  />
                  <button 
                    type="button"
                    id="auth-toggle-password-btn"
                    onClick={() => {
                      soundManager.play('click');
                      setShowPassword(!showPassword);
                    }}
                    className="absolute right-3 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* PRIMARY CTA BUTTON */}
                <div className="pt-1">
                  <button
                    id="auth-submit-btn"
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold text-sm uppercase tracking-wider shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        <span>{isSignUp ? "LET’S GO!" : "CONTINUE"}</span>
                        {isSignUp ? (
                          <Rocket size={17} className="stroke-[2.5]" />
                        ) : (
                          <Zap size={17} className="stroke-[2.5] fill-amber-300 text-amber-200" />
                        )}
                      </>
                    )}
                  </button>
                </div>

                {/* CLEAN OR DIVIDER */}
                <div className="relative py-1 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <span className="relative px-3 bg-white text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                    or
                  </span>
                </div>

                {/* GOOGLE SIGN-IN BUTTON */}
                <button
                  id="auth-google-btn"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full h-11 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm hover:shadow active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2.5"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.5 15 1 12 1 7.3 1 3.4 3.7 1.5 7.6l3.9 3C6.3 7.8 8.9 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.4 10.6c-.3-.8-.4-1.7-.4-2.6s.1-1.8.4-2.6L1.5 2.4C.5 4.4 0 6.6 0 9s.5 4.6 1.5 6.6l3.9-3z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.1-4.3 1.1-3.1 0-5.7-2.8-6.6-5.6l-3.9 3C3.4 19.3 7.3 23 12 23z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </motion.form>
          </AnimatePresence>
        </div>

        {/* ERROR DISPLAY (FIXED-HEIGHT TO AVOID LAYOUT SHIFT) */}
        <div className="h-7 mt-2 flex items-center justify-center w-full">
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold shadow-sm"
              >
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM SWITCH LINK */}
        <div className="text-center">
            <button 
              id="auth-mode-switch-btn"
              type="button"
              onClick={() => {
                soundManager.play('click');
                setFlowMode(isSignUp ? 'login' : 'signup');
                setErrorMsg('');
              }}
              className="text-white/90 hover:text-white drop-shadow-sm text-xs font-semibold transition-all cursor-pointer py-1"
            >
              {isSignUp ? (
                <>Already have an account? <span className="text-white font-black underline underline-offset-2">Log In</span></>
              ) : (
                <>Don't have an account? <span className="text-white font-black underline underline-offset-2">Sign Up</span></>
              )}
            </button>
          </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto px-4 pb-4 text-center">
        <div className="flex items-center justify-center gap-4 text-slate-300 text-xs font-semibold drop-shadow">
          <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="/delete-account" className="hover:text-white transition-colors">Account Deletion</a>
        </div>
      </footer>
    </div>
  );
}
