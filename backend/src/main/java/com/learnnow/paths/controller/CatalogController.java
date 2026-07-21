package com.learnnow.paths.controller;

import com.learnnow.paths.dto.PathSummaryDto;
import com.learnnow.paths.dto.SubtopicDto;
import com.learnnow.paths.dto.TopicSummaryDto;
import com.learnnow.paths.entity.Path;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.PathRepository;
import com.learnnow.paths.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Public catalog endpoints — accessible without authentication.
 * Non-logged-in users can browse paths and see topic/subtopic titles,
 * but cannot see subtopic content or track progress.
 */
@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final PathRepository pathRepository;
    private final TopicRepository topicRepository;

    /**
     * List all paths with their topic summaries (no user progress data).
     */
    @GetMapping("/paths")
    public ResponseEntity<List<PathSummaryDto>> getAllPaths() {
        List<PathSummaryDto> paths = pathRepository.findAll().stream()
                .map(path -> new PathSummaryDto(
                        path.getId(),
                        path.getTitle(),
                        path.getDescription(),
                        path.getCategory(),
                        path.getManagedBy(),
                        path.getTopics().stream()
                                .map(topic -> new TopicSummaryDto(
                                        topic.getId(),
                                        topic.getTitle(),
                                        topic.getDescription(),
                                        topic.getCategory(),
                                        topic.getDuration(),
                                        false
                                ))
                                .toList()
                ))
                .toList();
        return ResponseEntity.ok(paths);
    }

    /**
     * Get a single path with topic details and subtopic titles (no content, no user progress).
     */
    @GetMapping("/paths/{pathId}")
    public ResponseEntity<CatalogPathDetail> getPathDetail(@PathVariable Long pathId) {
        return pathRepository.findById(pathId)
                .map(path -> {
                    List<CatalogTopicDetail> topics = path.getTopics().stream()
                            .map(topic -> {
                                List<CatalogSubtopicTitle> subtopicTitles = topic.getSubtopics().stream()
                                        .map(st -> new CatalogSubtopicTitle(st.getId(), st.getTitle(), st.getOrderIndex()))
                                        .toList();
                                return new CatalogTopicDetail(
                                        topic.getId(),
                                        topic.getTitle(),
                                        topic.getDescription(),
                                        topic.getCategory(),
                                        topic.getDuration(),
                                        subtopicTitles
                                );
                            })
                            .toList();

                    return ResponseEntity.ok(new CatalogPathDetail(
                            path.getId(),
                            path.getTitle(),
                            path.getDescription(),
                            path.getCategory(),
                            path.getManagedBy(),
                            topics
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // --- Inner record DTOs for public catalog (no user-specific data) ---

    public record CatalogSubtopicTitle(Long id, String title, int orderIndex) {}

    public record CatalogTopicDetail(
            Long id, String title, String description,
            String category, String duration,
            List<CatalogSubtopicTitle> subtopics
    ) {}

    public record CatalogPathDetail(
            Long id, String title, String description,
            String category, String managedBy,
            List<CatalogTopicDetail> topics
    ) {}
}
