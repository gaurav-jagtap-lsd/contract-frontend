'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShellProvider } from '@/context/ShellContext';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace('/login');
    }
  }, [firebaseUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-ink-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-ink-400">Loading workspace…</span>
        </div>
      </div>
    );
  }

  if (!firebaseUser) return null;

  return (
    <ShellProvider>
      <div className="flex min-h-dvh bg-[#eef1f7]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
          <TopBar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ShellProvider>
  );
}
