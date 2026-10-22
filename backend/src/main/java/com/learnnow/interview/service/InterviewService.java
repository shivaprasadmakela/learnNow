package com.learnnow.interview.service;

import com.learnnow.common.exception.ValidationException;
import com.learnnow.interview.dto.request.ImportInterviewBankRequest;
import com.learnnow.interview.dto.response.InterviewImportResultDto;
import com.learnnow.interview.dto.response.InterviewQuestionDto;
import com.learnnow.interview.dto.response.InterviewTopicDto;
import com.learnnow.interview.entity.InterviewQuestion;
import com.learnnow.interview.repository.InterviewQuestionRepository;
import com.learnnow.interview.repository.InterviewQuestionRepository.SightingRow;
import com.learnnow.interview.repository.InterviewQuestionRepository.SubtopicRow;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Path;
import com.learnnow.paths.repository.PathRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Imports interview banks and reads them back as follow-up trees. */
@Service
@RequiredArgsConstructor
public class InterviewService {

    /** As deep as a real round goes; the schema enforces the same limit. */
    static final int MAX_DEPTH = 3;

    private static final Pattern KEY = Pattern.compile("^[a-z0-9]+(-[a-z0-9]+)*$");

    private final InterviewQuestionRepository questionRepository;
    private final PathRepository pathRepository;

    /**
     * Creates or updates every question in the bank, keyed by {@code key}, and links each follow-up
     * to its parent.
     *
     * <p>Everything is checked before anything is written and all problems are reported together,
     * so an author fixes a file in one pass. Nothing is deleted: a question dropped from the file
     * stays in the database, the same rule every other content import here follows.
     */
    @Transactional
    public InterviewImportResultDto importBank(ImportInterviewBankRequest request) {
        // The HTTP route validates the request; the local import runner reads the file directly.
        if (request.questions() == null
                || request.questions().isEmpty()
                || isBlank(request.pathTitle())) {
            throw new ValidationException(
                    "An interview bank needs a path title and at least one question.");
        }

        String pathTitle = request.pathTitle().trim();
        List<Path> paths = pathRepository.findAllByTitleIgnoreCase(pathTitle);
        if (paths.size() != 1) {
            throw new ValidationException(
                    "Interview bank \""
                            + request.bank()
                            + "\" was not imported: "
                            + (paths.isEmpty()
                                    ? "no path is titled \"" + pathTitle + "\""
                                    : paths.size() + " paths are titled \"" + pathTitle + "\""));
        }
        Map<String, List<UUID>> subtopicsByTitle = new HashMap<>();
        for (SubtopicRow row : questionRepository.findSubtopicsInPath(paths.get(0).getId())) {
            subtopicsByTitle
                    .computeIfAbsent(row.getTitle(), t -> new ArrayList<>())
                    .add(row.getId());
        }

        List<String> problems = new ArrayList<>();
        List<Flat> flat = new ArrayList<>();
        Set<String> keys = new HashSet<>();
        int order = 0;
        for (ImportInterviewBankRequest.Question root : request.questions()) {
            order++;
            UUID subtopicId = null;
            String title = root.subtopic() == null ? null : root.subtopic().trim();
            List<UUID> matches =
                    title == null ? List.of() : subtopicsByTitle.getOrDefault(title, List.of());
            if (title == null) {
                problems.add(root.key() + ": an opening question needs a subtopic");
            } else if (matches.isEmpty()) {
                problems.add(root.key() + ": no subtopic titled \"" + title + "\" in " + pathTitle);
            } else if (matches.size() > 1) {
                problems.add(
                        root.key() + ": " + matches.size() + " subtopics titled \"" + title + "\"");
            } else {
                subtopicId = matches.get(0);
            }
            flatten(root, null, 1, order, subtopicId, flat, keys, problems);
        }
        if (!problems.isEmpty()) {
            throw new ValidationException(
                    "Interview bank \""
                            + request.bank()
                            + "\" was not imported: "
                            + String.join("; ", problems));
        }

        Map<String, InterviewQuestion> existing =
                questionRepository.findByQuestionKeyIn(keys).stream()
                        .collect(
                                Collectors.toMap(
                                        InterviewQuestion::getQuestionKey, Function.identity()));
        // Parents come before their children in `flat`, so a parent's id is always known by the
        // time a child needs it.
        Map<String, UUID> idByKey = new HashMap<>();
        int created = 0;
        int updated = 0;
        for (Flat f : flat) {
            InterviewQuestion q = existing.get(f.source.key());
            if (q == null) {
                q = InterviewQuestion.builder().questionKey(f.source.key()).build();
                created++;
            } else {
                updated++;
            }
            q.setSubtopicId(f.subtopicId);
            q.setParentId(f.parentKey == null ? null : idByKey.get(f.parentKey));
            q.setDepth(f.depth);
            q.setOrderIndex(f.order);
            q.setPrompt(f.source.prompt().trim());
            ImportInterviewBankRequest.Question a = f.source;
            q.setAnswerSimple(trimToNull(a.simple()));
            q.setAnswerHow(trimToNull(a.how()));
            q.setAnswerUsage(trimToNull(a.usage()));
            q.setAnswerExample(trimToNull(a.example()));
            q.setAnswerScript(trimToNull(a.script()));
            q.setAnswerRemember(trimToNull(a.remember()));
            q.setAnswerCaution(trimToNull(a.caution()));
            q.setAnswerShort(trimToNull(a.answerShort()));
            q.setAnswerDeep(trimToNull(a.answerDeep()));
            q.setAnswerSignal(trimToNull(a.answerSignal()));
            q.setStatus(ContentStatus.PUBLISHED);
            q = questionRepository.save(q);
            idByKey.put(f.source.key(), q.getId());
        }
        return new InterviewImportResultDto(request.bank(), created, updated, flat.size());
    }

    /**
     * A path's interview questions grouped by topic, topics and questions in the order the path
     * teaches them; empty if the path is not published. Topics with no questions are left out.
     */
    @Transactional(readOnly = true)
    public Optional<List<InterviewTopicDto>> forPath(UUID pathId) {
        Optional<Path> path =
                pathRepository
                        .findById(pathId)
                        .filter(p -> p.getStatus() == ContentStatus.PUBLISHED);
        if (path.isEmpty()) return Optional.empty();

        Map<UUID, Anchor> anchors = new LinkedHashMap<>();
        for (SubtopicRow row : questionRepository.findSubtopicsInPath(pathId)) {
            anchors.put(
                    row.getId(), new Anchor(row.getTopicId(), row.getTopicTitle(), row.getTitle()));
        }
        Map<UUID, List<InterviewQuestionDto>> trees = treesBySubtopic(anchors);

        // Subtopics arrive in path order, so walking them groups topics in path order too.
        Map<UUID, InterviewTopicDto> topics = new LinkedHashMap<>();
        for (Map.Entry<UUID, Anchor> e : anchors.entrySet()) {
            List<InterviewQuestionDto> qs = trees.get(e.getKey());
            if (qs == null || qs.isEmpty()) continue;
            Anchor a = e.getValue();
            topics.computeIfAbsent(
                            a.topicId(),
                            id -> new InterviewTopicDto(id, a.topicTitle(), new ArrayList<>()))
                    .questions()
                    .addAll(qs);
        }
        return Optional.of(new ArrayList<>(topics.values()));
    }

    /**
     * A topic's opening questions, each with its follow-ups, in the order the topic teaches the
     * lessons they come from - what the study console shows beside the lessons themselves.
     */
    @Transactional(readOnly = true)
    public List<InterviewQuestionDto> forTopic(UUID topicId) {
        Map<UUID, Anchor> anchors = new LinkedHashMap<>();
        for (SubtopicRow row : questionRepository.findPublishedSubtopicsInTopic(topicId)) {
            anchors.put(
                    row.getId(), new Anchor(row.getTopicId(), row.getTopicTitle(), row.getTitle()));
        }
        Map<UUID, List<InterviewQuestionDto>> trees = treesBySubtopic(anchors);
        List<InterviewQuestionDto> out = new ArrayList<>();
        for (UUID subtopicId : anchors.keySet()) {
            out.addAll(trees.getOrDefault(subtopicId, List.of()));
        }
        return out;
    }

    private Map<UUID, List<InterviewQuestionDto>> treesBySubtopic(Map<UUID, Anchor> anchors) {
        if (anchors.isEmpty()) return Map.of();
        List<InterviewQuestion> all =
                questionRepository.findBySubtopicIdInAndStatus(
                        anchors.keySet(), ContentStatus.PUBLISHED);
        if (all.isEmpty()) return Map.of();

        Map<UUID, List<InterviewQuestionDto.Sighting>> sightings = new HashMap<>();
        for (SightingRow row :
                questionRepository.findSightings(
                        all.stream().map(InterviewQuestion::getId).toList())) {
            sightings
                    .computeIfAbsent(row.getQuestionId(), id -> new ArrayList<>())
                    .add(
                            new InterviewQuestionDto.Sighting(
                                    row.getCompany(),
                                    row.getRole(),
                                    row.getLevel(),
                                    row.getRound(),
                                    row.getSeenMonth()));
        }
        Map<UUID, List<InterviewQuestion>> children = new HashMap<>();
        for (InterviewQuestion q : all) {
            if (q.getParentId() != null) {
                children.computeIfAbsent(q.getParentId(), id -> new ArrayList<>()).add(q);
            }
        }
        Map<UUID, List<InterviewQuestionDto>> out = new HashMap<>();
        all.stream()
                .filter(q -> q.getParentId() == null)
                .sorted(Comparator.comparingInt(InterviewQuestion::getOrderIndex))
                .forEach(
                        root ->
                                out.computeIfAbsent(root.getSubtopicId(), id -> new ArrayList<>())
                                        .add(
                                                toDto(
                                                        root,
                                                        anchors.get(root.getSubtopicId()),
                                                        children,
                                                        sightings)));
        return out;
    }

    /**
     * {@code anchor} is the opener's subtopic; follow-ups pass null and carry no anchor of their
     * own.
     */
    private static InterviewQuestionDto toDto(
            InterviewQuestion q,
            Anchor anchor,
            Map<UUID, List<InterviewQuestion>> children,
            Map<UUID, List<InterviewQuestionDto.Sighting>> sightings) {
        List<InterviewQuestionDto> follow =
                children.getOrDefault(q.getId(), List.of()).stream()
                        .sorted(Comparator.comparingInt(InterviewQuestion::getOrderIndex))
                        .map(c -> toDto(c, null, children, sightings))
                        .toList();
        List<InterviewQuestionDto.Sighting> seen = sightings.getOrDefault(q.getId(), List.of());
        return new InterviewQuestionDto(
                q.getId(),
                anchor == null ? null : anchor.topicId(),
                anchor == null ? null : q.getSubtopicId(),
                anchor == null ? null : anchor.subtopicTitle(),
                q.getPrompt(),
                !hasBeginnerAnswer(q)
                        ? null
                        : new InterviewQuestionDto.Answer(
                                q.getAnswerSimple(),
                                q.getAnswerHow(),
                                q.getAnswerUsage(),
                                q.getAnswerExample(),
                                q.getAnswerScript(),
                                q.getAnswerRemember(),
                                q.getAnswerCaution()),
                q.getAnswerShort(),
                q.getAnswerDeep(),
                q.getAnswerSignal(),
                q.getDepth(),
                seen.isEmpty(),
                seen,
                follow);
    }

    /** Walks one question and its follow-ups depth-first, parents before children. */
    private static void flatten(
            ImportInterviewBankRequest.Question q,
            String parentKey,
            int depth,
            int order,
            UUID subtopicId,
            List<Flat> flat,
            Set<String> keys,
            List<String> problems) {
        String key = q.key() == null ? "" : q.key().trim();
        if (!KEY.matcher(key).matches()) {
            problems.add("key \"" + key + "\" is not lower-case-hyphenated");
        } else if (!keys.add(key)) {
            problems.add("key \"" + key + "\" appears more than once");
        }
        if (depth > MAX_DEPTH) {
            problems.add(key + ": depth " + depth + " - follow-ups stop at " + MAX_DEPTH);
        }
        if (q.depth() != null && q.depth() != depth) {
            problems.add(key + ": says depth " + q.depth() + " but sits at depth " + depth);
        }
        if (isBlank(q.prompt())) {
            problems.add(key + ": the prompt is required");
        }
        if (!q.hasBeginnerAnswer() && !q.hasLegacyAnswer()) {
            problems.add(
                    key
                            + ": needs a complete answer - simple, how, example, script and"
                            + " remember (or the older answerShort, answerDeep and answerSignal)");
        }
        flat.add(new Flat(q, parentKey, depth, order, subtopicId));
        List<ImportInterviewBankRequest.Question> follow =
                q.followUps() == null ? List.of() : q.followUps();
        for (int i = 0; i < follow.size(); i++) {
            flatten(follow.get(i), key, depth + 1, i + 1, subtopicId, flat, keys, problems);
        }
    }

    /**
     * Whether the beginner sections are all there. A question can carry a half-written beginner
     * answer beside a complete earlier one while its bank is being rewritten; it keeps showing the
     * complete one until the new one is finished.
     */
    private static boolean hasBeginnerAnswer(InterviewQuestion q) {
        return q.getAnswerSimple() != null
                && q.getAnswerHow() != null
                && q.getAnswerExample() != null
                && q.getAnswerScript() != null
                && q.getAnswerRemember() != null;
    }

    private static String trimToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    /** Where an opening question sits: its topic, and the subtopic that teaches the answer. */
    private record Anchor(UUID topicId, String topicTitle, String subtopicTitle) {}

    private record Flat(
            ImportInterviewBankRequest.Question source,
            String parentKey,
            int depth,
            int order,
            UUID subtopicId) {}
}
