package com.uqhan.n8ncrmbackend.service;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.uqhan.n8ncrmbackend.entity.ProcessedContact;

@Service
public class EmailTemplateRenderer {
	private static final Pattern TOKEN_PATTERN = Pattern.compile("\\[(?<key>[A-Za-z0-9_]+)]");

	public Map<String, String> supportedPlaceholders() {
		Map<String, String> placeholders = new LinkedHashMap<>();
		placeholders.put("[cname]", "Customer name");
		placeholders.put("[ccompany]", "Customer company");
		placeholders.put("[ccompnay]", "Customer company (common misspelling)");
		placeholders.put("[cemail]", "Customer email");
		placeholders.put("[cphone]", "Customer phone (formatted if available)");
		placeholders.put("[ctitle]", "Customer title");
		placeholders.put("[ccity]", "Customer city");
		placeholders.put("[cstate]", "Customer state");
		placeholders.put("[ccountry]", "Customer country");
		placeholders.put("[cwebsite]", "Customer website");
		return placeholders;
	}

	public String render(String template, ProcessedContact contact) {
		if (template == null || template.isBlank()) {
			return template;
		}
		Matcher matcher = TOKEN_PATTERN.matcher(template);
		StringBuilder out = new StringBuilder(template.length() + 32);
		int lastIndex = 0;
		while (matcher.find()) {
			out.append(template, lastIndex, matcher.start());
			String key = matcher.group("key");
			String replacement = resolve(key, contact);
			if (replacement == null) {
				out.append(matcher.group(0));
			} else {
				out.append(replacement);
			}
			lastIndex = matcher.end();
		}
		out.append(template, lastIndex, template.length());
		return out.toString();
	}

	private String resolve(String rawKey, ProcessedContact contact) {
		if (rawKey == null) {
			return null;
		}
		String key = rawKey.toLowerCase(Locale.ROOT);
		return switch (key) {
			case "cname", "name" -> emptyToNull(contact.getName());
			case "ccompany", "ccompnay", "company" -> emptyToNull(contact.getCompany());
			case "cemail", "email" -> emptyToNull(contact.getEmail());
			case "cphone", "phone" -> emptyToNull(firstNonBlank(contact.getPhoneFormatted(), contact.getPhone()));
			case "ctitle", "title" -> emptyToNull(contact.getTitle());
			case "ccity", "city" -> emptyToNull(contact.getCity());
			case "cstate", "state" -> emptyToNull(contact.getState());
			case "ccountry", "country" -> emptyToNull(contact.getCountry());
			case "cwebsite", "website" -> emptyToNull(contact.getWebsite());
			default -> null;
		};
	}

	private static String firstNonBlank(String a, String b) {
		if (a != null && !a.isBlank()) {
			return a;
		}
		return b;
	}

	private static String emptyToNull(String s) {
		if (s == null || s.isBlank()) {
			return null;
		}
		return s;
	}
}
