package com.learnnow.trainer.interview.service;

import com.learnnow.common.exception.NotFoundException;
import com.learnnow.common.exception.ValidationException;
import com.learnnow.interview.entity.InterviewQuestion;
import com.learnnow.interview.repository.InterviewQuestionRepository;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.TopicRepository;
import com.learnnow.trainer.interview.entity.TopicInterview;
import com.learnnow.trainer.interview.repository.TopicInterviewRepository;
import com.learnnow.user.repository.UserRepository;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class TopicInterviewPlanner {

    private final TopicRepository topicRepository;
    private final InterviewQuestionRepository questionRepository;
    private final TopicInterviewRepository interviewRepository;
    private final UserRepository userRepository;
    private final String callbackBaseUrl;

    public TopicInterviewPlanner(
            TopicRepository topicRepository,
            InterviewQuestionRepository questionRepository,
            TopicInterviewRepository interviewRepository,
            UserRepository userRepository,
            @Value("${learnnow.ai.callback-base-url:http://localhost:8080}")
                    String callbackBaseUrl) {
        this.topicRepository = topicRepository;
        this.questionRepository = questionRepository;
        this.interviewRepository = interviewRepository;
        this.userRepository = userRepository;
        this.callbackBaseUrl = callbackBaseUrl.replaceAll("/+$", "");
    }

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

        // Find previously asked questions for this learner on this topic
        Set<UUID> previouslyAsked = new HashSet<>();
        List<TopicInterview> pastInterviews =
                interviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (TopicInterview past : pastInterviews) {
            if (past.getPlan() != null
                    && past.getPlan().get("questions") instanceof List<?> qList) {
                for (Object item : qList) {
                    if (item instanceof Map<?, ?> qMap && qMap.get("id") instanceof String idStr) {
                        try {
                            previouslyAsked.add(UUID.fromString(idStr));
                        } catch (IllegalArgumentException ignored) {
                        }
                    }
                }
            }
        }

        // Gather published root questions across subtopics
        List<UUID> subtopicIds =
                subtopics.stream().map(InterviewQuestionRepository.SubtopicRow::getId).toList();
        List<InterviewQuestion> allQuestions =
                questionRepository.findBySubtopicIdInAndStatus(
                        subtopicIds, ContentStatus.PUBLISHED);

        Map<UUID, List<InterviewQuestion>> rootQuestionsBySubtopic = new LinkedHashMap<>();
        for (InterviewQuestion q : allQuestions) {
            if (q.getParentId() == null) {
                rootQuestionsBySubtopic
                        .computeIfAbsent(q.getSubtopicId(), k -> new ArrayList<>())
                        .add(q);
            }
        }

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
            qDto.put("key_points", extractKeyPoints(root));
            qDto.put("model_answer", extractModelAnswer(root));
            qDto.put("follow_ups", followUpDtos);
            planQuestions.add(qDto);
        }

        String firstName = userRepository.findById(userId).map(u -> u.getFirstName()).orElse(null);

        Map<String, Object> plan = new LinkedHashMap<>();
        plan.put("interview_id", interviewId.toString());
        plan.put("tenant", "learnnow");
        plan.put("topic_title", topic.getTitle());
        if (firstName != null) {
            plan.put("first_name", firstName);
        }
        plan.put("questions", planQuestions);
        plan.put("max_seconds", 360);
        plan.put(
                "callback_url",
                callbackBaseUrl + "/api/internal/ai/interviews/" + interviewId + "/transcript");

        return plan;
    }

    private List<String> extractKeyPoints(InterviewQuestion q) {
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

    private String extractModelAnswer(InterviewQuestion q) {
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
}
