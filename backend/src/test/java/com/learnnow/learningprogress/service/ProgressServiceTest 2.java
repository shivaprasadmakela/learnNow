package com.learnnow.learningprogress.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.learnnow.learningprogress.entity.UserSubtopicProgress;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.entity.Subtopic;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.PathTopicRepository;
import com.learnnow.paths.repository.SubtopicRepository;
import com.learnnow.paths.repository.TopicRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

/** Regression cover for the toggle-based point farming and the path-resolution crash. */
class ProgressServiceTest {

    private static final String USER = "u-1";

    private TopicRepository topicRepository;
    private SubtopicRepository subtopicRepository;
    private PathTopicRepository pathTopicRepository;
    private UserTopicProgressRepository topicProgressRepository;
    private UserSubtopicProgressRepository subtopicProgressRepository;
    private UserLearningPreferencesRepository preferencesRepository;
    private ActivityRecordingService activityRecordingService;
    private ProgressService progressService;

    @BeforeEach
    void setUp() {
        topicRepository = Mockito.mock(TopicRepository.class);
        subtopicRepository = Mockito.mock(SubtopicRepository.class);
        pathTopicRepository = Mockito.mock(PathTopicRepository.class);
        topicProgressRepository = Mockito.mock(UserTopicProgressRepository.class);
        subtopicProgressRepository = Mockito.mock(UserSubtopicProgressRepository.class);
        preferencesRepository = Mockito.mock(UserLearningPreferencesRepository.class);
        activityRecordingService = Mockito.mock(ActivityRecordingService.class);

        progressService =
                new ProgressService(
                        topicRepository,
                        subtopicRepository,
                        pathTopicRepository,
                        topicProgressRepository,
                        subtopicProgressRepository,
                        preferencesRepository,
                        activityRecordingService);
    }

    @Test
    @DisplayName("un-completing a subtopic is ignored, so points cannot be re-earned")
    void unCompletingASubtopicIsANoOp() {
        UUID subtopicId = UUID.randomUUID();

        progressService.markSubtopicComplete(USER, subtopicId, false);

        // Nothing is read or written at all. Previously this cleared the completion flag
        // without reversing the points, so toggling off then on again paid out each time.
        verifyNoInteractions(subtopicRepository);
        verifyNoInteractions(subtopicProgressRepository);
        verifyNoInteractions(activityRecordingService);
    }

    @Test
    @DisplayName("completing an already-complete subtopic earns nothing further")
    void repeatCompletionEarnsNothing() {
        UUID subtopicId = UUID.randomUUID();
        UUID topicId = UUID.randomUUID();

        Topic topic = Topic.builder().id(topicId).title("T").build();
        Subtopic subtopic = new Subtopic();
        subtopic.setId(subtopicId);
        subtopic.setTopic(topic);

        when(subtopicRepository.findByIdWithTopic(subtopicId)).thenReturn(Optional.of(subtopic));
        when(pathTopicRepository.findPrimaryPathIdByTopicId(topicId))
                .thenReturn(Optional.of(UUID.randomUUID()));
        when(subtopicProgressRepository.findByUserIdAndSubtopicId(USER, subtopicId))
                .thenReturn(
                        Optional.of(
                                UserSubtopicProgress.builder()
                                        .userId(USER)
                                        .subtopicId(subtopicId)
                                        .topicId(topicId)
                                        .completed(true)
                                        .build()));

        progressService.markSubtopicComplete(USER, subtopicId, true);

        verify(subtopicProgressRepository, never()).save(any());
        verifyNoInteractions(activityRecordingService);
    }

    @Test
    @DisplayName("a topic attached to no path fails cleanly instead of throwing a null pointer")
    void topicWithNoPathAttachmentFailsCleanly() {
        UUID topicId = UUID.randomUUID();
        // path is null - exactly the state the admin attach flow used to leave behind.
        Topic orphan = Topic.builder().id(topicId).title("Orphan").build();

        when(topicRepository.findById(topicId)).thenReturn(Optional.of(orphan));
        when(pathTopicRepository.findPrimaryPathIdByTopicId(topicId)).thenReturn(Optional.empty());

        // A named domain error, not the NullPointerException that used to surface as a 400.
        com.learnnow.common.exception.NotFoundException ex =
                assertThrows(
                        com.learnnow.common.exception.NotFoundException.class,
                        () -> progressService.setTopicCompletion(USER, topicId, true));
        assertEquals("topic_not_attached_to_path", ex.getMessage());
    }
}
