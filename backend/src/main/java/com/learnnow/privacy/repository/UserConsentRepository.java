package com.learnnow.privacy.repository;

import com.learnnow.privacy.entity.ConsentPurpose;
import com.learnnow.privacy.entity.UserConsent;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserConsentRepository extends JpaRepository<UserConsent, UUID> {

    List<UserConsent> findByUserId(String userId);

    Optional<UserConsent> findByUserIdAndPurpose(String userId, ConsentPurpose purpose);
}
