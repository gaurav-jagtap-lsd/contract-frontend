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
