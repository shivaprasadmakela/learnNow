import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, BookOpen, Upload } from 'lucide-react';
import styles from './AdminDashboard.module.css';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { LearningCard } from '../../../../shared/components/cards';
import { fetchAdminPaths, type AdminPathData } from '../../api/admin.api';

interface AdminDashboardProps {
    onNavigateCreate: () => void;
    onNavigateImport: () => void;
    onNavigateEdit: (pathId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
    onNavigateCreate,
    onNavigateImport,
    onNavigateEdit
}) => {
    const [paths, setPaths] = useState<AdminPathData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const loadPaths = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAdminPaths();
            setPaths(data);
        } catch (err) {
            console.error('Failed to load admin paths:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPaths();
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <ShieldCheck size={28} color="var(--tech-blue)" />
                    Course Authoring Studio
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        type="button"
                        className={styles.createBtn}
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                        onClick={onNavigateImport}
                    >
                        <Upload size={18} /> Bulk Import Course
                    </button>

                    <button
                        type="button"
                        className={styles.createBtn}
                        onClick={onNavigateCreate}
                    >
                        <Plus size={18} /> Create Course
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <p>Loading course catalog...</p>
                </div>
            ) : paths.length === 0 ? (
                <EmptyState
                    icon={BookOpen}
                    title="No Courses Available"
                    description="You haven't created any learning paths yet. Start building courses and publishing content for learners."
                    actionLabel="Create Course"
                    onAction={onNavigateCreate}
                />
            ) : (
                <div className={styles.pathGrid}>
                    {paths.map(path => {
                        const isPublished = path.status === 'PUBLISHED';
                        return (
                            <LearningCard
                                key={path.id}
                                badgeLabel={path.category || 'Backend'}
                                badgeVariant={isPublished ? 'green' : 'orange'}
                                isCompleted={isPublished}
                                title={path.title}
                                description={path.description}
                                footerText={`${path.topics?.length || 0} Topics`}
                                buttonTooltip="Edit Course"
                                onClick={() => path.id && onNavigateEdit(path.id)}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
