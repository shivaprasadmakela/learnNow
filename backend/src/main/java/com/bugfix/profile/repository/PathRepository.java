package com.bugfix.profile.repository;

import com.bugfix.profile.entity.Path;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PathRepository extends JpaRepository<Path, Long> {
    List<Path> findByCategoryIgnoreCase(String category);
}
