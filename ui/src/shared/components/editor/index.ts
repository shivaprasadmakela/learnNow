/**
 * Editor primitives, shared by every surface that embeds Monaco.
 *
 * These lived under `features/compiler` while the standalone console was their only consumer.
 * They are not compiler-specific: the study console's playground panel, the runnable code blocks
 * inside lesson content, the inline playground, and the DSA problem workspace all mount the same
 * three pieces. Re-export shims remain at the old paths so the console's own files did not have to
 * be touched to make this move.
 *
 * Note what is NOT a shared primitive: `useCodeExecution` is a *sandbox* strategy. It evaluates
 * JavaScript in the browser and renders HTML to a preview, which is right for a playground and
 * wrong for anything that needs a server-side verdict. The DSA workspace deliberately does not use
 * it.
 */
export { MonacoEditorPane } from './MonacoEditorPane/MonacoEditorPane';
export { CompilerOutputPane } from './CompilerOutputPane/CompilerOutputPane';
export { useCodeExecution } from './useCodeExecution';
export type { ConsoleLogEntry } from './useCodeExecution';
export { SUPPORTED_LANGUAGES } from './codeTemplates';
export type { LanguageOption } from './codeTemplates';
