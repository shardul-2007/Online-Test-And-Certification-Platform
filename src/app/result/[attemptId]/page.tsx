'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  ShieldCheck,
  Mail,
  ArrowRight,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  Loader2,
  Share2,
  AlertCircle,
} from 'lucide-react';

interface ResultData {
  attemptId: string;
  participantName: string;
  participantEmail: string;
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

export default function ResultPage({ params }: { params: { attemptId: string } }) {
  const attemptId = params.attemptId;
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadResult() {
      try {
        setLoading(true);
        // Call submit endpoint which acts authoritatively and returns the completed attempt
        const res = await fetch('/api/test/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attemptId }),
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to retrieve assessment evaluation');
        }

        const resData = data.result || {
          attemptId: data.attempt.id,
          participantName: data.attempt.user?.name || 'Participant',
          participantEmail: data.attempt.user?.email || '',
          testTitle: data.attempt.test?.title || 'Assessment',
          passingPercentage: data.attempt.test?.passingPercentage || 60,
          totalQuestions: data.attempt.totalQuestions,
          correctAnswers: data.attempt.correctAnswers,
          incorrectAnswers: data.attempt.incorrectAnswers,
          unanswered: data.attempt.unanswered,
          score: data.attempt.score,
          maxScore: data.attempt.maxScore,
          percentage: data.attempt.percentage,
          isPassed: data.attempt.isPassed,
          certificate: data.certificate,
          emailStatus: { success: true, status: 'DELIVERED' },
          questionReviews: [],
        };

        setResult(resData);

        // Trigger celebratory confetti on passing
        if (resData.isPassed) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00F5C8', '#F5D061', '#38BDF8', '#FFFFFF'],
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

  const handleDownloadPdf = async (certId: string) => {
    try {
      setDownloading(true);
      const url = `/api/certificates/${certId}/download`;
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
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-medium text-slate-300">Calculating authoritative score & verifying criteria...</p>
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

  const cert = result.certificate;

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ── STATUS BANNER ── */}
        <div
          className={`p-6 sm:p-8 rounded-2xl border backdrop-blur-md relative overflow-hidden ${
            result.isPassed
              ? 'bg-gradient-to-r from-emerald-950/40 via-cyan-950/40 to-slate-900/60 border-cyan-500/30'
              : 'bg-gradient-to-r from-rose-950/40 via-slate-900/60 to-slate-900/60 border-rose-500/30'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {result.isPassed ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> PASSED ASSESSMENT
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" /> CRITERIA NOT MET
                  </span>
                )}
                <span className="text-xs text-slate-400">Official Evaluation</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {result.isPassed
                  ? `Congratulations, ${result.participantName}!`
                  : `Assessment Completed, ${result.participantName}`}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                {result.isPassed
                  ? `You have achieved a passing score on ${result.testTitle}. Your accredited digital certificate has been generated and issued.`
                  : `Your score of ${result.percentage}% is below the mandatory passing requirement (${result.passingPercentage}%). Review the question analysis below to improve your skills.`}
              </p>
            </div>

            {/* Score Ring / Pill */}
            <div className="shrink-0 text-center sm:text-right">
              <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-mono">
                {result.percentage}%
              </div>
              <div className="text-xs font-medium text-slate-400 mt-1">
                Score: {result.score} / {result.maxScore} marks
              </div>
            </div>
          </div>
        </div>

        {/* ── METRICS SUMMARY CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400">Total Questions</span>
            <div className="text-2xl font-bold text-white mt-1">{result.totalQuestions}</div>
            <span className="text-[10px] text-slate-500">Evaluated server-side</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-medium text-emerald-400">Correct Answers</span>
            <div className="text-2xl font-bold text-emerald-300 mt-1">{result.correctAnswers}</div>
            <span className="text-[10px] text-slate-500">+{result.correctAnswers} points awarded</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-medium text-rose-400">Incorrect Answers</span>
            <div className="text-2xl font-bold text-rose-300 mt-1">{result.incorrectAnswers}</div>
            <span className="text-[10px] text-slate-500">Zero penalty deduction</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-medium text-amber-400">Required Passing</span>
            <div className="text-2xl font-bold text-amber-300 mt-1">{result.passingPercentage}%</div>
            <span className="text-[10px] text-slate-500">Minimum threshold</span>
          </div>
        </div>

        {/* ── CERTIFICATE ACTION CARD (IF PASSED) ── */}
        {result.isPassed && cert && (
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#0D1528] to-[#070B14] border border-cyan-500/30 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400">
                    Official Certificate Generated
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">Certificate Credentials Ready</h3>
                <p className="text-xs text-slate-400">
                  Unique Certificate ID:{' '}
                  <span className="font-mono text-cyan-300 font-bold">{cert.certificateId}</span>
                </p>
              </div>

              {/* Email Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>Email Dispatched to {result.participantEmail}</span>
              </div>
            </div>

            {/* LIVE DIGITAL CERTIFICATE VISUAL PREVIEW */}
            <div className="p-6 sm:p-8 rounded-xl bg-[#050810] border-2 border-amber-500/40 relative shadow-inner text-center space-y-4 overflow-hidden">
              {/* Corner Watermarks */}
              <div className="absolute top-2 left-2 text-amber-400/30 font-serif text-lg">❖</div>
              <div className="absolute top-2 right-2 text-amber-400/30 font-serif text-lg">❖</div>
              <div className="absolute bottom-2 left-2 text-amber-400/30 font-serif text-lg">❖</div>
              <div className="absolute bottom-2 right-2 text-amber-400/30 font-serif text-lg">❖</div>

              <div className="space-y-1">
                <div className="text-[11px] font-mono tracking-widest text-amber-400 uppercase">
                  SkillCert Global Institute
                </div>
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  International Accreditation Board
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
                Certificate of Achievement
              </h2>

              <p className="text-xs font-serif italic text-slate-400">This certifies that</p>

              <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-200 tracking-tight">
                {result.participantName}
              </div>

              <p className="text-xs text-slate-300 max-w-md mx-auto">
                has successfully passed the accredited professional examination in{' '}
                <strong className="text-white">{result.testTitle}</strong> with a score of{' '}
                <strong className="text-cyan-400">{result.percentage}%</strong>.
              </p>

              <div className="pt-4 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800 max-w-lg mx-auto">
                <div>
                  <span className="block text-[9px] text-slate-500 uppercase">Certificate ID</span>
                  <span className="text-cyan-300 font-bold">{cert.certificateId}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-500 uppercase">Conferred Date</span>
                  <span>{new Date(cert.issueDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-500 uppercase">Verification Status</span>
                  <span className="text-emerald-400 font-semibold">✓ Verified Authenticated</span>
                </div>
              </div>
            </div>

            {/* CTAs for Certificate */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => handleDownloadPdf(cert.certificateId)}
                disabled={downloading}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Certificate (PDF)</span>
                  </>
                )}
              </button>

              <Link
                href={`/verify/${cert.certificateId}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm text-slate-200 hover:text-white bg-slate-900 border border-slate-700/80 hover:bg-slate-800 transition"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Verify Credential Online</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </Link>
            </div>
          </div>
        )}

        {/* ── RETAKE CARD (IF FAILED) ── */}
        {!result.isPassed && (
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
            <h3 className="text-lg font-bold text-white">Need to Retake the Test?</h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              Our certification platform allows candidates to study the provided explanations and retake the assessment when ready.
            </p>
            <Link
              href="/#tests"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Assessment</span>
            </Link>
          </div>
        )}

        {/* ── QUESTION-BY-QUESTION REVIEW ACCORDION ── */}
        {result.questionReviews && result.questionReviews.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight">Question Analysis & Explanations</h3>
              <button
                onClick={() => setShowReview(!showReview)}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>{showReview ? 'Collapse Review' : 'Expand All Explanations'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showReview ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showReview && (
              <div className="space-y-4 animate-fade-in">
                {result.questionReviews.map((q, idx) => (
                  <div
                    key={q.questionId}
                    className={`p-5 rounded-xl border text-xs space-y-3 ${
                      q.isCorrect
                        ? 'bg-slate-900/60 border-emerald-500/30'
                        : 'bg-slate-900/60 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          Question {idx + 1} • {q.category}
                        </span>
                        <h4 className="text-sm font-semibold text-white pt-1">{q.text}</h4>
                      </div>
                      <div>
                        {q.isCorrect ? (
                          <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Correct
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-rose-950 text-rose-300 text-[10px] font-semibold flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-400" /> Incorrect
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Options list */}
                    <div className="space-y-1.5 pt-1">
                      {q.options.map((opt) => {
                        const isChosen = q.selectedOptionId === opt.id;
                        const isRight = opt.isCorrect;

                        let optClass = 'bg-slate-950/60 border-slate-800 text-slate-400';
                        if (isRight) {
                          optClass = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-medium';
                        } else if (isChosen && !isRight) {
                          optClass = 'bg-rose-950/40 border-rose-500/60 text-rose-200 line-through';
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-lg border flex items-center justify-between ${optClass}`}
                          >
                            <span>{opt.text}</span>
                            {isRight && <span className="text-[10px] text-emerald-400 font-bold">✓ Correct Answer</span>}
                            {isChosen && !isRight && <span className="text-[10px] text-rose-400">Your Choice</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 rounded-lg bg-[#070B14] border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
                        <strong className="text-cyan-400 block mb-0.5">Explanation:</strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Back Link */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition"
          >
            <span>Return to SkillCert Homepage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
