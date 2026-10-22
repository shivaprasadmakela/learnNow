import React from 'react';
import { AlertTriangle, Lightbulb, MessageSquareQuote } from 'lucide-react';
import { Markdown } from '../../../../shared/components/ui/Markdown';
import type { InterviewAnswer } from '../../api/interview.api';
import styles from '../../styles/Interview.module.css';

/**
 * An answer in the order a beginner needs it: what it is, how it works, how to use it, where you
 * would see it, then the words to say in the interview - with one line to remember and the point
 * people get wrong.
 */
export const BeginnerAnswer: React.FC<{ answer: InterviewAnswer }> = ({ answer }) => {
    const steps: Array<[string, string | null | undefined]> = [
        ['In simple words', answer.simple],
        ['How it works', answer.how],
        ['How to use it', answer.usage],
        ['A real-world example', answer.example]
    ];
    const shown = steps.filter((step): step is [string, string] => Boolean(step[1]?.trim()));

    return (
        <div className={styles.beginnerAnswer}>
            {shown.map(([title, body], i) => (
                <section key={title} className={styles.answerStep}>
                    <h4 className={styles.answerStepTitle}>
                        <span className={styles.answerStepNumber} aria-hidden="true">
                            {i + 1}
                        </span>
                        {title}
                    </h4>
                    <Markdown content={body} className={styles.answerStepBody} />
                </section>
            ))}

            <section className={styles.script} aria-label="What to say in the interview">
                <h4 className={styles.scriptTitle}>
                    <MessageSquareQuote size={16} aria-hidden="true" />
                    Say it like this
                </h4>
                <Markdown content={answer.script} className={styles.scriptBody} />
            </section>

            <p className={styles.remember}>
                <Lightbulb size={16} aria-hidden="true" />
                <span>
                    <strong>Remember:</strong> {answer.remember}
                </span>
            </p>

            {answer.caution?.trim() && (
                <div className={styles.caution}>
                    <AlertTriangle size={16} aria-hidden="true" className={styles.cautionIcon} />
                    <div>
                        <strong className={styles.cautionTitle}>Important</strong>
                        <Markdown content={answer.caution} />
                    </div>
                </div>
            )}
        </div>
    );
};
