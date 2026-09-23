'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShellProvider } from '@/context/ShellContext';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { canManageUsers, canWrite, normalizeRole } from '@/lib/permissions';

function blockedPath(role: string, pathname: string) {
  if (pathname.startsWith('/team')) return !canManageUsers(role);
  if (!canWrite(role)) {
    return pathname.startsWith('/upload')
      || pathname.startsWith('/clients')
      || pathname.startsWith('/reminders')
      || pathname.startsWith('/audit')
      || pathname.includes('/edit');
  }
  return false;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUser, user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const role = normalizeRole(user?.role);
  const blocked = !!user && blockedPath(role, pathname);

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace('/login');
    }
  }, [firebaseUser, loading, router]);

  useEffect(() => {
    if (!loading && blocked) {
      router.replace('/contracts');
    }
  }, [blocked, loading, router]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-ink-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-ink-800 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-ink-500">Loading ContractVault…</span>
        </div>
      </div>
    );
  }

  if (!firebaseUser) return null;

  return (
    <ShellProvider>
      <div className="flex min-h-dvh bg-ink-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 lg:ml-[232px]">
          <TopBar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            {blocked ? null : children}
          </main>
        </div>
      </div>
    </ShellProvider>
  );
}
