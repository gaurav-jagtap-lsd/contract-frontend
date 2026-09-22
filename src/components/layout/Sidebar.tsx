'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Upload, Users, Bell, Settings, FileSearch, ClipboardList, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShell } from '@/context/ShellContext';

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
  const { sidebarOpen, closeSidebar } = useShell();

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-sm transition-opacity lg:hidden',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeSidebar}
        aria-hidden={!sidebarOpen}
      />
      <aside
        className={cn(
          'fixed top-0 left-0 h-dvh w-60 bg-white border-r border-ink-200 flex flex-col z-50',
          'transition-transform duration-200 ease-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-ink-100">
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0" onClick={closeSidebar}>
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <FileSearch className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-ink-900 leading-tight truncate">ContractVault</div>
              <div className="text-[10px] text-ink-400 leading-tight">AI-Powered</div>
            </div>
          </Link>
          <button
            type="button"
            onClick={closeSidebar}
            className="lg:hidden p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
                onClick={closeSidebar}
                className={cn(isActive ? 'sidebar-link-active' : 'sidebar-link')}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-ink-100">
          <Link
            href="/upload"
            onClick={closeSidebar}
            className="block rounded-2xl bg-gradient-to-br from-brand-50 to-white ring-1 ring-brand-100 p-3.5 hover:ring-brand-200 transition-all"
          >
            <div className="text-xs font-semibold text-brand-800">AI Extraction</div>
            <div className="text-[11px] text-brand-600/80 leading-relaxed mt-1">
              Upload a contract and let Gemini fill the details.
            </div>
            <div className="mt-2 text-xs font-semibold text-brand-700">Upload now →</div>
          </Link>
        </div>
      </aside>
    </>
  );
}
