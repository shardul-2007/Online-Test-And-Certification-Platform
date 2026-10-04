'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileText,
  Mail,
  Zap,
  ChevronDown,
  Search,
  ExternalLink,
  Code2,
  Terminal,
  Cpu,
} from 'lucide-react';
import TestRegisterModal from '@/components/TestRegisterModal';

export default function LandingPage() {
  const router = useRouter();
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [verifyIdInput, setVerifyIdInput] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    fetch('/api/tests')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.tests?.length > 0) {
          setTests(data.tests);
          setSelectedTest(data.tests[0]);
        }
      })
      .catch((err) => console.error('Failed to load tests:', err));
  }, []);

  const handleStartTest = (test?: any) => {
    if (test) {
      setSelectedTest(test);
    }
    setIsRegisterOpen(true);
  };

  const handleQuickVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyIdInput.trim()) {
      router.push(`/verify/${verifyIdInput.trim().toUpperCase()}`);
    }
  };

  const faqs = [
    {
      q: 'How does the automatic certificate generation work?',
      a: 'Upon submitting your assessment, your responses are evaluated against authoritative criteria on our secure server. If your percentage meets or exceeds the required threshold (60%), a high-resolution, cryptographically signed PDF certificate is generated instantly and dispatched to your email address.',
    },
    {
      q: 'Is the certificate verifiable by employers or academic institutions?',
      a: 'Yes. Every issued certificate receives an unalterable Certificate ID (e.g., CERT-2026-8F42K9) and embedded QR code. Anyone can verify its authenticity 24/7 on our public verification portal without needing to log in.',
    },
    {
      q: 'What happens if I do not pass the assessment on my first try?',
      a: 'If you score below the passing criteria, you will receive a comprehensive breakdown of your results along with explanations for each question so you can study and bridge knowledge gaps. No certificate is issued for unsuccessful attempts, but you are welcome to retake the test.',
    },
    {
      q: 'What are the examination anti-cheating protections?',
      a: 'The testing environment includes browser tab visibility tracking, background blur detection, and auto-submission upon timer expiry. All evaluation logic is strictly executed on the server, guaranteeing that answers and marks cannot be inspected or altered in the client browser.',
    },
    {
      q: 'Can an organization customize assessments and passing criteria?',
      a: 'Administrators have full control via the secure Admin Dashboard to create custom tests, configure durations, set custom passing thresholds, add MCQ/True-False questions, view analytics, and resend certificate emails at any time.',
    },
  ];

  const demoTest = tests[0] || {
    id: 'test-web-dev-1',
    title: 'Web Development Fundamentals Assessment',
    durationMinutes: 20,
    passingPercentage: 60,
    questionCount: 10,
    description:
      'Comprehensive industry examination evaluating modern HTML5, CSS3, modern JavaScript (ES6+), React core concepts, Git workflow, and web performance standards.',
  };

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Subtle Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d12_1px,transparent_1px),linear-gradient(to_bottom,#1f293d12_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-20 md:pt-28 md:pb-32 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[250px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Accreditation Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300 shadow-sm backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-medium text-slate-200">ISO/IEC Compliant Automated Certification Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
              Test. Prove.{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Get Certified.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Take the assessment, demonstrate your skills, and receive your verified certificate automatically.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => handleStartTest(demoTest)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-base text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Start Test</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <Link
                href="/verify"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-base text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/80 transition-all"
              >
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <span>Verify Certificate</span>
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-8 max-w-3xl mx-auto text-left">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold mb-1">
                  <Clock className="w-3.5 h-3.5" /> DURATION
                </div>
                <div className="text-xl font-bold text-white">20 Minutes</div>
                <div className="text-[11px] text-slate-400">Strict timed countdown</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold mb-1">
                  <FileText className="w-3.5 h-3.5" /> QUESTIONS
                </div>
                <div className="text-xl font-bold text-white">10 Questions</div>
                <div className="text-[11px] text-slate-400">MCQ & True / False</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
                  <Award className="w-3.5 h-3.5" /> PASS THRESHOLD
                </div>
                <div className="text-xl font-bold text-white">60% Required</div>
                <div className="text-[11px] text-slate-400">Calculated server-side</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
                  <Mail className="w-3.5 h-3.5" /> DISPATCH
                </div>
                <div className="text-xl font-bold text-white">Instant Email</div>
                <div className="text-[11px] text-slate-400">With PDF certificate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED ASSESSMENT CARD */}
      <section id="tests" className="py-12 md:py-20 border-t border-slate-900 bg-slate-950/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-widest mb-2">
              ACCREDITED EVALUATION
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Featured Assessment
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Test your engineering fundamentals with real industry-standard questions and get credentialed immediately.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-b from-[#0D1527] to-[#070B14] border border-cyan-500/20 shadow-xl shadow-cyan-950/20 relative overflow-hidden group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
                      LIVE TEST ACTIVE
                    </span>
                    <span className="text-xs text-slate-400 font-mono">CODE: CERT-WDF-2026</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    {demoTest.title}
                  </h3>
                  <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                    {demoTest.description}
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleStartTest(demoTest)}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    <span>Begin Assessment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Syllabus Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-6 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                  <Code2 className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <span className="font-semibold text-slate-200">HTML5</span>
                  <p className="text-[10px] text-slate-500">Semantics & A11y</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                  <Sparkles className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <span className="font-semibold text-slate-200">CSS3</span>
                  <p className="text-[10px] text-slate-500">Flexbox & Box-Model</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                  <Terminal className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <span className="font-semibold text-slate-200">JavaScript</span>
                  <p className="text-[10px] text-slate-500">Event Loop & Scope</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                  <Cpu className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                  <span className="font-semibold text-slate-200">React</span>
                  <p className="text-[10px] text-slate-500">State & Lifecycle</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                  <Zap className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                  <span className="font-semibold text-slate-200">Git</span>
                  <p className="text-[10px] text-slate-500">Branching & Merge</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                  <ShieldCheck className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                  <span className="font-semibold text-slate-200">HTTP / Web</span>
                  <p className="text-[10px] text-slate-500">Auth & Protocols</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-16 md:py-24 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-widest mb-2">
              STANDARDIZED WORKFLOW
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              How the Certification Works
            </p>
            <p className="text-sm text-slate-400 mt-2">
              From enrollment to certificate delivery, an automated, secure, and verifiable credentialing pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition relative">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 font-mono font-bold text-base mb-4">
                01
              </div>
              <h4 className="text-base font-bold text-white mb-2">Quick Enrollment</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Provide your full legal name and email address. Our system sets up an isolated, secure examination session.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition relative">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 font-mono font-bold text-base mb-4">
                02
              </div>
              <h4 className="text-base font-bold text-white mb-2">Distraction-Free Test</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Answer MCQ and True/False questions within the 20-minute timer. Answers save automatically to the server as you select them.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition relative">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 font-mono font-bold text-base mb-4">
                03
              </div>
              <h4 className="text-base font-bold text-white mb-2">Authoritative Evaluation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scoring is computed authoritatively on our server. If you pass (&ge; 60%), your personalized certificate is generated immediately.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition relative">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 font-mono font-bold text-base mb-4">
                04
              </div>
              <h4 className="text-base font-bold text-white mb-2">PDF & Email Dispatch</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download your official PDF certificate instantly and receive an automated transactional email with verification links.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK VERIFICATION SECTION */}
      <section className="py-16 bg-[#080D1A] border-y border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Instant Credential Verification
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Received a certificate from a candidate? Enter the unique Certificate ID below to inspect its cryptographic validity.
            </p>
          </div>

          <form onSubmit={handleQuickVerify} className="max-w-lg mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={verifyIdInput}
                onChange={(e) => setVerifyIdInput(e.target.value)}
                placeholder="e.g. CERT-2026-8F42K9"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-md shadow-cyan-500/20 transition cursor-pointer"
            >
              Verify
            </button>
          </form>

          <p className="text-xs text-slate-500">
            Try sample verified certificate:{' '}
            <Link
              href="/verify/CERT-2026-8F42K9"
              className="text-cyan-400 hover:underline font-mono inline-flex items-center gap-1"
            >
              CERT-2026-8F42K9 <ExternalLink className="w-3 h-3" />
            </Link>
          </p>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-widest mb-2">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Everything You Need to Know
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-slate-900/60 border border-slate-800/80 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 text-sm font-semibold text-slate-200 hover:text-white transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-cyan-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* REGISTRATION MODAL */}
      {selectedTest && (
        <TestRegisterModal
          test={selectedTest}
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
        />
      )}
    </div>
  );
}
