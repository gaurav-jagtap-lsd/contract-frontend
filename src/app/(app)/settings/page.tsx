'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import { User, Lock, Bell, Shield, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getInitials } from '@/lib/utils';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResetLoading(true);
    try {
      await authApi.resetPassword(user.email);
      setResetSent(true);
      toast.success('Password reset email sent!');
    } catch {
      toast.error('Failed to send reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div>
        <div className="page-header">Settings</div>
        <div className="page-subtitle">Manage your account and preferences.</div>
      </div>

      {/* Profile */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-ink-900 text-ink-50 flex items-center justify-center text-lg font-medium">
            {getInitials(user?.display_name || user?.email || 'U')}
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink-900">{user?.display_name || 'Account'}</h2>
            <p className="text-sm text-ink-500">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-5">
          <User className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-semibold text-ink-900">Account Profile</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Display Name</label>
            <div className="input bg-ink-50 text-ink-500 cursor-not-allowed">{user?.display_name || '—'}</div>
          </div>
          <div>
            <label className="label">Email Address</label>
            <div className="input bg-ink-50 text-ink-500 cursor-not-allowed">{user?.email}</div>
          </div>
          <div>
            <label className="label">Role</label>
            <div className="input bg-ink-50 text-ink-500 cursor-not-allowed capitalize">{user?.role || 'admin'}</div>
          </div>
        </div>
        <p className="text-xs text-ink-400 mt-3">
          Profile editing will be available in a future update. Contact your admin to change account details.
        </p>
      </div>

      {/* Password */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-5">
          <Lock className="w-4 h-4 text-brand-500" />
          <h2 className="text-sm font-semibold text-ink-900">Password</h2>
        </div>
        <p className="text-sm text-ink-500 mb-4">
          To change your password, we'll send a reset link to <strong>{user?.email}</strong>.
        </p>
        {resetSent ? (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle className="w-4 h-4" />
            Reset email sent! Check your inbox.
          </div>
        ) : (
          <button onClick={handlePasswordReset} disabled={resetLoading} className="btn-secondary">
            {resetLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Send Password Reset Email'}
          </button>
        )}
      </div>

      {/* Reminder info */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-5">
          <Bell className="w-4 h-4 text-brand-500" />
          <h2 className="text-sm font-semibold text-ink-900">Reminder System</h2>
        </div>
        <div className="space-y-3 text-sm text-ink-600">
          <div className="flex items-start gap-3 bg-ink-50 rounded-sm p-4">
            <div className="text-2xl">📅</div>
            <div>
              <div className="font-medium text-ink-800">Automated Scheduling</div>
              <div className="text-xs text-ink-500 mt-0.5">
                Reminders run daily at 08:00 UTC via Celery Beat. No manual action needed.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-ink-50 rounded-sm p-4">
            <div className="text-2xl">📧</div>
            <div>
              <div className="font-medium text-ink-800">Email Provider</div>
              <div className="text-xs text-ink-500 mt-0.5">
                Emails are sent via Brevo (Sendinblue) from the configured sender address.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-ink-50 rounded-sm p-4">
            <div className="text-2xl">⏸️</div>
            <div>
              <div className="font-medium text-ink-800">Pause & Snooze</div>
              <div className="text-xs text-ink-500 mt-0.5">
                You can pause reminders per contract or per client. Snooze is also available for temporary holds.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-5">
          <Shield className="w-4 h-4 text-brand-500" />
          <h2 className="text-sm font-semibold text-ink-900">Security Info</h2>
        </div>
        <div className="space-y-2 text-sm text-ink-600">
          <div className="flex justify-between py-2 border-b border-ink-50">
            <span className="text-ink-500">Authentication</span>
            <span className="font-medium text-ink-800">Firebase Auth</span>
          </div>
          <div className="flex justify-between py-2 border-b border-ink-50">
            <span className="text-ink-500">Storage</span>
            <span className="font-medium text-ink-800">Firebase Firestore + Storage</span>
          </div>
          <div className="flex justify-between py-2 border-b border-ink-50">
            <span className="text-ink-500">AI Provider</span>
            <span className="font-medium text-ink-800">Google Gemini 2.5 Flash</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-ink-500">Session</span>
            <span className="font-medium text-ink-800">Token-based (Firebase ID Token)</span>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-5 border-red-100">
        <h2 className="text-sm font-semibold text-red-600 mb-4">Danger Zone</h2>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-medium text-ink-800">Sign out everywhere</div>
            <div className="text-xs text-ink-400">Terminate your current session.</div>
          </div>
          <button
            onClick={async () => { await logout(); }}
            className="btn-danger text-xs"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
