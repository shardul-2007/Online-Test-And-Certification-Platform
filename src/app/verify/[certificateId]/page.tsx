'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  Calendar,
  CheckCircle2,
  Download,
  AlertTriangle,
  Loader2,
  Building,
  User,
  ArrowRight,
  Search,
} from 'lucide-react';

export default function CertificateVerificationPage({
  params,
}: {
  params: { certificateId: string };
}) {
  const certificateId = decodeURIComponent(params.certificateId).toUpperCase();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function verify() {
      try {
        setLoading(true);
        const res = await fetch(`/api/certificates/${certificateId}`);
        const data = await res.json();

        if (!data.success || !data.certificate) {
          throw new Error('Certificate not found or invalid.');
        }

        setCertificate(data.certificate);
      } catch (err: any) {
        setError(err.message || 'Certificate not found or invalid.');
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [certificateId]);

  const handleDownload = () => {
    setDownloading(true);
    const a = document.createElement('a');
    a.href = `/api/certificates/${certificateId}/download`;
    a.download = `${certificateId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloading(false), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06080F] flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-medium text-slate-300">Searching cryptographic certificate registry...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 py-16 md:py-24">
      <div className="max-w-2xl mx-auto px-4 space-y-8">
        {/* Verification Result Card */}
        {certificate ? (
          <div className="p-6 sm:p-10 rounded-2xl bg-[#090E1A] border-2 border-emerald-500/40 shadow-2xl shadow-emerald-950/20 space-y-8 relative overflow-hidden">
            {/* Top Seal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Certificate Valid & Authentic
                  </div>
                  <span className="text-xs text-slate-400">Public Verification Record</span>
                </div>
              </div>

              <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-cyan-300 self-start sm:self-auto">
                {certificate.certificateId}
              </div>
            </div>

            {/* Credential Attributes */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Conferred To Participant
                </span>
                <div className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" />
                  {certificate.participantName}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Assessment / Program
                  </span>
                  <div className="text-sm font-semibold text-white">
                    {certificate.testTitle}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Certificate Classification
                  </span>
                  <div className="text-sm font-semibold text-cyan-300">
                    {certificate.certificateTitle || 'Certificate of Achievement'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Evaluated Score
                  </span>
                  <div className="text-base font-bold text-emerald-300 font-mono">
                    {certificate.percentage}% (Score: {certificate.score})
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Date of Issue
                  </span>
                  <div className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(certificate.issueDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-cyan-400" />
                  <span>Issuing Body: <strong>{certificate.organizationName}</strong></span>
                </div>
                <span className="text-emerald-400 font-mono text-[11px] font-bold">STATUS: VERIFIED</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-md shadow-cyan-500/20 transition cursor-pointer"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Official PDF</span>
                  </>
                )}
              </button>

              <Link
                href="/verify"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Verify Another</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Error State */
          <div className="p-8 sm:p-10 rounded-2xl bg-[#090E1A] border-2 border-red-500/40 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Certificate not found or invalid.</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No matching credential was located for identifier <strong className="font-mono text-slate-200">{certificateId}</strong> in the official accreditation repository.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/verify"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Try Another Certificate ID</span>
              </Link>
            </div>
          </div>
        )}

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
