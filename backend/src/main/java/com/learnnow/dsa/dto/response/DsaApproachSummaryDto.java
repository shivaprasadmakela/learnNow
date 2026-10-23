package com.learnnow.dsa.dto.response;

import java.util.UUID;

/**
 * One editorial approach as the problem page sees it before the editorial is opened: what kind it
 * is and what it costs, without the reasoning or the code.
 *
 * <p>The intuition is left out with the code, not just the code. It is the approach in prose -
 * "sort and take the last element" - so sending it up front would hand the answer to anyone who
 * looked at the network tab. The kind and the complexities are what the editorial's gate describes,
 * and they say how good a solution can get without saying how. There is no title column; the client
 * names an approach after its kind.
 */
public record DsaApproachSummaryDto(
        UUID id, String kind, int orderIndex, String timeComplexity, String spaceComplexity) {}
