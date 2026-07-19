package com.learnnow.paths.controller;

import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.TopicRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/topics")
public class TopicController {

    private final TopicRepository topicRepository;

    public TopicController(TopicRepository topicRepository) {
        this.topicRepository = topicRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Topic> getTopicDetails(@PathVariable Long id) {
        return topicRepository.findByIdWithSubtopics(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/toggle-complete")
    public ResponseEntity<Topic> toggleTopicComplete(@PathVariable Long id) {
        return topicRepository.findById(id)
                .map(topic -> {
                    topic.setCompleted(!topic.isCompleted());
                    Topic saved = topicRepository.save(topic);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
