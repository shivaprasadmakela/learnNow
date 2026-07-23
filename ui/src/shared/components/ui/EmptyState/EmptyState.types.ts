import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
    icon?: LucideIcon | React.ReactNode;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}
