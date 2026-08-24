package com.learnnow.dsa.dto.response;

/**
 * The editor-facing half of a harness.
 *
 * <p>There is deliberately no field for {@code driverCode} or {@code referenceSolution}. Exposing
 * either would take adding a field here, rather than forgetting to strip one somewhere.
 */
public record DsaHarnessStubDto(String language, String starterCode) {}
