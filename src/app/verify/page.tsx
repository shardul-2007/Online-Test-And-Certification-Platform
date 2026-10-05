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
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/10">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            NMIET &amp; ISTE Certificate Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Public verification portal for the Faculty Development Programme on Recent Advances in Cyber Security and Blockchain for Secure Digital Transformation (5th to 9th Oct, 2026).
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
                  placeholder="e.g. CERT-2026-FDP-8F42K9"
                  value={certId}
                  onChange={(e) => {
                    setCertId(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>
              {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Certificate Authenticity</span>
            </button>
          </form>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition"
          >
            <span>Return to FDP Assessment Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
