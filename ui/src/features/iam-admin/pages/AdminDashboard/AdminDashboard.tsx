import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, BookOpen, Upload, Trash2 } from 'lucide-react';
import styles from './AdminDashboard.module.css';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { LearningCard } from '../../../../shared/components/cards';
import { fetchAdminPaths, deleteAdminPath, type AdminPathData } from '../../api/admin.api';

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

    const handleDelete = async (e: React.MouseEvent, pathId: string, pathTitle: string) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${pathTitle}"? This will permanently remove all topics, subtopics, and questions within this course.`)) {
            try {
                await deleteAdminPath(pathId);
                await loadPaths();
            } catch (err) {
                console.error('Failed to delete path:', err);
                alert('Failed to delete path. Please try again.');
            }
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
                            <div key={path.id} style={{ position: 'relative' }}>
                                <LearningCard
                                    badgeLabel={path.category || 'Backend'}
                                    badgeVariant={isPublished ? 'green' : 'orange'}
                                    isCompleted={isPublished}
                                    title={path.title}
                                    description={path.description}
                                    footerText={`${path.topics?.length || 0} Topics`}
                                    buttonTooltip="Edit Course"
                                    onClick={() => path.id && onNavigateEdit(path.id)}
                                />
                                {path.id && (
                                    <button
                                        type="button"
                                        onClick={(e) => handleDelete(e, path.id!, path.title)}
                                        title="Delete Course"
                                        style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '12px',
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            padding: '6px',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease',
                                            zIndex: 2
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
