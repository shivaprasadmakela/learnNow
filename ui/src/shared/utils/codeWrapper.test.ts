import { describe, expect, it } from 'vitest';
import { playgroundLanguage } from './codeWrapper';

/**
 * Lesson text holds hundreds of illustrations that are not programs - 188 of 190 Java blocks in the
 * paths have no main method. Each one used to offer "Try in Playground" and then fail to compile.
 */
describe('playgroundLanguage', () => {
    it('runs a Java block only when it is a whole program', () => {
        expect(playgroundLanguage('public class A {\n  public static void main(String[] a) {}\n}', 'java')).toBe('java');
        expect(playgroundLanguage('long discount(Order o) { ... }', 'java')).toBeNull();
        expect(playgroundLanguage('Duration.ofSeconds(30)', 'java')).toBeNull();
    });

    it('never runs SQL, which has no database behind the playground', () => {
        expect(playgroundLanguage('SELECT 1;', 'sql')).toBeNull();
    });

    it('runs JavaScript that prints, but not modules, JSX or code with gaps', () => {
        expect(playgroundLanguage('const x = [1, 2].map(n => n * 2);\nconsole.log(x);', 'js')).toBe('javascript');
        expect(playgroundLanguage("import { useState } from 'react';\nconsole.log(1);", 'js')).toBeNull();
        expect(playgroundLanguage('const el = <Button />;\nconsole.log(el);', 'jsx')).toBeNull();
        expect(playgroundLanguage('function f() { ... }\nconsole.log(f());', 'javascript')).toBeNull();
        expect(playgroundLanguage('const total = items.reduce((a, b) => a + b);', 'javascript')).toBeNull();
    });

    it('treats unknown and empty input as not runnable', () => {
        expect(playgroundLanguage('echo hi', 'bash')).toBeNull();
        expect(playgroundLanguage('', 'java')).toBeNull();
    });
});
