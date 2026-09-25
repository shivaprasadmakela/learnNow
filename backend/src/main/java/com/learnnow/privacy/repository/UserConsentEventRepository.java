package com.learnnow.privacy.repository;

import com.learnnow.privacy.entity.UserConsentEvent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserConsentEventRepository extends JpaRepository<UserConsentEvent, UUID> {

    List<UserConsentEvent> findByUserIdOrderByCreatedAtDesc(String userId);
}
