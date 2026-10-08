'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Clock, Award, ShieldAlert, ArrowRight, CheckCircle2, User, Mail, Building, Phone, Loader2 } from 'lucide-react';

interface TestRegisterModalProps {
  test: {
    id: string;
    title: string;
    durationMinutes: number;
    passingPercentage: number;
    questionCount?: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function TestRegisterModal({ test, isOpen, onClose }: TestRegisterModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'rules'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProceedToRules = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your full legal name (minimum 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Please provide a valid email address so your certificate can be sent directly to your inbox.');
      return;
    }

    if (!organization.trim() || organization.trim().length < 2) {
      setError('Please enter your College or Institute name (minimum 2 characters).');
      return;
    }

    setStep('rules');
  };

  const handleStartExam = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/test/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: test.id || 'test-fdp-2026',
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          organization: organization.trim() || null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to initialize assessment');
      }

      // Save to localStorage so candidate details are never lost across lambdas/refreshes
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'certipulse_candidate',
          JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            organization: organization.trim() || '',
          })
        );
      }

      const qParams = new URLSearchParams({
        name: name.trim(),
        email: email.trim(),
        org: organization.trim() || '',
      }).toString();

      // Route to exam room
      router.push(`/test/${data.attemptId}?${qParams}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while initializing test.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl my-auto max-h-[92vh] flex flex-col bg-[#090E1A] border border-slate-800 rounded-2xl shadow-2xl shadow-cyan-950/30 overflow-hidden text-slate-100">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800/80 bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
              {step === 'form' ? 'Step 1 of 2: Participant Registration' : 'Step 2 of 2: Examination Briefing'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 overflow-y-auto flex-1">
          {/* Assessment Title Badge */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
              NMIET &amp; ISTE Faculty Development Programme
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Recent advances in cyber security and blockchain for secure digital transformation
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1 text-cyan-300">
                <Clock className="w-3.5 h-3.5" /> 60 Minutes
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-300">
                <Award className="w-3.5 h-3.5" /> Certificate of Participation for All
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">50 Questions (All Compulsory)</span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleProceedToRules} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" /> Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma / Prof. Kavita Joshi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                />
                <p className="text-[11px] text-slate-400">
                  This exact name will be printed on your official Certificate of Participation.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" /> Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. participant@institute.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                />
                <p className="text-[11px] text-slate-400">
                  Your generated PDF certificate will be delivered directly to this email address automatically upon submission.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-cyan-400" /> College / Institute Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NMIET, Talegaon / Pune University"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                  />
                  <p className="text-[10px] text-slate-400">Printed after &quot;FROM&quot; on the certificate.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile Number <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                  />
                  <p className="text-[10px] text-slate-500">For registration record.</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <span>Continue to Exam Instructions</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" /> Examination Rules &amp; Certificate Notice
                </h4>
                <ul className="space-y-2.5 list-none">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">All 50 Questions Compulsory:</strong> Questions are organized into 4 sections (Cyber Security, Blockchain, Digital Transformation, and Integrated). Each question carries 1 mark.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Certificate of Participation:</strong> Every participant who completes and submits the assessment receives the official Certificate of Participation.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Automatic Email Delivery:</strong> Upon submission, the certificate is generated with your name and institute, and automatically dispatched to <strong>{email}</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Instant Download &amp; Verification:</strong> Download your PDF immediately and verify its authenticity via the public URL and QR code.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="w-1/3 py-3 px-4 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  Edit Details
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleStartExam}
                  className="w-2/3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Entering Exam Room...</span>
                    </>
                  ) : (
                    <>
                      <span>Start Assessment Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
