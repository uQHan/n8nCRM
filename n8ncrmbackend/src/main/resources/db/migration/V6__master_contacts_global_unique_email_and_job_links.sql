-- Master list semantics:
-- 1) processed_contacts.email is globally unique (system-of-record)
-- 2) each job still has a stable result set via job_processed_contacts

-- Create join table for job -> processed contact links
CREATE TABLE IF NOT EXISTS job_processed_contacts (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	job_id UUID NOT NULL REFERENCES processing_jobs(id) ON DELETE CASCADE,
	contact_id UUID NOT NULL REFERENCES processed_contacts(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_processed_contacts_job_id
	ON job_processed_contacts(job_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_job_processed_contacts_job_contact
	ON job_processed_contacts(job_id, contact_id);

-- Revert V5 per-job uniqueness
DROP INDEX IF EXISTS ux_processed_contacts_job_email;

-- Deduplicate any existing rows by case-insensitive email before enforcing uniqueness
DO $$
BEGIN
	WITH ranked AS (
		SELECT
			id,
			LOWER(email) AS email_key,
			ROW_NUMBER() OVER (
				PARTITION BY LOWER(email)
				ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
			) AS rn
		FROM processed_contacts
		WHERE email IS NOT NULL
	)
	DELETE FROM processed_contacts pc
	USING ranked r
	WHERE pc.id = r.id
		AND r.rn > 1;

	-- Clean up any dangling duplicate_of references after deletes
	UPDATE processed_contacts
	SET duplicate_of = NULL
	WHERE duplicate_of IS NOT NULL
		AND NOT EXISTS (
			SELECT 1
			FROM processed_contacts pc2
			WHERE pc2.id = processed_contacts.duplicate_of
		);
END $$;

-- Enforce global unique email (master list)
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'processed_contacts_email_key'
	) THEN
		ALTER TABLE processed_contacts
			ADD CONSTRAINT processed_contacts_email_key UNIQUE (email);
	END IF;
END $$;
