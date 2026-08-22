package com.learnnow.common.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

/**
 * The infinite-scroll UI stops asking for pages the moment {@code hasNext} is false, so these two
 * classes decide both how much a single request can pull and whether the list ever completes.
 */
class PaginationTest {

    @Test
    void defaultsToTheFirstPageOfTen() {
        Pageable pageable = PageRequests.of(null, null);
        assertThat(pageable.getPageNumber()).isZero();
        assertThat(pageable.getPageSize()).isEqualTo(PageRequests.DEFAULT_PAGE_SIZE);
    }

    @Test
    void clampsAnOversizedRequestSoAnEndpointCannotBeMadeUnbounded() {
        assertThat(PageRequests.of(0, 100_000).getPageSize()).isEqualTo(PageRequests.MAX_PAGE_SIZE);
    }

    @Test
    void treatsNonsensicalPagingAsTheFirstPage() {
        Pageable pageable = PageRequests.of(-3, 0);
        assertThat(pageable.getPageNumber()).isZero();
        assertThat(pageable.getPageSize()).isEqualTo(PageRequests.DEFAULT_PAGE_SIZE);
    }

    @Test
    void reportsAFurtherPageWhileElementsRemain() {
        PageResponse<String> response = PageResponse.of(List.of("a", "b"), PageRequest.of(0, 2), 5);

        assertThat(response.hasNext()).isTrue();
        assertThat(response.totalPages()).isEqualTo(3);
    }

    @Test
    void reportsNoFurtherPageOnAnExactlyFullLastPage() {
        PageResponse<String> response = PageResponse.of(List.of("c", "d"), PageRequest.of(1, 2), 4);

        assertThat(response.hasNext()).isFalse();
        assertThat(response.page()).isEqualTo(1);
        assertThat(response.totalPages()).isEqualTo(2);
    }

    @Test
    void anEmptyResultIsAFinishedPage() {
        PageResponse<String> response = PageResponse.of(List.of(), PageRequest.of(0, 10), 0);

        assertThat(response.content()).isEmpty();
        assertThat(response.hasNext()).isFalse();
        assertThat(response.totalPages()).isZero();
    }
}
