package com.learnnow.paths.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "path_topics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"path", "topic"})
public class PathTopic {

    @EmbeddedId private PathTopicId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("pathId")
    @JoinColumn(name = "path_id")
    @JsonIgnore
    private Path path;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("topicId")
    @JoinColumn(name = "topic_id")
    private Topic topic;

    @Column(name = "order_index")
    @Builder.Default
    private Integer orderIndex = 1;
}
