'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Upload, Users, Bell, Settings, FileSearch, ClipboardList, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contracts', label: 'Contracts', icon: FileText },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/reminders', label: 'Reminders', icon: Bell },
  { href: '/audit', label: 'Audit Log', icon: ClipboardList },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed top-0 left-0 h-full bg-white border-r border-ink-200 flex flex-col z-30"
      style={{ width: '240px' }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-ink-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
            <FileSearch className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-ink-900 leading-tight">ContractVault</div>
            <div className="text-[10px] text-ink-400 leading-tight">AI-Powered</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-semibold text-ink-400 uppercase tracking-widest">Menu</span>
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(isActive ? 'sidebar-link-active' : 'sidebar-link')}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-4 py-4 border-t border-ink-100">
        <div className="bg-brand-50 rounded-xl p-3">
          <div className="text-xs font-semibold text-brand-700 mb-1">AI Extraction</div>
          <div className="text-[11px] text-brand-600/70 leading-relaxed">
            Upload any contract and let Gemini AI extract all key details automatically.
          </div>
          <Link href="/upload" className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
            Try it now <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
