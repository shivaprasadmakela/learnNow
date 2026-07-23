import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import styles from './StudyConsoleEditor.module.css';
import type { StudyConsoleEditorProps } from './StudyConsoleEditor.types';

export const StudyConsoleEditor: React.FC<StudyConsoleEditorProps> = ({
    subtopicTitle,
    onTitleChange,
    blocks,
    onBlocksChange
}) => {
    const handleAddMarkdownBlock = () => {
        const newBlock = {
            id: `block-${Date.now()}`,
            orderIndex: blocks.length + 1,
            type: 'markdown' as const,
            body: '### New Section\n\nAdd content explanation here.'
        };
        onBlocksChange([...blocks, newBlock]);
    };

    const handleAddQuizBlock = () => {
        const newBlock = {
            id: `block-${Date.now()}`,
            orderIndex: blocks.length + 1,
            type: 'quiz' as const,
            questions: [
                {
                    id: `q-${Date.now()}`,
                    kind: 'mcq' as const,
                    prompt: 'What is the default isolation level in PostgreSQL?',
                    options: ['Read Committed', 'Repeatable Read', 'Serializable', 'Read Uncommitted'],
                    correctAnswer: 'Read Committed',
                    explanation: 'PostgreSQL uses Read Committed as its default isolation level.'
                }
            ]
        };
        onBlocksChange([...blocks, newBlock]);
    };

    const handleRemoveBlock = (id: string) => {
        onBlocksChange(blocks.filter(b => b.id !== id));
    };

    const handleBodyChange = (id: string, body: string) => {
        onBlocksChange(blocks.map(b => b.id === id ? { ...b, body } : b));
    };

    return (
        <div className={styles.editorContainer}>
            <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Subtopic Title</label>
                <input
                    type="text"
                    className={styles.inputField}
                    value={subtopicTitle}
                    onChange={e => onTitleChange(e.target.value)}
                    placeholder="Enter subtopic title..."
                />
            </div>

            {blocks.map((block, index) => (
                <div key={block.id} className={styles.blockCard}>
                    <div className={styles.blockHeader}>
                        <span>Block #{index + 1} — {block.type.toUpperCase()}</span>
                        <button
                            type="button"
                            onClick={() => handleRemoveBlock(block.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    {block.type === 'markdown' && (
                        <textarea
                            className={styles.textArea}
                            value={block.body || ''}
                            onChange={e => handleBodyChange(block.id, e.target.value)}
                        />
                    )}

                    {block.type === 'quiz' && block.questions && (
                        <div>
                            <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Quiz Question: {block.questions[0].prompt}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--tech-green)' }}>
                                Correct Answer: {block.questions[0].correctAnswer}
                            </p>
                        </div>
                    )}
                </div>
            ))}

            <div className={styles.addBlockGroup}>
                <button type="button" className={styles.addBtn} onClick={handleAddMarkdownBlock}>
                    <Plus size={16} style={{ marginRight: '6px' }} /> Add Markdown Block
                </button>
                <button type="button" className={styles.addBtn} onClick={handleAddQuizBlock}>
                    <Plus size={16} style={{ marginRight: '6px' }} /> Add Quiz Block
                </button>
            </div>
        </div>
    );
};
