'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RootPage() {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(firebaseUser ? '/dashboard' : '/login');
    }
  }, [firebaseUser, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50">
      <div className="text-center">
        <div className="font-serif text-2xl text-ink-900">ContractVault</div>
        <div className="text-sm text-ink-500 mt-2">Loading ContractVault…</div>
      </div>
    </div>
  );
}
