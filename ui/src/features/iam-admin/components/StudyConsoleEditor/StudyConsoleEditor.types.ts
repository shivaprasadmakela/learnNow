import type { ContentBlockItem } from '../../../../shared/components/content-renderer';

export interface StudyConsoleEditorProps {
    subtopicTitle: string;
    onTitleChange: (title: string) => void;
    blocks: ContentBlockItem[];
    onBlocksChange: (blocks: ContentBlockItem[]) => void;
}
