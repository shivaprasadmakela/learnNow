package com.learnnow.learningprogress.repository;

import com.learnnow.learningprogress.entity.UserLearningPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserLearningPreferencesRepository extends JpaRepository<UserLearningPreferences, String> {

    Optional<UserLearningPreferences> findByUserId(String userId);

    List<UserLearningPreferences> findAllByUserIdIn(Collection<String> userIds);

}

