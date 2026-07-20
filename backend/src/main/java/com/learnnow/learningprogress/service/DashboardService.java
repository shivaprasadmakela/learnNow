package com.learnnow.learningprogress.service;

import com.learnnow.learningprogress.dto.response.*;
import com.learnnow.learningprogress.entity.LearningActivityEvent;
import com.learnnow.learningprogress.entity.UserLearningDailyActivity;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.entity.UserTopicProgress;
import com.learnnow.learningprogress.enums.ProgressStatus;
import com.learnnow.learningprogress.repository.LearningActivityEventRepository;
import com.learnnow.learningprogress.repository.UserLearningDailyActivityRepository;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.entity.Path;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.PathRepository;
import com.learnnow.paths.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PathRepository pathRepository;
    private final TopicRepository topicRepository;
    private final LearningActivityEventRepository eventRepository;
    private final UserLearningDailyActivityRepository dailyActivityRepository;
    private final UserLearningPreferencesRepository preferencesRepository;
    private final UserTopicProgressRepository topicProgressRepository;

    @Transactional(readOnly = true)
    public DashboardResponse buildDashboard(String userId) {
        // 1. Get user learning preferences
        UserLearningPreferences prefs = preferencesRepository.findByUserId(userId)
                .orElseGet(() -> UserLearningPreferences.builder()
                        .userId(userId)
                        .timezone("Asia/Kolkata")
                        .build());

        ZoneId userZone = ZoneId.of(prefs.getTimezone());
        LocalDate today = LocalDate.now(userZone);

        // 2. Weekly Calendar Days (Last 7 local dates: [today - 6, ..., today])
        List<LocalDate> calendarDates = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            calendarDates.add(today.minusDays(i));
        }

        List<UserLearningDailyActivity> dailyActivities = dailyActivityRepository
                .findByUserIdAndActivityDateIn(userId, calendarDates);
        Map<LocalDate, UserLearningDailyActivity> dailyMap = dailyActivities.stream()
                .collect(Collectors.toMap(UserLearningDailyActivity::getActivityDate, d -> d));

        List<WeeklyCalendarDay> weeklyCalendar = calendarDates.stream()
                .map(date -> {
                    String name = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
                    UserLearningDailyActivity act = dailyMap.get(date);
                    boolean completed = act != null && act.getQualifyingEventCount() > 0;
                    boolean isDotted = !completed;
                    return new WeeklyCalendarDay(name, date, completed, isDotted);
                })
                .toList();

        // 3. Activity Feed Items (Join titles in memory)
        List<LearningActivityEvent> events = eventRepository
                .findByUserIdOrderByOccurredAtDesc(userId, PageRequest.of(0, 10));

        Map<Long, String> pathTitles = pathRepository.findAll().stream()
                .collect(Collectors.toMap(Path::getId, Path::getTitle, (a, b) -> a));
        Map<Long, String> topicTitles = topicRepository.findAll().stream()
                .collect(Collectors.toMap(Topic::getId, Topic::getTitle, (a, b) -> a));
        List<ActivityFeedItem> activities = events.stream()
                .map(ev -> new ActivityFeedItem(
                        ev.getId().toString(),
                        ev.getEventType().name(),
                        ev.getPointsAwarded(),
                        ev.getOccurredAt(),
                        ev.getPathId() != null ? pathTitles.get(ev.getPathId()) : null,
                        ev.getTopicId() != null ? topicTitles.get(ev.getTopicId()) : null
                ))
                .toList();

        // 4. Path Progress Summary
        List<Path> allPaths = pathRepository.findAll();
        List<UserTopicProgress> userTopicProgressList = topicProgressRepository.findByUserId(userId);
        Map<Long, UserTopicProgress> topicProgressMap = userTopicProgressList.stream()
                .collect(Collectors.toMap(UserTopicProgress::getTopicId, t -> t));

        List<PathProgressSummary> pathSummaries = new ArrayList<>();
        for (Path path : allPaths) {
            List<Topic> topics = path.getTopics();
            List<TopicProgressSummary> topicSummaries = new ArrayList<>();
            int completedTopicsCount = 0;
            int totalTopicsCount = topics.size();
            int totalPathProgressPoints = 0;

            for (Topic topic : topics) {
                UserTopicProgress topicProgress = topicProgressMap.get(topic.getId());
                boolean isCompleted = topicProgress != null && topicProgress.getStatus() == ProgressStatus.COMPLETED;
                if (isCompleted) {
                    completedTopicsCount++;
                }

                int progressPercentage = isCompleted ? 100 : 0;

                totalPathProgressPoints += progressPercentage;

                topicSummaries.add(new TopicProgressSummary(
                        topic.getId(),
                        topic.getTitle(),
                        topic.getDescription(),
                        topic.getCategory(),
                        topic.getDuration(),
                        isCompleted,
                        progressPercentage
                ));
            }

            int pathProgressPercentage = 0;
            if (totalTopicsCount > 0) {
                pathProgressPercentage = totalPathProgressPoints / totalTopicsCount;
            }

            pathSummaries.add(new PathProgressSummary(
                    path.getId(),
                    path.getTitle(),
                    path.getDescription(),
                    path.getCategory(),
                    path.getManagedBy(),
                    pathProgressPercentage,
                    completedTopicsCount,
                    totalTopicsCount,
                    topicSummaries
            ));
        }

        // 5. Banner Selection Logic
        DashboardBanner banner = selectBanner(allPaths, userTopicProgressList);

        return new DashboardResponse(
                prefs.getCurrentStreak(),
                prefs.getLongestStreak(),
                prefs.getTotalPoints(),
                prefs.getTimezone(),
                weeklyCalendar,
                activities,
                pathSummaries,
                banner
        );
    }

    private DashboardBanner selectBanner(List<Path> allPaths, List<UserTopicProgress> progressList) {
        if (allPaths.isEmpty()) {
            return new DashboardBanner("FEATURED", null, "No Paths Available", "Add paths to get started.", "General");
        }

        // If no progress made, feature the first path
        if (progressList.isEmpty()) {
            Path featured = allPaths.get(0);
            return new DashboardBanner("FEATURED", featured.getId(), featured.getTitle(), featured.getDescription(), featured.getCategory());
        }

        // Review the path containing the latest completed topic.
        UserTopicProgress completedProgress = progressList.stream()
                .filter(p -> p.getStatus() == ProgressStatus.COMPLETED)
                .max(Comparator.comparing(UserTopicProgress::getCompletedAt, Comparator.nullsFirst(Comparator.naturalOrder())))
                .orElse(null);

        if (completedProgress != null) {
            Optional<Path> pathOpt = allPaths.stream()
                    .filter(p -> p.getId().equals(completedProgress.getPathId()))
                    .findFirst();
            if (pathOpt.isPresent()) {
                Path path = pathOpt.get();
                return new DashboardBanner("REVIEW", path.getId(), path.getTitle(), path.getDescription(), path.getCategory());
            }
        }

        // featured path default
        Path featured = allPaths.get(0);
        return new DashboardBanner("FEATURED", featured.getId(), featured.getTitle(), featured.getDescription(), featured.getCategory());
    }
}
