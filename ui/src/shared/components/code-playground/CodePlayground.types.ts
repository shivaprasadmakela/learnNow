export type SupportedLanguage = 'javascript' | 'typescript' | 'html' | 'css' | 'python' | 'java' | 'json';

export interface CodePlaygroundProps {
    initialCode: string;
    language?: SupportedLanguage | string;
    title?: string;
    readOnly?: boolean;
    onCodeChange?: (code: string) => void;
}

export interface ConsoleLogEntry {
    type: 'log' | 'error' | 'warn' | 'info';
    message: string;
    timestamp: string;
}
