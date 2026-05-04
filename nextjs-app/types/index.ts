export interface ColumnMapping {
  csvColumn: string;
  crmField: string;
}

export interface EnrichmentOptions {
  verifyEmails: boolean;
  enrichCompanyData: boolean;
  validatePhoneNumbers: boolean;
  removeDuplicates: boolean;
}

export interface ProcessingJob {
  id: string;
  status: 'uploading' | 'cleaning' | 'enriching' | 'completed' | 'failed';
  progress: number;
  current_stage: string;
  total_rows: number;
  processed_rows: number;
  error_count: number;
  created_at: string;
  updated_at: string;
}

export type ProcessingStage =
  | 'uploaded'
  | 'validating'
  | 'cleaning'
  | 'deduplicating'
  | 'enriching_emails'
  | 'enriching_companies'
  | 'validating_phones'
  | 'completed'
  | 'failed';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

// Issue #9: Proper types for parsed file data to replace `any`

export interface ParsedFileData {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export interface ProcessedContactRow {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  website?: string;
  email_verified?: boolean;
  email_deliverable?: boolean;
  company_domain?: string;
  company_size?: string;
  company_industry?: string;
  company_location?: string;
  phone_formatted?: string;
  phone_valid?: boolean;
  enriched?: boolean;
  is_duplicate?: boolean;
  data_quality_score?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: string | boolean | number | undefined;
}

export interface ContactSummary {
  id: string;
  name?: string;
  email: string;
  company?: string;
  email_deliverable?: boolean;
}

export interface ContactSearchResponse {
  items: ContactSummary[];
  total: number;
  page: number;
  size: number;
}

export interface EmailPlaceholder {
  token: string;
  description: string;
}

export interface EmailPlaceholdersResponse {
  placeholders: EmailPlaceholder[];
}

export interface EmailPreviewRequest {
  contact_id: string;
  subject_template: string;
  body_template: string;
}

export interface EmailPreviewResponse {
  contact_id: string;
  to_email: string;
  subject: string;
  body: string;
}

export interface EmailSendRequest {
  contact_ids: string[];
  subject_template: string;
  body_template: string;
  delivery_mode?: 'SMTP' | 'N8N' | string;
  is_html: boolean;
  dry_run: boolean;
}

export interface EmailSendItemResult {
  contact_id: string;
  to_email?: string;
  success: boolean;
  error?: string;
}

export interface EmailSendResponse {
  results: EmailSendItemResult[];
  success_count: number;
  failure_count: number;
}

/** CRM field names used for column mapping */
export const CRM_FIELDS = [
  'name', 'email', 'phone', 'company', 'title',
  'address', 'city', 'state', 'country', 'website',
] as const;
export type CrmField = typeof CRM_FIELDS[number];
