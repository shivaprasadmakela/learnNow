# AI trainer review (voice interviews and Ask AI), 2026-10-27

This is a read-only review of learnNow-ai `8a32dff` and learnNow `99b9355`.

The tests pass: 31 in learnNow-ai and 7 in the UI trainer tests. The Maven tests were not run. The voice worker has no tests. The UI report test uses the wrong `habits` shape, and that is what hides bug 1.

## Status (2026-10-27)

All six must-fix items are fixed in the working tree, not committed. A seventh was found while writing a test for the worker:

7. **Every voice interview crashed at start.** `TopicInterviewAgent.__init__` set `self.session`, but `Agent.session` is a read-only property in livekit-agents 1.8.9, so the constructor raised `AttributeError`. Now fixed: the agent keeps its own reference, `self.voice`.

New tests:
- learnNow-ai `tests/test_topic_interviewer.py`: a budget refusal posts `budget_exceeded` to the backend, and concluding the interview closes the session.
- Backend: a transcript with no learner answers fails and refunds the quota; the sweeper gives up on old stuck rows.

Still unverified without a live call: `next_question` and `ask_follow_up` await `say()` inside a function tool, so they need one real test call.

## Must fix

1. **The report screen crashes on every scored interview.**
   - `ui/src/features/trainer/components/TopicInterview/TopicInterviewReport.tsx:99-113` reads `habits.wpm`, `filler_words` (as a number), `average_answer_words` and `turn_count`.
   - learnNow-ai `interview/habits.py:78-86` returns `words_per_minute`, `filler_words_count`, `filler_words` (a **dict**), `average_words_per_answer` and `user_turns_count`.
   - Rendering that dict throws "Objects are not valid as a React child". I checked this one myself.
   - Fix: the type in `interview.api.ts:16-23`, the fields the report uses, and the test fixture.
2. **The worker never ends the job, so the transcript may never be posted.**
   - `voice/topic_interviewer.py:108-110`: `conclude_interview` only calls `session.drain()`.
   - The transcript is posted only from the shutdown callback (`:193-216`), and nothing calls `ctx.shutdown()` or `ctx.delete_room()`.
   - If the tab stays open, the interview is marked ABANDONED after 15 minutes.
   - Fix: call `ctx.shutdown(reason)` after the debrief has played.
3. **An interview can stay COMPLETED forever.**
   - `scoreAsync` calls `score()` on `this` (`TopicInterviewService.java:222,232`), so `@Transactional` (`:238`) is bypassed.
   - The executor keeps jobs only in memory, so a restart between the transcript and scoring loses the job.
   - `abandonStaleInterviews` (`:449-455`) only looks at CREATED rows.
   - Fix: call `score` through the proxy, and add a scheduled job that re-scores COMPLETED rows older than about 5 minutes or marks them FAILED.
4. **A failed worker start still uses up a learner's quota.**
   - `topic_interviewer.py:150-171`: on bad metadata or a budget refusal the worker returns without posting anything, so the row becomes ABANDONED.
   - The quota (`:95`) refunds only FAILED interviews.
   - Fix: post a callback with `ended_reason`, or mark the interview FAILED.
5. **The UI stops waiting before scoring finishes, and the report then can't be reached.**
   - `TopicInterviewFlow.tsx:218` polls for about 40 seconds. Scoring alone has a 90-second timeout.
   - ABANDONED is not handled (`:224-231`).
   - The "profile history" message points at a page that does not exist: `fetchTopicInterviews` is never used.
   - Fix: poll longer with backoff, handle ABANDONED, and add a history view.
6. **"Save to notes" calls a backend route that does not exist.**
   - `TopicInterviewReport.tsx:43` posts to `/api/trainer/interviews/{id}/notes` (`interview.api.ts:84`), which returns 404 with no error shown.
   - The backend already saves notes during scoring, so remove the button or add the route.

## Should fix

- **A remote call runs inside the start transaction.**
  - `TopicInterviewService.start()` (`:134-176`) calls `aiClient.startInterview` (up to 30 seconds) inside the transaction.
  - On failure, the FAILED save is rolled back.
  - If the agent was dispatched but the response timed out, the agent runs and bills while every callback returns 404.
  - Fix: commit the CREATED row first, call outside the transaction, and mark FAILED in a separate transaction.
- **Duplicate transcript posts are not fully guarded.**
  - The `status != CREATED` check (`:186`) takes no lock, and V8 has no unique `(interview_id, seq)` index.
  - A worker retry can insert the turns twice.
  - Fix: a conditional `UPDATE ... WHERE status='CREATED'` or `FOR UPDATE`, plus a unique index.
- **The callback allowlist uses a plain `startsWith`** (learnNow-ai `api/main.py:218`), and the service token is sent to that URL.
  - A prod prefix without a path, such as `https://api.example.com`, would also match `https://api.example.com.evil.com`.
  - Fix: parse the URL, and compare the scheme, host, port and path prefix.
- **The paid endpoints have no per-learner rate limit.**
  - `/api/trainer/chat` and `/transcribe` are not in any `RateLimitingFilter` tier (`:53-80`).
  - One learner can use up the shared tenant spend cap for everyone.
- **AI answers can load images from any site.**
  - `Markdown.tsx:61-66` loads any image URL in AI output, so a prompt-injected image URL could leak data.
  - Fix: allow only same-origin images in AI output. `javascript:` links are already neutralised by react-markdown.
- **The 6-minute UI timer cuts off the debrief.**
  - The countdown (`TopicInterviewFlow.tsx:129-142`) disconnects at 0.
  - The agent's clock starts earlier, and its debrief takes up to 60 seconds.
  - Fix: let the agent end the call, or add a grace period.
- **Voice spend is recorded only at shutdown** (`common.py:138`, `topic_interviewer.py:193`).
  - A worker crash loses the spend record, and interviews running at the same time all pass `ledger.check`.

## Improvements

- Cap `plan.max_seconds` (`plan.py:29`): `min(plan.max_seconds, settings.interview_max_seconds)`.
- The spec says "away twice ends the interview". `user_away_timeout` is set, but there is no `user_state_changed` handler.
- The watchdog task (`topic_interviewer.py:243`) is never kept or cancelled.
- `start()` does not check that the topic is completed, and the quota check is racy when two starts run at the same time.
- `AiClient.voiceAvailable` (`:91`) caches `false` for 60 seconds after one transient `/health` error.
- Tests to add:
  - the worker, with a mocked session, posting the transcript and retrying;
  - scoring failure and stuck COMPLETED rows;
  - a start timeout after dispatch.

## Deploy config

- **learnNow backend:**
  - `LEARNNOW_AI_URL`
  - `LEARNNOW_AI_SERVICE_TOKEN`, which must equal learnNow-ai's `SERVICE_TOKEN`
  - `LEARNNOW_AI_CALLBACK_URL`, which otherwise defaults to localhost
- **learnNow-ai:**
  - `CALLBACK_URL_PREFIXES`, which otherwise defaults to localhost
  - a persistent `data_dir` for the SQLite ledger, shared by the API and the worker

## Verified fine

- The service token is compared in constant time on both sides.
- Only `/api/internal/ai/interviews/**` skips the JWT.
- The plan and the model answers never reach the browser or the voice model.
- Reports are scoped to the learner's user id.
- Every Java HTTP call has a timeout.
