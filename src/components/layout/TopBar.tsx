'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useShell } from '@/context/ShellContext';
import { LogOut, ChevronDown, User, Menu } from 'lucide-react';
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
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-ink-200 flex items-center px-4 sm:px-6 gap-3 sticky top-0 z-20">
      <button
        type="button"
        onClick={toggleSidebar}
        className="lg:hidden p-2 -ml-1 rounded-lg text-ink-600 hover:bg-ink-100"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium text-ink-400 uppercase tracking-wider hidden sm:block">ContractVault</div>
        <h1 className="text-base sm:text-lg font-semibold text-ink-900 truncate leading-tight">{title}</h1>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-ink-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold ring-1 ring-brand-200/60">
            {getInitials(user?.display_name || user?.email || 'U')}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-medium text-ink-900 leading-tight max-w-[140px] truncate">
              {user?.display_name || 'User'}
            </div>
            <div className="text-[10px] text-ink-400 leading-tight max-w-[140px] truncate">
              {user?.email}
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-ink-400 hidden sm:block" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-modal border border-ink-200 py-1 z-50 animate-fade-in">
            <button
              onClick={() => { setMenuOpen(false); router.push('/settings'); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 transition-colors"
            >
              <User className="w-4 h-4" />
              My Account
            </button>
            <div className="border-t border-ink-100 my-1" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
