import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../../../shared/api/client';
import { fetchWeeklyPlan, generateWeeklyPlan } from './plan.api';
import { checkResumeFile, deleteResume, fetchResume, matchJobDescription, updateResumeProfile, uploadResume } from './resume.api';
import { fetchMockAvailability, rateInterview, retryInterviewQuestion, startMockInterview } from './interview.api';
import { fetchTrainerHome } from './home.api';
import { fetchAiAdmin, setAiFeatureEnabled } from './aiAdmin.api';

vi.mock('../../../shared/api/client', async importOriginal => {
    const actual = await importOriginal<typeof import('../../../shared/api/client')>();
    // apiFetchJson goes through apiFetch, so mocking apiFetch alone covers both.
    const apiFetch = vi.fn();
    const apiFetchJson = async (url: string, options?: RequestInit) => {
        const res: Response = await apiFetch(url, options);
        if (!res.ok) {
            const body = await res.json().catch(() => null);
            throw new actual.ApiError(body?.message ?? 'failed', res.status, body?.code ?? null);
        }
        return res.json();
    };
    return { ...actual, apiFetch, apiFetchJson };
});

const fetchMock = vi.mocked(apiFetch);

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const lastCall = () => fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
const lastBody = () => JSON.parse(String(lastCall()[1]?.body));

describe('trainer API modules', () => {
    beforeEach(() => fetchMock.mockReset());

    it('reads the trainer home', async () => {
        fetchMock.mockImplementation(async () => json({ available: true }));
        await fetchTrainerHome();
        expect(lastCall()[0]).toBe('/api/trainer/home');
    });

    it('treats 204 as "no plan this week"', async () => {
        fetchMock.mockImplementation(async () => new Response(null, { status: 204 }));
        expect(await fetchWeeklyPlan()).toBeNull();
        expect(lastCall()[0]).toBe('/api/trainer/plan');
    });

    it('posts to generate a plan and surfaces the refresh limit', async () => {
        fetchMock.mockImplementation(async () => json({ code: 'trainer_plan_refresh_limit', message: 'You can refresh your plan 3 times a week.' }, 422));
        await expect(generateWeeklyPlan()).rejects.toMatchObject({ status: 422, code: 'trainer_plan_refresh_limit' });
        expect(lastCall()[1]?.method).toBe('POST');
    });

    it('returns null when there is no resume', async () => {
        fetchMock.mockImplementation(async () => new Response(null, { status: 204 }));
        expect(await fetchResume()).toBeNull();
    });

    it('uploads the resume as multipart with the adult confirmation', async () => {
        fetchMock.mockImplementation(async () => json({ fileName: 'cv.pdf' }));
        const file = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });
        await uploadResume(file, 'Data analyst', true);
        const [url, init] = lastCall();
        expect(url).toBe('/api/trainer/resume');
        expect(init?.method).toBe('POST');
        const form = init?.body as FormData;
        expect(form.get('file')).toBeInstanceOf(File);
        expect(form.get('targetRole')).toBe('Data analyst');
        expect(form.get('adultConfirmed')).toBe('true');
    });

    it('passes learnNow-ai\'s rejection message through as is', async () => {
        fetchMock.mockImplementation(async () => json({ code: 'resume_rejected', message: 'No text could be read from this file.' }, 422));
        await expect(uploadResume(new File(['x'], 'cv.pdf'), null, true)).rejects.toThrow('No text could be read from this file.');
    });

    it('sends profile corrections, job descriptions and deletes', async () => {
        fetchMock.mockImplementation(async () => json({}));
        await updateResumeProfile({ headline: 'H', level: 'junior', yearsExperience: 1, targetRole: 'QA', skills: ['Java'] });
        expect(lastCall()[0]).toBe('/api/trainer/resume/profile');
        expect(lastCall()[1]?.method).toBe('PUT');
        expect(lastBody()).toEqual({ headline: 'H', level: 'junior', yearsExperience: 1, targetRole: 'QA', skills: ['Java'] });

        await matchJobDescription('A job');
        expect(lastCall()[0]).toBe('/api/trainer/resume/match');
        expect(lastBody()).toEqual({ jobDescription: 'A job' });

        fetchMock.mockImplementation(async () => new Response(null, { status: 204 }));
        await deleteResume();
        expect(lastCall()[0]).toBe('/api/trainer/resume');
        expect(lastCall()[1]?.method).toBe('DELETE');
    });

    it('checks the file type and size before uploading', () => {
        expect(checkResumeFile(new File(['x'], 'cv.PDF'))).toBeNull();
        expect(checkResumeFile(new File(['x'], 'cv.docx'))).toBeNull();
        expect(checkResumeFile(new File(['x'], 'cv.png'))).toMatch(/PDF or a Word/);
        const big = new File(['x'], 'cv.pdf');
        Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 });
        expect(checkResumeFile(big)).toMatch(/5 MB/);
    });

    it('starts mock interviews and retries with the contract\'s bodies', async () => {
        fetchMock.mockImplementation(async () => json({ interviewId: 'i', url: 'wss://x', token: 't', maxSeconds: 600, kind: 'HR' }));
        await fetchMockAvailability();
        expect(lastCall()[0]).toBe('/api/trainer/interviews/mock/availability');

        await startMockInterview('HR', 'Data analyst', true);
        expect(lastCall()[0]).toBe('/api/trainer/interviews/mock');
        expect(lastBody()).toEqual({ kind: 'HR', role: 'Data analyst', useJobDescription: true });

        await startMockInterview('BEHAVIOURAL', null, false);
        expect(lastBody()).toEqual({ kind: 'BEHAVIOURAL', role: null, useJobDescription: false });

        await retryInterviewQuestion('int-1', 'pq-2');
        expect(lastCall()[0]).toBe('/api/trainer/interviews/int-1/retry');
        expect(lastBody()).toEqual({ questionId: 'pq-2' });
    });

    it('rates an interview, with the comment only when there is one', async () => {
        fetchMock.mockImplementation(async () => new Response(null, { status: 204 }));
        await rateInterview('int-1', 1);
        expect(lastCall()[0]).toBe('/api/trainer/interviews/int-1/rating');
        expect(lastCall()[1]?.method).toBe('PUT');
        expect(lastBody()).toEqual({ rating: 1 });
        await rateInterview('int-1', -1, 'Too harsh');
        expect(lastBody()).toEqual({ rating: -1, comment: 'Too harsh' });
    });

    it('reads the admin overview and flips a feature switch', async () => {
        fetchMock.mockImplementation(async () => json({ flags: [] }));
        await fetchAiAdmin();
        expect(lastCall()[0]).toBe('/api/admin/ai');

        fetchMock.mockImplementation(async () => new Response(null, { status: 204 }));
        await setAiFeatureEnabled('MOCK_INTERVIEW', false);
        expect(lastCall()[0]).toBe('/api/admin/ai/flags/MOCK_INTERVIEW');
        expect(lastBody()).toEqual({ enabled: false });
    });

    it('turns a failed 204 route into an error carrying the server\'s message', async () => {
        fetchMock.mockImplementation(async () => json({ code: 'ai_feature_off', message: 'This feature is switched off.' }, 503));
        await expect(setAiFeatureEnabled('ASK_AI', true)).rejects.toMatchObject({ status: 503, code: 'ai_feature_off', message: 'This feature is switched off.' });
    });
});
