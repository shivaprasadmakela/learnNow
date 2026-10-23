package com.learnnow.dsa.dto.response;

import java.util.List;
import java.util.UUID;

/**
 * Everything the workspace needs to render one problem.
 *
 * <p>Note what is absent, and that it is absent by construction rather than by stripping: there is
 * no field for a harness's driver code or reference solution, and none for a non-sample test case.
 * Leaking any of those would require adding a field here, which is a decision somebody has to make
 * on purpose.
 *
 * <p>Hints and the editorial are not here either, only their outline: {@code hintCount} and one
 * {@link DsaApproachSummaryDto} per approach. Each hint and the editorial itself come from their
 * own endpoints when the learner asks for them, so a learner who wants to solve the problem unaided
 * is never sent the solution along with the statement.
 *
 * <p>{@code bookmarked} is false for an anonymous caller, as it is on {@link DsaProblemRowDto}.
 *
 * <p>{@code judgeable} tells the UI whether to offer Run and Submit at all. A problem with no
 * harness for any language, or with no test cases, falls back to the manual solved toggle - which
 * is the normal state of a problem whose notes are written but whose harness is not.
 */
public record DsaProblemDetailDto(
        UUID id,
        String slug,
        String title,
        String statement,
        String difficulty,
        int estimatedMinutes,
        List<String> tags,
        String youtubeUrl,
        Integer youtubePosition,
        String playlistUrl,
        String practiceUrl,
        String practicePlatform,
        String stepSlug,
        String stepTitle,
        String sectionTitle,
        List<DsaTestCaseDto> samples,
        int hintCount,
        List<DsaApproachSummaryDto> approaches,
        List<DsaCheckDto> checks,
        List<DsaHarnessStubDto> harnesses,
        boolean judgeable,
        int totalTestCases,
        DsaProblemProgressDto progress,
        boolean bookmarked,
        String previousSlug,
        String nextSlug) {}
