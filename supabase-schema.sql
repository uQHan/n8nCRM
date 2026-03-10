-- CRM Data Cleaning & Enrichment Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: processing_jobs
-- Tracks the status of each data processing job
-- =====================================================
CREATE TABLE IF NOT EXISTS processing_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL CHECK (status IN ('uploading', 'cleaning', 'enriching', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_stage TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  processed_rows INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_created_at ON processing_jobs(created_at DESC);

-- =====================================================
-- Table: raw_contacts
-- Stores the original uploaded contact data
-- =====================================================
CREATE TABLE IF NOT EXISTS raw_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES processing_jobs(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  row_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for job queries
CREATE INDEX IF NOT EXISTS idx_raw_contacts_job_id ON raw_contacts(job_id);

-- =====================================================
-- Table: processed_contacts
-- Stores the cleaned and enriched contact data
-- =====================================================
CREATE TABLE IF NOT EXISTS processed_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES processing_jobs(id) ON DELETE CASCADE,
  
  -- Original data
  original_data JSONB,
  
  -- Cleaned fields
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  zip TEXT,
  website TEXT,
  
  -- Enriched fields
  email_verified BOOLEAN DEFAULT FALSE,
  email_deliverable BOOLEAN,
  company_size TEXT,
  company_industry TEXT,
  company_location TEXT,
  phone_formatted TEXT,
  phone_valid BOOLEAN,
  
  -- Metadata
  enriched BOOLEAN DEFAULT FALSE,
  is_duplicate BOOLEAN DEFAULT FALSE,
  duplicate_of UUID REFERENCES processed_contacts(id),
  data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_processed_contacts_job_id ON processed_contacts(job_id);
CREATE INDEX IF NOT EXISTS idx_processed_contacts_email ON processed_contacts(email);
CREATE INDEX IF NOT EXISTS idx_processed_contacts_company ON processed_contacts(company);
CREATE INDEX IF NOT EXISTS idx_processed_contacts_enriched ON processed_contacts(enriched);

-- =====================================================
-- Table: enrichment_logs
-- Tracks what enrichment operations were performed
-- =====================================================
CREATE TABLE IF NOT EXISTS enrichment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES processing_jobs(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES processed_contacts(id) ON DELETE CASCADE,
  
  enrichment_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  details JSONB,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for job queries
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_job_id ON enrichment_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_contact_id ON enrichment_logs(contact_id);

-- =====================================================
-- Function: Update updated_at timestamp automatically
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating updated_at
CREATE TRIGGER update_processing_jobs_updated_at
  BEFORE UPDATE ON processing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processed_contacts_updated_at
  BEFORE UPDATE ON processed_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Enable Row Level Security (RLS)
-- Note: For POC without auth, we'll allow all operations
-- In production, you would restrict based on user_id
-- =====================================================
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_logs ENABLE ROW LEVEL SECURITY;

-- For POC: Allow all operations (INSECURE - only for development)
CREATE POLICY "Allow all on processing_jobs" ON processing_jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on raw_contacts" ON raw_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on processed_contacts" ON processed_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on enrichment_logs" ON enrichment_logs FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- Enable Realtime for processing_jobs table
-- This allows the frontend to subscribe to job updates
-- =====================================================
-- Note: Run this in Supabase Dashboard under Database > Replication
-- or via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE processing_jobs;

-- =====================================================
-- Sample Views for Analytics (Optional)
-- =====================================================

-- View: Job statistics
CREATE OR REPLACE VIEW job_statistics AS
SELECT 
  pj.id,
  pj.status,
  pj.total_rows,
  pj.processed_rows,
  pj.error_count,
  COUNT(DISTINCT pc.id) as unique_contacts,
  COUNT(DISTINCT CASE WHEN pc.is_duplicate THEN pc.id END) as duplicates_found,
  COUNT(DISTINCT CASE WHEN pc.enriched THEN pc.id END) as enriched_contacts,
  AVG(pc.data_quality_score) as avg_quality_score,
  pj.created_at,
  pj.updated_at
FROM processing_jobs pj
LEFT JOIN processed_contacts pc ON pc.job_id = pj.id
GROUP BY pj.id;

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to calculate data quality score
CREATE OR REPLACE FUNCTION calculate_quality_score(contact_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  field_count INTEGER := 0;
  filled_fields INTEGER := 0;
BEGIN
  -- Count total possible fields
  field_count := 11; -- name, email, phone, company, title, address, city, state, country, zip, website
  
  -- Count filled fields
  IF contact_data->>'name' IS NOT NULL AND contact_data->>'name' != '' THEN filled_fields := filled_fields + 1; END IF;
  IF contact_data->>'email' IS NOT NULL AND contact_data->>'email' != '' THEN filled_fields := filled_fields + 1; END IF;
  IF contact_data->>'phone' IS NOT NULL AND contact_data->>'phone' != '' THEN filled_fields := filled_fields + 1; END IF;
  IF contact_data->>'company' IS NOT NULL AND contact_data->>'company' != '' THEN filled_fields := filled_fields + 1; END IF;
  IF contact_data->>'title' IS NOT NULL AND contact_data->>'title' != '' THEN filled_fields := filled_fields + 1; END IF;
  IF contact_data->>'address' IS NOT NULL AND contact_data->>'address' != '' THEN filled_fields := filled_fields + 1; END IF;
  IF contact_data->>'city' IS NOT NULL AND contact_data->>'city' != '' THEN filled_fields := filled_fields + 1; END IF;
  IF contact_data->>'state' IS NOT NULL AND contact_data->>'state' != '' THEN filled_fields := filled_fields + 1; END IF;
  IF contact_data->>'country' IS NOT NULL AND contact_data->>'country' != '' THEN filled_fields := filled_fields + 1; END IF;
  IF contact_data->>'zip' IS NOT NULL AND contact_data->>'zip' != '' THEN filled_fields := filled_fields + 1; END IF;
  IF contact_data->>'website' IS NOT NULL AND contact_data->>'website' != '' THEN filled_fields := filled_fields + 1; END IF;
  
  -- Calculate percentage
  score := (filled_fields * 100) / field_count;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;
