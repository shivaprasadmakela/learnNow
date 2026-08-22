package com.learnnow.common.dto;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Builds a {@link Pageable} from raw request parameters.
 *
 * <p>Clamping happens here rather than at each controller so a client cannot turn a paginated
 * endpoint back into an unbounded one by asking for {@code size=100000}, and so every list endpoint
 * agrees on the same first-page size the UI assumes.
 */
public final class PageRequests {

    /** First-page size the infinite-scroll UI requests when it does not say otherwise. */
    public static final int DEFAULT_PAGE_SIZE = 10;

    public static final int MAX_PAGE_SIZE = 100;

    private PageRequests() {}

    public static Pageable of(Integer page, Integer size) {
        return PageRequest.of(normalisePage(page), normaliseSize(size));
    }

    public static Pageable of(Integer page, Integer size, Sort sort) {
        return PageRequest.of(normalisePage(page), normaliseSize(size), sort);
    }

    public static int normalisePage(Integer page) {
        return page == null || page < 0 ? 0 : page;
    }

    public static int normaliseSize(Integer size) {
        if (size == null || size <= 0) return DEFAULT_PAGE_SIZE;
        return Math.min(size, MAX_PAGE_SIZE);
    }
}
