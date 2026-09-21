'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      const msg = (err as { message?: string })?.message || 'Login failed.';
      if (msg.includes('wrong-password') || msg.includes('user-not-found') || msg.includes('invalid-credential')) {
        toast.error('Invalid email or password.');
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-900 to-brand-700 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-white">ContractVault</span>
        </div>
        <div>
          <blockquote className="text-white/80 text-lg leading-relaxed mb-8">
            "Intelligent contract management — upload any agreement and let AI extract every critical detail instantly."
          </blockquote>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'AI Extraction', desc: 'Gemini-powered analysis' },
              { label: 'Auto Reminders', desc: 'Never miss a renewal' },
              { label: 'Smart Dashboard', desc: 'All contracts at a glance' },
              { label: 'Audit Trail', desc: 'Complete activity log' },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-white font-medium text-sm">{item.label}</div>
                <div className="text-white/60 text-xs mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-white/40 text-xs">© 2024 ContractVault — Logicserve Digital</div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-ink-900">ContractVault</span>
            </div>
            <h1 className="text-2xl font-bold text-ink-900">Welcome back</h1>
            <p className="text-ink-500 mt-1 text-sm">Sign in to your account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Link href="/forgot-password" className="text-sm text-brand-600 hover:text-brand-700">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center py-2.5"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-6">
            Don't have an account?{' '}
            <Link href="/register" className="text-brand-600 font-medium hover:text-brand-700">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
