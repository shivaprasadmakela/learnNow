import type { CodeSnippetItem } from '../../../api/profile.api';

export interface RunnableCodeBlockProps {
    snippet: CodeSnippetItem;
    onCodeChange?: (newCode: string) => void;
}
