package com.learnnow.paths.entity;

import com.learnnow.common.exception.ValidationException;

/**
 * The fixed set of categories a path can belong to.
 *
 * <p>Category used to be free text, and every path ended up with a category of its own: five paths,
 * five categories, and a catalog filter that could not narrow anything down. A short shared list is
 * what makes the filter worth having, so every write is checked against it.
 *
 * <p>The UI keeps the same list, in the same order, in {@code shared/constants/pathCategories.ts}.
 */
public enum PathCategory {
    BACKEND("Backend"),
    FRONTEND("Frontend"),
    DATA("Data");

    private final String label;

    PathCategory(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    /**
     * The stored label for {@code raw}, matched ignoring case and surrounding space, or {@code
     * fallback}'s when nothing was given.
     *
     * @throws ValidationException when {@code raw} names no category
     */
    public static String canonical(String raw, PathCategory fallback) {
        if (raw == null || raw.isBlank()) {
            return fallback.label;
        }
        String wanted = raw.trim();
        for (PathCategory c : values()) {
            if (c.label.equalsIgnoreCase(wanted)) {
                return c.label;
            }
        }
        throw new ValidationException("path_category_invalid");
    }
}
