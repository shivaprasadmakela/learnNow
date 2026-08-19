export const EXECUTABLE_LANGUAGES = new Set([
    'java', 'javascript', 'js', 'typescript', 'ts', 'python', 'py',
    'cpp', 'c++', 'c', 'csharp', 'c#', 'cs', 'sql', 'go', 'rust', 'ruby', 'php'
]);

export function isExecutableLanguage(lang: string): boolean {
    if (!lang) return false;
    const clean = lang.trim().toLowerCase().replace(/^language-/, '');
    return EXECUTABLE_LANGUAGES.has(clean);
}

export function prepareJavaSourceCode(code: string): string {
    if (!code || !code.trim()) return code;
    const trimmed = code.trim();

    const hasClassOrInterface = /\b(class|interface|enum|record)\b/.test(trimmed);
    const hasMain = /\b(void\s+main|static\s+void\s+main)\b/.test(trimmed);

    if (!hasClassOrInterface && !hasMain) {
        const indented = trimmed
            .split('\n')
            .map(line => '        ' + line)
            .join('\n');
        return `public class Main {\n    public static void main(String[] args) {\n${indented}\n    }\n}`;
    }

    if (trimmed.includes('public class ') && !trimmed.includes('public class Main')) {
        return trimmed.replace(/public\s+class\s+([A-Za-z0-9_]+)/g, 'public class Main');
    }

    return trimmed;
}

export function formatExecutableCode(code: string, lang: string): string {
    if (!code) return code;
    const cleanLang = (lang || '').trim().toLowerCase().replace(/^language-/, '');
    if (cleanLang === 'java') {
        return prepareJavaSourceCode(code);
    }
    return code.trim();
}
