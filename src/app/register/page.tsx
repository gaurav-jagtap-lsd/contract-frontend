'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, FileSearch, Loader2 } from 'lucide-react';
import AuthShell from '@/components/layout/AuthShell';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', confirm: '', name: '' });
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.name) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await register(form.email, form.password, form.name);
      toast.success('Account created! Welcome to ContractVault.');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err as { message?: string })?.message
        || 'Registration failed.';
      toast.error(msg);
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
      <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Create your account</h1>
      <p className="text-sm text-ink-500 mt-1.5 mb-6">Start managing contracts with AI-powered extraction.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full name <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="input"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Email address <span className="text-red-500">*</span></label>
            <input
              type="email"
              className="input"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
          <div>
            <label className="label">Confirm password <span className="text-red-500">*</span></label>
            <input
              type="password"
              className="input"
              placeholder="Re-enter password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-2.5 mt-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-600 font-medium hover:text-brand-700">Sign in</Link>
        </p>
    </AuthShell>
  );
}
