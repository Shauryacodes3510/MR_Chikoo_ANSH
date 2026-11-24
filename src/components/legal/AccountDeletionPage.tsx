import React, { useState } from 'react';
import { UserX, ArrowLeft, Trash2, Mail, ShieldAlert, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '../AuthProvider';
import { supabase } from '../../lib/supabase';

interface AccountDeletionPageProps {
  onLaunchApp?: () => void;
}

export default function AccountDeletionPage({ onLaunchApp }: AccountDeletionPageProps) {
  const { sessionUser, authUserId, logout } = useAuth();
  
  // Direct deletion state for logged in user
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionSuccess, setDeletionSuccess] = useState(false);
  const [directError, setDirectError] = useState('');

  // Unauthenticated deletion request state
  const [requestEmail, setRequestEmail] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [requestError, setRequestError] = useState('');

  const handleGoHome = () => {
    if (onLaunchApp) {
      onLaunchApp();
    } else {
      window.location.href = '/';
    }
  };

  // Process direct in-app account deletion for active session
  const handleDirectDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectError('');

    if (!sessionUser) return;
    if (confirmInput.trim().toLowerCase() !== 'delete') {
      setDirectError('Please type "DELETE" into the confirmation box.');
      return;
    }

    setIsDeleting(true);

    try {
      let authToken = localStorage.getItem('CHIKOO_SESSION_TOKEN') || '';
      if (supabase) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.access_token) {
            authToken = sessionData.session.access_token;
          }
        } catch (_) {}
      }

      if (!authToken) {
        setDirectError('Active authentication required. Please sign in to verify account deletion.');
        return;
      }

      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await res.json();
      if (data.success) {
        setDeletionSuccess(true);
        // Clear local storage and logout after 2 seconds
        setTimeout(() => {
          localStorage.clear();
          logout();
          window.location.href = '/';
        }, 2000);
      } else {
        setDirectError(data.error || 'Failed to delete account. Please try again or submit a manual request below.');
      }
    } catch (err: any) {
      console.error("Direct deletion error:", err);
      setDirectError('Server communication error. Please use the Deletion Request Form below.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Submit manual deletion request ticket
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError('');

    const cleanEmail = requestEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setRequestError('Please enter a valid email address.');
      return;
    }

    setIsSubmittingRequest(true);

    try {
      const res = await fetch('/api/account/request-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          reason: requestReason.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setTicketId(data.ticketId || `DEL-CHK-${Math.floor(100000 + Math.random() * 900000)}`);
      } else {
        setRequestError(data.error || 'Failed to submit request. Please try again.');
      }
    } catch (err) {
      console.error("Deletion request error:", err);
      setRequestError('Network error while submitting request. Please try again.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleGoHome}>
            <img src="/avatar.webp" alt="Chikoo" className="w-9 h-9 rounded-full border border-red-500/40" />
            <div>
              <span className="font-black text-lg text-white tracking-wide">Chikoo</span>
              <span className="block text-[10px] text-red-400 uppercase tracking-widest font-semibold">Account & Data Removal Center</span>
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold mb-4">
            <UserX size={14} />
            <span>Google Play Policy Compliant Account Deletion</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
            Account & Personal Data Deletion
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
            You have full control over your Chikoo profile and learning records. You can permanently delete your account directly inside the app if logged in, or request deletion using our public web form below.
          </p>
        </div>

        {/* SECTION 1: Direct Deletion if Logged In */}
        {sessionUser && (
          <div className="mb-12 p-6 sm:p-8 bg-red-950/20 border border-red-500/30 rounded-3xl shadow-xl">
            <div className="flex items-center gap-3 mb-4 text-red-400 font-bold text-xl">
              <Trash2 size={24} />
              <h2>Direct In-App Account Deletion</h2>
            </div>
            <p className="text-slate-300 text-sm mb-6">
              You are currently logged in as <strong className="text-white">{typeof sessionUser === 'string' ? sessionUser : ''}</strong>.
              Executing direct deletion will instantly remove your profile, XP, streaks, unlocked rewards, and saved progress.
            </p>

            {deletionSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
                <CheckCircle2 size={20} className="shrink-0" />
                <span>Account and data successfully deleted. Redirecting...</span>
              </div>
            ) : (
              <form onSubmit={handleDirectDelete} className="space-y-4 max-w-md">
                {directError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{directError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Type "DELETE" to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    placeholder="DELETE"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isDeleting || confirmInput.trim().toLowerCase() !== 'delete'}
                  className="w-full px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Trash2 size={18} />
                  <span>{isDeleting ? 'Deleting Account...' : 'Permanently Delete My Account'}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* SECTION 2: Web Deletion Request Form (Accessible to anyone without login) */}
        <div className="mb-12 p-6 sm:p-8 bg-slate-900/70 border border-slate-800 rounded-3xl">
          <div className="flex items-center gap-3 mb-4 text-sky-400 font-bold text-xl">
            <Mail size={24} />
            <h2>Web Deletion Request Form (No Login Required)</h2>
          </div>
          <p className="text-slate-300 text-sm mb-6">
            If you no longer have access to the app or prefer to request account deletion manually, submit your registered account email address below. Our support team processes all requests within 48 hours.
          </p>

          {ticketId ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <CheckCircle2 size={20} />
                <span>Deletion Request Submitted Successfully</span>
              </div>
              <p className="text-xs text-slate-300">
                Your request reference ticket ID is: <strong className="font-mono text-white text-sm bg-slate-950 px-2.5 py-1 rounded border border-slate-800">{ticketId}</strong>
              </p>
              <p className="text-xs text-slate-400">
                A confirmation has been logged for <strong className="text-slate-200">{requestEmail}</strong>. Associated personal data will be completely scrubbed within 48 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRequestSubmit} className="space-y-4 max-w-lg">
              {requestError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{requestError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Account Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Reason for Deletion (Optional)
                </label>
                <textarea
                  rows={3}
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Tell us why you're leaving or any feedback..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingRequest}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
              >
                {isSubmittingRequest ? 'Submitting Ticket...' : 'Submit Deletion Request'}
              </button>
            </form>
          )}
        </div>

        {/* SECTION 3: Detailed Information & Data Policy */}
        <div className="space-y-8 text-slate-300 text-sm leading-relaxed border-t border-slate-800 pt-8">
          
          <div>
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <ShieldAlert size={18} className="text-sky-400" />
              What Data Gets Deleted?
            </h3>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-300 text-xs sm:text-sm">
              <li><strong className="text-white">Account Profile:</strong> User email, hashed password, display name, avatar, and settings.</li>
              <li><strong className="text-white">Learning History:</strong> Completed units, node progress, quiz attempt scores, XP logs, and streak metrics.</li>
              <li><strong className="text-white">Gamification Rewards:</strong> Cosmic cookies, energy states, claim logs, and leaderboard rankings.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <HelpCircle size={18} className="text-sky-400" />
              Retained Data & Legal Exceptions
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              When an account is deleted, we scrub all personal identifiers. Non-personally identifiable, aggregated analytical statistics (e.g. overall lesson completion metrics) may be retained for platform improvement. Server access security logs may be retained for up to 30 days before automatic purge.
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Mail size={18} className="text-sky-400" />
              Manual Contact Support
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              If you experience any issues deleting your account or have specific privacy requests, reach out directly to our privacy officer at <a href="mailto:shauryatalks25@gmail.com" className="text-sky-400 underline font-medium">shauryatalks25@gmail.com</a> or <a href="mailto:support@chikoo.ai" className="text-sky-400 underline font-medium">support@chikoo.ai</a>.
            </p>
          </div>

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
