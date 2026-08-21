import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false
            }
        }
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.{test,spec}.{ts,tsx}']
    },
    build: {
        // Fail the build if a chunk grows unexpectedly, rather than shipping it quietly.
        chunkSizeWarningLimit: 900,
        rollupOptions: {
            output: {
                /**
                 * monaco-editor and mermaid are two of the heaviest packages in the
                 * ecosystem and both landed in the main graph, so first paint carried
                 * the whole application. Isolating them lets the browser cache them
                 * independently of application code, which changes far more often.
                 */
                manualChunks: (id: string) => {
                    if (!id.includes('node_modules')) return undefined;
                    if (id.includes('monaco')) return 'vendor-monaco';
                    if (id.includes('mermaid')) return 'vendor-mermaid';
                    if (id.includes('dicebear')) return 'vendor-avatar';
                    if (id.includes('react-markdown') || id.includes('remark')) {
                        return 'vendor-markdown';
                    }
                    if (id.includes('react-dom') || id.includes('/react/')) {
                        return 'vendor-react';
                    }
                    return undefined;
                }
            }
        }
    }
});
