'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Upload, Users, Bell, Settings, ClipboardList, X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { canManageUsers, canWrite, normalizeRole } from '@/lib/permissions';
import { useShell } from '@/context/ShellContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, access: 'all' },
  { href: '/contracts', label: 'Contracts', icon: FileText, access: 'all' },
  { href: '/upload', label: 'Upload', icon: Upload, access: 'write' },
  { href: '/clients', label: 'Clients', icon: Users, access: 'write' },
  { href: '/reminders', label: 'Reminders', icon: Bell, access: 'write' },
  { href: '/audit', label: 'Audit Log', icon: ClipboardList, access: 'write' },
  { href: '/team', label: 'Team', icon: Users, access: 'admin' },
  { href: '/settings', label: 'Settings', icon: Settings, access: 'all' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar } = useShell();
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const items = NAV_ITEMS.filter((item) => {
    if (item.access === 'admin') return canManageUsers(role);
    if (item.access === 'write') return canWrite(role);
    return true;
  });

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-ink-950/40 transition-opacity lg:hidden',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeSidebar}
        aria-hidden={!sidebarOpen}
      />
      <aside
        className={cn(
          'fixed top-0 left-0 h-dvh w-[232px] bg-[#efeae2] border-r border-ink-200 flex flex-col z-50',
          'transition-transform duration-200 ease-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="px-5 pt-6 pb-5 border-b border-ink-200 flex items-start justify-between">
          <Link href="/dashboard" className="min-w-0" onClick={closeSidebar}>
            <div className="font-serif text-[1.15rem] leading-none text-ink-900">ContractVault</div>
            <div className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-ink-500">AI Contract Management</div>
          </Link>
          <button
            type="button"
            onClick={closeSidebar}
            className="lg:hidden p-1 text-ink-500 hover:text-ink-900"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={cn(isActive ? 'sidebar-link-active' : 'sidebar-link')}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {canWrite(role) && (
          <div className="px-5 py-4 border-t border-ink-200">
            <div className="text-[10px] uppercase tracking-[0.16em] text-ink-400">AI Extraction</div>
            <p className="mt-2 text-xs text-ink-600 leading-relaxed">Upload a contract and let Gemini fill the details.</p>
            <Link href="/upload" onClick={closeSidebar} className="mt-2 block text-sm text-brand-800 hover:text-brand-950">
              Upload now
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
