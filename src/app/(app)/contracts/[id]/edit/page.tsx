'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { contractsApi, clientsApi } from '@/lib/api';
import type { Contract, Client, ContractService } from '@/types';
import { computeContractDates } from '@/lib/utils';
import {
  ArrowLeft, Save, Plus, X, Loader2, Calendar, FileText, Tag, Mail,
  AlertTriangle, ChevronDown, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// ─── Options ──────────────────────────────────────────────────────────────────
const SERVICE_NAME_OPTIONS = [
  'GA4 Retainer (Web)',
  'GA4 Retainer (App)',
  'GA4 Retainer (App + Web)',
  'GA4 360 License',
  'GA4 One-Time Implementation',
  'SEO Retainer',
  'SEO Consulting',
  'Digital Marketing Retainer',
  'Social Media Management',
  'Performance Marketing',
  'Content Marketing',
  'Email Marketing',
  'PPC / Paid Media',
  'Other',
];

const SERVICE_TYPE_OPTIONS = [
  'Consultation & Support',
  'Implementation',
  'Retainer',
  'License',
  'One-Time Project',
  'Managed Services',
  'Analytics & Reporting',
  'SEO',
  'Paid Media',
  'Social Media',
  'Content',
  'Other',
];

function ComboSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  warn,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  warn?: boolean;
}) {
  const [custom, setCustom] = useState(!options.includes(value) && value !== '');

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '__custom__') {
      setCustom(true);
      onChange('');
    } else {
      setCustom(false);
      onChange(e.target.value);
    }
  };

  return (
    <div>
      <label className="label flex items-center gap-1.5">
        {label}
        {warn && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
      </label>
      {!custom ? (
        <div className="relative">
          <select
            className={cn('input appearance-none pr-8', warn ? 'border-amber-300' : '')}
            value={options.includes(value) ? value : ''}
            onChange={handleSelect}
          >
            <option value="">{placeholder || `— Select ${label} —`}</option>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
            <option value="__custom__">+ Type custom value…</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            className={cn('input flex-1', warn ? 'border-amber-300' : '')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter custom ${label.toLowerCase()}…`}
            autoFocus
          />
          <button
            type="button"
            onClick={() => { setCustom(false); onChange(''); }}
            className="px-3 py-2 text-xs text-ink-500 border border-ink-200 rounded-lg hover:bg-ink-50"
          >
            ← List
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, warn, type = 'text', placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  warn?: boolean; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="label flex items-center gap-1.5">
        {label}
        {warn && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
      </label>
      <input
        type={type}
        className={cn('input', warn ? 'border-amber-300 focus:ring-amber-500' : '')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export default function EditContractPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [contract, setContract] = useState<Contract | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    contract_name: '',
    client_id: '',
    vendor_name: '',
    service_name: '',
    service_type: '',
    start_date: '',
    end_date: '',
    lock_in_period: '',
    renewal_clause: '',
    notice_period: '',
    notes: '',
  });

  const [services, setServices] = useState<ContractService[]>([]);
  const [emails, setEmails] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [contractRes, clientsRes] = await Promise.all([
        contractsApi.get(id),
        clientsApi.list(),
      ]);
      const c: Contract = contractRes.data.data.contract;
      setContract(c);
      setClients(clientsRes.data.data.clients || []);

      const sList: ContractService[] = (c.services && c.services.length > 0)
        ? c.services.map((s) => ({
            service_name: s.service_name || '',
            service_type: s.service_type || '',
            value: s.value || '',
            start_date: s.start_date || '',
            end_date: s.end_date || '',
            description: s.description || '',
          }))
        : [{ service_name: c.service_name || '', service_type: c.service_type || '', description: '', value: '', start_date: c.start_date || '', end_date: c.end_date || '' }];

      const computed = computeContractDates(sList);

      setServices(sList);
      setEmails(c.email_ids?.length ? c.email_ids : ['']);
      setForm({
        contract_name: c.contract_name || '',
        client_id: c.client_id || '',
        vendor_name: c.vendor_name || '',
        service_name: c.service_name || '',
        service_type: c.service_type || '',
        start_date: computed.startDate || c.start_date || '',
        end_date: computed.endDate || c.end_date || '',
        lock_in_period: c.lock_in_period || '',
        renewal_clause: c.renewal_clause || '',
        notice_period: c.notice_period || '',
        notes: c.notes || '',
      });
    } catch {
      toast.error('Failed to load contract details.');
      router.push('/contracts');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateServicesAndDates = (next: ContractService[]) => {
    setServices(next);
    const { startDate, endDate } = computeContractDates(next);
    setForm((prev) => ({
      ...prev,
      start_date: startDate || prev.start_date,
      end_date: endDate || prev.end_date,
    }));
  };

  const updateService = (i: number, field: keyof ContractService, val: string) => {
    const next = [...services];
    next[i] = { ...next[i], [field]: val };
    updateServicesAndDates(next);
  };

  const addService = () => {
    const next = [
      ...services,
      { service_name: '', service_type: '', description: '', value: '', start_date: '', end_date: '' },
    ];
    setServices(next);
  };

  const removeService = (idx: number) => {
    const next = services.filter((_, i) => i !== idx);
    updateServicesAndDates(next);
  };

  const handleSave = async () => {
    if (!form.contract_name.trim()) {
      toast.error('Contract name is required.');
      return;
    }
    if (!form.client_id) {
      toast.error('Please select a client.');
      return;
    }
    if (!form.end_date) {
      toast.error('End date is required.');
      return;
    }

    setSaving(true);
    try {
      const validServices = services.filter((s) => s.service_name.trim());
      const payload = {
        ...form,
        email_ids: emails.filter(Boolean),
        services: validServices,
        service_name: validServices[0]?.service_name || form.service_name,
        service_type: validServices[0]?.service_type || form.service_type,
      };

      await contractsApi.update(id, payload);
      toast.success('Contract updated successfully!');
      router.push(`/contracts/${id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update contract.';
      toast.error(msg);
    } finally {
      setSaving(false);
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

  const hasServiceDates = services.some((s) => s.start_date || s.end_date);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="btn-ghost text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Contract
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/contracts/${id}`)} className="btn-secondary text-xs">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-xs px-4">
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
          </button>
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-ink-900">Edit Contract</h1>
        <p className="text-xs text-ink-500 mt-0.5">
          Update contract metadata, services, and service-level dates. Contract dates update automatically.
        </p>
      </div>

      {/* Client Assignment */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink-900 mb-3">Client Assignment</h3>
        <div>
          <label className="label">Client *</label>
          <select
            className="input"
            value={form.client_id}
            onChange={(e) => setForm({ ...form, client_id: e.target.value })}
          >
            <option value="">— Select client —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.client_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contract Info */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink-900 mb-4">Contract Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field
              label="Contract Name *"
              value={form.contract_name}
              onChange={(v) => setForm({ ...form, contract_name: v })}
              warn={!form.contract_name.trim()}
              placeholder="e.g. Jio Insurance Broking Implementation"
            />
          </div>
          <Field
            label="Vendor Name"
            value={form.vendor_name}
            onChange={(v) => setForm({ ...form, vendor_name: v })}
            placeholder="e.g. Logicserve Digital"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">Contract Dates</h3>
            <p className="text-xs text-ink-400 mt-0.5">
              Contract Start Date is automatically the earliest service start date, and Contract End Date is the latest service end date.
            </p>
          </div>
          {hasServiceDates && (
            <span className="badge bg-brand-50 text-brand-700 border-brand-200 text-xs">
              Auto-calculated from services
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label flex items-center justify-between">
              <span>Contract Start Date</span>
              {services.some((s) => s.start_date) && (
                <span className="text-[11px] text-brand-600 font-normal">Earliest service start</span>
              )}
            </label>
            <input
              type="date"
              className={cn('input', services.some((s) => s.start_date) ? 'bg-ink-50/60' : '')}
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="label flex items-center justify-between">
              <span>Contract End Date *</span>
              {services.some((s) => s.end_date) && (
                <span className="text-[11px] text-brand-600 font-normal">Latest service end</span>
              )}
            </label>
            <input
              type="date"
              className={cn('input', services.some((s) => s.end_date) ? 'bg-ink-50/60' : '', !form.end_date ? 'border-amber-300' : '')}
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
          <Field
            label="Lock-in Period"
            value={form.lock_in_period}
            onChange={(v) => setForm({ ...form, lock_in_period: v })}
            placeholder="e.g. 6 months"
          />
          <Field
            label="Notice Period"
            value={form.notice_period}
            onChange={(v) => setForm({ ...form, notice_period: v })}
            placeholder="e.g. 30 days"
          />
        </div>

        {form.renewal_clause !== undefined && (
          <div className="mt-4">
            <label className="label">Renewal Clause</label>
            <textarea
              className="input h-20 resize-none"
              value={form.renewal_clause}
              onChange={(e) => setForm({ ...form, renewal_clause: e.target.value })}
              placeholder="Terms for contract renewal…"
            />
          </div>
        )}
      </div>

      {/* Services with Dates */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">Services</h3>
            <p className="text-xs text-ink-400 mt-0.5">
              Each service has its own start and end dates. Add or modify services below.
            </p>
          </div>
          <button
            type="button"
            onClick={addService}
            className="btn-secondary text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Service
          </button>
        </div>

        {services.length === 0 ? (
          <div className="text-sm text-ink-400 text-center py-6 border-2 border-dashed border-ink-200 rounded-xl">
            No services attached. Click "Add Service" to add one.
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {services.map((s, i) => (
              <div key={i} className="bg-ink-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-600 uppercase tracking-wide">
                    Service {i + 1}
                  </span>
                  {services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(i)}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove service"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ComboSelect
                    label="Service Name"
                    value={s.service_name}
                    onChange={(v) => updateService(i, 'service_name', v)}
                    options={SERVICE_NAME_OPTIONS}
                    placeholder="— Select service name —"
                    warn={!s.service_name}
                  />

                  <ComboSelect
                    label="Service Type"
                    value={s.service_type}
                    onChange={(v) => updateService(i, 'service_type', v)}
                    options={SERVICE_TYPE_OPTIONS}
                    placeholder="— Select service type —"
                  />
                </div>

                {/* Service Start and End Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Service Start Date</label>
                    <input
                      type="date"
                      className="input text-sm"
                      value={s.start_date || ''}
                      onChange={(e) => updateService(i, 'start_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Service End Date</label>
                    <input
                      type="date"
                      className="input text-sm"
                      value={s.end_date || ''}
                      onChange={(e) => updateService(i, 'end_date', e.target.value)}
                    />
                  </div>
                </div>

                {/* Value / Cost */}
                <div>
                  <label className="label text-xs">Value / Cost</label>
                  <input
                    className="input text-sm"
                    value={s.value || ''}
                    onChange={(e) => updateService(i, 'value', e.target.value)}
                    placeholder="e.g. INR 75,000/month or ₹3,00,000 one-time"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="label text-xs">Description (optional)</label>
                  <input
                    className="input text-sm"
                    value={s.description || ''}
                    onChange={(e) => updateService(i, 'description', e.target.value)}
                    placeholder="Details or deliverables for this service…"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reminder emails */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">Renewal Reminder Emails</h3>
            <p className="text-xs text-ink-400 mt-0.5">Contacts who will receive automatic renewal notices.</p>
          </div>
          <button
            type="button"
            onClick={() => setEmails([...emails, ''])}
            className="btn-secondary text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Email
          </button>
        </div>
        <div className="space-y-2">
          {emails.map((email, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="email"
                className="input flex-1"
                value={email}
                placeholder="email@example.com"
                onChange={(e) => {
                  const next = [...emails];
                  next[i] = e.target.value;
                  setEmails(next);
                }}
              />
              {emails.length > 1 && (
                <button
                  type="button"
                  onClick={() => setEmails(emails.filter((_, idx) => idx !== i))}
                  className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="card p-5">
        <label className="label">Internal Notes (optional)</label>
        <textarea
          className="input h-20 resize-none"
          placeholder="Any internal notes about this contract…"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      {/* Footer action buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push(`/contracts/${id}`)}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-6"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving changes…</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}
