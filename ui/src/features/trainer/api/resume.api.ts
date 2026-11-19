import { apiFetchJson } from '../../../shared/api/client';
import { fetchJsonOrNull, jsonBody, sendExpectingNoContent } from './http';

/**
 * The learner's resume. The file itself is never stored: the server keeps the text it read, the
 * profile and the review. `profile`, `review` and `jobMatch` come from learnNow-ai as they are, so
 * their fields keep snake_case.
 */

export type ResumeLevel = 'student' | 'fresher' | 'junior' | 'mid' | 'senior';

export interface ResumeProfile {
    headline: string;
    field: string;
    target_roles: string[];
    level: ResumeLevel;
    years_experience: number | null;
    skills: string[];
    experience: { title: string; company: string; period: string; highlights: string[] }[];
    projects: { name: string; summary: string; tech: string[] }[];
    education: { degree: string; institution: string; year: string | number | null }[];
    certifications: string[];
}

export type IssueSeverity = 'high' | 'medium' | 'low';

export interface ResumeReview {
    overall: number;
    scores: { ats: number; impact: number; clarity: number; skills: number };
    summary: string;
    strengths: string[];
    issues: { severity: IssueSeverity; title: string; detail: string }[];
    rewrites: { original: string; improved: string; why: string }[];
    missing_sections: string[];
}

export interface JobMatch {
    match: number;
    verdict: string;
    matched_keywords: string[];
    missing_keywords: string[];
    strengths: string[];
    gaps: string[];
    suggestions: string[];
}

export interface Resume {
    fileName: string;
    targetRole: string | null;
    analysedAt: string;
    profile: ResumeProfile;
    review: ResumeReview;
    jobDescription: string | null;
    jobMatch: JobMatch | null;
    analysesLeftThisMonth: number;
}

export interface ResumeProfileCorrection {
    headline: string;
    level: ResumeLevel;
    yearsExperience: number | null;
    targetRole: string | null;
    skills: string[];
}

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

/** Checked before uploading, so a wrong file fails at once rather than after the upload. */
export const checkResumeFile = (file: File): string | null => {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) return 'Upload your resume as a PDF or a Word (.docx) file.';
    if (file.size > RESUME_MAX_BYTES) return 'This file is larger than 5 MB. Save a smaller copy and try again.';
    if (file.size === 0) return 'This file is empty.';
    return null;
};

/** The saved resume, or null when there is none. */
export const fetchResume = () => fetchJsonOrNull<Resume>('/api/trainer/resume');

/** Uploads and analyses a resume, replacing any earlier one. Takes 10-20 seconds. */
export const uploadResume = (file: File, targetRole: string | null, adultConfirmed: boolean) => {
    const form = new FormData();
    form.append('file', file, file.name);
    if (targetRole) form.append('targetRole', targetRole);
    form.append('adultConfirmed', String(adultConfirmed));
    return apiFetchJson<Resume>('/api/trainer/resume', { method: 'POST', body: form });
};

export const updateResumeProfile = (correction: ResumeProfileCorrection) =>
    apiFetchJson<Resume>('/api/trainer/resume/profile', jsonBody('PUT', correction));

export const matchJobDescription = (jobDescription: string) =>
    apiFetchJson<Resume>('/api/trainer/resume/match', jsonBody('POST', { jobDescription }));

/** Deletes the resume, its job description and the match. */
export const deleteResume = () =>
    sendExpectingNoContent('/api/trainer/resume', { method: 'DELETE' }, 'Could not delete your resume.');
