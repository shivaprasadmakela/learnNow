package com.learnnow.common.dto;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Envelope for every paginated list endpoint.
 *
 * <p>Spring's own {@code Page} serialises its internal {@code Pageable} and sort structures, which
 * are noise for the client and unstable across Spring Data versions. This exposes only what the
 * infinite-scroll UI needs: the slice itself and whether another one exists.
 */
public record PageResponse<T>(
        List<T> content, int page, int size, long totalElements, int totalPages, boolean hasNext) {

    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.hasNext());
    }

    /** For slices assembled by hand, where the content was mapped away from the paged entities. */
    public static <T> PageResponse<T> of(List<T> content, Pageable pageable, long totalElements) {
        int size = pageable.getPageSize();
        int page = pageable.getPageNumber();
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        return new PageResponse<>(
                content,
                page,
                size,
                totalElements,
                totalPages,
                (long) (page + 1) * size < totalElements);
    }

    /** Wraps an unpaginated list so a caller can keep one response shape. */
    public static <T> PageResponse<T> ofAll(List<T> content) {
        return new PageResponse<>(content, 0, content.size(), content.size(), 1, false);
    }
}
