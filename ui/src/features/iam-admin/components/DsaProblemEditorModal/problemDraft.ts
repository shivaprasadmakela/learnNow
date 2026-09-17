import type {
    AdminDsaProblem,
    DsaProblemUpdate
} from '../../../dsa/api/adminDsa.api';

/**
 * The modal's working copy of a problem.
 *
 * Kept separate from `AdminDsaProblem` because the wire shape and the form shape want different
 * things: the form holds tags as the comma-separated string the author is mid-way through typing,
 * and drops the server-assigned ids and order indexes that editing does not control. Order here is
 * array position, which is what the reordering buttons manipulate.
 */
export interface HintDraft {
    body: string;
}

export interface ApproachDraft {
    kind: 'BRUTE' | 'BETTER' | 'OPTIMAL';
    intuition: string;
    timeComplexity: string;
    spaceComplexity: string;
    language: string;
    code: string;
}

export interface TestCaseDraft {
    input: string;
    expectedOutput: string;
    sample: boolean;
    explanation: string;
}

export interface CheckDraft {
    prompt: string;
    /** One option per line, which is how a list of short strings is least painful to type. */
    optionsText: string;
    correctAnswer: string;
    explanation: string;
    points: number;
}

export interface HarnessDraft {
    language: string;
    starterCode: string;
    driverCode: string;
    referenceSolution: string;
}

export interface ProblemDraft {
    title: string;
    slug: string;
    statement: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    tagsText: string;
    estimatedMinutes: number;
    youtubeUrl: string;
    youtubePosition: string;
    practiceUrl: string;
    practicePlatform: string;
    status: 'DRAFT' | 'PUBLISHED';
    hints: HintDraft[];
    approaches: ApproachDraft[];
    testCases: TestCaseDraft[];
    checks: CheckDraft[];
    harnesses: HarnessDraft[];
}

export const toDraft = (problem: AdminDsaProblem): ProblemDraft => ({
    title: problem.title,
    slug: problem.slug,
    statement: problem.statement,
    difficulty: problem.difficulty,
    tagsText: (problem.tags ?? []).join(', '),
    estimatedMinutes: problem.estimatedMinutes,
    youtubeUrl: problem.youtubeUrl ?? '',
    youtubePosition: problem.youtubePosition == null ? '' : String(problem.youtubePosition),
    practiceUrl: problem.practiceUrl ?? '',
    practicePlatform: problem.practicePlatform ?? '',
    status: problem.status,
    hints: (problem.hints ?? []).map(hint => ({ body: hint.body })),
    approaches: (problem.approaches ?? []).map(approach => ({
        kind: approach.kind,
        intuition: approach.intuition,
        timeComplexity: approach.timeComplexity ?? '',
        spaceComplexity: approach.spaceComplexity ?? '',
        language: approach.language ?? '',
        code: approach.code ?? ''
    })),
    testCases: (problem.testCases ?? []).map(testCase => ({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput ?? '',
        sample: testCase.sample,
        explanation: testCase.explanation ?? ''
    })),
    checks: (problem.checks ?? []).map(check => ({
        prompt: check.prompt,
        optionsText: (check.options ?? []).join('\n'),
        correctAnswer: check.correctAnswer,
        explanation: check.explanation ?? '',
        points: check.points
    })),
    harnesses: (problem.harnesses ?? []).map(harness => ({
        language: harness.language,
        starterCode: harness.starterCode,
        driverCode: harness.driverCode,
        referenceSolution: harness.referenceSolution ?? ''
    }))
});

const splitTags = (text: string): string[] =>
    text
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);

const splitLines = (text: string): string[] =>
    text
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

export const toPayload = (draft: ProblemDraft): DsaProblemUpdate => ({
    title: draft.title.trim(),
    statement: draft.statement,
    difficulty: draft.difficulty,
    tags: splitTags(draft.tagsText),
    estimatedMinutes: draft.estimatedMinutes,
    youtubeUrl: draft.youtubeUrl.trim() || null,
    youtubePosition: draft.youtubePosition.trim() ? Number(draft.youtubePosition) : null,
    practiceUrl: draft.practiceUrl.trim() || null,
    practicePlatform: draft.practicePlatform.trim() || null,
    status: draft.status,
    hints: draft.hints.map(hint => hint.body).filter(body => body.trim()),
    approaches: draft.approaches.map(approach => ({
        kind: approach.kind,
        intuition: approach.intuition,
        timeComplexity: approach.timeComplexity.trim() || null,
        spaceComplexity: approach.spaceComplexity.trim() || null,
        language: approach.language.trim() || null,
        code: approach.code.trim() || null
    })),
    testCases: draft.testCases.map(testCase => ({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        sample: testCase.sample,
        explanation: testCase.explanation.trim() || null
    })),
    checks: draft.checks
        .filter(check => check.prompt.trim())
        .map(check => ({
            prompt: check.prompt,
            options: splitLines(check.optionsText),
            correctAnswer: check.correctAnswer,
            explanation: check.explanation.trim() || null,
            points: check.points
        })),
    harnesses: draft.harnesses.map(harness => ({
        language: harness.language.trim().toLowerCase(),
        starterCode: harness.starterCode,
        driverCode: harness.driverCode,
        referenceSolution: harness.referenceSolution.trim() || null
    }))
});

/** Every reason the server would reject this, found before the round trip. */
export const validate = (draft: ProblemDraft): string[] => {
    const problems: string[] = [];

    if (!draft.title.trim()) problems.push('The title cannot be empty.');

    draft.harnesses.forEach(harness => {
        if (!harness.language.trim()) {
            problems.push('A harness has no language.');
            return;
        }
        if (!harness.driverCode.includes('{{USER_CODE}}')) {
            problems.push(
                `The ${harness.language} driver has no {{USER_CODE}} placeholder, so the learner's` +
                    ' code would never be spliced in.'
            );
        }
        if (harness.language.trim().toLowerCase() === 'java' &&
            !harness.driverCode.includes('public class Main')) {
            problems.push(
                'The java driver needs a `public class Main`: the runner renames any other public' +
                    ' class to Main and would rewrite the driver.'
            );
        }
    });

    draft.checks.forEach((check, index) => {
        const options = splitLines(check.optionsText);
        if (!check.prompt.trim()) return;
        if (options.length < 2) {
            problems.push(`Question ${index + 1} needs at least two options.`);
        }
        if (!options.includes(check.correctAnswer.trim())) {
            problems.push(
                `Question ${index + 1}'s correct answer is not one of its options, so nobody can` +
                    ' get it right.'
            );
        }
    });

    return problems;
};
