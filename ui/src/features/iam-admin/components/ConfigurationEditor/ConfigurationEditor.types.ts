export interface ConfigurationEditorProps {
    pathId?: string | null;
    onSaveSuccess: () => void;
    onCancel: () => void;
}
