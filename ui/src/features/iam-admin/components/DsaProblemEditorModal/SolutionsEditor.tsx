import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import styles from './DsaProblemEditorModal.module.css';
import { Tabs } from '../../../../shared/components/ui/Tabs';
import { MonacoEditorPane } from '../../../../shared/components/editor';
import {
    DSA_SUPPORTED_LANGUAGES,
    languageLabel,
    monacoLanguageFor
} from '../../../dsa/utils/dsaExecutionHelper';
import type { SolutionDraft } from './problemDraft';

export interface SolutionsEditorProps {
    solutions: SolutionDraft[];
    onChange: (next: SolutionDraft[]) => void;
}

/**
 * One approach's code, one tab per language.
 *
 * The learner's editorial offers exactly these languages in its switcher, opening on whichever one
 * their workspace is set to - so a solution in every judged language means nobody has to translate
 * the editorial in their head. Adding a language is a select rather than a free-text field: the ids
 * have to match the compiler's (`cpp`, not `c++`) for that matching to work.
 */
export const SolutionsEditor: React.FC<SolutionsEditorProps> = ({ solutions, onChange }) => {
    const [activeLanguage, setActiveLanguage] = useState<string | null>(
        solutions[0]?.language ?? null
    );

    const active =
        solutions.find(solution => solution.language === activeLanguage) ?? solutions[0];
    const addable = DSA_SUPPORTED_LANGUAGES.filter(
        option => !solutions.some(solution => solution.language === option.id)
    );

    const add = (language: string) => {
        if (!language) return;
        onChange([...solutions, { language, code: '' }]);
        setActiveLanguage(language);
    };

    const remove = (language: string) => {
        const next = solutions.filter(solution => solution.language !== language);
        onChange(next);
        setActiveLanguage(next[0]?.language ?? null);
    };

    const updateCode = (code: string) => {
        if (!active) return;
        onChange(
            solutions.map(solution =>
                solution.language === active.language ? { ...solution, code } : solution
            )
        );
    };

    return (
        <div className={styles.codeField}>
            <div className={styles.solutionsBar}>
                <span className={styles.codeLabel}>Code</span>
                {solutions.length > 0 && (
                    <Tabs
                        items={solutions.map(solution => ({
                            id: solution.language,
                            label: languageLabel(solution.language)
                        }))}
                        activeId={active?.language ?? ''}
                        onChange={setActiveLanguage}
                        variant="pill"
                        label="Solution language"
                    />
                )}
                <div className={styles.solutionsActions}>
                    {addable.length > 0 && (
                        <label className={styles.addLanguage}>
                            <Plus size={13} aria-hidden="true" />
                            <select
                                value=""
                                onChange={e => add(e.target.value)}
                                aria-label="Add a language"
                            >
                                <option value="">Add language</option>
                                {addable.map(option => (
                                    <option key={option.id} value={option.id}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    {active && (
                        <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => remove(active.language)}
                            title={`Remove the ${languageLabel(active.language)} solution`}
                            aria-label={`Remove the ${languageLabel(active.language)} solution`}
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            {active ? (
                <div className={styles.codeHost}>
                    <MonacoEditorPane
                        key={active.language}
                        code={active.code}
                        language={monacoLanguageFor(active.language)}
                        onChange={updateCode}
                    />
                </div>
            ) : (
                <p className={styles.solutionsEmpty}>
                    No code yet. Add a language to write this approach's solution in it - one per
                    language the problem is judged in is ideal.
                </p>
            )}
        </div>
    );
};
