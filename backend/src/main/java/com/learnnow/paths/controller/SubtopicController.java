package com.learnnow.paths.controller;

import com.learnnow.paths.entity.Subtopic;
import com.learnnow.paths.repository.SubtopicRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subtopics")
public class SubtopicController {

    private final SubtopicRepository subtopicRepository;

    public SubtopicController(SubtopicRepository subtopicRepository) {
        this.subtopicRepository = subtopicRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Subtopic> getSubtopicDetails(@PathVariable Long id) {
        return subtopicRepository.findByIdWithSections(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/toggle-complete")
    public ResponseEntity<Subtopic> toggleSubtopicComplete(@PathVariable Long id) {
        return subtopicRepository.findById(id)
                .map(subtopic -> {
                    subtopic.setCompleted(!subtopic.isCompleted());
                    return ResponseEntity.ok(subtopicRepository.save(subtopic));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
