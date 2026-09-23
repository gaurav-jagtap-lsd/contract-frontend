'use client';
import { useEffect, useState } from 'react';
import { auditApi } from '@/lib/api';
import type { AuditLog } from '@/types';
import { ClipboardList, Loader2, Filter } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const ACTION_COLORS: Record<string, string> = {
  UPLOAD: 'bg-brand-100 text-brand-700',
  EDIT: 'bg-sky-100 text-sky-700',
  DELETE: 'bg-red-100 text-red-700',
  PAUSE: 'bg-amber-100 text-amber-700',
  RESUME: 'bg-emerald-100 text-emerald-700',
  SNOOZE: 'bg-violet-100 text-violet-700',
  UNSNOOZE: 'bg-violet-100 text-violet-700',
  RENEW: 'bg-teal-100 text-teal-700',
  LOGIN: 'bg-ink-100 text-ink-600',
  LOGOUT: 'bg-ink-100 text-ink-600',
  REMINDER_SENT: 'bg-orange-100 text-orange-700',
  CLIENT_CREATE: 'bg-brand-100 text-brand-700',
  CLIENT_UPDATE: 'bg-sky-100 text-sky-700',
  CLIENT_DELETE: 'bg-red-100 text-red-700',
  CLIENT_PAUSE: 'bg-amber-100 text-amber-700',
  CLIENT_RESUME: 'bg-emerald-100 text-emerald-700',
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [resourceFilter, setResourceFilter] = useState('');

  const RESOURCE_FILTERS = [
    { label: 'All', value: '' },
    { label: 'Contracts', value: 'contract' },
    { label: 'Clients', value: 'client' },
    { label: 'Auth', value: 'user' },
    { label: 'Reminders', value: 'contract' },
  ];

  useEffect(() => {
    setLoading(true);
    auditApi.logs(resourceFilter ? { resource_type: resourceFilter } : {})
      .then((r) => setLogs(r.data.data.logs))
      .catch(() => toast.error('We could not load the activity log. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, [resourceFilter]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <div className="page-header">Audit Log</div>
        <div className="page-subtitle">Complete activity history for your account.</div>
      </div>

      <div className="card p-4 flex flex-wrap gap-2">
        {RESOURCE_FILTERS.map((f) => (
          <button
            key={f.value + f.label}
            onClick={() => setResourceFilter(f.value)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
              resourceFilter === f.value && f.label === RESOURCE_FILTERS.find(x => x.value === resourceFilter)?.label
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-ink-400">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            <span className="text-sm">Loading audit logs…</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <ClipboardList className="w-10 h-10 text-ink-200" />
            <div className="text-sm text-ink-500">No audit logs found.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-ink-50 border-b border-ink-100">
                  <th className="table-header">Action</th>
                  <th className="table-header hidden sm:table-cell">Resource</th>
                  <th className="table-header">Description</th>
                  <th className="table-header hidden lg:table-cell">IP</th>
                  <th className="table-header">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="table-cell">
                      <span className={cn('badge text-[11px]', ACTION_COLORS[log.action] || 'bg-ink-100 text-ink-600')}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="table-cell hidden sm:table-cell">
                      <span className="text-xs text-ink-500 capitalize">{log.resource_type}</span>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-ink-700 max-w-[280px] truncate">{log.description}</div>
                    </td>
                    <td className="table-cell hidden lg:table-cell text-xs text-ink-400">
                      {log.ip_address || '—'}
                    </td>
                    <td className="table-cell text-xs text-ink-400 whitespace-nowrap">
                      {formatDate(log.created_at, 'dd MMM, HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && logs.length > 0 && (
          <div className="px-4 py-3 border-t border-ink-100 text-xs text-ink-400">
            Showing {logs.length} recent entries
          </div>
        )}
      </div>
    </div>
  );
}
