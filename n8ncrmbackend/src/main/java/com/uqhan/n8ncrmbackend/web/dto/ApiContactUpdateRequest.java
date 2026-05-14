package com.uqhan.n8ncrmbackend.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record ApiContactUpdateRequest(
		@Size(max = 500) String name,
		@Email @Size(max = 320) String email,
		@Size(max = 50) String phone,
		@Size(max = 500) String company,
		@Size(max = 255) String title,
		@Size(max = 1000) String address,
		@Size(max = 255) String city,
		@Size(max = 255) String state,
		@Size(max = 255) String country,
		@Size(max = 20) String zip,
		@Size(max = 2048) String website,
		@Size(max = 500) String company_domain,
		@Size(max = 255) String company_size,
		@Size(max = 255) String company_industry,
		@Size(max = 500) String company_location,
		@Size(max = 50) String phone_formatted
) {
}
