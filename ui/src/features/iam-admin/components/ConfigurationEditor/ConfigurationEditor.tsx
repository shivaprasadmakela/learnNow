import React from 'react';
import { ArrowLeft, Save, Send } from 'lucide-react';
import styles from './ConfigurationEditor.module.css';
import type { ConfigurationEditorProps } from './ConfigurationEditor.types';
import { useConfigurationEditor } from './ConfigurationEditor.hooks';
import { CourseDetailsPanel } from './components/CourseDetailsPanel';
import { CurriculumPanel } from './components/CurriculumPanel';
import { SubtopicEditorPanel } from './components/SubtopicEditorPanel';
import { CoursePreviewModal } from '../CoursePreviewModal';

export const ConfigurationEditor: React.FC<ConfigurationEditorProps> = ({
    pathId,
    onSaveSuccess,
    onCancel,
}) => {
    const {
        isLoading, isSaving,
        title, setTitle,
        description, setDescription,
        category, setCategory,
        managedBy, setManagedBy,
        status,
        topics,
        activeTopicIndex, setActiveTopicIndex,
        activeSubtopicIndex, setActiveSubtopicIndex,
        handleAddTopic, handleRemoveTopic, handleUpdateTopic,
        handleAddSubtopic, handleRemoveSubtopic, handleUpdateSubtopic,
        handleAddQuestion, handleRemoveQuestion, handleUpdateQuestion,
        handleAddOption, handleRemoveOption, handleUpdateOption,
        handleSaveDraft, handlePublish,
    } = useConfigurationEditor(pathId, onSaveSuccess);

    if (isLoading) {
        return (
            <div className={styles.loadingState}>
                <p>Loading Course Configuration…</p>
            </div>
        );
    }

    const currentTopic = topics[activeTopicIndex];
    const currentSubtopic = currentTopic?.subtopics?.[activeSubtopicIndex];

    return (
        <div className={styles.container}>
            {/* ── Top Bar ─────────────────────────────────── */}
            <div className={styles.topBar}>
                <div className={styles.titleArea}>
                    <button type="button" className={styles.btnSecondary} onClick={onCancel}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div className={styles.titleRow}>
                        <h2 className={styles.pageTitle}>
                            {pathId ? 'Edit Course' : 'Create Course'}
                        </h2>
                        <span className={styles.statusBadge} data-status={status}>
                            {status}
                        </span>
                    </div>
                </div>
                <div className={styles.actionsArea}>
                    <CoursePreviewModal
                        title={title}
                        managedBy={managedBy}
                        topics={topics}
                    />
                    <button type="button" className={styles.btnSecondary} onClick={handleSaveDraft} disabled={isSaving}>
                        <Save size={16} /> Save Draft
                    </button>
                    <button type="button" className={styles.btnSuccess} onClick={handlePublish} disabled={isSaving}>
                        <Send size={16} /> Publish
                    </button>
                </div>
            </div>

            {/* ── Split Workspace ─────────────────────────── */}
            <div className={styles.workspace}>
                {/* Left Panel */}
                <div className={styles.leftPanel}>
                    <CourseDetailsPanel
                        title={title}
                        onTitleChange={setTitle}
                        description={description}
                        onDescriptionChange={setDescription}
                        category={category}
                        onCategoryChange={setCategory}
                        managedBy={managedBy}
                        onManagedByChange={setManagedBy}
                    />
                    <CurriculumPanel
                        topics={topics}
                        activeTopicIndex={activeTopicIndex}
                        activeSubtopicIndex={activeSubtopicIndex}
                        onSelectSubtopic={(tIdx, sIdx) => {
                            setActiveTopicIndex(tIdx);
                            setActiveSubtopicIndex(sIdx);
                        }}
                        onAddTopic={handleAddTopic}
                        onRemoveTopic={handleRemoveTopic}
                        onUpdateTopicTitle={(tIdx, value) => handleUpdateTopic(tIdx, 'title', value)}
                        onUpdateTopicDescription={(tIdx, value) => handleUpdateTopic(tIdx, 'description', value)}
                        onAddSubtopic={handleAddSubtopic}
                        onRemoveSubtopic={handleRemoveSubtopic}
                    />
                </div>

                {/* Right Panel */}
                <div className={styles.rightPanel}>
                    <SubtopicEditorPanel
                        currentTopic={currentTopic}
                        currentSubtopic={currentSubtopic}
                        activeTopicIndex={activeTopicIndex}
                        activeSubtopicIndex={activeSubtopicIndex}
                        onSubtopicTitleChange={(tIdx, sIdx, value) =>
                            handleUpdateSubtopic(tIdx, sIdx, 'title', value)
                        }
                        onSubtopicContentChange={(tIdx, sIdx, value) =>
                            handleUpdateSubtopic(tIdx, sIdx, 'content', value)
                        }
                        onAddQuestion={handleAddQuestion}
                        onRemoveQuestion={handleRemoveQuestion}
                        onUpdateQuestion={handleUpdateQuestion}
                        onAddOption={handleAddOption}
                        onRemoveOption={handleRemoveOption}
                        onUpdateOption={handleUpdateOption}
                    />
                </div>
            </div>
        </div>
    );
};

export default ConfigurationEditor;
