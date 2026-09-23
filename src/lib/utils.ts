import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import type { ContractStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr?: string | null, fmt = 'dd MMM yyyy'): string {
  if (!dateStr) return '—';
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return dateStr;
    return format(d, fmt);
  } catch {
    return dateStr;
  }
}

export function daysRemaining(endDateStr?: string | null): number | null {
  if (!endDateStr) return null;
  try {
    const end = parseISO(endDateStr);
    if (!isValid(end)) return null;
    return differenceInDays(end, new Date());
  } catch {
    return null;
  }
}

export function statusLabel(status: ContractStatus | string): string {
  const map: Record<string, string> = {
    active: 'Active',
    paused: 'Paused',
    expiring_soon: 'Expiring Soon',
    expired: 'Expired',
    renewed: 'Renewed',
    archived: 'Archived',
  };
  return map[status] || status;
}

export function statusColor(status: ContractStatus | string): string {
  const map: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    paused: 'bg-amber-100 text-amber-800 border-amber-200',
    expiring_soon: 'bg-orange-100 text-orange-800 border-orange-200',
    expired: 'bg-red-100 text-red-800 border-red-200',
    renewed: 'bg-blue-100 text-blue-800 border-blue-200',
    archived: 'bg-ink-100 text-ink-600 border-ink-200',
  };
  return map[status] || 'bg-ink-100 text-ink-600 border-ink-200';
}

export function pipelineStepClass(step?: string | null): string {
  const map: Record<string, string> = {
    Initiated: 'bg-ink-50 text-ink-700 border-ink-200',
    'Commercial Shared': 'bg-sky-50 text-sky-800 border-sky-200',
    Negotiation: 'bg-violet-50 text-violet-800 border-violet-200',
    Approval: 'bg-amber-50 text-amber-800 border-amber-200',
    'SOW/Draft shared': 'bg-orange-50 text-orange-800 border-orange-200',
    Signed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  };
  return map[step || ''] || 'bg-ink-50 text-ink-700 border-ink-200';
}

export function confidenceColor(score: number): string {
  if (score >= 0.85) return 'text-emerald-600';
  if (score >= 0.65) return 'text-amber-600';
  return 'text-red-600';
}

export function confidenceLabel(score: number): string {
  if (score >= 0.85) return 'High';
  if (score >= 0.65) return 'Medium';
  return 'Low';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? singular + 's')}`;
}

function looksTechnical(text: string): boolean {
  const value = text.toLowerCase();
  return (
    value.startsWith('request failed')
    || value.includes('status code')
    || value.includes('network error')
    || value.startsWith('firebase:')
    || value.includes('auth/')
    || value.includes('traceback')
    || value.includes('exception')
    || value.includes('token')
    || value.includes('errno')
    || value.includes('undefined')
    || value.includes('null')
  );
}

export function friendlyError(err: unknown, fallback: string): string {
  const ax = (err ?? {}) as {
    code?: string;
    message?: string;
    response?: {
      status?: number;
      data?: { message?: string; error?: { message?: string } };
    };
  };
  const status = ax.response?.status;
  const code = ax.code || '';
  const apiMessage = ax.response?.data?.error?.message || ax.response?.data?.message;

  if (code === 'ERR_NETWORK' || ax.message === 'Network Error' || code === 'auth/network-request-failed') {
    return 'We could not reach the server. Check your connection and try again.';
  }
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'That email or password is not right.';
  }
  if (code.includes('email-already-in-use')) {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (code.includes('too-many-requests') || status === 429) {
    return 'Too many attempts. Wait a moment and try again.';
  }
  if (apiMessage && !looksTechnical(apiMessage)) return apiMessage;
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'We could not find what you were looking for.';
  if (status === 409) return 'This email is already registered. Sign in instead.';
  if (status && status >= 500) return 'Something went wrong on our side. Please try again.';
  if (ax.message && !looksTechnical(ax.message)) return ax.message;
  return fallback;
}

export function computeContractDates(services: Array<{ start_date?: string | null; end_date?: string | null }>): {
  startDate: string;
  endDate: string;
} {
  const startDates = services
    .map((s) => s.start_date?.trim())
    .filter((d): d is string => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();

  const endDates = services
    .map((s) => s.end_date?.trim())
    .filter((d): d is string => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();

  return {
    startDate: startDates.length > 0 ? startDates[0] : '',
    endDate: endDates.length > 0 ? endDates[endDates.length - 1] : '',
  };
}
