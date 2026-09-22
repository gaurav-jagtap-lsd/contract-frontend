'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useShell } from '@/context/ShellContext';
import { LogOut, User, Menu } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getInitials } from '@/lib/utils';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/contracts': 'Contracts',
  '/upload': 'Upload',
  '/clients': 'Clients',
  '/reminders': 'Reminders',
  '/audit': 'Audit Log',
  '/settings': 'Settings',
};

export default function TopBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { toggleSidebar } = useShell();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const title = Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ?? 'ContractVault';
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out.');
    router.push('/login');
  };

  return (
    <header className="h-12 bg-[#f6f4f0] border-b border-ink-200 flex items-center px-4 sm:px-6 gap-3 sticky top-0 z-20">
      <button
        type="button"
        onClick={toggleSidebar}
        className="lg:hidden p-1.5 -ml-1 text-ink-700 hover:bg-ink-100"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0 text-[11px] uppercase tracking-[0.16em] text-ink-500 truncate">
        ContractVault <span className="text-ink-300 mx-1.5">/</span> {title}
      </div>
      <div className="hidden sm:block text-xs text-ink-500 tabular-nums">{today}</div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 pl-1 pr-1 py-1 hover:bg-ink-100"
        >
          <div className="w-7 h-7 bg-ink-900 text-ink-50 flex items-center justify-center text-[10px] font-medium">
            {getInitials(user?.display_name || user?.email || 'U')}
          </div>
          <div className="text-left hidden md:block max-w-[160px]">
            <div className="text-xs text-ink-900 leading-tight truncate">
              {user?.display_name || 'User'}
            </div>
          </div>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-ink-200 py-1 z-50">
            <button
              onClick={() => { setMenuOpen(false); router.push('/settings'); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
            >
              <User className="w-4 h-4" />
              My Account
            </button>
            <div className="border-t border-ink-100 my-1" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-brand-800 hover:bg-brand-50"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
