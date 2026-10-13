package com.learnnow.paths.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.learnnow.common.exception.ValidationException;
import org.junit.jupiter.api.Test;

/**
 * Category is the catalog's only filter. When it was free text, every path got a category of its
 * own and the filter could not narrow anything, so writes are now held to a fixed list.
 */
class PathCategoryTest {

    @Test
    void storesTheCanonicalSpellingWhateverCaseArrives() {
        assertThat(PathCategory.canonical("backend", PathCategory.BACKEND)).isEqualTo("Backend");
        assertThat(PathCategory.canonical("  DATA ", PathCategory.BACKEND)).isEqualTo("Data");
        assertThat(PathCategory.canonical("Frontend", PathCategory.BACKEND)).isEqualTo("Frontend");
    }

    @Test
    void fallsBackWhenNoCategoryWasGiven() {
        assertThat(PathCategory.canonical(null, PathCategory.BACKEND)).isEqualTo("Backend");
        assertThat(PathCategory.canonical("   ", PathCategory.DATA)).isEqualTo("Data");
    }

    @Test
    void rejectsTheLabelsThatUsedToBeWrittenFreely() {
        // Each of these was in a real database before the list existed. Accepting them again is
        // how the filter goes back to one chip per path.
        for (String legacy : new String[] {"Java", "Databases", "Engineering", "General"}) {
            assertThatThrownBy(() -> PathCategory.canonical(legacy, PathCategory.BACKEND))
                    .isInstanceOf(ValidationException.class)
                    .hasMessage("path_category_invalid");
        }
    }
}
