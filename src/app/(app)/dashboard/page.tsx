'use client';
import { useCallback, useEffect, useState } from 'react';
import { dashboardApi, contractsApi } from '@/lib/api';
import type { DashboardSummary, Contract } from '@/types';
import { formatDate, daysRemaining, statusColor, statusLabel, pipelineStepClass } from '@/lib/utils';
import {
  Upload, ChevronRight, Search, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#7a382c', '#3c3731', '#8f867a', '#a86b5b', '#524c43'];

function StatCard({
  label, value, sub, href,
}: { label: string; value: number; sub?: string; href?: string }) {
  const inner = (
    <div className="card px-4 py-4 hover:border-ink-400 transition-colors">
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500">{label}</div>
      <div className="font-serif text-3xl text-ink-900 mt-2 tabular-nums">{value}</div>
      {sub && <div className="text-xs text-ink-400 mt-1">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<{
    monthly_expiry_trend: { month: string; count: number }[];
    service_type_distribution: { type: string; count: number }[];
    upcoming_renewals: Contract[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Contract[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

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

  const runSearch = useCallback(async (term: string) => {
    if (!term) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await contractsApi.list({ search: term });
      setSearchResults(res.data.data.contracts ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    runSearch(debouncedSearch);
  }, [debouncedSearch, runSearch]);

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="page-header">Dashboard</div>
          <div className="page-subtitle">Overview of clients, contracts, and upcoming renewals.</div>
        </div>
        <Link href="/upload" className="btn-primary text-xs self-start sm:self-auto">
          <Upload className="w-3.5 h-3.5" /> Upload Contract
        </Link>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type="search"
            className="input pl-9"
            placeholder="Search contracts, clients, services, or current state…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search contracts"
          />
        </div>
      </div>

      {debouncedSearch && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-ink-100 flex items-center justify-between">
            <div className="font-serif text-lg text-ink-900">Search results</div>
            <div className="text-xs text-ink-400">
              {searching ? 'Searching…' : `${searchResults.length} match${searchResults.length === 1 ? '' : 'es'}`}
            </div>
          </div>
          {searching ? (
            <div className="py-10 flex justify-center text-ink-400">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-ink-400">
              No contracts match “{debouncedSearch}”.
            </div>
          ) : (
            <div className="divide-y divide-ink-50">
              {searchResults.slice(0, 8).map((c) => {
                const status = c.computed_status || c.status;
                const step = c.pipeline_step || 'Initiated';
                return (
                  <Link
                    key={c.id}
                    href={`/contracts/${c.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-ink-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink-900 truncate">{c.client_name}</div>
                      <div className="text-xs text-ink-400 mt-0.5 truncate">{c.service_type || c.contract_name}</div>
                    </div>
                    <span className={`badge text-[11px] ${pipelineStepClass(step)}`}>{step}</span>
                    <span className={`badge text-[11px] ${statusColor(status)}`}>{statusLabel(status)}</span>
                    <ChevronRight className="w-4 h-4 text-ink-300 flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
          {searchResults.length > 8 && (
            <div className="px-5 py-3 border-t border-ink-100">
              <Link
                href={`/contracts?q=${encodeURIComponent(debouncedSearch)}`}
                className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                View all results <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Contracts" value={s?.total_contracts ?? 0} href="/contracts" />
        <StatCard label="Active" value={s?.active_contracts ?? 0} href="/contracts?status=active" />
        <StatCard
          label="Expiring Soon"
          value={s?.expiring_in_30_days ?? 0}
          sub="Within 30 days"
          href="/contracts?status=expiring_soon"
        />
        <StatCard label="Expired" value={s?.expired_contracts ?? 0} href="/contracts?status=expired" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Clients" value={s?.total_clients ?? 0} href="/clients" />
        <StatCard label="Paused" value={s?.paused_contracts ?? 0} href="/contracts?status=paused" />
        <StatCard
          label="Expiring in 60 days"
          value={s?.expiring_in_60_days ?? 0}
          sub="Needs attention"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-serif text-lg text-ink-900">Expiry Trend</div>
              <div className="text-xs text-ink-400">Monthly contract expirations</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={charts?.monthly_expiry_trend ?? []}>
              <defs>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7a382c" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7a382c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="count" stroke="#7a382c" fill="url(#expGrad)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="font-serif text-lg text-ink-900 mb-1">Service Types</div>
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

      <div className="card">
        <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
          <div>
            <div className="font-serif text-lg text-ink-900">Upcoming Renewals</div>
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
                    <div className="text-sm font-medium text-ink-900 truncate">{c.client_name || c.contract_name}</div>
                    <div className="text-xs text-ink-400 mt-0.5 truncate">{c.contract_name}</div>
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
