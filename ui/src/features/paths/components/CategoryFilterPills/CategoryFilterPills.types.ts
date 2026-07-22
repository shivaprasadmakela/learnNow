export interface CategoryFilterPillsProps {
    categories: string[];
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
}
