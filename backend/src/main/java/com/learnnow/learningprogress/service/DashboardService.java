package com.learnnow.learningprogress.service;

import com.learnnow.learningprogress.dto.response.*;
import com.learnnow.learningprogress.entity.UserLearningDailyActivity;
import com.learnnow.learningprogress.entity.UserLearningPreferences;
import com.learnnow.learningprogress.entity.UserSubtopicProgress;
import com.learnnow.learningprogress.entity.UserTopicProgress;
import com.learnnow.learningprogress.enums.ProgressStatus;
import com.learnnow.learningprogress.repository.UserLearningDailyActivityRepository;
import com.learnnow.learningprogress.repository.UserLearningDailyActivityRepository.WeeklyPointsRow;
import com.learnnow.learningprogress.repository.UserLearningPreferencesRepository;
import com.learnnow.learningprogress.repository.UserSubtopicProgressRepository;
import com.learnnow.learningprogress.repository.UserTopicProgressRepository;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Path;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.PathRepository;
import com.learnnow.user.entity.User;
import com.learnnow.user.repository.UserRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PathRepository pathRepository;
    private final UserLearningDailyActivityRepository dailyActivityRepository;
    private final UserLearningPreferencesRepository preferencesRepository;
    private final UserTopicProgressRepository topicProgressRepository;
    private final UserSubtopicProgressRepository subtopicProgressRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public DashboardResponse buildDashboard(String userId) {
        UserLearningPreferences prefs =
                preferencesRepository
                        .findByUserId(userId)
                        .orElseGet(
                                () ->
                                        UserLearningPreferences.builder()
                                                .userId(userId)
                                                .timezone("Asia/Kolkata")
                                                .build());

        ZoneId userZone = ZoneId.of(prefs.getTimezone());
        LocalDate today = LocalDate.now(userZone);
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        LocalDate sunday = monday.plusDays(6);

        List<WeeklyCalendarDay> weeklyCalendar = buildWeeklyCalendar(userId, today);
        LeaderboardResult leaderboardResult = buildLeaderboard(userId, monday, sunday);

        List<UserSubtopicProgress> allSubtopicProgress =
                subtopicProgressRepository.findByUserId(userId);
        Map<UUID, List<UserSubtopicProgress>> subtopicProgressByTopic =
                allSubtopicProgress.stream()
                        .collect(Collectors.groupingBy(UserSubtopicProgress::getTopicId));

        List<Path> allPaths = pathRepository.findAllWithTopicsByStatus(ContentStatus.PUBLISHED);
        List<UserTopicProgress> userTopicProgressList =
                topicProgressRepository.findByUserId(userId);

        List<RecentTopicActivity> recentTopics =
                buildRecentTopics(userTopicProgressList, allPaths, subtopicProgressByTopic);
        DashboardBanner banner = selectBanner(allPaths, userTopicProgressList);

        return new DashboardResponse(
                prefs.getCurrentStreak(),
                prefs.getLongestStreak(),
                prefs.getTotalPoints(),
                prefs.getTimezone(),
                weeklyCalendar,
                recentTopics,
                banner,
                leaderboardResult.leaderboard(),
                leaderboardResult.currentUserRank(),
                leaderboardResult.currentUserWeeklyPoints());
    }

    private List<WeeklyCalendarDay> buildWeeklyCalendar(String userId, LocalDate today) {
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        List<LocalDate> calendarDates = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            calendarDates.add(monday.plusDays(i));
        }

        List<UserLearningDailyActivity> dailyActivities =
                dailyActivityRepository.findByUserIdAndActivityDateIn(userId, calendarDates);
        Map<LocalDate, UserLearningDailyActivity> dailyMap =
                dailyActivities.stream()
                        .collect(
                                Collectors.toMap(
                                        UserLearningDailyActivity::getActivityDate, d -> d));

        return calendarDates.stream()
                .map(
                        date -> {
                            String name =
                                    date.getDayOfWeek()
                                            .getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
                            UserLearningDailyActivity act = dailyMap.get(date);
                            boolean isDayCompleted =
                                    act != null && act.getQualifyingEventCount() > 0;
                            boolean isDotted = !isDayCompleted;
                            return new WeeklyCalendarDay(name, date, isDayCompleted, isDotted);
                        })
                .toList();
    }

    private record LeaderboardResult(
            List<WeeklyLeaderboardEntry> leaderboard,
            int currentUserRank,
            int currentUserWeeklyPoints) {}

    private LeaderboardResult buildLeaderboard(String userId, LocalDate monday, LocalDate sunday) {
        List<WeeklyPointsRow> weeklyRows =
                dailyActivityRepository.sumWeeklyPointsByUser(monday, sunday);
        Map<String, Integer> weeklyPointsMap =
                weeklyRows.stream()
                        .collect(
                                Collectors.toMap(
                                        WeeklyPointsRow::getUserId,
                                        WeeklyPointsRow::getTotalPoints));
        Map<String, java.time.Instant> earliestActivityMap =
                weeklyRows.stream()
                        .collect(
                                Collectors.toMap(
                                        WeeklyPointsRow::getUserId,
                                        WeeklyPointsRow::getEarliestActivity));

        Set<String> leaderboardUserIds = new HashSet<>(weeklyPointsMap.keySet());
        leaderboardUserIds.add(userId);

        Map<String, User> userMap =
                userRepository.findAllById(leaderboardUserIds).stream()
                        .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));
        Map<String, UserLearningPreferences> prefMap =
                preferencesRepository.findAllByUserIdIn(leaderboardUserIds).stream()
                        .collect(
                                Collectors.toMap(
                                        UserLearningPreferences::getUserId, p -> p, (a, b) -> a));

        List<User> leaderboardUsers =
                leaderboardUserIds.stream()
                        .map(
                                id ->
                                        userMap.getOrDefault(
                                                id,
                                                User.builder().id(id).fullName("Learner").build()))
                        .filter(
                                user -> {
                                    boolean isCurrent = user.getId().equals(userId);
                                    UserLearningPreferences pref = prefMap.get(user.getId());
                                    int streak = pref != null ? pref.getCurrentStreak() : 0;
                                    int pts = weeklyPointsMap.getOrDefault(user.getId(), 0);
                                    return streak > 0 || pts > 0 || isCurrent;
                                })
                        .sorted(
                                (u1, u2) -> {
                                    int p1 = weeklyPointsMap.getOrDefault(u1.getId(), 0);
                                    int p2 = weeklyPointsMap.getOrDefault(u2.getId(), 0);
                                    if (p2 != p1) return Integer.compare(p2, p1);

                                    UserLearningPreferences pref1 = prefMap.get(u1.getId());
                                    UserLearningPreferences pref2 = prefMap.get(u2.getId());
                                    int streak1 = pref1 != null ? pref1.getCurrentStreak() : 0;
                                    int streak2 = pref2 != null ? pref2.getCurrentStreak() : 0;
                                    if (streak2 != streak1)
                                        return Integer.compare(streak2, streak1);

                                    java.time.Instant e1 =
                                            earliestActivityMap.getOrDefault(
                                                    u1.getId(), java.time.Instant.MAX);
                                    java.time.Instant e2 =
                                            earliestActivityMap.getOrDefault(
                                                    u2.getId(), java.time.Instant.MAX);
                                    if (!e1.equals(e2)) return e1.compareTo(e2);

                                    return u1.getId().compareTo(u2.getId());
                                })
                        .toList();

        List<WeeklyLeaderboardEntry> fullLeaderboard = new ArrayList<>();
        int currentUserRank = 0;
        int currentUserWeeklyPoints = 0;

        for (int i = 0; i < leaderboardUsers.size(); i++) {
            User user = leaderboardUsers.get(i);
            int rank = i + 1;
            String badge = rank == 1 ? "GOLD" : (rank == 2 ? "SILVER" : "NONE");
            boolean isCurrent = user.getId().equals(userId);
            int points = weeklyPointsMap.getOrDefault(user.getId(), 0);
            UserLearningPreferences userPref = prefMap.get(user.getId());
            int streak = userPref != null ? userPref.getCurrentStreak() : 0;

            if (isCurrent) {
                currentUserRank = rank;
                currentUserWeeklyPoints = points;
            }

            String name =
                    user.getFullName() != null && !user.getFullName().isBlank()
                            ? user.getFullName()
                            : (user.getFirstName() != null && !user.getFirstName().isBlank()
                                    ? user.getFirstName()
                                    : "Learner");

            fullLeaderboard.add(
                    new WeeklyLeaderboardEntry(
                            user.getId(),
                            name,
                            user.getAvatar(),
                            points,
                            streak,
                            rank,
                            badge,
                            isCurrent));
        }

        List<WeeklyLeaderboardEntry> topLeaderboard =
                fullLeaderboard.stream().limit(10).collect(Collectors.toCollection(ArrayList::new));
        if (currentUserRank > 10 && currentUserRank <= fullLeaderboard.size()) {
            topLeaderboard.add(fullLeaderboard.get(currentUserRank - 1));
        }

        return new LeaderboardResult(topLeaderboard, currentUserRank, currentUserWeeklyPoints);
    }

    private int calculateTopicPercentage(
            Topic topic,
            Map<UUID, List<UserSubtopicProgress>> subtopicProgressByTopic,
            boolean isTopicCompleted) {
        if (isTopicCompleted) return 100;

        int totalSubtopics = topic.getSubtopics() != null ? topic.getSubtopics().size() : 0;
        if (totalSubtopics == 0) return 0;

        List<UserSubtopicProgress> subProgress =
                subtopicProgressByTopic.getOrDefault(topic.getId(), List.of());
        long completedSubtopics =
                subProgress.stream().filter(UserSubtopicProgress::isCompleted).count();

        return (int) ((completedSubtopics * 100) / totalSubtopics);
    }

    private List<RecentTopicActivity> buildRecentTopics(
            List<UserTopicProgress> progressList,
            List<Path> allPaths,
            Map<UUID, List<UserSubtopicProgress>> subtopicProgressByTopic) {

        Map<UUID, Path> pathMap = allPaths.stream().collect(Collectors.toMap(Path::getId, p -> p));
        Map<UUID, Topic> topicMap =
                allPaths.stream()
                        .flatMap(p -> p.getTopics().stream())
                        .collect(Collectors.toMap(Topic::getId, t -> t, (a, b) -> a));

        return progressList.stream()
                .sorted(
                        Comparator.comparing(
                                UserTopicProgress::getCompletedAt,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .map(
                        tp -> {
                            Topic topic = topicMap.get(tp.getTopicId());
                            Path path = pathMap.get(tp.getPathId());
                            boolean isCompleted = tp.getStatus() == ProgressStatus.COMPLETED;

                            int progressPercentage = 0;
                            if (topic != null) {
                                progressPercentage =
                                        calculateTopicPercentage(
                                                topic, subtopicProgressByTopic, isCompleted);
                            }

                            return new RecentTopicActivity(
                                    tp.getTopicId(),
                                    topic != null ? topic.getTitle() : "Unknown Topic",
                                    tp.getPathId(),
                                    path != null ? path.getTitle() : "Unknown Path",
                                    progressPercentage,
                                    isCompleted,
                                    tp.getCompletedAt());
                        })
                .toList();
    }

    private DashboardBanner selectBanner(
            List<Path> allPaths, List<UserTopicProgress> progressList) {
        if (allPaths.isEmpty()) {
            return new DashboardBanner(
                    "FEATURED", null, "No Paths Available", "Add paths to get started.", "General");
        }

        if (progressList.isEmpty()) {
            Path featured = allPaths.get(0);
            return new DashboardBanner(
                    "FEATURED",
                    featured.getId(),
                    featured.getTitle(),
                    featured.getDescription(),
                    featured.getCategory());
        }

        UserTopicProgress completedProgress =
                progressList.stream()
                        .filter(p -> p.getStatus() == ProgressStatus.COMPLETED)
                        .max(
                                Comparator.comparing(
                                        UserTopicProgress::getCompletedAt,
                                        Comparator.nullsFirst(Comparator.naturalOrder())))
                        .orElse(null);

        if (completedProgress != null) {
            Optional<Path> pathOpt =
                    allPaths.stream()
                            .filter(p -> p.getId().equals(completedProgress.getPathId()))
                            .findFirst();
            if (pathOpt.isPresent()) {
                Path path = pathOpt.get();
                return new DashboardBanner(
                        "REVIEW",
                        path.getId(),
                        path.getTitle(),
                        path.getDescription(),
                        path.getCategory());
            }
        }

        Path featured = allPaths.get(0);
        return new DashboardBanner(
                "FEATURED",
                featured.getId(),
                featured.getTitle(),
                featured.getDescription(),
                featured.getCategory());
    }
}
