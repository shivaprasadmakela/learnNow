import type { ImportResultDto } from '../../api/admin.api';

export interface CourseImporterProps {
    onImportSuccess?: (result: ImportResultDto) => void;
    onCancel?: () => void;
}
