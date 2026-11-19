package com.learnnow.trainer.interview.service;

import com.learnnow.common.exception.NotFoundException;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.interview.entity.InterviewQuestion;
import com.learnnow.interview.repository.InterviewQuestionRepository;
import com.learnnow.learningprogress.enums.ProgressStatus;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.TopicRepository;
import com.learnnow.trainer.interview.entity.InterviewKind;
import com.learnnow.trainer.interview.entity.TopicInterview;
import com.learnnow.trainer.interview.repository.TopicInterviewRepository;
import com.learnnow.user.repository.UserRepository;
import java.util.ArrayList;
import java.util.Comparator;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Builds interview plans: what the voice interviewer asks, in order, and what a strong answer to
 * each question covers. The plan goes to learnnow-ai and is stored with the interview, because
 * scoring compares the transcript with it.
 *
 * <p>A topic interview's questions all come from that topic's bank. A mock interview's questions
 * are chosen by learnnow-ai: it writes the ones the bank cannot cover (intro, projects,
 * behavioural, HR, other professions) and leaves slots naming a bank topic for the rest, which this
 * fills with a real bank question, because a reviewed model answer scores more fairly than a
 * generated one.
 */
@Component
public class TopicInterviewPlanner {

    /** learnnow-ai accepts at most this many questions in one plan. */
    static final int MAX_QUESTIONS = 8;

    /** A mock interview with fewer questions than this is not worth the learner's quota. */
    static final int MIN_MOCK_QUESTIONS = 2;

    static final int MAX_BANK_TOPICS = 200;
    static final int MAX_BRIEF_CHARS = 1500;

    private static final Set<String> CATEGORIES =
            Set.of("intro", "technical", "project", "behavioural", "hr");

    /** Belt and braces: a profile never holds contact details, but a brief must not either. */
    private static final Pattern CONTACT =
            Pattern.compile("[\\w.+-]+@[\\w-]+\\.[\\w.]+|\\+?\\d[\\d\\s().-]{7,}\\d|https?://\\S+");

    private final TopicRepository topicRepository;
    private final InterviewQuestionRepository questionRepository;
    private final TopicInterviewRepository interviewRepository;
    private final UserRepository userRepository;
    private final UserTopicProgressRepository topicProgressRepository;
    private final String callbackBaseUrl;

    public TopicInterviewPlanner(
            TopicRepository topicRepository,
            InterviewQuestionRepository questionRepository,
            TopicInterviewRepository interviewRepository,
            UserRepository userRepository,
            UserTopicProgressRepository topicProgressRepository,
            @Value("${learnnow.ai.callback-base-url:http://localhost:8080}")
                    String callbackBaseUrl) {
        this.topicRepository = topicRepository;
        this.questionRepository = questionRepository;
        this.interviewRepository = interviewRepository;
        this.userRepository = userRepository;
        this.topicProgressRepository = topicProgressRepository;
        this.callbackBaseUrl = callbackBaseUrl.replaceAll("/+$", "");
    }

    /** A bank topic offered to learnnow-ai for a mock interview's technical slots. */
    public record BankTopic(UUID id, String title) {}

    public Map<String, Object> plan(UUID topicId, String userId, UUID interviewId) {
        Topic topic =
                topicRepository
                        .findById(topicId)
                        .orElseThrow(() -> new NotFoundException("topic_not_found"));

        List<InterviewQuestionRepository.SubtopicRow> subtopics =
                questionRepository.findPublishedSubtopicsInTopic(topicId);
        if (subtopics.isEmpty()) {
            throw new ValidationException("topic_interview_no_questions");
        }

        Set<UUID> previouslyAsked = previouslyAsked(userId);

        // Gather published root questions across subtopics
        Map<UUID, List<InterviewQuestion>> rootQuestionsBySubtopic =
                rootQuestionsBySubtopic(subtopics);
        if (rootQuestionsBySubtopic.isEmpty()) {
            throw new ValidationException("topic_interview_no_questions");
        }

        // Pick up to 3 questions, spreading across subtopics and prioritizing unasked questions
        List<InterviewQuestion> chosen = new ArrayList<>();
        for (InterviewQuestionRepository.SubtopicRow st : subtopics) {
            if (chosen.size() >= 3) break;
            List<InterviewQuestion> qList =
                    rootQuestionsBySubtopic.getOrDefault(st.getId(), List.of());
            List<InterviewQuestion> unasked =
                    qList.stream().filter(q -> !previouslyAsked.contains(q.getId())).toList();
            if (!unasked.isEmpty()) {
                chosen.add(unasked.get(0));
            } else if (!qList.isEmpty()) {
                chosen.add(qList.get(0));
            }
        }

        // If fewer than 3 picked and more root questions exist, backfill
        if (chosen.size() < 3) {
            Set<UUID> chosenIds =
                    new HashSet<>(chosen.stream().map(InterviewQuestion::getId).toList());
            for (List<InterviewQuestion> qList : rootQuestionsBySubtopic.values()) {
                for (InterviewQuestion q : qList) {
                    if (chosen.size() >= 3) break;
                    if (!chosenIds.contains(q.getId())) {
                        chosen.add(q);
                        chosenIds.add(q.getId());
                    }
                }
            }
        }

        if (chosen.isEmpty()) {
            throw new ValidationException("topic_interview_no_questions");
        }

        List<Map<String, Object>> planQuestions = new ArrayList<>();
        for (InterviewQuestion root : chosen) {
            planQuestions.add(bankQuestion(root, topicId));
        }

        Map<String, Object> plan = new LinkedHashMap<>();
        plan.put("interview_id", interviewId.toString());
        plan.put("tenant", "learnnow");
        plan.put("kind", InterviewKind.TOPIC.wire());
        plan.put("topic_title", topic.getTitle());
        putFirstName(plan, userId);
        plan.put("questions", planQuestions);
        plan.put("max_seconds", InterviewKind.TOPIC.maxSeconds());
        plan.put("callback_url", callbackUrl(interviewId));
        return plan;
    }

    /**
     * A mock interview's plan from learnnow-ai's items: written questions kept, bank slots filled
     * from this learner's unasked questions where possible. Fails with {@code
     * mock_interview_no_questions} when fewer than {@link #MIN_MOCK_QUESTIONS} survive.
     */
    public Map<String, Object> mockPlan(
            String userId,
            UUID interviewId,
            InterviewKind kind,
            String topicTitle,
            String candidateBrief,
            Object items,
            Set<UUID> offeredTopicIds) {
        Set<UUID> previouslyAsked = previouslyAsked(userId);
        Set<UUID> used = new HashSet<>();
        List<Map<String, Object>> questions =
                assembleQuestions(
                        items,
                        topicId ->
                                offeredTopicIds.contains(topicId)
                                        ? fillBankSlot(topicId, previouslyAsked, used)
                                        : Optional.empty());
        if (questions.size() < MIN_MOCK_QUESTIONS) {
            throw new ValidationException("mock_interview_no_questions");
        }

        Map<String, Object> plan = new LinkedHashMap<>();
        plan.put("interview_id", interviewId.toString());
        plan.put("tenant", "learnnow");
        plan.put("kind", kind.wire());
        plan.put("topic_title", topicTitle);
        putFirstName(plan, userId);
        if (candidateBrief != null && !candidateBrief.isBlank()) {
            plan.put("candidate_brief", candidateBrief);
        }
        plan.put("questions", questions);
        plan.put("max_seconds", kind.maxSeconds());
        plan.put("callback_url", callbackUrl(interviewId));
        return plan;
    }

    /**
     * Turns learnnow-ai's items into plan questions, in order, at most {@link #MAX_QUESTIONS}. A
     * bank slot ({@code bank_topic_id}) is handed to {@code bankFiller}, and dropped when it gives
     * nothing back. A written question is kept when it has a prompt; any id that is not a UUID is
     * replaced, because answers store the plan's question ids as UUIDs.
     */
    static List<Map<String, Object>> assembleQuestions(
            Object items, Function<UUID, Optional<Map<String, Object>>> bankFiller) {
        List<Map<String, Object>> questions = new ArrayList<>();
        if (!(items instanceof List<?> list)) {
            return questions;
        }
        Set<String> ids = new HashSet<>();
        for (Object item : list) {
            if (questions.size() >= MAX_QUESTIONS) break;
            if (!(item instanceof Map<?, ?> map)) continue;
            Optional<Map<String, Object>> question;
            if (map.get("bank_topic_id") != null) {
                question =
                        parseUuid(map.get("bank_topic_id"))
                                .flatMap(bankFiller)
                                .map(
                                        q -> {
                                            q.put("category", "technical");
                                            return q;
                                        });
            } else {
                question = writtenQuestion(map);
            }
            question.filter(q -> ids.add((String) q.get("id"))).ifPresent(questions::add);
        }
        return questions;
    }

    private static Optional<Map<String, Object>> writtenQuestion(Map<?, ?> item) {
        String prompt = text(item.get("prompt"));
        if (prompt == null) {
            return Optional.empty();
        }
        String category = text(item.get("category"));
        Map<String, Object> q = new LinkedHashMap<>();
        q.put("id", uuidOrNew(item.get("id")));
        q.put("prompt", prompt);
        q.put(
                "category",
                category != null && CATEGORIES.contains(category) ? category : "technical");
        q.put("key_points", strings(item.get("key_points")));
        q.put("model_answer", Optional.ofNullable(text(item.get("model_answer"))).orElse(""));

        List<Object> rawFollowUps = new ArrayList<>();
        if (item.get("follow_ups") instanceof List<?> fus) {
            rawFollowUps.addAll(fus);
        } else if (item.get("follow_up") instanceof Map<?, ?> fu) {
            rawFollowUps.add(fu);
        }
        List<Map<String, Object>> followUps = new ArrayList<>();
        for (Object raw : rawFollowUps) {
            if (raw instanceof Map<?, ?> fu && text(fu.get("prompt")) != null) {
                Map<String, Object> f = new LinkedHashMap<>();
                f.put("id", uuidOrNew(fu.get("id")));
                f.put("prompt", text(fu.get("prompt")));
                f.put("key_points", strings(fu.get("key_points")));
                f.put("model_answer", Optional.ofNullable(text(fu.get("model_answer"))).orElse(""));
                followUps.add(f);
            }
        }
        q.put("follow_ups", followUps);
        return Optional.of(q);
    }

    /**
     * One opening question from a topic's bank: one this learner has not been asked if there is
     * one, never one already in this plan.
     */
    Optional<Map<String, Object>> fillBankSlot(
            UUID topicId, Set<UUID> previouslyAsked, Set<UUID> usedInPlan) {
        List<InterviewQuestionRepository.SubtopicRow> subtopics =
                questionRepository.findPublishedSubtopicsInTopic(topicId);
        if (subtopics.isEmpty()) {
            return Optional.empty();
        }
        List<InterviewQuestion> roots =
                rootQuestionsBySubtopic(subtopics).values().stream()
                        .flatMap(List::stream)
                        .filter(q -> !usedInPlan.contains(q.getId()))
                        .toList();
        Optional<InterviewQuestion> pick =
                roots.stream()
                        .filter(q -> !previouslyAsked.contains(q.getId()))
                        .findFirst()
                        .or(() -> roots.stream().findFirst());
        pick.ifPresent(q -> usedInPlan.add(q.getId()));
        return pick.map(q -> bankQuestion(q, topicId));
    }

    /**
     * A bank question as a plan question, with its follow-ups. {@code topic_id} and {@code
     * subtopic_id} are this backend's own: learnnow-ai ignores them, and the report uses them to
     * link back to the lesson.
     */
    public Map<String, Object> bankQuestion(InterviewQuestion root, UUID topicId) {
        List<InterviewQuestion> followUps =
                questionRepository.findByParentIdAndStatusOrderByOrderIndex(
                        root.getId(), ContentStatus.PUBLISHED);

        List<Map<String, Object>> followUpDtos = new ArrayList<>();
        for (InterviewQuestion fu : followUps) {
            followUpDtos.add(
                    Map.of(
                            "id", fu.getId().toString(),
                            "prompt", fu.getPrompt(),
                            "key_points", extractKeyPoints(fu),
                            "model_answer", extractModelAnswer(fu)));
        }

        Map<String, Object> qDto = new LinkedHashMap<>();
        qDto.put("id", root.getId().toString());
        qDto.put("prompt", root.getPrompt());
        qDto.put("category", "technical");
        qDto.put("key_points", extractKeyPoints(root));
        qDto.put("model_answer", extractModelAnswer(root));
        qDto.put("follow_ups", followUpDtos);
        qDto.put("topic_id", topicId.toString());
        if (root.getSubtopicId() != null) {
            qDto.put("subtopic_id", root.getSubtopicId().toString());
        }
        return qDto;
    }

    /**
     * Topics the bank can supply technical questions for, at most {@link #MAX_BANK_TOPICS}: the
     * ones this learner has completed first, since those are what they can talk about.
     */
    public List<BankTopic> bankTopics(String userId) {
        Set<UUID> completed =
                topicProgressRepository.findByUserId(userId).stream()
                        .filter(p -> p.getStatus() == ProgressStatus.COMPLETED)
                        .map(p -> p.getTopicId())
                        .collect(Collectors.toSet());
        return questionRepository.findTopicsWithPublishedOpeners().stream()
                .map(t -> new BankTopic(t.getId(), truncate(t.getTitle(), 200)))
                .sorted(Comparator.comparing((BankTopic t) -> !completed.contains(t.id())))
                .limit(MAX_BANK_TOPICS)
                .toList();
    }

    /** Every bank question this learner has been asked in any interview. */
    public Set<UUID> previouslyAsked(String userId) {
        Set<UUID> previouslyAsked = new HashSet<>();
        List<TopicInterview> pastInterviews =
                interviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (TopicInterview past : pastInterviews) {
            if (past.getPlan() != null
                    && past.getPlan().get("questions") instanceof List<?> qList) {
                for (Object item : qList) {
                    if (item instanceof Map<?, ?> qMap) {
                        parseUuid(qMap.get("id")).ifPresent(previouslyAsked::add);
                    }
                }
            }
        }
        return previouslyAsked;
    }

    /**
     * A few lines about the candidate for the mock interviewer, from their resume profile:
     * headline, level, experience, top skills, jobs and projects. Never contact details: the
     * profile has none, and anything that looks like an email, phone number or link is removed
     * anyway.
     */
    public static String candidateBrief(Map<String, Object> profile) {
        if (profile == null || profile.isEmpty()) {
            return null;
        }
        List<String> lines = new ArrayList<>();
        String headline = text(profile.get("headline"));
        if (headline != null) lines.add("Headline: " + headline);
        String level = text(profile.get("level"));
        Object years = profile.get("years_experience");
        if (level != null || years instanceof Number) {
            lines.add(
                    "Level: "
                            + (level != null ? level : "not stated")
                            + (years instanceof Number n
                                    ? ", " + formatYears(n.doubleValue()) + " years of experience"
                                    : ""));
        }
        List<String> skills = strings(profile.get("skills"));
        if (!skills.isEmpty()) {
            lines.add(
                    "Skills: " + String.join(", ", skills.subList(0, Math.min(12, skills.size()))));
        }
        if (profile.get("experience") instanceof List<?> jobs && !jobs.isEmpty()) {
            List<String> rows = new ArrayList<>();
            for (Object job : jobs) {
                if (rows.size() >= 4) break;
                if (job instanceof Map<?, ?> j && text(j.get("title")) != null) {
                    String company = text(j.get("company"));
                    rows.add(text(j.get("title")) + (company != null ? " at " + company : ""));
                }
            }
            if (!rows.isEmpty()) lines.add("Experience: " + String.join("; ", rows));
        }
        if (profile.get("projects") instanceof List<?> projects && !projects.isEmpty()) {
            List<String> names = new ArrayList<>();
            for (Object project : projects) {
                if (names.size() >= 5) break;
                if (project instanceof Map<?, ?> p && text(p.get("name")) != null) {
                    names.add(text(p.get("name")));
                }
            }
            if (!names.isEmpty()) lines.add("Projects: " + String.join(", ", names));
        }
        if (lines.isEmpty()) {
            return null;
        }
        String brief = CONTACT.matcher(String.join("\n", lines)).replaceAll("[removed]");
        return truncate(brief, MAX_BRIEF_CHARS);
    }

    public String callbackUrl(UUID interviewId) {
        return callbackBaseUrl + "/api/internal/ai/interviews/" + interviewId + "/transcript";
    }

    public void putFirstName(Map<String, Object> plan, String userId) {
        userRepository
                .findById(userId)
                .map(u -> u.getFirstName())
                .filter(n -> n != null && !n.isBlank())
                .ifPresent(n -> plan.put("first_name", n));
    }

    private Map<UUID, List<InterviewQuestion>> rootQuestionsBySubtopic(
            List<InterviewQuestionRepository.SubtopicRow> subtopics) {
        List<UUID> subtopicIds =
                subtopics.stream().map(InterviewQuestionRepository.SubtopicRow::getId).toList();
        List<InterviewQuestion> allQuestions =
                questionRepository.findBySubtopicIdInAndStatus(
                        subtopicIds, ContentStatus.PUBLISHED);
        Map<UUID, List<InterviewQuestion>> bySubtopic = new LinkedHashMap<>();
        // Keyed in teaching order, so "the first unasked question" means the earliest lesson's.
        for (UUID id : subtopicIds) {
            bySubtopic.put(id, new ArrayList<>());
        }
        allQuestions.stream()
                .filter(q -> q.getParentId() == null)
                .sorted(Comparator.comparingInt(InterviewQuestion::getOrderIndex))
                .forEach(
                        q ->
                                bySubtopic
                                        .computeIfAbsent(q.getSubtopicId(), k -> new ArrayList<>())
                                        .add(q));
        bySubtopic.values().removeIf(List::isEmpty);
        return bySubtopic;
    }

    List<String> extractKeyPoints(InterviewQuestion q) {
        List<String> points = new ArrayList<>();
        if (q.getAnswerRemember() != null && !q.getAnswerRemember().isBlank()) {
            points.add(q.getAnswerRemember().strip());
        }
        if (q.getAnswerSimple() != null && !q.getAnswerSimple().isBlank()) {
            String firstSentence = q.getAnswerSimple().split("\\.\\s+")[0].strip();
            if (!firstSentence.isBlank()) points.add(firstSentence);
        }
        if (q.getAnswerHow() != null && !q.getAnswerHow().isBlank()) {
            String firstSentence = q.getAnswerHow().split("\\.\\s+")[0].strip();
            if (!firstSentence.isBlank()) points.add(firstSentence);
        }
        if (points.isEmpty()) {
            if (q.getAnswerSignal() != null && !q.getAnswerSignal().isBlank()) {
                points.add(q.getAnswerSignal().strip());
            } else if (q.getAnswerShort() != null && !q.getAnswerShort().isBlank()) {
                points.add(q.getAnswerShort().strip());
            }
        }
        return points;
    }

    /** The answer a bank question is scored against; also shown in reports. */
    public static String extractModelAnswer(InterviewQuestion q) {
        if (q.getAnswerScript() != null && !q.getAnswerScript().isBlank()) {
            return q.getAnswerScript().strip();
        }
        if (q.getAnswerSimple() != null && !q.getAnswerSimple().isBlank()) {
            return q.getAnswerSimple().strip();
        }
        if (q.getAnswerShort() != null && !q.getAnswerShort().isBlank()) {
            return q.getAnswerShort().strip();
        }
        return "";
    }

    static Optional<UUID> parseUuid(Object value) {
        if (value instanceof String s) {
            try {
                return Optional.of(UUID.fromString(s.strip()));
            } catch (IllegalArgumentException ignored) {
                // Not one of ours.
            }
        }
        return Optional.empty();
    }

    private static String uuidOrNew(Object value) {
        return parseUuid(value).orElseGet(UUID::randomUUID).toString();
    }

    private static String text(Object value) {
        return value instanceof String s && !s.isBlank() ? s.strip() : null;
    }

    private static List<String> strings(Object value) {
        if (!(value instanceof List<?> list)) {
            return List.of();
        }
        return list.stream()
                .filter(v -> v instanceof String s && !s.isBlank())
                .map(v -> ((String) v).strip())
                .toList();
    }

    private static String formatYears(double years) {
        return years == Math.floor(years) ? String.valueOf((long) years) : String.valueOf(years);
    }

    private static String truncate(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }
}
