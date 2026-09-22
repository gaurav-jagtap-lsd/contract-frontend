'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { contractsApi } from '@/lib/api';
import type { Contract, ContractComment, PipelineStep } from '@/types';
import { PIPELINE_STEPS } from '@/types';
import { formatDate, statusColor, statusLabel, daysRemaining, pipelineStepClass } from '@/lib/utils';
import {
  Plus, Search, Eye, Pause, Play, Trash2, Loader2, FileText, Edit2, Upload,
  X, MessageSquare, Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';


const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Expiring Soon', value: 'expiring_soon' },
  { label: 'Expired', value: 'expired' },
  { label: 'Paused', value: 'paused' },
];

/** Universal Comments modal for a contract row */
function CommentsModal({
  contractId,
  contractName,
  onClose,
}: {
  contractId: string;
  contractName: string;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<ContractComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadComments = async () => {
    try {
      const res = await contractsApi.getComments(contractId);
      setComments(res.data.data.comments ?? []);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadComments(); }, [contractId]);

  const handleAdd = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await contractsApi.addComment(contractId, text.trim());
      setText('');
      const newComment = res?.data?.data?.comment;
      if (newComment) {
        setComments((prev) => [newComment, ...prev.filter((c) => c.id !== newComment.id)]);
      }
      await loadComments();
      toast.success('Comment added.');
    } catch {
      toast.error('Failed to add comment.');
    } finally {
      setSubmitting(false);
    }
  };


  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    setDeletingId(commentId);
    try {
      await contractsApi.deleteComment(contractId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      toast.error('Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-sm shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-500" />
              <span className="text-sm font-semibold text-ink-900">Comments</span>
              {comments.length > 0 && (
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-600">
                  {comments.length}
                </span>
              )}
            </div>
            <div className="text-xs text-ink-400 mt-0.5 truncate max-w-[280px]">{contractName}</div>
          </div>
          <button onClick={onClose} className="p-1.5 text-ink-400 hover:text-ink-600 rounded-lg hover:bg-ink-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2 text-ink-400">
              <MessageSquare className="w-8 h-8 text-ink-200" />
              <p className="text-sm">No comments yet.</p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="group bg-ink-50 rounded-sm px-3.5 py-3 border border-ink-100">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-ink-800 leading-relaxed flex-1 whitespace-pre-wrap">{c.text}</p>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-ink-300 hover:text-red-500 flex-shrink-0"
                    title="Delete"
                  >
                    {deletingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-[10px] text-ink-400 mt-1.5">{formatDate(c.created_at)}</div>
              </div>
            ))
          )}
        </div>

        {/* Add comment */}
        <div className="px-5 py-4 border-t border-ink-100 space-y-2">
          <textarea
            rows={3}
            placeholder="Write a comment… (Ctrl+Enter to post)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd(); }}
            className="w-full text-sm rounded-sm border border-ink-200 p-3 text-ink-800 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none bg-white"
          />
          <button
            onClick={handleAdd}
            disabled={submitting || !text.trim()}
            className="btn-primary w-full justify-center text-sm disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Posting…' : 'Post Comment'}
          </button>
        </div>
      </div>
    </div>
  );
}



export default function ContractsPage() {
  const searchParams = useSearchParams();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('q')?.trim() || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [commentsModalFor, setCommentsModalFor] = useState<{ id: string; name: string } | null>(null);
  const [updatingStepId, setUpdatingStepId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: { status?: string; search?: string } = {};
      if (statusFilter) params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await contractsApi.list(params);
      setContracts(res.data.data.contracts);
    } catch {
      toast.error('Failed to load contracts.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await contractsApi.delete(id);
      toast.success('Contract deleted.');
      setContracts((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error('Failed to delete contract.');
    }
  };

  const handlePause = async (id: string, isPaused: boolean) => {
    try {
      if (isPaused) {
        await contractsApi.resume(id);
        toast.success('Contract resumed.');
      } else {
        const reason = prompt('Reason for pausing reminders:');
        if (!reason) return;
        await contractsApi.pause(id, reason);
        toast.success('Contract paused.');
      }
      load();
    } catch {
      toast.error('Action failed.');
    }
  };

  const handleStepChange = async (id: string, pipeline_step: PipelineStep) => {
    const previous = contracts.find((c) => c.id === id)?.pipeline_step;
    setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, pipeline_step } : c)));
    setUpdatingStepId(id);
    try {
      await contractsApi.update(id, { pipeline_step });
    } catch {
      setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, pipeline_step: previous } : c)));
      toast.error('Failed to update step.');
    } finally {
      setUpdatingStepId(null);
    }
  };

  return (
    <>
    <div className="space-y-5 animate-fade-in">
      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="page-header">Contracts</div>
          <div className="page-subtitle">Manage and track all client agreements.</div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/upload"
            className="btn-secondary text-xs"
            title="Upload a PDF or image and extract contract details with AI"
          >
            <Upload className="w-3.5 h-3.5" /> Upload (AI)
          </Link>
          <Link
            href="/upload?mode=manual"
            className="btn-primary text-xs"
            title="Create a contract and enter the details manually"
          >
            <Plus className="w-3.5 h-3.5" /> Fill Manually
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="search"
              className="input pl-9"
              placeholder="Search contracts, clients, services…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search contracts"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  'px-3 py-2 text-xs font-medium rounded-lg border transition-all',
                  statusFilter === f.value
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-ink-400">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            <span className="text-sm">Loading contracts…</span>
          </div>
        ) : contracts.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-ink-400">
            <FileText className="w-10 h-10 text-ink-200" />
            <div className="text-sm font-medium text-ink-500">
              {debouncedSearch || statusFilter
                ? 'No contracts match your filters.'
                : 'No contracts yet.'}
            </div>
            {!debouncedSearch && !statusFilter && (
              <div className="flex items-center gap-2 mt-1">
                <Link href="/upload" className="btn-secondary text-xs">
                  <Upload className="w-3.5 h-3.5" /> Upload (AI)
                </Link>
                <Link href="/upload?mode=manual" className="btn-primary text-xs">
                  <Plus className="w-3.5 h-3.5" /> Fill Manually
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-ink-50 border-b border-ink-100">
                  <th className="table-header">Client</th>
                  <th className="table-header hidden md:table-cell">Start</th>
                  <th className="table-header">End</th>
                  <th className="table-header hidden lg:table-cell">Services</th>
                  <th className="table-header hidden lg:table-cell">Service Dates</th>
                  <th className="table-header">Status</th>
                  <th className="table-header hidden md:table-cell">Days Left</th>
                  <th className="table-header">Current State</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {contracts.map((c) => {
                  const status = c.computed_status || c.status;
                  const days = c.days_remaining ?? daysRemaining(c.end_date);
                  const step = (c.pipeline_step && PIPELINE_STEPS.includes(c.pipeline_step as PipelineStep)
                    ? c.pipeline_step
                    : 'Initiated') as PipelineStep;

                  return (
                    <tr key={c.id} className="hover:bg-ink-50/50 transition-colors group">
                      <td className="table-cell">
                        <div className="font-medium text-ink-900 text-sm truncate max-w-[180px]">{c.client_name}</div>
                        {c.service_type && <div className="text-xs text-ink-400 mt-0.5">{c.service_type}</div>}
                      </td>
                      <td className="table-cell hidden md:table-cell text-ink-500">{formatDate(c.start_date)}</td>
                      <td className="table-cell">
                        <span className={cn('text-sm', days !== null && days <= 30 && days >= 0 ? 'text-orange-600 font-medium' : 'text-ink-600')}>
                          {formatDate(c.end_date)}
                        </span>
                      </td>
                      <td className="table-cell hidden lg:table-cell">
                        {(c.services?.length ?? 0) > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            {c.services?.slice(0, 3).map((s, i) => (
                              <div key={i} className="h-[22px] flex items-center">
                                <span className="badge bg-brand-50 text-brand-700 border-brand-100 text-[11px] truncate max-w-[180px]" title={s.service_name}>
                                  {s.service_name}
                                </span>
                              </div>
                            ))}
                            {(c.services?.length ?? 0) > 3 && (
                              <span className="badge bg-ink-100 text-ink-500 border-ink-200 text-[11px] w-fit">
                                +{c.services.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-ink-300 text-xs italic">—</span>
                        )}
                      </td>
                      <td className="table-cell hidden lg:table-cell">
                        {(c.services?.length ?? 0) > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            {c.services?.slice(0, 3).map((s, i) => (
                              <div key={i} className="h-[22px] flex items-center text-[11px] text-ink-600 whitespace-nowrap font-medium">
                                {s.start_date || s.end_date ? (
                                  <span>
                                    {s.start_date ? formatDate(s.start_date) : '—'} — {s.end_date ? formatDate(s.end_date) : '—'}
                                  </span>
                                ) : (
                                  <span className="text-ink-300 italic font-normal">—</span>
                                )}
                              </div>
                            ))}
                            {(c.services?.length ?? 0) > 3 && (
                              <div className="h-[22px] flex items-center text-[11px] text-ink-400 italic">
                                +{c.services.length - 3} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-ink-300 text-xs italic">—</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${statusColor(status)}`}>{statusLabel(status)}</span>
                      </td>
                      <td className="table-cell hidden md:table-cell">
                        {days !== null ? (
                          <span className={cn('text-sm font-medium', days < 0 ? 'text-red-500' : days <= 30 ? 'text-orange-500' : 'text-ink-600')}>
                            {days < 0 ? `${Math.abs(days)}d ago` : `${days}d`}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="table-cell">
                        <select
                          aria-label={`Current state for ${c.client_name}`}
                          className={cn(
                            'input py-1.5 pr-8 text-xs w-[170px] font-medium',
                            pipelineStepClass(step)
                          )}
                          value={step}
                          disabled={updatingStepId === c.id}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStepChange(c.id, e.target.value as PipelineStep)}
                        >
                          {PIPELINE_STEPS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center justify-end gap-0.5">
                          <Link href={`/contracts/${c.id}`} className="p-1.5 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link href={`/contracts/${c.id}/edit`} className="p-1.5 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setCommentsModalFor({ id: c.id, name: c.contract_name })}
                            className="p-1.5 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Comments"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePause(c.id, c.is_paused)}
                            className="p-1.5 text-ink-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title={c.is_paused ? 'Resume' : 'Pause reminders'}
                          >
                            {c.is_paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.contract_name)}
                            className="p-1.5 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && contracts.length > 0 && (
          <div className="px-4 py-3 border-t border-ink-100 text-xs text-ink-400">
            Showing {contracts.length} contracts
          </div>
        )}
      </div>
    </div>

    {/* Universal Comments Modal */}
    {commentsModalFor && (
      <CommentsModal
        contractId={commentsModalFor.id}
        contractName={commentsModalFor.name}
        onClose={() => setCommentsModalFor(null)}
      />
    )}
    </>
  );
}


