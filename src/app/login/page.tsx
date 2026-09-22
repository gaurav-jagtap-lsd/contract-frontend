'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AuthShell from '@/components/layout/AuthShell';
import toast from 'react-hot-toast';
import { Eye, EyeOff, FileSearch, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, firebaseUser, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && firebaseUser) router.replace('/dashboard');
  }, [firebaseUser, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const ax = err as { code?: string; message?: string };
      const msg = ax?.message || 'Login failed.';
      if (ax?.code === 'ERR_NETWORK' || msg === 'Network Error') {
        toast.error('Cannot reach the API. Please try again in a moment.');
      } else if (msg.includes('wrong-password') || msg.includes('user-not-found') || msg.includes('invalid-credential')) {
        toast.error('Invalid email or password.');
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div className="flex items-center gap-2 mb-8 lg:hidden">
        <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
          <FileSearch className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-semibold text-ink-900">ContractVault</span>
      </div>
      <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Welcome back</h1>
      <p className="text-ink-500 mt-1.5 text-sm">Sign in to continue managing contracts.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="label">Email address</label>
          <input
            type="email"
            className="input"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              className="input pr-10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
              onClick={() => setShowPass(!showPass)}
              tabIndex={-1}
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-2.5">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-brand-600 font-medium hover:text-brand-700">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
