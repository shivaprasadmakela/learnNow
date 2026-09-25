package com.learnnow.privacy.dto.response;

import com.learnnow.privacy.entity.Grievance;
import com.learnnow.privacy.entity.GrievanceCategory;
import com.learnnow.privacy.entity.GrievanceStatus;
import java.time.Instant;

public record GrievanceResponse(
        String reference,
        GrievanceCategory category,
        String subject,
        String body,
        GrievanceStatus status,
        String response,
        Instant createdAt,
        Instant updatedAt,
        Instant resolvedAt) {

    public static GrievanceResponse from(Grievance grievance) {
        return new GrievanceResponse(
                grievance.getReference(),
                grievance.getCategory(),
                grievance.getSubject(),
                grievance.getBody(),
                grievance.getStatus(),
                grievance.getResponse(),
                grievance.getCreatedAt(),
                grievance.getUpdatedAt(),
                grievance.getResolvedAt());
    }
}
