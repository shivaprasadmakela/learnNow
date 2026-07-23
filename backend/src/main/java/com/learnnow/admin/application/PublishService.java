package com.learnnow.admin.application;

import com.learnnow.admin.domain.ContentValidationPolicy;
import com.learnnow.admin.persistence.ContentBlock;
import com.learnnow.admin.persistence.ContentBlockRepository;
import com.learnnow.common.exception.NotFoundException;
import com.learnnow.paths.entity.ContentStatus;
import com.learnnow.paths.entity.Path;
import com.learnnow.paths.entity.Subtopic;
import com.learnnow.paths.entity.Topic;
import com.learnnow.paths.repository.PathRepository;
import com.learnnow.paths.repository.SubtopicRepository;
import com.learnnow.paths.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PublishService {

    private final SubtopicRepository subtopicRepository;
    private final TopicRepository topicRepository;
    private final PathRepository pathRepository;
    private final ContentBlockRepository contentBlockRepository;
    private final ContentValidationPolicy validationPolicy = new ContentValidationPolicy();

    @Transactional
    public Subtopic publishSubtopic(UUID subtopicId) {
        Subtopic subtopic = subtopicRepository.findById(subtopicId)
                .orElseThrow(() -> new NotFoundException("subtopic_not_found"));

        List<ContentBlock> blocks = contentBlockRepository.findBySubtopicIdOrderByOrderIndexAsc(subtopicId);

        validationPolicy.validateSubtopicForPublishing(subtopic, blocks);

        subtopic.setStatus(ContentStatus.PUBLISHED);
        subtopic.setVersion(subtopic.getVersion() + 1);
        subtopicRepository.save(subtopic);

        Topic parentTopic = subtopic.getTopic();
        if (parentTopic != null && parentTopic.getStatus() == ContentStatus.DRAFT) {
            parentTopic.setStatus(ContentStatus.PUBLISHED);
            topicRepository.save(parentTopic);

            Path parentPath = parentTopic.getPath();
            if (parentPath != null && parentPath.getStatus() == ContentStatus.DRAFT) {
                parentPath.setStatus(ContentStatus.PUBLISHED);
                pathRepository.save(parentPath);
            }
        }

        return subtopic;
    }

    @Transactional
    public Path publishPath(UUID pathId) {
        Path path = pathRepository.findById(pathId)
                .orElseThrow(() -> new NotFoundException("path_not_found"));

        path.setStatus(ContentStatus.PUBLISHED);
        for (Topic t : path.getTopics()) {
            t.setStatus(ContentStatus.PUBLISHED);
            for (Subtopic st : t.getSubtopics()) {
                st.setStatus(ContentStatus.PUBLISHED);
            }
        }
        return pathRepository.save(path);
    }
}
