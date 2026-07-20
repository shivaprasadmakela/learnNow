package com.learnnow.learningprogress.dto.response;

import java.util.List;

public record PaginatedActivitiesResponse(
    List<ActivityFeedItem> items,
    String nextCursor
) {}
