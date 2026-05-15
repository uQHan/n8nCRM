package com.uqhan.n8ncrmbackend.web;

import java.util.Map;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.uqhan.n8ncrmbackend.entity.ProcessedContact;
import com.uqhan.n8ncrmbackend.repo.ProcessedContactRepository;
import com.uqhan.n8ncrmbackend.web.dto.ApiContactDetail;
import com.uqhan.n8ncrmbackend.web.dto.ApiContactSearchResponse;
import com.uqhan.n8ncrmbackend.web.dto.ApiContactSummary;
import com.uqhan.n8ncrmbackend.web.dto.ApiContactUpdateRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/contacts")
public class ContactsController {
	private final ProcessedContactRepository contactRepository;

	public ContactsController(ProcessedContactRepository contactRepository) {
		this.contactRepository = contactRepository;
	}

	@GetMapping
	public ApiContactSearchResponse search(
			@RequestParam(required = false) String q,
			@RequestParam(defaultValue = "false") boolean deliverableOnly,
			@RequestParam(defaultValue = "false") boolean enrichedOnly,
			@RequestParam(defaultValue = "false") boolean duplicatesOnly,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "25") int size
	) {
		return searchInternal(q, deliverableOnly, enrichedOnly, duplicatesOnly, page, size);
	}

	/**
	 * Tool-friendly endpoint for n8n AI Agent HTTP tools.
	 * Uses a fixed URL with query parameters, so tools don't need to build dynamic URLs.
	 */
	@GetMapping("/tool/search")
	public ApiContactSearchResponse toolSearch(
			@RequestParam(required = false) String q,
			@RequestParam(defaultValue = "false") boolean deliverableOnly,
			@RequestParam(defaultValue = "false") boolean enrichedOnly,
			@RequestParam(defaultValue = "false") boolean duplicatesOnly,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "25") int size
	) {
		return searchInternal(q, deliverableOnly, enrichedOnly, duplicatesOnly, page, size);
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiContactDetail> getContact(@PathVariable("id") UUID id) {
		return contactRepository.findById(id)
				.map(ApiContactDetail::from)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	/**
	 * Tool-friendly endpoint for n8n AI Agent HTTP tools.
	 * Uses a fixed URL with query parameters, so tools don't need to build dynamic URLs.
	 */
	@GetMapping("/tool/get")
	public ResponseEntity<ApiContactDetail> toolGetContact(@RequestParam("id") UUID id) {
		return getContact(id);
	}

	@PatchMapping("/{id}")
	public ResponseEntity<?> updateContact(
			@PathVariable("id") UUID id,
			@Valid @RequestBody ApiContactUpdateRequest request
	) {
		return updateContactInternal(id, request);
	}

	/**
	 * Tool-friendly endpoint for n8n AI Agent HTTP tools.
	 * Uses a fixed URL with query parameters, so tools don't need to build dynamic URLs.
	 */
	@PatchMapping("/tool/update")
	public ResponseEntity<?> toolUpdateContact(
			@RequestParam("id") UUID id,
			@Valid @RequestBody ApiContactUpdateRequest request
	) {
		return updateContactInternal(id, request);
	}

	private ResponseEntity<?> updateContactInternal(UUID id, ApiContactUpdateRequest request) {
		var existingOpt = contactRepository.findById(id);
		if (existingOpt.isEmpty()) {
			return ResponseEntity.notFound().build();
		}

		ProcessedContact contact = existingOpt.get();

		if (request.email() != null) {
			String nextEmail = normalize(request.email());
			if (nextEmail == null) {
				return ResponseEntity.badRequest().body(Map.of("error", "email cannot be blank"));
			}
			if (!nextEmail.equalsIgnoreCase(contact.getEmail()) && contactRepository.existsByEmail(nextEmail)) {
				return ResponseEntity.status(409).body(Map.of("error", "email already exists"));
			}
			contact.setEmail(nextEmail);
		}

		if (request.name() != null) contact.setName(normalize(request.name()));
		if (request.phone() != null) contact.setPhone(normalize(request.phone()));
		if (request.company() != null) contact.setCompany(normalize(request.company()));
		if (request.title() != null) contact.setTitle(normalize(request.title()));
		if (request.address() != null) contact.setAddress(normalize(request.address()));
		if (request.city() != null) contact.setCity(normalize(request.city()));
		if (request.state() != null) contact.setState(normalize(request.state()));
		if (request.country() != null) contact.setCountry(normalize(request.country()));
		if (request.zip() != null) contact.setZip(normalize(request.zip()));
		if (request.website() != null) contact.setWebsite(normalize(request.website()));
		if (request.company_domain() != null) contact.setCompanyDomain(normalize(request.company_domain()));
		if (request.company_size() != null) contact.setCompanySize(normalize(request.company_size()));
		if (request.company_industry() != null) contact.setCompanyIndustry(normalize(request.company_industry()));
		if (request.company_location() != null) contact.setCompanyLocation(normalize(request.company_location()));
		if (request.phone_formatted() != null) contact.setPhoneFormatted(normalize(request.phone_formatted()));

		try {
			ProcessedContact saved = contactRepository.save(contact);
			return ResponseEntity.ok(ApiContactDetail.from(saved));
		} catch (DataIntegrityViolationException e) {
			return ResponseEntity.status(409).body(Map.of("error", "update failed due to data constraints"));
		}
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<?> deleteContact(@PathVariable("id") UUID id) {
		var existingOpt = contactRepository.findById(id);
		if (existingOpt.isEmpty()) {
			return ResponseEntity.notFound().build();
		}

		try {
			contactRepository.delete(existingOpt.get());
			return ResponseEntity.noContent().build();
		} catch (DataIntegrityViolationException e) {
			return ResponseEntity.status(409).body(Map.of(
					"error",
					"contact cannot be deleted because it is referenced by other records"
			));
		}
	}

	private static String normalize(String value) {
		if (value == null) return null;
		String trimmed = value.trim();
		return trimmed.isBlank() ? null : trimmed;
	}

	private ApiContactSearchResponse searchInternal(
			String q,
			boolean deliverableOnly,
			boolean enrichedOnly,
			boolean duplicatesOnly,
			int page,
			int size
	) {
		int safePage = Math.max(0, page);
		int safeSize = Math.min(200, Math.max(1, size));
		Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

		var result = contactRepository.searchContacts(q, deliverableOnly, enrichedOnly, duplicatesOnly, pageable);
		return new ApiContactSearchResponse(
				result.getContent().stream().map(ApiContactSummary::from).toList(),
				result.getTotalElements(),
				result.getNumber(),
				result.getSize()
		);
	}
}
