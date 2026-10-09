'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Lock,
  Cpu,
  Layers,
  BookOpen,
  User,
} from 'lucide-react';
import TestRegisterModal from '@/components/TestRegisterModal';

export default function LandingPage() {
  const router = useRouter();
  const [test, setTest] = useState<any | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [verifyIdInput, setVerifyIdInput] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    fetch('/api/tests')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.tests?.length > 0) {
          setTest(data.tests[0]);
        }
      })
      .catch((err) => console.error('Failed to load tests:', err));
  }, []);

  const handleStartTest = () => {
    setIsRegisterOpen(true);
  };

  // Listen for start test event from navbar
  useEffect(() => {
    const handleStartTestEvent = () => {
      setIsRegisterOpen(true);
    };
    
    window.addEventListener('start-test-modal', handleStartTestEvent);
    return () => window.removeEventListener('start-test-modal', handleStartTestEvent);
  }, []);

  const handleQuickVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyIdInput.trim()) {
      router.push(`/verify/${verifyIdInput.trim().toUpperCase()}`);
    }
  };

  const fdpTest = test || {
    id: 'test-fdp-2026',
    title: 'Faculty Development Programme (FDP) Assessment',
    durationMinutes: 45,
    passingPercentage: 0,
    questionCount: 25,
    description:
      'Official Assessment for Faculty Development Programme on "Recent advances in cyber security and blockchain for secure digital transformation" organized by Department of Information Technology, Nutan Maharashtra Institute of Engineering & Technology (NMIET) in association with ISTE held on 5th to 9th Oct, 2026.',
  };

  const faqs = [
    {
      q: 'Who receives the Certificate of Participation?',
      a: 'Every participant who completes and submits the 25 compulsory questions will receive the official accredited Certificate of Participation. The certificate is not restricted by pass/fail criteria—participation in the assessment qualifies every attendee for certification.',
    },
    {
      q: 'How does the automatic certificate generation and email delivery work?',
      a: 'Upon submitting your assessment, the system immediately binds your full legal name and college/organization onto the high-resolution official NMIET & ISTE certificate template. The cryptographically signed PDF certificate is automatically generated, made available for 1-click download, and dispatched directly to your registered email address.',
    },
    {
      q: 'Are all 25 questions compulsory?',
      a: 'Yes. All 25 questions across Section A (Cyber Security, Q1-Q20) and Section B (Blockchain, Q21-Q25) are compulsory. Each question carries 1 mark (Total 25 marks).',
    },
    {
      q: 'How can academic institutions or employers verify my certificate?',
      a: 'Every issued certificate contains an unalterable Certificate ID (e.g., CERT-2026-FDP-8F42K9) and embedded QR code. Anyone can verify its authenticity 24/7 on our public verification portal (/verify) without needing to log in.',
    },
    {
      q: 'What proctoring measures are in place during the assessment?',
      a: 'The test room includes tab visibility detection, background blur monitoring, and countdown timer synchronization. Responses are automatically saved to our server in real time so your progress is never lost.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 selection:bg-amber-400 selection:text-slate-950">
      {/* Subtle Background Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d12_1px,transparent_1px),linear-gradient(to_bottom,#1f293d12_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* ── HERO SECTION ── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          {/* Programme pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Faculty Development Programme (FDP) Assessment</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
            Recent advances in cyber security &amp; blockchain for secure digital transformation
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
            Organized by the <strong className="text-white">Department of Information Technology</strong>,{' '}
            <strong className="text-amber-300">Nutan Maharashtra Institute of Engineering and Technology (NMIET)</strong> in association with{' '}
            <strong className="text-white">Indian Society for Technical Education (ISTE)</strong> held on 5th to 9th Oct, 2026.
          </p>

          {/* Highlights Banner */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 text-white font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 25 Questions (All Compulsory)
            </span>
            <span className="flex items-center gap-1.5 text-white font-medium">
              <Clock className="w-4 h-4 text-amber-400" /> 45 Minutes Duration
            </span>
            <span className="flex items-center gap-1.5 text-white font-medium">
              <Award className="w-4 h-4 text-amber-400" /> Certificate of Participation for All
            </span>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStartTest}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 shadow-xl shadow-amber-500/25 transition cursor-pointer"
            >
              <span>Start FDP Assessment Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href="/verify"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl font-semibold text-sm text-slate-200 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Verify Existing Certificate</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── OFFICIAL CERTIFICATE SHOWCASE SECTION ── */}
      <section className="py-16 bg-[#070B16] border-y border-slate-800/80 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 mb-10">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/20 uppercase tracking-wider">
              Accredited Credential
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Official Certificate of Participation
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              Every participant who completes the 25 compulsory questions will automatically receive this personalized certificate delivered directly to their email address.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual Certificate Card */}
            <div className="lg:col-span-7 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-white relative">
              <div className="relative w-full aspect-[1024/707]">
                <Image
                  src="/certificate-template-clean.jpg"
                  alt="NMIET ISTE Certificate of Participation Template"
                  fill
                  className="object-cover"
                  priority
                />

                {/* Dynamic Demo Name Stamp */}
                <div
                  className="absolute inset-x-0 flex items-center justify-center font-serif font-bold text-slate-900 tracking-wide select-none"
                  style={{
                    top: '43.5%',
                    fontSize: 'clamp(14px, 2.2vw, 22px)',
                  }}
                >
                  YOUR FULL NAME
                </div>

                {/* Dynamic Demo Institute Stamp */}
                <div
                  className="absolute font-sans font-semibold text-slate-900 select-none line-clamp-1"
                  style={{
                    top: '55.2%',
                    left: '20%',
                    right: '12%',
                    fontSize: 'clamp(9px, 1.2vw, 13px)',
                  }}
                >
                  YOUR INSTITUTE / COLLEGE NAME
                </div>

                {/* Watermark Tag */}
                <div className="absolute bottom-2 left-3 font-mono font-bold text-[9px] text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-slate-300">
                  Unique ID &amp; QR Code Included · Official NMIET &amp; ISTE
                </div>
              </div>
            </div>

            {/* Certificate Features */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <User className="w-4 h-4" /> Personalized with Your Name
                </div>
                <p className="text-xs text-slate-400">
                  Your full name is printed in crisp serif typography directly on the official participation line.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Mail className="w-4 h-4" /> Direct Automatic Email Dispatch
                </div>
                <p className="text-xs text-slate-400">
                  Immediately upon submitting your assessment, the generated PDF certificate is sent straight to your email inbox.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" /> Publicly Verifiable 24/7
                </div>
                <p className="text-xs text-slate-400">
                  Includes a unique Certificate ID and QR code verifiable by academic institutions and employers worldwide.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Award className="w-4 h-4" /> Authorized Institutional Signatures
                </div>
                <p className="text-xs text-slate-400">
                  Includes authorized sign-offs from FDP Coordinators, HOD (IT), and Director, NMIET.
                </p>
              </div>

              <button
                onClick={handleStartTest}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <span>Take Assessment to Receive Certificate</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 SECTIONS OVERVIEW ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">Assessment Syllabus</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              25 Compulsory MCQs across 2 Core Domains
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Every section carries 1 mark per question. Complete all 25 questions to trigger your Certificate of Participation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">Section A</span>
                <h3 className="text-lg font-bold text-white">Cyber Security</h3>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <p><strong>20 Questions (Q1 - Q20)</strong></p>
                <p>Covers CIA Triad, Phishing, DDoS, Hashing, Zero Trust, MFA, Firewalls, and HTTPS protocols.</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Layers className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">Section B</span>
                <h3 className="text-lg font-bold text-white">Blockchain</h3>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <p><strong>5 Questions (Q21 - Q25)</strong></p>
                <p>Covers Distributed Ledgers, Cryptographic Hashes, Proof of Work consensus, and Blockchain immutability.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* ── HOW IT WORKS IN 4 STEPS ── */}
      <section className="py-16 bg-[#080C18] border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">Simple Process</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="text-xs font-mono text-amber-400 font-bold">STEP 01</div>
              <h4 className="font-bold text-white text-sm">Register</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your Full Name, Email, and College/Organization Name.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="text-xs font-mono text-amber-400 font-bold">STEP 02</div>
              <h4 className="font-bold text-white text-sm">Take Test</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Complete the 25 compulsory questions across the 2 sections in 45 minutes.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="text-xs font-mono text-amber-400 font-bold">STEP 03</div>
              <h4 className="font-bold text-white text-sm">Submit</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Confirm your submission. Our server securely records and scores your answers.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="text-xs font-mono text-amber-400 font-bold">STEP 04</div>
              <h4 className="font-bold text-white text-sm">Get Certificate</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your Certificate of Participation is generated, emailed to you, and ready for instant download!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ACCORDION ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">FAQ</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold text-white hover:text-amber-300 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUICK VERIFY FOOTER SEARCH ── */}
      <section className="py-12 bg-[#080C18] border-t border-slate-800/80">
        <div className="max-w-xl mx-auto px-4 text-center space-y-4">
          <h3 className="text-base font-bold text-white">Have a Certificate ID to Verify?</h3>
          <p className="text-xs text-slate-400">
            Verify any issued Certificate of Participation instantly on our public registry.
          </p>
          <form onSubmit={handleQuickVerify} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. CERT-2026-FDP-8F42K9"
              value={verifyIdInput}
              onChange={(e) => setVerifyIdInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-amber-400 hover:bg-amber-300 transition cursor-pointer"
            >
              Verify
            </button>
          </form>
        </div>
      </section>

      {/* Registration & Exam Launch Modal */}
      <TestRegisterModal
        test={fdpTest}
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
    </div>
  );
}
