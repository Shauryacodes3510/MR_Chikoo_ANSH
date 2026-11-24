import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Users, GraduationCap, BookOpen, BarChart3, TrendingUp, 
  Plus, Search, Check, Copy, RefreshCw, AlertCircle, CheckCircle2, 
  X, Filter, ArrowLeft, Mail, Tag, Award, Sparkles, UserCheck, 
  Calendar, Layers, ShieldCheck, Flame, ChevronRight
} from 'lucide-react';
import { 
  schoolService, 
  School, 
  SchoolClass, 
  SchoolTeacher, 
  SchoolStudent, 
  SchoolAnalytics 
} from '../lib/schoolService';
import { soundManager } from '../lib/sounds';

interface SchoolAdminDashboardProps {
  school: School;
  onClose: () => void;
  onNotification?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function SchoolAdminDashboard({
  school,
  onClose,
  onNotification
}: SchoolAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'classes' | 'progress' | 'analytics'>('students');

  // Data states linked to school.id
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<SchoolTeacher[]>([]);
  const [students, setStudents] = useState<SchoolStudent[]>([]);
  const [analytics, setAnalytics] = useState<SchoolAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Modals
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  // Class Form
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('Grade 5');
  const [newClassTeacher, setNewClassTeacher] = useState('');
  const [newClassRoomCode, setNewClassRoomCode] = useState('');

  // Teacher Form
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState('Computer Science & AI');

  // Student Form
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('Grade 5');
  const [newStudentClassId, setNewStudentClassId] = useState('');

  const [copiedCode, setCopiedCode] = useState(false);

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (onNotification) {
      onNotification(msg, type);
    }
  };

  const loadAllSchoolData = async () => {
    setIsLoading(true);
    try {
      const [clsList, tchList, stuList] = await Promise.all([
        schoolService.getSchoolClasses(school.id),
        schoolService.getSchoolTeachers(school.id),
        schoolService.getSchoolStudents(school.id)
      ]);
      setClasses(clsList);
      setTeachers(tchList);
      setStudents(stuList);
      setAnalytics(schoolService.getSchoolAnalytics(stuList, tchList, clsList));
    } catch (err) {
      console.warn('[SchoolAdminDashboard] Load data notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!school || school.status !== 'active') {
      onClose();
      return;
    }
    loadAllSchoolData();
  }, [school?.id, school?.status]);

  if (!school || school.status !== 'active') {
    return null;
  }

  const handleCopySchoolCode = () => {
    navigator.clipboard.writeText(school.school_code);
    setCopiedCode(true);
    soundManager.play('complete');
    notify(`School Code "${school.school_code}" copied to clipboard!`, 'success');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Add Class Handler
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    soundManager.play('click');
    const created = await schoolService.addClass(school.id, {
      name: newClassName.trim(),
      grade_level: newClassGrade,
      teacher_name: newClassTeacher.trim() || 'Unassigned',
      room_code: newClassRoomCode.trim() || `RM-${Math.floor(100 + Math.random() * 900)}`
    });

    setClasses(prev => [created, ...prev]);
    soundManager.play('complete');
    notify(`Class "${created.name}" created!`, 'success');
    setNewClassName('');
    setIsAddClassOpen(false);
  };

  // Add Teacher Handler
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;

    soundManager.play('click');
    const created = await schoolService.addTeacher(school.id, {
      name: newTeacherName.trim(),
      email: newTeacherEmail.trim() || `${newTeacherName.toLowerCase().replace(/\s+/g, '.')}@${school.school_code.toLowerCase()}.edu`,
      subject: newTeacherSubject.trim()
    });

    setTeachers(prev => [created, ...prev]);
    soundManager.play('complete');
    notify(`Teacher "${created.name}" added to school!`, 'success');
    setNewTeacherName('');
    setNewTeacherEmail('');
    setIsAddTeacherOpen(false);
  };

  // Add Student Handler
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const matchedClass = classes.find(c => c.id === newStudentClassId);

    soundManager.play('click');
    const created = await schoolService.addStudent(school.id, {
      name: newStudentName.trim(),
      email: newStudentEmail.trim() || `${newStudentName.toLowerCase().replace(/\s+/g, '.')}@student.${school.school_code.toLowerCase()}.edu`,
      grade: newStudentGrade,
      class_id: newStudentClassId || undefined,
      class_name: matchedClass?.name || 'General'
    });

    setStudents(prev => [created, ...prev]);
    if (analytics) {
      setAnalytics(schoolService.getSchoolAnalytics([created, ...students], teachers, classes));
    }
    soundManager.play('complete');
    notify(`Student "${created.name}" enrolled!`, 'success');
    setNewStudentName('');
    setNewStudentEmail('');
    setIsAddStudentOpen(false);
  };

  // Filtered Students
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.grade && s.grade.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClass = 
      selectedClassFilter === 'all' ? true : s.class_id === selectedClassFilter || s.class_name === selectedClassFilter;

    return matchesSearch && matchesClass;
  });

  // Filtered Teachers
  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered Classes
  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.room_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.teacher_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-end md:justify-center md:p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-slate-50 w-full h-[95vh] md:h-[90vh] md:max-w-6xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 mx-auto"
      >
        {/* HEADER BAR */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <Building2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base md:text-lg font-display font-black text-white">{school.name}</h1>
                <button
                  onClick={handleCopySchoolCode}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-[11px] font-mono font-bold transition-all cursor-pointer"
                  title="Click to copy School Code"
                >
                  <Tag size={10} />
                  <span>{school.school_code}</span>
                  {copiedCode ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                </button>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active School Portal
                </span>
              </div>
              <p className="text-[11px] text-indigo-200/80 font-medium mt-0.5">
                Multi-Tenant Administration • Linked School ID: <span className="font-mono text-indigo-300">{school.id.slice(0, 10)}...</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.play('click');
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <X size={15} />
            <span className="hidden sm:inline">Back to Chikoo</span>
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div className="bg-white border-b border-slate-200/80 px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto shrink-0 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { soundManager.play('click'); setActiveTab('students'); }}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users size={14} />
              <span>Students ({students.length})</span>
            </button>

            <button
              onClick={() => { soundManager.play('click'); setActiveTab('teachers'); }}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'teachers'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <GraduationCap size={14} />
              <span>Teachers ({teachers.length})</span>
            </button>

            <button
              onClick={() => { soundManager.play('click'); setActiveTab('classes'); }}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'classes'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen size={14} />
              <span>Classes ({classes.length})</span>
            </button>

            <button
              onClick={() => { soundManager.play('click'); setActiveTab('progress'); }}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'progress'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <TrendingUp size={14} />
              <span>Student Progress</span>
            </button>

            <button
              onClick={() => { soundManager.play('click'); setActiveTab('analytics'); }}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 size={14} />
              <span>Analytics & KPIs</span>
            </button>
          </div>

          <button
            onClick={loadAllSchoolData}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Refresh school records"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ======================================================== */}
          {/* TAB 1: STUDENTS                                          */}
          {/* ======================================================== */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search students by name, grade..."
                    className="w-full pl-9.5 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <select
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
                  >
                    <option value="all">All Classes</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      soundManager.play('click');
                      setIsAddStudentOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    <Plus size={14} />
                    <span>Enroll Student</span>
                  </button>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Student Name</th>
                        <th className="px-5 py-3">Class / Section</th>
                        <th className="px-5 py-3">Grade</th>
                        <th className="px-5 py-3">Cookies / Gems</th>
                        <th className="px-5 py-3">Accuracy</th>
                        <th className="px-5 py-3">Streak</th>
                        <th className="px-5 py-3">Lessons Done</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                {s.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 block">{s.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{s.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-slate-700">
                            {s.class_name || 'General Class'}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                              {s.grade}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1 font-black text-amber-600">
                              <img src="/cookies.webp" alt="Cookies" className="w-3.5 h-3.5 object-contain" />
                              <span>{s.gems ?? 50}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full" 
                                  style={{ width: `${s.accuracy || 92}%` }} 
                                />
                              </div>
                              <span className="font-bold text-slate-700 text-[11px]">{s.accuracy || 92}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1 font-bold text-orange-600">
                              <Flame size={12} className="fill-orange-500" />
                              <span>{s.streak || 1}d</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-indigo-700">
                            {s.completed_lessons_count || 0} modules
                          </td>
                        </tr>
                      ))}
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-5 py-8 text-center text-slate-400 font-medium">
                            No students match your filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: TEACHERS                                          */}
          {/* ======================================================== */}
          {activeTab === 'teachers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search teachers by name, subject..."
                    className="w-full pl-9.5 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => {
                    soundManager.play('click');
                    setIsAddTeacherOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                  <span>Add Teacher</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeachers.map((t) => (
                  <div key={t.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-sm border border-indigo-100">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs">{t.name}</h4>
                          <p className="text-[10.5px] text-slate-400 font-medium">{t.subject}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        Active
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-slate-400" />
                        <span className="font-mono">{t.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen size={12} className="text-slate-400" />
                        <span>Assigned: <strong>{t.assigned_classes?.join(', ') || 'AI Explorers'}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: CLASSES                                           */}
          {/* ======================================================== */}
          {activeTab === 'classes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search classes by name, room..."
                    className="w-full pl-9.5 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => {
                    soundManager.play('click');
                    setIsAddClassOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                  <span>Create Class Section</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClasses.map((c) => (
                  <div key={c.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase tracking-wider">
                          {c.grade_level}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-1.5">{c.name}</h4>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {c.room_code}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Teacher:</span>
                        <span className="font-bold text-slate-800">{c.teacher_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Enrolled Students:</span>
                        <span className="font-bold text-indigo-700">{c.student_count || 24} students</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: STUDENT PROGRESS                                  */}
          {/* ======================================================== */}
          {activeTab === 'progress' && (
            <div className="space-y-6">
              {/* Progress Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Curriculum Mastery</span>
                    <Award size={16} className="text-amber-500" />
                  </div>
                  <div className="mt-2 text-2xl font-display font-black text-slate-900">
                    {analytics?.avgMastery || 94}%
                  </div>
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">↑ +4.2% from last week</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Learning Time</span>
                    <Sparkles size={16} className="text-indigo-500" />
                  </div>
                  <div className="mt-2 text-2xl font-display font-black text-slate-900">
                    {analytics?.weeklyLearningHours || 82} hrs
                  </div>
                  <p className="text-[11px] text-indigo-600 font-bold mt-1">Average 3.4 hrs / student</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Daily Streak Retention</span>
                    <Flame size={16} className="text-orange-500 fill-orange-500" />
                  </div>
                  <div className="mt-2 text-2xl font-display font-black text-slate-900">
                    {analytics?.activeStreakRate || 85}%
                  </div>
                  <p className="text-[11px] text-orange-600 font-bold mt-1">Consistent daily explorers</p>
                </div>
              </div>

              {/* Module Progress Breakdown */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
                <h3 className="font-display font-black text-sm text-slate-900">School-Wide AI Curriculum Breakdown</h3>
                <div className="space-y-3">
                  {analytics?.topModules.map((m) => (
                    <div key={m.title} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-800">{m.title}</span>
                        <span className="font-bold text-indigo-700">{m.completionRate}% completed</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${m.completionRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: ANALYTICS & KPIS                                  */}
          {/* ======================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* High-level KPI Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block">Total Students</span>
                  <div className="text-xl font-display font-black text-slate-900 mt-1">
                    {students.length}
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block">Active Teachers</span>
                  <div className="text-xl font-display font-black text-indigo-700 mt-1">
                    {teachers.length}
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block">Active Classrooms</span>
                  <div className="text-xl font-display font-black text-violet-700 mt-1">
                    {classes.length}
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block">Total Cookies Earned</span>
                  <div className="text-xl font-display font-black text-amber-600 mt-1 flex items-center gap-1">
                    <img src="/cookies.webp" alt="Cookies" className="w-4 h-4 object-contain" />
                    <span>{students.reduce((acc, s) => acc + (s.gems || 50), 0)}</span>
                  </div>
                </div>
              </div>

              {/* Weekly Activity Chart representation */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-black text-sm text-slate-900">Weekly Active Students & Completed Lessons</h3>
                  <span className="text-xs text-slate-400 font-medium">Real-Time Sync</span>
                </div>

                <div className="grid grid-cols-7 gap-2 pt-4">
                  {analytics?.dailyActivity.map((d) => (
                    <div key={d.day} className="flex flex-col items-center gap-2">
                      <div className="h-32 w-full bg-slate-50 rounded-xl flex flex-col justify-end p-1.5 relative group border border-slate-100">
                        <div 
                          className="w-full bg-indigo-500 rounded-lg transition-all duration-300 group-hover:bg-indigo-600"
                          style={{ height: `${Math.min(100, (d.activeCount / (students.length || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{d.day}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{d.activeCount} stu</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODALS: ADD CLASS */}
        <AnimatePresence>
          {isAddClassOpen && (
            <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-display font-black text-sm text-slate-900">Create Class Section</h3>
                  <button onClick={() => setIsAddClassOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                </div>
                <form onSubmit={handleAddClass} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Class / Section Name</label>
                    <input
                      type="text"
                      required
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="e.g. Grade 5 - AI Visionaries"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Grade Level</label>
                      <select
                        value={newClassGrade}
                        onChange={(e) => setNewClassGrade(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="Grade 5">Grade 5</option>
                        <option value="Grade 6">Grade 6</option>
                        <option value="Grade 7">Grade 7</option>
                        <option value="Grade 8">Grade 8</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Room Code</label>
                      <input
                        type="text"
                        value={newClassRoomCode}
                        onChange={(e) => setNewClassRoomCode(e.target.value)}
                        placeholder="e.g. RM-502"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Teacher</label>
                    <input
                      type="text"
                      value={newClassTeacher}
                      onChange={(e) => setNewClassTeacher(e.target.value)}
                      placeholder="e.g. Dr. Evelyn Reed"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setIsAddClassOpen(false)} className="px-3.5 py-2 text-xs text-slate-600 font-bold">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-xs hover:bg-indigo-700">Create Class</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODALS: ADD TEACHER */}
        <AnimatePresence>
          {isAddTeacherOpen && (
            <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-display font-black text-sm text-slate-900">Add School Teacher</h3>
                  <button onClick={() => setIsAddTeacherOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                </div>
                <form onSubmit={handleAddTeacher} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Teacher Name</label>
                    <input
                      type="text"
                      required
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      placeholder="e.g. Prof. Alan Turing"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newTeacherEmail}
                      onChange={(e) => setNewTeacherEmail(e.target.value)}
                      placeholder="e.g. alan@academy.edu"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Domain</label>
                    <input
                      type="text"
                      value={newTeacherSubject}
                      onChange={(e) => setNewTeacherSubject(e.target.value)}
                      placeholder="e.g. Robotics & Neural Networks"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setIsAddTeacherOpen(false)} className="px-3.5 py-2 text-xs text-slate-600 font-bold">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-xs hover:bg-indigo-700">Add Teacher</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODALS: ADD STUDENT */}
        <AnimatePresence>
          {isAddStudentOpen && (
            <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-display font-black text-sm text-slate-900">Enroll Student</h3>
                  <button onClick={() => setIsAddStudentOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                </div>
                <form onSubmit={handleAddStudent} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Student Full Name</label>
                    <input
                      type="text"
                      required
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="e.g. Maya Lin"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      placeholder="e.g. maya.lin@student.edu"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Grade</label>
                      <select
                        value={newStudentGrade}
                        onChange={(e) => setNewStudentGrade(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="Grade 5">Grade 5</option>
                        <option value="Grade 6">Grade 6</option>
                        <option value="Grade 7">Grade 7</option>
                        <option value="Grade 8">Grade 8</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Assign Class</label>
                      <select
                        value={newStudentClassId}
                        onChange={(e) => setNewStudentClassId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="">General (No Class)</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setIsAddStudentOpen(false)} className="px-3.5 py-2 text-xs text-slate-600 font-bold">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-xs hover:bg-indigo-700">Enroll Student</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
