package com.learnnow.tools;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnnow.admin.dto.request.ImportCourseRequest;
import com.learnnow.admin.dto.response.ImportResultDto;
import com.learnnow.admin.service.ContentAuthoringService;
import java.io.File;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Imports a course JSON by calling the authoring service directly, for the local database.
 *
 * <p>Only active under the "import" profile, so it cannot run in a normal boot. The HTTP route in
 * paths/tools/import_paths.py is the one to use against dev and prod, where an admin token is
 * available; this exists because the local database is reached without one.
 *
 * <p>mvn spring-boot:run -Dspring-boot.run.profiles=local,import \
 * -Dspring-boot.run.arguments="--spring.main.web-application-type=none /abs/path/to/course.json"
 */
@Component
@Profile("import")
public class ImportPaths implements ApplicationRunner {

    private final ContentAuthoringService authoring;
    private final ObjectMapper mapper;

    public ImportPaths(ContentAuthoringService authoring, ObjectMapper mapper) {
        this.authoring = authoring;
        this.mapper = mapper;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (args.getNonOptionArgs().isEmpty()) {
            throw new IllegalArgumentException("usage: ImportPaths <course.json>...");
        }
        for (String file : args.getNonOptionArgs()) {
            ImportCourseRequest request =
                    mapper.readValue(new File(file), ImportCourseRequest.class);
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
}
