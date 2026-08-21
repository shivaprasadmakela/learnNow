package com.learnnow.common.exception;

import com.razorpay.RazorpayException;
import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Maps exceptions to responses.
 *
 * <p>Two rules govern everything here. Nothing is silent: every handled exception is logged,
 * because previously not one of them was and a production failure left no trace anywhere. And
 * nothing unrecognised is reported as a client error: a blanket {@code RuntimeException} handler
 * used to return the raw exception message with a 400, which both leaked internal detail -
 * constraint names, table names, driver text - and hid genuine server faults from monitoring, since
 * they never showed up as 5xx.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    // --- Expected, modelled failures: logged at debug, safe to describe ------

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NotFoundException ex) {
        log.debug("Not found: {}", ex.getMessage());
        return body(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<Map<String, String>> handleConflict(ConflictException ex) {
        log.debug("Conflict: {}", ex.getMessage());
        return body(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<Map<String, String>> handleValidation(ValidationException ex) {
        log.debug("Validation failed: {}", ex.getMessage());
        return body(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
    }

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<Map<String, String>> handleAuth(AuthException ex) {
        // Info, not warn: a failed sign-in is routine. Worth counting, not alerting on.
        log.info("Authentication failure: {}", ex.getMessage());
        return body(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return body(HttpStatus.FORBIDDEN, "access_denied");
    }

    // --- Malformed requests -------------------------------------------------

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex) {
        String detail =
                ex.getBindingResult().getFieldErrors().stream()
                        .map(err -> err.getField() + ": " + err.getDefaultMessage())
                        .collect(Collectors.joining("; "));
        log.debug("Request validation failed: {}", detail);
        return raw(HttpStatus.UNPROCESSABLE_ENTITY, "validation_failed", detail);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraintViolation(
            ConstraintViolationException ex) {
        String detail =
                ex.getConstraintViolations().stream()
                        .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                        .collect(Collectors.joining("; "));
        log.debug("Constraint violation: {}", detail);
        return raw(HttpStatus.UNPROCESSABLE_ENTITY, "validation_failed", detail);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleJsonNotReadable(
            HttpMessageNotReadableException ex) {
        log.debug("Malformed request payload: {}", ex.getMessage());
        return raw(HttpStatus.BAD_REQUEST, "invalid_json", "Malformed JSON request payload.");
    }

    @ExceptionHandler({
        MethodArgumentTypeMismatchException.class,
        MissingServletRequestParameterException.class
    })
    public ResponseEntity<Map<String, String>> handleBadParameter(Exception ex) {
        log.debug("Bad request parameter: {}", ex.getMessage());
        return raw(
                HttpStatus.BAD_REQUEST,
                "invalid_parameter",
                "A request parameter is missing or malformed.");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, String>> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex) {
        log.debug("Method not allowed: {}", ex.getMessage());
        return raw(
                HttpStatus.METHOD_NOT_ALLOWED,
                "method_not_allowed",
                "That method is not supported on this endpoint.");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, String>> handleNoResource(NoResourceFoundException ex) {
        log.debug("No handler for {}", ex.getResourcePath());
        return raw(HttpStatus.NOT_FOUND, "not_found", "No such endpoint.");
    }

    // --- Persistence --------------------------------------------------------

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrity(
            DataIntegrityViolationException ex) {
        // The underlying message names tables and constraints, so it is logged, never returned.
        String correlationId = newCorrelationId();
        log.error("Data integrity violation [{}]", correlationId, ex);
        return raw(
                HttpStatus.CONFLICT,
                "conflict",
                "That change conflicts with existing data. Reference: " + correlationId);
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, String>> handleOptimisticLock(
            OptimisticLockingFailureException ex) {
        log.warn("Optimistic lock conflict: {}", ex.getMessage());
        return raw(
                HttpStatus.CONFLICT,
                "concurrent_modification",
                "Someone else changed this at the same time. Please retry.");
    }

    // --- Third parties ------------------------------------------------------

    @ExceptionHandler(RazorpayException.class)
    public ResponseEntity<Map<String, String>> handleRazorpay(RazorpayException ex) {
        String correlationId = newCorrelationId();
        log.error("Payment gateway error [{}]", correlationId, ex);
        return raw(
                HttpStatus.BAD_GATEWAY,
                "payment_gateway_error",
                "The payment provider could not be reached. Reference: " + correlationId);
    }

    // --- Everything else ----------------------------------------------------

    /**
     * Genuine 500. A correlation id goes to the caller so a support report can be tied to the log
     * entry, while the exception detail stays server-side.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleUnexpected(Exception ex) {
        String correlationId = newCorrelationId();
        log.error("Unhandled exception [{}]", correlationId, ex);
        return raw(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "unknown_error",
                "An unexpected server error occurred. Reference: " + correlationId);
    }

    // --- helpers ------------------------------------------------------------

    private static String newCorrelationId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    /** Resolves the code through the message bundle, for client-facing domain errors. */
    private ResponseEntity<Map<String, String>> body(HttpStatus status, String code) {
        return raw(status, code != null ? code : "unknown_error", resolve(code));
    }

    private ResponseEntity<Map<String, String>> raw(
            HttpStatus status, String code, String message) {
        Map<String, String> payload = new LinkedHashMap<>();
        payload.put("code", code);
        payload.put("message", message != null ? message : "Request failed.");
        return ResponseEntity.status(status).body(payload);
    }

    private String resolve(String key) {
        return messageSource.getMessage(
                key != null ? key : "unknown_error",
                null,
                key != null ? key : "An unexpected error occurred.",
                LocaleContextHolder.getLocale());
    }
}
