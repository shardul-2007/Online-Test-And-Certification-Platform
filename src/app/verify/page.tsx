'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Search, Award, ExternalLink, ArrowRight } from 'lucide-react';

export default function VerifyIndexPage() {
  const router = useRouter();
  const [certId, setCertId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim()) {
      setError('Please enter a certificate identifier.');
      return;
    }
    router.push(`/verify/${encodeURIComponent(certId.trim().toUpperCase())}`);
  };

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 py-16 md:py-24 flex items-center justify-center">
      <div className="max-w-xl w-full mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-lg shadow-cyan-500/10">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Official Credential Verification
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            SkillCert Global Institute maintains a public cryptographic registry of all issued engineering and technical credentials.
          </p>
        </div>

        {/* Search Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#090E1A] border border-slate-800 shadow-2xl space-y-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Certificate Identifier (ID)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. CERT-2026-8F42K9"
                  value={certId}
                  onChange={(e) => {
                    setCertId(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>
              {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-md shadow-cyan-500/20 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Credential Authenticity</span>
            </button>
          </form>

          {/* Quick Examples */}
          <div className="pt-4 border-t border-slate-800/80 text-center space-y-2">
            <span className="text-xs text-slate-500">Quick Test Credentials:</span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/verify/CERT-2026-8F42K9"
                className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 hover:border-cyan-500 transition"
              >
                CERT-2026-8F42K9 (Shardul Parihar)
              </Link>
              <Link
                href="/verify/CERT-2026-9A77X2"
                className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 hover:border-cyan-500 transition"
              >
                CERT-2026-9A77X2 (Elena Rostova)
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center">
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
