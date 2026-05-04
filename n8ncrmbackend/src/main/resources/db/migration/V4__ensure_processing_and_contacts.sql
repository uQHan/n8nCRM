-- Ensure core CRM tables exist.
-- Older databases may have applied an earlier V1 that didn't include these tables.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_created_at ON processing_jobs(created_at DESC);

CREATE TABLE IF NOT EXISTS processed_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES processing_jobs(id) ON DELETE CASCADE,

  original_data JSONB,

  name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  title TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  zip TEXT,
  website TEXT,

  email_verified BOOLEAN DEFAULT FALSE,
  email_deliverable BOOLEAN,
  company_domain TEXT,
  company_size TEXT,
  company_industry TEXT,
  company_location TEXT,
  phone_formatted TEXT,
  phone_valid BOOLEAN,

  enriched BOOLEAN DEFAULT FALSE,
  is_duplicate BOOLEAN DEFAULT FALSE,
  duplicate_of UUID REFERENCES processed_contacts(id),
  data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_contacts_job_id ON processed_contacts(job_id);
CREATE INDEX IF NOT EXISTS idx_processed_contacts_email ON processed_contacts(email);

-- Ensure update_updated_at_column() exists (also created in V3, but safe to repeat)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_processing_jobs_updated_at'
  ) THEN
    CREATE TRIGGER update_processing_jobs_updated_at
      BEFORE UPDATE ON processing_jobs
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_processed_contacts_updated_at'
  ) THEN
    CREATE TRIGGER update_processed_contacts_updated_at
      BEFORE UPDATE ON processed_contacts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
