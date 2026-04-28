package com.uqhan.n8ncrmbackend.web;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Issue #3: Global error handler that prevents raw stack traces from
 * leaking to clients and returns consistent error responses.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<Map<String, String>> handleNotFound(IllegalArgumentException ex) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(Map.of("error", ex.getMessage()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
		var fieldErrors = ex.getBindingResult().getFieldErrors().stream()
				.map(fe -> Map.of(
						"field", fe.getField(),
						"message", fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "invalid"
				))
				.toList();
		return ResponseEntity.badRequest()
				.body(Map.of("error", "Validation failed", "details", fieldErrors));
	}

	@ExceptionHandler(IllegalStateException.class)
	public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException ex) {
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(Map.of("error", "An internal error occurred. Please try again later."));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, String>> handleGeneric(Exception ex) {
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(Map.of("error", "An unexpected error occurred. Please try again later."));
	}
}
