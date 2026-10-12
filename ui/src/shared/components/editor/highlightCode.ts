/**
 * Static syntax highlighting with Monaco's grammars, for code that is read rather than edited.
 *
 * Mounting a read-only Monaco editor for a twenty-line snippet is heavy and fights the page's own
 * scrolling. `monaco.editor.colorize` is lighter but emits Monaco's theme classes (`mtk7`...),
 * whose colours exist only once some editor on the page has applied a theme - so the same snippet
 * rendered with different colours depending on whether the workspace editor had mounted yet.
 *
 * Instead this asks Monaco for the token *types* (`keyword.java`, `string.python`...) and leaves
 * colour to our CSS, which already follows the light and dark themes. Imported dynamically by
 * `CodeViewer`, so the Monaco chunk is only fetched where code is actually shown.
 */
import * as monaco from 'monaco-editor';
import './monacoSetup';

export type TokenKind =
    | 'keyword'
    | 'string'
    | 'number'
    | 'comment'
    | 'type'
    | 'annotation'
    | 'punctuation'
    | 'plain';

export interface HighlightToken {
    text: string;
    kind: TokenKind;
}

const kindOf = (type: string): TokenKind => {
    const head = type.split('.')[0];
    switch (head) {
        case 'keyword':
            return 'keyword';
        case 'string':
        case 'regexp':
            return 'string';
        case 'number':
            return 'number';
        case 'comment':
            return 'comment';
        case 'type':
            return 'type';
        case 'annotation':
        case 'metatag':
            return 'annotation';
        case 'delimiter':
        case 'operator':
        case 'operators':
            return 'punctuation';
        default:
            return 'plain';
    }
};

/**
 * Splits `code` into lines of typed tokens.
 *
 * Monaco registers its basic languages lazily, and `tokenize` on a language whose grammar has not
 * loaded yet quietly returns one plain token per line. `colorize` is the public call that waits for
 * the grammar, so it is awaited once (on an empty string) before tokenising for real.
 */
export async function tokenizeLines(code: string, language: string): Promise<HighlightToken[][]> {
    await monaco.editor.colorize('', language, {});
    const lines = code.split('\n');
    const tokenLines = monaco.editor.tokenize(code, language);

    return lines.map((line, index) => {
        const tokens = tokenLines[index] ?? [];
        if (tokens.length === 0) return [{ text: line, kind: 'plain' as const }];
        return tokens
            .map((token, i) => ({
                text: line.slice(token.offset, tokens[i + 1]?.offset ?? line.length),
                kind: kindOf(token.type)
            }))
            .filter(token => token.text.length > 0);
    });
}
