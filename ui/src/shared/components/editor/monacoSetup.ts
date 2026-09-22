/**
 * Points @monaco-editor/react at the bundled monaco-editor instead of a CDN.
 *
 * Left unconfigured, the wrapper injects a <script> for
 * https://cdn.jsdelivr.net/npm/monaco-editor@<version>/min/vs/loader.js the first time an editor
 * mounts. Our Content-Security-Policy allows scripts from 'self' and the Google and Razorpay
 * origins only, so that request is blocked and every editor sits on "Loading..." forever. It went
 * unnoticed because local dev is served by Vite, which sends no CSP, so the CDN load succeeds
 * there and the editor works on a developer machine and nowhere else.
 *
 * monaco-editor is already a dependency and vite.config.ts already splits it into its own
 * vendor-monaco chunk, so the copy to serve was always in the build; only this wiring was
 * missing. Same reasoning as the self-hosted FontAwesome CSS in main.tsx -- bundle it, and the
 * policy stays restricted to 'self'.
 *
 * Workers need wiring too. Monaco resolves them through MonacoEnvironment, which otherwise
 * defaults to fetching worker scripts from that same blocked CDN path. Vite's ?worker imports
 * give bundled equivalents. Two cover us: the TypeScript worker backs JavaScript and TypeScript,
 * and the editor worker handles the rest -- the other languages offered (Python, Java, C, C++)
 * are syntax highlighting only and have no language service to run.
 *
 * Imported for its side effect by MonacoEditorPane, so it runs before the first editor mounts and
 * so the Monaco chunk is reached only through the lazily-loaded routes that mount one. Importing
 * it from main.tsx instead works, but makes that 4 MB chunk a static dependency of the entry and
 * preloads it on every page, including ones with no editor on them.
 */
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
// These go through the package's exports map, which maps "./*" to "./esm/vs/*.js" -- so the
// esm/vs prefix is supplied by the map and must not be written here, or it is applied twice and
// the import fails to resolve at build time.
import editorWorker from 'monaco-editor/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
    getWorker(_workerId: string, label: string) {
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker();
        }
        return new editorWorker();
    }
};

loader.config({ monaco });
