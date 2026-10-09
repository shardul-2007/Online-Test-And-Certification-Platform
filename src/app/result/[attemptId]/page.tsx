'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  Clock,
  Download,
  ShieldCheck,
  Mail,
  ArrowRight,
  ExternalLink,
  Loader2,
  AlertCircle,
  Building,
  Layers,
  ChevronDown,
  MessageSquare,
  Sparkles,
  HelpCircle,
  Send,
  User,
} from 'lucide-react';

interface ResultData {
  attemptId: string;
  participantName: string;
  participantEmail: string;
  participantOrganization?: string | null;
  testTitle: string;
  passingPercentage: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  score: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  certificate?: {
    id: string;
    certificateId: string;
    issueDate: string;
    verificationUrl: string;
    participantName?: string;
    participantOrganization?: string | null;
  } | null;
  emailStatus?: {
    success: boolean;
    status: string;
  } | null;
  questionReviews?: Array<{
    questionId: string;
    text: string;
    category: string;
    marks: number;
    selectedOptionId: string | null;
    correctOptionId: string | null;
    isCorrect: boolean;
    isUnanswered: boolean;
    explanation?: string | null;
    options: Array<{ id: string; text: string; isCorrect: boolean }>;
  }>;
}

const RATING_OPTIONS = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function ResultPage({ params }: { params: { attemptId: string } }) {
  const attemptId = params.attemptId;
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Email state
  const [customEmail, setCustomEmail] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState<string | null>(null);
  const [emailSentError, setEmailSentError] = useState<string | null>(null);

  // Feedback gating states
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState<boolean>(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<boolean>(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // 5 Mandatory Feedback Question States
  const [relevance, setRelevance] = useState('');
  const [explanationClarity, setExplanationClarity] = useState('');
  const [usefulnessOfExamples, setUsefulnessOfExamples] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [futureTopics, setFutureTopics] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadResult() {
      try {
        setLoading(true);

        // Fetch candidate details stored in localStorage
        let candidateLocal: any = null;
        try {
          const item = localStorage.getItem('certipulse_candidate');
          if (item) candidateLocal = JSON.parse(item);
        } catch {}

        const submitPayload: any = { attemptId };
        if (candidateLocal?.name && candidateLocal.name !== 'FDP Participant') {
          submitPayload.participantName = candidateLocal.name;
        }
        if (candidateLocal?.email && !candidateLocal.email.startsWith('participant-')) {
          submitPayload.participantEmail = candidateLocal.email;
        }
        if (candidateLocal?.organization) {
          submitPayload.participantOrganization = candidateLocal.organization;
        }

        // Call submit endpoint which evaluates authoritatively and returns the result
        const res = await fetch('/api/test/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitPayload),
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to retrieve assessment evaluation');
        }

        const resData: ResultData = data.result || {
          attemptId: data.attempt.id,
          participantName: data.attempt.user?.name || 'Participant',
          participantEmail: data.attempt.user?.email || '',
          participantOrganization: data.attempt.user?.organization || null,
          testTitle: data.attempt.test?.title || 'FDP Assessment',
          passingPercentage: 0,
          totalQuestions: data.attempt.totalQuestions || 50,
          correctAnswers: data.attempt.correctAnswers || 0,
          incorrectAnswers: data.attempt.incorrectAnswers || 0,
          unanswered: data.attempt.unanswered || 0,
          score: data.attempt.score || 0,
          maxScore: data.attempt.maxScore || 50,
          percentage: data.attempt.percentage || 0,
          isPassed: true,
          certificate: data.certificate,
          emailStatus: { success: true, status: 'DELIVERED' },
          questionReviews: [],
        };

        // Guarantee authentic participant name from localStorage if server has dummy default
        if (
          candidateLocal?.name &&
          (!resData.participantName || resData.participantName === 'FDP Participant' || resData.participantName === 'Participant')
        ) {
          resData.participantName = candidateLocal.name;
          if (resData.certificate) {
            resData.certificate.participantName = candidateLocal.name;
          }
        }

        if (
          candidateLocal?.email &&
          (!resData.participantEmail || resData.participantEmail.startsWith('participant-'))
        ) {
          resData.participantEmail = candidateLocal.email;
        }

        if (candidateLocal?.organization && !resData.participantOrganization) {
          resData.participantOrganization = candidateLocal.organization;
        }

        setResult(resData);
        setCustomEmail(resData.participantEmail || candidateLocal?.email || '');

        // Check if feedback was already submitted for this attempt
        let feedbackAlreadyDone = false;
        try {
          if (typeof window !== 'undefined') {
            const localFb = localStorage.getItem(`certipulse_feedback_${attemptId}`);
            if (localFb === 'true') {
              feedbackAlreadyDone = true;
            }
          }
        } catch {}

        try {
          const fbRes = await fetch(`/api/feedback?attemptId=${attemptId}`);
          const fbData = await fbRes.json();
          if (fbData.success && fbData.hasFeedback) {
            feedbackAlreadyDone = true;
          }
        } catch {}

        setHasSubmittedFeedback(feedbackAlreadyDone);

        // Only fire confetti if certificate is already unlocked!
        if (feedbackAlreadyDone) {
          confetti({
            particleCount: 110,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#F5D061', '#EAB308', '#00F5C8', '#FFFFFF', '#38BDF8'],
          });
        }
      } catch (err: any) {
        console.error('Error loading result:', err);
        setError(err.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [attemptId]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);

    // Validate All 5 Mandatory Questions
    const errors: Record<string, string> = {};
    if (!relevance) {
      errors.relevance = "Please rate today's session relevance to your academic/professional requirements.";
    }
    if (!explanationClarity) {
      errors.explanationClarity = 'Please rate how clearly the resource person explained the concepts.';
    }
    if (!usefulnessOfExamples) {
      errors.usefulnessOfExamples = 'Please rate the usefulness of examples, demonstrations, and case studies.';
    }
    if (!suggestions.trim()) {
      errors.suggestions = 'Please provide your suggestions for improving future Faculty Development Programs.';
    }
    if (!futureTopics.trim()) {
      errors.futureTopics = 'Please specify topics or activities you would like to learn in the future.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setFeedbackSubmitting(true);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          relevance,
          explanationClarity,
          usefulnessOfExamples,
          suggestions: suggestions.trim(),
          futureTopics: futureTopics.trim(),
          participantName: result?.participantName,
          participantEmail: result?.participantEmail,
          participantOrganization: result?.participantOrganization,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(`certipulse_feedback_${attemptId}`, 'true');
      }

      setHasSubmittedFeedback(true);

      // Trigger celebratory confetti upon unlocking certificate!
      confetti({
        particleCount: 120,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#F5D061', '#EAB308', '#00F5C8', '#FFFFFF', '#38BDF8'],
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setFeedbackError(err.message || 'Error recording feedback. Please check your connection and retry.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result?.certificate?.certificateId || !customEmail.trim()) return;

    setEmailSending(true);
    setEmailSentSuccess(null);
    setEmailSentError(null);

    try {
      const res = await fetch(`/api/certificates/${result.certificate.certificateId}/resend-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customEmail.trim(),
          name: result.participantName,
          organization: result.participantOrganization,
          score: result.score,
          maxScore: result.maxScore || 50,
          percentage: result.percentage,
          testTitle: result.testTitle,
          attemptId: result.attemptId || attemptId,
          issueDate: result.certificate.issueDate,
        }),
      });

      const data = await res.json();
      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      if (data.emailStatus?.status === 'SIMULATED') {
        setEmailSentSuccess(`Notice: PDF certificate delivery recorded for ${customEmail.trim()}. (To send live emails to Google/Yahoo inboxes, add GMAIL_USER & GMAIL_APP_PASSWORD in Vercel Environment Variables)`);
      } else {
        setEmailSentSuccess(`✓ Official PDF Certificate successfully dispatched to ${customEmail.trim()}! Please check your inbox & spam folder.`);
      }
    } catch (err: any) {
      setEmailSentError(err.message || 'Failed to dispatch email.');
    } finally {
      setEmailSending(false);
    }
  };

  const handleDownloadPdf = async (certId: string) => {
    try {
      setDownloading(true);
      const qParams = new URLSearchParams({
        name: result?.participantName || '',
        org: result?.participantOrganization || '',
        score: String(result?.score || 0),
        maxScore: String(result?.maxScore || 50),
        pct: String(result?.percentage || 0),
      });
      const url = `/api/certificates/${certId}/download?${qParams.toString()}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = `${certId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setDownloading(false), 1500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060810] flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-sm font-medium text-slate-300">
          Evaluating FDP responses &amp; processing session records...
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#060810] flex flex-col items-center justify-center p-4 text-white">
        <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-red-800 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold">Evaluation Lookup Failed</h2>
          <p className="text-xs text-slate-400">{error || 'Unable to locate attempt evaluation.'}</p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW A: MANDATORY FEEDBACK FORM (Shown until feedback is submitted!)
  // ───────────────────────────────────────────────────────────────────────────
  if (!hasSubmittedFeedback) {
    return (
      <div className="min-h-screen bg-[#06080F] text-slate-100 py-10 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          {/* Header Banner */}
          <div className="p-6 sm:p-8 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-slate-900/90 backdrop-blur-md shadow-2xl relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> MANDATORY FEEDBACK REQUIRED
                </span>
                <span className="text-xs text-slate-400">Step 2 of 2 · Certificate Access</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Faculty Development Programme Feedback
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Thank you, <strong className="text-white">{result.participantName}</strong>! Your 50 assessment questions have been successfully evaluated.
                Please complete the mandatory 5 feedback questions below regarding the FDP on{' '}
                <strong className="text-white">“Recent advances in cyber security and blockchain for secure digital transformation”</strong>.
                Your official <strong className="text-amber-300">Certificate of Participation</strong> will be unlocked immediately upon submitting this feedback.
              </p>
            </div>

            {/* Candidate & Assessment Mini-Summary Chip */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <User className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-white">{result.participantName}</span>
                {result.participantOrganization && (
                  <span className="text-slate-400">({result.participantOrganization})</span>
                )}
              </div>
              <div className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-amber-300 font-mono text-xs font-semibold">
                Score: {result.score} / {result.maxScore} ({result.percentage}%)
              </div>
            </div>
          </div>

          {/* Certificate Gated Notice */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
            <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Certificate of Participation Locked:</strong> Your official certificate credential has been prepared with ID{' '}
              <span className="font-mono font-bold text-amber-300">{result.certificate?.certificateId || 'CERT-NMIET-2026'}</span>.
              Completing this feedback is compulsory for issuing the certificate and will unlock high-resolution PDF download and email delivery.
            </p>
          </div>

          {/* Feedback Form Card */}
          <form onSubmit={handleFeedbackSubmit} className="p-6 sm:p-8 rounded-2xl bg-[#0D1528] border border-slate-800 shadow-2xl space-y-7">
            {feedbackError && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{feedbackError}</span>
              </div>
            )}

            {/* Question 1 */}
            <div className="space-y-3 p-5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <label className="block text-sm font-bold text-white">
                1. How relevant was today&apos;s session to your academic/professional requirements?{' '}
                <span className="text-amber-400 font-extrabold">*</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                {RATING_OPTIONS.map((opt) => {
                  const isSelected = relevance === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setRelevance(opt);
                        if (validationErrors.relevance) {
                          setValidationErrors((prev) => ({ ...prev, relevance: '' }));
                        }
                      }}
                      className={`py-3 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-slate-950 bg-slate-950' : 'border-slate-500'}`}>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {validationErrors.relevance && (
                <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {validationErrors.relevance}
                </p>
              )}
            </div>

            {/* Question 2 */}
            <div className="space-y-3 p-5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <label className="block text-sm font-bold text-white">
                2. How clearly did the resource person explain the concepts covered during the session?{' '}
                <span className="text-amber-400 font-extrabold">*</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                {RATING_OPTIONS.map((opt) => {
                  const isSelected = explanationClarity === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setExplanationClarity(opt);
                        if (validationErrors.explanationClarity) {
                          setValidationErrors((prev) => ({ ...prev, explanationClarity: '' }));
                        }
                      }}
                      className={`py-3 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-slate-950 bg-slate-950' : 'border-slate-500'}`}>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {validationErrors.explanationClarity && (
                <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {validationErrors.explanationClarity}
                </p>
              )}
            </div>

            {/* Question 3 */}
            <div className="space-y-3 p-5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <label className="block text-sm font-bold text-white">
                3. How useful were the examples, demonstrations, activities, or case studies presented during the session?{' '}
                <span className="text-amber-400 font-extrabold">*</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                {RATING_OPTIONS.map((opt) => {
                  const isSelected = usefulnessOfExamples === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setUsefulnessOfExamples(opt);
                        if (validationErrors.usefulnessOfExamples) {
                          setValidationErrors((prev) => ({ ...prev, usefulnessOfExamples: '' }));
                        }
                      }}
                      className={`py-3 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-slate-950 bg-slate-950' : 'border-slate-500'}`}>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {validationErrors.usefulnessOfExamples && (
                <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {validationErrors.usefulnessOfExamples}
                </p>
              )}
            </div>

            {/* Question 4 */}
            <div className="space-y-2 p-5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <label className="block text-sm font-bold text-white">
                4. What suggestions do you have for improving future Faculty Development Program?{' '}
                <span className="text-amber-400 font-extrabold">*</span>
              </label>

              <textarea
                rows={3}
                required
                value={suggestions}
                onChange={(e) => {
                  setSuggestions(e.target.value);
                  if (validationErrors.suggestions) {
                    setValidationErrors((prev) => ({ ...prev, suggestions: '' }));
                  }
                }}
                placeholder="Share your suggestions, recommendations, or feedback to improve upcoming FDP sessions..."
                className={`w-full p-3.5 rounded-xl bg-slate-900 border text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                  validationErrors.suggestions ? 'border-rose-500 focus:border-rose-400' : 'border-slate-700 focus:border-amber-400'
                }`}
              />

              {validationErrors.suggestions && (
                <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {validationErrors.suggestions}
                </p>
              )}
            </div>

            {/* Question 5 */}
            <div className="space-y-2 p-5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <label className="block text-sm font-bold text-white">
                5. What topics or activities would you like to learn in the future?{' '}
                <span className="text-amber-400 font-extrabold">*</span>
              </label>

              <textarea
                rows={3}
                required
                value={futureTopics}
                onChange={(e) => {
                  setFutureTopics(e.target.value);
                  if (validationErrors.futureTopics) {
                    setValidationErrors((prev) => ({ ...prev, futureTopics: '' }));
                  }
                }}
                placeholder="List any topics, technologies, tools, or hands-on activities you would like covered in future programs..."
                className={`w-full p-3.5 rounded-xl bg-slate-900 border text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                  validationErrors.futureTopics ? 'border-rose-500 focus:border-rose-400' : 'border-slate-700 focus:border-amber-400'
                }`}
              />

              {validationErrors.futureTopics && (
                <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {validationErrors.futureTopics}
                </p>
              )}
            </div>

            {/* Compulsory Requirement Disclaimer & Submit Button */}
            <div className="pt-2 space-y-3">
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">*</span> All 5 feedback questions are compulsory to unlock and receive your Certificate of Participation.
              </p>

              <button
                type="submit"
                disabled={feedbackSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 shadow-xl shadow-amber-500/25 transition cursor-pointer disabled:opacity-60"
              >
                {feedbackSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Feedback &amp; Unlocking Certificate...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Feedback &amp; Unlock Official Certificate</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW B: UNLOCKED CERTIFICATE & ASSESSMENT EVALUATION
  // ───────────────────────────────────────────────────────────────────────────
  const cert = result.certificate;

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ── STATUS BANNER ── */}
        <div className="p-6 sm:p-8 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-slate-900/80 backdrop-blur-md relative overflow-hidden shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> CERTIFICATE OF PARTICIPATION ISSUED
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-1">
                  ✓ Feedback Recorded
                </span>
                <span className="text-xs text-slate-400">NMIET &amp; ISTE FDP (5th - 9th Oct, 2026)</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Congratulations, {result.participantName}!
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                You have successfully completed the 50 compulsory questions for the Faculty Development Programme on{' '}
                <strong className="text-white">“Recent advances in cyber security and blockchain for secure digital transformation”</strong>{' '}
                and submitted your session feedback. Your official Certificate of Participation is generated below and has been sent to your email.
              </p>
            </div>

            {/* Score Ring */}
            <div className="shrink-0 text-center sm:text-right bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-300 font-mono">
                {result.score} / {result.maxScore}
              </div>
              <div className="text-xs font-semibold text-slate-300 mt-0.5">
                {result.percentage}% Correct
              </div>
              <div className="text-[10px] text-emerald-400 mt-1 font-mono uppercase tracking-wider">
                ✓ Certified Participant
              </div>
            </div>
          </div>
        </div>

        {/* ── METRICS SUMMARY CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400">Total Questions</span>
            <div className="text-2xl font-bold text-white mt-1">{result.totalQuestions}</div>
            <span className="text-[10px] text-slate-500">All Compulsory</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-medium text-emerald-400">Correct Answers</span>
            <div className="text-2xl font-bold text-emerald-300 mt-1">{result.correctAnswers}</div>
            <span className="text-[10px] text-slate-500">+{result.correctAnswers} marks scored</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-medium text-rose-400">Incorrect Answers</span>
            <div className="text-2xl font-bold text-rose-300 mt-1">{result.incorrectAnswers}</div>
            <span className="text-[10px] text-slate-500">No negative marking</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-medium text-amber-400">Certificate Status</span>
            <div className="text-2xl font-bold text-amber-300 mt-1">ISSUED</div>
            <span className="text-[10px] text-emerald-400">Participation Awarded</span>
          </div>
        </div>

        {/* ── OFFICIAL CERTIFICATE SHOWCASE ── */}
        {cert && (
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#0D1528] to-[#070B14] border border-amber-500/30 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400">
                    Official Certificate of Participation
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">Your Certificate is Ready</h3>
                <p className="text-xs text-slate-400">
                  Unique Certificate ID:{' '}
                  <span className="font-mono text-amber-300 font-bold">{cert.certificateId}</span>
                </p>
              </div>

              {/* Email Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>Dispatched directly to {result.participantEmail}</span>
              </div>
            </div>

            {/* LIVE DIGITAL CERTIFICATE VISUAL CARD (Using official template design) */}
            <div className="rounded-xl overflow-hidden border-2 border-amber-500/40 relative shadow-2xl bg-white text-slate-950">
              <div className="relative w-full aspect-[1024/707]">
                {/* Background image of the template */}
                <Image
                  src="/certificate-template-clean.jpg"
                  alt="NMIET & ISTE Certificate of Participation"
                  fill
                  className="object-cover"
                  priority
                />

                {/* Overlaid participant name right on top of the template line! */}
                <div
                  className="absolute inset-x-0 flex items-center justify-center font-serif font-bold text-slate-900 tracking-wide select-none"
                  style={{
                    top: '43.5%',
                    fontSize: 'clamp(14px, 2.5vw, 24px)',
                  }}
                >
                  {result.participantName}
                </div>

                {/* Overlaid organization name in center, matching name field font & size */}
                {result.participantOrganization && (
                  <div
                    className="absolute inset-x-0 flex items-center justify-center font-serif font-bold text-slate-900 tracking-wide select-none px-20 text-center line-clamp-1"
                    style={{
                      top: '52.0%',
                      fontSize: 'clamp(14px, 2.5vw, 24px)',
                    }}
                  >
                    {result.participantOrganization}
                  </div>
                )}

                {/* Certificate ID Watermark badge in bottom corner */}
                <div
                  className="absolute bottom-2 left-4 font-mono font-bold text-[9px] text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-slate-300 select-none"
                >
                  ID: {cert.certificateId} · Verified
                </div>
              </div>
            </div>

            {/* CTAs for Certificate */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => handleDownloadPdf(cert.certificateId)}
                disabled={downloading}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating High-Res PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Official Certificate (PDF)</span>
                  </>
                )}
              </button>

              <Link
                href={`/verify/${cert.certificateId}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm text-slate-200 hover:text-white bg-slate-900 border border-slate-700/80 hover:bg-slate-800 transition"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Verify Credential Online</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </Link>
            </div>

            {/* Interactive Email Delivery Card */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>Receive Certificate Directly via Email</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Instant Dispatch</span>
              </div>

              <form onSubmit={handleSendEmail} className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full sm:flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={emailSending}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {emailSending ? 'Dispatching PDF...' : 'Send Certificate to Email'}
                </button>
              </form>

              {emailSentSuccess && (
                <p className="text-xs text-emerald-400 font-medium">{emailSentSuccess}</p>
              )}
              {emailSentError && (
                <p className="text-xs text-rose-400 font-medium">{emailSentError}</p>
              )}
            </div>
          </div>
        )}

        {/* ── SECTION QUESTION REVIEWS & EXPLANATIONS ACCORDION ── */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Comprehensive 50 Questions Review &amp; Explanations
              </h3>
              <p className="text-xs text-slate-400">
                Detailed authoritative explanations for all 50 questions across Cyber Security, Blockchain, &amp; Digital Transformation.
              </p>
            </div>
            <button
              onClick={() => setShowReview(!showReview)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
            >
              <span>{showReview ? 'Hide Analysis' : 'Show Detailed Analysis'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showReview ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showReview && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              {result.questionReviews && result.questionReviews.length > 0 ? (
                result.questionReviews.map((q, idx) => (
                  <div
                    key={q.questionId}
                    className={`p-4 rounded-xl border text-xs space-y-3 ${
                      q.isCorrect
                        ? 'bg-emerald-950/20 border-emerald-800/40'
                        : 'bg-rose-950/20 border-rose-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-slate-300">
                        Q{idx + 1}. [{q.category}]
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                          q.isCorrect
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>

                    <p className="font-medium text-white text-sm">{q.text}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt) => {
                        const isUserChoice = q.selectedOptionId === opt.id;
                        const isCorrectOption = opt.isCorrect;

                        let optClass = 'bg-slate-900/60 border-slate-800 text-slate-400';
                        if (isCorrectOption) {
                          optClass = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold';
                        } else if (isUserChoice && !isCorrectOption) {
                          optClass = 'bg-rose-950/60 border-rose-500 text-rose-200';
                        }

                        return (
                          <div key={opt.id} className={`p-2.5 rounded-lg border flex items-center justify-between ${optClass}`}>
                            <span>{opt.text}</span>
                            {isCorrectOption && <span className="text-[10px] text-emerald-400 font-bold">✓ Answer</span>}
                            {isUserChoice && !isCorrectOption && <span className="text-[10px] text-rose-400 font-bold">Your Choice</span>}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                        <strong className="text-amber-300 block">Explanation:</strong>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">
                  All 50 questions evaluated server-side. Click above or check your email for the detailed summary.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-amber-400 transition inline-flex items-center gap-1.5"
          >
            ← Return to FDP Portal Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
