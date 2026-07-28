import React from 'react';
import { FileText, Plus, Trash2, HelpCircle, CheckCircle } from 'lucide-react';
import styles from './SubtopicEditorPanel.module.css';
import type { AdminTopicData, AdminSubtopicData, QuizQuestionDto } from '../../../api/admin.api';

interface SubtopicEditorPanelProps {
    currentTopic: AdminTopicData | undefined;
    currentSubtopic: AdminSubtopicData | undefined;
    activeTopicIndex: number;
    activeSubtopicIndex: number;
    onSubtopicTitleChange: (topicIdx: number, subtopicIdx: number, value: string) => void;
    onSubtopicContentChange: (topicIdx: number, subtopicIdx: number, value: string) => void;
    onAddQuestion?: (topicIdx: number, subtopicIdx: number) => void;
    onRemoveQuestion?: (topicIdx: number, subtopicIdx: number, questionIdx: number) => void;
    onUpdateQuestion?: (topicIdx: number, subtopicIdx: number, questionIdx: number, field: keyof QuizQuestionDto, value: any) => void;
    onAddOption?: (topicIdx: number, subtopicIdx: number, questionIdx: number) => void;
    onRemoveOption?: (topicIdx: number, subtopicIdx: number, questionIdx: number, optionIdx: number) => void;
    onUpdateOption?: (topicIdx: number, subtopicIdx: number, questionIdx: number, optionIdx: number, value: string) => void;
}

export const SubtopicEditorPanel: React.FC<SubtopicEditorPanelProps> = ({
    currentTopic,
    currentSubtopic,
    activeTopicIndex,
    activeSubtopicIndex,
    onSubtopicTitleChange,
    onSubtopicContentChange,
    onAddQuestion,
    onRemoveQuestion,
    onUpdateQuestion,
    onAddOption,
    onRemoveOption,
    onUpdateOption,
}) => {
    if (!currentSubtopic) {
        return (
            <div className={styles.emptyPanel}>
                <FileText size={40} className={styles.emptyIcon} />
                <p className={styles.emptyText}>Select a subtopic from the curriculum to start editing</p>
            </div>
        );
    }

    const questions = currentSubtopic.questions || [];

    return (
        <div className={styles.panel}>
            <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>
                    <i className="fa-solid fa-dove" style={{ marginRight: '6px', fontSize: '0.85rem', color: 'var(--tech-blue)' }} aria-hidden="true" />
                    {currentTopic?.title} › Subtopic {activeSubtopicIndex + 1}
                </span>
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="subtopic-title">Subtopic Title</label>
                <input
                    id="subtopic-title"
                    type="text"
                    className={styles.inputField}
                    value={currentSubtopic.title}
                    onChange={e => onSubtopicTitleChange(activeTopicIndex, activeSubtopicIndex, e.target.value)}
                    placeholder="Enter subtopic title..."
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="subtopic-content">Markdown Content</label>
                <textarea
                    id="subtopic-content"
                    className={styles.contentTextarea}
                    value={currentSubtopic.content}
                    onChange={e => onSubtopicContentChange(activeTopicIndex, activeSubtopicIndex, e.target.value)}
                    placeholder="Write markdown content here..."
                    spellCheck={false}
                />
            </div>

            {/* ── MCQ Quiz Builder Section ────────────────────── */}
            <div className={styles.quizSection}>
                <div className={styles.quizSectionHeader}>
                    <h4 className={styles.quizSectionTitle}>
                        <HelpCircle size={16} /> MCQ Quiz Questions ({questions.length})
                    </h4>
                    {onAddQuestion && (
                        <button
                            type="button"
                            className={styles.addQuestionBtn}
                            onClick={() => onAddQuestion(activeTopicIndex, activeSubtopicIndex)}
                        >
                            <Plus size={13} /> Add MCQ
                        </button>
                    )}
                </div>

                {questions.length === 0 ? (
                    <div className={styles.noQuestionsBox}>
                        <p>No quiz questions added yet. Click <strong>+ Add MCQ</strong> to attach questions.</p>
                    </div>
                ) : (
                    <div className={styles.questionList}>
                        {questions.map((q, qIdx) => (
                            <div key={qIdx} className={styles.questionCard}>
                                <div className={styles.questionCardHeader}>
                                    <span className={styles.questionBadge}>Question #{qIdx + 1}</span>
                                    {onRemoveQuestion && (
                                        <button
                                            type="button"
                                            className={styles.removeBtn}
                                            onClick={() => onRemoveQuestion(activeTopicIndex, activeSubtopicIndex, qIdx)}
                                            title="Delete Question"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.subLabel}>Question Prompt</label>
                                    <input
                                        type="text"
                                        className={styles.inputField}
                                        value={q.prompt}
                                        onChange={e => onUpdateQuestion?.(activeTopicIndex, activeSubtopicIndex, qIdx, 'prompt', e.target.value)}
                                        placeholder="e.g. Which HTTP method is idempotent?"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.subLabel}>Multiple Choice Options (Select Radio for Correct Answer)</label>
                                    <div className={styles.optionsList}>
                                        {(q.options || []).map((opt, oIdx) => {
                                            const isCorrect = q.correctAnswer === opt;
                                            return (
                                                <div key={oIdx} className={`${styles.optionRow} ${isCorrect ? styles.optionRowCorrect : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name={`correct-q-${qIdx}`}
                                                        checked={isCorrect}
                                                        onChange={() => onUpdateQuestion?.(activeTopicIndex, activeSubtopicIndex, qIdx, 'correctAnswer', opt)}
                                                        title="Set as correct answer"
                                                    />
                                                    <input
                                                        type="text"
                                                        className={styles.optionInput}
                                                        value={opt}
                                                        onChange={e => onUpdateOption?.(activeTopicIndex, activeSubtopicIndex, qIdx, oIdx, e.target.value)}
                                                        placeholder={`Option ${oIdx + 1}`}
                                                    />
                                                    {isCorrect && <CheckCircle size={14} className={styles.correctCheckIcon} />}
                                                    {onRemoveOption && (q.options || []).length > 2 && (
                                                        <button
                                                            type="button"
                                                            className={styles.removeBtn}
                                                            onClick={() => onRemoveOption(activeTopicIndex, activeSubtopicIndex, qIdx, oIdx)}
                                                            title="Delete Option"
                                                        >
                                                            <Trash2 size={11} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {onAddOption && (
                                        <button
                                            type="button"
                                            className={styles.addOptionBtn}
                                            onClick={() => onAddOption(activeTopicIndex, activeSubtopicIndex, qIdx)}
                                        >
                                            <Plus size={11} /> Add Option
                                        </button>
                                    )}
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.subLabel}>Explanation (Shown after submission)</label>
                                    <input
                                        type="text"
                                        className={styles.inputField}
                                        value={q.explanation || ''}
                                        onChange={e => onUpdateQuestion?.(activeTopicIndex, activeSubtopicIndex, qIdx, 'explanation', e.target.value)}
                                        placeholder="e.g. GET, PUT, and DELETE are idempotent according to HTTP spec."
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
