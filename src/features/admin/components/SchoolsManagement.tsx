import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Plus, Search, Check, Copy, RefreshCw, AlertCircle, 
  ShieldCheck, CheckCircle2, X, Lock, Mail, Tag, Eye, EyeOff, 
  Power, PowerOff, Filter, School as SchoolIcon
} from 'lucide-react';
import { schoolService, School } from '../../../lib/schoolService';
import { soundManager } from '../../../lib/sounds';

interface SchoolsManagementProps {
  onNotification?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function SchoolsManagement({ onNotification }: SchoolsManagementProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Create School Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Copied code feedback
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (onNotification) {
      onNotification(msg, type);
    }
  };

  const loadSchools = async () => {
    setIsLoading(true);
    try {
      const data = await schoolService.getAllSchools();
      setSchools(data);
    } catch (err: any) {
      notify('Failed to load schools directory.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    soundManager.play('complete');
    notify(`School code "${code}" copied!`, 'success');
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const handleToggleStatus = async (school: School) => {
    const newStatus = school.status === 'active' ? 'inactive' : 'active';
    soundManager.play('click');

    // Optimistic update
    setSchools(prev => prev.map(s => s.id === school.id ? { ...s, status: newStatus } : s));

    const res = await schoolService.toggleSchoolStatus(school.id, newStatus);
    if (res.success) {
      soundManager.play('complete');
      notify(`School "${school.name}" marked as ${newStatus}.`, 'success');
    } else {
      // Revert
      setSchools(prev => prev.map(s => s.id === school.id ? { ...s, status: school.status } : s));
      notify(res.error || 'Failed to update school status.', 'error');
    }
  };

  const handleCreateSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic frontend checks
    if (!name.trim()) {
      setFormError('School Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('A valid School Email address is required.');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (!schoolCode.trim()) {
      setFormError('School Code is required (e.g., SCH-101).');
      return;
    }

    setIsSubmitting(true);
    soundManager.play('click');

    const result = await schoolService.createSchool({
      name: name.trim(),
      email: email.trim(),
      password,
      school_code: schoolCode.trim()
    });

    setIsSubmitting(false);

    if (result.success && result.school) {
      soundManager.play('complete');
      notify(`School "${result.school.name}" created successfully!`, 'success');
      setSchools(prev => [result.school!, ...prev.filter(s => s.id !== result.school!.id)]);
      
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setSchoolCode('');
      setIsCreateModalOpen(false);
    } else {
      soundManager.play('incorrect');
      setFormError(result.error || 'Failed to create school account.');
    }
  };

  // Auto-generate a clean school code suggestion when typing school name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!schoolCode || schoolCode.startsWith('SCH-')) {
      const acronym = val
        .split(' ')
        .filter(w => w.length > 0)
        .map(w => w[0].toUpperCase())
        .join('')
        .slice(0, 4);
      if (acronym) {
        setSchoolCode(`SCH-${acronym}-${Math.floor(10 + Math.random() * 90)}`);
      }
    }
  };

  const filteredSchools = schools.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.school_code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ? true : s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = schools.filter(s => s.status === 'active').length;
  const inactiveCount = schools.filter(s => s.status === 'inactive').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
            <Building2 size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-display font-black text-slate-900">Schools Management</h2>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                Multi-Tenant
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Create school accounts, assign secure credentials, and manage tenant activation status.
            </p>
          </div>
        </div>

        {/* Action button & Stats pill */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-2xl px-3.5 py-2 text-xs">
            <span className="text-slate-500 font-semibold">Total: <strong className="text-slate-800">{schools.length}</strong></span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-600 font-bold">{activeCount} Active</span>
            {inactiveCount > 0 && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-rose-600 font-bold">{inactiveCount} Inactive</span>
              </>
            )}
          </div>

          <button
            onClick={() => {
              soundManager.play('click');
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4.5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <Plus size={15} strokeWidth={3} />
            <span>Create School</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by school name, email, or code..."
            className="w-full pl-9.5 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/60 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({schools.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                statusFilter === 'inactive' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Inactive ({inactiveCount})
            </button>
          </div>

          <button
            onClick={loadSchools}
            disabled={isLoading}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-600 transition-all"
            title="Refresh schools list"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Schools Table / Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-indigo-500" />
            <p className="text-xs font-semibold text-slate-500">Loading schools directory...</p>
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="py-16 text-center px-4 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <SchoolIcon size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {searchQuery || statusFilter !== 'all' ? 'No matching schools found' : 'No schools created yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search query or status filter.'
                : 'Get started by creating your first school account using the button above.'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 transition-all cursor-pointer"
              >
                <Plus size={14} /> Create First School
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">School Details</th>
                    <th className="px-5 py-3.5">School Code</th>
                    <th className="px-5 py-3.5">Admin Email</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Created Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSchools.map((school) => (
                    <tr key={school.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* School Details */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-100">
                            {school.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{school.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {school.id.slice(0, 12)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* School Code */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleCopyCode(school.school_code, school.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-mono font-bold text-[11px] transition-all cursor-pointer group"
                          title="Click to copy school code"
                        >
                          <Tag size={11} className="text-slate-400 group-hover:text-indigo-600" />
                          <span>{school.school_code}</span>
                          {copiedCodeId === school.id ? (
                            <Check size={11} className="text-emerald-600 font-bold" />
                          ) : (
                            <Copy size={11} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </td>

                      {/* Admin Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Mail size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{school.email}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {school.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="px-5 py-4 text-slate-500 font-medium">
                        {school.created_at ? new Date(school.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(school)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                            school.status === 'active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/50'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50'
                          }`}
                          title={school.status === 'active' ? 'Deactivate School' : 'Activate School'}
                        >
                          {school.status === 'active' ? (
                            <>
                              <PowerOff size={11} />
                              <span>Deactivate</span>
                            </>
                          ) : (
                            <>
                              <Power size={11} />
                              <span>Activate</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-slate-100 p-3 space-y-3">
              {filteredSchools.map((school) => (
                <div key={school.id} className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-base shrink-0 border border-indigo-200">
                        {school.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-900 text-sm truncate">{school.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {school.id.slice(0, 10)}...</span>
                      </div>
                    </div>
                    {school.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200/60">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Tag size={12} className="text-slate-400" /> Code:
                      </span>
                      <button
                        onClick={() => handleCopyCode(school.school_code, school.id)}
                        className="inline-flex items-center gap-1 font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100"
                      >
                        <span>{school.school_code}</span>
                        {copiedCodeId === school.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} className="text-slate-400" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200/60">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Mail size={12} className="text-slate-400" /> Admin:
                      </span>
                      <span className="font-mono text-slate-800 truncate max-w-[180px]">{school.email}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-medium">
                      Created: {school.created_at ? new Date(school.created_at).toLocaleDateString() : '—'}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(school)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-h-[40px] ${
                        school.status === 'active'
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {school.status === 'active' ? (
                        <>
                          <PowerOff size={13} />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <Power size={13} />
                          <span>Activate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CREATE SCHOOL MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base text-white">Create New School</h3>
                    <p className="text-[11px] text-indigo-200 font-medium">
                      Provisions Supabase Auth credentials & tenant database record.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundManager.play('click');
                    setIsCreateModalOpen(false);
                    setFormError(null);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleCreateSchoolSubmit} className="p-6 space-y-4">
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 font-medium"
                  >
                    <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </motion.div>
                )}

                {/* 1. School Name */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    School Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Oakridge STEM Academy"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* 2. School Code */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>School Code <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">Unique tenant identifier</span>
                  </label>
                  <div className="relative">
                    <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={schoolCode}
                      onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SCH-OAK-01"
                      className="w-full pl-9.5 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-900 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* 3. School Email */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    School Admin Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. admin@oakridge-academy.edu"
                      className="w-full pl-9.5 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* 4. Password */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Initial Password <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">Min 6 characters</span>
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 flex items-center gap-2 font-medium">
                  <ShieldCheck size={15} className="text-indigo-600 shrink-0" />
                  <span>
                    Secured via server-side Auth creation. Passwords are never saved in database tables.
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('click');
                      setIsCreateModalOpen(false);
                      setFormError(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Provisioning School...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Create School Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
