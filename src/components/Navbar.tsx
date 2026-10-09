'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Award, ShieldCheck, Menu, X, ArrowRight, LayoutDashboard, User } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If in active test taking mode, hide navigation distractions
  if (pathname.startsWith('/test/') && !pathname.endsWith('/register')) {
    return null;
  }

  const navLinks = [
    { label: 'Verify Certificate', href: '/verify', icon: ShieldCheck },
    { label: 'Admin Portal', href: '/admin', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/80 dark:bg-[#070B14]/80 border-b border-slate-800/80 dark:border-slate-800/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Award className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              SkillCert <span className="text-xs px-1.5 py-0.5 rounded font-mono font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">PRO</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Accredited Testing</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  isActive
                    ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 text-cyan-400/80" />}
                {link.label}
              </Link>
            );
          })}
          
          {pathname === '/' && (
            <button
              onClick={() => {
                window.dispatchEvent(new Event('start-test-modal'));
              }}
              className="ml-2 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <span>Start FDP Assessment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </nav>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 px-4 pt-2 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-900"
            >
              <span>{link.label}</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </Link>
          ))}
          
          {pathname === '/' && (
            <button
              onClick={() => {
                window.dispatchEvent(new Event('start-test-modal'));
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <span>Start FDP Assessment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </header>
  );
}
