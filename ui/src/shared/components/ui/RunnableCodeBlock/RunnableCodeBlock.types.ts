import type { CodeSnippetItem } from '../../../api/profile.api';

export interface RunnableCodeBlockProps {
    snippet: CodeSnippetItem;
    /** The lesson the snippet belongs to - where its expected output is fetched from after a run. */
    subtopicId?: string | number;
    onCodeChange?: (newCode: string) => void;
}
