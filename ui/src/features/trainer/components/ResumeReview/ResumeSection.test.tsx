import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ResumeSection } from './ResumeSection';
import * as resumeApi from '../../api/resume.api';
import type { Resume } from '../../api/resume.api';

const resume: Resume = {
    fileName: 'asha-cv.pdf',
    targetRole: 'Java backend developer',
    analysedAt: '2026-11-10T09:00:00Z',
    profile: {
        headline: 'Backend developer, 2 years with Spring Boot',
        field: 'Software',
        target_roles: ['Java backend developer'],
        level: 'junior',
        years_experience: 2,
        skills: ['Java', 'Spring Boot', 'PostgreSQL'],
        experience: [{ title: 'Software engineer', company: 'Acme', period: '2024 - now', highlights: [] }],
        projects: [{ name: 'Order service', summary: '', tech: ['Java'] }],
        education: [],
        certifications: []
    },
    review: {
        overall: 62,
        scores: { ats: 7, impact: 4, clarity: 6, skills: 8 },
        summary: 'A clear resume that lists duties more than results.',
        strengths: ['Relevant stack for the role'],
        issues: [
            { severity: 'low', title: 'Long summary', detail: 'Keep it to two lines.' },
            { severity: 'high', title: 'No results', detail: 'Bullets describe duties, not outcomes.' },
            { severity: 'medium', title: 'Dates are inconsistent', detail: 'Use one format.' }
        ],
        rewrites: [
            {
                original: 'Worked on APIs',
                improved: 'Built 12 REST APIs that cut response time by [X%]',
                why: 'Shows what changed because of your work.'
            }
        ],
        missing_sections: ['Projects', 'Certifications']
    },
    jobDescription: null,
    jobMatch: null,
    analysesLeftThisMonth: 2
};

describe('ResumeSection', () => {
    beforeEach(() => vi.restoreAllMocks());

    it('renders the review: scores, issues by severity, rewrites and missing sections', () => {
        render(<ResumeSection resume={resume} onChange={vi.fn()} analysesLeft={2} />);

        expect(screen.getByText('62')).toBeInTheDocument();
        expect(screen.getByRole('progressbar', { name: 'Impact' })).toHaveAttribute('aria-valuenow', '4');
        expect(screen.getByRole('progressbar', { name: 'Easy for hiring software' })).toHaveAttribute('aria-valuenow', '7');
        expect(screen.getByText('A clear resume that lists duties more than results.')).toBeInTheDocument();
        expect(screen.getByText('Relevant stack for the role')).toBeInTheDocument();

        // Most serious first, whatever order the review lists them in.
        const groups = ['Fix first', 'Worth fixing', 'Small things'].map(label => screen.getByText(label));
        expect(groups[0].compareDocumentPosition(groups[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(groups[1].compareDocumentPosition(groups[2]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(screen.getByText('No results')).toBeInTheDocument();

        expect(screen.getByText('Worked on APIs')).toBeInTheDocument();
        expect(screen.getByText('Built 12 REST APIs that cut response time by [X%]')).toBeInTheDocument();
        expect(screen.getByText(/Brackets like \[X%\] are for you to fill in/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Copy the improved line' })).toBeInTheDocument();

        expect(screen.getByText('Certifications')).toBeInTheDocument();
        expect(screen.getByText('Backend developer, 2 years with Spring Boot')).toBeInTheDocument();
        expect(screen.getByText('Spring Boot')).toBeInTheDocument();
    });

    it('copies the improved line', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        render(<ResumeSection resume={resume} onChange={vi.fn()} analysesLeft={2} />);

        fireEvent.click(screen.getByRole('button', { name: 'Copy the improved line' }));
        await waitFor(() => expect(writeText).toHaveBeenCalledWith('Built 12 REST APIs that cut response time by [X%]'));
        expect(await screen.findByText('Copied')).toBeInTheDocument();
    });

    it('shows the job match once a description is checked', async () => {
        const onChange = vi.fn();
        vi.spyOn(resumeApi, 'matchJobDescription').mockResolvedValue({
            ...resume,
            jobDescription: 'x'.repeat(100),
            jobMatch: {
                match: 71,
                verdict: 'A good fit with two gaps',
                matched_keywords: ['Java'],
                missing_keywords: ['Kafka'],
                strengths: ['Spring Boot experience'],
                gaps: ['No messaging experience'],
                suggestions: ['Add the Kafka project you built']
            }
        });
        const { rerender } = render(<ResumeSection resume={resume} onChange={onChange} analysesLeft={2} />);

        const button = screen.getByRole('button', { name: 'Check how I match' });
        expect(button).toBeDisabled();
        fireEvent.change(screen.getByLabelText('Paste the job description'), { target: { value: 'x'.repeat(100) } });
        fireEvent.click(button);
        await waitFor(() => expect(onChange).toHaveBeenCalled());

        rerender(<ResumeSection resume={onChange.mock.calls[0][0]} onChange={onChange} analysesLeft={2} />);
        const match = screen.getByTestId('job-match');
        expect(within(match).getByText('71%')).toBeInTheDocument();
        expect(within(match).getByText('Kafka')).toBeInTheDocument();
        expect(within(match).getByText('No messaging experience')).toBeInTheDocument();
        expect(within(match).getByText('Add the Kafka project you built')).toBeInTheDocument();
    });

    it('asks for the 18+ confirmation on the first upload and says the file is not kept', () => {
        render(<ResumeSection resume={null} onChange={vi.fn()} analysesLeft={3} />);

        expect(screen.getByText(/do not keep it/)).toBeInTheDocument();
        const submit = screen.getByRole('button', { name: 'Review my resume' });
        const file = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });
        fireEvent.change(screen.getByLabelText(/Your resume/), { target: { files: [file] } });
        expect(submit).toBeDisabled();
        fireEvent.click(screen.getByLabelText('I am 18 or older.'));
        expect(submit).toBeEnabled();
    });

    it('rejects a file that is not a PDF or .docx before uploading', () => {
        const upload = vi.spyOn(resumeApi, 'uploadResume');
        render(<ResumeSection resume={null} onChange={vi.fn()} analysesLeft={3} />);
        fireEvent.change(screen.getByLabelText(/Your resume/), { target: { files: [new File(['x'], 'cv.png')] } });
        expect(screen.getByRole('alert')).toHaveTextContent('Upload your resume as a PDF or a Word (.docx) file.');
        expect(upload).not.toHaveBeenCalled();
    });

    it('deletes the resume after a second click', async () => {
        const onChange = vi.fn();
        const remove = vi.spyOn(resumeApi, 'deleteResume').mockResolvedValue();
        render(<ResumeSection resume={resume} onChange={onChange} analysesLeft={2} />);

        fireEvent.click(screen.getByRole('button', { name: /Delete resume/ }));
        expect(remove).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Yes, delete it' }));
        await waitFor(() => expect(onChange).toHaveBeenCalledWith(null));
    });
});
