import { describe, expect, it } from 'vitest';
import { formatStudyTime } from './studyTime';

describe('formatStudyTime', () => {
    it('leaves unknown and empty estimates out', () => {
        expect(formatStudyTime(undefined)).toBeUndefined();
        expect(formatStudyTime(0)).toBeUndefined();
    });

    it('shows minutes under an hour', () => {
        expect(formatStudyTime(45)).toBe('45 min');
    });

    it('rounds to the nearest hour from there', () => {
        expect(formatStudyTime(60)).toBe('1 hour');
        expect(formatStudyTime(407)).toBe('7 hours');
        expect(formatStudyTime(964)).toBe('16 hours');
    });
});
