package com.uqhan.n8ncrmbackend.entity;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "job_processed_contacts")
public class JobProcessedContact {
	@Id
	@GeneratedValue
	@UuidGenerator
	private UUID id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "job_id", nullable = false)
	private ProcessingJob job;

	@ManyToOne(optional = false)
	@JoinColumn(name = "contact_id", nullable = false)
	private ProcessedContact contact;

	@Column(name = "created_at", insertable = false, updatable = false)
	private OffsetDateTime createdAt;

	public UUID getId() {
		return id;
	}

	public ProcessingJob getJob() {
		return job;
	}

	public void setJob(ProcessingJob job) {
		this.job = job;
	}

	public ProcessedContact getContact() {
		return contact;
	}

	public void setContact(ProcessedContact contact) {
		this.contact = contact;
	}

	public OffsetDateTime getCreatedAt() {
		return createdAt;
	}
}
