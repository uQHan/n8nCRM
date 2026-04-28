package com.uqhan.n8ncrmbackend.web.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.uqhan.n8ncrmbackend.entity.ProcessedContact;

/**
 * Issue #7: DTO for ProcessedContact to avoid exposing the raw JPA entity
 * (and its nested job relationship / original_data JSONB) to the API.
 */
public record ApiProcessedContact(
		UUID id,
		String name,
		String email,
		String phone,
		String company,
		String title,
		String address,
		String city,
		String state,
		String country,
		String zip,
		String website,
		Boolean email_verified,
		Boolean email_deliverable,
		String company_domain,
		String company_size,
		String company_industry,
		String company_location,
		String phone_formatted,
		Boolean phone_valid,
		Boolean enriched,
		Boolean is_duplicate,
		Integer data_quality_score,
		OffsetDateTime created_at,
		OffsetDateTime updated_at
) {
	public static ApiProcessedContact from(ProcessedContact c) {
		return new ApiProcessedContact(
				c.getId(),
				c.getName(),
				c.getEmail(),
				c.getPhone(),
				c.getCompany(),
				c.getTitle(),
				c.getAddress(),
				c.getCity(),
				c.getState(),
				c.getCountry(),
				c.getZip(),
				c.getWebsite(),
				c.getEmailVerified(),
				c.getEmailDeliverable(),
				c.getCompanyDomain(),
				c.getCompanySize(),
				c.getCompanyIndustry(),
				c.getCompanyLocation(),
				c.getPhoneFormatted(),
				c.getPhoneValid(),
				c.getEnriched(),
				c.getDuplicate(),
				c.getDataQualityScore(),
				c.getCreatedAt(),
				c.getUpdatedAt()
		);
	}
}
