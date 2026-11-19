package com.learnnow.trainer.plan.repository;

import com.learnnow.trainer.plan.entity.TrainerWeeklyPlan;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrainerWeeklyPlanRepository extends JpaRepository<TrainerWeeklyPlan, UUID> {

    Optional<TrainerWeeklyPlan> findByUserIdAndWeekStart(String userId, LocalDate weekStart);

    /** Every plan the learner has had. Used by the data export. */
    List<TrainerWeeklyPlan> findByUserIdOrderByWeekStartDesc(String userId);
}
