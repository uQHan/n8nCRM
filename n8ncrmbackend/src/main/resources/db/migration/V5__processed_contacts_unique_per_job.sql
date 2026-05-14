-- Make processed contacts unique per job, not globally by email.
--
-- Previous schema used `email TEXT UNIQUE NOT NULL`, which prevents
-- re-uploading the same dataset (or overlapping emails) in a new job.
-- The app behavior is per-upload/job, so uniqueness should be (job_id, email).

DO $$
BEGIN
  -- Default name for `email TEXT UNIQUE` in Postgres is typically processed_contacts_email_key
  -- but use IF EXISTS to be safe across environments.
  ALTER TABLE processed_contacts
    DROP CONSTRAINT IF EXISTS processed_contacts_email_key;

  -- Some environments might have created a differently named unique constraint/index.
  -- Dropping a constraint removes its backing unique index; we then create the desired unique index.
EXCEPTION
  WHEN undefined_table THEN
    -- Table not present (fresh DB missing earlier migrations). Nothing to do.
    NULL;
END $$;

-- Enforce uniqueness per job instead.
CREATE UNIQUE INDEX IF NOT EXISTS ux_processed_contacts_job_email
  ON processed_contacts(job_id, email);
