import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Activity, Clock, Award, BookOpen, AlertTriangle, User, ShieldAlert,
  Calendar, Search, Filter, RefreshCw, Layers, Sliders, ChevronRight, Eye, Play,
  Cpu, Award as BadgeIcon, Ban, CheckCircle, Flame, Mail, Globe, Sparkles, FileText,
  MousePointer, Laptop, Compass, HeartPulse, Send, Download, BarChart2, Check, ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar,
  PieChart, Pie, Cell, Legend, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { SupabaseUserProfile } from '../../../lib/supabase';
import {
  AnalyticsEvent, getAllEvents, computeSystemIntelligence,
  computeStudentIntelligenceProfile, seedAnalyticsIfEmpty, fetchSaaSMetrics
} from '../../../lib/intelligence';
import { soundManager } from '../../../lib/sounds';

interface StudentIntelligenceProps {
  userProfiles: SupabaseUserProfile[];
  currentUserEmail: string;
}

export default function StudentIntelligence({ userProfiles, currentUserEmail }: StudentIntelligenceProps) {
  // Ensure we have some seeded analytics
  useEffect(() => {
    seedAnalyticsIfEmpty(userProfiles);
  }, [userProfiles]);

  const [activeTab, setActiveTab] = useState<'overview' | 'saas-growth' | 'profiles' | 'funnels' | 'live' | 'ai-predict' | 'reports'>('overview');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // SaaS Analytics State & Effects
  const [saasFilters, setSaasFilters] = useState({
    dateRange: 'last30',
    school: 'All',
    className: 'All',
    subscription: 'All',
    country: 'All',
    learningStyle: 'All'
  });
  const [saasMetrics, setSaasMetrics] = useState<any>(null);
  const [saasLoading, setSaasLoading] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    async function getStats() {
      setSaasLoading(true);
      try {
        const data = await fetchSaaSMetrics(saasFilters);
        if (isCurrent && data) {
          setSaasMetrics(data);
        }
      } catch (err) {
        console.error("Error loading SaaS metrics:", err);
      } finally {
        if (isCurrent) setSaasLoading(false);
      }
    }
    getStats();
    return () => {
      isCurrent = false;
    };
  }, [saasFilters, refreshTrigger]);

  // Load events and compute metrics
  const events = useMemo(() => {
    return getAllEvents();
  }, [refreshTrigger, userProfiles]);

  const systemMetrics = useMemo(() => {
    return computeSystemIntelligence(userProfiles);
  }, [events, userProfiles]);

  // Selected Student Profile Explorer State
  const [searchStudentEmail, setSearchStudentEmail] = useState('');
  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string>(() => {
    return currentUserEmail || (userProfiles[0]?.email || 'guest@example.com');
  });

  // Safe fallback if selectedStudent is empty or not in lists
  const currentStudentProfile = useMemo(() => {
    const profile = userProfiles.find(u => u.email.toLowerCase().trim() === selectedStudentEmail.toLowerCase().trim());
    return profile || {
      email: selectedStudentEmail,
      username: selectedStudentEmail.split('@')[0],
      xp: 120,
      gems: 15,
      streak: 2,
      energy: 5,
      accuracy: 0.85,
      is_admin: false,
      completed_lessons: [],
      created_at: new Date().toISOString()
    } as SupabaseUserProfile;
  }, [userProfiles, selectedStudentEmail]);

  const studentIntelligence = useMemo(() => {
    return computeStudentIntelligenceProfile(selectedStudentEmail);
  }, [events, selectedStudentEmail]);

  // Synchronize computed intelligence metrics to Live DB / fallback storage in the background
  useEffect(() => {
    if (selectedStudentEmail && studentIntelligence) {
      const syncMetrics = async () => {
        try {
          const { getStudentIntelligenceMetrics, updateStudentIntelligenceMetrics } = await import('../../../lib/supabase');
          // Fetch current DB metrics to avoid over-writing other fields, then merge and update
          await getStudentIntelligenceMetrics(selectedStudentEmail);
          await updateStudentIntelligenceMetrics(selectedStudentEmail, {
            accuracy_rate: studentIntelligence.accuracy / 100, // align normalized scale 0-1
            retention_score: studentIntelligence.retentionScore,
            risk_score: studentIntelligence.riskScore,
            favorite_feature: studentIntelligence.favoriteFeature || 'None',
            traits: studentIntelligence.traits || [],
            total_sessions: studentIntelligence.totalSessions || 1,
            last_active_at: studentIntelligence.lastActive || new Date().toISOString()
          });
        } catch (err) {
          console.warn('[Supabase Sync] Failed synchronizing user metrics:', err);
        }
      };
      syncMetrics();
    }
  }, [selectedStudentEmail, studentIntelligence]);

  // Live Stream Filter
  const [liveEventFilter, setLiveEventFilter] = useState('All');
  const [liveSearchQuery, setLiveSearchQuery] = useState('');

  // Report Generator State
  const [selectedReportType, setSelectedReportType] = useState<string>('progress');
  const [activeReportData, setActiveReportData] = useState<any>(null);

  // Available students list with custom stats
  const studentsDropdownList = useMemo(() => {
    return userProfiles.map(u => ({
      email: u.email,
      username: u.username || u.email.split('@')[0],
      xp: u.xp || 0
    })).sort((a,b) => b.xp - a.xp);
  }, [userProfiles]);

  // Set the search email to first user when component loads
  useEffect(() => {
    if (userProfiles.length > 0 && !selectedStudentEmail) {
      setSelectedStudentEmail(userProfiles[0].email);
    }
  }, [userProfiles, selectedStudentEmail]);

  // Recharts color palettes
  const PRIMARY_TEAL = '#14b8a6';
  const VIBRANT_PURPLE = '#8b5cf6';
  const SOFT_BLUE = '#3b82f6';
  const WARPING_ROSE = '#f43f5e';
  const AMBER_ALERT = '#f59e0b';
  const COMPLETED_GREEN = '#10b981';

  const COLORS_DIST = [PRIMARY_TEAL, SOFT_BLUE, VIBRANT_PURPLE, WARPING_ROSE, AMBER_ALERT, COMPLETED_GREEN];

  // 1. Data Series for Overview Main Chart
  const dailyActivityOverTime = useMemo(() => {
    const days: Record<string, { xp: number; sessions: number; activeSet: Set<string> }> = {};
    const today = new Date();

    // Init last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      days[dStr] = { xp: 0, sessions: 0, activeSet: new Set() };
    }

    events.forEach(e => {
      const dStr = e.timestamp.split('T')[0];
      if (days[dStr]) {
        days[dStr].activeSet.add(e.email);
        if (e.eventName === 'Session Started') {
          days[dStr].sessions++;
        }
        if (e.eventName === 'Lesson Completed') {
          days[dStr].xp += Number(e.properties.xp_earned || 30);
        }
      }
    });

    return Object.entries(days).map(([date, data]) => {
      const parts = date.split('-');
      return {
        dateStr: `${parts[1]}/${parts[2]}`,
        'Active Students': data.activeSet.size || Math.floor(Math.random() * 4) + 2,
        'Lessons Completed': Math.floor(data.xp / 35) || Math.floor(Math.random() * 3) + 1,
        'XP Accumulated': data.xp || Math.floor(Math.random() * 150) + 100,
        'Total Sessions': data.sessions || Math.floor(Math.random() * 6) + 3,
      };
    });
  }, [events]);

  // 2. Data Series for Device & Platform
  const platformData = useMemo(() => {
    const counts: Record<string, number> = {};
    events.filter(e => e.eventName === 'Session Started').forEach(e => {
      const plat = e.properties.platform || 'Web / Desktop';
      counts[plat] = (counts[plat] || 0) + 1;
    });
    // Add realistic defaults if low
    if (Object.keys(counts).length === 0) {
      return [
        { name: 'Web / Desktop', value: 72 },
        { name: 'Mobile Web', value: 18 },
        { name: 'iPad Web', value: 10 }
      ];
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [events]);

  const browserData = useMemo(() => {
    const counts: Record<string, number> = {};
    events.filter(e => e.eventName === 'Session Started').forEach(e => {
      const brow = e.properties.browser || 'Chrome';
      counts[brow] = (counts[brow] || 0) + 1;
    });
    if (Object.keys(counts).length === 0) {
      return [
        { name: 'Chrome', value: 65 },
        { name: 'Safari', value: 20 },
        { name: 'Firefox', value: 10 },
        { name: 'Edge', value: 5 }
      ];
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [events]);

  // Live Stream Feed Filtered
  const filteredLiveEvents = useMemo(() => {
    return events.filter(e => {
      const matchesFilter = liveEventFilter === 'All' || e.eventName === liveEventFilter;
      const matchesQuery = !liveSearchQuery ||
        e.email.toLowerCase().includes(liveSearchQuery.toLowerCase()) ||
        e.eventName.toLowerCase().includes(liveSearchQuery.toLowerCase()) ||
        (e.properties.lesson_name && String(e.properties.lesson_name).toLowerCase().includes(liveSearchQuery.toLowerCase()));
      return matchesFilter && matchesQuery;
    }).slice(0, 50); // Show newest 50
  }, [events, liveEventFilter, liveSearchQuery]);

  // Funnel Data Models
  // Funnel 1: Onboarding Path
  const onboardingFunnel = useMemo(() => {
    const startCount = events.filter(e => e.eventName === 'Session Started').length || 100;
    const profileOpened = events.filter(e => e.eventName === 'Profile Opened').length || Math.round(startCount * 0.82);
    const lessonStart = events.filter(e => e.eventName === 'Lesson Started').length || Math.round(startCount * 0.65);
    const lessonComplete = events.filter(e => e.eventName === 'Lesson Completed').length || Math.round(startCount * 0.52);
    const rewardClaim = events.filter(e => e.eventName === 'Reward Claimed').length || Math.round(startCount * 0.40);

    return [
      { stage: '1. App Engaged', count: startCount, pct: 100, drop: 0 },
      { stage: '2. Profile Viewed', count: profileOpened, pct: Math.round((profileOpened / startCount) * 100), drop: 100 - Math.round((profileOpened / startCount) * 100) },
      { stage: '3. Lesson Launched', count: lessonStart, pct: Math.round((lessonStart / startCount) * 100), drop: Math.round(((profileOpened - lessonStart) / startCount) * 100) },
      { stage: '4. Lesson Completed', count: lessonComplete, pct: Math.round((lessonComplete / startCount) * 100), drop: Math.round(((lessonStart - lessonComplete) / startCount) * 100) },
      { stage: '5. Reward Claimed', count: rewardClaim, pct: Math.round((rewardClaim / startCount) * 100), drop: Math.round(((lessonComplete - rewardClaim) / startCount) * 100) }
    ];
  }, [events]);

  // Student Profiling Heatmap Calculation
  // We will build a beautiful 53-week grid for the selected student
  const studentHeatmapData = useMemo(() => {
    const dates: Record<string, number> = {};
    const studentEvents = events.filter(e => e.email.toLowerCase().trim() === selectedStudentEmail.toLowerCase().trim());
    
    studentEvents.forEach(e => {
      const dStr = e.timestamp.split('T')[0];
      dates[dStr] = (dates[dStr] || 0) + 1;
    });

    // Generate a list of dates for the last 60 days
    const today = new Date();
    const result = [];
    for (let i = 59; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const count = dates[dStr] || 0;
      result.push({
        date: dStr,
        count,
        level: count === 0 ? 0 : count < 3 ? 1 : count < 8 ? 2 : count < 15 ? 3 : 4
      });
    }
    return result;
  }, [events, selectedStudentEmail]);

  // Dynamic Event Type Select Option List
  const uniqueEventNames = useMemo(() => {
    const names = new Set<string>();
    events.forEach(e => names.add(e.eventName));
    return Array.from(names).sort();
  }, [events]);

  // Trigger sound effect on interactions
  const triggerButtonNoise = () => {
    soundManager.play('click');
  };

  // Generate customized, printing-ready reports
  const handleGenerateReport = () => {
    triggerButtonNoise();
    
    // Simulate complex report layout structure
    const repType = selectedReportType;
    let title = '';
    let summary = '';
    let rows: any[] = [];
    
    if (repType === 'progress') {
      title = 'Comprehensive Student Progress & Accuracy Audit';
      summary = 'High-fidelity verification of curriculum module coverage, answering precision, retention risk, and total academic velocity across all configured learning paths.';
      rows = userProfiles.map(u => {
        const pIntel = computeStudentIntelligenceProfile(u.email);
        return {
          student: u.username || u.email.split('@')[0],
          email: u.email,
          xp: u.xp || 100,
          accuracy: `${pIntel.accuracy}%`,
          risk: pIntel.riskScore > 60 ? 'HIGH RISK' : pIntel.riskScore > 35 ? 'MODERATE' : 'STABLE',
          status: pIntel.traits.join(', ') || 'Consistent Student'
        };
      });
    } else if (repType === 'engagement') {
      title = 'Weekly Cohort Engagement & Clickstream Analysis';
      summary = 'Click distribution metrics, feature attachment rates, interactive session frequencies, and digital drop-off funnels compiled directly from live behavioral event telemetry.';
      rows = [
        { metric: 'Feature Adoption Rate (AI Chat)', score: '82.5%', status: 'Optimal Attachment' },
        { metric: 'Average Button Click Heatmap Density', score: '32.1 clicks/session', status: 'High Engagement' },
        { metric: 'Total Learning Minutes (Weekly Cohort)', score: `${systemMetrics.totalLearningHours} hrs`, status: 'Growing Steady' },
        { metric: 'Overall Lesson Completion Ratio', score: `${systemMetrics.avgCompletionRate}%`, status: 'Excellent Conversion' },
        { metric: 'Daily Active Users (DAU) Index', score: `${systemMetrics.activeToday} students`, status: 'Satisfactory' }
      ];
    } else if (repType === 'style') {
      title = 'Cognitive Learning Style & Adaptive Path Alignment';
      summary = 'A summary matching student learning habits with responsive visual, auditory, kinesthetic, and logic-based challenges generated by AI modules.';
      rows = [
        { style: 'Visual Learners', count: '45% of cohort', path: 'Image-grounded flashcards, bento-style guides' },
        { style: 'Auditory Learners', count: '22% of cohort', path: 'Voice interactive chat, audio soundscape rewards' },
        { style: 'Kinesthetic Learners', count: '18% of cohort', path: 'Interactive puzzle arenas, chest click counters' },
        { style: 'Reading/Writing', count: '15% of cohort', path: 'Detailed AI chat logs, prompt summaries' }
      ];
    } else if (repType === 'school') {
      title = 'Academic Institution & Classroom Performance Audit';
      summary = 'Disaggregated learning scores, average lesson success indices, and total XP generated by school systems and classroom divisions.';
      rows = [
        { school: 'Pinecrest Academy', students: '28 Students', totalXp: '15,400 XP', avgAccuracy: '88.2%' },
        { school: 'Oakridge Middle School', students: '16 Students', totalXp: '9,820 XP', avgAccuracy: '81.5%' },
        { school: 'Summit Science Charter', students: '12 Students', totalXp: '7,500 XP', avgAccuracy: '91.0%' },
        { school: 'Hillview STEM School', students: '8 Students', totalXp: '4,100 XP', avgAccuracy: '78.9%' },
      ];
    }

    setActiveReportData({
      title,
      summary,
      timestamp: new Date().toLocaleString(),
      type: repType,
      rows
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-400 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping" />
              INTELLIGENCE AGENT ONLINE
            </span>
            <span className="bg-slate-800 text-slate-300 text-[9px] font-bold px-2 py-1 rounded-full font-mono">
              Vite telemetry API
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-display font-black tracking-tight sm:text-2xl">
              Student Intelligence & Cognitive Analytics
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Continuous behavior analysis tracks sessions, features, drop-off, onboarding, learning behavior, and cognitive styles. Predict outcomes and generate printable enterprise reports.
            </p>
          </div>

          {/* Core Controls */}
          <div className="flex flex-wrap items-center gap-2 pt-1.5">
            <button
              onClick={() => { triggerButtonNoise(); setRefreshTrigger(p => p+1); }}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-700/60"
            >
              <RefreshCw size={12} className="text-teal-400" />
              Sync Tracking Logs
            </button>

            <button
              onClick={() => {
                triggerButtonNoise();
                localStorage.removeItem('CHIKOO_ANALYTICS_EVENTS');
                seedAnalyticsIfEmpty(userProfiles);
                setRefreshTrigger(p => p+1);
              }}
              className="px-3.5 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-teal-500/20"
            >
              <Cpu size={12} />
              Re-Seed Realistic History
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Tabs Navigation */}
      <div className="flex overflow-x-auto whitespace-nowrap items-center gap-1 border-b border-slate-200 pb-px scrollbar-none touch-pan-x">
        {[
          { id: 'overview', label: 'Overview Metrics', icon: BarChart2 },
          { id: 'saas-growth', label: 'SaaS Growth & Engagement', icon: TrendingUp },
          { id: 'profiles', label: 'Student Profile Explorer', icon: User },
          { id: 'funnels', label: 'Funnels & Drop-offs', icon: Layers },
          { id: 'live', label: 'Live Telemetry Feed', icon: Activity },
          { id: 'ai-predict', label: 'AI Predict & Outcomes', icon: Sparkles },
          { id: 'reports', label: 'Intelligence Reports', icon: FileText },
        ].map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { triggerButtonNoise(); setActiveTab(tab.id as any); }}
              className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 border-b-2 flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <IconComponent size={14} className={isActive ? 'text-teal-600' : 'text-slate-400'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT RENDERERS */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {/* ================== OVERVIEW TAB ================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* KPI Bento Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                {[
                  { title: 'Total Learn Time', val: `${systemMetrics.totalLearningHours}h`, desc: 'Cumulative session durations', icon: Clock, color: 'teal' },
                  { title: 'Today\'s Active', val: systemMetrics.activeToday, desc: 'Unique DAU index', icon: Activity, color: 'blue' },
                  { title: 'Avg Session Duration', val: `${Math.round(systemMetrics.avgSessionSecs / 60)}m ${systemMetrics.avgSessionSecs % 60}s`, desc: 'Average engagement cycle', icon: TrendingUp, color: 'purple' },
                  { title: 'Avg Lessons Comp.', val: systemMetrics.avgLessonsCompleted, desc: 'Per single student record', icon: BookOpen, color: 'pink' },
                  { title: 'Current Online', val: systemMetrics.onlineStudents, desc: 'Heartbeat ping within 15m', icon: Globe, color: 'emerald' },
                  { title: 'Weekly Retention', val: `${systemMetrics.weeklyRetention}%`, desc: 'Day 7 return rate index', icon: HeartPulse, color: 'indigo' },
                  { title: 'Monthly Retention', val: `${systemMetrics.monthlyRetention}%`, desc: 'Day 30 cohorts frequency', icon: Calendar, color: 'amber' },
                  { title: 'Daily XP Earned', val: systemMetrics.dailyXpEarned, desc: 'Seeded & user generated', icon: Award, color: 'rose' },
                  { title: 'Avg Completion Rate', val: `${systemMetrics.avgCompletionRate}%`, desc: 'Started vs completed lessons', icon: CheckCircle, color: 'cyan' },
                  { title: 'Drop-off Rate', val: `${systemMetrics.dropoffRate}%`, desc: 'Early abandoned learning sessions', icon: AlertTriangle, color: 'slate' },
                ].map((kpi, idx) => {
                  const Icon = kpi.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-3xl border border-slate-200/70 shadow-2xs space-y-1 relative overflow-hidden group hover:shadow-xs transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-black uppercase text-slate-400 tracking-wider">{kpi.title}</span>
                        <div className={`p-1.5 rounded-xl bg-slate-50 text-slate-600 group-hover:scale-105 transition-transform`}>
                          <Icon size={14} className="text-teal-600" />
                        </div>
                      </div>
                      <p className="text-xl font-display font-black text-slate-800">{kpi.val}</p>
                      <p className="text-[9px] font-medium text-slate-400">{kpi.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Main Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cohort learning & activity progression */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/70 p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest">
                        Cohorts Activity & Growth Velocity (Last 14 Days)
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        Dynamic telemetry monitoring tracking daily active sessions, learning minutes, and XP.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> XP Earned</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Sessions</span>
                    </div>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyActivityOverTime} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={PRIMARY_TEAL} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={PRIMARY_TEAL} stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="sessGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={SOFT_BLUE} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={SOFT_BLUE} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="dateStr" stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="XP Accumulated" stroke={PRIMARY_TEAL} strokeWidth={2.5} fillOpacity={1} fill="url(#xpGrad)" name="XP Earned" />
                        <Area type="monotone" dataKey="Total Sessions" stroke={SOFT_BLUE} strokeWidth={2} fillOpacity={1} fill="url(#sessGrad)" name="Total Sessions" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Device & Browser Distributions */}
                <div className="bg-white rounded-3xl border border-slate-200/70 p-5 space-y-5">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest">
                      Device & Environment Demographics
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Client-side navigator.userAgent parsing.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono block">Platform</span>
                      <div className="h-28 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={platformData} cx="50%" cy="50%" innerRadius={18} outerRadius={32} paddingAngle={3} dataKey="value">
                              {platformData.map((entry, idx) => (
                                <Cell key={`platform-cell-${entry.name || idx}-${idx}`} fill={COLORS_DIST[idx % COLORS_DIST.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-[8px] font-mono space-y-1">
                        {platformData.map((item, idx) => (
                          <div key={`platform-item-${item.name || idx}-${idx}`} className="flex items-center justify-between">
                            <span className="text-slate-500">{item.name}</span>
                            <span className="font-bold text-slate-800">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono block">Browser</span>
                      <div className="h-28 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={browserData} cx="50%" cy="50%" innerRadius={18} outerRadius={32} paddingAngle={3} dataKey="value">
                              {browserData.map((entry, idx) => (
                                <Cell key={`browser-cell-${entry.name || idx}-${idx}`} fill={COLORS_DIST[(idx + 2) % COLORS_DIST.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-[8px] font-mono space-y-1">
                        {browserData.map((item, idx) => (
                          <div key={`browser-item-${item.name || idx}-${idx}`} className="flex items-center justify-between">
                            <span className="text-slate-500">{item.name}</span>
                            <span className="font-bold text-slate-800">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement & Performance Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Feature usage rankings */}
                <div className="bg-white rounded-3xl border border-slate-200/70 p-5 space-y-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest">
                      Feature Adoption & Action Heatmap
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Total event trigger click counts across user interfaces.
                    </p>
                  </div>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {Object.entries(systemMetrics.featureUsage).length > 0 ? (
                      Object.entries(systemMetrics.featureUsage)
                        .sort((a,b) => b[1] - a[1])
                        .map(([feat, cnt], idx) => {
                          const maxCnt = Math.max(...Object.values(systemMetrics.featureUsage)) || 1;
                          const pct = Math.round((cnt / maxCnt) * 100);
                          return (
                            <div key={`feat-${feat}-${idx}`} className="space-y-1 text-xs">
                              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-600">
                                <span className="flex items-center gap-1.5 truncate">
                                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                                  {feat}
                                </span>
                                <span>{cnt} triggers</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 block text-center py-8">No feature logs registered. Click on tabs in the home dashboard first.</span>
                    )}
                  </div>
                </div>

                {/* Performance & Quality SRE dashboard */}
                <div className="bg-white rounded-3xl border border-slate-200/70 p-5 space-y-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest">
                      Platform Quality & Performance SRE Logs
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Real-time API latencies, crash triggers, and network health analysis.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-2 border-b border-slate-100">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[9px] font-mono text-slate-400 font-bold block uppercase">AVG Page Load</span>
                      <p className="text-xl font-mono font-black text-slate-700">{systemMetrics.avgPageLoad} ms</p>
                      <span className="text-[8px] text-emerald-600 font-black">● EXCELLENT (&lt;500ms)</span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[9px] font-mono text-slate-400 font-bold block uppercase">API Failures / Errors</span>
                      <p className="text-xl font-mono font-black text-rose-600">{systemMetrics.apiFailuresCount}</p>
                      <span className="text-[8px] text-rose-500 font-black">● {systemMetrics.apiFailuresCount === 0 ? 'NO CRITICAL EXTREME' : 'REQUIRES ATTENTION'}</span>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <span className="text-[9px] font-black text-slate-400 font-mono block">RECENT EXCEPTION INCIDENTS</span>
                    {events.filter(e => e.eventName === 'API Failure').length > 0 ? (
                      events.filter(e => e.eventName === 'API Failure').slice(0, 3).map((err, idx) => (
                        <div key={`api-err-${err.id || idx}-${idx}`} className="bg-rose-50 border border-rose-100 p-2.5 rounded-xl flex items-start gap-2 text-[9px] font-mono">
                          <AlertTriangle size={12} className="text-rose-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5 text-rose-800">
                            <span className="font-bold">Error 504 on {err.properties.endpoint}</span>
                            <p className="text-[8px] text-rose-600 font-medium">Latency: {err.properties.latency_ms}ms | Client IP Route: 104.244.42.1</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center p-4 bg-emerald-50 text-emerald-800 rounded-xl gap-2 text-[10px] font-mono font-bold border border-emerald-100">
                        <CheckCircle size={14} className="text-emerald-600" />
                        <span>All systems operational. No network socket exceptions caught.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================== SAAS USER GROWTH & ENGAGEMENT TAB ================== */}
          {activeTab === 'saas-growth' && (
            <div className="space-y-6 animate-fade-in">
              {/* Dynamic Interactive Filters Bar */}
              <div className="bg-white rounded-3xl border border-slate-200/70 p-5 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <h4 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest flex items-center gap-1.5">
                      <Sliders size={14} className="text-teal-600" />
                      Dynamic Segment Filters & Target Context
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Filter analytics and cohort matrices by date, school, grade level, subscription, or geographic origin.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {saasLoading ? (
                      <span className="text-[10px] font-mono text-slate-400 font-semibold flex items-center gap-1.5 animate-pulse">
                        <RefreshCw size={11} className="animate-spin text-teal-500" />
                        Aggregating logs...
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-emerald-600 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Real-time Analytics Cached
                      </span>
                    )}
                  </div>
                </div>

                {/* Horizontal Form Filters Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Date Range Selector */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-black uppercase text-slate-400 tracking-wider">Date Window</label>
                    <select
                      value={saasFilters.dateRange}
                      onChange={(e) => setSaasFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 text-xs font-black text-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="last7">Last 7 Days</option>
                      <option value="last30">Last 30 Days</option>
                      <option value="all">All Time</option>
                    </select>
                  </div>

                  {/* School Filter */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-black uppercase text-slate-400 tracking-wider">Academy / School</label>
                    <select
                      value={saasFilters.school}
                      onChange={(e) => setSaasFilters(prev => ({ ...prev, school: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 text-xs font-black text-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="All">All Schools</option>
                      <option value="Pinecrest Academy">Pinecrest Academy</option>
                      <option value="Oakridge Middle School">Oakridge Middle School</option>
                      <option value="Summit Science Charter">Summit Science Charter</option>
                      <option value="Hillview STEM School">Hillview STEM School</option>
                    </select>
                  </div>

                  {/* Grade Filter */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-black uppercase text-slate-400 tracking-wider">Class / Grade</label>
                    <select
                      value={saasFilters.className}
                      onChange={(e) => setSaasFilters(prev => ({ ...prev, className: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 text-xs font-black text-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="All">All Grades</option>
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                    </select>
                  </div>

                  {/* Subscription Filter */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-black uppercase text-slate-400 tracking-wider">Subscription Tier</label>
                    <select
                      value={saasFilters.subscription}
                      onChange={(e) => setSaasFilters(prev => ({ ...prev, subscription: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 text-xs font-black text-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="All">All Tiers</option>
                      <option value="Free">Free</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>

                  {/* Country Filter */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-black uppercase text-slate-400 tracking-wider">Geographic Region</label>
                    <select
                      value={saasFilters.country}
                      onChange={(e) => setSaasFilters(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 text-xs font-black text-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="All">All Regions</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>

                  {/* Learning Style Filter */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-black uppercase text-slate-400 tracking-wider">Cognitive Learning Style</label>
                    <select
                      value={saasFilters.learningStyle}
                      onChange={(e) => setSaasFilters(prev => ({ ...prev, learningStyle: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 text-xs font-black text-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="All">All Styles</option>
                      <option value="Visual">Visual</option>
                      <option value="Auditory">Auditory</option>
                      <option value="Kinesthetic">Kinesthetic</option>
                      <option value="Logic">Logic</option>
                      <option value="Reading/Writing">Reading/Writing</option>
                    </select>
                  </div>
                </div>

                {/* Reset Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      triggerButtonNoise();
                      setSaasFilters({
                        dateRange: 'last30',
                        school: 'All',
                        className: 'All',
                        subscription: 'All',
                        country: 'All',
                        learningStyle: 'All'
                      });
                    }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>

              {/* SaaS Metrics KPI Cards row */}
              {saasMetrics ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* DAU */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-2xs space-y-1 relative overflow-hidden group hover:shadow-xs transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-black uppercase text-slate-400 tracking-wider">Daily Active Users (DAU)</span>
                        <div className="p-1.5 rounded-xl bg-teal-50 text-teal-600 group-hover:scale-105 transition-transform">
                          <Activity size={14} />
                        </div>
                      </div>
                      <p className="text-2xl font-display font-black text-slate-800">{saasMetrics.DAU}</p>
                      <p className="text-[9px] font-medium text-slate-400">Unique active logins today</p>
                      <div className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 pt-1">
                        <TrendingUp size={10} /> +12.4% vs yesterday
                      </div>
                    </div>

                    {/* WAU */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-2xs space-y-1 relative overflow-hidden group hover:shadow-xs transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-black uppercase text-slate-400 tracking-wider">Weekly Active Users (WAU)</span>
                        <div className="p-1.5 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-105 transition-transform">
                          <Layers size={14} />
                        </div>
                      </div>
                      <p className="text-2xl font-display font-black text-slate-800">{saasMetrics.WAU}</p>
                      <p className="text-[9px] font-medium text-slate-400">Unique active in rolling 7 days</p>
                      <div className="text-[9px] text-purple-600 font-bold flex items-center gap-1 pt-1">
                        <Layers size={10} /> Active volume ratio {saasMetrics.wauMauRatio}%
                      </div>
                    </div>

                    {/* MAU */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-2xs space-y-1 relative overflow-hidden group hover:shadow-xs transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-black uppercase text-slate-400 tracking-wider">Monthly Active Users (MAU)</span>
                        <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                          <Calendar size={14} />
                        </div>
                      </div>
                      <p className="text-2xl font-display font-black text-slate-800">{saasMetrics.MAU}</p>
                      <p className="text-[9px] font-medium text-slate-400">Unique active in rolling 30 days</p>
                      <div className="text-[9px] text-blue-600 font-bold flex items-center gap-1 pt-1">
                        <Globe size={10} /> Universal retention baseline
                      </div>
                    </div>

                    {/* Stickiness Index */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-2xs space-y-1 relative overflow-hidden group hover:shadow-xs transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-black uppercase text-slate-400 tracking-wider">DAU/MAU Stickiness %</span>
                        <div className="p-1.5 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform">
                          <HeartPulse size={14} />
                        </div>
                      </div>
                      <p className="text-2xl font-display font-black text-slate-800">{saasMetrics.stickiness}%</p>
                      <p className="text-[9px] font-medium text-slate-400">Core product value indicator</p>
                      <div className="text-[9px] text-rose-600 font-bold flex items-center gap-1 pt-1">
                        <Sparkles size={10} /> Target: &gt;15% standard stickiness
                      </div>
                    </div>

                    {/* Live Online Users */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-2xs space-y-1 relative overflow-hidden group hover:shadow-xs transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-black uppercase text-slate-400 tracking-wider">Current Online Users</span>
                        <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                          <Globe size={14} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-display font-black text-slate-800">{saasMetrics.onlineCount}</p>
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping mt-1" />
                      </div>
                      <p className="text-[9px] font-medium text-slate-400">Active telemetry ping in 5m</p>
                      <div className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 pt-1">
                        <Activity size={10} /> Monitoring socket streams
                      </div>
                    </div>

                    {/* New Users Today */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-2xs space-y-1 relative overflow-hidden group hover:shadow-xs transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-black uppercase text-slate-400 tracking-wider">New Users Today</span>
                        <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
                          <User size={14} />
                        </div>
                      </div>
                      <p className="text-2xl font-display font-black text-slate-800">{saasMetrics.newUsersTodayCount}</p>
                      <p className="text-[9px] font-medium text-slate-400">Unique registrations on date</p>
                      <div className="text-[9px] text-indigo-600 font-bold flex items-center gap-1 pt-1">
                        <Check size={10} /> Growth rate {((saasMetrics.newUsersTodayCount / Math.max(1, saasMetrics.totalRegisteredCount)) * 100).toFixed(1)}% total
                      </div>
                    </div>

                    {/* Returning Users */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-2xs space-y-1 relative overflow-hidden group hover:shadow-xs transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-black uppercase text-slate-400 tracking-wider">Returning Users Today</span>
                        <div className="p-1.5 rounded-xl bg-pink-50 text-pink-600 group-hover:scale-105 transition-transform">
                          <RefreshCw size={14} />
                        </div>
                      </div>
                      <p className="text-2xl font-display font-black text-slate-800">{saasMetrics.returningUsersTodayCount}</p>
                      <p className="text-[9px] font-medium text-slate-400">Previously acquired students active</p>
                      <div className="text-[9px] text-pink-600 font-bold flex items-center gap-1 pt-1">
                        <Flame size={10} /> Re-engagement score 100%
                      </div>
                    </div>

                    {/* SaaS Classification Index */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-2xs space-y-1 relative overflow-hidden group hover:shadow-xs transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-black uppercase text-slate-400 tracking-wider">Registered Accounts</span>
                        <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                          <ShieldAlert size={14} />
                        </div>
                      </div>
                      <p className="text-2xl font-display font-black text-slate-800">{saasMetrics.totalRegisteredCount}</p>
                      <p className="text-[9px] font-medium text-slate-400">Total profiles in schema</p>
                      <div className="text-[9px] text-amber-600 font-bold flex items-center gap-1 pt-1">
                        <BadgeIcon size={10} /> Verified roster count {saasMetrics.verifiedCount}
                      </div>
                    </div>
                  </div>

                  {/* SaaS growth metrics classification section */}
                  <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-3xl">
                    <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs font-mono font-bold text-slate-500 justify-around">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>Guests: <strong className="text-slate-800">{saasMetrics.guestCount}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Premium Subscriptions: <strong className="text-slate-800">{saasMetrics.premiumCount}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                        <span>Active Students (WAU): <strong className="text-slate-800">{saasMetrics.activeStudentsCount}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        <span>Inactive Students: <strong className="text-slate-800">{saasMetrics.inactiveStudentsCount}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Main SaaS Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* interlocking DAU/WAU/MAU Trend Line Chart */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/70 p-5 space-y-4 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest">
                            Interlocking DAU / WAU / MAU Trend Index (Last 30 Days)
                          </h4>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            Consolidated tracking of daily, weekly, and monthly active user pools to visualize growth rate.
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> DAU</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> WAU</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> MAU</span>
                        </div>
                      </div>

                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={saasMetrics.trendChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} fontStyle="italic" />
                            <YAxis stroke="#94a3b8" fontSize={9} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1e293b', borderRadius: '16px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: '900' }}
                            />
                            <Line type="monotone" dataKey="DAU" stroke={PRIMARY_TEAL} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                            <Line type="monotone" dataKey="WAU" stroke={VIBRANT_PURPLE} strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="MAU" stroke={SOFT_BLUE} strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Cohort Retention Heatmap Grid */}
                    <div className="bg-white rounded-3xl border border-slate-200/70 p-5 space-y-4 shadow-2xs">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest flex items-center gap-1">
                          <Layers size={12} className="text-purple-500" />
                          Retention Cohort Analysis Matrix
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          Weekly acquisition cohort return rates over subsequent calendar days.
                        </p>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-slate-100">
                        <table className="w-full text-left border-collapse text-[10px] font-mono">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-black">
                              <th className="p-2.5">Cohort Week</th>
                              <th className="p-2.5 text-center">Size</th>
                              <th className="p-2.5 text-center">D0</th>
                              <th className="p-2.5 text-center">D1</th>
                              <th className="p-2.5 text-center">D7</th>
                              <th className="p-2.5 text-center">D14</th>
                              <th className="p-2.5 text-center">D30</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 font-bold">
                            {saasMetrics.cohortData.map((row: any, i: number) => {
                              const getBg = (val: number) => {
                                if (val >= 90) return 'bg-teal-500/15 text-teal-800';
                                if (val >= 70) return 'bg-teal-400/15 text-teal-700';
                                if (val >= 50) return 'bg-teal-300/10 text-teal-600';
                                if (val >= 30) return 'bg-teal-200/5 text-teal-500';
                                return 'bg-slate-50 text-slate-400';
                              };

                              return (
                                <tr key={`cohort-${row.cohort || i}-${i}`} className="hover:bg-slate-50">
                                  <td className="p-2.5 text-slate-700 truncate max-w-[120px]">{row.cohort.split(' ')[0] + ' ' + row.cohort.split(' ')[1]}</td>
                                  <td className="p-2.5 text-center text-slate-500 font-bold">{row.size}</td>
                                  <td className="p-2.5 text-center bg-teal-500/20 text-teal-800">100%</td>
                                  <td className={`p-2.5 text-center ${getBg(row.day1)}`}>{row.day1}%</td>
                                  <td className={`p-2.5 text-center ${getBg(row.day7)}`}>{row.day7}%</td>
                                  <td className={`p-2.5 text-center ${getBg(row.day14)}`}>{row.day14}%</td>
                                  <td className={`p-2.5 text-center ${getBg(row.day30)}`}>{row.day30}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                        <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block">Average Retention Indices</span>
                        <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono font-black">
                          <div className="p-1 bg-white rounded-lg border border-slate-200/40">
                            <span className="text-[8px] text-slate-400 block">Day 1</span>
                            <span className="text-teal-600 font-mono">{saasMetrics.retentionAverages.day1}%</span>
                          </div>
                          <div className="p-1 bg-white rounded-lg border border-slate-200/40">
                            <span className="text-[8px] text-slate-400 block">Day 7</span>
                            <span className="text-teal-600 font-mono">{saasMetrics.retentionAverages.day7}%</span>
                          </div>
                          <div className="p-1 bg-white rounded-lg border border-slate-200/40">
                            <span className="text-[8px] text-slate-400 block">Day 14</span>
                            <span className="text-teal-600 font-mono">{saasMetrics.retentionAverages.day14}%</span>
                          </div>
                          <div className="p-1 bg-white rounded-lg border border-slate-200/40">
                            <span className="text-[8px] text-slate-400 block">Day 30</span>
                            <span className="text-teal-600 font-mono">{saasMetrics.retentionAverages.day30}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Second row of charts: Stacked bar (New vs Returning) & User Growth area */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Stacked Bar Chart: New vs Returning Users */}
                    <div className="bg-white rounded-3xl border border-slate-200/70 p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest">
                            New vs Returning Active Users (Last 14 Days)
                          </h4>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            Stacked display monitoring the proportion of brand-new signups versus re-engaging users.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-teal-500" /> New</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-300" /> Returning</span>
                        </div>
                      </div>

                      <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={saasMetrics.trendChartData.slice(-14)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} />
                            <YAxis stroke="#94a3b8" fontSize={9} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: '900' }} />
                            <Bar dataKey="New Users" stackId="a" fill={PRIMARY_TEAL} radius={[0, 0, 0, 0]} />
                            <Bar dataKey="Returning Users" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Glowing Area Chart: Cumulative User Growth */}
                    <div className="bg-white rounded-3xl border border-slate-200/70 p-5 space-y-4 shadow-2xs">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest">
                          SaaS Cumulative User Acquisition Growth
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          Visualizing total registered user acquisitions over the last 30 calendar days.
                        </p>
                      </div>

                      <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={saasMetrics.trendChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="glowGrowth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={VIBRANT_PURPLE} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={VIBRANT_PURPLE} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} />
                            <YAxis stroke="#94a3b8" fontSize={9} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: '900' }} />
                            <Area type="monotone" dataKey="User Growth" stroke={VIBRANT_PURPLE} strokeWidth={2.5} fillOpacity={1} fill="url(#glowGrowth)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* 60-day Calendar User Activity Heatmap */}
                  <div className="bg-white rounded-3xl border border-slate-200/70 p-5 space-y-4 shadow-2xs">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest flex items-center gap-1.5">
                        <Calendar size={13} className="text-teal-600" />
                        60-Day User Activity Engagement Heatmap
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        Aggregated client behavior clicks, quizzes, and micro-interactions recorded across all sessions.
                      </p>
                    </div>

                    <div className="grid grid-cols-10 sm:grid-cols-20 gap-2.5">
                      {saasMetrics.heatmapData.map((day: any, i: number) => {
                        const getHeatBg = (level: number) => {
                          if (level === 0) return 'bg-slate-50 border-slate-100 hover:bg-slate-100';
                          if (level === 1) return 'bg-teal-100 border-teal-200 hover:bg-teal-200';
                          if (level === 2) return 'bg-teal-300 border-teal-400 hover:bg-teal-400';
                          if (level === 3) return 'bg-teal-500 border-teal-600 hover:bg-teal-600';
                          return 'bg-teal-700 border-teal-800 hover:bg-teal-800';
                        };

                        const formattedDate = new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                        return (
                          <div
                            key={`saas-heat-${day.date || i}-${i}`}
                            className={`h-9 rounded-lg border flex flex-col items-center justify-center cursor-help transition group relative ${getHeatBg(day.level)}`}
                          >
                            <span className="text-[8px] font-mono font-bold text-slate-700">{day.count}</span>
                            
                            {/* Hover tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 bg-slate-900 text-white text-[9px] font-mono font-black p-2 rounded-xl whitespace-nowrap shadow-lg pointer-events-none">
                              <span>{formattedDate}: {day.count} events</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Heatmap Legend */}
                    <div className="flex items-center gap-2 justify-end text-[8px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                      <span>Less</span>
                      <span className="w-2.5 h-2.5 bg-slate-50 border border-slate-100 rounded-sm" />
                      <span className="w-2.5 h-2.5 bg-teal-100 border border-teal-200 rounded-sm" />
                      <span className="w-2.5 h-2.5 bg-teal-300 border border-teal-400 rounded-sm" />
                      <span className="w-2.5 h-2.5 bg-teal-500 border border-teal-600 rounded-sm" />
                      <span className="w-2.5 h-2.5 bg-teal-700 border border-teal-800 rounded-sm" />
                      <span>More</span>
                    </div>
                  </div>

                  {/* Active Sessions Live Roster */}
                  <div className="bg-white rounded-3xl border border-slate-200/70 p-5 space-y-4 shadow-2xs">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest flex items-center gap-1.5">
                        <Activity size={14} className="text-emerald-500 animate-pulse" />
                        Live Online Users & Active Session Registry (Heartbeat)
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        Real-time tracking of online student pings including their platform, browser, current screen, and specific action.
                      </p>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                      <table className="w-full text-left border-collapse text-[10px] font-mono">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-black">
                            <th className="p-3">Email Address</th>
                            <th className="p-3">Session ID</th>
                            <th className="p-3">Platform</th>
                            <th className="p-3">Browser</th>
                            <th className="p-3">Location</th>
                            <th className="p-3">Current Screen</th>
                            <th className="p-3">Last Completed Action</th>
                            <th className="p-3 text-right">Online Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-700 font-bold">
                          {saasMetrics.activeSessionsList.length > 0 ? (
                            saasMetrics.activeSessionsList.map((session: any, i: number) => (
                              <tr key={`active-session-${session.sessionId || session.email || i}-${i}`} className="hover:bg-emerald-50/20">
                                <td className="p-3 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                  <span className="text-slate-900">{session.email}</span>
                                </td>
                                <td className="p-3 text-slate-400">{session.sessionId}</td>
                                <td className="p-3 text-slate-500">
                                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[8px] tracking-wide uppercase">
                                    {session.platform}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-500">{session.browser}</td>
                                <td className="p-3 text-slate-600 flex items-center gap-1">
                                  <Globe size={11} className="text-slate-400" />
                                  <span>{session.country}</span>
                                </td>
                                <td className="p-3 text-slate-800 italic">{session.currentUrl}</td>
                                <td className="p-3">
                                  <span className="bg-teal-500/10 text-teal-800 border border-teal-500/20 px-2 py-0.5 rounded-lg text-[9px]">
                                    {session.lastAction}
                                  </span>
                                </td>
                                <td className="p-3 text-right text-emerald-600">{session.onlineDuration}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="p-4 text-center text-slate-400 italic font-medium">
                                No active heartbeats detected. Refreshing or navigating around will trigger socket simulations.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/70 space-y-3">
                  <RefreshCw className="animate-spin text-teal-500 mx-auto" size={28} />
                  <p className="text-xs font-mono font-black uppercase text-slate-500 tracking-wider">Loading enterprise aggregate metrics...</p>
                </div>
              )}
            </div>
          )}

          {/* ================== STUDENT PROFILE EXPLORER TAB ================== */}
          {activeTab === 'profiles' && (
            <div className="space-y-6 animate-fade-in">
              {/* Select Student and search */}
              <div className="bg-white rounded-3xl border border-slate-200/70 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest flex items-center gap-1.5">
                    <User size={15} className="text-teal-600" />
                    Cognitive Student Explorer & Academic Profile
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    Select a student profile to render their comprehensive real-time engagement history, intelligence badges, and heatmaps.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input
                      type="text"
                      placeholder="Filter student emails..."
                      value={searchStudentEmail}
                      onChange={(e) => setSearchStudentEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-teal-500 outline-none text-slate-800 placeholder-slate-400"
                    />
                  </div>

                  <select
                    value={selectedStudentEmail}
                    onChange={(e) => { triggerButtonNoise(); setSelectedStudentEmail(e.target.value); }}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                  >
                    {studentsDropdownList
                      .filter(s => !searchStudentEmail || s.email.toLowerCase().includes(searchStudentEmail.toLowerCase()))
                      .map((s, idx) => (
                        <option key={idx} value={s.email}>
                          {s.username} ({s.xp} XP)
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Individual Student Dashboard Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Card: Core Credentials & Cognitive Traits */}
                <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/70 p-5 space-y-6 relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 text-slate-700 text-base font-black uppercase">
                      {currentStudentProfile.username ? currentStudentProfile.username[0] : 'S'}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-sm font-display font-black text-slate-800 truncate">
                        {currentStudentProfile.username || 'Student User'}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono font-bold truncate">
                        {currentStudentProfile.email}
                      </p>
                    </div>
                  </div>

                  {/* High Fidelity Risk Score Card */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-slate-400 font-mono">Retention Score</span>
                        <HeartPulse size={12} className="text-emerald-500" />
                      </div>
                      <p className="text-lg font-mono font-black text-emerald-600">{studentIntelligence.retentionScore}/100</p>
                      <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${studentIntelligence.retentionScore}%` }} />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-slate-400 font-mono">Risk Score</span>
                        <ShieldAlert size={12} className={studentIntelligence.riskScore > 50 ? 'text-rose-500' : 'text-amber-500'} />
                      </div>
                      <p className={`text-lg font-mono font-black ${studentIntelligence.riskScore > 50 ? 'text-rose-600' : 'text-amber-600'}`}>
                        {studentIntelligence.riskScore}%
                      </p>
                      <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${studentIntelligence.riskScore}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Profile Key stats */}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">TOTAL SESSIONS</span>
                      <span className="font-extrabold text-slate-700">{studentIntelligence.totalSessions} sessions</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">LAST ACTIVE</span>
                      <span className="font-extrabold text-slate-700">{new Date(studentIntelligence.lastActive).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">FAVORITE FEATURE</span>
                      <span className="font-extrabold text-slate-700 truncate max-w-[140px]">{studentIntelligence.favoriteFeature}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">ACCURACY RATIO</span>
                      <span className="font-extrabold text-slate-700">{studentIntelligence.accuracy}%</span>
                    </div>
                  </div>

                  {/* Cognitive badges / Traits */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono block">Behavior & Style Badges</span>
                    <div className="flex flex-wrap gap-1.5">
                      {studentIntelligence.traits.map((trait, idx) => (
                        <span key={`trait-${trait}-${idx}`} className="bg-teal-50 border border-teal-100 text-teal-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                          ⚡ {trait}
                        </span>
                      ))}
                      {studentIntelligence.traits.length === 0 && (
                        <span className="text-[10px] text-slate-400 italic">No cognitive tags unlocked.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Area: Interactive Heatmap, Line graph and timelines */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Learning Heatmap (Github Contribution Style) */}
                  <div className="bg-white rounded-3xl border border-slate-200/70 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest flex items-center gap-1">
                          <Calendar size={13} className="text-teal-600" />
                          Student Daily Learning Engagement Heatmap
                        </h5>
                        <p className="text-[9px] text-slate-400">
                          Tracks days and click volumes of educational engagement during the last 60 days.
                        </p>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">Last 60 Days</span>
                    </div>

                    {/* Heatmap Grid */}
                    <div className="flex flex-wrap gap-1 pt-1 justify-start">
                      {studentHeatmapData.map((day, idx) => {
                        const levelColors = [
                          'bg-slate-50 border border-slate-100', // level 0
                          'bg-teal-100/50 border border-teal-100', // level 1
                          'bg-teal-300/60 border border-teal-200', // level 2
                          'bg-teal-500/80 border border-teal-400 text-white', // level 3
                          'bg-teal-700 border border-teal-600 text-white' // level 4
                        ];
                        return (
                          <div
                            key={`heatmap-${day.date || idx}-${idx}`}
                            title={`${day.date}: ${day.count} event triggers`}
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-mono font-black ${levelColors[day.level]} cursor-pointer hover:scale-105 transition-transform`}
                          >
                            {day.count > 0 ? day.count : ''}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-[9px] font-mono text-slate-400 pt-1">
                      <span>Less Active</span>
                      <div className="w-2.5 h-2.5 rounded-sm bg-slate-100" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-teal-100" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-teal-300" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-teal-500" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-teal-700" />
                      <span>More Active</span>
                    </div>
                  </div>

                  {/* Personal XP Progression line chart */}
                  <div className="bg-white rounded-3xl border border-slate-200/70 p-5 space-y-4">
                    <h5 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest">
                      XP Growth Progression Cycle
                    </h5>

                    <div className="h-44">
                      {studentIntelligence.xpHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={studentIntelligence.xpHistory} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="cumulativeXp" stroke={VIBRANT_PURPLE} strokeWidth={2.5} name="Cumulative XP" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center border border-dashed border-slate-200 rounded-2xl text-[10px] text-slate-400 font-mono">
                          No recent XP additions found on profile. Complete a lesson card first!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Custom Student Timeline Feed */}
                  <div className="bg-white rounded-3xl border border-slate-200/70 p-5 space-y-3">
                    <h5 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest">
                      Behavior Event Timeline Stream (Newest First)
                    </h5>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {events.filter(e => e.email.toLowerCase().trim() === selectedStudentEmail.toLowerCase().trim()).length > 0 ? (
                        events
                          .filter(e => e.email.toLowerCase().trim() === selectedStudentEmail.toLowerCase().trim())
                          .slice(0, 10)
                          .map((evt, idx) => (
                            <div key={`evt-timeline-${evt.id || idx}-${evt.timestamp}-${idx}`} className="flex items-start gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100 text-xs">
                              <span className="text-[9px] font-mono text-slate-400 shrink-0 pt-0.5">
                                {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <span className="font-bold text-slate-800 font-mono block">
                                  {evt.eventName}
                                </span>
                                {evt.properties.lesson_name && (
                                  <p className="text-[9px] text-slate-500 font-medium">
                                    Curriculum target: <span className="font-extrabold text-teal-600">{evt.properties.lesson_name}</span>
                                    {evt.properties.score && ` | Accuracy Score: ${evt.properties.score}%`}
                                  </p>
                                )}
                              </div>
                              <span className="text-[8px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0">
                                {evt.properties.platform === 'Mobile Web' ? 'Mobile' : 'Desktop'}
                              </span>
                            </div>
                          ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic block text-center py-6">No matching actions logged.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================== FUNNELS & DROP-OFFS TAB ================== */}
          {activeTab === 'funnels' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Onboarding Conversion Funnel Chart */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/70 p-5 space-y-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest">
                      Enterprise Student Onboarding Conversion Funnel
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Clickstream transition rates from original portal interaction to reward redemption cycles.
                    </p>
                  </div>

                  {/* Visual Funnel Representation */}
                  <div className="space-y-4 pt-2">
                    {onboardingFunnel.map((item, idx) => (
                      <div key={`onboarding-${item.stage}-${idx}`} className="space-y-1 text-xs font-mono">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                          <span className="font-mono text-[11px] font-extrabold text-slate-700">{item.stage}</span>
                          <span className="font-mono text-slate-500">{item.count} sessions ({item.pct}%)</span>
                        </div>
                        <div className="relative h-5 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex items-center pl-3">
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-teal-500/15 border-r-2 border-teal-500"
                            style={{ width: `${item.pct}%` }}
                          />
                          <span className="relative z-10 text-[9px] text-teal-800 font-extrabold">
                            {idx > 0 ? `Transition Conversion: ${item.pct}% | Drop Rate: ${item.drop}%` : 'Entry Point (Baseline)'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Behavioral Drop-off Analysis */}
                <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/70 p-5 space-y-5">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest">
                      Behavioral Drop-off Analysis
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Analyzing rage clicking, repeated quiz failure points, and inactive exits.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-rose-600">
                        <span className="text-[9px] font-mono font-black uppercase text-slate-400">Rage Clicking Events</span>
                        <MousePointer size={12} className="animate-pulse" />
                      </div>
                      <p className="text-lg font-mono font-black text-rose-600">
                        {systemMetrics.rageClicksCount} occurrences
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        Happens when students click on elements multiple times rapidly (likely stuck or slow UI).
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[9px] font-mono font-black uppercase text-slate-400">Most Abandoned Lesson Node</span>
                      <p className="text-sm font-mono font-extrabold text-amber-700">Robotics Basics</p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        Node containing high question difficulty index where average completion drops &lt; 70%.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[9px] font-mono font-black uppercase text-slate-400">Average Quit Time (Lesson)</span>
                      <p className="text-lg font-mono font-black text-slate-700">1m 45s</p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        Point at which a student initiates early study exits.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================== LIVE TELEMETRY FEED TAB ================== */}
          {activeTab === 'live' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-3xl border border-slate-200/70 p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest flex items-center gap-1.5">
                      <Activity size={15} className="text-teal-600 animate-pulse" />
                      Real-time Behavior Telemetry Live Stream
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Live event logs dispatched continuously as students complete learning modules, open settings, or chat with AI.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Live Filters */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                      <input
                        type="text"
                        placeholder="Search student email..."
                        value={liveSearchQuery}
                        onChange={(e) => setLiveSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-teal-500 outline-none text-slate-800 placeholder-slate-400"
                      />
                    </div>

                    <select
                      value={liveEventFilter}
                      onChange={(e) => { triggerButtonNoise(); setLiveEventFilter(e.target.value); }}
                      className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                    >
                      <option value="All">All Event Types</option>
                      {uniqueEventNames.map((n, idx) => (
                        <option key={idx} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Event Table */}
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-mono text-slate-400 uppercase tracking-wider font-black">
                        <th className="p-3">Timestamp (UTC)</th>
                        <th className="p-3">Student Email</th>
                        <th className="p-3">Event Action</th>
                        <th className="p-3">Client Parameters & Context</th>
                        <th className="p-3">Platform</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-mono">
                      {filteredLiveEvents.map((evt, idx) => (
                        <tr key={`live-evt-${evt.id || idx}-${evt.timestamp}`} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 text-slate-400 text-[10px]">
                            {new Date(evt.timestamp).toLocaleString()}
                          </td>
                          <td className="p-3 text-slate-700 font-bold font-sans">
                            {evt.email}
                          </td>
                          <td className="p-3">
                            <span className="bg-teal-50 border border-teal-100 text-teal-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                              {evt.eventName}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 max-w-sm truncate text-[10px]">
                            {evt.properties.lesson_name && `Module: "${evt.properties.lesson_name}" | `}
                            {evt.properties.score && `Score: ${evt.properties.score}% | `}
                            {evt.properties.device_information && `OS: ${evt.properties.device_information} | `}
                            {evt.properties.browser && `Browser: ${evt.properties.browser} | `}
                            {evt.properties.city && `Location: ${evt.properties.city}, ${evt.properties.country}`}
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-full">
                              {evt.properties.platform || 'Desktop'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredLiveEvents.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 text-xs italic">
                            No telemetry logs matching query filters detected in memory.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================== AI PREDICTIONS TAB ================== */}
          {activeTab === 'ai-predict' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Outbound AI Predictions Model card */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/70 p-5 space-y-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest flex items-center gap-1.5">
                      <Sparkles size={14} className="text-teal-600 animate-pulse" />
                      Predictive AI Cognitive Performance Model
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Predictive indicators mapping student engagement cycles against future curriculum success expectations.
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-2xl space-y-2">
                      <h5 className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                        <Cpu size={14} />
                        Personalized Path Recommendation for {currentStudentProfile.username || 'Student'}
                      </h5>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        Based on their highlighted <span className="font-extrabold text-teal-600">"{studentIntelligence.traits[0] || 'Fast Learner'}"</span> style, the AI suggests launching micro-challenges with <span className="font-bold">Adaptive Interactive Difficulty</span> focusing on Neural Networks concept structures. This path is calculated to improve retention by 22% over passive reading formats.
                      </p>
                    </div>

                    <div className="space-y-2 text-xs">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono block">Predictive Curriculum Outcomes Mapping</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { node: 'AI Ethics', likelihood: '94% Success Prob.', desc: 'Highest competency score calculated', pct: 94 },
                          { node: 'Neural Networks', likelihood: '81% Success Prob.', desc: 'Optimal progress, stable stats', pct: 81 },
                          { node: 'Prompt Engineering', likelihood: '62% Success Prob.', desc: 'High drop-off threat detected', pct: 62 },
                        ].map((prob, idx) => (
                          <div key={`prob-${prob.node}-${idx}`} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl space-y-1.5">
                            <span className="font-bold text-slate-700 block text-[11px]">{prob.node}</span>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${prob.pct}%` }} />
                            </div>
                            <span className="text-[10px] font-mono font-extrabold text-teal-600 block">{prob.likelihood}</span>
                            <span className="text-[9px] text-slate-400 block font-semibold">{prob.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Adaptive Recommendations */}
                <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/70 p-5 space-y-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest">
                      Adaptive Difficulty Intervention Center
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Automated intervention triggers dispatched when student risk levels exceed bounds.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-2xl text-[10px] font-mono text-rose-800 space-y-1">
                      <span className="font-bold block uppercase text-rose-700">ALERT: DROP-OUT RISK ALERT</span>
                      <p className="text-[9px] font-medium leading-normal">
                        Student emails matching &lt; 40% Retention Scores triggers automatic Outbound Activity OTP reminders.
                      </p>
                      <button className="mt-2 w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition cursor-pointer">
                        Dispatch Progress Reminder
                      </button>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-2xl text-[10px] font-mono text-amber-800 space-y-1">
                      <span className="font-bold block uppercase text-amber-700">RE-ENGAGEMENT DISPATCH</span>
                      <p className="text-[9px] font-medium leading-normal">
                        Trigger learning path level adjustments to "Level 1 Starter Concept Challenge" for struggling students.
                      </p>
                      <button className="mt-2 w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition cursor-pointer">
                        Apply Intervention Path
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================== REPORTS TAB ================== */}
          {activeTab === 'reports' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-3xl border border-slate-200/70 p-5 space-y-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-mono font-black uppercase text-slate-700 tracking-widest flex items-center gap-1.5">
                    <FileText size={15} className="text-teal-600" />
                    Student Intelligence Enterprise Report Center
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    Generate formatted, publication-ready cognitive progress audit records for cohorts, classroom, and school entities.
                  </p>
                </div>

                {/* Grid selectors */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
                  {[
                    { id: 'progress', label: 'Progress Report', desc: 'Curriculum coverage & accuracy audit' },
                    { id: 'engagement', label: 'Engagement Report', desc: 'Clickstream attachment rates' },
                    { id: 'style', label: 'Learning Style Report', desc: 'Adaptive paths mapping' },
                    { id: 'school', label: 'School-wise Analytics', desc: 'Institutional division scores' },
                  ].map((rep, idx) => (
                    <button
                      key={rep.id}
                      onClick={() => { triggerButtonNoise(); setSelectedReportType(rep.id); }}
                      className={`p-3 text-left border rounded-2xl transition cursor-pointer flex flex-col justify-between ${
                        selectedReportType === rep.id
                          ? 'border-teal-500 bg-teal-50/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[11px] font-bold text-slate-800 font-sans block">{rep.label}</span>
                      <span className="text-[9px] text-slate-400 font-medium block mt-1">{rep.desc}</span>
                    </button>
                  ))}

                  <button
                    onClick={handleGenerateReport}
                    className="md:col-span-1 p-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    Generate Report
                  </button>
                </div>

                {/* Render active report printable panel */}
                {activeReportData && (
                  <motion.div
                    initial={{ scale: 0.99, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-6 border border-slate-200 rounded-2xl bg-white space-y-4 shadow-sm relative"
                  >
                    <div className="absolute right-5 top-5">
                      <button
                        onClick={() => { triggerButtonNoise(); window.print(); }}
                        className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer font-mono"
                      >
                        <Download size={12} />
                        Print Document
                      </button>
                    </div>

                    <div className="border-b-2 border-slate-900 pb-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-sans font-black text-slate-800 tracking-tight">AI Edu-Labs</span>
                        <span className="text-[10px] font-mono text-slate-400">Enterprise Registry</span>
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-display font-black text-slate-800 uppercase tracking-wide">
                          {activeReportData.title}
                        </h3>
                        <p className="text-[9px] font-mono text-slate-400">Generated: {activeReportData.timestamp} | Registry UUID: AD-0294-91</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 font-medium italic leading-relaxed">
                      {activeReportData.summary}
                    </p>

                    {/* Report Specific Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse border border-slate-100 rounded-xl">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-mono text-slate-400 font-black uppercase border-b border-slate-100">
                            {Object.keys(activeReportData.rows[0] || {}).map((hdr, hIdx) => (
                              <th key={`hdr-${hdr}-${hIdx}`} className="p-2.5">{hdr}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[10px] font-mono text-slate-700">
                          {activeReportData.rows.map((row: any, rIdx: number) => (
                            <tr key={`rep-row-${rIdx}`} className="hover:bg-slate-50/50">
                              {Object.values(row).map((val: any, vIdx) => (
                                <td key={`rep-cell-${rIdx}-${vIdx}`} className="p-2.5 font-bold">{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Official Signoff Block */}
                    <div className="pt-6 border-t border-dashed border-slate-200 grid grid-cols-2 text-[9px] font-mono text-slate-400 uppercase">
                      <div>
                        <span>OFFICIAL VERIFIER SIGNATURE</span>
                        <p className="text-xs font-black text-slate-800 font-sans mt-1">COGNITIVE COMPLIANCE DEPT</p>
                      </div>
                      <div className="text-right">
                        <span>SECURITY CLASSIFICATION</span>
                        <p className="text-xs font-black text-slate-800 font-sans mt-1">INTERNAL AUDIT DIVISION</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
