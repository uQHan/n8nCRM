package com.uqhan.n8ncrmbackend.web;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.uqhan.n8ncrmbackend.repo.ProcessedContactRepository;
import com.uqhan.n8ncrmbackend.web.dto.ApiContactSearchResponse;
import com.uqhan.n8ncrmbackend.web.dto.ApiContactSummary;

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
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "25") int size
	) {
		int safePage = Math.max(0, page);
		int safeSize = Math.min(200, Math.max(1, size));
		Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

		var result = contactRepository.searchContacts(q, deliverableOnly, pageable);
		return new ApiContactSearchResponse(
				result.getContent().stream().map(ApiContactSummary::from).toList(),
				result.getTotalElements(),
				result.getNumber(),
				result.getSize()
		);
	}
}
