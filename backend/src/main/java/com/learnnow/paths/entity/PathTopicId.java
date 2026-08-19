package com.learnnow.paths.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PathTopicId implements Serializable {

    @Column(name = "path_id")
    private UUID pathId;

    @Column(name = "topic_id")
    private UUID topicId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PathTopicId that = (PathTopicId) o;
        return Objects.equals(pathId, that.pathId) && Objects.equals(topicId, that.topicId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(pathId, topicId);
    }
}
