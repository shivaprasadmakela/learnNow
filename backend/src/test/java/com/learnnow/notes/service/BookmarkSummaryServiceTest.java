package com.learnnow.notes.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnnow.AbstractIntegrationTest;
import com.learnnow.dsa.dto.request.DsaImportRequest;
import com.learnnow.dsa.entity.DsaProgressStatus;
import com.learnnow.dsa.entity.UserDsaProblemProgress;
import com.learnnow.dsa.repository.DsaProblemRepository;
import com.learnnow.dsa.repository.UserDsaProblemProgressRepository;
import com.learnnow.dsa.service.DsaImportService;
import com.learnnow.learningprogress.entity.UserSubtopicProgress;
import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.notes.dto.response.BookmarkSummaryResponse;
import com.learnnow.notes.entity.NoteTarget;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Path;
import com.learnnow.paths.entity.PathTopic;
import com.learnnow.paths.entity.PathTopicId;
import com.learnnow.paths.entity.Subtopic;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.PathRepository;
import com.learnnow.paths.repository.PathTopicRepository;
import com.learnnow.paths.repository.SubtopicRepository;
import com.learnnow.paths.repository.TopicRepository;
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * The bookmarks list used to fetch every bookmarked topic and problem in full, one request each, to
 * show a title and a progress bar. The summary answers it in one call; these cases pin what it
 * carries, what it leaves out, and that its cost does not grow with the number of bookmarks.
 */
@SpringBootTest
@Transactional
class BookmarkSummaryServiceTest extends AbstractIntegrationTest {

    @Autowired private BookmarkSummaryService summaries;
    @Autowired private NotesService notes;
    @Autowired private UserRepository users;
    @Autowired private PathRepository pathRepository;
    @Autowired private PathTopicRepository pathTopicRepository;
    @Autowired private TopicRepository topicRepository;
    @Autowired private SubtopicRepository subtopicRepository;
    @Autowired private UserSubtopicProgressRepository subtopicProgress;
    @Autowired private DsaImportService dsaImport;
    @Autowired private DsaProblemRepository problemRepository;
    @Autowired private UserDsaProblemProgressRepository problemProgress;
    @Autowired private EntityManagerFactory entityManagerFactory;
    @Autowired private EntityManager entityManager;

    private String user;
    private Path path;

    @BeforeEach
    void learner() {
        user = "BOOKMARK_SUMMARY_" + UUID.randomUUID().toString().substring(0, 8);
        users.save(
                User.builder()
                        .id(user)
                        .email(user.toLowerCase() + "@example.com")
                        .passwordHash("x")
                        .fullName("Bookmark Summary")
                        .build());
        path =
                pathRepository.save(
                        Path.builder()
                                .title("Summary Path " + UUID.randomUUID())
                                .status(ContentStatus.PUBLISHED)
                                .build());
    }

    @Test
    void aTopicBookmarkCarriesItsTitlePathAndPublishedLessonProgress() {
        Topic topic = topic("Bookmarked Topic", ContentStatus.PUBLISHED);
        Subtopic done = lesson(topic, 1, ContentStatus.PUBLISHED);
        lesson(topic, 2, ContentStatus.PUBLISHED);
        lesson(topic, 3, ContentStatus.DRAFT); // a learner cannot open it, so it is not counted
        complete(topic, done);
        notes.toggleBookmark(user, NoteTarget.TOPIC, topic.getId());

        List<BookmarkSummaryResponse> result = summaries.summarise(user);

        assertThat(result).hasSize(1);
        BookmarkSummaryResponse bookmark = result.get(0);
        assertThat(bookmark.target()).isEqualTo(NoteTarget.TOPIC);
        assertThat(bookmark.targetId()).isEqualTo(topic.getId());
        assertThat(bookmark.problem()).isNull();
        assertThat(bookmark.topic().title()).isEqualTo("Bookmarked Topic");
        assertThat(bookmark.topic().pathId()).isEqualTo(path.getId());
        assertThat(bookmark.topic().pathTitle()).isEqualTo(path.getTitle());
        assertThat(bookmark.topic().progressPercentage()).isEqualTo(50);
        assertThat(bookmark.topic().completed()).isFalse();
    }

    @Test
    void aProblemBookmarkCarriesWhereItLivesAndTheLearnersStatus() {
        String slug = "summary-" + UUID.randomUUID().toString().substring(0, 8);
        importProblems(slug, List.of(slug + "-solved"), "PUBLISHED");
        UUID problemId = problemRepository.findBySlug(slug + "-solved").orElseThrow().getId();
        problemProgress.save(
                UserDsaProblemProgress.builder()
                        .userId(user)
                        .problemId(problemId)
                        .status(DsaProgressStatus.SOLVED)
                        .solvedAt(Instant.now())
                        .build());
        notes.toggleBookmark(user, NoteTarget.DSA_PROBLEM, problemId);

        List<BookmarkSummaryResponse> result = summaries.summarise(user);

        assertThat(result).hasSize(1);
        BookmarkSummaryResponse bookmark = result.get(0);
        assertThat(bookmark.target()).isEqualTo(NoteTarget.DSA_PROBLEM);
        assertThat(bookmark.topic()).isNull();
        assertThat(bookmark.problem().slug()).isEqualTo(slug + "-solved");
        assertThat(bookmark.problem().title()).isEqualTo("Problem " + slug + "-solved");
        assertThat(bookmark.problem().difficulty()).isEqualTo("MEDIUM");
        assertThat(bookmark.problem().stepSlug()).isEqualTo(slug + "-step");
        assertThat(bookmark.problem().stepTitle()).isEqualTo("Step " + slug);
        assertThat(bookmark.problem().status()).isEqualTo("SOLVED");
    }

    @Test
    void unpublishedTargetsDropOutButTheirBookmarksStay() {
        Topic draft = topic("Draft Topic", ContentStatus.DRAFT);
        String slug = "summary-draft-" + UUID.randomUUID().toString().substring(0, 8);
        importProblems(slug, List.of(slug + "-p"), "DRAFT");
        UUID draftProblem = problemRepository.findBySlug(slug + "-p").orElseThrow().getId();
        notes.toggleBookmark(user, NoteTarget.TOPIC, draft.getId());
        notes.toggleBookmark(user, NoteTarget.DSA_PROBLEM, draftProblem);

        assertThat(summaries.summarise(user)).isEmpty();
        assertThat(notes.getAllBookmarks(user)).hasSize(2);
    }

    @Test
    void costsTheSameNumberOfQueriesForTwoBookmarksAsForEight() {
        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);

        long forTwo = statementsToSummarise(2);
        long forEight = statementsToSummarise(8);

        assertThat(forTwo).as("statement statistics are not being recorded").isPositive();
        assertThat(forEight)
                .as("a per-bookmark query has come back (%d for 2, %d for 8)", forTwo, forEight)
                .isEqualTo(forTwo);
    }

    /** A fresh learner with this many bookmarked topics, and what summarising them cost. */
    private long statementsToSummarise(int count) {
        learner();
        for (int i = 0; i < count; i++) {
            Topic topic = topic("Counted " + i, ContentStatus.PUBLISHED);
            complete(topic, lesson(topic, 1, ContentStatus.PUBLISHED));
            notes.toggleBookmark(user, NoteTarget.TOPIC, topic.getId());
        }
        // The fixtures' own inserts would otherwise be flushed by the first query, and counted.
        entityManager.flush();
        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();
        assertThat(summaries.summarise(user)).hasSize(count);
        return statistics.getPrepareStatementCount();
    }

    private Topic topic(String title, ContentStatus status) {
        Topic topic =
                topicRepository.save(
                        Topic.builder().title(title).description("d").status(status).build());
        pathTopicRepository.save(
                PathTopic.builder()
                        .id(new PathTopicId(path.getId(), topic.getId()))
                        .path(path)
                        .topic(topic)
                        .orderIndex(1)
                        .build());
        return topic;
    }

    private Subtopic lesson(Topic topic, int order, ContentStatus status) {
        return subtopicRepository.save(
                Subtopic.builder()
                        .topic(topic)
                        .title("Lesson " + order)
                        .content("Body")
                        .orderIndex(order)
                        .status(status)
                        .version(1)
                        .build());
    }

    private void complete(Topic topic, Subtopic lesson) {
        subtopicProgress.save(
                UserSubtopicProgress.builder()
                        .userId(user)
                        .topicId(topic.getId())
                        .subtopicId(lesson.getId())
                        .completed(true)
                        .completedAt(Instant.now())
                        .build());
    }

    private void importProblems(String slug, List<String> problemSlugs, String status) {
        List<DsaImportRequest.ImportProblem> problems =
                problemSlugs.stream()
                        .map(
                                p ->
                                        new DsaImportRequest.ImportProblem(
                                                p,
                                                "Problem " + p,
                                                "s",
                                                "MEDIUM",
                                                List.of(),
                                                15,
                                                null,
                                                null,
                                                null,
                                                null,
                                                status,
                                                null,
                                                null,
                                                null,
                                                null,
                                                null))
                        .toList();
        dsaImport.importContent(
                new DsaImportRequest(
                        slug + "-sheet",
                        "Sheet " + slug,
                        null,
                        null,
                        List.of(
                                new DsaImportRequest.ImportStep(
                                        slug + "-step",
                                        1,
                                        "Step " + slug,
                                        null,
                                        List.of(
                                                new DsaImportRequest.ImportSection(
                                                        "Section", null, 1, problems, null))))));
    }
}
