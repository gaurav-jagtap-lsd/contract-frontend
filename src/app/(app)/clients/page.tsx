'use client';
import { useEffect, useState, useCallback } from 'react';
import { clientsApi } from '@/lib/api';
import type { Client } from '@/types';
import { Users, Plus, Search, Trash2, Pause, Play, Mail, Loader2, X, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

function ClientModal({
  client,
  onClose,
  onSave,
}: {
  client?: Client;
  onClose: () => void;
  onSave: () => void;
}) {
  const isEdit = !!client;
  const [form, setForm] = useState({
    client_name: client?.client_name || '',
    account_manager: client?.account_manager || '',
    primary_reminder_email: client?.primary_reminder_email || '',
    secondary_reminder_email: client?.secondary_reminder_email || '',
    cc_emails: client?.cc_emails?.join(', ') || '',
    notes: client?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.client_name.trim()) { toast.error('Client name is required.'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        cc_emails: form.cc_emails.split(',').map((e) => e.trim()).filter(Boolean),
      };
      if (isEdit) {
        await clientsApi.update(client!.id, payload);
        toast.success('Client updated.');
      } else {
        await clientsApi.create(payload);
        toast.success('Client created.');
      }
      onSave();
      onClose();
    } catch {
      toast.error('Failed to save client.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <h2 className="text-base font-semibold text-ink-900">{isEdit ? 'Edit Client' : 'New Client'}</h2>
          <button onClick={onClose} className="p-1.5 text-ink-400 hover:text-ink-700 hover:bg-ink-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Client Name *</label>
            <input className="input" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="e.g. Enphase Energy" />
          </div>
          <div>
            <label className="label">Account Manager</label>
            <input className="input" value={form.account_manager} onChange={(e) => setForm({ ...form, account_manager: e.target.value })} placeholder="Name of account manager" />
          </div>
          <div>
            <label className="label">Primary Reminder Email</label>
            <input className="input" type="email" value={form.primary_reminder_email} onChange={(e) => setForm({ ...form, primary_reminder_email: e.target.value })} placeholder="primary@client.com" />
          </div>
          <div>
            <label className="label">Secondary Reminder Email</label>
            <input className="input" type="email" value={form.secondary_reminder_email} onChange={(e) => setForm({ ...form, secondary_reminder_email: e.target.value })} placeholder="secondary@client.com" />
          </div>
          <div>
            <label className="label">CC Emails (comma-separated)</label>
            <input className="input" value={form.cc_emails} onChange={(e) => setForm({ ...form, cc_emails: e.target.value })} placeholder="cc1@email.com, cc2@email.com" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input h-16 resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any internal notes…" />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : isEdit ? 'Save Changes' : 'Create Client'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; client?: Client }>({ open: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clientsApi.list();
      setClients(res.data.data.clients);
    } catch {
      toast.error('Failed to load clients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter((c) =>
    !search ||
    c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.account_manager?.toLowerCase().includes(search.toLowerCase()) ||
    c.primary_reminder_email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? All associated contracts will be unlinked.`)) return;
    try {
      await clientsApi.delete(id);
      toast.success('Client deleted.');
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error('Failed to delete client.');
    }
  };

  const handlePauseResume = async (c: Client) => {
    try {
      if (c.is_paused) {
        await clientsApi.resume(c.id);
        toast.success('Client resumed. All reminders re-activated.');
      } else {
        const reason = prompt('Reason for pausing all reminders for this client:');
        if (!reason) return;
        await clientsApi.pause(c.id, reason);
        toast.success('All reminders paused for this client.');
      }
      load();
    } catch {
      toast.error('Action failed.');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {modal.open && (
        <ClientModal
          client={modal.client}
          onClose={() => setModal({ open: false })}
          onSave={load}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="page-header">Clients</div>
          <div className="page-subtitle">Manage client profiles and reminder settings.</div>
        </div>
        <button onClick={() => setModal({ open: true })} className="btn-primary">
          <Plus className="w-4 h-4" /> New Client
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="card py-16 flex flex-col items-center gap-3 text-ink-400">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          <span className="text-sm">Loading clients…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 flex flex-col items-center gap-3">
          <Users className="w-10 h-10 text-ink-200" />
          <div className="text-sm font-medium text-ink-500">
            {clients.length === 0 ? 'No clients yet.' : 'No clients match your search.'}
          </div>
          {clients.length === 0 && (
            <button onClick={() => setModal({ open: true })} className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" /> Add your first client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className={cn('card p-5 group hover:shadow-card-hover transition-shadow', c.is_paused ? 'opacity-75' : '')}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                    {getInitials(c.client_name)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink-900">{c.client_name}</div>
                    {c.account_manager && (
                      <div className="text-xs text-ink-400 mt-0.5">{c.account_manager}</div>
                    )}
                  </div>
                </div>
                {c.is_paused && (
                  <span className="badge bg-amber-100 text-amber-700 border-amber-200 text-[10px]">Paused</span>
                )}
              </div>

              {c.primary_reminder_email && (
                <div className="flex items-center gap-2 text-xs text-ink-500 mb-1">
                  <Mail className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
                  <span className="truncate">{c.primary_reminder_email}</span>
                </div>
              )}
              {c.secondary_reminder_email && (
                <div className="flex items-center gap-2 text-xs text-ink-500 mb-1">
                  <Mail className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
                  <span className="truncate">{c.secondary_reminder_email}</span>
                </div>
              )}
              {(c.cc_emails?.length ?? 0) > 0 && (
                <div className="text-xs text-ink-400 mt-1">+{c.cc_emails.length} CC email{c.cc_emails.length > 1 ? 's' : ''}</div>
              )}

              {c.notes && (
                <div className="mt-3 text-xs text-ink-400 line-clamp-2 border-t border-ink-50 pt-3">{c.notes}</div>
              )}

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-ink-50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setModal({ open: true, client: c })}
                  className="p-1.5 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handlePauseResume(c)}
                  className="p-1.5 text-ink-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title={c.is_paused ? 'Resume reminders' : 'Pause reminders'}
                >
                  {c.is_paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.client_name)}
                  className="p-1.5 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
