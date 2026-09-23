'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { contractsApi, remindersApi } from '@/lib/api';
import type { Contract, ContractComment } from '@/types';
import {
  formatDate, statusColor, statusLabel, daysRemaining, confidenceLabel,
} from '@/lib/utils';
import {
  ArrowLeft, Download, Trash2, Pause, Play, RefreshCw, ExternalLink, Bell,
  Calendar, Mail, Tag, FileText, AlertTriangle, CheckCircle, Clock, Loader2,
  X, MessageSquare, Send,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { canDelete, canWrite } from '@/lib/permissions';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

function FieldRow({ label, value, warn }: { label: string; value?: string | null; warn?: boolean }) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-ink-50 last:border-0">
      <div className="w-40 text-xs font-medium text-ink-500 pt-0.5 flex-shrink-0">{label}</div>
      <div className={cn('text-sm flex-1', warn ? 'text-amber-600' : 'text-ink-900')}>
        {value || <span className="text-ink-300 italic">Not specified</span>}
        {warn && <AlertTriangle className="w-3.5 h-3.5 inline ml-1.5 text-amber-500" />}
      </div>
    </div>
  );
}

export default function ContractDetailPage() {
  const { user } = useAuth();
  const write = canWrite(user?.role);
  const remove = canDelete(user?.role);
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState('');

  // Comments state
  const [comments, setComments] = useState<ContractComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);


  const load = async () => {
    try {
      const res = await contractsApi.get(id);
      setContract(res.data.data.contract);
    } catch {
      toast.error('We could not find that contract.');
      router.push('/contracts');
    } finally {
      setLoading(false);
    }
  };

  const loadFileUrl = async () => {
    try {
      const res = await contractsApi.fileUrl(id);
      setFileUrl(res.data.data.url);
    } catch {}
  };

  const loadComments = async () => {
    try {
      const res = await contractsApi.getComments(id);
      setComments(res.data.data.comments ?? []);
    } catch {}
  };

  useEffect(() => {
    load();
    loadFileUrl();
    loadComments();
  }, [id]);


  const handleDelete = async () => {
    if (!confirm(`Delete "${contract?.contract_name}"? This cannot be undone.`)) return;
    try {
      await contractsApi.delete(id);
      toast.success('Contract deleted.');
      router.push('/contracts');
    } catch {
      toast.error('We could not delete that contract. Please try again.');
    }
  };

  const handlePause = async () => {
    if (!contract) return;
    setActionLoading('pause');
    try {
      if (contract.is_paused) {
        await contractsApi.resume(id);
        toast.success('Contract resumed. Reminders are active.');
      } else {
        const reason = prompt('Reason for pausing reminders (required):');
        if (!reason) { setActionLoading(''); return; }
        await contractsApi.pause(id, reason);
        toast.success('Reminders paused.');
      }
      await load();
    } catch {
      toast.error('That action did not go through. Please try again.');
    } finally {
      setActionLoading('');
    }
  };

  const handleSendReminder = async () => {
    setActionLoading('remind');
    try {
      await remindersApi.sendManual(id);
      toast.success('Reminder email queued.');
    } catch {
      toast.error('We could not send that reminder. Please try again.');
    } finally {
      setActionLoading('');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) { toast.error('Comment cannot be empty.'); return; }
    setAddingComment(true);
    try {
      const res = await contractsApi.addComment(id, commentText.trim());
      setCommentText('');
      const newComment = res?.data?.data?.comment;
      if (newComment) {
        setComments((prev) => [newComment, ...prev.filter((c) => c.id !== newComment.id)]);
      }
      await loadComments();
      toast.success('Comment added.');
    } catch {
      toast.error('We could not add that comment. Please try again.');
    } finally {
      setAddingComment(false);
    }
  };


  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    setDeletingCommentId(commentId);
    try {
      await contractsApi.deleteComment(id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success('Comment deleted.');
    } catch {
      toast.error('We could not delete that comment. Please try again.');
    } finally {
      setDeletingCommentId(null);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!contract) return null;

  const status = contract.computed_status || contract.status;
  const days = contract.days_remaining ?? daysRemaining(contract.end_date);

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl">
      {/* Back + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => router.back()} className="btn-ghost text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          {fileUrl && (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
              <ExternalLink className="w-3.5 h-3.5" /> View Document
            </a>
          )}
          {write && (
          <button onClick={handleSendReminder} disabled={!!actionLoading} className="btn-secondary text-xs">
            {actionLoading === 'remind' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
            Send Reminder
          </button>
          )}
          {write && (
          <button onClick={handlePause} disabled={!!actionLoading} className="btn-secondary text-xs">
            {actionLoading === 'pause' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : contract.is_paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {contract.is_paused ? 'Resume' : 'Pause Reminders'}
          </button>
          )}
          {write && (
          <Link href={`/contracts/${id}/edit`} className="btn-secondary text-xs">
            Edit
          </Link>
          )}
          {remove && (
          <button onClick={handleDelete} className="btn-danger text-xs">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          )}
        </div>
      </div>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Client</div>
            <h1 className="text-xl font-bold text-ink-900 mt-0.5">{contract.client_name}</h1>
            <div className="text-sm text-ink-500 mt-1">{contract.contract_name}</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`badge text-sm px-3 py-1 ${statusColor(status)}`}>{statusLabel(status)}</span>
            {days !== null && (
              <span className={cn(
                'text-xs font-semibold px-2.5 py-1 rounded-lg',
                days < 0 ? 'bg-red-100 text-red-700' :
                days <= 30 ? 'bg-orange-100 text-orange-700' :
                days <= 60 ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700'
              )}>
                {days < 0 ? `Expired ${Math.abs(days)} days ago` : `${days} days remaining`}
              </span>
            )}
          </div>
        </div>

        {contract.is_paused && (
          <div className="mt-4 flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3">
            <Pause className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-amber-800">Reminders paused</div>
              {contract.pause_reason && <div className="text-xs text-amber-600 mt-0.5">{contract.pause_reason}</div>}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main contract details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Contract info */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-brand-500" />
              <h2 className="text-sm font-semibold text-ink-900">Contract Details</h2>
            </div>
            <FieldRow label="Contract Name" value={contract.contract_name} />
            <FieldRow label="Client" value={contract.client_name} />
            <FieldRow label="Vendor" value={contract.vendor_name} />
            <FieldRow label="Service Name" value={contract.service_name} />
            <FieldRow label="Service Type" value={contract.service_type} />
            <FieldRow label="Version" value={`v${contract.version}`} />
          </div>

          {/* Dates */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-500" />
                <h2 className="text-sm font-semibold text-ink-900">Dates</h2>
              </div>
              {contract.services?.some((s) => s.start_date || s.end_date) && (
                <span className="badge bg-brand-50 text-brand-700 border-brand-200 text-[11px]">
                  Derived from services
                </span>
              )}
            </div>
            <FieldRow
              label="Start Date"
              value={contract.start_date ? `${formatDate(contract.start_date)}` : null}
              warn={!contract.start_date}
            />
            <FieldRow
              label="End Date"
              value={contract.end_date ? `${formatDate(contract.end_date)}` : null}
              warn={!contract.end_date}
            />
            <FieldRow label="Effective Date" value={formatDate(contract.effective_date)} />
            <FieldRow label="Agreement Date" value={formatDate(contract.agreement_date)} />
            <FieldRow label="Scope Date" value={formatDate(contract.scope_date)} />
            <FieldRow label="Lock-in Period" value={contract.lock_in_period} />
            <FieldRow label="Notice Period" value={contract.notice_period} />
          </div>

          {/* Services */}
          {(contract.services?.length ?? 0) > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-brand-500" />
                  <h2 className="text-sm font-semibold text-ink-900">Services ({contract.services.length})</h2>
                </div>
                <Link
                  href={`/contracts/${id}/edit`}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Edit Services
                </Link>
              </div>
              <div className="space-y-3">
                {contract.services.map((s, i) => (
                  <div key={i} className="bg-ink-50 rounded-sm p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium text-ink-900">{s.service_name}</div>
                        {s.service_type && <div className="text-xs text-ink-500 mt-0.5">{s.service_type}</div>}
                        {s.description && <div className="text-xs text-ink-400 mt-1">{s.description}</div>}
                      </div>
                      {s.value && <div className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-lg flex-shrink-0">{s.value}</div>}
                    </div>
                    {(s.start_date || s.end_date) ? (
                      <div className="flex items-center gap-1.5 text-xs text-ink-500 mt-3 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
                        <span>
                          {s.start_date ? formatDate(s.start_date) : 'Start unassigned'} — {s.end_date ? formatDate(s.end_date) : 'End unassigned'}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-ink-300 italic mt-2">Dates not specified</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Renewal clause */}
          {contract.renewal_clause && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-ink-900 mb-3">Renewal Clause</h2>
              <p className="text-sm text-ink-600 leading-relaxed whitespace-pre-wrap">{contract.renewal_clause}</p>
            </div>
          )}

          {/* Notes */}
          {contract.notes && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-ink-900 mb-3">Notes</h2>
              <p className="text-sm text-ink-600 leading-relaxed">{contract.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">

          {/* Reminder emails */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-4 h-4 text-brand-500" />
              <h2 className="text-sm font-semibold text-ink-900">Reminder Emails</h2>
            </div>
            {(contract.email_ids?.length ?? 0) > 0 ? (
              <div className="space-y-2">
                {contract.email_ids.map((email, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-ink-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                    <span className="truncate">{email}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-ink-400">No emails configured.</div>
            )}
          </div>

          {/* Reminder status */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-brand-500" />
              <h2 className="text-sm font-semibold text-ink-900">Reminder Status</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Status</span>
                <span className={cn('font-medium', contract.is_paused ? 'text-amber-600' : 'text-emerald-600')}>
                  {contract.is_paused ? 'Paused' : 'Active'}
                </span>
              </div>
              {contract.is_snoozed && contract.snooze_until && (
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">Snoozed until</span>
                  <span className="text-ink-700">{formatDate(contract.snooze_until)}</span>
                </div>
              )}
            </div>
          </div>

          {/* File */}
          {contract.file_name && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-brand-500" />
                <h2 className="text-sm font-semibold text-ink-900">Document</h2>
              </div>
              <div className="text-xs text-ink-500 break-all mb-3">{contract.file_name}</div>
              {fileUrl && (
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full justify-center text-xs">
                  <ExternalLink className="w-3.5 h-3.5" /> Open Document
                </a>
              )}
            </div>
          )}

          {/* ── Comments ── */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-brand-500" />
              <h2 className="text-sm font-semibold text-ink-900">Comments</h2>
              {comments.length > 0 && (
                <span className="ml-auto text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-600">
                  {comments.length}
                </span>
              )}
            </div>

            {/* Existing comments list */}
            {comments.length > 0 ? (
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-0.5">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="group bg-ink-50 rounded-sm px-3 py-2.5 border border-ink-100"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-ink-800 leading-relaxed flex-1 whitespace-pre-wrap">{c.text}</p>
                      {remove && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        disabled={deletingCommentId === c.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-0.5 text-ink-300 hover:text-red-500"
                        title="Delete comment"
                      >
                        {deletingCommentId === c.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <X className="w-3 h-3" />}
                      </button>
                      )}
                    </div>
                    <div className="text-[10px] text-ink-400 mt-1.5">{formatDate(c.created_at)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-400 mb-4">No comments yet. Add one below.</p>
            )}

            {/* Add comment input */}
            {write && (
            <div className="space-y-2">
              <textarea
                rows={3}
                placeholder="Add a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddComment();
                }}
                className="w-full text-xs rounded-lg border border-ink-200 p-2.5 text-ink-800 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none bg-white"
              />
              <button
                onClick={handleAddComment}
                disabled={addingComment || !commentText.trim()}
                className="btn-primary w-full justify-center text-xs disabled:opacity-50"
              >
                {addingComment
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Send className="w-3.5 h-3.5" />}
                {addingComment ? 'Posting…' : 'Post Comment'}
              </button>
              <p className="text-[10px] text-ink-400 text-center">Ctrl+Enter to submit</p>
            </div>
            )}
          </div>



          {/* Metadata */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-ink-900 mb-3">Metadata</h2>
            <div className="space-y-2 text-xs text-ink-500">
              <div className="flex justify-between">
                <span>Created</span>
                <span>{formatDate(contract.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated</span>
                <span>{formatDate(contract.updated_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Version</span>
                <span>v{contract.version}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
