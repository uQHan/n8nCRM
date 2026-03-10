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
