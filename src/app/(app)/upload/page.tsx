'use client';
import { useState, useCallback, useEffect, Suspense } from 'react';
import { useDropzone } from 'react-dropzone';
import { aiApi, contractsApi, clientsApi } from '@/lib/api';
import type { ExtractionResult, Client, ContractService } from '@/types';
import { formatBytes, confidenceColor, confidenceLabel, computeContractDates, friendlyError } from '@/lib/utils';
import {
  Upload, FileText, Loader2, CheckCircle, AlertTriangle, X, Plus,
  ArrowRight, ArrowLeft, Save, ChevronDown, Edit3, Paperclip,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

type Step = 'upload' | 'extracting' | 'review' | 'saving';

const EMPTY_MANUAL_RESULT: ExtractionResult = {
  extracted: {
    client_name: null,
    vendor_name: null,
    contract_name: null,
    service_name: null,
    service_type: null,
    start_date: null,
    end_date: null,
    effective_date: null,
    agreement_date: null,
    scope_date: null,
    schedule_date: null,
    annexure_date: null,
    execution_date: null,
    lock_in_period: null,
    renewal_clause: null,
    notice_period: null,
    email_ids: [],
    services: [],
    confidence_score: 1.0,
    extraction_notes: 'Manual entry',
    _extraction_success: true,
  },
  storage_path: '',
  file_name: '',
  file_size_bytes: 0,
  signed_url: '',
};

// ─── Service name options ─────────────────────────────────────────────────────
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

// ─── Combobox: dropdown with free-text fallback ───────────────────────────────
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

// ─── Simple text field ────────────────────────────────────────────────────────
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

// ─── Step 1: Upload Drop Zone ─────────────────────────────────────────────────
function UploadStep({
  onUpload,
  onManualEntry,
}: {
  onUpload: (file: File) => void;
  onManualEntry: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const onDrop = useCallback((accepted: File[]) => { if (accepted[0]) setFile(accepted[0]); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxFiles: 1, maxSize: 20 * 1024 * 1024,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Mode selection toggle */}
      <div className="flex p-1 bg-ink-100 rounded-sm max-w-md mx-auto border border-ink-200 shadow-inner">
        <button
          type="button"
          className="flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 bg-white text-brand-700 shadow-sm transition-all"
        >
          <Upload className="w-3.5 h-3.5" /> AI Document Upload
        </button>
        <button
          type="button"
          onClick={onManualEntry}
          className="flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 text-ink-600 hover:text-ink-900 transition-all"
        >
          <Edit3 className="w-3.5 h-3.5 text-ink-500" /> Fill Manually
        </button>
      </div>

      <div>
        <h2 className="text-xl text-ink-900">Upload Contract</h2>
        <p className="text-sm text-ink-500 mt-1">Upload a PDF or image. Gemini will extract the contract details. Review them before you save.</p>
      </div>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-sm p-12 text-center cursor-pointer transition-all',
          isDragActive ? 'border-brand-500 bg-brand-50' :
          file ? 'border-emerald-400 bg-emerald-50' :
          'border-ink-200 hover:border-brand-400 hover:bg-brand-50/30'
        )}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-sm bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <div className="font-semibold text-ink-900">{file.name}</div>
              <div className="text-sm text-ink-400 mt-0.5">{formatBytes(file.size)}</div>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="text-xs text-ink-400 hover:text-red-500 flex items-center gap-1 mt-1">
              <X className="w-3 h-3" /> Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-sm bg-ink-100 flex items-center justify-center">
              <Upload className="w-7 h-7 text-ink-400" />
            </div>
            <div>
              <div className="font-semibold text-ink-700">{isDragActive ? 'Drop it here…' : 'Drag & drop or click to upload'}</div>
              <div className="text-sm text-ink-400 mt-1">PDF, JPG, PNG — up to 20MB</div>
            </div>
          </div>
        )}
      </div>
      {file && (
        <div className="bg-brand-50 rounded-sm p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FileText className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-brand-900">AI Extraction Ready</div>
            <div className="text-xs text-brand-700 mt-0.5">Gemini will extract the client name, dates, services, and email addresses. Please review the result before saving.</div>
          </div>
        </div>
      )}
      <button onClick={() => file && onUpload(file)} disabled={!file} className="btn-primary w-full justify-center py-3">
        <ArrowRight className="w-4 h-4" /> Extract with AI
      </button>

      {/* Or fill manually */}
      <div className="flex items-center gap-3 pt-2">
        <div className="h-px bg-ink-200 flex-1" />
        <span className="text-xs uppercase tracking-wider text-ink-400 font-semibold">Or</span>
        <div className="h-px bg-ink-200 flex-1" />
      </div>

      <button
        type="button"
        onClick={onManualEntry}
        className="btn-secondary w-full justify-center py-3 text-sm font-semibold text-ink-800 hover:text-brand-600 hover:border-brand-300 transition-all"
      >
        <Edit3 className="w-4 h-4" /> Fill Contract Details Manually
      </button>
    </div>
  );
}

// ─── Step 3: Review + Edit ────────────────────────────────────────────────────
function ReviewStep({
  result, clients, onSave, onBack, saving, isManual,
}: {
  result: ExtractionResult; clients: Client[];
  onSave: (data: Record<string, unknown>) => void;
  onBack: () => void; saving: boolean; isManual?: boolean;
}) {
  const ext = result.extracted;

  const initialServices: ContractService[] = ext.services?.length
    ? ext.services.map((s) => ({
        ...s,
        value: s.value || '',
        start_date: s.start_date || '',
        end_date: s.end_date || '',
        description: s.description || '',
      }))
    : [{ service_name: '', service_type: '', description: '', value: '', start_date: '', end_date: '' }];

  const initialDates = computeContractDates(initialServices);

  const [services, setServices] = useState<ContractService[]>(initialServices);
  const [form, setForm] = useState({
    contract_name: ext.contract_name || '',
    client_id: '',
    vendor_name: ext.vendor_name || '',
    service_name: ext.service_name || '',
    service_type: ext.service_type || '',
    start_date: initialDates.startDate || ext.start_date || '',
    end_date: initialDates.endDate || ext.end_date || '',
    lock_in_period: ext.lock_in_period || '',
    renewal_clause: ext.renewal_clause || '',
    notice_period: ext.notice_period || '',
    notes: '',
  });
  const [emails, setEmails] = useState<string[]>(ext.email_ids.length ? ext.email_ids : ['']);
  const [newClientName, setNewClientName] = useState(ext.client_name || '');
  const [createClient, setCreateClient] = useState(false);

  useEffect(() => {
    const wanted = (ext.client_name || '').trim().toLowerCase();
    if (!wanted) return;
    const match = clients.find((c) => c.client_name.trim().toLowerCase() === wanted);
    if (!match) return;
    setForm((prev) => (prev.client_id ? prev : { ...prev, client_id: match.id }));
    setCreateClient(false);
  }, [clients, ext.client_name]);
  const [uploadedStoragePath, setUploadedStoragePath] = useState(result.storage_path || '');
  const [uploadedFileName, setUploadedFileName] = useState(result.file_name || '');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const confidence = ext.confidence_score;
  const warn = (v?: string | null) => !v;

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadingDoc(true);
    try {
      const res = await contractsApi.uploadFile(f);
      setUploadedStoragePath(res.data.data.storage_path);
      setUploadedFileName(res.data.data.file_name);
      toast.success('Document attached successfully!');
    } catch {
      toast.error('We could not attach that document. Please try again.');
    } finally {
      setUploadingDoc(false);
    }
  };

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

  const handleSave = () => {
    if (!form.end_date) { toast.error('End date is required.'); return; }
    if (!form.client_id && !createClient) { toast.error('Please select or create a client.'); return; }
    if (createClient && !newClientName.trim()) { toast.error('Client name is required.'); return; }
    if (!form.contract_name.trim()) { toast.error('Contract name is required.'); return; }
    onSave({
      ...form,
      client_name: createClient ? newClientName : clients.find((c) => c.id === form.client_id)?.client_name || '',
      email_ids: emails.filter(Boolean),
      services: services.filter((s) => s.service_name.trim()),
      storage_path: uploadedStoragePath || result.storage_path || '',
      file_name: uploadedFileName || result.file_name || '',
      _create_client: createClient,
      _new_client_name: newClientName,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Banner */}
      {isManual ? (
        <div className="card p-5 flex items-center gap-4 bg-brand-50 border-brand-200">
          <div className="w-12 h-12 rounded-sm bg-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Edit3 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-semibold text-brand-900">Manual Contract Entry</div>
            <div className="text-xs text-brand-700 mt-0.5">
              Fill in contract details, client, and individual service dates below. Overall Contract Start and End dates are automatically calculated from your services.
            </div>
          </div>
        </div>
      ) : (
        <div className={cn(
          'card p-4 flex items-center gap-4',
          confidence >= 0.85 ? 'bg-emerald-50 border-emerald-200' :
          confidence >= 0.65 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
        )}>
          <div className={`text-3xl font-bold ${confidenceColor(confidence)}`}>{Math.round(confidence * 100)}%</div>
          <div>
            <div className={`text-sm font-semibold ${confidenceColor(confidence)}`}>{confidenceLabel(confidence)} confidence extraction</div>
            <div className="text-xs text-ink-500 mt-0.5">{ext.extraction_notes || 'AI extracted the contract data. Please review and correct any fields before saving.'}</div>
          </div>
        </div>
      )}

      {/* Optional Document Attachment for Manual Entry */}
      {isManual && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold text-ink-900">Document Attachment (Optional)</h3>
              <p className="text-xs text-ink-400 mt-0.5">Attach a signed contract PDF or image if you have one.</p>
            </div>
            {uploadedFileName && (
              <span className="badge bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                Document Attached
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="file"
              id="manual-doc-input"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleDocUpload}
            />
            <label
              htmlFor="manual-doc-input"
              className={cn('btn-secondary text-xs cursor-pointer', uploadingDoc ? 'opacity-60 pointer-events-none' : '')}
            >
              {uploadingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
              {uploadedFileName ? 'Replace Document' : 'Attach PDF / Image'}
            </label>
            {uploadedFileName && (
              <span className="text-xs text-ink-600 truncate max-w-sm font-medium">
                {uploadedFileName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Client */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink-900 mb-4">Client Assignment</h3>
        <div className="flex gap-3 mb-3">
          <button onClick={() => setCreateClient(false)} className={cn('btn text-xs', !createClient ? 'btn-primary' : 'btn-secondary')}>Select Existing</button>
          <button onClick={() => setCreateClient(true)} className={cn('btn text-xs', createClient ? 'btn-primary' : 'btn-secondary')}><Plus className="w-3.5 h-3.5" /> Create New</button>
        </div>
        {createClient ? (
          <div>
            <label className="label flex items-center gap-1.5">New Client Name {warn(newClientName) && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}</label>
            <input type="text" className={cn('input', warn(newClientName) ? 'border-amber-300' : '')} value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="e.g. Aditya Birla Sun Life AMC" />
          </div>
        ) : (
          <div>
            <label className="label">Select Client</label>
            <select className="input" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
              <option value="">— Select client —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.client_name}</option>)}
            </select>
            {clients.length === 0 && <p className="text-xs text-amber-600 mt-1.5">No clients yet. Create a new one above.</p>}
          </div>
        )}
      </div>

      {/* Contract info */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink-900 mb-4">Contract Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Contract Name" value={form.contract_name} onChange={(v) => setForm({ ...form, contract_name: v })} warn={warn(form.contract_name)} placeholder="e.g. ABSLAMC GA4 Retainer Agreement" />
          </div>
          <Field label="Vendor Name" value={form.vendor_name} onChange={(v) => setForm({ ...form, vendor_name: v })} placeholder="e.g. Logicserve Digital" />
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
          {services.some((s) => s.start_date || s.end_date) && (
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
              className={cn('input', services.some((s) => s.start_date) ? 'bg-ink-50/60' : '', warn(form.start_date) ? 'border-amber-300' : '')}
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
              className={cn('input', services.some((s) => s.end_date) ? 'bg-ink-50/60' : '', warn(form.end_date) ? 'border-amber-300' : '')}
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
          <Field label="Lock-in Period" value={form.lock_in_period} onChange={(v) => setForm({ ...form, lock_in_period: v })} placeholder="e.g. 6 months" />
          <Field label="Notice Period" value={form.notice_period} onChange={(v) => setForm({ ...form, notice_period: v })} placeholder="e.g. 30 days" />
        </div>
        {form.renewal_clause && (
          <div className="mt-4">
            <label className="label">Renewal Clause</label>
            <textarea className="input h-20 resize-none" value={form.renewal_clause} onChange={(e) => setForm({ ...form, renewal_clause: e.target.value })} />
          </div>
        )}
      </div>

      {/* Services — with dropdowns and individual start/end dates */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">Services</h3>
            <p className="text-xs text-ink-400 mt-0.5">Specify name, type, cost, and individual start and end dates for each service.</p>
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
          <div className="text-sm text-ink-400 text-center py-6 border-2 border-dashed border-ink-200 rounded-sm">
            No services yet. Click "Add Service" to add one.
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {services.map((s, i) => (
              <div key={i} className="bg-ink-50 rounded-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-600 uppercase tracking-wide">Service {i + 1}</span>
                  {services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(i)}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Service Name — dropdown */}
                  <ComboSelect
                    label="Service Name"
                    value={s.service_name}
                    onChange={(v) => updateService(i, 'service_name', v)}
                    options={SERVICE_NAME_OPTIONS}
                    placeholder="— Select service name —"
                    warn={!s.service_name}
                  />

                  {/* Service Type — dropdown */}
                  <ComboSelect
                    label="Service Type"
                    value={s.service_type}
                    onChange={(v) => updateService(i, 'service_type', v)}
                    options={SERVICE_TYPE_OPTIONS}
                    placeholder="— Select service type —"
                  />
                </div>

                {/* Service-level Start and End Dates */}
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

                {/* Value / Cost — always visible */}
                <div>
                  <label className="label text-xs">Value / Cost</label>
                  <input
                    className="input text-sm"
                    value={s.value || ''}
                    onChange={(e) => updateService(i, 'value', e.target.value)}
                    placeholder="e.g. INR 75,000/month or ₹3,00,000 one-time"
                  />
                </div>

                {/* Description — optional */}
                <div>
                  <label className="label text-xs">Description (optional)</label>
                  <input
                    className="input text-sm"
                    value={s.description || ''}
                    onChange={(e) => updateService(i, 'description', e.target.value)}
                    placeholder="Any additional notes about this service…"
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
            <p className="text-xs text-ink-400 mt-0.5">These contacts will receive renewal reminders automatically.</p>
          </div>
          <button onClick={() => setEmails([...emails, ''])} className="btn-secondary text-xs">
            <Plus className="w-3.5 h-3.5" /> Add Email
          </button>
        </div>
        <div className="space-y-2">
          {emails.map((email, i) => (
            <div key={i} className="flex gap-2">
              <input type="email" className="input flex-1" value={email} placeholder="email@example.com"
                onChange={(e) => { const next = [...emails]; next[i] = e.target.value; setEmails(next); }} />
              {emails.length > 1 && (
                <button onClick={() => setEmails(emails.filter((_, idx) => idx !== i))}
                  className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
        <textarea className="input h-20 resize-none" placeholder="Any internal notes about this contract…"
          value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Start over</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary px-6">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Contract</>}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
function UploadPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('upload');
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    clientsApi.list().then((r) => setClients(r.data.data.clients)).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchParams.get('mode') === 'manual') {
      setIsManual(true);
      setResult(EMPTY_MANUAL_RESULT);
      setStep('review');
    }
  }, [searchParams]);

  const handleStartManual = () => {
    setIsManual(true);
    setResult(EMPTY_MANUAL_RESULT);
    setStep('review');
  };

  const handleUpload = async (file: File) => {
    setIsManual(false);
    setStep('extracting');
    try {
      const res = await aiApi.extract(file);
      setResult(res.data.data);
      setStep('review');
    } catch (err: unknown) {
      toast.error(friendlyError(err, 'We could not read that document. You can still enter the details yourself.'));
      setStep('upload');
    }
  };

  const handleSave = async (formData: Record<string, unknown>) => {
    setSaving(true);
    try {
      let clientId = formData.client_id as string;
      if (formData._create_client) {
        const clientRes = await clientsApi.create({
          client_name: formData._new_client_name as string,
          primary_reminder_email: (formData.email_ids as string[])[0] || '',
        });
        clientId = clientRes.data.data.client.id;
      }
      const payload = {
        contract_name: formData.contract_name,
        client_id: clientId,
        vendor_name: formData.vendor_name,
        service_name: (formData.services as ContractService[])[0]?.service_name || formData.service_name,
        service_type: (formData.services as ContractService[])[0]?.service_type || formData.service_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        lock_in_period: formData.lock_in_period,
        renewal_clause: formData.renewal_clause,
        notice_period: formData.notice_period,
        email_ids: formData.email_ids,
        services: formData.services,
        notes: formData.notes,
        storage_path: formData.storage_path,
        file_name: formData.file_name,
      };
      const contractRes = await contractsApi.create(payload);
      toast.success('Contract saved successfully!');
      router.push(`/contracts/${contractRes.data.data.contract.id}`);
    } catch (err: unknown) {
      toast.error(friendlyError(err, 'We could not save this contract. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Mode selection switcher at top */}
      <div className="flex items-center justify-center mb-6">
        <div className="bg-ink-100 p-1 rounded-sm flex gap-1 border border-ink-200 shadow-inner">
          <button
            type="button"
            onClick={() => { setIsManual(false); setResult(null); setStep('upload'); }}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all',
              !isManual && (step === 'upload' || step === 'extracting')
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-ink-600 hover:text-ink-900'
            )}
          >
            <Upload className="w-3.5 h-3.5" /> AI Document Upload
          </button>
          <button
            type="button"
            onClick={handleStartManual}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all',
              isManual && step === 'review'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-ink-600 hover:text-ink-900'
            )}
          >
            <Edit3 className="w-3.5 h-3.5" /> Fill Manually
          </button>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {(isManual
          ? [{ key: 'mode', label: 'Mode' }, { key: 'review', label: 'Contract Details' }, { key: 'saving', label: 'Save' }]
          : [{ key: 'upload', label: 'Upload' }, { key: 'review', label: 'Review' }, { key: 'saving', label: 'Save' }]
        ).map((s, i) => {
          const current = isManual
            ? (step === 'review' ? 1 : step === 'saving' ? 2 : 0)
            : (step === 'upload' ? 0 : step === 'extracting' ? 0 : step === 'review' ? 1 : 2);
          const mine = i;
          const done = current > mine;
          const active = current === mine;
          return (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && <div className={cn('h-px w-8', done || active ? 'bg-brand-500' : 'bg-ink-200')} />}
              <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                active ? 'bg-brand-600 text-white' : done ? 'bg-brand-100 text-brand-600' : 'bg-ink-100 text-ink-400')}>
                <div className={cn('w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold',
                  active ? 'bg-white/20' : done ? 'bg-brand-200' : 'bg-ink-200')}>
                  {done ? '✓' : i + 1}
                </div>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {step === 'upload' && (
        <UploadStep
          onUpload={handleUpload}
          onManualEntry={handleStartManual}
        />
      )}

      {step === 'extracting' && (
        <div className="max-w-2xl mx-auto card p-12 flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-sm bg-brand-50 flex items-center justify-center">
              <FileText className="w-10 h-10 text-brand-500" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <div className="font-serif text-lg text-ink-900">Analyzing your document</div>
            <div className="text-sm text-ink-500 mt-1">Gemini is extracting the client name, dates, services, and contacts. This usually takes 10–30 seconds.</div>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {['Client Name', 'Contract Dates', 'Services', 'Email IDs', 'Renewal Terms'].map((item) => (
              <span key={item} className="text-xs bg-brand-50 text-brand-600 px-3 py-1 rounded-full border border-brand-100 animate-pulse">{item}</span>
            ))}
          </div>
        </div>
      )}

      {step === 'review' && result && (
        <ReviewStep
          result={result}
          clients={clients}
          onSave={handleSave}
          onBack={() => { setResult(null); setIsManual(false); setStep('upload'); }}
          saving={saving}
          isManual={isManual}
        />
      )}
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    }>
      <UploadPageContent />
    </Suspense>
  );
}
