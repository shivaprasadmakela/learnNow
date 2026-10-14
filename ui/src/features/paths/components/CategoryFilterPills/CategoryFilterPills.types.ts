export interface CategoryFilterPillsProps {
    categories: string[];
    /** Paths per category, shown after each label. Left out while not every path is loaded. */
    counts?: Record<string, number>;
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
}
