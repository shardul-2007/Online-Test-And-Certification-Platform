import React from 'react';
import Link from 'next/link';
import { Award, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Award className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-bold text-white text-base">SkillCert</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standardized examination, authoritative server-side evaluation, and instantaneous cryptographic certificate issuance for engineering excellence.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All Certification Services Operational
            </div>
          </div>

          {/* Verification */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Credential Integrity</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/verify" className="hover:text-cyan-400 transition flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Public Credential Verification
                </Link>
              </li>
              <li>
                <span className="text-slate-500">ISO/IEC 17024 Compliant Framework</span>
              </li>
              <li>
                <span className="text-slate-500">SHA-256 PDF Tamper Resistance</span>
              </li>
              <li>
                <span className="text-slate-500">Automated Resend SMTP Dispatch</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#tests" className="hover:text-cyan-400 transition">
                  Browse Assessments
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-cyan-400 transition">
                  Examination Methodology
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-cyan-400 transition">
                  Administrator Portal
                </Link>
              </li>
              <li>
                <Link href="/verify/CERT-2026-8F42K9" className="hover:text-cyan-400 transition">
                  Sample Certificate
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Seal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Accreditation</h4>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                SkillCert Global Institute
              </div>
              <p className="text-[11px] text-slate-500">
                Authorized examination board for technical accreditations and verifiable digital certificates.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} SkillCert Global Institute. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Server Evaluation Engine v2.4</span>
            <span>Resend API Integration</span>
            <Link href="/admin" className="text-cyan-400 hover:underline">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
