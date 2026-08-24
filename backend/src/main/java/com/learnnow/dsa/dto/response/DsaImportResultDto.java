package com.learnnow.dsa.dto.response;

import java.util.List;
import java.util.UUID;

/**
 * What an import actually did. Split into created and updated so a re-import that was supposed to
 * only fill in video URLs is visibly not creating anything.
 */
public record DsaImportResultDto(
        UUID sheetId,
        String sheetSlug,
        int stepsCreated,
        int stepsUpdated,
        int problemsCreated,
        int problemsUpdated,
        int harnessesWritten,
        int testCasesWritten,
        List<String> warnings) {}
