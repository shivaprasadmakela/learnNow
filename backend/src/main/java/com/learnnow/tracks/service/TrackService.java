package com.learnnow.tracks.service;

import com.learnnow.common.exception.ValidationException;
import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Path;
import com.learnnow.paths.repository.PathRepository;
import com.learnnow.paths.repository.TopicRepository;
import com.learnnow.tracks.dto.request.ImportTrackRequest;
import com.learnnow.tracks.dto.response.TrackDetailDto;
import com.learnnow.tracks.dto.response.TrackImportResultDto;
import com.learnnow.tracks.dto.response.TrackSummaryDto;
import com.learnnow.tracks.entity.Track;
import com.learnnow.tracks.entity.TrackStep;
import com.learnnow.tracks.repository.TrackRepository;
import com.learnnow.tracks.repository.TrackStepRepository;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Career tracks: ordered routes through existing paths.
 *
 * <p>A track owns no progress of its own. Each step's percentage is its path's, worked out the way
 * the path list works it out - the mean of the path's published topics, a topic counting fully once
 * the learner marks it complete - so a path shows the same number on its card and on every track it
 * appears in. The track's own percentage weights its required steps by their study time: finishing
 * a sixteen-hour path moves it further than finishing a seven-hour one.
 */
@Service
@RequiredArgsConstructor
public class TrackService {

    private final TrackRepository trackRepository;
    private final TrackStepRepository stepRepository;
    private final PathRepository pathRepository;
    private final TopicRepository topicRepository;
    private final UserSubtopicProgressRepository subtopicProgressRepository;
    private final UserTopicProgressRepository topicProgressRepository;

    /**
     * Published tracks in catalog order. A track left with no published required step is hidden.
     */
    @Transactional(readOnly = true)
    public List<TrackSummaryDto> listTracks(String userId) {
        List<Track> tracks =
                trackRepository.findByStatusOrderByOrderIndexAscTitleAsc(ContentStatus.PUBLISHED);
        if (tracks.isEmpty()) return List.of();

        Map<UUID, List<TrackStep>> stepsByTrack =
                stepRepository
                        .findPublishedSteps(tracks.stream().map(Track::getId).toList())
                        .stream()
                        .collect(Collectors.groupingBy(s -> s.getTrack().getId()));
        PathStats stats =
                pathStats(pathIdsOf(stepsByTrack.values().stream().flatMap(List::stream)), userId);

        List<TrackSummaryDto> out = new ArrayList<>();
        for (Track track : tracks) {
            List<TrackStep> steps = stepsByTrack.getOrDefault(track.getId(), List.of());
            if (steps.stream().allMatch(TrackStep::isOptional)) continue;
            out.add(
                    new TrackSummaryDto(
                            track.getSlug(),
                            track.getTitle(),
                            track.getDescription(),
                            steps.size(),
                            (int) steps.stream().filter(TrackStep::isOptional).count(),
                            sum(steps, false, stats.topicCounts()),
                            sum(steps, false, stats.minutes()),
                            sum(steps, true, stats.minutes()),
                            stats.trackProgress(steps),
                            steps.stream()
                                    .map(
                                            s ->
                                                    new TrackSummaryDto.StepRef(
                                                            s.getPath().getId(),
                                                            s.getPath().getTitle(),
                                                            s.isOptional()))
                                    .toList()));
        }
        return out;
    }

    /** One track's roadmap, or empty when no published track has that slug or it has no step. */
    @Transactional(readOnly = true)
    public Optional<TrackDetailDto> getTrack(String slug, String userId) {
        Optional<Track> found = trackRepository.findBySlugAndStatus(slug, ContentStatus.PUBLISHED);
        if (found.isEmpty()) return Optional.empty();
        Track track = found.get();

        List<TrackStep> steps = stepRepository.findPublishedSteps(List.of(track.getId()));
        if (steps.stream().allMatch(TrackStep::isOptional)) return Optional.empty();
        PathStats stats = pathStats(pathIdsOf(steps.stream()), userId);

        List<TrackDetailDto.Step> roadmap = new ArrayList<>();
        int number = 0;
        for (TrackStep step : steps) {
            Path path = step.getPath();
            roadmap.add(
                    new TrackDetailDto.Step(
                            ++number,
                            path.getId(),
                            path.getTitle(),
                            path.getDescription(),
                            path.getCategory(),
                            step.isOptional(),
                            step.getNote(),
                            stats.topicCounts().getOrDefault(path.getId(), 0L),
                            stats.minutes().getOrDefault(path.getId(), 0L),
                            stats.progressOf(path.getId())));
        }

        return Optional.of(
                new TrackDetailDto(
                        track.getSlug(),
                        track.getTitle(),
                        track.getDescription(),
                        sum(steps, false, stats.minutes()),
                        sum(steps, true, stats.minutes()),
                        stats.trackProgress(steps),
                        roadmap,
                        userId == null ? null : nextLesson(steps, stats, userId)));
    }

    /**
     * Creates or updates the track with the request's slug and replaces its steps.
     *
     * <p>Every step is checked before anything is written, and all the problems are reported
     * together, so an author fixes a file in one pass rather than one error per attempt.
     */
    @Transactional
    public TrackImportResultDto importTrack(ImportTrackRequest request) {
        // The HTTP route validates the request; the local import runner reads the file directly.
        if (request.steps() == null || request.steps().isEmpty() || request.title() == null) {
            throw new ValidationException("A track needs a slug, a title and at least one step.");
        }
        List<String> problems = new ArrayList<>();
        List<Path> paths = new ArrayList<>();
        Set<UUID> seen = new HashSet<>();
        for (ImportTrackRequest.Step step : request.steps()) {
            String title = step.path().trim();
            List<Path> matches = pathRepository.findAllByTitleIgnoreCase(title);
            if (matches.isEmpty()) {
                problems.add("no path is titled \"" + title + "\"");
            } else if (matches.size() > 1) {
                problems.add(matches.size() + " paths are titled \"" + title + "\"");
            } else if (!seen.add(matches.get(0).getId())) {
                problems.add("\"" + title + "\" is listed more than once");
            } else {
                paths.add(matches.get(0));
            }
        }
        if (request.steps().stream().allMatch(ImportTrackRequest.Step::optional)) {
            problems.add("a track needs at least one step that is not optional");
        }
        if (!problems.isEmpty()) {
            throw new ValidationException(
                    "Track \""
                            + request.slug()
                            + "\" was not imported: "
                            + String.join("; ", problems));
        }

        Optional<Track> existing = trackRepository.findBySlug(request.slug());
        Track track = existing.orElseGet(() -> Track.builder().slug(request.slug()).build());
        track.setTitle(request.title().trim());
        track.setDescription(request.description());
        track.setOrderIndex(request.orderIndex() != null ? request.orderIndex() : 0);
        track.setStatus(ContentStatus.PUBLISHED);
        track = trackRepository.save(track);
        if (existing.isPresent()) stepRepository.deleteByTrackId(track.getId());

        List<TrackStep> steps = new ArrayList<>();
        for (int i = 0; i < paths.size(); i++) {
            ImportTrackRequest.Step source = request.steps().get(i);
            steps.add(
                    TrackStep.builder()
                            .track(track)
                            .path(paths.get(i))
                            .stepIndex(i + 1)
                            .optional(source.optional())
                            .note(source.note())
                            .build());
        }
        stepRepository.saveAll(steps);

        return new TrackImportResultDto(
                track.getId(),
                track.getSlug(),
                existing.isPresent() ? "UPDATED" : "CREATED",
                steps.size());
    }

    /**
     * The first lesson the learner has not completed, in the first step they have not finished -
     * required steps before optional ones, each in roadmap order. Null once there is nothing left.
     */
    private TrackDetailDto.NextLesson nextLesson(
            List<TrackStep> steps, PathStats stats, String userId) {
        List<TrackStep> order =
                Stream.concat(
                                steps.stream().filter(s -> !s.isOptional()),
                                steps.stream().filter(TrackStep::isOptional))
                        .toList();
        for (TrackStep step : order) {
            Path path = step.getPath();
            Integer progress = stats.progressOf(path.getId());
            if (progress != null && progress >= 100) continue;

            List<Object[]> lessons = topicRepository.findPublishedLessonsInOrder(path.getId());
            if (lessons.isEmpty()) continue;
            Set<UUID> doneLessons =
                    new HashSet<>(
                            subtopicProgressRepository.findCompletedSubtopicIds(
                                    userId, lessons.stream().map(row -> (UUID) row[2]).toList()));
            Set<UUID> doneTopics =
                    new HashSet<>(
                            topicProgressRepository.findCompletedTopicIds(
                                    userId,
                                    lessons.stream()
                                            .map(row -> (UUID) row[0])
                                            .distinct()
                                            .toList()));
            for (Object[] row : lessons) {
                UUID topicId = (UUID) row[0];
                UUID subtopicId = (UUID) row[2];
                if (doneTopics.contains(topicId) || doneLessons.contains(subtopicId)) continue;
                return new TrackDetailDto.NextLesson(
                        path.getId(),
                        path.getTitle(),
                        topicId,
                        (String) row[1],
                        subtopicId,
                        (String) row[3]);
            }
        }
        return null;
    }

    private static Set<UUID> pathIdsOf(Stream<TrackStep> steps) {
        return steps.map(s -> s.getPath().getId()).collect(Collectors.toSet());
    }

    private static long sum(List<TrackStep> steps, boolean optional, Map<UUID, Long> perPath) {
        return steps.stream()
                .filter(s -> s.isOptional() == optional)
                .mapToLong(s -> perPath.getOrDefault(s.getPath().getId(), 0L))
                .sum();
    }

    /** Topic counts, study minutes and - for a signed-in learner - progress, for a set of paths. */
    private PathStats pathStats(Collection<UUID> pathIds, String userId) {
        if (pathIds.isEmpty()) return new PathStats(Map.of(), Map.of(), null);

        // [pathId, topicId, published lessons] for every published topic of these paths.
        Map<UUID, Map<UUID, Long>> lessonsByPathTopic = new HashMap<>();
        for (Object[] row : topicRepository.countPublishedLessonsByTopicForPathIds(pathIds)) {
            lessonsByPathTopic
                    .computeIfAbsent((UUID) row[0], k -> new LinkedHashMap<>())
                    .put((UUID) row[1], ((Number) row[2]).longValue());
        }
        Map<UUID, Long> topicCounts = new HashMap<>();
        lessonsByPathTopic.forEach((path, topics) -> topicCounts.put(path, (long) topics.size()));

        Map<UUID, Long> minutes = new HashMap<>();
        for (Object[] row : topicRepository.sumPublishedMinutesByPathIds(pathIds)) {
            minutes.put((UUID) row[0], ((Number) row[1]).longValue());
        }

        if (userId == null) return new PathStats(topicCounts, minutes, null);

        Set<UUID> topicIds =
                lessonsByPathTopic.values().stream()
                        .flatMap(m -> m.keySet().stream())
                        .collect(Collectors.toSet());
        Map<UUID, Long> completedByTopic = new HashMap<>();
        Set<UUID> completedTopics = new HashSet<>();
        if (!topicIds.isEmpty()) {
            for (Object[] row :
                    subtopicProgressRepository.countCompletedPublishedLessonsByTopic(
                            userId, topicIds)) {
                completedByTopic.put((UUID) row[0], ((Number) row[1]).longValue());
            }
            completedTopics.addAll(topicProgressRepository.findCompletedTopicIds(userId, topicIds));
        }

        Map<UUID, Integer> progress = new HashMap<>();
        for (UUID pathId : pathIds) {
            Map<UUID, Long> topics = lessonsByPathTopic.getOrDefault(pathId, Map.of());
            if (topics.isEmpty()) {
                progress.put(pathId, 0);
                continue;
            }
            int total = 0;
            for (Map.Entry<UUID, Long> topic : topics.entrySet()) {
                if (completedTopics.contains(topic.getKey())) {
                    total += 100;
                } else if (topic.getValue() > 0) {
                    long done = completedByTopic.getOrDefault(topic.getKey(), 0L);
                    total += (int) Math.round((double) done * 100 / topic.getValue());
                }
            }
            progress.put(pathId, (int) Math.round((double) total / topics.size()));
        }
        return new PathStats(topicCounts, minutes, progress);
    }

    /** {@code progress} is null when nobody is signed in, so every percentage comes back null. */
    private record PathStats(
            Map<UUID, Long> topicCounts, Map<UUID, Long> minutes, Map<UUID, Integer> progress) {

        Integer progressOf(UUID pathId) {
            return progress == null ? null : progress.getOrDefault(pathId, 0);
        }

        /** Required steps weighted by study time; a plain mean if none has any time recorded. */
        Integer trackProgress(List<TrackStep> steps) {
            if (progress == null) return null;
            List<TrackStep> required = steps.stream().filter(s -> !s.isOptional()).toList();
            if (required.isEmpty()) return 0;
            long weight = 0;
            double weighted = 0;
            for (TrackStep step : required) {
                long w = minutes.getOrDefault(step.getPath().getId(), 0L);
                weight += w;
                weighted += (double) w * progressOf(step.getPath().getId());
            }
            if (weight == 0) {
                return (int)
                        Math.round(
                                required.stream()
                                        .mapToInt(s -> progressOf(s.getPath().getId()))
                                        .average()
                                        .orElse(0));
            }
            return (int) Math.round(weighted / weight);
        }
    }
}
