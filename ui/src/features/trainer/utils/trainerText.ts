import { BookOpen, Dumbbell, FileText, ListChecks, Mic, RotateCcw } from 'lucide-react';
import type React from 'react';
import type { TaskKind } from '../api/home.api';

const TASK_ICONS: Record<TaskKind, React.ElementType> = {
    lesson: BookOpen,
    quiz: ListChecks,
    interview: Mic,
    revise: RotateCcw,
    resume: FileText,
    practice: Dumbbell
};

export const taskIcon = (kind: TaskKind): React.ElementType => TASK_ICONS[kind] ?? BookOpen;

/** The ready prompt for a weak topic's "Ask AI". */
export const weakTopicPrompt = (topicTitle: string) =>
    `I find "${topicTitle}" hard. Explain it again simply, with an example, then ask me two short questions to check I understood.`;

/** "2026-11-09" as "9 Nov", read as a calendar date rather than a UTC instant. */
export const shortDate = (isoDay: string) => {
    const date = new Date(`${isoDay.slice(0, 10)}T00:00:00`);
    return Number.isNaN(date.getTime()) ? isoDay : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};
