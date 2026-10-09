'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  User,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Send,
  AlertTriangle,
  Loader2,
  Flag,
  Award,
  Layers,
  LayoutGrid,
  X,
} from 'lucide-react';
import TestRegisterModal from '@/components/TestRegisterModal';

interface QuestionOption {
  id: string;
  text: string;
  order: number;
}

interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  marks: number;
  order: number;
  category: string;
  options: QuestionOption[];
}

interface TestData {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  passingPercentage: number;
  questions: Question[];
}

const SECTIONS = [
  { id: 'ALL', name: 'All Questions', range: '1 - 25', start: 0, end: 25 },
  { id: 'SEC_A', name: 'Sec A: Cyber Security', range: 'Q1 - Q20', start: 0, end: 20 },
  { id: 'SEC_B', name: 'Sec B: Blockchain', range: 'Q21 - Q25', start: 20, end: 25 },
];

export default function ExamPage({ params }: { params: { attemptId: string } }) {
  const router = useRouter();
  const attemptId = params.attemptId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [test, setTest] = useState<TestData | null>(null);
  const [participant, setParticipant] = useState<{ name: string; email: string; organization?: string } | null>(null);

  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateOrg, setCandidateOrg] = useState('');
  const [showNameEditModal, setShowNameEditModal] = useState(false);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [activeSection, setActiveSection] = useState('ALL');
  const [answers, setAnswers] = useState<Record<string, string>>({}); // { questionId: optionId }
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({}); // { questionId: boolean }

  const [timeLeft, setTimeLeft] = useState<number>(60 * 60); // In seconds
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [tabWarningVisible, setTabWarningVisible] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialDurationRef = useRef<number>(60 * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load Examination Session & Questions
  useEffect(() => {
    async function loadTestSession() {
      try {
        setLoading(true);

        const res = await fetch(`/api/test/attempt/${attemptId}`);
        const data = await res.json();

        if (!data.success || !data.test) {
          throw new Error(data.error || 'Failed to verify examination session');
        }

        setTest(data.test);

        // Resolve authentic candidate name and email from URL params, localStorage, or server
        let candidateLocal: any = null;
        try {
          const item = localStorage.getItem('certipulse_candidate');
          if (item) candidateLocal = JSON.parse(item);
        } catch {}

        const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const qName = sp?.get('name')?.trim() || '';
        const qEmail = sp?.get('email')?.trim() || '';
        const qOrg = sp?.get('org')?.trim() || '';

        const resolvedName = (
          qName ||
          candidateLocal?.name ||
          (data.participant?.name && data.participant.name !== 'FDP Participant' && data.participant.name !== 'Candidate'
            ? data.participant.name
            : '')
        ).trim();

        const resolvedEmail = (
          qEmail ||
          candidateLocal?.email ||
          (data.participant?.email && !data.participant.email.startsWith('participant-') ? data.participant.email : '')
        ).trim();

        const resolvedOrg = (
          qOrg ||
          candidateLocal?.organization ||
          data.participant?.organization ||
          ''
        ).trim();

        setCandidateName(resolvedName);
        setCandidateEmail(resolvedEmail);
        setCandidateOrg(resolvedOrg);
        setParticipant({
          name: resolvedName,
          email: resolvedEmail,
          organization: resolvedOrg,
        });

        // Prompt if participant name is empty so it is never dummy
        if (!resolvedName) {
          setShowNameEditModal(true);
        }

        if (data.savedAnswers) setAnswers(data.savedAnswers);
        if (data.markedForReview) setMarkedForReview(data.markedForReview);

        const durationSecs = (data.test.durationMinutes || 60) * 60;
        initialDurationRef.current = durationSecs;

        // Check if cached local progress exists
        const cached = localStorage.getItem(`certipulse_exam_${attemptId}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.answers) setAnswers((prev) => ({ ...prev, ...parsed.answers }));
            if (parsed.markedForReview) setMarkedForReview((prev) => ({ ...prev, ...parsed.markedForReview }));
            if (parsed.timeLeft && parsed.timeLeft > 0) setTimeLeft(parsed.timeLeft);
            if (parsed.tabSwitchCount) setTabSwitchCount(parsed.tabSwitchCount);
          } catch {}
        } else {
          setTimeLeft(durationSecs);
        }
      } catch (err: any) {
        console.error('Failed to load exam:', err);
        setError(err.message || 'Failed to load test session');
      } finally {
        setLoading(false);
      }
    }

    loadTestSession();
  }, [attemptId]);

  // 2. Countdown Timer
  useEffect(() => {
    if (loading || submitting) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, submitting]);

  // 3. Tab Visibility & Anti-Cheating
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const updated = prev + 1;
          fetch('/api/test/save-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attemptId, tabSwitchInc: true }),
          }).catch(() => {});
          return updated;
        });
        setTabWarningVisible(true);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Assessment in progress! Leaving this page may lose your progress.';
      return e.returnValue;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [attemptId]);

  // 4. Persistence to LocalStorage & Server Sync
  useEffect(() => {
    if (!loading && test) {
      localStorage.setItem(
        `certipulse_exam_${attemptId}`,
        JSON.stringify({
          answers,
          markedForReview,
          timeLeft,
          tabSwitchCount,
          participant,
        })
      );
    }
  }, [answers, markedForReview, timeLeft, tabSwitchCount, loading, test, attemptId, participant]);

  const saveAnswerToServer = useCallback(
    async (qId: string, optId: string | null) => {
      try {
        await fetch('/api/test/save-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attemptId,
            questionId: qId,
            selectedOptionId: optId,
            isMarkedForReview: markedForReview[qId] || false,
            timeSpentSeconds: initialDurationRef.current - timeLeft,
          }),
        });
      } catch (err) {
        console.warn('Progress save failed temporarily:', err);
      }
    },
    [attemptId, markedForReview, timeLeft]
  );

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: optionId };
      saveAnswerToServer(questionId, optionId);
      return next;
    });
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview((prev) => {
      const nextVal = !prev[questionId];
      const updated = { ...prev, [questionId]: nextVal };
      fetch('/api/test/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          questionId,
          isMarkedForReview: nextVal,
        }),
      }).catch(() => {});
      return updated;
    });
  };

  const handleClearAnswer = (questionId: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      saveAnswerToServer(questionId, null);
      return next;
    });
  };

  const handleAutoSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          answers,
          timeSpentSeconds: initialDurationRef.current,
          participantName: candidateName || participant?.name || 'Participant',
          participantOrganization: candidateOrg || participant?.organization || null,
          participantEmail: candidateEmail || participant?.email || '',
        }),
      });
      localStorage.removeItem(`certipulse_exam_${attemptId}`);
      router.push(`/result/${attemptId}`);
    } catch (err) {
      console.error('Auto submit failed:', err);
      router.push(`/result/${attemptId}`);
    }
  }, [submitting, attemptId, answers, candidateName, candidateEmail, candidateOrg, participant, router]);

  const submitExamToServer = async () => {
    const validName = (candidateName || participant?.name || '').trim();
    const validEmail = (candidateEmail || participant?.email || '').trim();
    const validOrg = (candidateOrg || participant?.organization || '').trim();

    if (!validName || validName === 'FDP Participant' || validName === 'Candidate') {
      alert('Please enter your full legal name so it can be printed on your Certificate of Participation.');
      setShowSubmitModal(false);
      setShowNameEditModal(true);
      return;
    }

    if (!validEmail || !validEmail.includes('@') || validEmail.startsWith('participant-')) {
      alert('Please enter a valid email address so your certificate PDF can be delivered to your inbox.');
      setShowSubmitModal(false);
      setShowNameEditModal(true);
      return;
    }

    setSubmitting(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'certipulse_candidate',
          JSON.stringify({
            name: validName,
            email: validEmail,
            organization: validOrg,
          })
        );
      }

      const res = await fetch('/api/test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          answers,
          timeSpentSeconds: initialDurationRef.current - timeLeft,
          participantName: validName,
          participantOrganization: validOrg || null,
          participantEmail: validEmail,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Submission failed');
      }

      localStorage.removeItem(`certipulse_exam_${attemptId}`);
      router.push(`/result/${attemptId}`);
    } catch (err: any) {
      alert(`Submission error: ${err.message || 'Please check your connection and retry.'}`);
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060810] flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-sm font-medium text-slate-300">Setting up secure examination room...</p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-[#060810] flex flex-col items-center justify-center p-4 text-white">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-[#090E1A] border border-slate-800 text-center space-y-5 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white tracking-tight">FDP Assessment Room</h2>
            <p className="text-xs text-slate-300">
              {error === 'Examination attempt not found'
                ? 'Your previous examination session has expired or was not initialized. You can start a fresh assessment right away below.'
                : error || 'Unable to load test questions.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 font-bold text-xs text-slate-950 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              Start Assessment Now
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              Return to Homepage
            </button>
          </div>
        </div>

        <TestRegisterModal
          test={{
            id: 'test-fdp-2026',
            title: 'Faculty Development Programme (FDP) Assessment',
            durationMinutes: 60,
            passingPercentage: 0,
            questionCount: 50,
          }}
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
        />
      </div>
    );
  }

  const questions = test.questions || [];
  const currentQ = questions[currentIdx];

  const answeredCount = Object.keys(answers).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  // Find first unanswered question
  const firstUnansweredIdx = questions.findIndex((q) => !answers[q.id]);

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col select-none">
      {/* ── HEADER BAR ── */}
      <header className="sticky top-0 z-40 bg-[#090E1A]/95 border-b border-slate-800/80 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Assessment Title & Candidate */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 items-center justify-center text-amber-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight line-clamp-1">
                  NMIET &amp; ISTE FDP Assessment
                </span>
                <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-400/10 text-amber-300 border border-amber-400/20">
                  {questions.length || 25} MCQs · 1 Mark Each
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNameEditModal(true)}
                  className="flex items-center gap-1 text-slate-300 hover:text-amber-300 transition cursor-pointer"
                  title="Click to edit your name on the certificate"
                >
                  <User className="w-3 h-3 text-cyan-400" />
                  <span className="font-semibold text-white underline decoration-slate-600 underline-offset-2">
                    {candidateName || participant?.name || 'Enter Your Name'}
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">(Edit)</span>
                </button>
                {(candidateOrg || participant?.organization) && (
                  <span className="hidden sm:inline text-slate-500">· {candidateOrg || participant?.organization}</span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Timer & Submit Button */}
          <div className="flex items-center gap-3">
            {/* Timer Badge */}
            <div
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl border font-mono font-bold text-xs sm:text-sm shadow-sm transition-all ${
                timeLeft < 300
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-slate-900 border-slate-700 text-amber-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{formatTimer(timeLeft)}</span>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Submit Test</span>
              <span className="sm:hidden">Submit</span>
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-900 h-1 mt-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* ── SECTION NAVIGATION TABS ── */}
      <div className="bg-[#080C16] border-b border-slate-800/80 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-amber-400" /> Sections:
          </span>
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => {
                setActiveSection(sec.id);
                if (sec.id !== 'ALL') {
                  setCurrentIdx(sec.start);
                }
              }}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition cursor-pointer font-medium text-[11px] ${
                activeSection === sec.id
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sec.name} <span className="opacity-75 font-mono text-[10px]">({sec.range})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── ANTI-CHEATING WARNING BANNER ── */}
      {tabWarningVisible && (
        <div className="bg-amber-950/90 border-b border-amber-600/80 px-4 py-2 text-amber-200 text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Integrity Alert:</strong> You switched away from the exam tab ({tabSwitchCount} time{tabSwitchCount > 1 ? 's' : ''}). All events are recorded in your exam audit log.
            </span>
          </div>
          <button
            onClick={() => setTabWarningVisible(false)}
            className="px-2 py-0.5 rounded bg-amber-900/60 hover:bg-amber-800 text-[10px] font-semibold uppercase"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── MAIN WORKSPACE (QUESTIONS + SIDEBAR) ── */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* ── LEFT: QUESTION VIEWER (70%) ── */}
        <main className="flex-1 flex flex-col justify-between bg-[#0A0F1D] border border-slate-800/80 rounded-2xl p-5 sm:p-8 shadow-xl">
          {currentQ ? (
            <div className="space-y-6">
              {/* Question Metadata Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-400/10 text-amber-300 border border-amber-400/20">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-slate-900 text-cyan-300 border border-slate-800">
                    {currentQ.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">1 Mark · Compulsory</span>
                </div>

                {/* Action Buttons: Mobile Palette & Mark for Review */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMobilePalette(true)}
                    className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 text-amber-300 hover:text-white transition cursor-pointer"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                    <span>Palette ({answeredCount}/{questions.length})</span>
                  </button>

                  <button
                    onClick={() => toggleMarkForReview(currentQ.id)}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      markedForReview[currentQ.id]
                        ? 'bg-amber-950/70 border-amber-500/80 text-amber-300 shadow-sm'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${markedForReview[currentQ.id] ? 'fill-amber-400 text-amber-400' : ''}`} />
                    <span className="hidden sm:inline">{markedForReview[currentQ.id] ? 'Marked for Review' : 'Mark for Review'}</span>
                    <span className="sm:hidden">{markedForReview[currentQ.id] ? 'Marked' : 'Review'}</span>
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-3">
                <h2 className="text-sm sm:text-lg font-semibold text-white leading-relaxed">
                  {currentQ.text}
                </h2>
              </div>

              {/* Options List */}
              <div className="space-y-2.5 sm:space-y-3 pt-1">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  const optionLabel = String.fromCharCode(65 + oIdx);

                  return (
                    <label
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQ.id, opt.id)}
                      className={`flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-amber-400 text-white shadow-md shadow-amber-950/20'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 border mt-0.5 transition-all ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-amber-400'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {optionLabel}
                      </div>
                      <span className="flex-1 font-medium leading-relaxed">{opt.text}</span>
                    </label>
                  );
                })}
              </div>

              {/* Clear Answer Link */}
              {answers[currentQ.id] && (
                <div className="pt-1">
                  <button
                    onClick={() => handleClearAnswer(currentQ.id)}
                    className="text-xs text-slate-500 hover:text-rose-400 transition underline underline-offset-4 cursor-pointer"
                  >
                    Clear selection
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Navigation Controls Bar */}
          <div className="flex items-center justify-between pt-8 border-t border-slate-800/80 mt-8 gap-3">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2">
              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-md shadow-amber-500/20 transition cursor-pointer"
                >
                  <span>Save &amp; Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                >
                  <span>Finish &amp; Submit</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </main>

        {/* ── RIGHT: QUESTION PALETTE SIDEBAR (30%) ── */}
        <aside className="w-full lg:w-80 bg-[#0A0F1D] border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Palette Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white tracking-tight">Question Palette</h3>
              <span className="text-[11px] font-mono text-amber-400">{answeredCount}/{questions.length} Completed</span>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-500" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500/40 border border-amber-500" />
                <span>Review ({reviewCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700" />
                <span>Pending ({unansweredCount})</span>
              </div>
            </div>

            {/* Question Buttons Grid */}
            <div className="grid grid-cols-5 gap-2 pt-1 max-h-[360px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isReview = !!markedForReview[q.id];
                const isCurrent = idx === currentIdx;

                let btnStyles = 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700';

                if (isReview) {
                  btnStyles = 'bg-amber-950/80 border-amber-500 text-amber-300';
                } else if (isAnswered) {
                  btnStyles = 'bg-emerald-950/80 border-emerald-500 text-emerald-300';
                }

                if (isCurrent) {
                  btnStyles += ' ring-2 ring-amber-400 ring-offset-2 ring-offset-[#0A0F1D] font-bold text-white';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-lg border text-xs font-mono font-semibold transition-all flex items-center justify-center relative cursor-pointer ${btnStyles}`}
                  >
                    <span>{idx + 1}</span>
                    {isReview && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Compulsory Information Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="text-amber-300 font-semibold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Certificate of Participation
              </div>
              <p>
                All {questions.length} questions are compulsory. Upon final submission, your personalized certificate will be generated and dispatched directly to your email address.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Examination</span>
          </button>
        </aside>
      </div>

      {/* ── SUBMIT CONFIRMATION MODAL ── */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0A0F1D] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl text-slate-100">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Submit FDP Assessment?
              </h3>
              <p className="text-xs text-slate-300">
                {unansweredCount > 0 ? (
                  <span className="text-amber-300">
                    Notice: All {questions.length} questions are compulsory. You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}.
                  </span>
                ) : (
                  <span>
                    All {questions.length} questions have been completed! Your official Certificate of Participation will be generated and dispatched to your email.
                  </span>
                )}
              </p>
            </div>

            {/* Summary Stat Box */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs">
              <div>
                <span className="block text-slate-500 text-[10px]">Answered</span>
                <span className="font-bold text-emerald-400 text-sm">{answeredCount}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px]">Unanswered</span>
                <span className={`font-bold text-sm ${unansweredCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {unansweredCount}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px]">Flagged</span>
                <span className="font-bold text-cyan-400 text-sm">{reviewCount}</span>
              </div>
            </div>

            {/* Candidate Info on Certificate */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2.5 text-left">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold">
                  Official Certificate Recipient Details
                </span>
                <span className="text-[10px] text-slate-400">Printed directly on PDF</span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span>Full Legal Name <span className="text-red-400">*</span></span>
                  <span className="text-[10px] text-slate-500 font-normal">Printed above official line</span>
                </label>
                <input
                  type="text"
                  required
                  value={candidateName}
                  onChange={(e) => {
                    setCandidateName(e.target.value);
                    setParticipant((p) => ({ ...p!, name: e.target.value }));
                  }}
                  placeholder="e.g. Dr. Rajesh Sharma / Prof. Kavita Joshi"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span>Email for Certificate PDF <span className="text-red-400">*</span></span>
                  <span className="text-[10px] text-slate-500 font-normal">Dispatched to this address</span>
                </label>
                <input
                  type="email"
                  required
                  value={candidateEmail}
                  onChange={(e) => {
                    setCandidateEmail(e.target.value);
                    setParticipant((p) => ({ ...p!, email: e.target.value }));
                  }}
                  placeholder="e.g. participant@institute.edu.in"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  College / Institute Name
                </label>
                <input
                  type="text"
                  value={candidateOrg}
                  onChange={(e) => {
                    setCandidateOrg(e.target.value);
                    setParticipant((p) => ({ ...p!, organization: e.target.value }));
                  }}
                  placeholder="e.g. NMIET, Talegaon / Pune University"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium text-xs focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-500">Printed after &quot;FROM&quot; on the certificate.</p>
              </div>
            </div>

            {unansweredCount > 0 && firstUnansweredIdx !== -1 && (
              <button
                type="button"
                onClick={() => {
                  setCurrentIdx(firstUnansweredIdx);
                  setShowSubmitModal(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-amber-500/50 bg-amber-950/30 text-amber-300 text-xs font-semibold hover:bg-amber-950/50 transition cursor-pointer"
              >
                Jump to Question {firstUnansweredIdx + 1} (Unanswered)
              </button>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 transition cursor-pointer"
              >
                Review Answers
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={submitExamToServer}
                className="w-1/2 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 shadow-md shadow-amber-500/20 disabled:opacity-50 transition cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm &amp; Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE QUESTION PALETTE MODAL ── */}
      {showMobilePalette && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in lg:hidden">
          <div className="w-full sm:max-w-md max-h-[85vh] bg-[#0A0F1D] border border-slate-800 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">50 Questions Palette</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-amber-400">{answeredCount}/50 Completed</span>
                <button
                  onClick={() => setShowMobilePalette(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-500" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500/40 border border-amber-500" />
                <span>Review ({reviewCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700" />
                <span>Pending ({unansweredCount})</span>
              </div>
            </div>

            {/* Question Buttons Grid */}
            <div className="grid grid-cols-5 gap-2 pt-1 max-h-[50vh] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isReview = !!markedForReview[q.id];
                const isCurrent = idx === currentIdx;

                let btnStyles = 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700';

                if (isReview) {
                  btnStyles = 'bg-amber-950/80 border-amber-500 text-amber-300';
                } else if (isAnswered) {
                  btnStyles = 'bg-emerald-950/80 border-emerald-500 text-emerald-300';
                }

                if (isCurrent) {
                  btnStyles += ' ring-2 ring-amber-400 font-bold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIdx(idx);
                      setShowMobilePalette(false);
                    }}
                    className={`h-10 rounded-xl border text-xs font-mono font-medium transition flex items-center justify-center cursor-pointer ${btnStyles}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowMobilePalette(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
              >
                Close Palette
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NAME & EMAIL EDIT MODAL ── */}
      {showNameEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0A0F1D] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl text-slate-100">
            <div className="space-y-1.5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Participant Details</h3>
              <p className="text-xs text-slate-400">
                Please enter your full legal name and email so your official Certificate of Participation is generated and delivered to you accurately.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!candidateName.trim() || candidateName.trim().length < 2) {
                  alert('Please enter your full legal name (minimum 2 characters).');
                  return;
                }
                if (!candidateEmail.trim() || !candidateEmail.includes('@')) {
                  alert('Please enter a valid email address.');
                  return;
                }
                if (typeof window !== 'undefined') {
                  localStorage.setItem(
                    'certipulse_candidate',
                    JSON.stringify({
                      name: candidateName.trim(),
                      email: candidateEmail.trim(),
                      organization: candidateOrg.trim(),
                    })
                  );
                }
                setParticipant({
                  name: candidateName.trim(),
                  email: candidateEmail.trim(),
                  organization: candidateOrg.trim(),
                });
                setShowNameEditModal(false);
              }}
              className="space-y-4"
            >
              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-slate-300">
                  Full Legal Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma / Prof. Kavita Joshi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-500">Printed directly above the official line on the certificate.</p>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-slate-300">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  placeholder="e.g. participant@institute.edu.in"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-500">Certificate PDF will be dispatched to this email address.</p>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-slate-300">
                  College / Institute Name
                </label>
                <input
                  type="text"
                  value={candidateOrg}
                  onChange={(e) => setCandidateOrg(e.target.value)}
                  placeholder="e.g. NMIET, Talegaon, Pune"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-500">Printed after &quot;FROM&quot; on the certificate.</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-md transition cursor-pointer"
                >
                  Save &amp; Continue Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
