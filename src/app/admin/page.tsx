'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileCheck,
  Users,
  Award,
  BarChart3,
  Mail,
  Plus,
  Trash2,
  Edit,
  Download,
  Search,
  ExternalLink,
  RotateCw,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  KeyRound,
  FileSpreadsheet,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tests' | 'questions' | 'participants' | 'certificates' | 'emailLogs'>('overview');

  // Login form state
  const [adminEmail, setAdminEmail] = useState('admin@skillcert.org');
  const [adminPassword, setAdminPassword] = useState('admin123456');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);

  // Search & Filter
  const [participantSearch, setParticipantSearch] = useState('');
  const [certSearch, setCertSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create Test Modal
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestDesc, setNewTestDesc] = useState('');
  const [newTestDuration, setNewTestDuration] = useState(20);
  const [newTestPassRate, setNewTestPassRate] = useState(60);

  // Add Question Modal
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQText, setNewQText] = useState('');
  const [newQType, setNewQType] = useState<'MULTIPLE_CHOICE' | 'TRUE_FALSE'>('MULTIPLE_CHOICE');
  const [newQMarks, setNewQMarks] = useState(1);
  const [newQCategory, setNewQCategory] = useState('General');
  const [newQExplanation, setNewQExplanation] = useState('');
  const [newQOptions, setNewQOptions] = useState([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);

  // Check auth on load
  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          loadAllData();
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  const loadAllData = async () => {
    try {
      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
        setTests(statsData.tests);
        if (statsData.tests.length > 0 && !selectedTestId) {
          setSelectedTestId(statsData.tests[0].id);
        }
      }

      loadParticipants();
      loadCertificates();
      loadEmailLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const loadParticipants = async (search = '') => {
    try {
      const res = await fetch(`/api/admin/participants?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) setParticipants(data.attempts);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCertificates = async (search = '') => {
    try {
      const res = await fetch(`/api/admin/certificates?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) setCertificates(data.certificates);
    } catch (err) {
      console.error(err);
    }
  };

  const loadEmailLogs = async () => {
    try {
      const res = await fetch('/api/admin/email-logs');
      const data = await res.json();
      if (data.success) setEmailLogs(data.logs);
    } catch (err) {
      console.error(err);
    }
  };

  // Load questions for selected test
  useEffect(() => {
    if (selectedTestId) {
      fetch(`/api/admin/questions?testId=${selectedTestId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setQuestions(data.questions);
        });
    }
  }, [selectedTestId]);

  const handleLogin = async (isDemo = false) => {
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          isDemo,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      setIsAuthenticated(true);
      loadAllData();
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAuthenticated(false);
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading('createTest');
      const res = await fetch('/api/admin/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTestTitle,
          description: newTestDesc,
          durationMinutes: newTestDuration,
          passingPercentage: newTestPassRate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateTest(false);
        setNewTestTitle('');
        setNewTestDesc('');
        loadAllData();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test and its associated questions?')) return;
    try {
      await fetch(`/api/admin/tests?id=${id}`, { method: 'DELETE' });
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePublish = async (test: any) => {
    try {
      await fetch('/api/admin/tests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: test.id,
          isPublished: !test.isPublished,
        }),
      });
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestId) return;

    try {
      setActionLoading('addQuestion');
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: selectedTestId,
          text: newQText,
          type: newQType,
          marks: newQMarks,
          category: newQCategory,
          explanation: newQExplanation,
          options: newQType === 'TRUE_FALSE'
            ? [
                { text: 'True', isCorrect: newQOptions[0].isCorrect },
                { text: 'False', isCorrect: !newQOptions[0].isCorrect },
              ]
            : newQOptions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddQuestion(false);
        setNewQText('');
        setNewQExplanation('');
        // Reload questions
        const qRes = await fetch(`/api/admin/questions?testId=${selectedTestId}`);
        const qData = await qRes.json();
        if (qData.success) setQuestions(qData.questions);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Delete this question?')) return;
    await fetch(`/api/admin/questions?id=${qId}`, { method: 'DELETE' });
    const qRes = await fetch(`/api/admin/questions?testId=${selectedTestId}`);
    const qData = await qRes.json();
    if (qData.success) setQuestions(qData.questions);
  };

  const handleResendEmail = async (certId: string) => {
    try {
      setActionLoading(`resend-${certId}`);
      const res = await fetch(`/api/certificates/${certId}/resend-email`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Email re-sent successfully!');
        loadCertificates();
        loadEmailLogs();
      } else {
        alert('Email send status: ' + (data.emailStatus?.error || 'Simulated log created'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/admin/participants?format=csv', '_blank');
  };

  // If not authenticated, render Login Form
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#06080F] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#090E1A] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Administrator Access</h2>
            <p className="text-xs text-slate-400">Sign in to manage assessments, review candidates, and issue certificates.</p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300">
              {loginError}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(false); }} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 transition shadow-md disabled:opacity-50"
            >
              {loginLoading ? 'Authenticating...' : 'Sign In as Administrator'}
            </button>
          </form>

          {/* 1-Click Demo Login */}
          <div className="pt-2 border-t border-slate-800 text-center space-y-3">
            <span className="text-[11px] text-slate-500">Evaluation Testing Shortcut:</span>
            <button
              type="button"
              onClick={() => handleLogin(true)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-950/50 hover:bg-cyan-950/80 border border-cyan-800/80 transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>1-Click Instant Demo Admin Login</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#06080F] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col">
      {/* ── ADMIN NAV BAR ── */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">SkillCert Admin Workspace</h1>
            <span className="text-[10px] text-emerald-400 font-mono">Status: Authenticated (Superadmin)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800"
          >
            <span>Candidate Portal</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800/50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div className="bg-[#080D1A] border-b border-slate-800/80 px-4 sm:px-8 overflow-x-auto flex items-center gap-1">
        {[
          { key: 'overview', label: 'Overview & Charts', icon: BarChart3 },
          { key: 'tests', label: 'Assessments', icon: FileCheck },
          { key: 'questions', label: 'Question Bank', icon: Plus },
          { key: 'participants', label: 'Participants & Results', icon: Users },
          { key: 'certificates', label: 'Certificates', icon: Award },
          { key: 'emailLogs', label: 'Email Logs', icon: Mail },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── WORKSPACE CONTENT ── */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* TAB 1: OVERVIEW & CHARTS */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              <div className="p-4 rounded-xl bg-[#090E1A] border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">Total Tests</span>
                <div className="text-2xl font-bold text-white mt-1">{stats.totalTests}</div>
                <span className="text-[10px] text-cyan-400">Published & Active</span>
              </div>

              <div className="p-4 rounded-xl bg-[#090E1A] border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">Total Participants</span>
                <div className="text-2xl font-bold text-white mt-1">{stats.totalParticipants}</div>
                <span className="text-[10px] text-slate-500">Unique candidate emails</span>
              </div>

              <div className="p-4 rounded-xl bg-[#090E1A] border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">Tests Completed</span>
                <div className="text-2xl font-bold text-white mt-1">{stats.testsCompleted}</div>
                <span className="text-[10px] text-slate-500">Evaluated on server</span>
              </div>

              <div className="p-4 rounded-xl bg-[#090E1A] border border-slate-800">
                <span className="text-[11px] font-medium text-amber-400">Certificates Issued</span>
                <div className="text-2xl font-bold text-amber-300 mt-1">{stats.certificatesIssued}</div>
                <span className="text-[10px] text-slate-500">Cryptographically verifiable</span>
              </div>

              <div className="p-4 rounded-xl bg-[#090E1A] border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-medium text-emerald-400">Pass Rate</span>
                <div className="text-2xl font-bold text-emerald-300 mt-1">{stats.passRate}%</div>
                <span className="text-[10px] text-slate-500">Criterion &ge; 60%</span>
              </div>
            </div>

            {/* Visual Analytics / Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Score Distribution Chart */}
              <div className="p-6 rounded-2xl bg-[#090E1A] border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  Performance Score Distribution
                </h3>

                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Distinction (85% – 100%)</span>
                      <span className="font-mono text-cyan-300">{stats.distribution?.above85 || 0} candidates</span>
                    </div>
                    <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${Math.max(10, ((stats.distribution?.above85 || 0) / Math.max(1, stats.testsCompleted)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Proficient (70% – 84%)</span>
                      <span className="font-mono text-emerald-300">{stats.distribution?.between70And85 || 0} candidates</span>
                    </div>
                    <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${Math.max(10, ((stats.distribution?.between70And85 || 0) / Math.max(1, stats.testsCompleted)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Passing (50% – 69%)</span>
                      <span className="font-mono text-amber-300">{stats.distribution?.between50And70 || 0} candidates</span>
                    </div>
                    <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${Math.max(5, ((stats.distribution?.between50And70 || 0) / Math.max(1, stats.testsCompleted)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Needs Improvement (&lt; 50%)</span>
                      <span className="font-mono text-rose-300">{stats.distribution?.below50 || 0} candidates</span>
                    </div>
                    <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${Math.max(5, ((stats.distribution?.below50 || 0) / Math.max(1, stats.testsCompleted)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pass/Fail Distribution Pie Representation */}
              <div className="p-6 rounded-2xl bg-[#090E1A] border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  Outcome Ratio
                </h3>

                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-4">
                  {/* Visual SVG Donut */}
                  <div className="relative w-36 h-36">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.8"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-400"
                        strokeDasharray={`${stats.passRate || 0}, 100`}
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold font-mono text-white">{stats.passRate}%</span>
                      <span className="text-[9px] uppercase font-bold text-emerald-400">PASSED</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="text-slate-300 font-semibold">
                        Certificates Conferred: {stats.certificatesIssued}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-slate-700" />
                      <span className="text-slate-400">
                        Total Assessments: {stats.testsCompleted}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                      Authoritative evaluation prevents unauthorized local score manipulation.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TESTS MANAGEMENT */}
        {activeTab === 'tests' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Assessment Management</h2>
                <p className="text-xs text-slate-400">Configure exams, passing criteria, and certificate titles.</p>
              </div>
              <button
                onClick={() => setShowCreateTest(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Test</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tests.map((t) => (
                <div key={t.id} className="p-5 rounded-2xl bg-[#090E1A] border border-slate-800 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${t.isPublished ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'}`}>
                          {t.isPublished ? 'PUBLISHED' : 'DRAFT'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">ID: {t.id}</span>
                      </div>
                      <h3 className="text-base font-bold text-white">{t.title}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePublish(t)}
                        title="Toggle Published Status"
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-900 border border-slate-700 hover:text-cyan-300"
                      >
                        {t.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDeleteTest(t.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/60"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">{t.description}</p>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">Duration</span>
                      <span className="font-semibold text-white">{t.durationMinutes} mins</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">Passing Mark</span>
                      <span className="font-semibold text-amber-300">{t.passingPercentage}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">Questions</span>
                      <span className="font-semibold text-cyan-300">{t.questionCount || 10}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedTestId(t.id);
                        setActiveTab('questions');
                      }}
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Manage Question Bank</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] text-slate-500">{t.organizationName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: QUESTION BANK */}
        {activeTab === 'questions' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white">Question Bank</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Selected Test:</span>
                  <select
                    value={selectedTestId}
                    onChange={(e) => setSelectedTestId(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-cyan-300"
                  >
                    {tests.map((t) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => setShowAddQuestion(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-xl bg-[#090E1A] border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300">
                          Q{idx + 1} • {q.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {q.type} • {q.marks} mark{q.marks > 1 ? 's' : ''}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white">{q.text}</h4>
                    </div>

                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options?.map((opt: any) => (
                      <div
                        key={opt.id}
                        className={`p-2 rounded-lg border flex items-center justify-between ${
                          opt.isCorrect
                            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 font-semibold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span>{opt.text}</span>
                        {opt.isCorrect && <span className="text-[10px] text-emerald-400 font-bold">✓ Correct</span>}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <strong>Explanation:</strong> {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PARTICIPANTS & RESULTS */}
        {activeTab === 'participants' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Participants & Examination Records</h2>
                <p className="text-xs text-slate-400">Review candidate submissions, scores, and proctoring logs.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-md transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export to CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search participants by name, email, organization..."
                  value={participantSearch}
                  onChange={(e) => {
                    setParticipantSearch(e.target.value);
                    loadParticipants(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Records Table */}
            <div className="rounded-2xl border border-slate-800 bg-[#090E1A] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Organization</th>
                      <th className="py-3 px-4">Assessment</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Outcome</th>
                      <th className="py-3 px-4">Certificate</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {participants.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{att.user?.name}</div>
                          <div className="text-[11px] text-slate-500">{att.user?.email}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{att.user?.organization || 'Individual'}</td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-300">{att.test?.title}</td>
                        <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                          {att.percentage}% ({att.score}/{att.maxScore})
                        </td>
                        <td className="py-3 px-4">
                          {att.isPassed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              PASSED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                              FAILED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {att.certificate ? (
                            <Link
                              href={`/verify/${att.certificate.certificateId}`}
                              className="text-cyan-400 hover:underline flex items-center gap-1"
                            >
                              {att.certificate.certificateId}
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-slate-600">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {att.submittedAt ? new Date(att.submittedAt).toLocaleDateString() : 'In Progress'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CERTIFICATES MANAGEMENT */}
        {activeTab === 'certificates' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Issued Certificates</h2>
                <p className="text-xs text-slate-400">Monitor cryptographic IDs, downloads, and transactional email statuses.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Certificate ID, candidate name, or email..."
                  value={certSearch}
                  onChange={(e) => {
                    setCertSearch(e.target.value);
                    loadCertificates(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#090E1A] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Certificate ID</th>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Test Title</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Conferral Date</th>
                      <th className="py-3 px-4">Email Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {certificates.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-amber-300">
                          {c.certificateId}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{c.participantName}</div>
                          <div className="text-[11px] text-slate-500">{c.participantEmail}</div>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-300">{c.testTitle}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">{c.percentage}%</td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(c.issueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 w-max">
                            <Mail className="w-3 h-3 text-emerald-400" />
                            {c.emailSent ? 'Delivered' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                          <a
                            href={`/api/certificates/${c.certificateId}/download`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-semibold text-cyan-300 hover:border-cyan-400"
                            download
                          >
                            <Download className="w-3 h-3" />
                            <span>PDF</span>
                          </a>

                          <Link
                            href={`/verify/${c.certificateId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white"
                          >
                            <ShieldCheck className="w-3 h-3 text-cyan-400" />
                            <span>Verify</span>
                          </Link>

                          <button
                            onClick={() => handleResendEmail(c.certificateId)}
                            disabled={actionLoading === `resend-${c.certificateId}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800 text-xs font-semibold text-cyan-300 hover:bg-cyan-900 disabled:opacity-50"
                          >
                            <RotateCw className={`w-3 h-3 ${actionLoading === `resend-${c.certificateId}` ? 'animate-spin' : ''}`} />
                            <span>Resend Email</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: EMAIL LOGS */}
        {activeTab === 'emailLogs' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg font-bold text-white">Transactional Email Delivery Logs</h2>
              <p className="text-xs text-slate-400">Resend provider records and audit trace for certificate dispatch.</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#090E1A] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Certificate ID</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Provider Reference ID</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {emailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-4 font-semibold text-white">{log.recipient}</td>
                        <td className="py-3 px-4 font-mono text-cyan-300">{log.certificateId || 'N/A'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'DELIVERED' || log.status === 'SIMULATED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {log.providerId || log.errorMessage || 'System Simulated'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE TEST MODAL */}
      {showCreateTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-[#090E1A] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Create New Assessment</h3>
            <form onSubmit={handleCreateTest} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Test Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Architecture Specialist"
                  value={newTestTitle}
                  onChange={(e) => setNewTestTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Overview of syllabus, evaluation criteria, and target competencies..."
                  value={newTestDesc}
                  onChange={(e) => setNewTestDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={newTestDuration}
                    onChange={(e) => setNewTestDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Passing %</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={newTestPassRate}
                    onChange={(e) => setNewTestPassRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTest(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'createTest'}
                  className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 font-bold"
                >
                  Create Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD QUESTION MODAL */}
      {showAddQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-lg w-full bg-[#090E1A] border border-slate-800 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white">Add Question to Assessment</h3>
            <form onSubmit={handleAddQuestion} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Question Prompt</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Enter the full question prompt..."
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Question Type</label>
                  <select
                    value={newQType}
                    onChange={(e) => setNewQType(e.target.value as any)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True / False</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={newQMarks}
                    onChange={(e) => setNewQMarks(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Category</label>
                  <input
                    type="text"
                    value={newQCategory}
                    onChange={(e) => setNewQCategory(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Options */}
              {newQType === 'MULTIPLE_CHOICE' ? (
                <div className="space-y-2 pt-1">
                  <label className="text-slate-300 font-semibold block">Answer Options & Correct Key</label>
                  {newQOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={opt.isCorrect}
                        onChange={() => {
                          setNewQOptions((prev) =>
                            prev.map((o, idx) => ({ ...o, isCorrect: idx === i }))
                          );
                        }}
                      />
                      <input
                        type="text"
                        required
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        value={opt.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewQOptions((prev) =>
                            prev.map((o, idx) => (idx === i ? { ...o, text: val } : o))
                          );
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <label className="text-slate-300 font-semibold block">Select Correct Key</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-slate-200">
                      <input
                        type="radio"
                        name="tfOpt"
                        checked={newQOptions[0].isCorrect}
                        onChange={() => setNewQOptions([{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }])}
                      />
                      <span>True is correct</span>
                    </label>
                    <label className="flex items-center gap-2 text-slate-200">
                      <input
                        type="radio"
                        name="tfOpt"
                        checked={!newQOptions[0].isCorrect}
                        onChange={() => setNewQOptions([{ text: 'True', isCorrect: false }, { text: 'False', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }])}
                      />
                      <span>False is correct</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Explanation (Revealed after submission)</label>
                <textarea
                  rows={2}
                  placeholder="Explain why this answer is correct..."
                  value={newQExplanation}
                  onChange={(e) => setNewQExplanation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddQuestion(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'addQuestion'}
                  className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 font-bold"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
