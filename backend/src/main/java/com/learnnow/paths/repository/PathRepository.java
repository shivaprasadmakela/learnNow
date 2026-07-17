package com.learnnow.paths.repository;

import com.learnnow.paths.entity.Path;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PathRepository extends JpaRepository<Path, Long> {
    List<Path> findByCategoryIgnoreCase(String category);
}
