package com.uqhan.n8ncrmbackend.repo;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.uqhan.n8ncrmbackend.entity.ProcessedContact;

public interface ProcessedContactRepository extends JpaRepository<ProcessedContact, UUID> {
	List<ProcessedContact> findByJob_IdOrderByCreatedAtAsc(UUID jobId);
	boolean existsByEmail(String email);
}
