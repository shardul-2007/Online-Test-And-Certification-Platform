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
} from 'lucide-react';

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
  durationMinutes: number;
  passingPercentage: number;
  questions: Question[];
}

export default function ExamPage({ params }: { params: { attemptId: string } }) {
  const router = useRouter();
  const attemptId = params.attemptId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [test, setTest] = useState<TestData | null>(null);
  const [participant, setParticipant] = useState<{ name: string; email: string } | null>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // { questionId: optionId }
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({}); // { questionId: boolean }

  const [timeLeft, setTimeLeft] = useState<number>(20 * 60); // In seconds
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [tabWarningVisible, setTabWarningVisible] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialDurationRef = useRef<number>(20 * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load Attempt & Test Data
  useEffect(() => {
    async function loadTestSession() {
      try {
        setLoading(true);

        // Fetch attempt details
        const attemptRes = await fetch(`/api/test/save-progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attemptId }),
        });

        if (!attemptRes.ok) {
          const errData = await attemptRes.json();
          throw new Error(errData.error || 'Failed to verify session');
        }

        // Fetch demo test data
        const testRes = await fetch('/api/test/web-development-fundamentals');
        const testData = await testRes.json();

        if (!testData.success || !testData.test) {
          throw new Error('Test questions could not be loaded');
        }

        setTest(testData.test);
        const durationSecs = (testData.test.durationMinutes || 20) * 60;
        initialDurationRef.current = durationSecs;

        // Check if there are cached local progress answers
        const cached = localStorage.getItem(`certipulse_exam_${attemptId}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.answers) setAnswers(parsed.answers);
            if (parsed.markedForReview) setMarkedForReview(parsed.markedForReview);
            if (parsed.timeLeft && parsed.timeLeft > 0) setTimeLeft(parsed.timeLeft);
            if (parsed.tabSwitchCount) setTabSwitchCount(parsed.tabSwitchCount);
            if (parsed.participant) setParticipant(parsed.participant);
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

  // 3. Tab Visibility & Anti-Cheating Tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const updated = prev + 1;
          // Notify server
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

  // 4. Persistence to LocalStorage
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
  }, [answers, markedForReview, timeLeft, tabSwitchCount, participant, loading, test, attemptId]);

  // 5. Select Answer
  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: optionId };

      // Background server synchronization
      fetch('/api/test/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          questionId,
          selectedOptionId: optionId,
          isMarkedForReview: markedForReview[questionId] || false,
          timeSpentSeconds: initialDurationRef.current - timeLeft,
        }),
      }).catch(() => {});

      return next;
    });
  };

  // 6. Toggle Mark for Review
  const handleToggleReview = (questionId: string) => {
    setMarkedForReview((prev) => {
      const isMarked = !prev[questionId];
      const next = { ...prev, [questionId]: isMarked };

      fetch('/api/test/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          questionId,
          isMarkedForReview: isMarked,
        }),
      }).catch(() => {});

      return next;
    });
  };

  // 7. Authoritative Submission to Server
  const submitExamToServer = useCallback(async () => {
    setSubmitting(true);
    setShowSubmitModal(false);

    try {
      const timeSpent = initialDurationRef.current - timeLeft;
      const res = await fetch('/api/test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          answers,
          timeSpentSeconds: timeSpent,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Submission failed');
      }

      // Clear local storage exam progress
      localStorage.removeItem(`certipulse_exam_${attemptId}`);

      // Route to results & certificate screen
      router.push(`/result/${attemptId}`);
    } catch (err: any) {
      setError(err.message || 'Submission error');
      setSubmitting(false);
    }
  }, [answers, attemptId, initialDurationRef, timeLeft, router]);

  const handleAutoSubmit = useCallback(() => {
    submitExamToServer();
  }, [submitExamToServer]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-medium text-slate-300">Setting up secure examination environment...</p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center p-4 text-white">
        <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-red-800/80 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold">Assessment Error</h2>
          <p className="text-xs text-slate-400">{error || 'Unable to load examination.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  const questions = test.questions || [];
  const currentQuestion = questions[currentIdx];

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const isTimeCritical = timeLeft < 120; // under 2 minutes

  return (
    <div className="min-h-screen bg-[#060810] text-slate-100 flex flex-col">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight line-clamp-1">
              {test.title}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-cyan-400" /> {participant?.name || 'Candidate'}
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">
                {answeredCount}/{questions.length} Answered
              </span>
            </div>
          </div>
        </div>

        {/* Live Countdown Timer */}
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono font-bold text-sm border transition-all ${
              isTimeCritical
                ? 'bg-red-950/80 text-red-300 border-red-700 animate-pulse'
                : 'bg-slate-900 text-cyan-300 border-slate-700/80'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-red-400' : 'text-cyan-400'}`} />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-md shadow-cyan-500/20 transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Test</span>
          </button>
        </div>
      </header>

      {/* ── TAB SWITCH WARNING TOAST ── */}
      {tabWarningVisible && (
        <div className="bg-amber-950/90 border-b border-amber-800 text-amber-200 px-4 py-2.5 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Proctoring Alert: Tab switch detected ({tabSwitchCount} total). Examination rules require keeping this window active.
            </span>
          </div>
          <button
            onClick={() => setTabWarningVisible(false)}
            className="text-amber-400 hover:text-white text-[11px] font-semibold underline ml-4"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* QUESTION AREA (Cols 1-8) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          {currentQuestion && (
            <div className="p-6 sm:p-8 rounded-2xl bg-[#090E1A] border border-slate-800 shadow-xl flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Meta Row */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                      Question {currentIdx + 1} of {questions.length}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
                      {currentQuestion.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">
                      +{currentQuestion.marks} mark{currentQuestion.marks > 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => handleToggleReview(currentQuestion.id)}
                      className={`p-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
                        markedForReview[currentQuestion.id]
                          ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title="Flag for later review"
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${markedForReview[currentQuestion.id] ? 'fill-amber-400 text-amber-400' : ''}`} />
                      <span className="hidden sm:inline">
                        {markedForReview[currentQuestion.id] ? 'Marked' : 'Mark'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="space-y-4">
                  <h2 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
                    {currentQuestion.text}
                  </h2>
                </div>

                {/* Options List */}
                <div className="space-y-3 pt-2">
                  {currentQuestion.options.map((option, optIdx) => {
                    const isSelected = answers[currentQuestion.id] === option.id;
                    const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                        className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center gap-3.5 cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-md shadow-cyan-950/40'
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center font-mono text-xs font-semibold shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-cyan-400 border-cyan-400 text-slate-950'
                              : 'bg-slate-800/80 border-slate-700 text-slate-400'
                          }`}
                        >
                          {optionLetter}
                        </div>
                        <span className="flex-1 leading-relaxed">{option.text}</span>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Nav Controls */}
              <div className="pt-8 mt-6 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <button
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-40 transition flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleReview(currentQuestion.id)}
                    className="sm:hidden p-2 rounded-xl border border-slate-800 text-slate-400"
                  >
                    <Flag className="w-4 h-4" />
                  </button>

                  {currentIdx < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition flex items-center gap-1.5"
                    >
                      <span>Save & Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-md transition flex items-center gap-1.5"
                    >
                      <span>Review & Submit</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR: QUESTION PALETTE (Cols 9-12) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-[#090E1A] border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white tracking-tight">Question Palette</h3>
              <span className="text-[11px] font-mono text-cyan-400">Total: {questions.length}</span>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500" />
                <span>Review ({reviewCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
                <span>Pending ({unansweredCount})</span>
              </div>
            </div>

            {/* Question Buttons Grid */}
            <div className="grid grid-cols-5 gap-2.5 pt-2">
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
                  btnStyles += ' ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#090E1A] font-bold text-white';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-10 rounded-xl border text-xs font-mono font-semibold transition-all flex items-center justify-center relative cursor-pointer ${btnStyles}`}
                  >
                    <span>{idx + 1}</span>
                    {isReview && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Test Instructions Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
              <div className="text-slate-300 font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                Proctoring Protocol Active
              </div>
              <p>
                Answers are streamed to the evaluation cluster immediately. You may edit your selections at any time before final submission.
              </p>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full sm:hidden flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Assessment</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SUBMIT CONFIRMATION MODAL ── */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0A0F1D] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl text-slate-100">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Submit Examination?
              </h3>
              <p className="text-xs text-slate-300">
                {unansweredCount > 0
                  ? `You still have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Are you sure you want to finalize your submission?`
                  : 'All questions have been answered. Would you like to submit your answers for authoritative scoring?'}
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
                <span className="font-bold text-slate-300 text-sm">{unansweredCount}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px]">Flagged</span>
                <span className="font-bold text-amber-400 text-sm">{reviewCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 transition"
              >
                Review Answers
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={submitExamToServer}
                className="w-1/2 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-md shadow-cyan-500/20 disabled:opacity-50 transition"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Grading...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
