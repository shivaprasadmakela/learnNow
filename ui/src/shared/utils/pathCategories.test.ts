import { describe, expect, it } from 'vitest';
import { categoriesForFilter, isPathCategory } from './pathCategories';

/**
 * The catalog filter used to list categories in whatever order the paths happened to arrive, one
 * per path. These pin the replacement: a fixed order, no empty chips, and no path left unreachable
 * because its category predates the list.
 */
describe('categoriesForFilter', () => {
    it('lists known categories in the fixed order, not arrival order', () => {
        expect(categoriesForFilter(['Data', 'Backend', 'Frontend', 'Backend'])).toEqual([
            'Backend',
            'Frontend',
            'Data',
        ]);
    });

    it('leaves out a category no loaded path uses', () => {
        expect(categoriesForFilter(['Backend', 'Backend'])).toEqual(['Backend']);
    });

    it('keeps an older category after the known ones, so its path can still be filtered to', () => {
        expect(categoriesForFilter(['Java', 'Backend', undefined, 'Engineering'])).toEqual([
            'Backend',
            'Engineering',
            'Java',
        ]);
    });
});

describe('isPathCategory', () => {
    it('accepts only the exact stored spelling', () => {
        expect(isPathCategory('Backend')).toBe(true);
        expect(isPathCategory('backend')).toBe(false);
        expect(isPathCategory('Databases')).toBe(false);
    });
});
