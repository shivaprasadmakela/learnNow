export interface PublishBarProps {
    status: 'DRAFT' | 'PUBLISHED';
    version: number;
    onPreviewToggle: () => void;
    isPreviewActive: boolean;
    onPublish: () => void;
    isPublishing?: boolean;
}
