'use client';
import { useEffect, useState } from 'react';
import { dashboardApi, contractsApi } from '@/lib/api';
import type { DashboardSummary, Contract, PHPendingContract } from '@/types';
import { formatDate, statusColor, statusLabel, daysRemaining } from '@/lib/utils';
import {
  FileText, Users, AlertCircle, CheckCircle, Clock, TrendingUp, Upload, ChevronRight,
  ShieldCheck, AlertTriangle, Camera,
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#5b6ef2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function StatCard({
  label, value, icon: Icon, color, sub, href,
}: { label: string; value: number; icon: React.ElementType; color: string; sub?: string; href?: string }) {
  const inner = (
    <div className="card p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-ink-900">{value}</div>
        <div className="text-sm text-ink-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-ink-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/** Visual progress bar showing elapsed days out of 30 */
function PHCountdownBar({ daysElapsed, isOverdue }: { daysElapsed: number; isOverdue: boolean }) {
  const pct = Math.min(100, Math.round((daysElapsed / 30) * 100));
  const barColor = isOverdue
    ? 'bg-red-500'
    : daysElapsed >= 23
    ? 'bg-orange-500'
    : daysElapsed >= 15
    ? 'bg-yellow-400'
    : 'bg-emerald-500';

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-ink-400 whitespace-nowrap">{daysElapsed}/30d</span>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<{
    monthly_expiry_trend: { month: string; count: number }[];
    service_type_distribution: { type: string; count: number }[];
    upcoming_renewals: Contract[];
    ph_pending_contracts: PHPendingContract[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Main contract upload modal state
  const [uploadingMainFor, setUploadingMainFor] = useState<string | null>(null);
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [uploadingMain, setUploadingMain] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sumRes, chartRes] = await Promise.all([
          dashboardApi.summary(),
          dashboardApi.charts(),
        ]);
        setSummary(sumRes.data.data);
        setCharts(chartRes.data.data);
      } catch {
        // handled silently
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleMainContractUpload = async (contractId: string) => {
    if (!mainFile) { toast.error('Please select a file.'); return; }
    setUploadingMain(true);
    try {
      const form = new FormData();
      form.append('file', mainFile);
      await contractsApi.uploadMainContract(contractId, form);
      toast.success('Main contract uploaded! 30-day timer cleared.');
      setUploadingMainFor(null);
      setMainFile(null);
      // Refresh charts/summary
      const [sumRes, chartRes] = await Promise.all([dashboardApi.summary(), dashboardApi.charts()]);
      setSummary(sumRes.data.data);
      setCharts(chartRes.data.data);
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploadingMain(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-24 skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card h-64 skeleton" />
          <div className="card h-64 skeleton" />
        </div>
      </div>
    );
  }

  const s = summary;
  const phPending = charts?.ph_pending_contracts ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Contracts" value={s?.total_contracts ?? 0} icon={FileText} color="bg-brand-100 text-brand-600" />
        <StatCard label="Active" value={s?.active_contracts ?? 0} icon={CheckCircle} color="bg-emerald-100 text-emerald-600" />
        <StatCard
          label="Expiring Soon"
          value={s?.expiring_in_30_days ?? 0}
          icon={Clock}
          color="bg-orange-100 text-orange-600"
          sub="Within 30 days"
        />
        <StatCard label="Expired" value={s?.expired_contracts ?? 0} icon={AlertCircle} color="bg-red-100 text-red-600" />
      </div>

      {/* Stats Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clients" value={s?.total_clients ?? 0} icon={Users} color="bg-violet-100 text-violet-600" />
        <StatCard label="Paused" value={s?.paused_contracts ?? 0} icon={Clock} color="bg-amber-100 text-amber-600" />
        <StatCard
          label="Expiring in 60d"
          value={s?.expiring_in_60_days ?? 0}
          icon={TrendingUp}
          color="bg-sky-100 text-sky-600"
          sub="Needs attention"
        />
        {/* NEW: PH Pending Stat Card */}
        <StatCard
          label="PH Approved"
          value={s?.ph_approved_pending_main_contract ?? 0}
          icon={ShieldCheck}
          color={(s?.ph_approved_pending_main_contract ?? 0) > 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-ink-100 text-ink-400'}
          sub="Pending main contract"
          href="/contracts?status=ph_pending"
        />
      </div>

      {/* Quick action (moved inline) */}
      <div className="flex justify-end">
        <Link href="/upload" className="btn-primary text-xs">
          <Upload className="w-3.5 h-3.5" /> Upload Contract
        </Link>
      </div>

      {/* ── PH Approval 30-Day Pending Section ── */}
      {phPending.length > 0 && (
        <div className="card">
          {/* Header */}
          <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink-900">
                  PH Approval — 30-Day Upload Reminder
                </div>
                <div className="text-xs text-ink-400">
                  {phPending.length} contract{phPending.length !== 1 ? 's' : ''} pending main contract upload
                </div>
              </div>
            </div>
            <Link href="/contracts?status=ph_pending" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Contract rows */}
          <div className="divide-y divide-ink-50">
            {phPending.map((c) => {
              const isOverdue = c.is_overdue;
              const daysLeft = c.days_remaining_in_30;
              const elapsed = c.days_elapsed;

              const urgencyBadge = isOverdue
                ? 'bg-red-100 text-red-700'
                : (daysLeft ?? 30) <= 7
                ? 'bg-orange-100 text-orange-700'
                : (daysLeft ?? 30) <= 15
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-emerald-100 text-emerald-700';

              return (
                <div key={c.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/contracts/${c.id}`}
                          className="text-sm font-semibold text-ink-900 hover:text-brand-600 truncate"
                        >
                          {c.contract_name}
                        </Link>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${urgencyBadge}`}>
                          {isOverdue
                            ? `⚠ Overdue by ${Math.abs(daysLeft ?? 0)}d`
                            : `${daysLeft}d left`}
                        </span>
                        {c.ph_approval_type && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100 flex items-center gap-1">
                            {c.ph_approval_type === 'screenshot'
                              ? <><Camera className="w-2.5 h-2.5" /> Screenshot</>
                              : '✉ Mail Approval'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-ink-400 mt-0.5">{c.client_name}</div>
                      <div className="text-xs text-ink-400 mt-0.5">
                        PH approved: {formatDate(c.ph_approved_at)}
                      </div>
                      {/* Progress bar */}
                      <PHCountdownBar daysElapsed={elapsed ?? 0} isOverdue={isOverdue} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/contracts/${c.id}`}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => { setUploadingMainFor(c.id); setMainFile(null); }}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        <Upload className="w-3 h-3" /> Upload Main Contract
                      </button>
                    </div>
                  </div>

                  {/* Inline upload panel */}
                  {uploadingMainFor === c.id && (
                    <div className="mt-3 p-3 bg-ink-50 rounded-xl border border-ink-200 flex items-center gap-3 flex-wrap">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="text-xs text-ink-600 flex-1 min-w-0"
                        onChange={(e) => setMainFile(e.target.files?.[0] ?? null)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMainContractUpload(c.id)}
                          disabled={!mainFile || uploadingMain}
                          className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
                        >
                          {uploadingMain ? 'Uploading…' : 'Confirm Upload'}
                        </button>
                        <button
                          onClick={() => setUploadingMainFor(null)}
                          className="btn-ghost text-xs py-1.5 px-3"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly expiry trend */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-ink-900">Expiry Trend</div>
              <div className="text-xs text-ink-400">Monthly contract expirations</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={charts?.monthly_expiry_trend ?? []}>
              <defs>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5b6ef2" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#5b6ef2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="count" stroke="#5b6ef2" fill="url(#expGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Service type distribution */}
        <div className="card p-5">
          <div className="text-sm font-semibold text-ink-900 mb-1">Service Types</div>
          <div className="text-xs text-ink-400 mb-4">Contract breakdown</div>
          {(charts?.service_type_distribution?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={charts?.service_type_distribution}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={40}
                >
                  {charts?.service_type_distribution?.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-ink-400">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Upcoming renewals */}
      <div className="card">
        <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-ink-900">Upcoming Renewals</div>
            <div className="text-xs text-ink-400">Contracts expiring within 90 days</div>
          </div>
          <Link href="/contracts?status=expiring_soon" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {(charts?.upcoming_renewals?.length ?? 0) === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-ink-400">
            No contracts expiring in the next 90 days.
          </div>
        ) : (
          <div className="divide-y divide-ink-50">
            {charts?.upcoming_renewals?.map((c) => {
              const days = c.days_remaining ?? daysRemaining(c.end_date);
              return (
                <Link
                  key={c.id}
                  href={`/contracts/${c.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-ink-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink-900 truncate">{c.contract_name}</div>
                    <div className="text-xs text-ink-400 mt-0.5">{c.client_name}</div>
                  </div>
                  <div className="text-xs text-ink-500">{formatDate(c.end_date)}</div>
                  <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                    (days ?? 999) <= 7 ? 'bg-red-100 text-red-700' :
                    (days ?? 999) <= 30 ? 'bg-orange-100 text-orange-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {days !== null ? `${days}d` : '—'}
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-ink-500 transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
