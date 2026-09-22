'use client';

import Link from 'next/link';

const POINTS = [
  { n: '01', label: 'AI Extraction', desc: 'Gemini reads the document and fills the contract fields.' },
  { n: '02', label: 'Auto Reminders', desc: 'Renewal emails go out before a contract expires.' },
  { n: '03', label: 'Dashboard', desc: 'Active, expiring, and expired contracts in one view.' },
  { n: '04', label: 'Audit Trail', desc: 'A record of uploads, edits, and reminders.' },
];

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex bg-[#f6f4f0]">
      <div className="hidden lg:flex lg:w-[46%] bg-ink-900 text-ink-50 flex-col justify-between p-12">
        <Link href="/login" className="w-fit">
          <div className="font-serif text-2xl leading-none">ContractVault</div>
          <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-ink-400">AI Contract Management</div>
        </Link>
        <div className="max-w-md">
          <p className="font-serif text-[2rem] leading-[1.2] text-ink-50">
            Upload any agreement. Extract every date, party, and clause.
          </p>
          <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {POINTS.map((item) => (
              <div key={item.n} className="grid grid-cols-[2.5rem_1fr] gap-3 py-3.5">
                <div className="text-[11px] text-brand-300 pt-0.5">{item.n}</div>
                <div>
                  <div className="text-sm text-ink-50">{item.label}</div>
                  <div className="text-xs text-ink-400 mt-0.5 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-ink-500 text-xs">© {new Date().getFullYear()} Logicserve Digital</div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
