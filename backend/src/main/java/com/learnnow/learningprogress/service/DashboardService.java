package com.learnnow.learningprogress.service;

import com.learnnow.user.repository.UserRepository;
import com.learnnow.learningprogress.config.PointsConfig;
import com.learnnow.learningprogress.dto.response.*;
import com.learnnow.learningprogress.entity.UserLearningDailyActivity;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.entity.UserSubtopicProgress;
import com.learnnow.learningprogress.entity.UserTopicProgress;
import com.learnnow.learningprogress.enums.ProgressStatus;
import com.learnnow.learningprogress.repository.UserLearningDailyActivityRepository;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.entity.Path;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.PathRepository;
import lombok.RequiredArgsConstructor;
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
    private final UserLearningDailyActivityRepository dailyActivityRepository;
    private final UserLearningPreferencesRepository preferencesRepository;
    private final UserTopicProgressRepository topicProgressRepository;
    private final UserSubtopicProgressRepository subtopicProgressRepository;
    private final UserRepository userRepository;

    @Transactional
    public DashboardResponse buildDashboard(String userId) {
        // 1. Get user learning preferences
        UserLearningPreferences prefs = preferencesRepository.findByUserId(userId)
                .orElseGet(() -> UserLearningPreferences.builder()
                        .userId(userId)
                        .timezone("Asia/Kolkata")
                        .build());

        ZoneId userZone = ZoneId.of(prefs.getTimezone());
        LocalDate today = LocalDate.now(userZone);

        // 2. Build subtopic progress lookup
        List<UserSubtopicProgress> allSubtopicProgress = subtopicProgressRepository.findByUserId(userId);
        Map<Long, List<UserSubtopicProgress>> subtopicProgressByTopic = allSubtopicProgress.stream()
                .collect(Collectors.groupingBy(UserSubtopicProgress::getTopicId));

        long completedSubtopicsCount = allSubtopicProgress.stream().filter(UserSubtopicProgress::isCompleted).count();

        // 3. Path Progress Summary
        List<Path> allPaths = pathRepository.findAll();
        List<UserTopicProgress> userTopicProgressList = topicProgressRepository.findByUserId(userId);
        Map<Long, UserTopicProgress> topicProgressMap = userTopicProgressList.stream()
                .collect(Collectors.toMap(UserTopicProgress::getTopicId, t -> t));

        int totalCompletedTopics = 0;
        List<PathProgressSummary> pathSummaries = new ArrayList<>();
        for (Path path : allPaths) {
            List<Topic> topics = path.getTopics();
            List<TopicProgressSummary> topicSummaries = new ArrayList<>();
            int completedTopicsCount = 0;
            int totalTopicsCount = topics.size();
            int totalProgressPoints = 0;

            for (Topic topic : topics) {
                UserTopicProgress topicProgress = topicProgressMap.get(topic.getId());
                boolean isCompleted = topicProgress != null && topicProgress.getStatus() == ProgressStatus.COMPLETED;
                if (isCompleted) {
                    completedTopicsCount++;
                    totalCompletedTopics++;
                }

                // Calculate topic percentage from subtopic completion
                int progressPercentage = calculateTopicPercentage(topic, subtopicProgressByTopic, isCompleted);
                totalProgressPoints += progressPercentage;

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
                pathProgressPercentage = totalProgressPoints / totalTopicsCount;
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

        // 4. Dynamic Metric Self-Healing: Sync points with completed items if DB preferences lagged
        final int finalCompletedTopics = totalCompletedTopics;
        int calculatedPoints = (int) (completedSubtopicsCount * PointsConfig.SUBTOPIC_COMPLETED) + (finalCompletedTopics * PointsConfig.TOPIC_COMPLETED_BONUS);
        boolean prefsChanged = false;

        if (prefs.getTotalPoints() < calculatedPoints) {
            prefs.setTotalPoints(calculatedPoints);
            prefsChanged = true;
        }

        // Streak Expiration: If last activity date is before yesterday, active streak has expired
        if (prefs.getLastActivityDate() != null && prefs.getLastActivityDate().isBefore(today.minusDays(1))) {
            if (prefs.getCurrentStreak() != 0) {
                prefs.setCurrentStreak(0);
                prefsChanged = true;
            }
        }

        if (prefsChanged && userRepository.existsById(userId)) {
            preferencesRepository.save(prefs);
        }

        // 5. Weekly Calendar Days (Current week from Monday to Sunday)
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        List<LocalDate> calendarDates = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            calendarDates.add(monday.plusDays(i));
        }

        List<UserLearningDailyActivity> dailyActivities = dailyActivityRepository
                .findByUserIdAndActivityDateIn(userId, calendarDates);
        Map<LocalDate, UserLearningDailyActivity> dailyMap = dailyActivities.stream()
                .collect(Collectors.toMap(UserLearningDailyActivity::getActivityDate, d -> d));

        List<WeeklyCalendarDay> weeklyCalendar = calendarDates.stream()
                .map(date -> {
                    String name = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
                    UserLearningDailyActivity act = dailyMap.get(date);
                    boolean isDayCompleted = act != null && act.getQualifyingEventCount() > 0;
                    boolean isDotted = !isDayCompleted;
                    return new WeeklyCalendarDay(name, date, isDayCompleted, isDotted);
                })
                .toList();

        // 6. Weekly Leaderboard Calculation (Monday to Sunday)
        LocalDate sunday = monday.plusDays(6);
        List<UserLearningDailyActivity> weekActivities = dailyActivityRepository.findByActivityDateBetween(monday, sunday);

        Map<String, Integer> weeklyPointsMap = weekActivities.stream()
                .collect(Collectors.groupingBy(
                        UserLearningDailyActivity::getUserId,
                        Collectors.summingInt(UserLearningDailyActivity::getPointsEarned)
                ));

        Map<String, java.time.Instant> earliestActivityMap = weekActivities.stream()
                .collect(Collectors.toMap(
                        UserLearningDailyActivity::getUserId,
                        UserLearningDailyActivity::getFirstActivityAt,
                        (a, b) -> a.isBefore(b) ? a : b
                ));

        List<com.learnnow.user.entity.User> existingUsers = userRepository.findAll();
        Map<String, com.learnnow.user.entity.User> userMap = existingUsers.stream()
                .collect(Collectors.toMap(com.learnnow.user.entity.User::getId, u -> u, (a, b) -> a));

        List<UserLearningPreferences> allPrefs = preferencesRepository.findAll();
        Map<String, UserLearningPreferences> prefMap = allPrefs.stream()
                .collect(Collectors.toMap(UserLearningPreferences::getUserId, p -> p, (a, b) -> a));

        Set<String> allLeaderboardUserIds = new HashSet<>();
        allLeaderboardUserIds.add(userId);
        allLeaderboardUserIds.addAll(userMap.keySet());
        allLeaderboardUserIds.addAll(prefMap.keySet());
        allLeaderboardUserIds.addAll(weeklyPointsMap.keySet());

        List<com.learnnow.user.entity.User> leaderboardUsers = allLeaderboardUserIds.stream()
                .map(id -> userMap.getOrDefault(id, com.learnnow.user.entity.User.builder().id(id).fullName("Learner").build()))
                .filter(user -> {
                    boolean isCurrent = user.getId().equals(userId);
                    UserLearningPreferences pref = prefMap.get(user.getId());
                    int streak = pref != null ? pref.getCurrentStreak() : 0;
                    int pts = weeklyPointsMap.getOrDefault(user.getId(), 0);
                    if (pts == 0 && pref != null && pref.getTotalPoints() > 0) pts = pref.getTotalPoints();
                    return streak > 0 || pts > 0 || isCurrent;
                })
                .sorted((u1, u2) -> {
                    UserLearningPreferences pref1 = prefMap.get(u1.getId());
                    UserLearningPreferences pref2 = prefMap.get(u2.getId());

                    int p1 = weeklyPointsMap.getOrDefault(u1.getId(), 0);
                    if (p1 == 0 && pref1 != null && pref1.getTotalPoints() > 0) p1 = pref1.getTotalPoints();

                    int p2 = weeklyPointsMap.getOrDefault(u2.getId(), 0);
                    if (p2 == 0 && pref2 != null && pref2.getTotalPoints() > 0) p2 = pref2.getTotalPoints();

                    if (p2 != p1) return Integer.compare(p2, p1);

                    int streak1 = pref1 != null ? pref1.getCurrentStreak() : 0;
                    int streak2 = pref2 != null ? pref2.getCurrentStreak() : 0;
                    if (streak2 != streak1) return Integer.compare(streak2, streak1);

                    java.time.Instant e1 = earliestActivityMap.getOrDefault(u1.getId(), java.time.Instant.MAX);
                    java.time.Instant e2 = earliestActivityMap.getOrDefault(u2.getId(), java.time.Instant.MAX);
                    if (!e1.equals(e2)) return e1.compareTo(e2);

                    return u1.getId().compareTo(u2.getId());
                })
                .toList();

        List<WeeklyLeaderboardEntry> fullLeaderboard = new ArrayList<>();
        int currentUserRank = 0;
        int currentUserWeeklyPoints = 0;

        for (int i = 0; i < leaderboardUsers.size(); i++) {
            com.learnnow.user.entity.User user = leaderboardUsers.get(i);
            int rank = i + 1;
            String badge = rank == 1 ? "GOLD" : (rank == 2 ? "SILVER" : "NONE");
            boolean isCurrent = user.getId().equals(userId);
            int points = weeklyPointsMap.getOrDefault(user.getId(), 0);
            UserLearningPreferences userPref = prefMap.get(user.getId());
            if (points == 0 && userPref != null && userPref.getTotalPoints() > 0) {
                // Fallback for legacy activity recorded before points_earned column migration
                points = userPref.getTotalPoints();
            }
            int streak = userPref != null ? userPref.getCurrentStreak() : 0;

            if (isCurrent) {
                currentUserRank = rank;
                currentUserWeeklyPoints = points;
            }

            String name = user.getFullName() != null && !user.getFullName().isBlank()
                    ? user.getFullName()
                    : (user.getFirstName() != null && !user.getFirstName().isBlank() ? user.getFirstName() : "Learner");

            fullLeaderboard.add(new WeeklyLeaderboardEntry(
                    user.getId(),
                    name,
                    user.getAvatar(),
                    points,
                    streak,
                    rank,
                    badge,
                    isCurrent
            ));
        }

        List<WeeklyLeaderboardEntry> topLeaderboard = fullLeaderboard.stream().limit(10).collect(Collectors.toList());
        if (currentUserRank > 10 && currentUserRank <= fullLeaderboard.size()) {
            topLeaderboard.add(fullLeaderboard.get(currentUserRank - 1));
        }

        // 7. Recent Topic Activity (last 4 topics with progress)
        List<RecentTopicActivity> recentTopics = buildRecentTopics(userTopicProgressList, allPaths, subtopicProgressByTopic);

        // 8. Banner Selection
        DashboardBanner banner = selectBanner(allPaths, userTopicProgressList);

        return new DashboardResponse(
                prefs.getCurrentStreak(),
                prefs.getLongestStreak(),
                prefs.getTotalPoints(),
                prefs.getTimezone(),
                weeklyCalendar,
                recentTopics,
                pathSummaries,
                banner,
                topLeaderboard,
                currentUserRank,
                currentUserWeeklyPoints
        );
    }

    private int calculateTopicPercentage(Topic topic, Map<Long, List<UserSubtopicProgress>> subtopicProgressByTopic, boolean isTopicCompleted) {
        if (isTopicCompleted) return 100;

        int totalSubtopics = topic.getSubtopics() != null ? topic.getSubtopics().size() : 0;
        if (totalSubtopics == 0) return 0;

        List<UserSubtopicProgress> subProgress = subtopicProgressByTopic.getOrDefault(topic.getId(), List.of());
        long completedSubtopics = subProgress.stream().filter(UserSubtopicProgress::isCompleted).count();

        return (int) ((completedSubtopics * 100) / totalSubtopics);
    }

    private List<RecentTopicActivity> buildRecentTopics(
            List<UserTopicProgress> progressList,
            List<Path> allPaths,
            Map<Long, List<UserSubtopicProgress>> subtopicProgressByTopic) {

        Map<Long, Path> pathMap = allPaths.stream()
                .collect(Collectors.toMap(Path::getId, p -> p));
        Map<Long, Topic> topicMap = allPaths.stream()
                .flatMap(p -> p.getTopics().stream())
                .collect(Collectors.toMap(Topic::getId, t -> t, (a, b) -> a));

        return progressList.stream()
                .sorted(Comparator.comparing(
                        UserTopicProgress::getCompletedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .limit(5)
                .map(tp -> {
                    Topic topic = topicMap.get(tp.getTopicId());
                    Path path = pathMap.get(tp.getPathId());
                    boolean isCompleted = tp.getStatus() == ProgressStatus.COMPLETED;

                    int progressPercentage = 0;
                    if (topic != null) {
                        progressPercentage = calculateTopicPercentage(topic, subtopicProgressByTopic, isCompleted);
                    }

                    return new RecentTopicActivity(
                            tp.getTopicId(),
                            topic != null ? topic.getTitle() : "Unknown Topic",
                            tp.getPathId(),
                            path != null ? path.getTitle() : "Unknown Path",
                            progressPercentage,
                            isCompleted,
                            tp.getCompletedAt()
                    );
                })
                .toList();
    }

    private DashboardBanner selectBanner(List<Path> allPaths, List<UserTopicProgress> progressList) {
        if (allPaths.isEmpty()) {
            return new DashboardBanner("FEATURED", null, "No Paths Available", "Add paths to get started.", "General");
        }

        if (progressList.isEmpty()) {
            Path featured = allPaths.get(0);
            return new DashboardBanner("FEATURED", featured.getId(), featured.getTitle(), featured.getDescription(), featured.getCategory());
        }

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

        Path featured = allPaths.get(0);
        return new DashboardBanner("FEATURED", featured.getId(), featured.getTitle(), featured.getDescription(), featured.getCategory());
    }
}
