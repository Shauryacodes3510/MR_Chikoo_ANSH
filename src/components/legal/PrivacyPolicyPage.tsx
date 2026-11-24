import React from 'react';
import { Shield, ArrowLeft, Mail, Lock, CheckCircle2, FileText, Database, UserX, Eye } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onLaunchApp?: () => void;
}

export default function PrivacyPolicyPage({ onLaunchApp }: PrivacyPolicyPageProps) {
  const handleGoHome = () => {
    if (onLaunchApp) {
      onLaunchApp();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleGoHome}>
            <img src="/avatar.webp" alt="Chikoo" className="w-9 h-9 rounded-full border border-sky-400/40" />
            <div>
              <span className="font-black text-lg text-white tracking-wide">Chikoo</span>
              <span className="block text-[10px] text-sky-400 uppercase tracking-widest font-semibold">Legal & Privacy Center</span>
            </div>
          </div>
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-700"
          >
            <ArrowLeft size={16} />
            <span>Back to Chikoo</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Header */}
        <div className="mb-12 text-center sm:text-left border-b border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold mb-4">
            <Shield size={14} />
            <span>Official Privacy Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
            At Chikoo, we are committed to providing a safe, transparent, and educational environment for students and learners. This Privacy Policy details how we collect, store, protect, and handle your data.
          </p>
          <div className="mt-4 text-xs text-slate-500 font-mono">
            Last updated: October 26, 2026 • Version 1.2
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-10 text-slate-300 text-sm leading-relaxed">
          
          {/* Section 1 */}
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4 text-sky-400 font-bold text-lg">
              <Eye size={22} className="shrink-0" />
              <h2>1. Information We Collect</h2>
            </div>
            <p className="mb-4">
              To operate Chikoo effectively and deliver personalized AI educational experiences, we collect minimal necessary information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>
                <strong className="text-white">Account Information:</strong> Username or nickname, email address, password hash (managed securely via Supabase Auth), grade level, and selected avatar preference.
              </li>
              <li>
                <strong className="text-white">Learning & Academic Progress:</strong> Completed units, lesson node states, challenge scores, XP earned, energy status, streak logs, weekly leaderboard standings, and badge unlocks.
              </li>
              <li>
                <strong className="text-white">Technical & Usage Logs:</strong> Anonymized device telemetry, browser type, diagnostic error logs, and session durations to monitor app stability and performance.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4 text-sky-400 font-bold text-lg">
              <Shield size={22} className="shrink-0" />
              <h2>2. Children's & Student Data Protections</h2>
            </div>
            <p className="mb-4">
              Chikoo is designed for students aged 10-18. We strictly prioritize young learners' safety in alignment with COPPA and global youth privacy standards:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li><strong className="text-white">No Ads or Third-Party Tracking:</strong> We never display third-party advertisements or use tracking pixels for targeted marketing.</li>
              <li><strong className="text-white">No Selling of Personal Data:</strong> Student data is never sold, rented, or commercialized to third parties under any circumstances.</li>
              <li><strong className="text-white">School & Classroom Privacy:</strong> For school accounts, student learning data is visible only to authorized school administrators and teachers associated with their institution.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4 text-sky-400 font-bold text-lg">
              <FileText size={22} className="shrink-0" />
              <h2>3. How We Use Your Data</h2>
            </div>
            <p className="mb-4">We process information exclusively for legitimate educational and platform operational purposes:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Delivering interactive AI micro-lessons, gamified practice challenges, and adaptive feedback.</li>
              <li>Synchronizing your learning progress, energy recharge timers, cosmic cookies, and leaderboard rankings across devices.</li>
              <li>Providing micro-explanations through our AI Otter mascot (Chikoo).</li>
              <li>Diagnosing technical bugs, preventing abuse, and ensuring server security.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4 text-sky-400 font-bold text-lg">
              <Database size={22} className="shrink-0" />
              <h2>4. Third-Party Services & Infrastructure</h2>
            </div>
            <p className="mb-4">We use trusted infrastructure providers to securely host and power the platform:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li><strong className="text-white">Supabase:</strong> Provides encrypted database storage (TLS 1.3 / AES-256) and user authentication.</li>
              <li><strong className="text-white">Google Gemini API:</strong> Generates interactive micro-explanations and quiz feedback server-side. No personal student identifiers are transmitted to AI API prompts.</li>
              <li><strong className="text-white">Vite / Cloud Hosting:</strong> Secure web application delivery and static asset caching.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4 text-sky-400 font-bold text-lg">
              <Lock size={22} className="shrink-0" />
              <h2>5. Data Storage, Security & Retention</h2>
            </div>
            <p className="mb-3">
              All data transmitted between your device and Chikoo servers is encrypted in transit using industry-standard SSL/TLS protocols.
            </p>
            <p className="mb-3">
              We retain user account information and learning records for as long as your account remains active or until you request account deletion.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4 text-sky-400 font-bold text-lg">
              <UserX size={22} className="shrink-0" />
              <h2>6. Your Data Rights & Deletion</h2>
            </div>
            <p className="mb-4">
              You maintain full control over your personal data. Users have the right to access, export, or permanently delete their Chikoo account and associated information at any time.
            </p>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-bold text-white">Need to delete your account?</p>
                <p className="text-xs text-slate-400">Visit our dedicated Account Deletion portal for immediate processing or deletion requests.</p>
              </div>
              <a
                href="/delete-account"
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs transition-all"
              >
                Go to Account Deletion →
              </a>
            </div>
          </section>

          {/* Section 7 */}
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4 text-sky-400 font-bold text-lg">
              <Mail size={22} className="shrink-0" />
              <h2>7. Contact Us & Support</h2>
            </div>
            <p className="mb-4">
              If you have any questions, concerns, or data inquiries regarding this Privacy Policy, please contact our privacy support team:
            </p>
            <div className="space-y-2 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div><strong className="text-slate-400">Email Contact:</strong> shauryatalks25@gmail.com</div>
              <div><strong className="text-slate-400">Support Desk:</strong> support@chikoo.ai</div>
              <div><strong className="text-slate-400">Platform:</strong> Chikoo AI Learning Platform</div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/40 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} Chikoo. All rights reserved.</span>
          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <a href="/privacy-policy" className="hover:text-sky-400 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="/delete-account" className="hover:text-sky-400 transition-colors">Account Deletion</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
