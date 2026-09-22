'use client';

import Link from 'next/link';
import { FileSearch } from 'lucide-react';

const FEATURES = [
  { label: 'AI Extraction', desc: 'Gemini-powered analysis' },
  { label: 'Auto Reminders', desc: 'Never miss a renewal' },
  { label: 'Live Dashboard', desc: 'Status at a glance' },
  { label: 'Audit Trail', desc: 'Complete activity log' },
];

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex bg-ink-50">
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-brand-950 flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950" />
        <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -left-16 bottom-20 w-72 h-72 rounded-full bg-brand-400/10 blur-3xl" />
        <div className="relative z-10">
          <Link href="/login" className="flex items-center gap-3 w-fit">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
              <FileSearch className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold leading-tight">ContractVault</div>
              <div className="text-[11px] text-white/60">AI contract operations</div>
            </div>
          </Link>
        </div>
        <div className="relative z-10 max-w-md">
          <p className="text-2xl font-medium leading-snug text-white/95">
            Upload any agreement. Extract every date, party, and clause in seconds.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-10">
            {FEATURES.map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/8 ring-1 ring-white/10 p-4 backdrop-blur-sm">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-white/55 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-white/40 text-xs">© {new Date().getFullYear()} ContractVault — Logicserve Digital</div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
