'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { contractsApi } from '@/lib/api';
import type { Contract, ContractStatus, ContractComment } from '@/types';
import { formatDate, statusColor, statusLabel, daysRemaining } from '@/lib/utils';
import {
  Plus, Search, Eye, Pause, Play, Trash2, Loader2, FileText, Edit2, Upload,
  ShieldCheck, Camera, CheckCircle, X, MessageSquare, Send,
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

/** Inline PH Approval quick-action modal for a row */
function PHApprovalModal({
  contractId,
  onDone,
  onClose,
}: {
  contractId: string;
  onDone: () => void;
  onClose: () => void;
}) {
  const [phType, setPhType] = useState<'mail' | 'screenshot'>('mail');
  const [phImage, setPhImage] = useState<File | null>(null);
  const [phEmailBody, setPhEmailBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (phType === 'screenshot' && !phImage) {
      toast.error('Please select a screenshot image.');
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('ph_approval_type', phType);
      if (phType === 'screenshot' && phImage) form.append('ph_approval_image', phImage);
      if (phEmailBody.trim()) form.append('ph_approval_email_body', phEmailBody.trim());
      await contractsApi.phApproval(contractId, form);
      toast.success('PH approval recorded! 30-day timer started.');
      onDone();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record PH approval.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="absolute right-0 top-full mt-1 z-50 w-80 card p-4 shadow-xl border border-ink-200 bg-white animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-ink-900 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-yellow-500" /> Mark PH Approved
        </span>
        <button onClick={onClose} className="text-ink-400 hover:text-ink-600 p-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Type toggle */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => { setPhType('mail'); setPhImage(null); }}
          className={cn(
            'flex-1 text-xs py-1.5 rounded-lg border font-medium transition-all',
            phType === 'mail' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-ink-600 border-ink-200'
          )}
        >
          ✉ Mail
        </button>
        <button
          onClick={() => setPhType('screenshot')}
          className={cn(
            'flex-1 text-xs py-1.5 rounded-lg border font-medium transition-all flex items-center justify-center gap-1',
            phType === 'screenshot' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-ink-600 border-ink-200'
          )}
        >
          <Camera className="w-3 h-3" /> Screenshot
        </button>
      </div>
      {/* Screenshot file picker */}
      {phType === 'screenshot' && (
        <div className="mb-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            className="hidden"
            onChange={(e) => setPhImage(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border border-dashed border-ink-300 rounded-lg py-2 text-xs text-ink-400 hover:border-brand-400 hover:text-brand-500 transition-colors"
          >
            {phImage ? `✓ ${phImage.name}` : 'Click to select screenshot'}
          </button>
        </div>
      )}
      {/* Email body textarea — optional for both types */}
      <div className="mb-3">
        <label className="text-[11px] font-medium text-ink-500 mb-1 block">
          Approval Email <span className="text-ink-300 font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          placeholder="Paste approval email here…"
          value={phEmailBody}
          onChange={(e) => setPhEmailBody(e.target.value)}
          className="w-full text-xs rounded-lg border border-ink-200 p-2 text-ink-800 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none bg-white"
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={submitting || (phType === 'screenshot' && !phImage)}
        className="btn-primary w-full justify-center text-xs disabled:opacity-50"
      >
        {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
        {submitting ? 'Saving…' : 'Confirm PH Approval'}
      </button>
    </div>
  );
}

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
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] animate-fade-in"
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
              <div key={c.id} className="group bg-ink-50 rounded-xl px-3.5 py-3 border border-ink-100">
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
            className="w-full text-sm rounded-xl border border-ink-200 p-3 text-ink-800 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none bg-white"
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') === 'ph_pending' ? '' : (searchParams.get('status') || '')
  );
  const [showPHPending, setShowPHPending] = useState(searchParams.get('status') === 'ph_pending');
  const [phModalFor, setPhModalFor] = useState<string | null>(null);
  const [commentsModalFor, setCommentsModalFor] = useState<{ id: string; name: string } | null>(null);


  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await contractsApi.list(statusFilter ? { status: statusFilter } : {});
      setContracts(res.data.data.contracts);
    } catch {
      toast.error('Failed to load contracts.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  // Filtered list
  const filtered = contracts.filter((c) => {
    const matchesSearch = !search ||
      c.contract_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.service_type?.toLowerCase().includes(search.toLowerCase());

    const matchesPHPending = !showPHPending || (c.ph_approved && !c.main_contract_uploaded);

    return matchesSearch && matchesPHPending;
  });

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

  const phPendingCount = contracts.filter((c) => c.ph_approved && !c.main_contract_uploaded).length;

  return (
    <>
    <div className="space-y-5 animate-fade-in">
      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <div className="page-header">Contracts</div>
          <div className="page-subtitle">Manage and track all client agreements.</div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/upload"
            className="btn-secondary text-xs"
            title="Upload PDF or image and let AI extract contract details"
          >
            <Upload className="w-3.5 h-3.5 text-brand-600" /> Upload (AI)
          </Link>
          <Link
            href="/upload?mode=manual"
            className="btn-primary text-xs"
            title="Create a contract and enter details manually"
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
              type="text"
              className="input pl-9"
              placeholder="Search contracts, clients, services…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setShowPHPending(false); }}
                className={cn(
                  'px-3 py-2 text-xs font-medium rounded-lg border transition-all',
                  !showPHPending && statusFilter === f.value
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
                )}
              >
                {f.label}
              </button>
            ))}
            {/* PH Pending filter */}
            <button
              onClick={() => { setShowPHPending((v) => !v); setStatusFilter(''); }}
              className={cn(
                'px-3 py-2 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5',
                showPHPending
                  ? 'bg-yellow-500 text-white border-yellow-500'
                  : 'bg-white text-ink-600 border-ink-200 hover:border-yellow-300 hover:text-yellow-700'
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              PH Pending
              {phPendingCount > 0 && (
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  showPHPending ? 'bg-white text-yellow-600' : 'bg-yellow-100 text-yellow-700'
                )}>
                  {phPendingCount}
                </span>
              )}
            </button>
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
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-ink-400">
            <FileText className="w-10 h-10 text-ink-200" />
            <div className="text-sm font-medium text-ink-500">
              {contracts.length === 0 ? 'No contracts yet.' : 'No contracts match your filters.'}
            </div>
            {contracts.length === 0 && (
              <div className="flex items-center gap-2 mt-1">
                <Link href="/upload" className="btn-secondary text-xs">
                  <Upload className="w-3.5 h-3.5 text-brand-600" /> Upload (AI)
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
                  <th className="table-header">Contract</th>
                  <th className="table-header">Client</th>
                  <th className="table-header hidden md:table-cell">Start</th>
                  <th className="table-header">End</th>
                  <th className="table-header hidden lg:table-cell">Services</th>
                  <th className="table-header hidden lg:table-cell">Service Dates</th>
                  <th className="table-header">Status</th>
                  <th className="table-header hidden md:table-cell">Days Left</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {filtered.map((c) => {
                  const status = c.computed_status || c.status;
                  const days = c.days_remaining ?? daysRemaining(c.end_date);
                  const isPHPending = c.ph_approved && !c.main_contract_uploaded;
                  const isPHComplete = c.ph_approved && c.main_contract_uploaded;

                  return (
                    <tr key={c.id} className="hover:bg-ink-50/50 transition-colors group">
                      <td className="table-cell">
                        <div className="font-medium text-ink-900 text-sm truncate max-w-[160px]">{c.contract_name}</div>
                        {c.service_type && <div className="text-xs text-ink-400 mt-0.5">{c.service_type}</div>}
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-ink-700 truncate max-w-[120px]">{c.client_name}</div>
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
                        <div className="flex flex-col gap-1">
                          <span className={`badge ${statusColor(status)}`}>{statusLabel(status)}</span>
                          {/* PH badges */}
                          {isPHPending && (
                            <span className="badge bg-yellow-100 text-yellow-700 border-yellow-200 text-[10px] flex items-center gap-0.5 w-fit">
                              <ShieldCheck className="w-2.5 h-2.5" /> PH Pending
                            </span>
                          )}
                          {isPHComplete && (
                            <span className="badge bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] flex items-center gap-0.5 w-fit">
                              <CheckCircle className="w-2.5 h-2.5" /> PH Done
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell hidden md:table-cell">
                        {days !== null ? (
                          <span className={cn('text-sm font-medium', days < 0 ? 'text-red-500' : days <= 30 ? 'text-orange-500' : 'text-ink-600')}>
                            {days < 0 ? `${Math.abs(days)}d ago` : `${days}d`}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative">
                          <Link href={`/contracts/${c.id}`} className="p-1.5 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link href={`/contracts/${c.id}/edit`} className="p-1.5 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          {/* Comments quick-action */}
                          <button
                            onClick={() => setCommentsModalFor({ id: c.id, name: c.contract_name })}
                            className="p-1.5 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Comments"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          {/* PH Approval quick-action */}
                          {!c.ph_approved && (
                            <div className="relative">
                              <button
                                onClick={() => setPhModalFor(phModalFor === c.id ? null : c.id)}
                                className="p-1.5 text-ink-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                title="Mark PH Approved"
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </button>
                              {phModalFor === c.id && (
                                <PHApprovalModal
                                  contractId={c.id}
                                  onDone={() => { setPhModalFor(null); load(); }}
                                  onClose={() => setPhModalFor(null)}
                                />
                              )}
                            </div>
                          )}
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
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-ink-100 text-xs text-ink-400">
            Showing {filtered.length} of {contracts.length} contracts
            {showPHPending && phPendingCount > 0 && (
              <span className="ml-2 text-yellow-600 font-medium">· {phPendingCount} PH pending upload</span>
            )}
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


