export interface ConfirmDeleteModalProps {
    isOpen: boolean;
    /** The name of the thing being deleted, quoted back to the reader. */
    title: string;
    /**
     * What kind of thing it is: "course", "problem", "section". Used in the heading and the
     * button, so the dialog stops claiming every delete is a course — it was doing that for DSA
     * problems, which is the worst possible moment to be reading the wrong noun.
     */
    entityLabel?: string;
    /** Replaces the default consequence sentence. Say what else goes with it. */
    description?: string;
    isDeleting?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}
