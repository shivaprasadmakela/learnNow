import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ShieldCheck, Plus, BookOpen, Upload, FileJson, Layers, GraduationCap } from 'lucide-react';
import styles from './AdminDashboard.module.css';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { Loader } from '../../../../shared/components/ui/Loader';
import { LearningCard } from '../../../../shared/components/cards';
import { InfiniteScrollSentinel } from '../../../../shared/components/ui/InfiniteScrollSentinel';
import { DEFAULT_PAGE_SIZE } from '../../../../shared/api/pagination';
import { fetchAdminPathsPage, deleteAdminPath, type AdminPathData } from '../../api/admin.api';
import { Tabs } from '../../../../shared/components/ui/Tabs';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { DsaImporter } from '../../components/DsaImporter';
import { DsaSheetManager } from '../../components/DsaSheetManager';

interface AdminDashboardProps {
    onNavigateCreate: () => void;
    onNavigateImport: () => void;
    onNavigateEdit: (pathId: string) => void;
    refreshUserData?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
    onNavigateCreate,
    onNavigateImport,
    onNavigateEdit,
    refreshUserData
}) => {
    const [paths, setPaths] = useState<AdminPathData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const pageRef = useRef(0);

    type AdminTab = 'courses' | 'dsa-import' | 'dsa-sheet';
    const [tab, setTab] = useState<AdminTab>('courses');
    /** Bumped after an import so the sheet tab reloads without a remount. */
    const [dsaToken, setDsaToken] = useState(0);

    const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    /** Reloads from the first page - used on mount and after a delete changes the ordering. */
    const loadPaths = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await fetchAdminPathsPage(0, DEFAULT_PAGE_SIZE);
            setPaths(result.content);
            pageRef.current = 0;
            setHasMore(result.hasNext);
        } catch (err) {
            console.error('Failed to load admin paths:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadMorePaths = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        const nextPage = pageRef.current + 1;
        try {
            const result = await fetchAdminPathsPage(nextPage, DEFAULT_PAGE_SIZE);
            setPaths(prev => {
                const seen = new Set(prev.map(p => p.id));
                return [...prev, ...result.content.filter(p => !seen.has(p.id))];
            });
            pageRef.current = nextPage;
            setHasMore(result.hasNext);
        } catch (err) {
            console.error('Failed to load more admin paths:', err);
            setHasMore(false);
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasMore, isLoadingMore]);

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteAdminPath(deleteTarget.id);
            if (refreshUserData) {
                refreshUserData();
            }
            setDeleteTarget(null);
            await loadPaths();
        } catch (err) {
            console.error('Failed to delete path:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        loadPaths();
    }, [loadPaths]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <ShieldCheck size={28} color="var(--tech-blue)" />
                    Course Authoring Studio
                </div>
                {tab === 'courses' && (
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
                )}
            </div>

            <Tabs
                items={[
                    { id: 'courses', label: 'Courses', icon: <GraduationCap size={16} /> },
                    { id: 'dsa-import', label: 'DSA · Import JSON', icon: <FileJson size={16} /> },
                    { id: 'dsa-sheet', label: 'DSA · Sheet', icon: <Layers size={16} /> }
                ]}
                activeId={tab}
                onChange={setTab}
                variant="compact"
                label="Authoring sections"
                className={styles.studioTabs}
            />

            {tab === 'dsa-import' && (
                <DsaImporter
                    onImported={() => {
                        setDsaToken(n => n + 1);
                        setTab('dsa-sheet');
                    }}
                />
            )}

            {tab === 'dsa-sheet' && <DsaSheetManager refreshToken={dsaToken} />}

            {tab === 'courses' && (isLoading ? (
                <Loader variant="inline" text="Loading course catalog..." showColdStartFunnyMessages={true} />
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
                                onDelete={path.id ? () => setDeleteTarget({ id: path.id!, title: path.title }) : undefined}
                            />
                        );
                    })}

                    <InfiniteScrollSentinel
                        hasMore={hasMore}
                        isLoading={isLoadingMore}
                        onLoadMore={loadMorePaths}
                        loadingText="Loading more courses..."
                        loadMoreLabel="Load more courses"
                    />
                </div>
            ))}

            <ConfirmDeleteModal
                isOpen={Boolean(deleteTarget)}
                title={deleteTarget?.title || ''}
                isDeleting={isDeleting}
                onConfirm={handleConfirmDelete}
                onClose={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default AdminDashboard;
