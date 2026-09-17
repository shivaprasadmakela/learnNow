import React from 'react';

/** What every field in the family shares: a label above, an error below. */
interface FieldChrome {
    label?: string;
    error?: string;
    /** Sits under the label, before the control. For units, formats, consequences. */
    hint?: React.ReactNode;
}

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement>,
        FieldChrome {}

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
        FieldChrome {
    /** Monospace and no wrapping, for code and test-case input. */
    mono?: boolean;
}

export interface SelectProps
    extends React.SelectHTMLAttributes<HTMLSelectElement>,
        FieldChrome {
    options: Array<{ value: string; label: string }>;
}
