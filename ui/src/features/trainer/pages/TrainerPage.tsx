import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { Brain, Flame, NotebookPen, Sparkles, Target } from 'lucide-react';
import { fetchTrainer, type TrainerProfile } from '../api/trainer.api';
import { fetchTrainerHome, type Nudge, type TrainerHome } from '../api/home.api';
import { fetchResume, type Resume } from '../api/resume.api';
import {
    interviewTitle,
    startMockInterview,
    type InterviewKind,
    type StartInterviewResponse
} from '../api/interview.api';
import { updateConsents } from '../../privacy/api/privacy.api';
import { openAskAi } from '../pageContext';
import { runNudgeAction } from '../utils/nudgeAction';
import { GoalForm, TrainerNotes } from '../components/AboutYou';
import { NudgeList, TaskList } from '../components/TrainerToday';
import { WeeklyPlan } from '../components/WeeklyPlan';
import { ReadinessList } from '../components/Readiness';
import { MockInterviews, type MockStartRequest } from '../components/MockInterviews';
import { ResumeSection } from '../components/ResumeReview';
import { InterviewHistory } from '../components/InterviewHistory';
import styles from '../styles/Trainer.module.css';

// LiveKit is large; it loads only when an interview opens.
const TopicInterviewFlow = React.lazy(() =>
    import('../components/TopicInterview/TopicInterviewFlow').then(m => ({ default: m.TopicInterviewFlow }))
);

export interface TrainerPageProps {
    /** Opens a topic in the study console, at one lesson when given. */
    onOpenLesson: (topicId: string, subtopicId?: string | null) => void;
}

/** The interview overlay: a new interview (topic or mock), or a past one's report. */
interface FlowRequest {
    kind: InterviewKind;
    title: string;
    topicId?: string;
    minutes?: number;
    start?: () => Promise<StartInterviewResponse>;
    reportId?: string;
}

type SectionId = 'today' | 'goal' | 'plan' | 'readiness' | 'mock' | 'resume' | 'history' | 'knows';

const SECTION_LABELS: Record<SectionId, string> = {
    today: 'Today',
    goal: 'Goal',
    plan: 'Weekly plan',
    readiness: 'Readiness',
    mock: 'Mock interviews',
    resume: 'Resume',
    history: 'History',
    knows: 'What it knows'
};

const scrollToSection = (id: SectionId) =>
    document.getElementById(`trainer-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const openPrivacySettings = () => {
    window.history.pushState(null, '', '/profile#consent');
    window.dispatchEvent(new PopStateEvent('popstate'));
};

/**
 * The AI trainer's home: today's nudges and tasks, the goal, the weekly plan, readiness per topic,
 * mock interviews, the resume review, interview history, and what the trainer holds. Each section
 * is hidden when an admin has switched its feature off.
 */
export const TrainerPage: React.FC<TrainerPageProps> = ({ onOpenLesson }) => {
    const [home, setHome] = useState<TrainerHome | null>(null);
    const [homeError, setHomeError] = useState(false);
    const [profile, setProfile] = useState<TrainerProfile | null>(null);
    const [resume, setResume] = useState<Resume | null | undefined>(undefined);
    const [resumeError, setResumeError] = useState(false);
    const [flow, setFlow] = useState<FlowRequest | null>(null);
    const [interviewsVersion, setInterviewsVersion] = useState(0);
    const [enabling, setEnabling] = useState(false);
    const [consentError, setConsentError] = useState(false);

    const loadHome = useCallback(() => {
        fetchTrainerHome()
            .then(h => {
                setHome(h);
                setHomeError(false);
            })
            .catch(() => setHomeError(true));
    }, []);

    const loadProfile = useCallback(() => {
        fetchTrainer()
            .then(setProfile)
            .catch(() => setProfile(null));
    }, []);

    useEffect(() => {
        loadHome();
        loadProfile();
    }, [loadHome, loadProfile]);

    const resumeOn = Boolean(home?.available && home.features.resume);
    useEffect(() => {
        if (!resumeOn) return;
        let active = true;
        fetchResume()
            .then(r => active && setResume(r))
            .catch(() => active && setResumeError(true));
        return () => {
            active = false;
        };
    }, [resumeOn]);

    // A link such as /trainer#resume (from the dashboard card) lands on that section.
    useEffect(() => {
        if (!home) return;
        const hash = window.location.hash.replace('#', '') as SectionId;
        if (hash && hash in SECTION_LABELS) setTimeout(() => scrollToSection(hash), 50);
    }, [home]);

    const enablePersonalisation = async () => {
        setEnabling(true);
        setConsentError(false);
        try {
            await updateConsents([{ purpose: 'PERSONALISATION', granted: true }]);
            loadHome();
            loadProfile();
        } catch {
            setConsentError(true);
        } finally {
            setEnabling(false);
        }
    };

    const handleNudge = (nudge: Nudge) => {
        if (!nudge.action) return;
        runNudgeAction(
            nudge.action,
            {
                openLesson: (topicId, subtopicId) => onOpenLesson(topicId, subtopicId),
                startTopicInterview: (topicId, title) => setFlow({ kind: 'TOPIC', topicId, title }),
                askAi: prompt => openAskAi(prompt),
                openTrainer: () => scrollToSection('goal'),
                uploadResume: () => scrollToSection('resume'),
                mockInterview: () => scrollToSection('mock')
            },
            nudge.title
        );
    };

    const startMock = ({ info, role, useJobDescription }: MockStartRequest) =>
        setFlow({
            kind: info.kind,
            title: role || info.label,
            minutes: info.minutes,
            start: () => startMockInterview(info.kind, role, useJobDescription)
        });

    const closeFlow = () => {
        setFlow(null);
        setInterviewsVersion(v => v + 1);
        loadHome();
    };

    if (homeError && !home) {
        return (
            <div className={styles.page}>
                <p className={styles.error} role="alert">Could not load your trainer. Please refresh the page.</p>
            </div>
        );
    }

    if (!home) {
        return (
            <div className={styles.page}>
                <span className={styles.busy}>
                    <span className={styles.spinner} /> Loading your trainer…
                </span>
            </div>
        );
    }

    if (!home.available) {
        return (
            <div className={styles.page}>
                <h1 className={styles.pageTitle}>
                    <Brain size={26} aria-hidden />
                    AI Trainer
                </h1>
                <p className={styles.muted}>Your AI trainer is not available right now. Please try again later.</p>
            </div>
        );
    }

    const { features, personalised, quotas } = home;
    const shown: SectionId[] = [
        ...(personalised ? (['today'] as SectionId[]) : []),
        'goal',
        ...(features.weeklyPlan ? (['plan'] as SectionId[]) : []),
        ...(personalised ? (['readiness'] as SectionId[]) : []),
        ...(features.mockInterview ? (['mock'] as SectionId[]) : []),
        ...(features.resume ? (['resume'] as SectionId[]) : []),
        'history',
        'knows'
    ];

    return (
        <div className={styles.page}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>
                    <Brain size={26} aria-hidden />
                    AI Trainer
                </h1>
                <p className={styles.pageLead}>Your plan, your practice interviews and your resume, in one place.</p>
                <div className={styles.focusRow}>
                    {home.streak.currentDays > 0 && (
                        <span className={styles.chip}>
                            <Flame size={12} aria-hidden /> {home.streak.currentDays}-day streak
                        </span>
                    )}
                    {features.topicInterview && <span className={styles.chip}>{quotas.topicInterviewsLeft} topic interviews left</span>}
                    {features.mockInterview && <span className={styles.chip}>{quotas.mockInterviewsLeft} mock interviews left</span>}
                    {(features.topicInterview || features.mockInterview) && (
                        <span className={styles.chip}>{quotas.retriesLeftToday} retries left today</span>
                    )}
                </div>
            </header>

            {!personalised && (
                <div className={styles.banner}>
                    <p>
                        Personalisation is off, so your trainer cannot see your progress. Nudges, readiness and your weekly plan need it.
                    </p>
                    <div className={styles.actions}>
                        <button type="button" className={styles.primaryBtn} onClick={enablePersonalisation} disabled={enabling}>
                            {enabling ? 'Turning on…' : 'Turn on'}
                        </button>
                        <button type="button" className={styles.secondaryBtn} onClick={openPrivacySettings}>
                            Privacy settings
                        </button>
                    </div>
                    {consentError && (
                        <p className={styles.error} role="alert">Could not turn it on. Please change it in Privacy settings.</p>
                    )}
                </div>
            )}

            <nav className={styles.sectionNav} aria-label="Trainer sections">
                {shown.map(id => (
                    <button key={id} type="button" className={styles.sectionNavLink} onClick={() => scrollToSection(id)}>
                        {SECTION_LABELS[id]}
                    </button>
                ))}
            </nav>

            {personalised && (
                <section id="trainer-today" className={styles.section} aria-labelledby="trainer-today-title">
                    <h2 id="trainer-today-title" className={styles.sectionTitle}>
                        <Sparkles size={18} aria-hidden />
                        Today
                    </h2>
                    {home.nudges.length === 0 && home.todayTasks.length === 0 ? (
                        <p className={styles.muted}>
                            Nothing urgent today. {features.weeklyPlan ? 'Make a weekly plan below to get a task list for each day.' : 'Keep going with your next lesson.'}
                        </p>
                    ) : (
                        <>
                            {home.nudges.length > 0 && <NudgeList nudges={home.nudges} features={features} onAction={handleNudge} />}
                            {home.todayTasks.length > 0 && (
                                <div>
                                    <p className={styles.cardLabel}>Today's tasks</p>
                                    <TaskList tasks={home.todayTasks} />
                                </div>
                            )}
                        </>
                    )}
                </section>
            )}

            <section id="trainer-goal" className={styles.section} aria-labelledby="trainer-goal-title">
                <h2 id="trainer-goal-title" className={styles.sectionTitle}>
                    <Target size={18} aria-hidden />
                    Your goal
                </h2>
                <p className={styles.sectionLead}>The role you want and when. Your plan and interviews are built around it.</p>
                <GoalForm key={JSON.stringify(home.goal)} goal={home.goal} onSaved={loadHome} hideHeading />
            </section>

            {features.weeklyPlan && (
                <section id="trainer-plan" className={styles.section}>
                    <WeeklyPlan personalised={personalised} onGenerated={loadHome} />
                </section>
            )}

            {personalised && (
                <section id="trainer-readiness" className={styles.section}>
                    <ReadinessList
                        canAskAi={features.askAi}
                        canPractise={features.topicInterview}
                        onAskAi={prompt => openAskAi(prompt)}
                        onPractise={t => setFlow({ kind: 'TOPIC', topicId: t.topicId, title: t.topicTitle })}
                    />
                </section>
            )}

            {features.mockInterview && (
                <section id="trainer-mock" className={styles.section}>
                    <MockInterviews
                        hasJobDescription={Boolean(resume?.jobDescription)}
                        refreshKey={`${resume?.analysedAt ?? 'none'}-${interviewsVersion}`}
                        onStart={startMock}
                        onUploadResume={() => scrollToSection('resume')}
                    />
                </section>
            )}

            {features.resume && (
                <section id="trainer-resume" className={styles.section}>
                    <ResumeSection
                        resume={resume}
                        loadError={resumeError}
                        onChange={r => {
                            setResume(r);
                            loadHome();
                        }}
                        analysesLeft={quotas.resumeAnalysesLeft}
                        defaultRole={home.goal?.targetRole}
                    />
                </section>
            )}

            <section id="trainer-history" className={styles.section}>
                <InterviewHistory
                    refreshKey={interviewsVersion}
                    onOpen={i => setFlow({ kind: i.kind ?? 'TOPIC', title: interviewTitle(i), reportId: i.id })}
                />
            </section>

            <section id="trainer-knows" className={styles.section} aria-labelledby="trainer-knows-title">
                <h2 id="trainer-knows-title" className={styles.sectionTitle}>
                    <NotebookPen size={18} aria-hidden />
                    What your trainer knows
                </h2>
                {profile ? (
                    <TrainerNotes notes={profile.notes} onChanged={loadProfile} />
                ) : (
                    <p className={styles.muted}>No notes yet.</p>
                )}
                <p className={styles.muted}>
                    Besides these notes, it reads your progress, quiz results, streak, study times, your goal and, if you add one,
                    your resume. To stop it using your progress, switch off personalisation in{' '}
                    <button type="button" className={styles.linkBtn} onClick={openPrivacySettings}>
                        Privacy settings
                    </button>
                    .
                </p>
            </section>

            {flow && (
                <Suspense fallback={null}>
                    <TopicInterviewFlow
                        isOpen
                        onClose={closeFlow}
                        kind={flow.kind}
                        title={flow.title}
                        topicId={flow.topicId}
                        topicTitle={flow.title}
                        minutes={flow.minutes}
                        start={flow.start}
                        reportId={flow.reportId}
                        onReviseLesson={(subtopicId, topicId) => {
                            if (!topicId) return;
                            setFlow(null);
                            onOpenLesson(topicId, subtopicId);
                        }}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default TrainerPage;
