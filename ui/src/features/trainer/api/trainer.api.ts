import { apiFetch, apiFetchJson, ApiError } from '../../../shared/api/client';

/**
 * The AI personal trainer. Replies stream from `/api/trainer/chat` as server-sent events; the
 * conversation itself lives only in the browser - what is worth keeping becomes a trainer note.
 */

export interface TrainerGoal {
    targetRole?: string | null;
    targetDate?: string | null;
    hoursPerWeek?: number | null;
}

export interface TrainerNote {
    id: string;
    kind: 'goal' | 'gap' | 'strength' | 'preference';
    text: string;
    source: string;
    createdAt: string;
}

export interface TrainerProfile {
    /** False when the AI service is not configured; Ask AI is then hidden. */
    available: boolean;
    /** False when the learner has withdrawn the personalisation consent. */
    personalised: boolean;
    voiceAvailable?: boolean;
    interviewsLeftThisMonth?: number;
    goal: TrainerGoal | null;
    notes: TrainerNote[];
}

export interface ChatTurn {
    role: 'user' | 'assistant';
    content: string;
}

export interface TrainerPage {
    kind: 'subtopic' | 'topic' | 'dashboard' | 'paths' | 'track';
    id?: string | null;
}

export const fetchTrainer = () => apiFetchJson<TrainerProfile>('/api/trainer');

export const saveGoal = (goal: TrainerGoal) =>
    apiFetchJson<TrainerGoal>('/api/trainer/goal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal)
    });

export const deleteNote = async (id: string) => {
    const res = await apiFetch(`/api/trainer/notes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new ApiError('Could not delete the note', res.status, null);
};

/** Text from a short WAV recording (up to 30 seconds). */
export const transcribe = async (wav: Blob): Promise<string> => {
    const form = new FormData();
    form.append('file', wav, 'clip.wav');
    const { text } = await apiFetchJson<{ text: string }>('/api/trainer/transcribe', { method: 'POST', body: form });
    return text;
};

/**
 * Sends the conversation and calls `onText` with each piece of the reply as it arrives. Resolves
 * once the reply is complete; rejects with the server's own message if the trainer could not answer.
 */
export const streamChat = async (
    body: { messages: ChatTurn[]; page: TrainerPage | null; quizInProgress: boolean },
    onText: (text: string) => void,
    signal?: AbortSignal
): Promise<void> => {
    const res = await apiFetch('/api/trainer/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify(body),
        signal
    });
    if (!res.ok || !res.body) {
        let message = 'The AI trainer could not answer right now.';
        try {
            const err = await res.json();
            if (err?.message) message = err.message;
        } catch {
            /* keep the default */
        }
        throw new ApiError(message, res.status, null);
    }
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = '';
    for (;;) {
        const { value, done } = await reader.read();
        if (done) return;
        buffer += value;
        let end;
        while ((end = buffer.indexOf('\n\n')) >= 0) {
            const frame = buffer.slice(0, end);
            buffer = buffer.slice(end + 2);
            const data = frame
                .split('\n')
                .filter(l => l.startsWith('data:'))
                .map(l => l.slice(5).trimStart())
                .join('\n');
            if (!data) continue;
            const event = JSON.parse(data);
            if (typeof event.text === 'string') onText(event.text);
            else if (event.error) throw new ApiError(event.message || 'The AI trainer could not answer.', 503, event.error);
            else if (event.done) return;
        }
    }
};
