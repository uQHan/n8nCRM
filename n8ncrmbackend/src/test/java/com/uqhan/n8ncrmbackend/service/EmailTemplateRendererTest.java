package com.uqhan.n8ncrmbackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

import com.uqhan.n8ncrmbackend.entity.ProcessedContact;

public class EmailTemplateRendererTest {
	@Test
	void replacesKnownPlaceholders_andLeavesUnknown() {
		ProcessedContact c = new ProcessedContact();
		c.setName("Alice");
		c.setCompany("Acme Ltd");
		c.setEmail("alice@example.com");

		EmailTemplateRenderer r = new EmailTemplateRenderer();
		String out = r.render("Hi [cname] from [ccompany] ([unknown])", c);
		assertEquals("Hi Alice from Acme Ltd ([unknown])", out);
	}

	@Test
	void supportsCommonMisspelling_ccompnay() {
		ProcessedContact c = new ProcessedContact();
		c.setCompany("Acme");
		EmailTemplateRenderer r = new EmailTemplateRenderer();
		assertEquals("Acme", r.render("[ccompnay]", c));
	}
}
