import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Eye, HardDrive, Lightbulb } from 'lucide-react';
import styles from './EditorialPanel.module.css';
import { ContentRenderer } from '../../../../shared/components/content-renderer';
import { CodeViewer } from '../../../../shared/components/editor/CodeViewer';
import { Tabs } from '../../../../shared/components/ui/Tabs';
import { YouTubeEmbed } from '../../../../shared/components/ui/YouTubeEmbed';
import type { DsaApproachKind, DsaApproachSummary } from '../../api/dsa.api';
import { useDsaEditorial } from '../../hooks/useDsaEditorial';
import { languageLabel, monacoLanguageFor } from '../../utils/dsaExecutionHelper';

const KIND_LABELS: Record<DsaApproachKind, string> = {
    BRUTE: 'Brute force',
    BETTER: 'Better',
    OPTIMAL: 'Optimal'
};

export interface EditorialPanelProps {
    problemId: string;
    /**
     * The outline that came with the problem: enough to say what the editorial holds, and to ask
     * before showing it. The reasoning and the code are fetched only once the learner says yes.
     */
    approaches: DsaApproachSummary[];
    /** The workspace's language. The code opens in it when the approach is written in it. */
    preferredLanguage: string;
    /** A learner who has solved the problem is not asked to confirm the spoiler. */
    solved: boolean;
    youtubeUrl?: string;
    /** Reads a draft's editorial through the authoring endpoint, for the admin preview. */
    preview?: boolean;
}

const revealKey = (problemId: string) => `dsa_editorial_revealed:${problemId}`;

const readRevealed = (problemId: string): boolean => {
    try {
        return window.localStorage.getItem(revealKey(problemId)) === '1';
    } catch {
        return false;
    }
};

/**
 * The written solution: one tab per approach, brute force first, each with its reasoning, its
 * complexity and its code in every language it was written in.
 *
 * The editorial is a spoiler, so an unsolved problem asks once before showing it - opening the tab
 * by accident should not cost someone the problem. The answer is remembered per problem.
 *
 * The question is also what fetches it: until the learner says yes, the page holds only the
 * outline, so the solution never reaches a browser whose owner did not ask for it.
 */
export const EditorialPanel: React.FC<EditorialPanelProps> = ({
    problemId,
    approaches: outline,
    preferredLanguage,
    solved,
    youtubeUrl,
    preview = false
}) => {
    const sortedOutline = useMemo(
        () => [...outline].sort((a, b) => a.orderIndex - b.orderIndex),
        [outline]
    );

    const [revealed, setRevealed] = useState(() => solved || readRevealed(problemId));
    const editorial = useDsaEditorial(
        problemId,
        sortedOutline.length > 0 && (revealed || solved),
        preview
    );
    const sorted = useMemo(
        () => [...(editorial.approaches ?? [])].sort((a, b) => a.orderIndex - b.orderIndex),
        [editorial.approaches]
    );
    const [activeIndex, setActiveIndex] = useState(0);
    /** The language the learner picked in the editorial, which then sticks across approaches. */
    const [chosenLanguage, setChosenLanguage] = useState<string | null>(null);

    const reveal = () => {
        setRevealed(true);
        try {
            window.localStorage.setItem(revealKey(problemId), '1');
        } catch {
            /* Private mode: it just asks again next time. */
        }
    };

    if (sortedOutline.length === 0) {
        return (
            <div className={styles.panel}>
                <div className={styles.empty}>
                    <Lightbulb size={22} aria-hidden="true" />
                    <p>The write-up for this problem is still being written.</p>
                </div>
                <Walkthrough url={youtubeUrl} />
            </div>
        );
    }

    if (!revealed && !solved) {
        const first = sortedOutline[0];
        const last = sortedOutline[sortedOutline.length - 1];
        return (
            <div className={styles.panel}>
                <div className={styles.gate}>
                    <span className={styles.gateIcon} aria-hidden="true">
                        <Eye size={22} />
                    </span>
                    <h2 className={styles.gateTitle}>The editorial gives the solution away</h2>
                    <p className={styles.gateText}>
                        {sortedOutline.length === 1
                            ? 'It walks through the approach and its code.'
                            : `It walks through ${sortedOutline.length} approaches, from ${KIND_LABELS[
                                  first.kind
                              ].toLowerCase()} to ${KIND_LABELS[
                                  last.kind
                              ].toLowerCase()}, with code for each.`}{' '}
                        Even a rough attempt first makes it land far better - and the hints on the
                        Description tab are a smaller nudge.
                    </p>
                    <button type="button" className={styles.gateBtn} onClick={reveal}>
                        <Eye size={15} aria-hidden="true" /> Show the editorial
                    </button>
                </div>
            </div>
        );
    }

    if (sorted.length === 0) {
        return (
            <div className={styles.panel}>
                <div className={styles.empty} role="status">
                    {editorial.error ? (
                        <>
                            <p>{editorial.error}</p>
                            <button type="button" className={styles.gateBtn} onClick={editorial.retry}>
                                Try again
                            </button>
                        </>
                    ) : (
                        <p>Loading the editorial...</p>
                    )}
                </div>
            </div>
        );
    }

    const index = Math.min(activeIndex, sorted.length - 1);
    const approach = sorted[index];
    const title = approachTitle(sorted, index);

    const solutions = approach.solutions ?? [];
    const available = solutions.map(solution => solution.language);
    const language =
        [chosenLanguage, preferredLanguage].find(
            (candidate): candidate is string => candidate != null && available.includes(candidate)
        ) ?? available[0];
    const solution = solutions.find(item => item.language === language);

    return (
        <div className={styles.panel}>
            {sorted.length > 1 && (
                <Tabs
                    items={sorted.map((_item, i) => ({
                        id: String(i),
                        label: approachTitle(sorted, i)
                    }))}
                    activeId={String(index)}
                    onChange={id => setActiveIndex(Number(id))}
                    variant="pill"
                    label="Approaches"
                />
            )}

            <article className={styles.approach} aria-labelledby={`${approach.id}-title`}>
                <header className={styles.approachHead}>
                    <h2 id={`${approach.id}-title`} className={styles.approachTitle}>
                        {sorted.length > 1 && (
                            <span className={styles.approachNumber}>Approach {index + 1}</span>
                        )}
                        {title}
                    </h2>
                    {(approach.timeComplexity || approach.spaceComplexity) && (
                        <dl className={styles.complexity}>
                            {approach.timeComplexity && (
                                <div className={styles.chip}>
                                    <dt>
                                        <Clock size={12} aria-hidden="true" /> Time
                                    </dt>
                                    <dd>{approach.timeComplexity}</dd>
                                </div>
                            )}
                            {approach.spaceComplexity && (
                                <div className={styles.chip}>
                                    <dt>
                                        <HardDrive size={12} aria-hidden="true" /> Space
                                    </dt>
                                    <dd>{approach.spaceComplexity}</dd>
                                </div>
                            )}
                        </dl>
                    )}
                </header>

                {approach.intuition.trim() && (
                    <div className={styles.intuition}>
                        <ContentRenderer
                            blocks={[
                                {
                                    id: `${approach.id}-intuition`,
                                    orderIndex: 0,
                                    type: 'markdown',
                                    body: approach.intuition
                                }
                            ]}
                            hideHeader
                            runnableCode={false}
                        />
                    </div>
                )}

                {solution && (
                    <CodeViewer
                        code={solution.code}
                        language={monacoLanguageFor(solution.language)}
                        label={`${title} in ${languageLabel(solution.language)}`}
                        toolbar={
                            solutions.length > 1 ? (
                                <Tabs
                                    items={solutions.map(item => ({
                                        id: item.language,
                                        label: languageLabel(item.language)
                                    }))}
                                    activeId={solution.language}
                                    onChange={setChosenLanguage}
                                    variant="compact"
                                    label="Solution language"
                                    className={styles.languageTabs}
                                />
                            ) : (
                                <span className={styles.languageName}>
                                    {languageLabel(solution.language)}
                                </span>
                            )
                        }
                    />
                )}
            </article>

            {sorted.length > 1 && (
                <nav className={styles.stepper} aria-label="Approach navigation">
                    {index > 0 ? (
                        <button
                            type="button"
                            className={styles.stepBtn}
                            onClick={() => setActiveIndex(index - 1)}
                        >
                            <ChevronLeft size={15} aria-hidden="true" />
                            {approachTitle(sorted, index - 1)}
                        </button>
                    ) : (
                        <span />
                    )}
                    {index < sorted.length - 1 && (
                        <button
                            type="button"
                            className={`${styles.stepBtn} ${styles.stepBtnNext}`}
                            onClick={() => setActiveIndex(index + 1)}
                        >
                            Next: {approachTitle(sorted, index + 1)}
                            <ChevronRight size={15} aria-hidden="true" />
                        </button>
                    )}
                </nav>
            )}

            <Walkthrough url={youtubeUrl} />
        </div>
    );
};

/** "Brute force", or "Brute force 2" when an editorial has two approaches of the same kind. */
const approachTitle = (approaches: { kind: DsaApproachKind }[], index: number): string => {
    const kind = approaches[index].kind;
    const label = KIND_LABELS[kind] ?? kind;
    const sameKind = approaches.filter(item => item.kind === kind);
    if (sameKind.length < 2) return label;
    return `${label} ${sameKind.indexOf(approaches[index]) + 1}`;
};

const Walkthrough: React.FC<{ url?: string }> = ({ url }) =>
    url ? (
        <section className={styles.walkthrough}>
            <h2 className={styles.sectionHead}>Video walkthrough</h2>
            <YouTubeEmbed url={url} />
        </section>
    ) : null;

export default EditorialPanel;
