package com.uqhan.n8ncrmbackend.repo;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.uqhan.n8ncrmbackend.entity.ProcessingJob;

public interface ProcessingJobRepository extends JpaRepository<ProcessingJob, UUID> {
}
