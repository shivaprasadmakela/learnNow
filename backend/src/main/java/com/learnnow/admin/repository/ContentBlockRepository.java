package com.learnnow.admin.repository;

import com.learnnow.admin.entity.ContentBlock;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContentBlockRepository extends JpaRepository<ContentBlock, UUID> {
    List<ContentBlock> findBySubtopicIdOrderByOrderIndexAsc(UUID subtopicId);
}
