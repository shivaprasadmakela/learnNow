package com.learnnow.trainer.resume.repository;

import com.learnnow.trainer.resume.entity.LearnerResume;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearnerResumeRepository extends JpaRepository<LearnerResume, String> {

    /** The learner's resume, if they have one now (a deleted one keeps only its quota count). */
    default Optional<LearnerResume> findPresent(String userId) {
        return findById(userId).filter(LearnerResume::present);
    }
}
