package com.uqhan.n8ncrmbackend.repo;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.uqhan.n8ncrmbackend.entity.JobProcessedContact;

public interface JobProcessedContactRepository extends JpaRepository<JobProcessedContact, UUID> {
	List<JobProcessedContact> findByJob_IdOrderByCreatedAtAsc(UUID jobId);
}
