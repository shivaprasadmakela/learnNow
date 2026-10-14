package com.learnnow.paths.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.learnnow.admin.dto.response.AdminPathDto;
import com.learnnow.admin.service.ContentAuthoringService;
import com.learnnow.paths.dto.response.CatalogPathDto;
import com.learnnow.paths.dto.response.PathSummaryDto;
import com.learnnow.paths.dto.response.TopicSummaryDto;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

/**
 * Learners used to see every topic and lesson of a published path whatever their own status: the
 * topic list matched "topic published OR path published", and the topic page ignored the status it
 * was given. So nothing inside a live course could be kept in draft.
 */
@SpringBootTest
class ContentVisibilityTest extends com.learnnow.AbstractIntegrationTest {

    @Autowired private ContentAuthoringService authoring;
    @Autowired private CatalogService catalog;

    @Test
    @Transactional
    void aDraftTopicInsideALiveCourseIsHidden() {
        AdminPathDto path =
                authoring.saveOrUpdatePath(
                        livePath(
                                topic("Ready", "PUBLISHED", List.of(lesson("Live", "PUBLISHED"))),
                                topic("Still being written", "DRAFT", List.of())));

        List<TopicSummaryDto> listed = catalog.getTopicsForPath(path.id());

        assertThat(listed).extracting(TopicSummaryDto::title).containsExactly("Ready");
        assertThat(catalog.getTopicDetails(path.topics().get(1).id(), null)).isEmpty();
    }

    @Test
    @Transactional
    void aDraftLessonIsLeftOutOfAPublishedTopic() {
        AdminPathDto path =
                authoring.saveOrUpdatePath(
                        livePath(
                                topic(
                                        "Ready",
                                        "PUBLISHED",
                                        List.of(
                                                lesson("Live lesson", "PUBLISHED"),
                                                lesson("Draft lesson", "DRAFT")))));

        UUID topicId = path.topics().get(0).id();

        assertThat(catalog.getTopicDetails(topicId, null))
                .hasValueSatisfying(
                        t ->
                                assertThat(t.subtopics())
                                        .extracting(s -> s.title())
                                        .containsExactly("Live lesson"));
    }

    @Test
    @Transactional
    void pathTotalsCountOnlyPublishedTopicsAndLessons() {
        AdminPathDto path =
                authoring.saveOrUpdatePath(
                        livePath(
                                topic(
                                        "Ready",
                                        "PUBLISHED",
                                        List.of(
                                                lesson("Live", "PUBLISHED"),
                                                lesson("Draft", "DRAFT"))),
                                topic(
                                        "Also ready",
                                        "PUBLISHED",
                                        List.of(lesson("Live", "PUBLISHED"))),
                                topic(
                                        "Still being written",
                                        "DRAFT",
                                        List.of(lesson("Live", "PUBLISHED")))));

        assertThat(catalog.getPublicCatalogPaths(PageRequest.of(0, 100)).content())
                .filteredOn(listed -> listed.id().equals(path.id()))
                .extracting(CatalogPathDto::topicCount, CatalogPathDto::estimatedMinutes)
                .containsExactly(tuple(2L, 10L));
        assertThat(catalog.getAllPaths(PageRequest.of(0, 100)).content())
                .filteredOn(listed -> listed.id().equals(path.id()))
                .extracting(PathSummaryDto::topicCount, PathSummaryDto::estimatedMinutes)
                .containsExactly(tuple(2, 10L));
    }

    private static AdminPathDto livePath(AdminPathDto.AdminTopicDto... topics) {
        return new AdminPathDto(
                null,
                "Visibility " + UUID.randomUUID(),
                "d",
                "Backend",
                "learnNow",
                "PUBLISHED",
                List.of(topics));
    }

    private static AdminPathDto.AdminTopicDto topic(
            String title, String status, List<AdminPathDto.AdminSubtopicDto> lessons) {
        return new AdminPathDto.AdminTopicDto(
                null, title, "t", "course", "1 hour", 1, status, lessons);
    }

    private static AdminPathDto.AdminSubtopicDto lesson(String title, String status) {
        return new AdminPathDto.AdminSubtopicDto(
                null,
                title,
                "### Body",
                1,
                status,
                "beginner",
                "concept",
                List.of(),
                null,
                5,
                List.of(),
                List.of());
    }
}
