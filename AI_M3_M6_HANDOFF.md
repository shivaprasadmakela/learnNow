# Handoff: finish the AI trainer (M3–M6)

Written 2026-11-13. Two agents work from this file at the same time: one on `backend/`, one on
`ui/`. Section 3 is the contract between them. Do not change it; if it cannot work as written, say
so in your final report instead of inventing a different shape.

## 0. Ground rules (from the owner, non-negotiable)

- **Never run `git commit`, `git push`, `git stash`, `git checkout`, `git restore` or anything else
  that writes git history or discards working-tree changes.** Leave your work in the working tree.
- Never add `Co-Authored-By` or any AI attribution anywhere.
- Never read, print or edit `.env` files or API keys.
- Do not start, stop or restart anything on ports 8080, 8090, 5173 (the owner's processes). Verify
  with tests, type checks and linters only. Do not deploy.
- The UI working tree already has **someone else's uncommitted work** (a Tracks page: `App.tsx`,
  `AppViewRenderer.tsx`, `parseRoute.ts`, `PathsPage.tsx`, `features/tracks/**`). Keep every line of
  it. Edit those files only where you must, with small targeted edits, never a rewrite.
- Match the surrounding code: naming, idioms, comment density. Comments say *why*, in plain
  sentences (see `backend/.../trainer/service/TrainerService.java` for the house style).
- English only. No users under 18. Audio is never stored, only transcripts.
- Interview and resume feedback judges **content only**: never emotion, confidence, voice or accent.
- Read `AI_M2_HANDOFF.md` sections 1–3 first for how the two repos fit together, then
  `AI_REVIEW.md` for known weak spots.

## 1. Where things stand

M0–M2 are built and committed: Ask AI (text + mic), trainer notes and goal, and voice **topic
interviews** (LiveKit worker in learnNow-ai, `trainer/interview/**` in the backend,
`features/trainer/components/TopicInterview/**` in the UI).

**learnNow-ai is already extended for M3–M6** (uncommitted in `~/Projects/learnNow-ai`, tests pass).
Do not edit that repo. What it now offers is in section 2.

Remaining, and what this handoff covers:

| Milestone | What |
|---|---|
| M3 | Full trainer loop: richer report, readiness per topic, weekly plan, nudges, trainer home, history, retry a question, rate an evaluation |
| M4 | Resume upload → profile + review + job-description match; mock interviews (resume, HR, behavioural, project, full round) |
| M5 | Any profession: falls out of M4, because learnNow-ai writes the questions when the bank has none that fit |
| M6 | Quotas, feature switches, admin AI page, captions, rate limits, privacy export |

## 2. learnNow-ai API (already built; the backend calls it, the browser never does)

All routes need `Authorization: Bearer <service token>` and are called through
`trainer/service/AiClient.java`. Errors: 429 = spending cap (→ `AiLimitException`), 503 = provider
down (→ `AiUnavailableException`), 422 = the request was refused for a reason in `detail`.

- `POST /v1/resume/analyse` — multipart: `tenant`, `file` (PDF or .docx, ≤ 5 MB), optional
  `target_role`. Takes 10–20 s. Returns `{"text": str, "profile": {...}, "review": {...}}`.
  A 422 carries a learner-safe message in `detail` ("Upload your resume as a PDF or a Word (.docx)
  file.", "No text could be read from this file…"): show it to the learner as is.
  - `profile`: `headline, field, target_roles[], level (student|fresher|junior|mid|senior),
    years_experience (number|null), skills[], experience[{title, company, period, highlights[]}],
    projects[{name, summary, tech[]}], education[{degree, institution, year}], certifications[]`.
    It never contains name, phone, email or address.
  - `review`: `overall (0-100), scores{ats, impact, clarity, skills} (0-10 each), summary,
    strengths[], issues[{severity (high|medium|low), title, detail}], rewrites[{original, improved,
    why}], missing_sections[]`.
- `POST /v1/resume/match` — JSON `{tenant, resume_text, profile, job_description (80–8000 chars)}`
  → `{match (0-100), verdict, matched_keywords[], missing_keywords[], strengths[], gaps[],
  suggestions[]}`.
- `POST /v1/interviews/plan` — JSON `{tenant, kind (resume|hr|behavioural|project|full), role?,
  profile?, job_description?, bank_topics: [{id, title}] (≤ 200)}`. Takes 10–20 s. Returns
  `{"title": "<the role>", "items": [...]}`. Each item is **either** a complete question
  `{id (uuid), category (intro|technical|project|behavioural|hr), prompt, key_points[], model_answer,
  follow_ups: [{id, prompt, key_points[], model_answer}]}` **or** a bank slot
  `{"category": "technical", "bank_topic_id": "<one of the ids you sent>"}` that the backend fills
  with a real question from that topic's bank.
- `POST /v1/interviews/start` — the existing call. The plan now also accepts `kind`
  (`topic|retry|resume|hr|behavioural|project|full`, default `topic`), `candidate_brief` (≤ 2000
  chars), a `category` on each question, up to **8** questions, and `max_seconds` up to 1500.
  `topic_title` is the topic's title for topic interviews and **the role** for mock interviews.
- `POST /v1/interviews/score` — unchanged request. The reply now also has
  `dimensions{accuracy, depth, structure, communication}` (0-10), `strengths[2]`, `improvements[2]`
  and `next_step`, beside `overall`, `questions[]` and `habits`.
- `POST /v1/trainer/plan` — JSON `{tenant, platform, learner (the summary map), today
  ("YYYY-MM-DD"), known_topics[], hours_per_week?}` → `{headline, focus[], days: [{day
  (Mon..Sun), tasks: [{kind (lesson|quiz|interview|revise|resume|practice), title, topic|null,
  minutes}]}], advice[], total_minutes}`. Always 7 days, Mon to Sun.
- `GET /v1/usage?tenant=learnnow` → `{tenant, month, cap_inr, spent_inr, by_feature: [{feature,
  provider, calls, cost_inr}], daily: [{day, calls, cost_inr}]}`.

## 3. Backend REST contract (the UI codes against exactly this)

JSON is camelCase unless a field is passed through from learnNow-ai (then it keeps the snake_case
shown in section 2: `profile`, `review`, `jobMatch` contents, `habits`, weekly plan contents).
Errors use the existing `{code, message}` body.

### 3.1 Trainer home — `GET /api/trainer/home`

```jsonc
{
  "available": true,                 // AI service configured
  "personalised": true,              // PERSONALISATION consent
  "features": {"askAi": true, "topicInterview": true, "mockInterview": true, "resume": true, "weeklyPlan": true},
  "goal": {"targetRole": "...", "targetDate": "2027-01-15", "hoursPerWeek": 6} /* or null */,
  "streak": {"currentDays": 4, "studiedToday": false},
  "todayTasks": [{"kind": "lesson", "title": "...", "topic": "..." /* or null */, "minutes": 30}],
  "nudges": [{"kind": "streak_risk", "title": "...", "body": "...",
              "action": {"type": "open_lesson", "label": "Continue", "topicId": "...", "subtopicId": "...", "pathId": "...", "prompt": null}}],
  "readiness": {"weakest": [TopicReadiness], "untested": [TopicReadiness]},   // up to 3 each
  "quotas": {"topicInterviewsLeft": 5, "mockInterviewsLeft": 2, "resumeAnalysesLeft": 3, "retriesLeftToday": 5, "planRefreshesLeft": 3},
  "resume": {"present": true, "overall": 62, "targetRole": "..."},
  "recentInterviews": [InterviewSummary]                                       // up to 5
}
```

- `TopicReadiness`: `{topicId, topicTitle, pathId, completed, quizAnswered, quizAccuracy (0-100|null),
  interviewScore (0-100|null), interviewsTaken, readiness (0-100|null), level
  ("strong"|"okay"|"weak"|"untested")}`.
- Nudge `kind`: `streak_risk | interview_ready | weak_topic | quiz_mistakes | comeback | set_goal |
  upload_resume`. Action `type`: `open_lesson` (topicId, subtopicId, pathId) | `topic_interview`
  (topicId) | `ask_ai` (prompt) | `open_trainer` | `upload_resume` | `mock_interview`. At most 3
  nudges, most urgent first. When `personalised` is false: no nudges, no readiness, no todayTasks.
- `GET /api/trainer/readiness` → `[TopicReadiness]`, every topic the learner has touched, weakest first.

### 3.2 Weekly plan

- `GET /api/trainer/plan` → `{"weekStart": "2026-11-09", "generatedAt": "...", "refreshesLeft": 2,
  "plan": {...section 2 shape...}}` or `204` when there is none for this week.
- `POST /api/trainer/plan` → generates (or regenerates) this week's plan; same body as GET.
  422 `trainer_personalisation_off` without consent, 422 `trainer_plan_refresh_limit` after 3 a week.

### 3.3 Resume

- `GET /api/trainer/resume` → `Resume` or `204`.
- `POST /api/trainer/resume` — multipart: `file`, optional `targetRole`, `adultConfirmed`
  (`true` required, else 422 `resume_adult_confirmation_required`). Replaces any earlier resume.
  422 `resume_rejected` carries learnNow-ai's own message; 422 `resume_quota_reached`.
- `PUT /api/trainer/resume/profile` — JSON `{headline, level, yearsExperience, targetRole, skills[]}`
  (the learner correcting what was read) → `Resume`.
- `POST /api/trainer/resume/match` — JSON `{jobDescription}` → `Resume` (now with `jobMatch`).
- `DELETE /api/trainer/resume` → 204. Also deletes the job description and match.
- `Resume`: `{fileName, targetRole, analysedAt, profile, review, jobDescription (string|null),
  jobMatch (object|null), analysesLeftThisMonth}`.

### 3.4 Interviews (extends the existing `/api/trainer/interviews`)

- Existing topic routes stay as they are.
- `GET /api/trainer/interviews/mock/availability` → `{available, reason (code|null), left,
  hasResume, kinds: [{kind, label, minutes, needsResume}]}`. Kinds: `RESUME` (15 min, needs
  resume), `HR` (10), `BEHAVIOURAL` (10), `PROJECT` (10, needs resume), `FULL` (25, needs resume).
- `POST /api/trainer/interviews/mock` — JSON `{kind, role (optional), useJobDescription (bool)}` →
  `StartInterviewResponse`. Takes up to ~25 s (plan writing). 422 `mock_interview_needs_resume`,
  `mock_interview_quota_reached`, `mock_interview_no_questions`.
- `POST /api/trainer/interviews/{id}/retry` — JSON `{questionId}` (a `planQuestionId` from the
  report) → `StartInterviewResponse`. 422 `interview_retry_limit` after 5 a day.
- `PUT /api/trainer/interviews/{id}/rating` — JSON `{rating: 1 | -1, comment (optional, ≤ 500)}` → 204.
- `StartInterviewResponse` gains `maxSeconds` and `kind`: `{interviewId, url, token, maxSeconds, kind}`.
- `InterviewSummary` (history rows, `GET /api/trainer/interviews`): the existing fields plus
  `kind` (`TOPIC|RETRY|RESUME|HR|BEHAVIOURAL|PROJECT|FULL`) and `title`; `topicId` and `topicTitle`
  may be null for mock interviews.
- Report (`GET /api/trainer/interviews/{id}`): the existing fields plus `kind`, `title`,
  `feedback` (`{dimensions{accuracy,depth,structure,communication}, strengths[], improvements[],
  next_step}` or null for interviews scored before this change), `learnerRating` (1|-1|null),
  `parentInterviewId` (for a retry), and on each question: `planQuestionId`, `category`, `topicId`
  (null unless the question came from the bank). `questionId`/`subtopicId` are null for written
  questions; `modelAnswer` is always filled when one exists.

### 3.5 Admin — `/api/admin/ai` (ADMIN only, like every `/api/admin/**` route)

- `GET /api/admin/ai` → `{"flags": [{feature, enabled, updatedAt}], "usage": {...section 2 /v1/usage...}
  /* or null when unreachable */, "interviews": {"thisMonth": {"TOPIC": {"SCORED": 3, "FAILED": 1}, ...}},
  "flagged": [{id, kind, title, overallScore, comment, createdAt}] /* rating = -1, newest 20, no transcript */,
  "quotas": {"topicInterviews": 5, "mockInterviews": 2, "resumeAnalyses": 3}}`.
- `PUT /api/admin/ai/flags/{feature}` — JSON `{enabled}` → 204. Features: `ASK_AI, TOPIC_INTERVIEW,
  MOCK_INTERVIEW, RESUME, WEEKLY_PLAN`.

A feature that is switched off answers 503 with code `ai_feature_off`, and `features` in
`/api/trainer/home` says so, so the UI hides it.

## 4. Backend work (`backend/`)

Java 21. Build and test with `export JAVA_HOME=$(/usr/libexec/java_home -v 21)` then
`mvn -q -o spotless:apply compile` and `mvn -q -o test -Dtest=<Class>` from `backend/`. Integration
tests need Docker; if it is not running, write plain unit tests (Mockito) instead and say so.

1. **Migration `V9__mock_interviews_resume_plans.sql`** (expand only; follow V7/V8's comment style):
   - `topic_interviews`: `topic_id` becomes nullable; add `kind VARCHAR(20) NOT NULL DEFAULT 'TOPIC'`
     (check constraint on the 7 kinds), `title VARCHAR(200)`, `feedback JSONB`, `learner_rating
     SMALLINT` (−1 or 1), `learner_comment VARCHAR(500)`, `parent_interview_id UUID REFERENCES
     topic_interviews(id) ON DELETE SET NULL`.
   - `topic_interview_answers`: add `plan_question_id UUID`, `category VARCHAR(20)`, `model_answer TEXT`.
   - `learner_resumes` (`user_id` PK → users ON DELETE CASCADE, `file_name`, `resume_text TEXT`,
     `profile JSONB`, `review JSONB`, `target_role VARCHAR(120)`, `job_description TEXT`,
     `job_match JSONB`, `analysis_month VARCHAR(7)`, `analysis_count INT`, `analysed_at`, `updated_at`).
     The uploaded file itself is never stored.
   - `trainer_weekly_plans` (`id UUID` PK, `user_id` → users CASCADE, `week_start DATE`, `plan JSONB`,
     `generations INT NOT NULL DEFAULT 1`, `created_at`, `updated_at`, `UNIQUE (user_id, week_start)`).
   - `ai_feature_flags` (`feature VARCHAR(40)` PK, `enabled BOOLEAN NOT NULL`, `updated_at`,
     `updated_by VARCHAR(255)`). No row means enabled.
2. **Feature flags and quotas.** `AiFeature` enum; a small service with a ~30 s cache and
   `requireEnabled(feature)` (throws → 503 `ai_feature_off`). Guard chat/transcribe (ASK_AI), topic
   interviews, mock interviews and retries, resume routes, plan routes. Quotas as properties with
   these defaults: `learnnow.ai.quota.topic-interviews=5`, `.mock-interviews=2`,
   `.resume-analyses=3` (per calendar month, learner's time zone), `.retries-per-day=5`,
   `.plan-refreshes-per-week=3`. **Quota counts must filter by kind**: today
   `interviewsLeftThisMonth` counts every row; a mock interview or a retry must not eat the topic
   quota. FAILED rows never count.
3. **AiClient**: add `analyseResume`, `matchResume`, `buildInterviewPlan`, `weeklyPlan`, `usage`.
   A 422 from `/v1/resume/analyse` must reach the learner with learnNow-ai's `detail` text as the
   message and code `resume_rejected` (add a small exception + handler; `ValidationException` only
   takes message keys).
4. **Resume** (`trainer/resume/**`): service, controller, entity, DTOs per 3.3. Limit the upload to
   5 MB (check `spring.servlet.multipart` settings). `PUT profile` merges the learner's corrections
   into the stored `profile` map (`headline`, `level`, `years_experience`, `skills`,
   `target_roles[0]`) and `target_role`.
5. **Mock interviews.** Generalise `TopicInterviewService` / `TopicInterviewPlanner` (keep the class
   names; renaming is not worth the churn):
   - `startMock(userId, kind, role, useJobDescription)`: check flag, quota and resume; build
     `bank_topics` (published topics that have at least one published root interview question);
     call `aiClient.buildInterviewPlan`; fill each bank slot with one root question from that topic
     (prefer one this learner has not been asked; reuse the planner's key-point and model-answer
     extraction, and its follow-ups), giving it `category: "technical"`; drop slots whose topic has
     no usable question; fail with `mock_interview_no_questions` if fewer than 2 questions remain.
   - Plan fields: `interview_id, tenant, kind` (lowercase), `topic_title` (the `role` the learner
     typed, else the resume's `target_role`, else the AI's `title`), `first_name`,
     `candidate_brief` (built from the profile: headline, level, years, top skills, job titles with
     companies, project names; ≤ 1500 chars; **no contact details**), `questions`, `max_seconds`
     (HR/BEHAVIOURAL/PROJECT 600, RESUME 900, FULL 1500), `callback_url`.
   - **Do not hold a database transaction open across AI calls** (AI_REVIEW "should fix" #1): build
     the plan with no transaction; save the CREATED row in its own transaction; call
     `startInterview` outside it; then record the room, or mark the row FAILED, in another. Apply
     the same to the existing topic `start`.
   - `retry(userId, interviewId, planQuestionId)`: a one-question plan (`kind: "retry"`, no
     follow-ups, `max_seconds` 180) from the stored plan of a SCORED interview the learner owns;
     `parent_interview_id` set; no points; does not count towards monthly quotas.
   - **Scoring**: questions written by the AI have ids that are not in `interview_questions`. Take
     the prompt, category and model answer from the stored plan; set `question_id`/`subtopic_id`
     only when the bank row exists; always set `plan_question_id`, `category`, `model_answer`. Save
     `feedback` (dimensions, strengths, improvements, next_step). Points: topic interviews as today;
     each SCORED mock interview awards `MOCK_INTERVIEW_COMPLETED = 25`, plus
     `MOCK_INTERVIEW_STRONG_BONUS = 15` at 70 or more (add to `PointsConfig`); retries award none.
     Trainer notes source: `topic_interview` / `mock_interview`.
   - Report, history, rating per 3.4.
6. **Readiness** (`ReadinessService`): per topic the learner has touched. `readiness` =
   `0.6 × latest scored topic-interview score + 0.4 × quiz accuracy` when both exist, else whichever
   exists, else null. Quiz accuracy counts only with ≥ 5 answers (`MIN_QUIZ_ANSWERS`). Level: null →
   `untested`, < 55 `weak`, < 75 `okay`, else `strong`. Keep the formula in one static, unit-tested
   method.
7. **Weekly plan** per 3.2: learner summary + `next_lessons` (the next unfinished topics/lessons on
   the path `NextStepService` points at, up to 8, real titles) + readiness; `known_topics` = every
   topic title sent; week starts Monday in the learner's time zone.
8. **Nudges + home** per 3.1 (`TrainerHomeService`). Rules, in priority order:
   `streak_risk` (streak ≥ 2, nothing studied today, local time ≥ 18:00) → open the next lesson;
   `comeback` (last activity ≥ 3 days ago) → open the next lesson;
   `interview_ready` (a topic completed in the last 14 days that has bank questions and no
   interview yet) → `topic_interview`;
   `weak_topic` (weakest topic with readiness < 55) → `ask_ai` with a ready prompt;
   `quiz_mistakes` (a topic with ≥ 5 quiz answers under 50%) → `ask_ai` asking to re-explain it;
   `set_goal` (no goal) → `open_trainer`;
   `upload_resume` (target date within 60 days and no resume) → `upload_resume`.
   Write the rules as a pure function over a small input record so they are unit-tested without a
   database. `todayTasks` = today's tasks from this week's stored plan (empty when none).
9. **LearnerSummaryService**: replace `resume: null` with a short resume block (headline, level,
   years, target role, top 12 skills, project names, review overall, top 3 issue titles); add
   `weak_topics` / `untested_completed_topics` from readiness and recent mock interviews (kind,
   title, score, next_step). Only when `personalised`.
10. **Admin** per 3.5 (`trainer/admin/**`, under `/api/admin/ai`).
11. **Rate limits** (AI_REVIEW "should fix"): add per-learner tiers in `RateLimitingFilter` for
    `POST /api/trainer/chat`, `/transcribe`, `/resume*`, `/plan`, `/interviews*`. Read how its
    existing tiers work first.
12. **Privacy**: `DataExportResponse`/`DataExportService` gain the resume (profile, review, text,
    job description, match), weekly plans, and each interview's kind, title, feedback and rating.
    New tables cascade from `users`, so `AccountErasureService` needs no change; confirm it.
13. **`resources/trainer/platform-guide.md`**: describe mock interviews, resume review, weekly plan,
    readiness, quotas, how to delete a resume. **`messages.properties`**: every new code.
14. **Tests**: readiness formula, nudge rules, quota-by-kind, mock plan assembly (AiClient mocked),
    scoring a plan with written questions, resume service happy path + rejection.

## 5. UI work (`ui/`)

React 19 + Vite + TypeScript + CSS modules + Vitest. Check with `npm run typecheck`,
`npx eslint <changed files>` and `npx vitest run src/features/trainer`. Use the existing theme
variables (`--bg-primary`, `--bg-secondary`, `--text-primary`, `--text-secondary`, `--text-tertiary`,
`--border-color`, `--tech-blue`), `lucide-react` icons, `apiFetch`/`apiFetchJson`, and the patterns
in `features/trainer/**`. Everything must work at phone width and in both themes.

1. **API modules** in `features/trainer/api/`: types and calls for section 3 (`home`, `plan`,
   `resume`, mock interviews, retry, rating, admin).
2. **A Trainer page** (new view, route `/trainer`, a nav entry "AI Trainer"; read how views, routes
   and the sidebar are wired in `useProfileDashboard`, `parseRoute.ts`, `AppViewRenderer.tsx` and
   the shared navigation components). Sections, each hidden when its feature flag is off:
   - **Today**: nudges (each with its action button) and today's tasks.
   - **Goal**: target role, date, hours a week (the form that lives in Ask AI's "About you" tab;
     reuse it).
   - **Weekly plan**: 7 day columns/rows with tasks and minutes, headline, advice, "Generate" /
     "Refresh (n left)". Empty state explains what it does.
   - **Readiness**: topics with a bar and level chip; a weak topic offers "Ask AI" and, when it has
     an interview, "Practise".
   - **Mock interviews**: one card per kind (label, minutes, what it covers, "needs resume" state),
     interviews left this month, an optional role field and a "use my job description" checkbox when
     one is saved. Starting shows a "Writing your interview…" state for up to ~25 s.
   - **Resume**: upload (PDF/DOCX, ≤ 5 MB) with a target-role field and a required "I am 18 or
     older" checkbox on first upload, and a line saying the file itself is not stored. After
     analysis: overall score and the four scores, summary, strengths, issues by severity, rewrites
     (original → improved, with a copy button and a note that `[X%]` placeholders are for the
     learner to fill in honestly), missing sections; the read profile with an "Edit" form; a
     job-description box → match %, matched/missing keywords, gaps, suggestions; "Delete resume".
   - **History**: past interviews (kind, title, date, score) opening the report.
   - **What your trainer knows**: the notes list with delete (reuse from Ask AI), a sentence on what
     else it reads, and a pointer to Privacy settings for switching personalisation off.
3. **Dashboard card**: a compact "Your trainer" card on the dashboard: the top nudge with its
   action, today's tasks, the weakest topic, and "Open trainer". Shown only when `available`.
4. **Interview flow**: generalise `TopicInterviewFlow` so it can run a topic interview, a mock
   interview or a retry (pass in the start call; keep the topic entry points working). Use
   `maxSeconds` from the start response for the timer. **The agent ends the call**: at 0 the UI
   shows "Wrapping up…" and only force-disconnects 90 s later (AI_REVIEW: the 6-minute timer cut
   off the debrief). Poll for the report with backoff for up to 3 minutes and handle `ABANDONED`
   and `FAILED` with a clear message.
5. **Captions**: an opt-in "Show captions" switch on the interview's start screen, remembered in
   `localStorage` (try/catch). When on, show the latest line each side says, from LiveKit's
   `RoomEvent.TranscriptionReceived`. Off by default: the interview is voice-only.
6. **Report**: kind and title; the four dimension bars; strengths, improvements and next step; per
   question its category chip, score, good/missing, the learner's quoted words, the model answer,
   "Study this lesson" when `subtopicId` is set, and "Retry this question" (starts a retry by
   voice; show the old score beside the new one on the retry's report via `parentInterviewId`);
   thumbs up/down with an optional comment ("Was this evaluation fair?"). Old reports with
   `feedback: null` must still render.
7. **Ask AI**: let other screens open it with a ready prompt (a small store function such as
   `openAskAi(prompt)`), used by nudges and readiness. Restrict images in AI answers to same-origin
   (AI_REVIEW: `Markdown.tsx` loads any image URL from AI output).
8. **Admin**: an "AI" page in the admin area (`features/iam-admin`, see how its pages are
   registered): spend this month against the cap, by feature, a small daily bar chart, feature
   switches, interview counts, flagged evaluations.
9. **Tests**: update `TopicInterviewReport.test.tsx` and `TopicInterviewOffer.test.tsx` for the new
   props; add tests for the resume review rendering, the nudge action mapping and the report's
   backward compatibility.

## 6. Final report

End with: what you built (files), what you verified and how (commands and results), anything in
the contract you could not meet, and anything you left unfinished. Do not claim a thing works unless
you ran something that shows it.
