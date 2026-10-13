package com.learnnow.tools;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnnow.admin.dto.request.ImportCourseRequest;
import com.learnnow.admin.dto.response.ImportResultDto;
import com.learnnow.admin.service.ContentAuthoringService;
import com.learnnow.dsa.dto.request.DsaImportRequest;
import com.learnnow.dsa.dto.response.DsaImportResultDto;
import com.learnnow.dsa.service.DsaImportService;
import java.io.File;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Imports course JSON and DSA step JSON by calling the services directly, for the local database. A
 * file with a {@code sheetSlug} is a DSA step; anything else is a course.
 *
 * <p>Only active under the "import" profile, so it cannot run in a normal boot. The HTTP route in
 * paths/tools/import_paths.py is the one to use against dev and prod, where an admin token is
 * available; this exists because the local database is reached without one.
 *
 * <p>mvn spring-boot:run -Dspring-boot.run.profiles=local,import \
 * -Dspring-boot.run.arguments="--spring.main.web-application-type=none /abs/path/to/file.json"
 */
@Component
@Profile("import")
public class ImportPaths implements ApplicationRunner {

    private final ContentAuthoringService authoring;
    private final DsaImportService dsaImport;
    private final ObjectMapper mapper;

    public ImportPaths(
            ContentAuthoringService authoring, DsaImportService dsaImport, ObjectMapper mapper) {
        this.authoring = authoring;
        this.dsaImport = dsaImport;
        this.mapper = mapper;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (args.getNonOptionArgs().isEmpty()) {
            throw new IllegalArgumentException("usage: ImportPaths <file.json>...");
        }
        for (String file : args.getNonOptionArgs()) {
            JsonNode json = mapper.readTree(new File(file));
            if (json.has("sheetSlug")) {
                importDsaStep(file, mapper.treeToValue(json, DsaImportRequest.class));
                continue;
            }
            ImportCourseRequest request = mapper.treeToValue(json, ImportCourseRequest.class);
            ImportResultDto result = authoring.importCourse(request);
            System.out.printf(
                    "IMPORTED %s -> id=%s mode=%s status=%s topics=%d subtopics=%d questions=%d%n",
                    file,
                    result.pathId(),
                    result.mode(),
                    result.status(),
                    result.topicsCreated(),
                    result.subtopicsCreated(),
                    result.questionsCreated());
        }
    }

    private void importDsaStep(String file, DsaImportRequest request) {
        DsaImportResultDto result = dsaImport.importContent(request);
        System.out.printf(
                "IMPORTED %s -> sheet=%s steps +%d ~%d problems +%d ~%d harnesses=%d tests=%d%n",
                file,
                result.sheetSlug(),
                result.stepsCreated(),
                result.stepsUpdated(),
                result.problemsCreated(),
                result.problemsUpdated(),
                result.harnessesWritten(),
                result.testCasesWritten());
    }
}
