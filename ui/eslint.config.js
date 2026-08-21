import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'src/assets/build-favicon-transparent.js']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Debug logging should not ship; console.error/warn are legitimate.
      'no-console': ['error', { allow: ['error', 'warn'] }],

      // ---------------------------------------------------------------------
      // Pre-existing debt, demoted to warnings so lint can be a CI gate today.
      //
      // Linting was never wired into a pipeline, so these accumulated: 34 `any`
      // annotations and 20-odd hook violations across the tree. They are real
      // and worth fixing, but each needs the actual intended type or a careful
      // look at effect semantics - not a blanket codemod.
      //
      // These are deliberately visible rather than switched off. Ratchet each
      // back to 'error' as its last violation is cleared; new code should not
      // add to the counts.
      // ---------------------------------------------------------------------
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    // Test files legitimately use `any` for fixtures and stubs.
    files: ['**/*.{test,spec}.{ts,tsx}', 'src/test/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
])
