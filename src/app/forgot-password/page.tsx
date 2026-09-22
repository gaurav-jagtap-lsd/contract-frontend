'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthShell from '@/components/layout/AuthShell';
import { FileSearch, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email.'); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
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

      {sent ? (
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-ink-900 mb-2">Check your inbox</h2>
          <p className="text-sm text-ink-500 mb-6 leading-relaxed">
            If an account exists for <strong className="text-ink-700">{email}</strong>, you&apos;ll receive a password reset link shortly.
          </p>
          <Link href="/login" className="btn-primary w-full justify-center">Back to Sign In</Link>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Reset password</h1>
          <p className="text-sm text-ink-500 mt-1.5 mb-6">Enter your email and we&apos;ll send a reset link.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Send Reset Link'}
            </button>
          </form>
          <div className="mt-5 text-center">
            <Link href="/login" className="text-sm text-ink-400 hover:text-ink-600 inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        </>
      )}
    </AuthShell>
  );
}
