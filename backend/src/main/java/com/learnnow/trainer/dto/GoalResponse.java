package com.learnnow.trainer.dto;

import com.learnnow.trainer.entity.LearnerGoal;
import java.time.LocalDate;

public record GoalResponse(String targetRole, LocalDate targetDate, Short hoursPerWeek) {

    public static GoalResponse from(LearnerGoal goal) {
        return new GoalResponse(goal.getTargetRole(), goal.getTargetDate(), goal.getHoursPerWeek());
    }
}
