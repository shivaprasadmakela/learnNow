import React, { useState } from 'react';
import { FolderPlus, BookOpen } from 'lucide-react';
import styles from './PathManager.module.css';
import type { AdminPath } from '../../hooks/useAdminContent';

interface PathManagerProps {
    paths: AdminPath[];
    selectedPathId: string | null;
    onSelectPath: (id: string) => void;
    onCreatePath: (title: string, description: string, category: string) => void;
}

export const PathManager: React.FC<PathManagerProps> = ({
    paths,
    selectedPathId,
    onSelectPath,
    onCreatePath
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Backend');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onCreatePath(title, description, category);
        setTitle('');
        setDescription('');
        setIsCreating(false);
    };

    return (
        <div>
            <h2>Course Learning Paths</h2>
            <div className={styles.pathGrid}>
                {paths.map(path => (
                    <div
                        key={path.id}
                        className={`${styles.pathCard} ${selectedPathId === path.id ? styles.pathCardSelected : ''}`}
                        onClick={() => onSelectPath(path.id)}
                    >
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <BookOpen size={18} color="var(--tech-blue)" />
                                <strong>{path.title}</strong>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                                {path.description}
                            </p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                            <span>{path.category}</span>
                            <span style={{ fontWeight: 600, color: path.status === 'PUBLISHED' ? 'var(--tech-green)' : '#eab308' }}>
                                {path.status}
                            </span>
                        </div>
                    </div>
                ))}

                {!isCreating ? (
                    <div className={styles.createCard} onClick={() => setIsCreating(true)}>
                        <FolderPlus size={32} />
                        <span style={{ fontWeight: 600 }}>Create New Path</span>
                    </div>
                ) : (
                    <form className={styles.pathCard} onSubmit={handleSubmit}>
                        <div>
                            <input
                                type="text"
                                placeholder="Path Title..."
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Category (e.g. Backend)..."
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                            />
                            <textarea
                                placeholder="Description..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" style={{ padding: '6px 12px', background: 'var(--tech-blue)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Save</button>
                            <button type="button" onClick={() => setIsCreating(false)} style={{ padding: '6px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
