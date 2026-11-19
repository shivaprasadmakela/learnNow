# Content Studio code review, 2026-10-27

This is a read-only review of `~/GitHub/nocode-ai/app/learnnow_studio`. All 31 studio tests pass.

## Status (2026-10-28)

The three must-fix items are fixed, and 34 tests pass (3 new).

1. **Fixed.**
   - A job stops on any status other than `running`.
   - `run_checks` refuses to write the spec once the job is no longer running.
   - A failure no longer overwrites a stopped or rejected status.
   - Reject and retry return 409 while the worker still holds the job.
2. **Fixed, differently from the suggestion.**
   - The suggestion was to refuse approval when the file differs from the draft. Reviews fix errors by editing that file, so that rule would block every reviewed draft.
   - Instead, approval moves the job to `approving` in one SQL statement, so a second click gets a 409.
   - A failed build moves the job back, and so does a restart.
   - The approval event records `editedAfterDraft`.
3. **Fixed.**
   - Every build runs with a minimal environment: PATH, HOME, LANG, TMPDIR, JAVA_HOME and LEARNNOW_UI only.
   - On macOS it also runs under `sandbox-exec`: no network, and writes only to the content repo and the temp folders.
   - A probe confirmed that the key is hidden, the network is blocked and writes to the home folder are refused.
   - The 5 paths with snippets and the SQL bank still build.
   - The deny-list also catches `from os import`, `os.environ`, `getenv`, `importlib`, `builtins` and the bare `compile(`. `re.compile` is still allowed.

The should-fix items and improvements below are not done.

## Must fix

1. **A rejected or stopped job can come back to life.**
   - Files: `agent.py:41-43`, `main.py:262`, `tools.py:363-370`.
   - The worker loop stops only on the status `"stopped"`, so a job rejected or paused mid-call keeps running. It rewrites the spec and ends as `needs_review`. The database meanwhile says `created_spec=0`, so the file is orphaned and blocks new jobs for that target.
   - Fix: stop on any status other than `running`, and refuse reject or retry for the job the worker is running.
2. **Approve builds whatever file is on disk, not the reviewed draft.**
   - File: `main.py:239-255`.
   - A double-click runs two write builds at once.
   - Fix: set an `approving` status atomically, re-render the draft and compare it with the file, and refuse if they differ.
3. **Model-written runnable snippets run with almost no sandbox.**
   - Files: `safety.py:20-33`, `tools.py:28-35`.
   - The deny-list misses `from os import system`, `os.environ`, and a split `importlib` name. The build gets the studio's full environment and network.
   - Fix: run the build with a minimal `env=`, and run snippets under `sandbox-exec` with no network and writes only to the temp dir.

## Should fix

4. **Some billed calls are never counted.**
   - Files: `agent.py:139-158, 194-195`.
   - A response whose tool arguments are not valid JSON is billed, but the provider raises before the usage is recorded.
   - Fix: attach the usage to the exception, or charge an estimate for each failed attempt.
5. **The fact-check call can pass silently.** An empty, truncated or non-JSON reply gives "0 concerns" (`agent.py:185-193`). Fix: show the draft as "not checked".
6. **The path prompt leaves out two build rules.** HTML snippets are always runnable and may not use `<script>`, `on*=` or outside links. TS snippets compile in strict mode with React typings (`prompts.py:220-229`).
7. **The `script` word range disagrees.** The tool schema says 50-110 words, while the prompt and the validator say 40-110 (`models.py:53, 231`).
8. **Picking up the next job is not atomic.** Use `UPDATE ... WHERE status='queued'` (`agent.py:48`).

## Improvements

- Reserve an estimated cost before each call, so the last call cannot overshoot the cap.
- After a crash, Continue skips jobs that were running. Show the reason, and let Continue resume them.
- Use one build lock, so an approve build and another job's checks don't run in the repo at the same time.
- Add tests for:
  - the approve, reject and retry endpoints, and their races with a running job;
  - a truncated review reply;
  - restart recovery;
  - attempts to get past the snippet screen.

## Verified fine

- `render.py` produces specs with repr only.
- Target names must be strict slugs.
- Reject deletes only a spec the job itself created, and only inside the content repo.
- A report's `new.path` is checked as a slug.
