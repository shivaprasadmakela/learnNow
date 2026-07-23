import { useState } from 'react';

export interface AdminPath {
    id: string;
    title: string;
    description: string;
    category: string;
    managedBy: string;
    status: 'DRAFT' | 'PUBLISHED';
}

export interface AdminTopic {
    id: string;
    pathId: string;
    title: string;
    description: string;
    category: string;
    duration: string;
    status: 'DRAFT' | 'PUBLISHED';
}

export interface AdminSubtopic {
    id: string;
    topicId: string;
    title: string;
    content: string;
    orderIndex: number;
    status: 'DRAFT' | 'PUBLISHED';
    version: number;
}

export const useAdminContent = () => {
    const [paths, setPaths] = useState<AdminPath[]>([
        {
            id: 'path-1',
            title: 'Spring Boot & Java 21 Monolith Architecture',
            description: 'Master REST APIs, JPA Entities, Flyway Migrations, and JWT Auth.',
            category: 'Backend',
            managedBy: 'learnNow',
            status: 'PUBLISHED'
        }
    ]);

    const [selectedPathId, setSelectedPathId] = useState<string | null>('path-1');
    const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

    const createPath = (title: string, description: string, category: string) => {
        const newPath: AdminPath = {
            id: `path-${Date.now()}`,
            title,
            description,
            category,
            managedBy: 'learnNow',
            status: 'DRAFT'
        };
        setPaths(prev => [...prev, newPath]);
        setSelectedPathId(newPath.id);
    };

    return {
        paths,
        selectedPathId,
        setSelectedPathId,
        selectedTopicId,
        setSelectedTopicId,
        createPath
    };
};
