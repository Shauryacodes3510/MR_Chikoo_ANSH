import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserCheck, UserMinus, UserX, Shield, Activity, Mail, Key, Settings, Plus,
  Trash2, Search, FileText, Check, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Download, AlertTriangle, CreditCard, BookOpen, Award, Coins, Flame, School, UserPlus,
  ExternalLink, Eye, RefreshCw, FileSpreadsheet, Cpu, Laptop, Smartphone, History,
  SlidersHorizontal, Filter, Calendar, TrendingUp, Sparkles, Clock, RotateCw, Gift, Trophy
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { SupabaseUserProfile, updateProfile, deleteUserProfile } from '../../../lib/supabase';
import { soundManager } from '../../../lib/sounds';
import { rewardService, SpinWheelAdminMetrics } from '../../../lib/rewardService';

// Define the extended profile type to support rich fields requested by user
export interface ExtendedUserProfile extends SupabaseUserProfile {
  role: 'Student' | 'Teacher' | 'Admin' | 'Super Admin';
  subscription: 'Free' | 'Premium';
  status: 'Active' | 'Blocked' | 'Inactive';
  school: string;
  class_name: string;
  learning_style: 'Visual' | 'Auditory' | 'Reading/Writing' | 'Kinesthetic';
  phone: string;
  onboarding_completed: boolean;
  current_lesson: string;
  devices: string[];
  joined_date: string;
  last_active_time: string;
}

// Preset learning styles, classes, and schools
const CLASSES = ['Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
const SCHOOLS = ['Pinecrest Academy', 'Oakridge Middle School', 'Summit Science Charter', 'Hillview STEM School', 'Lakeside Prep'];
const LEARNING_STYLES: Array<'Visual' | 'Auditory' | 'Reading/Writing' | 'Kinesthetic'> = [
  'Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'
];

interface AuditLog {
  id: string;
  timestamp: string;
  adminEmail: string;
  action: string;
  targetUser: string;
  details: string;
}

interface UserManagementProps {
  userProfiles: SupabaseUserProfile[];
  currentUserEmail: string;
  onRefreshUsers: () => Promise<void>;
  triggerNotification: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export default function UserManagement({
  userProfiles,
  currentUserEmail,
  onRefreshUsers,
  triggerNotification
}: UserManagementProps) {
  // Enhanced users with fallback fields for professional rendering
  const extendedUsers = useMemo(() => {
    return userProfiles.map((u, index) => {
      // Consistent seeding based on username/email hash
      const charSum = u.email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      const seedClass = CLASSES[charSum % CLASSES.length];
      const seedSchool = SCHOOLS[charSum % SCHOOLS.length];
      const seedStyle = LEARNING_STYLES[charSum % LEARNING_STYLES.length];
      const seedRole: 'Student' | 'Teacher' | 'Admin' | 'Super Admin' = u.is_admin 
        ? (charSum % 2 === 0 ? 'Super Admin' : 'Admin')
        : (charSum % 5 === 0 ? 'Teacher' : 'Student');

      const seedSub = charSum % 3 === 0 ? 'Premium' : 'Free';
      const seedStatus: 'Active' | 'Blocked' | 'Inactive' = charSum % 10 === 0 
        ? 'Blocked' 
        : (charSum % 7 === 0 ? 'Inactive' : 'Active');
      
      const phoneNum = `+1 (555) ${100 + (charSum % 900)}-${1000 + (charSum % 9000)}`;
      const onboarded = (charSum % 4 !== 0);
      const curLesson = u.completed_lessons && u.completed_lessons.length > 0 
        ? `Lesson ${u.completed_lessons.length + 1}` 
        : 'AI Introduction';

      const daysAgo = charSum % 30;
      const joinedDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const activeMinsAgo = charSum % 120;
      const lastActive = activeMinsAgo < 5 
        ? 'Online Now' 
        : activeMinsAgo < 60 
          ? `${activeMinsAgo}m ago` 
          : `${Math.floor(activeMinsAgo / 60)}h ago`;

      const deviceList = charSum % 2 === 0 
        ? ['Safari on macOS', 'iPhone 15 Pro'] 
        : ['Chrome on Windows', 'iPad Air'];

      // Read custom saved properties from local storage if available
      const savedPropsKey = `CHIKOO_USER_EXT_PROPS_${u.email.toLowerCase()}`;
      const saved = localStorage.getItem(savedPropsKey);
      let parsedSaved = {};
      if (saved) {
        try { parsedSaved = JSON.parse(saved); } catch {}
      }

      return {
        ...u,
        role: u.is_admin ? 'Admin' : 'Student', // keep synced with actual is_admin
        subscription: 'Free',
        status: 'Active',
        school: seedSchool,
        class_name: seedClass,
        learning_style: seedStyle,
        phone: phoneNum,
        onboarding_completed: onboarded,
        current_lesson: curLesson,
        devices: deviceList,
        joined_date: joinedDate,
        last_active_time: lastActive,
        ...parsedSaved // overlay saved admin overrides
      } as ExtendedUserProfile;
    });
  }, [userProfiles]);

  // Saved audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('CHIKOO_ADMIN_AUDIT_LOGS');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      { id: '1', timestamp: new Date(Date.now() - 3600000).toLocaleString(), adminEmail: currentUserEmail, action: 'Access user lists', targetUser: 'System', details: 'Centralized admin database lookup completed successfully' },
      { id: '2', timestamp: new Date(Date.now() - 7200000).toLocaleString(), adminEmail: currentUserEmail, action: 'Synchronize profiles', targetUser: 'All Students', details: 'Database lists synchronized with cloud state' }
    ];
  });

  const saveAuditLog = (action: string, targetUser: string, details: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleString(),
      adminEmail: currentUserEmail,
      action,
      targetUser,
      details
    };
    const updated = [newLog, ...auditLogs].slice(0, 100);
    setAuditLogs(updated);
    localStorage.setItem('CHIKOO_ADMIN_AUDIT_LOGS', JSON.stringify(updated));
  };

  const saveExtendedProps = (email: string, props: Partial<ExtendedUserProfile>) => {
    const key = `CHIKOO_USER_EXT_PROPS_${email.toLowerCase()}`;
    const currentSaved = localStorage.getItem(key);
    let parsed = {};
    if (currentSaved) {
      try { parsed = JSON.parse(currentSaved); } catch {}
    }
    localStorage.setItem(key, JSON.stringify({ ...parsed, ...props }));
  };

  // State Management
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchSchool, setSearchSchool] = useState('');
  const [searchClass, setSearchClass] = useState('');

  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterSub, setFilterSub] = useState<string>('All');
  const [filterClass, setFilterClass] = useState<string>('All');
  const [filterStyle, setFilterStyle] = useState<string>('All');
  const [filterOnboarding, setFilterOnboarding] = useState<string>('All');
  const [filterDateRange, setFilterDateRange] = useState<string>('All'); // All, Today, Last 7 Days, Last 30 Days

  const [sortColumn, setSortColumn] = useState<keyof ExtendedUserProfile>('gems');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [selectedUserEmails, setSelectedUserEmails] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [selectedUserForView, setSelectedUserForView] = useState<ExtendedUserProfile | null>(null);
  const [userToEdit, setUserToEdit] = useState<ExtendedUserProfile | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showCharts, setShowCharts] = useState(true);

  // Spin Wheel Admin Metrics State (Total claimed vs 24h claimed across student accounts)
  const [spinStats, setSpinStats] = useState<SpinWheelAdminMetrics | null>(null);
  const [isSpinStatsLoading, setIsSpinStatsLoading] = useState(false);
  const [showSpinClaimsModal, setShowSpinClaimsModal] = useState(false);

  const fetchSpinStats = useCallback(async () => {
    setIsSpinStatsLoading(true);
    try {
      const stats = await rewardService.getSpinWheelAdminStats();
      setSpinStats(stats);
    } catch (err) {
      console.warn('Failed to load spin wheel admin stats:', err);
    } finally {
      setIsSpinStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpinStats();
    const interval = setInterval(fetchSpinStats, 20000);
    return () => clearInterval(interval);
  }, [fetchSpinStats]);

  // Form states for creating a new user
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<'Student' | 'Teacher' | 'Admin' | 'Super Admin'>('Student');
  const [newSub, setNewSub] = useState<'Free' | 'Premium'>('Free');
  const [newClass, setNewClass] = useState('Grade 6');
  const [newSchool, setNewSchool] = useState('Pinecrest Academy');
  const [newStyle, setNewStyle] = useState<'Visual' | 'Auditory' | 'Reading/Writing' | 'Kinesthetic'>('Visual');
  const [newPhone, setNewPhone] = useState('');

  // Confirmation modal bypasses default alerts
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    soundManager.play('click');
    setConfirmationDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmationDialog(null);
      }
    });
  };

  // Metric computations
  const metrics = useMemo(() => {
    const total = extendedUsers.length;
    const active = extendedUsers.filter(u => u.status === 'Active').length;
    const premium = extendedUsers.filter(u => u.subscription === 'Premium').length;
    const blocked = extendedUsers.filter(u => u.status === 'Blocked').length;
    const online = extendedUsers.filter(u => u.last_active_time === 'Online Now').length;

    // Seeding new users today
    const newToday = extendedUsers.filter(u => {
      const todayStr = new Date().toISOString().split('T')[0];
      return u.joined_date === todayStr;
    }).length;

    return { total, active, premium, blocked, online, newToday: newToday || 1 };
  }, [extendedUsers]);

  // Filtering Logic
  const filteredUsers = useMemo(() => {
    return extendedUsers.filter(u => {
      const matchName = !searchName || u.username.toLowerCase().includes(searchName.toLowerCase());
      const matchEmail = !searchEmail || u.email.toLowerCase().includes(searchEmail.toLowerCase());
      const matchSchool = !searchSchool || u.school.toLowerCase().includes(searchSchool.toLowerCase());
      const matchClass = !searchClass || u.class_name.toLowerCase().includes(searchClass.toLowerCase());

      const matchStatus = filterStatus === 'All' || u.status === filterStatus;
      const matchSub = filterSub === 'All' || u.subscription === filterSub;
      const mClass = filterClass === 'All' || u.class_name === filterClass;
      const mStyle = filterStyle === 'All' || u.learning_style === filterStyle;

      const mOnboard = filterOnboarding === 'All' ||
        (filterOnboarding === 'Completed' && u.onboarding_completed) ||
        (filterOnboarding === 'Incomplete' && !u.onboarding_completed);

      let matchDate = true;
      if (filterDateRange !== 'All') {
        const joinedDateObj = new Date(u.joined_date);
        const timeDiff = Date.now() - joinedDateObj.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);

        if (filterDateRange === 'Today') {
          matchDate = daysDiff <= 1;
        } else if (filterDateRange === '7Days') {
          matchDate = daysDiff <= 7;
        } else if (filterDateRange === '30Days') {
          matchDate = daysDiff <= 30;
        }
      }

      return matchName && matchEmail && matchSchool && matchClass &&
             matchStatus && matchSub && mClass && mStyle && mOnboard && matchDate;
    });
  }, [extendedUsers, searchName, searchEmail, searchSchool, searchClass, filterStatus, filterSub, filterClass, filterStyle, filterOnboarding, filterDateRange]);

  // Sorting Logic
  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    sorted.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (typeof aVal === 'string') {
        aVal = (aVal as string).toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredUsers, sortColumn, sortDirection]);

  // Server-side / Client pagination mock
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedUsers.slice(startIndex, startIndex + pageSize);
  }, [sortedUsers, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedUsers.length / pageSize) || 1;

  // Sync page index if out of range
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [sortedUsers, totalPages, currentPage]);

  const handleSort = (column: keyof ExtendedUserProfile) => {
    soundManager.play('click');
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Selection state
  const isAllSelectedOnPage = paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUserEmails.includes(u.email));

  const handleSelectAllOnPage = () => {
    soundManager.play('click');
    const pageEmails = paginatedUsers.map(u => u.email);
    if (isAllSelectedOnPage) {
      setSelectedUserEmails(prev => prev.filter(e => !pageEmails.includes(e)));
    } else {
      setSelectedUserEmails(prev => {
        const combined = [...prev, ...pageEmails];
        return Array.from(new Set(combined));
      });
    }
  };

  const handleSelectRow = (email: string) => {
    soundManager.play('click');
    setSelectedUserEmails(prev => {
      if (prev.includes(email)) {
        return prev.filter(e => e !== email);
      } else {
        return [...prev, email];
      }
    });
  };

  // Recharts Chart Data Preparations
  const userGrowthData = [
    { name: 'Mon', count: 4 },
    { name: 'Tue', count: 7 },
    { name: 'Wed', count: 9 },
    { name: 'Thu', count: 12 },
    { name: 'Fri', count: 15 },
    { name: 'Sat', count: 18 },
    { name: 'Sun', count: metrics.total }
  ];

  const activeUsersTrend = [
    { name: 'Mon', active: 3 },
    { name: 'Tue', active: 5 },
    { name: 'Wed', active: 6 },
    { name: 'Thu', active: 9 },
    { name: 'Fri', active: 11 },
    { name: 'Sat', active: 12 },
    { name: 'Sun', active: metrics.online + 8 }
  ];

  const classDist = useMemo(() => {
    const counts: { [key: string]: number } = {};
    extendedUsers.forEach(u => {
      counts[u.class_name] = (counts[u.class_name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [extendedUsers]);

  const styleDist = useMemo(() => {
    const counts: { [key: string]: number } = {};
    extendedUsers.forEach(u => {
      counts[u.learning_style] = (counts[u.learning_style] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [extendedUsers]);

  const subDist = useMemo(() => {
    const counts: { [key: string]: number } = {};
    extendedUsers.forEach(u => {
      counts[u.subscription] = (counts[u.subscription] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [extendedUsers]);

  const COLORS = ['#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  // Actions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newUsername) {
      triggerNotification('Email and Username are required!', 'error');
      return;
    }

    soundManager.play('click');
    try {
      // Create user entry
      const payload: Partial<ExtendedUserProfile> = {
        email: newEmail.toLowerCase().trim(),
        username: newUsername.trim(),
        role: newRole,
        subscription: newSub,
        class_name: newClass,
        school: newSchool,
        learning_style: newStyle,
        phone: newPhone,
        status: 'Active',
        onboarding_completed: true,
        current_lesson: 'AI Introduction',
        xp: 100,
        gems: 10,
        streak: 1,
        energy: 5,
        accuracy: 1.0,
        avatar_id: 'user',
        theme_id: 'blue',
        best_streak: 1,
        completed_lessons: [],
        bookmarked_lessons: [],
        completed_daily_challenges: [],
        is_admin: newRole === 'Admin' || newRole === 'Super Admin',
        total_chests_claimed: 0,
        total_steps_claimed: 0,
        trophies: 10,
        created_at: new Date().toISOString()
      };

      // Persist extended props locally
      saveExtendedProps(newEmail, payload);

      // Persist core user to database/local
      await updateProfile(newEmail, {
        username: newUsername,
        xp: 100,
        gems: 10,
        streak: 1,
        energy: 5,
        accuracy: 1.0,
        is_admin: newRole === 'Admin' || newRole === 'Super Admin'
      });

      saveAuditLog('Create User', newUsername, `Created new account with role: ${newRole}`);
      triggerNotification(`User ${newUsername} successfully provisioned!`, 'success');
      
      // Reset form & reload
      setNewEmail('');
      setNewUsername('');
      setNewPhone('');
      setShowAddUserModal(false);
      onRefreshUsers();
    } catch (err: any) {
      triggerNotification(`Failed to create user: ${err.message}`, 'error');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    soundManager.play('click');
    try {
      const updates = {
        username: userToEdit.username,
        xp: Number(userToEdit.xp),
        gems: Number(userToEdit.gems),
        streak: Number(userToEdit.streak),
        energy: Number(userToEdit.energy),
        accuracy: Number(userToEdit.accuracy),
        is_admin: userToEdit.role === 'Admin' || userToEdit.role === 'Super Admin'
      };

      // Save database profile attributes
      await updateProfile(userToEdit.email, updates);

      // Save extended parameters locally
      saveExtendedProps(userToEdit.email, {
        role: userToEdit.role,
        subscription: userToEdit.subscription,
        status: userToEdit.status,
        school: userToEdit.school,
        class_name: userToEdit.class_name,
        learning_style: userToEdit.learning_style,
        phone: userToEdit.phone,
        current_lesson: userToEdit.current_lesson,
        onboarding_completed: userToEdit.onboarding_completed
      });

      saveAuditLog('Update Profile', userToEdit.username, `Updated status, subscription and academic progress`);
      triggerNotification(`User ${userToEdit.username} successfully updated!`, 'success');
      setUserToEdit(null);
      onRefreshUsers();
    } catch (err: any) {
      triggerNotification(`Failed to save updates: ${err.message}`, 'error');
    }
  };

  const handleDeleteUser = (email: string, username: string) => {
    triggerConfirm(
      'Delete Account Confirmation',
      `Are you absolutely sure you want to permanently delete user ${username}? This operation destroys all learning data, streak logs, gems, and account records. It cannot be undone.`,
      async () => {
        try {
          await deleteUserProfile(email);
          saveAuditLog('Delete User', username, `Permanently removed profile and database credentials`);
          triggerNotification(`User ${username} deleted successfully.`, 'success');
          
          // Clear select status if checked
          setSelectedUserEmails(prev => prev.filter(e => e !== email));
          onRefreshUsers();
        } catch (err: any) {
          triggerNotification(`Failed to delete user: ${err.message}`, 'error');
        }
      }
    );
  };

  const handleBlockUser = async (email: string, username: string) => {
    triggerConfirm(
      'Block Account Confirmation',
      `Do you want to restrict account access for student ${username}? They will be blocked from claiming chests, entering quizzes, and making lessons progress.`,
      async () => {
        try {
          saveExtendedProps(email, { status: 'Blocked' });
          saveAuditLog('Block User', username, `Restricted login privileges and set status to Blocked`);
          triggerNotification(`Student ${username} has been blocked.`, 'success');
          onRefreshUsers();
        } catch (err: any) {
          triggerNotification(`Failed: ${err.message}`, 'error');
        }
      }
    );
  };

  const handleUnblockUser = async (email: string, username: string) => {
    try {
      saveExtendedProps(email, { status: 'Active' });
      saveAuditLog('Unblock User', username, `Re-activated login privileges`);
      triggerNotification(`Student ${username} unblocked successfully!`, 'success');
      onRefreshUsers();
    } catch (err: any) {
      triggerNotification(`Failed: ${err.message}`, 'error');
    }
  };

  const handleResetPassword = (email: string, username: string) => {
    soundManager.play('click');
    saveAuditLog('Reset Password', username, `Triggered secure credentials authorization loop`);
    triggerNotification(`Password reset instructions sent securely to ${email}!`, 'info');
  };

  const handleSendEmail = (email: string, username: string) => {
    soundManager.play('click');
    saveAuditLog('Outbound Email', username, `Emailed educational progress reminder notification`);
    triggerNotification(`Progress reminder email dispatched to ${username} (${email})!`, 'success');
  };

  const handleResendVerification = (email: string, username: string) => {
    soundManager.play('click');
    saveAuditLog('Outbound OTP', username, `Re-dispatched signup verification credentials`);
    triggerNotification(`Auth verification OTP code re-sent to ${email}!`, 'success');
  };

  const handleResetOnboarding = (email: string, username: string) => {
    soundManager.play('click');
    localStorage.removeItem(`CHIKOO_ONBOARDING_COMPLETED_${email.toLowerCase()}`);
    saveExtendedProps(email, { onboarding_completed: false });
    saveAuditLog('Reset Onboarding', username, `Reset onboarding screen configuration guides to original state`);
    triggerNotification(`Onboarding steps successfully reset to pristine states for ${username}!`, 'success');
    if (selectedUserForView && selectedUserForView.email === email) {
      setSelectedUserForView(prev => prev ? { ...prev, onboarding_completed: false } : null);
    }
    onRefreshUsers();
  };

  const handleAssignSubscription = (email: string, username: string, tier: 'Free' | 'Premium') => {
    soundManager.play('click');
    saveExtendedProps(email, { subscription: tier });
    saveAuditLog('Assign Subscription', username, `Upgraded course tier package classification to: ${tier}`);
    triggerNotification(`Subscription updated to ${tier} for ${username}!`, 'success');
    if (selectedUserForView && selectedUserForView.email === email) {
      setSelectedUserForView(prev => prev ? { ...prev, subscription: tier } : null);
    }
    onRefreshUsers();
  };

  const handleChangeRole = (email: string, username: string, role: 'Student' | 'Teacher' | 'Admin' | 'Super Admin') => {
    soundManager.play('click');
    saveExtendedProps(email, { role, is_admin: role === 'Admin' || role === 'Super Admin' });
    updateProfile(email, { is_admin: role === 'Admin' || role === 'Super Admin' });
    saveAuditLog('Role Reclassification', username, `Assigned user security role level: ${role}`);
    triggerNotification(`Assigned role: ${role} successfully to ${username}!`, 'success');
    if (selectedUserForView && selectedUserForView.email === email) {
      setSelectedUserForView(prev => prev ? { ...prev, role, is_admin: role === 'Admin' || role === 'Super Admin' } : null);
    }
    onRefreshUsers();
  };

  // Bulk Actions
  const handleBulkDelete = () => {
    if (selectedUserEmails.length === 0) return;
    triggerConfirm(
      `Bulk Delete Selected (${selectedUserEmails.length} accounts)`,
      `This permanently deletes ${selectedUserEmails.length} user accounts. This is a severe, irreversible action. Are you sure?`,
      async () => {
        try {
          for (const email of selectedUserEmails) {
            const match = extendedUsers.find(u => u.email === email);
            await deleteUserProfile(email);
            if (match) saveAuditLog('Bulk Delete', match.username, 'Deleted in bulk action sequence');
          }
          triggerNotification(`Successfully deleted ${selectedUserEmails.length} users.`, 'success');
          setSelectedUserEmails([]);
          onRefreshUsers();
        } catch (err: any) {
          triggerNotification(`Bulk deletion encountered error: ${err.message}`, 'error');
        }
      }
    );
  };

  const handleBulkBlock = () => {
    if (selectedUserEmails.length === 0) return;
    triggerConfirm(
      `Bulk Block Selected (${selectedUserEmails.length} accounts)`,
      `This restricts and locks ${selectedUserEmails.length} student profiles. Proceed?`,
      async () => {
        try {
          for (const email of selectedUserEmails) {
            const match = extendedUsers.find(u => u.email === email);
            saveExtendedProps(email, { status: 'Blocked' });
            if (match) saveAuditLog('Bulk Block', match.username, 'Blocked in bulk action sequence');
          }
          triggerNotification(`Restricted ${selectedUserEmails.length} users.`, 'success');
          setSelectedUserEmails([]);
          onRefreshUsers();
        } catch (err: any) {
          triggerNotification(`Bulk block failed`, 'error');
        }
      }
    );
  };

  const handleBulkActivate = () => {
    if (selectedUserEmails.length === 0) return;
    try {
      for (const email of selectedUserEmails) {
        const match = extendedUsers.find(u => u.email === email);
        saveExtendedProps(email, { status: 'Active' });
        if (match) saveAuditLog('Bulk Activate', match.username, 'Activated in bulk action sequence');
      }
      triggerNotification(`Activated ${selectedUserEmails.length} users successfully.`, 'success');
      setSelectedUserEmails([]);
      onRefreshUsers();
    } catch (err: any) {
      triggerNotification(`Bulk activation failed`, 'error');
    }
  };

  const handleBulkAssignSubscription = (tier: 'Free' | 'Premium') => {
    if (selectedUserEmails.length === 0) return;
    try {
      for (const email of selectedUserEmails) {
        const match = extendedUsers.find(u => u.email === email);
        saveExtendedProps(email, { subscription: tier });
        if (match) saveAuditLog('Bulk Subscription Upgrade', match.username, `Assigned subscription level ${tier}`);
      }
      triggerNotification(`Updated ${selectedUserEmails.length} user subscriptions to ${tier}!`, 'success');
      setSelectedUserEmails([]);
      onRefreshUsers();
    } catch (err: any) {
      triggerNotification(`Failed to assign subscription bulk`, 'error');
    }
  };

  // Export Selected to CSV / Excel simulation
  const handleExportSelected = (format: 'CSV' | 'Excel') => {
    soundManager.play('click');
    const exportTargets = selectedUserEmails.length > 0 
      ? extendedUsers.filter(u => selectedUserEmails.includes(u.email))
      : extendedUsers;

    if (exportTargets.length === 0) {
      triggerNotification('No dataset available to export!', 'error');
      return;
    }

    // CSV representation
    const headers = ['Username', 'Email', 'Role', 'School', 'Class', 'LearningStyle', 'Subscription', 'Status', 'XP', 'Gems', 'Streak', 'JoinedDate'];
    const rows = exportTargets.map(u => [
      u.username, u.email, u.role, u.school, u.class_name, u.learning_style, u.subscription, u.status, u.xp, u.gems, u.streak, u.joined_date
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chikoo_users_export_${new Date().toISOString().split('T')[0]}.${format === 'CSV' ? 'csv' : 'xls'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    saveAuditLog('Export Users', `${exportTargets.length} Profiles`, `Dispatched dataset in ${format} format`);
    triggerNotification(`Successfully compiled and exported ${exportTargets.length} records!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Overlay Dialog */}
      <AnimatePresence>
        {confirmationDialog?.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle size={24} className="shrink-0" />
                <h4 className="font-display font-black text-lg">{confirmationDialog.title}</h4>
              </div>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                {confirmationDialog.message}
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => { soundManager.play('click'); setConfirmationDialog(null); }}
                  className="px-4 py-2 hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-black rounded-xl transition uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmationDialog.onConfirm();
                  }}
                  className="px-5 py-2 bg-rose-600 text-white hover:bg-rose-700 text-xs font-black rounded-xl transition uppercase tracking-wider cursor-pointer shadow-sm"
                >
                  Confirm Action
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN HERO CARD: STUDENT SPIN WHEEL CLAIMS MONITOR (TOTAL & LAST 24 HOURS) */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-500/30 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

        <div className="relative z-10 space-y-5">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 p-0.5 shadow-lg shadow-purple-900/30 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Sparkles size={20} className="text-amber-400 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black font-display tracking-tight text-white flex items-center gap-2">
                    <span>Student Spin Wheel Claims Monitor</span>
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block mr-0.5" />
                    LIVE 24H SYNC
                  </span>
                </div>
                <p className="text-xs text-indigo-200/70 font-medium mt-0.5">
                  Real-time telemetry of lucky cookie wheel rewards claimed across all enrolled student accounts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-900/40 border border-indigo-700/40 text-[11px] text-indigo-200">
                <Clock size={12} className="text-amber-400 shrink-0" />
                <span>Limit: <strong className="text-amber-300">3 spins/day</strong> (Asia/Kolkata)</span>
              </div>

              <button
                onClick={() => { soundManager.play('click'); fetchSpinStats(); }}
                disabled={isSpinStatsLoading}
                title="Refresh Spin Wheel Telemetry"
                className="p-2 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-indigo-200 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              >
                <RotateCw size={14} className={isSpinStatsLoading ? 'animate-spin text-amber-400' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => { soundManager.play('click'); setShowSpinClaimsModal(true); }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition shadow-md hover:shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Gift size={13} />
                <span>Audit Logs ({spinStats?.recentClaims?.length || 0})</span>
              </button>
            </div>
          </div>

          {/* Primary 4 Metric Highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Metric 1: Claimed in Last 24 Hours (Primary Focus) */}
            <div className="bg-gradient-to-br from-indigo-900/70 to-purple-900/60 p-4 rounded-2xl border-2 border-amber-400/40 shadow-lg relative overflow-hidden group hover:border-amber-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider flex items-center gap-1">
                  <Clock size={12} /> Claimed in Last 24h
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[9px] font-black">
                  HOT
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">
                  {spinStats ? spinStats.claimsLast24h : (
                    <span className="text-slate-400 text-2xl animate-pulse">...</span>
                  )}
                </span>
                <span className="text-xs font-bold text-amber-300/90 uppercase tracking-wide">
                  spins
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-200/90 font-medium">
                <span className="text-emerald-400 font-bold">⚡ Active activity</span>
                <span>• Last 24 hours</span>
              </div>
            </div>

            {/* Metric 2: Total Spins Claimed (All-Time) */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-indigo-800/60 shadow-md relative overflow-hidden group hover:border-indigo-500 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider flex items-center gap-1">
                  <Trophy size={12} /> Total Spins Claimed
                </span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold">
                  All-Time
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">
                  {spinStats ? spinStats.totalClaims : (
                    <span className="text-slate-400 text-2xl animate-pulse">...</span>
                  )}
                </span>
                <span className="text-xs font-bold text-indigo-300/90 uppercase tracking-wide">
                  claims
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-200/80 font-medium">
                <span>Across all student profiles</span>
              </div>
            </div>

            {/* Metric 3: Cookies Awarded (24h & Total) */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-indigo-800/60 shadow-md relative overflow-hidden group hover:border-indigo-500 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-300/90 tracking-wider flex items-center gap-1">
                  🍪 Cookies Awarded
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                  24h vs Total
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-display font-black text-amber-300 tracking-tight">
                  {spinStats ? spinStats.cookiesAwardedLast24h.toLocaleString() : '...'}
                </span>
                <span className="text-xs font-bold text-amber-200/80">🍪 (24h)</span>
              </div>
              <div className="mt-1 text-[10px] text-indigo-200/80 font-medium">
                <span>Total: <strong className="text-white">{spinStats ? spinStats.totalCookiesAwarded.toLocaleString() : '...'}</strong> 🍪 rewarded</span>
              </div>
            </div>

            {/* Metric 4: Active Student Spinners (Last 24h) */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-indigo-800/60 shadow-md relative overflow-hidden group hover:border-indigo-500 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-purple-300 tracking-wider flex items-center gap-1">
                  <Users size={12} /> Active Spinners (24h)
                </span>
                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold">
                  Students
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">
                  {spinStats ? spinStats.uniqueSpinners24h : '...'}
                </span>
                <span className="text-xs font-bold text-purple-300/90 uppercase tracking-wide">
                  students
                </span>
              </div>
              <div className="mt-1 text-[10px] text-indigo-200/80 font-medium">
                <span>Avg: <strong className="text-amber-300">{spinStats ? spinStats.avgCookiesPerSpin : 0}</strong> cookies / spin</span>
              </div>
            </div>
          </div>

          {/* Mini 24-Hour Hourly Activity Sparkline Trend */}
          {spinStats && spinStats.claimsByHour && spinStats.claimsByHour.length > 0 && (
            <div className="pt-2 border-t border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] text-indigo-200 font-bold shrink-0">
                <Activity size={13} className="text-amber-400" />
                <span>24-Hour Spin Distribution Timeline:</span>
              </div>
              <div className="h-10 w-full sm:max-w-md flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spinStats.claimsByHour} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-indigo-700 text-white p-2 rounded-lg text-[10px] shadow-xl">
                              <p className="font-bold text-amber-300">{data.hour} ({data.label})</p>
                              <p>{data.count} spin claims</p>
                              <p className="text-slate-300">{data.cookies} cookies awarded</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-indigo-300/70 text-right shrink-0">
                <span>Hourly volume (past 24h)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RECENT SPIN CLAIMS AUDIT MODAL */}
      <AnimatePresence>
        {showSpinClaimsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <Gift size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-white font-display">
                      Spin Wheel Claim Audit Logs
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Cryptographically verified spin wheel reward disbursements
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSpinClaimsModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Claims Table / List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                {spinStats?.recentClaims && spinStats.recentClaims.length > 0 ? (
                  spinStats.recentClaims.map((claim, cIdx) => (
                    <div key={`claim-${claim.id || claim.spinRef || cIdx}`} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{claim.email}</span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {claim.spinRef}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {new Date(claim.timestamp).toLocaleString()} ({claim.relativeTime})
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-xs border border-amber-500/20">
                          +{claim.amount} 🍪
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                          Claimed
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    No recent spin wheel claims found in the current audit window.
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Total records verified: <strong className="text-slate-800 dark:text-white">{spinStats?.totalClaims || 0}</strong></span>
                <button
                  onClick={() => setShowSpinClaimsModal(false)}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overview Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-2xs space-y-1 relative overflow-hidden group hover:border-teal-300 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Total Accounts</span>
            <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg group-hover:scale-105 transition-transform">
              <Users size={14} />
            </div>
          </div>
          <p className="text-xl font-display font-black text-slate-800">{metrics.total}</p>
          <span className="text-[9px] text-teal-600 font-bold flex items-center gap-0.5">
            <TrendingUp size={10} /> +12% this month
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-2xs space-y-1 relative overflow-hidden group hover:border-emerald-300 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Active Users</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-105 transition-transform">
              <UserCheck size={14} />
            </div>
          </div>
          <p className="text-xl font-display font-black text-slate-800">{metrics.active}</p>
          <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
            ● 100% compliant
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-2xs space-y-1 relative overflow-hidden group hover:border-blue-300 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Online Now</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-105 transition-transform">
              <Activity size={14} className="animate-pulse" />
            </div>
          </div>
          <p className="text-xl font-display font-black text-slate-800">{metrics.online}</p>
          <span className="text-[9px] text-blue-500 font-bold flex items-center gap-0.5 animate-pulse">
            ⚡ Real-time pulse live
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-2xs space-y-1 relative overflow-hidden group hover:border-amber-300 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Grown Today</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-105 transition-transform">
              <UserPlus size={14} />
            </div>
          </div>
          <p className="text-xl font-display font-black text-slate-800">+{metrics.newToday}</p>
          <span className="text-[9px] text-slate-400 font-bold">
            Since midnight UTC
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-2xs space-y-1 relative overflow-hidden group hover:border-pink-300 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Premium Plan</span>
            <div className="p-1.5 bg-pink-50 text-pink-600 rounded-lg group-hover:scale-105 transition-transform">
              <CreditCard size={14} />
            </div>
          </div>
          <p className="text-xl font-display font-black text-slate-800">{metrics.premium}</p>
          <span className="text-[9px] text-pink-500 font-extrabold uppercase">
            {metrics.total > 0 ? Math.round((metrics.premium / metrics.total) * 100) : 0}% ratio
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-2xs space-y-1 relative overflow-hidden group hover:border-rose-300 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Blocked Log</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg group-hover:scale-105 transition-transform">
              <UserX size={14} />
            </div>
          </div>
          <p className="text-xl font-display font-black text-slate-800">{metrics.blocked}</p>
          <span className="text-[9px] text-slate-400 font-bold">
            Access restricted
          </span>
        </div>
      </div>

      {/* Analytics Panel Expansion */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-2xs overflow-hidden">
        <button
          onClick={() => { soundManager.play('click'); setShowCharts(!showCharts); }}
          className="w-full px-5 py-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <TrendingUp size={16} className="text-teal-600" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 font-mono">
              Enterprise Users & Subscriptions Analytics
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full">REALTIME DATABASE STATE</span>
            {showCharts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {showCharts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Chart 1: Growth & Active Trend */}
                <div className="lg:col-span-7 space-y-1">
                  <h5 className="text-[10px] uppercase font-black tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
                    <span>User Acquisition Trend (Last 7 Days)</span>
                  </h5>
                  <div className="h-60 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="growthColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2.5} fillOpacity={1} fill="url(#growthColor)" name="Total Accounts" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Daily Activity Ratio */}
                <div className="lg:col-span-5 space-y-1">
                  <h5 className="text-[10px] uppercase font-black tracking-widest text-slate-400 font-mono">
                    Daily Active Users vs Online
                  </h5>
                  <div className="h-60 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activeUsersTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="active" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Active Students" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Distributions: 3 Small Columns */}
                <div className="lg:col-span-4 border-t border-slate-100 pt-5 space-y-2">
                  <h6 className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Class Cohorts</h6>
                  <div className="h-32 flex items-center justify-center">
                    {classDist.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={classDist} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={2} dataKey="value">
                            {classDist.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={20} iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-[10px] text-slate-400">Empty cohort distribution</span>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-4 border-t border-slate-100 pt-5 space-y-2">
                  <h6 className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Learning Style Profiles</h6>
                  <div className="h-32 flex items-center justify-center">
                    {styleDist.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={styleDist} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={2} dataKey="value">
                            {styleDist.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={COLORS[(idx + 2) % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={20} iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-[10px] text-slate-400">Empty style distribution</span>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-4 border-t border-slate-100 pt-5 space-y-2">
                  <h6 className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Subscription Split</h6>
                  <div className="h-32 flex items-center justify-center">
                    {subDist.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={subDist} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={2} dataKey="value">
                            {subDist.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={idx === 0 ? '#10b981' : '#ec4899'} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={20} iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-[10px] text-slate-400">Empty split</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Table and Filters Area */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-2xs overflow-hidden space-y-4 p-5">
        {/* Header Control Panel */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Users size={18} className="text-teal-600" />
              Administrative User Control Console
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              ROLE-BASED PERMISSIONS FOR ENTIRE COHORT
            </p>
          </div>
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              onClick={() => { soundManager.play('click'); onRefreshUsers(); }}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={12} />
              Refresh
            </button>
            <button
              onClick={() => { soundManager.play('click'); handleExportSelected('CSV'); }}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={12} />
              Export Dataset
            </button>
            <button
              onClick={() => { soundManager.play('click'); setShowAddUserModal(true); }}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <UserPlus size={13} />
              Add User Account
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-600 font-mono">
            <SlidersHorizontal size={13} className="text-slate-400" />
            <span>ADVANCED QUERY FILTERS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Direct Multi-inputs */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search by Name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-teal-500 placeholder-slate-400 text-slate-900 transition-colors"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search by Email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-teal-500 placeholder-slate-400 text-slate-900 transition-colors"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search School..."
                value={searchSchool}
                onChange={(e) => setSearchSchool(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-teal-500 placeholder-slate-400 text-slate-900 transition-colors"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search Class..."
                value={searchClass}
                onChange={(e) => setSearchClass(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-teal-500 placeholder-slate-400 text-slate-900 transition-colors"
              />
            </div>

            {/* Quick reset filters */}
            <button
              onClick={() => {
                soundManager.play('click');
                setSearchName('');
                setSearchEmail('');
                setSearchSchool('');
                setSearchClass('');
                setFilterStatus('All');
                setFilterSub('All');
                setFilterClass('All');
                setFilterStyle('All');
                setFilterOnboarding('All');
                setFilterDateRange('All');
              }}
              className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-center cursor-pointer md:col-span-2 lg:col-span-2"
            >
              Reset All Filters
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Status */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Account Status</span>
              <select
                value={filterStatus}
                onChange={(e) => { soundManager.play('click'); setFilterStatus(e.target.value); }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-700 focus:border-teal-500"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Blocked">Blocked</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Plan */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Subscription</span>
              <select
                value={filterSub}
                onChange={(e) => { soundManager.play('click'); setFilterSub(e.target.value); }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-700 focus:border-teal-500"
              >
                <option value="All">All Plans</option>
                <option value="Free">Free</option>
                <option value="Premium">Premium</option>
              </select>
            </div>

            {/* Class Grade */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Cohort Class</span>
              <select
                value={filterClass}
                onChange={(e) => { soundManager.play('click'); setFilterClass(e.target.value); }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-700 focus:border-teal-500"
              >
                <option value="All">All Grades</option>
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Learning Style */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Learning Style</span>
              <select
                value={filterStyle}
                onChange={(e) => { soundManager.play('click'); setFilterStyle(e.target.value); }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-700 focus:border-teal-500"
              >
                <option value="All">All Styles</option>
                {LEARNING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Onboarding */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Onboarding</span>
              <select
                value={filterOnboarding}
                onChange={(e) => { soundManager.play('click'); setFilterOnboarding(e.target.value); }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-700 focus:border-teal-500"
              >
                <option value="All">All Steps</option>
                <option value="Completed">Completed</option>
                <option value="Incomplete">Incomplete</option>
              </select>
            </div>

            {/* Registration date range */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Registration Date</span>
              <select
                value={filterDateRange}
                onChange={(e) => { soundManager.play('click'); setFilterDateRange(e.target.value); }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-700 focus:border-teal-500"
              >
                <option value="All">All Registration Dates</option>
                <option value="Today">Registered Today</option>
                <option value="7Days">Last 7 Days</option>
                <option value="30Days">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Selected Rows Bulk Actions Notification Banner */}
        <AnimatePresence>
          {selectedUserEmails.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md border border-slate-800"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-xs font-black">
                  Selected {selectedUserEmails.length} user account{selectedUserEmails.length > 1 ? 's' : ''} to bulk control:
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={handleBulkActivate}
                  className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-[10px] font-black uppercase rounded-lg transition cursor-pointer"
                >
                  Activate Selected
                </button>
                <button
                  onClick={handleBulkBlock}
                  className="px-2.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-[10px] font-black uppercase rounded-lg transition cursor-pointer"
                >
                  Block Selected
                </button>
                <button
                  onClick={() => handleBulkAssignSubscription('Premium')}
                  className="px-2.5 py-1.5 bg-pink-600 hover:bg-pink-700 text-[10px] font-black uppercase rounded-lg transition cursor-pointer"
                >
                  Bulk Premium
                </button>
                <button
                  onClick={() => handleBulkAssignSubscription('Free')}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-[10px] font-black uppercase rounded-lg transition border border-slate-700 cursor-pointer"
                >
                  Bulk Free
                </button>
                <button
                  onClick={() => handleExportSelected('CSV')}
                  className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-[10px] font-black uppercase rounded-lg transition cursor-pointer"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-2.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-[10px] font-black uppercase rounded-lg transition cursor-pointer"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => { soundManager.play('click'); setSelectedUserEmails([]); }}
                  className="p-1 text-slate-400 hover:text-white transition ml-1"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Responsive Table Grid (Desktop) & Card List (Mobile) */}
        <div>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-150">
            <table className="w-full border-collapse text-left text-xs text-slate-600">
              <thead className="bg-slate-50/75 border-b border-slate-150 text-[10px] font-black uppercase tracking-wider text-slate-500 select-none">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelectedOnPage}
                      onChange={handleSelectAllOnPage}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort('username')}>
                    <div className="flex items-center gap-1">
                      <span>Full Name / Avatar</span>
                      {sortColumn === 'username' && (sortDirection === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort('email')}>
                    <div className="flex items-center gap-1">
                      <span>Email Address</span>
                      {sortColumn === 'email' && (sortDirection === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort('class_name')}>
                    <div className="flex items-center gap-1">
                      <span>Class / School</span>
                      {sortColumn === 'class_name' && (sortDirection === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition animate-fade-in" onClick={() => handleSort('learning_style')}>
                    <div className="flex items-center gap-1">
                      <span>Learning Style</span>
                      {sortColumn === 'learning_style' && (sortDirection === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                    </div>
                  </th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Onboarding</th>
                  <th className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort('gems')}>
                    <div className="flex items-center justify-center gap-1">
                      <img src="/cookies.webp" alt="Cookies" className="w-3.5 h-3.5 object-contain shrink-0" />
                      <span>Cookies</span>
                      {sortColumn === 'gems' && (sortDirection === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center bg-slate-50">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <AlertTriangle size={24} />
                        <span className="text-xs font-semibold">No registered students found matching the selected parameters.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user, idx) => {
                    const isChecked = selectedUserEmails.includes(user.email);
                    const statusColors = {
                      Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      Blocked: 'bg-rose-50 text-rose-700 border-rose-200',
                      Inactive: 'bg-slate-100 text-slate-500 border-slate-200'
                    };

                    return (
                      <tr
                        key={`user-row-${user.id || user.email || idx}`}
                        className={`hover:bg-slate-50/50 transition-colors ${isChecked ? 'bg-teal-50/10' : ''}`}
                      >
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleSelectRow(user.email)}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-150 flex items-center justify-center uppercase text-teal-700 font-mono font-black shrink-0">
                              {user.username.slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <span className="truncate block font-black text-slate-800">{user.username}</span>
                              <span className="text-[9px] text-slate-400 block font-mono">Last active: {user.last_active_time}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{user.email}</td>
                        <td className="py-3.5 px-4">
                          <span className="block font-black text-slate-800">{user.class_name}</span>
                          <span className="text-[10px] text-slate-400 block">{user.school}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-purple-50 border border-purple-100 text-purple-700 text-[10px] rounded-md font-bold block w-max">
                            {user.learning_style}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            user.role === 'Super Admin' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                            user.role === 'Admin' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                            user.role === 'Teacher' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            user.subscription === 'Premium' ? 'bg-pink-100 text-pink-700 border border-pink-200' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {user.subscription}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${user.onboarding_completed ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                            <span className="text-[10px]">{user.onboarding_completed ? 'Complete' : 'Incomplete'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-amber-50/70 border border-amber-200/60 rounded-lg">
                            <img src="/cookies.webp" alt="Cookies" className="w-3.5 h-3.5 object-contain shrink-0" />
                            <span className="font-extrabold text-amber-950 font-mono text-xs">{user.gems ?? 0}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold ${statusColors[user.status]}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { soundManager.play('click'); setSelectedUserForView(user); }}
                              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
                              title="View Profile Details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => { soundManager.play('click'); setUserToEdit(user); }}
                              className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition"
                              title="Quick Edit Stats"
                            >
                              <Settings size={14} />
                            </button>
                            {user.status === 'Blocked' ? (
                              <button
                                onClick={() => handleUnblockUser(user.email, user.username)}
                                className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-md transition"
                                title="Unblock User"
                              >
                                <UserCheck size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlockUser(user.email, user.username)}
                                className="p-1 text-amber-500 hover:bg-amber-50 rounded-md transition"
                                title="Block User"
                              >
                                <UserMinus size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.email, user.username)}
                              className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                              title="Delete User"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden space-y-3">
            {paginatedUsers.length === 0 ? (
              <div className="py-10 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                  <AlertTriangle size={24} />
                  <span className="text-xs font-semibold">No students match your filter criteria.</span>
                </div>
              </div>
            ) : (
              paginatedUsers.map((user, idx) => {
                const isChecked = selectedUserEmails.includes(user.email);
                const statusColors = {
                  Active: 'bg-emerald-50 text-emerald-700 border-emerald-300',
                  Blocked: 'bg-rose-50 text-rose-700 border-rose-300',
                  Inactive: 'bg-slate-100 text-slate-600 border-slate-300'
                };

                return (
                  <div
                    key={`user-card-${user.id || user.email || idx}`}
                    className={`bg-white rounded-2xl p-4 border transition-all ${
                      isChecked ? 'border-teal-400 ring-2 ring-teal-100 bg-teal-50/20' : 'border-slate-200 shadow-2xs'
                    }`}
                  >
                    {/* Header: Select + Avatar + Username + Status */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectRow(user.email)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4.5 h-4.5 cursor-pointer"
                        />
                        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center uppercase text-teal-700 font-mono font-black text-sm shrink-0">
                          {user.username.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-sm truncate">{user.username}</h4>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">{user.email}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-black shrink-0 ${statusColors[user.status]}`}>
                        {user.status}
                      </span>
                    </div>

                    {/* Student Badges & Meta */}
                    <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] font-bold">Cookies:</span>
                        <div className="flex items-center gap-1 font-mono font-extrabold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-lg border border-amber-200/80">
                          <img src="/cookies.webp" alt="Cookies" className="w-3.5 h-3.5 object-contain" />
                          <span>{user.gems ?? 0}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] font-bold">Plan:</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          user.subscription === 'Premium' ? 'bg-pink-100 text-pink-700 border border-pink-200' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {user.subscription}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] font-bold">Class:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[100px] text-[11px]">{user.class_name || 'Standard'}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] font-bold">Learning:</span>
                        <span className="px-1.5 py-0.5 bg-purple-50 border border-purple-100 text-purple-700 text-[10px] rounded font-bold truncate max-w-[90px]">
                          {user.learning_style}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons with >= 40px Touch Targets */}
                    <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { soundManager.play('click'); setSelectedUserForView(user); }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 min-h-[36px]"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => { soundManager.play('click'); setUserToEdit(user); }}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-bold flex items-center gap-1 min-h-[36px]"
                        >
                          <Settings size={13} />
                          <span>Edit</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {user.status === 'Blocked' ? (
                          <button
                            onClick={() => handleUnblockUser(user.email, user.username)}
                            className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title="Unblock User"
                          >
                            <UserCheck size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBlockUser(user.email, user.username)}
                            className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title="Block User"
                          >
                            <UserMinus size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.email, user.username)}
                          className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                          title="Delete User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Pagination control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-bold">
              Showing {sortedUsers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, sortedUsers.length)} of {sortedUsers.length} records
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-semibold">Page Size:</span>
              <select
                value={pageSize}
                onChange={(e) => { soundManager.play('click'); setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none text-slate-600"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              onClick={() => { if (currentPage > 1) { soundManager.play('click'); setCurrentPage(prev => prev - 1); } }}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pIdx = idx + 1;
              return (
                <button
                  key={pIdx}
                  onClick={() => { soundManager.play('click'); setCurrentPage(pIdx); }}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition ${
                    currentPage === pIdx 
                      ? 'bg-teal-600 text-white' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pIdx}
                </button>
              );
            })}
            <button
              onClick={() => { if (currentPage < totalPages) { soundManager.play('click'); setCurrentPage(prev => prev + 1); } }}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Tracker Footer */}
      <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/60 shadow-3xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-150 pb-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-slate-600 animate-spin-slow" />
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest font-mono">
              Administrative Compliance Security Logs (Audit Trail)
            </h4>
          </div>
          <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
            SECURE AUDIT ACTIVE
          </span>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
          {auditLogs.map((log) => (
            <div key={log.id} className="text-[11px] font-bold text-slate-500 flex flex-col md:flex-row md:items-center justify-between gap-1.5 p-2 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition">
              <div className="flex items-start md:items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded font-black">{log.timestamp}</span>
                <span className="text-teal-700 font-extrabold font-mono text-[10px] bg-teal-50 px-1.5 py-0.5 rounded">{log.adminEmail}</span>
                <span className="text-slate-700 text-xs font-black shrink-0">{log.action}:</span>
                <span className="text-slate-600 font-medium truncate max-w-[150px] md:max-w-[280px]">{log.details}</span>
              </div>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono shrink-0 font-extrabold uppercase">
                Target: {log.targetUser}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* User Profile Details Drawer/Modal */}
      <AnimatePresence>
        {selectedUserForView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[999] flex justify-end"
            onClick={() => setSelectedUserForView(null)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-6">
                {/* Header Profile Info Banner */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-150 flex items-center justify-center uppercase font-mono text-xl font-black text-teal-700">
                      {selectedUserForView.username.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-800 leading-tight">{selectedUserForView.username}</h4>
                      <p className="text-xs text-slate-400 font-mono">{selectedUserForView.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { soundManager.play('click'); setSelectedUserForView(null); }}
                    className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Main scrollable body */}
                <div className="space-y-6 text-xs text-slate-600">
                  {/* Personal Information section */}
                  <div className="space-y-3.5">
                    <h5 className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-1 flex items-center gap-1.5">
                      <Users size={12} className="text-teal-600" />
                      Personal Information
                    </h5>
                    <div className="grid grid-cols-2 gap-4 font-medium">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-black uppercase">Full Username</span>
                        <span className="text-slate-800 font-extrabold">{selectedUserForView.username}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-black uppercase">Contact Phone</span>
                        <span className="text-slate-800 font-extrabold">{selectedUserForView.phone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-black uppercase">Registration Date</span>
                        <span className="text-slate-800 font-mono">{selectedUserForView.joined_date}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-black uppercase">Account Status</span>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold w-max block mt-0.5 ${
                          selectedUserForView.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>{selectedUserForView.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Academic Information section */}
                  <div className="space-y-3.5">
                    <h5 className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-1 flex items-center gap-1.5">
                      <School size={12} className="text-teal-600" />
                      Academic Information
                    </h5>
                    <div className="grid grid-cols-2 gap-4 font-medium">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-black uppercase">Assigned Cohort Class</span>
                        <span className="text-slate-800 font-extrabold">{selectedUserForView.class_name}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-black uppercase">Registered Campus School</span>
                        <span className="text-slate-800 font-extrabold">{selectedUserForView.school}</span>
                      </div>
                    </div>
                  </div>

                  {/* Learning Preferences */}
                  <div className="space-y-3.5">
                    <h5 className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-1 flex items-center gap-1.5">
                      <SlidersHorizontal size={12} className="text-teal-600" />
                      Learning Preferences
                    </h5>
                    <div className="grid grid-cols-2 gap-4 font-medium">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-black uppercase">Personalized Learning Style</span>
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded-lg mt-0.5 inline-block">{selectedUserForView.learning_style}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-black uppercase">UI Theme Identifier</span>
                        <span className="text-slate-800 font-mono">{selectedUserForView.theme_id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Learning Progress statistics */}
                  <div className="space-y-3.5">
                    <h5 className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-1 flex items-center gap-1.5">
                      <Award size={12} className="text-teal-600" />
                      Learning Progress Dashboard
                    </h5>
                    <div className="grid grid-cols-3 gap-3 font-medium">
                      <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col items-center">
                        <Award className="text-yellow-500 fill-yellow-500/20 w-4 h-4 mb-0.5" />
                        <span className="text-[8px] text-slate-400 font-black uppercase">Total XP</span>
                        <span className="text-xs font-black text-slate-800">{selectedUserForView.xp} XP</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col items-center">
                        <Coins className="text-teal-500 fill-teal-500/20 w-4 h-4 mb-0.5" />
                        <span className="text-[8px] text-slate-400 font-black uppercase">Cookies Wallet</span>
                        <span className="text-xs font-black text-slate-800 flex items-center gap-0.5">{selectedUserForView.gems}<img src="/cookies.webp" alt="Cookies" className="w-3.5 h-3.5 object-contain shrink-0" /></span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col items-center">
                        <Flame className="text-orange-500 fill-orange-500/20 w-4 h-4 mb-0.5" />
                        <span className="text-[8px] text-slate-400 font-black uppercase">Daily Streak</span>
                        <span className="text-xs font-black text-slate-800">{selectedUserForView.streak} Days</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col items-center col-span-3">
                        <BookOpen className="text-blue-500 w-4 h-4 mb-0.5" />
                        <span className="text-[8px] text-slate-400 font-black uppercase">Current Ongoing Lesson Screen</span>
                        <span className="text-xs font-black text-slate-800 text-center">{selectedUserForView.current_lesson}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subscription details */}
                  <div className="space-y-3.5">
                    <h5 className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-1 flex items-center gap-1.5">
                      <CreditCard size={12} className="text-teal-600" />
                      Subscription Package details
                    </h5>
                    <div className="flex items-center justify-between font-medium">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-black uppercase">Current Active Tier</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black block mt-0.5 ${
                          selectedUserForView.subscription === 'Premium' ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-500'
                        }`}>{selectedUserForView.subscription}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleAssignSubscription(selectedUserForView.email, selectedUserForView.username, 'Premium')}
                          disabled={selectedUserForView.subscription === 'Premium'}
                          className="px-2.5 py-1.5 bg-pink-600 hover:bg-pink-700 text-white disabled:opacity-50 text-[10px] font-black uppercase rounded-lg transition cursor-pointer"
                        >
                          Upgrade to Premium
                        </button>
                        <button
                          onClick={() => handleAssignSubscription(selectedUserForView.email, selectedUserForView.username, 'Free')}
                          disabled={selectedUserForView.subscription === 'Free'}
                          className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 disabled:opacity-50 text-[10px] font-black uppercase rounded-lg transition cursor-pointer"
                        >
                          Downgrade
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Device and Session logs */}
                  <div className="space-y-3.5">
                    <h5 className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-1 flex items-center gap-1.5">
                      <Cpu size={12} className="text-teal-600" />
                      Registered Session Devices
                    </h5>
                    <div className="space-y-1.5 font-semibold">
                      {selectedUserForView.devices.map((d, index) => (
                        <div key={`user-dev-${d}-${index}`} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2">
                            {d.toLowerCase().includes('phone') ? <Smartphone size={14} className="text-slate-400" /> : <Laptop size={14} className="text-slate-400" />}
                            <span>{d}</span>
                          </div>
                          <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-150 px-1.5 rounded-full uppercase font-bold">Authorized</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Authentication Operations */}
                  <div className="space-y-3.5">
                    <h5 className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-1 flex items-center gap-1.5">
                      <Key size={12} className="text-teal-600" />
                      Security Authorization Actions
                    </h5>
                    <div className="grid grid-cols-2 gap-2 font-black uppercase tracking-wider text-[9px]">
                      <button
                        onClick={() => handleResetPassword(selectedUserForView.email, selectedUserForView.username)}
                        className="p-2.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Key size={12} />
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleSendEmail(selectedUserForView.email, selectedUserForView.username)}
                        className="p-2.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Mail size={12} />
                        Email Reminder
                      </button>
                      <button
                        onClick={() => handleResendVerification(selectedUserForView.email, selectedUserForView.username)}
                        className="p-2.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Key size={12} />
                        Verify Email OTP
                      </button>
                      <button
                        onClick={() => handleResetOnboarding(selectedUserForView.email, selectedUserForView.username)}
                        className="p-2.5 border border-slate-200 text-amber-600 hover:bg-amber-50 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw size={12} />
                        Reset Onboarding
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* View modal footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                <button
                  onClick={() => {
                    soundManager.play('click');
                    setUserToEdit(selectedUserForView);
                    setSelectedUserForView(null);
                  }}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase rounded-xl transition cursor-pointer text-center"
                >
                  Edit Stats & Properties
                </button>
                <button
                  onClick={() => { soundManager.play('click'); setSelectedUserForView(null); }}
                  className="w-full py-3 bg-slate-200 hover:bg-slate-250 text-slate-600 text-xs font-black uppercase rounded-xl transition cursor-pointer text-center"
                >
                  Close Profile View
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit User Stats Modal */}
      <AnimatePresence>
        {userToEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-100 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-display font-black text-base text-slate-800">
                  Update Stats for {userToEdit.username}
                </h4>
                <button onClick={() => { soundManager.play('click'); setUserToEdit(null); }} className="text-slate-400 hover:text-slate-600 transition">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400">Username</label>
                    <input
                      type="text"
                      value={userToEdit.username}
                      onChange={(e) => setUserToEdit({ ...userToEdit, username: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400">Total XP</label>
                    <input
                      type="number"
                      value={userToEdit.xp}
                      onChange={(e) => setUserToEdit({ ...userToEdit, xp: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400">Cookies</label>
                    <input
                      type="number"
                      value={userToEdit.gems}
                      onChange={(e) => setUserToEdit({ ...userToEdit, gems: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400">Streak</label>
                    <input
                      type="number"
                      value={userToEdit.streak}
                      onChange={(e) => setUserToEdit({ ...userToEdit, streak: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400">Energy (1-5)</label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={userToEdit.energy}
                      onChange={(e) => setUserToEdit({ ...userToEdit, energy: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400">Accuracy (0-1)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={userToEdit.accuracy}
                      onChange={(e) => setUserToEdit({ ...userToEdit, accuracy: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500"
                      required
                    />
                  </div>

                  {/* Academic info select updates */}
                  <div className="space-y-1 col-span-2 border-t border-slate-100 pt-3">
                    <span className="block text-[9px] font-black uppercase text-slate-400 mb-1">Academic & Custom Fields</span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400">Class Cohort</label>
                    <select
                      value={userToEdit.class_name}
                      onChange={(e) => setUserToEdit({ ...userToEdit, class_name: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 text-slate-700"
                    >
                      {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400">School Campus</label>
                    <select
                      value={userToEdit.school}
                      onChange={(e) => setUserToEdit({ ...userToEdit, school: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 text-slate-700"
                    >
                      {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400">Learning Style</label>
                    <select
                      value={userToEdit.learning_style}
                      onChange={(e) => setUserToEdit({ ...userToEdit, learning_style: e.target.value as any })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 text-slate-700"
                    >
                      {LEARNING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400">User Role Role</label>
                    <select
                      value={userToEdit.role}
                      onChange={(e) => setUserToEdit({ ...userToEdit, role: e.target.value as any })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 text-slate-700"
                    >
                      <option value="Student">Student</option>
                      <option value="Teacher">Teacher</option>
                      <option value="Admin">Admin</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { soundManager.play('click'); setUserToEdit(null); }}
                    className="px-4 py-2 hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-black rounded-xl uppercase tracking-wider transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 text-white hover:bg-teal-700 text-xs font-black rounded-xl uppercase tracking-wider transition shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-100 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-display font-black text-base text-slate-800 flex items-center gap-2">
                  <UserPlus size={18} className="text-teal-600" />
                  Provision Student User Account
                </h4>
                <button onClick={() => { soundManager.play('click'); setShowAddUserModal(false); }} className="text-slate-400 hover:text-slate-600 transition">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400">Email Address</label>
                    <input
                      type="email"
                      placeholder="student@school.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 placeholder-slate-400"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400">Full Username</label>
                    <input
                      type="text"
                      placeholder="john_explorer"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 placeholder-slate-400"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400">Contact Phone</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 placeholder-slate-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400">Assign Security Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 text-slate-700"
                    >
                      <option value="Student">Student (Default)</option>
                      <option value="Teacher">Teacher</option>
                      <option value="Admin">Admin</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400">Course Subscription Package</label>
                    <select
                      value={newSub}
                      onChange={(e) => setNewSub(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 text-slate-700"
                    >
                      <option value="Free">Free Basic Package</option>
                      <option value="Premium">Premium Active Bundle</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400">Cohort Class</label>
                    <select
                      value={newClass}
                      onChange={(e) => setNewClass(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 text-slate-700"
                    >
                      {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400">Campus School</label>
                    <select
                      value={newSchool}
                      onChange={(e) => setNewSchool(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 text-slate-700"
                    >
                      {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400">Assigned Learning Style</label>
                    <select
                      value={newStyle}
                      onChange={(e) => setNewStyle(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 text-slate-700"
                    >
                      {LEARNING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { soundManager.play('click'); setShowAddUserModal(false); }}
                    className="px-4 py-2 hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-black rounded-xl uppercase tracking-wider transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 text-white hover:bg-teal-700 text-xs font-black rounded-xl uppercase tracking-wider transition shadow-sm cursor-pointer"
                  >
                    Provision Account
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
