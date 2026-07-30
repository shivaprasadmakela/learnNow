import type { ImportConflictItemDto } from '../../../../api/admin.api';

export type ConflictStrategyOption = 'OVERWRITE' | 'SKIP_EXISTING' | 'KEEP_BOTH';

export interface ConflictResolutionModalProps {
    conflicts: ImportConflictItemDto[];
    onConfirm: (strategy: ConflictStrategyOption) => void;
    onCancel: () => void;
    isLoading?: boolean;
}
