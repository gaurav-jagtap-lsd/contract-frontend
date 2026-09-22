'use client';
import { useEffect, useState } from 'react';
import { remindersApi } from '@/lib/api';
import type { ReminderLog } from '@/types';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RemindersPage() {
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    remindersApi.logs()
      .then((r) => setLogs(r.data.data.logs))
      .catch(() => toast.error('Failed to load reminders.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <div className="page-header">Reminders</div>
        <div className="page-subtitle">History of automated renewal reminder emails.</div>
      </div>

      {/* Info card */}
      <div className="card">
        <div className="px-5 py-4 border-b border-ink-200">
          <div className="font-serif text-lg text-ink-900">Automatic Reminder Schedule</div>
        </div>
        <div className="px-5 py-4 text-sm text-ink-700 space-y-2">
          <div><strong>31–60 days</strong> before expiry: weekly reminder.</div>
          <div><strong>1–30 days</strong> before expiry: every 2 days.</div>
          <div><strong>After expiry</strong>: daily for 7 days, then stopped.</div>
          <div className="text-xs text-ink-500 pt-2">Reminders can be paused per contract or per client.</div>
        </div>
      </div>

      {/* Log table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-100">
          <div className="text-sm font-semibold text-ink-900">Reminder History</div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-ink-400">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            <span className="text-sm">Loading reminder logs…</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4">
            <Mail className="w-10 h-10 text-ink-200" />
            <div className="text-sm font-medium text-ink-500">No reminders sent yet.</div>
            <div className="text-xs text-ink-400 text-center max-w-xs">
              Reminders are sent automatically when contracts are within 60 days of expiry. Add contracts and expiry dates to get started.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-ink-50 border-b border-ink-100">
                  <th className="table-header">Contract</th>
                  <th className="table-header hidden md:table-cell">Last Sent</th>
                  <th className="table-header hidden sm:table-cell">Days Left When Sent</th>
                  <th className="table-header">Total Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="table-cell">
                      <Link href={`/contracts/${log.contract_id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                        {log.contract_name}
                      </Link>
                    </td>
                    <td className="table-cell hidden md:table-cell text-ink-500">
                      {formatDate(log.last_sent_at, 'dd MMM yyyy HH:mm')}
                    </td>
                    <td className="table-cell hidden sm:table-cell">
                      <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                        log.days_remaining_when_sent <= 0 ? 'bg-red-100 text-red-700' :
                        log.days_remaining_when_sent <= 30 ? 'bg-orange-100 text-orange-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {log.days_remaining_when_sent <= 0
                          ? `${Math.abs(log.days_remaining_when_sent)}d after expiry`
                          : `${log.days_remaining_when_sent}d remaining`}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-sm text-ink-700">{log.total_sent}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
