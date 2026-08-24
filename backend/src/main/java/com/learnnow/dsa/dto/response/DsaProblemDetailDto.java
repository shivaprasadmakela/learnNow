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
        List<DsaHintDto> hints,
        List<DsaApproachDto> approaches,
        List<DsaCheckDto> checks,
        List<DsaHarnessStubDto> harnesses,
        boolean judgeable,
        int totalTestCases,
        DsaProblemProgressDto progress,
        String previousSlug,
        String nextSlug) {}
