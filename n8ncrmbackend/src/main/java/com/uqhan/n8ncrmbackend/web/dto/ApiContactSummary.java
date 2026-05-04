package com.uqhan.n8ncrmbackend.web.dto;

import java.util.UUID;

import com.uqhan.n8ncrmbackend.entity.ProcessedContact;

public record ApiContactSummary(
		UUID id,
		String name,
		String email,
		String company,
		Boolean email_deliverable
) {
	public static ApiContactSummary from(ProcessedContact c) {
		return new ApiContactSummary(
				c.getId(),
				c.getName(),
				c.getEmail(),
				c.getCompany(),
				c.getEmailDeliverable()
		);
	}
}
