package com.learnnow.learningprogress.service;

import com.learnnow.learningprogress.dto.response.DashboardBanner;
import com.learnnow.learningprogress.entity.UserSubtopicProgress;
import com.learnnow.learningprogress.entity.UserTopicProgress;
import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.learningprogress.service.PathProgressService.PathProgress;
import com.learnnow.paths.dto.response.NextLessonDto;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Path;
import com.learnnow.paths.repository.PathRepository;
import com.learnnow.paths.repository.PathTopicRepository;
import com.learnnow.paths.service.NextLessonService;
import com.learnnow.tracks.entity.Track;
import com.learnnow.tracks.entity.TrackStep;
import com.learnnow.tracks.repository.TrackRepository;
import com.learnnow.tracks.repository.TrackStepRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Decides the dashboard's next-step card, so a learner opening the app is told exactly what to do.
 *
 * <ol>
 *   <li>CONTINUE - the path they were last working in still has unfinished lessons: open the first
 *       of them.
 *   <li>NEXT - they finished that path: the next unfinished step of a career track it belongs to,
 *       otherwise another unfinished path, same category first.
 *   <li>START - they have not completed anything: the first step of the first career track.
 *   <li>DONE - every published path is finished.
 * </ol>
 *
 * <p>Everything is ordered - tracks by their catalog order, paths by title - so the same learner
 * always sees the same card. The card it replaced picked "the first path" from an unordered query,
 * and a newcomer's recommendation could change between visits.
 *
 * <p>Which paths still have something to study is worked out up front, in a handful of grouped
 * queries, so the walk below skips finished paths without asking the database about each one; it
 * fetches lesson order only for the path it is about to recommend. Every track's steps arrive in
 * one query rather than one per track.
 */
@Service
@RequiredArgsConstructor
public class NextStepService {

    private final PathRepository pathRepository;
    private final PathTopicRepository pathTopicRepository;
    private final TrackRepository trackRepository;
    private final TrackStepRepository trackStepRepository;
    private final UserSubtopicProgressRepository subtopicProgressRepository;
    private final UserTopicProgressRepository topicProgressRepository;
    private final NextLessonService nextLessonService;
    private final PathProgressService pathProgressService;

    @Transactional(readOnly = true)
    public DashboardBanner forUser(String userId) {
        List<Path> published = pathRepository.findByStatus(ContentStatus.PUBLISHED);
        return forUser(
                userId,
                published,
                pathProgressService.forPaths(published.stream().map(Path::getId).toList(), userId));
    }

    /**
     * For a caller already holding the published paths and the learner's progress through them -
     * the dashboard, which needs both for its own counts.
     */
    @Transactional(readOnly = true)
    public DashboardBanner forUser(String userId, List<Path> published, PathProgress progress) {
        List<Path> paths =
                published.stream()
                        .sorted(Comparator.comparing(Path::getTitle, String.CASE_INSENSITIVE_ORDER))
                        .toList();
        if (paths.isEmpty()) {
            return new DashboardBanner(
                    "DONE",
                    null,
                    "No paths yet",
                    "New paths are on the way.",
                    null,
                    "There is nothing to study yet.",
                    null);
        }
        Map<UUID, Path> byId =
                paths.stream().collect(Collectors.toMap(Path::getId, Function.identity()));

        Optional<Path> current = lastWorkedOnPath(userId, byId);
        if (current.isEmpty()) {
            return start(paths, userId, progress);
        }

        Path path = current.get();
        Optional<NextLessonDto> unfinished = firstUnfinished(path, userId, progress);
        if (unfinished.isPresent()) {
            // The label already says "continue where you left off"; a reason would only repeat it.
            return banner("CONTINUE", path, null, unfinished.get());
        }
        return next(path, paths, userId, progress);
    }

    /** Only asks for lesson order when the path is known to have something left in it. */
    private Optional<NextLessonDto> firstUnfinished(
            Path path, String userId, PathProgress progress) {
        if (!progress.hasUnfinishedLesson(path.getId())) return Optional.empty();
        return nextLessonService.firstUnfinished(path, userId);
    }

    private record TrackWithSteps(Track track, List<TrackStep> steps) {}

    /** Every published track's published steps, tracks in catalog order, steps in track order. */
    private List<TrackWithSteps> publishedTracksWithSteps() {
        List<Track> tracks =
                trackRepository.findByStatusOrderByOrderIndexAscTitleAsc(ContentStatus.PUBLISHED);
        if (tracks.isEmpty()) return List.of();
        // The query orders by step index, and grouping keeps each track's steps in that order.
        Map<UUID, List<TrackStep>> stepsByTrackId =
                trackStepRepository
                        .findPublishedSteps(tracks.stream().map(Track::getId).toList())
                        .stream()
                        .collect(Collectors.groupingBy(s -> s.getTrack().getId()));
        return tracks.stream()
                .map(
                        track ->
                                new TrackWithSteps(
                                        track,
                                        stepsByTrackId.getOrDefault(track.getId(), List.of())))
                .toList();
    }

    /** The path of the most recent completed lesson or topic, if it is still published. */
    private Optional<Path> lastWorkedOnPath(String userId, Map<UUID, Path> published) {
        Optional<UserSubtopicProgress> lesson =
                subtopicProgressRepository
                        .findFirstByUserIdAndCompletedTrueAndCompletedAtNotNullOrderByCompletedAtDesc(
                                userId);
        Optional<UserTopicProgress> topic =
                topicProgressRepository
                        .findFirstByUserIdAndCompletedAtNotNullOrderByCompletedAtDesc(userId);

        Instant lessonAt = lesson.map(UserSubtopicProgress::getCompletedAt).orElse(null);
        Instant topicAt = topic.map(UserTopicProgress::getCompletedAt).orElse(null);
        UUID pathId;
        if (topicAt != null && (lessonAt == null || topicAt.isAfter(lessonAt))) {
            pathId = topic.get().getPathId();
        } else if (lessonAt != null) {
            UUID topicId = lesson.get().getTopicId();
            // The path the learner opened the topic from, when it was recorded; otherwise the
            // topic's own path. A topic can belong to several.
            pathId =
                    topicProgressRepository
                            .findByUserIdAndTopicId(userId, topicId)
                            .map(UserTopicProgress::getPathId)
                            .orElseGet(
                                    () ->
                                            pathTopicRepository
                                                    .findPrimaryPathIdByTopicId(topicId)
                                                    .orElse(null));
        } else {
            return Optional.empty();
        }
        return Optional.ofNullable(pathId).map(published::get);
    }

    /** After finishing a path: its track's next unfinished step, else another unfinished path. */
    private DashboardBanner next(
            Path finished, List<Path> paths, String userId, PathProgress progress) {
        for (TrackWithSteps entry : publishedTracksWithSteps()) {
            Track track = entry.track();
            List<TrackStep> steps = entry.steps();
            int at = indexOf(steps, finished.getId());
            if (at < 0) continue;
            List<TrackStep> after =
                    Stream.concat(
                                    steps.subList(at + 1, steps.size()).stream()
                                            .filter(s -> !s.isOptional()),
                                    steps.subList(0, at).stream().filter(s -> !s.isOptional()))
                            .toList();
            for (TrackStep step : after) {
                Optional<NextLessonDto> lesson = firstUnfinished(step.getPath(), userId, progress);
                if (lesson.isPresent()) {
                    return banner(
                            "NEXT",
                            step.getPath(),
                            "You finished "
                                    + finished.getTitle()
                                    + ". Next in your "
                                    + track.getTitle()
                                    + " track.",
                            lesson.get());
                }
            }
        }

        // No track to follow: another unfinished path, same category first.
        List<Path> candidates =
                Stream.concat(
                                paths.stream()
                                        .filter(
                                                p ->
                                                        Objects.equals(
                                                                p.getCategory(),
                                                                finished.getCategory())),
                                paths.stream()
                                        .filter(
                                                p ->
                                                        !Objects.equals(
                                                                p.getCategory(),
                                                                finished.getCategory())))
                        .filter(p -> !p.getId().equals(finished.getId()))
                        .toList();
        for (Path candidate : candidates) {
            Optional<NextLessonDto> lesson = firstUnfinished(candidate, userId, progress);
            if (lesson.isPresent()) {
                return banner(
                        "NEXT",
                        candidate,
                        "You finished " + finished.getTitle() + ". Try this one next.",
                        lesson.get());
            }
        }
        return new DashboardBanner(
                "DONE",
                null,
                "Every path finished",
                "You have completed every published path.",
                null,
                "Nothing left to start - new paths will appear here.",
                null);
    }

    /** Nothing completed yet: the first step of the first career track, else the first path. */
    private DashboardBanner start(List<Path> paths, String userId, PathProgress progress) {
        for (TrackWithSteps entry : publishedTracksWithSteps()) {
            Track track = entry.track();
            for (TrackStep step : entry.steps()) {
                if (step.isOptional()) continue;
                Optional<NextLessonDto> lesson = firstUnfinished(step.getPath(), userId, progress);
                if (lesson.isPresent()) {
                    return banner(
                            "START",
                            step.getPath(),
                            "The first step of the " + track.getTitle() + " track.",
                            lesson.get());
                }
            }
        }
        for (Path path : paths) {
            Optional<NextLessonDto> lesson = firstUnfinished(path, userId, progress);
            if (lesson.isPresent()) {
                return banner("START", path, "A good place to begin.", lesson.get());
            }
        }
        return new DashboardBanner(
                "DONE",
                null,
                "No lessons yet",
                "New lessons are on the way.",
                null,
                "There is nothing to study yet.",
                null);
    }

    private static int indexOf(List<TrackStep> steps, UUID pathId) {
        for (int i = 0; i < steps.size(); i++) {
            if (steps.get(i).getPath().getId().equals(pathId)) return i;
        }
        return -1;
    }

    private static DashboardBanner banner(
            String type, Path path, String reason, NextLessonDto lesson) {
        return new DashboardBanner(
                type,
                path.getId(),
                path.getTitle(),
                path.getDescription(),
                path.getCategory(),
                reason,
                lesson);
    }
}
