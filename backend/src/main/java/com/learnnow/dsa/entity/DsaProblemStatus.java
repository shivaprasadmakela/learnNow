package com.learnnow.dsa.entity;

/**
 * Publication state. Mirrors {@code ContentStatus} in the course catalogue rather than reusing it,
 * so the sheet can gain states the course tables do not want.
 */
public enum DsaProblemStatus {
    DRAFT,
    PUBLISHED
}
