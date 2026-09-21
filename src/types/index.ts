export interface User {
  uid: string;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
}

export interface Client {
  id: string;
  client_name: string;
  account_manager: string;
  primary_reminder_email: string;
  secondary_reminder_email: string;
  cc_emails: string[];
  notes: string;
  is_paused: boolean;
  pause_reason: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractService {
  service_name: string;
  service_type: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  value?: string;
}

export type ContractStatus = 'active' | 'paused' | 'expiring_soon' | 'expired' | 'renewed' | 'archived';

export const PIPELINE_STEPS = [
  'Initiated',
  'Commercial Shared',
  'Negotiation',
  'Approval',
  'SOW/Draft shared',
  'Signed',
] as const;

export type PipelineStep = (typeof PIPELINE_STEPS)[number];

export interface Contract {
  id: string;
  owner_uid: string;
  client_id: string;
  client_name: string;
  contract_name: string;
  vendor_name: string;
  service_name: string;
  service_type: string;
  start_date: string;
  end_date: string;
  effective_date?: string;
  agreement_date?: string;
  scope_date?: string;
  schedule_date?: string;
  annexure_date?: string;
  execution_date?: string;
  lock_in_period?: string;
  renewal_clause?: string;
  notice_period?: string;
  email_ids: string[];
  services: ContractService[];
  status: ContractStatus;
  computed_status: ContractStatus;
  is_paused: boolean;
  pause_reason: string;
  paused_at?: string;
  client_paused: boolean;
  is_snoozed: boolean;
  snooze_until?: string;
  storage_path: string;
  file_name: string;
  version: number;
  parent_contract_id?: string;
  days_remaining?: number;
  file_url?: string;
  notes: string;
  created_at: string;
  updated_at: string;
  pipeline_step?: PipelineStep | string;
}

export interface ContractComment {
  id: string;
  contract_id: string;
  contract_name: string;
  owner_uid: string;
  author: string;
  text: string;
  created_at: string;
  updated_at: string;
}


export interface ExtractedData {
  client_name: string | null;
  vendor_name: string | null;
  contract_name: string | null;
  service_name: string | null;
  service_type: string | null;
  start_date: string | null;
  end_date: string | null;
  effective_date: string | null;
  agreement_date: string | null;
  scope_date: string | null;
  schedule_date: string | null;
  annexure_date: string | null;
  execution_date: string | null;
  lock_in_period: string | null;
  renewal_clause: string | null;
  notice_period: string | null;
  email_ids: string[];
  services: ContractService[];
  confidence_score: number;
  extraction_notes: string;
  _extraction_success: boolean;
}

export interface ExtractionResult {
  extracted: ExtractedData;
  storage_path: string;
  file_name: string;
  file_size_bytes: number;
  signed_url: string;
}

export interface DashboardSummary {
  total_clients: number;
  total_contracts: number;
  active_contracts: number;
  paused_contracts: number;
  expiring_in_60_days: number;
  expiring_in_30_days: number;
  expired_contracts: number;
}

export interface ReminderLog {
  id: string;
  contract_id: string;
  contract_name: string;
  client_id: string;
  owner_uid: string;
  last_sent_at: string;
  days_remaining_when_sent: number;
  total_sent: number;
}

export interface AuditLog {
  id: string;
  user_uid: string;
  action: string;
  resource_type: string;
  resource_id: string;
  description: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}
