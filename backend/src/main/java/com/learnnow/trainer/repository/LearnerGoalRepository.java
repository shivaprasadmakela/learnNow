package com.learnnow.trainer.repository;

import com.learnnow.trainer.entity.LearnerGoal;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearnerGoalRepository extends JpaRepository<LearnerGoal, String> {}
