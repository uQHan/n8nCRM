package com.uqhan.n8ncrmbackend.repo;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.uqhan.n8ncrmbackend.entity.ProcessedContact;

public interface ProcessedContactRepository extends JpaRepository<ProcessedContact, UUID> {
	List<ProcessedContact> findByJob_IdOrderByCreatedAtAsc(UUID jobId);
	boolean existsByEmail(String email);

	List<ProcessedContact> findByEmailIn(Collection<String> emails);

	@Query("""
			SELECT pc
			FROM ProcessedContact pc
			WHERE (
				:q IS NULL OR :q = '' OR
				LOWER(COALESCE(pc.name, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
				LOWER(COALESCE(pc.email, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
				LOWER(COALESCE(pc.company, '')) LIKE LOWER(CONCAT('%', :q, '%'))
			)
			AND (:deliverableOnly = FALSE OR pc.emailDeliverable = TRUE)
			AND (:enrichedOnly = FALSE OR pc.enriched = TRUE)
			AND (:duplicatesOnly = FALSE OR pc.duplicate = TRUE)
			ORDER BY pc.createdAt DESC
			""")
	Page<ProcessedContact> searchContacts(
			@Param("q") String q,
			@Param("deliverableOnly") boolean deliverableOnly,
			@Param("enrichedOnly") boolean enrichedOnly,
			@Param("duplicatesOnly") boolean duplicatesOnly,
			Pageable pageable
	);

	// NOTE: legacy job-scoped method kept only for backward compatibility;
	// master-list processing uses global email uniqueness + upserts.
	@Query("SELECT pc.email FROM ProcessedContact pc WHERE pc.job.id = :jobId AND pc.email IN :emails")
	List<String> findExistingEmailsForJob(
			@Param("jobId") UUID jobId,
			@Param("emails") Collection<String> emails
	);
}
