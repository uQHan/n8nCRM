package com.uqhan.n8ncrmbackend.repo;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.uqhan.n8ncrmbackend.entity.ProcessedContact;

public interface ProcessedContactRepository extends JpaRepository<ProcessedContact, UUID> {
	List<ProcessedContact> findByJob_IdOrderByCreatedAtAsc(UUID jobId);
	boolean existsByEmail(String email);

	/**
	 * Issue #4: Batch query to pre-fetch existing emails, replacing the N+1
	 * existsByEmail() calls inside the processing loop.
	 */
	@Query("SELECT pc.email FROM ProcessedContact pc WHERE pc.email IN :emails")
	List<String> findExistingEmails(@Param("emails") Collection<String> emails);
}
