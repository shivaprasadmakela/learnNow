import type { Course } from '../../../../types';

export interface PathsGridProps {
    paths: Course[];
    onSelectPath: (pathId: number) => void;
    isLoggedIn?: boolean;
}
