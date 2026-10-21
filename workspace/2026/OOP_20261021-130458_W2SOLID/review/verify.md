# Verify — "Do the material claims hold?"
> **Mindset:** Auditor. RF is a declaration, not a fact.
> **Test:** "Would the evidence establish this claim for this subject, revision and environment without RF?"
> Map: [map.md](map.md)

## Selection Argument

| Claim IDs | Risk / criticality | Affected behavior / dependencies | Environment | Oracle / authority | Evidence gap / limit | Selected verification and why |
|---|---|---|---|---|---|---|
| C1, C7 | High — incomplete content = failed pedagogy | Lecture/quiz/practice rendering, RunnerService validation | Python 3.13, local fs | TS AC-1, HL §7 P1, DoF-1/2/3 | none | Run content tests + inspect JSON structure + monolith length + test_code contracts |
| C2, C8 | High — wrong scoring harms students | API responses, SQLite writes | FastAPI + SQLite, local | TS AC-2 | none | Run API tests + inspect scoring logic |
| C3 | Medium — SPA usability | Frontend navigation, tab switching | Browser via API test proxy | TS AC-3 | Visual rendering gap (no browser test) | Run static integration test + inspect HTML |
| C4 | Low — single metadata update | Course overview API | FastAPI | TS AC-4 | none | Run overview test |
| C5 | High — regressions block platform | All existing tests | pytest + ruff, Python 3.13 | TS AC-5, HL §6 DoF-6 | none | Full test suite + ruff at Candidate |
| C6 | Mandatory — Zero-build boundary | Project deps | filesystem | TS AC-3, NS2, HL §7 P2 | none | Check file existence |
| C9 | Mandatory — safety | Backend stability | RunnerService | TS M4, HL §6 DoF-4 | Not stress-tested | Inspect timeout parameter |
| C10 | Medium — isolation | W1 tests | codebase coupling | TS §3 P3, HL §7 P3 | none | Inspect diff file list |
| C11, C12 | Required — accounting | Accepted-result identity | git | TS §4 | none | Replay git commands |

## Verification Log

### V1: C5 — Full test suite and lint at Candidate b6edc95
- **Accepted claim / authority:** All 36 tests pass, ruff clean
- **Subject tuple:** {full test suite, b6edc95, Python 3.13.5 / pytest 9.0.2 / Windows 11, TS AC-5, no new deps}
- **Action or evidence:** Checked out Candidate b6edc95; ran `python -m pytest tests/ -v`; ran `ruff check .`
- **Observed:** 36 passed in 15.31s (exit 0). Ruff: "All checks passed!" (exit 0). W1 tests: 7 passed. Platform: 10 passed. W2: 12 passed. Content W2: 3 passed.
- **Limit:** none
- **Result:** HOLDS

### V2: C1 — Content structure and completeness
- **Accepted claim / authority:** lecture 5 sections + 3 diagrams, quiz 8q/10pts, practice with monolith/tests/reference; no TODO/pass stubs
- **Subject tuple:** {content/week2/*.json, b6edc95, Python 3.13, TS AC-1, no deps}
- **Action or evidence:** Ran `test_content_files_structure` (checks JSON schema, section count, diagram types, no TODO/FIXME, monolith line count 30–100); verified quiz: 8 questions, 10 pts total; verified lecture: 5 sections, 3 diagrams (classDiagram, sequenceDiagram); read monolith_code — 73 lines with 4 marked SOLID violations; read test_code — 10 tests using isinstance/ABC/pytest.raises(TypeError)
- **Observed:** All checks passed. Content is complete, production-grade Russian text with code examples per SOLID principle.
- **Limit:** none
- **Result:** HOLDS

### V3: C7 — Monolith quality and test robustness
- **Accepted claim / authority:** Monolith 50–80 lines, 3–4 SOLID violations; tests check contracts not names
- **Subject tuple:** {practice.json monolith_code + test_code, b6edc95, TS AC-1/DoF-2/3, RunnerService}
- **Action or evidence:** Inspected monolith_code: 73 lines, documented violations (SRP: 4 responsibilities, OCP: if-elif cascade, DIP: hardcoded print/list). Inspected test_code: 10 tests use `issubclass(FareCalculator, ABC)`, `isinstance(standard, FareCalculator)`, `pytest.raises(TypeError)` for ABC instantiation, DI injection check via `processor._calculator is calculator`. No test checks class names as strings.
- **Observed:** Monolith is within 50–80 range (73 lines). Tests verify contracts through isinstance/ABC/DI-injection, not string matching on class names. Flawed solution test (`test_content_flawed_solution_runner`) correctly rejects code missing transfer discount.
- **Limit:** none
- **Result:** HOLDS

### V4: C2, C8 — Backend API and scoring
- **Accepted claim / authority:** 6 endpoints, quiz up to 10 pts, practice 15 all-or-nothing, persistence in TopicProgress
- **Subject tuple:** {app/api/week2.py + week2_content_service.py, b6edc95, FastAPI + SQLite, TS AC-2}
- **Action or evidence:** Inspected week2.py: 6 endpoint functions (get_lecture, get_quiz, submit_quiz, get_practice, submit_practice, get_progress). Quiz scoring: per-question points summed, stored via TopicProgress with week_number=2, topic_id="w2-quiz". Practice scoring: `earned_score = 15 if passed else 0` (line 161) — confirmed all-or-nothing. Progress: aggregates w2-quiz + w2-practice, total X/25. API tests: `test_api_week2_quiz_submit` asserts recorded_score=10; `test_api_week2_practice_submit_reference` asserts score=15; `test_api_week2_practice_submit_broken` asserts score=0.
- **Observed:** All 6 endpoints match TS specification. Scoring logic correct. Persistence confirmed via test assertions.
- **Limit:** none
- **Result:** HOLDS

### V5: C3 — SPA interface
- **Accepted claim / authority:** W2 card clickable, tabs (Lecture/Quiz/Practice), Mermaid, code editor, pytest output
- **Subject tuple:** {frontend/index.html + js/week2.js + js/api.js + js/app.js, b6edc95, API-level static test, TS AC-3}
- **Action or evidence:** `test_static_integration_week2` PASSED — checks HTML contains view-week2, w2-tab-btn-lecture, w2-tab-btn-quiz, w2-tab-btn-practice, w2-practice-code-editor. Inspected index.html diff: 148-line view-week2 section added with header, tabs, lecture/quiz/practice containers. JS: 586-line week2.js with loadWeek2Module(), tab switching, quiz submission, practice code editor with Tab handling.
- **Observed:** HTML structure and JS logic present. API functions for all 6 endpoints in api.js.
- **Limit:** No browser-level rendering test (visual verification gap — acceptable per TS "Gate: Визуальная проверка + API-тесты")
- **Result:** HOLDS

### V6: C4 — Course overview
- **Accepted claim / authority:** W2 subtitle = "Принципы SOLID и Dependency Injection", w2-t1/t2/t3 is_ready=True
- **Subject tuple:** {app/api/course.py, b6edc95, FastAPI, TS AC-4}
- **Action or evidence:** `test_api_course_overview_week2_ready` PASSED — asserts subtitle and 3 topics is_ready=True
- **Observed:** Matches TS requirement
- **Limit:** none
- **Result:** HOLDS

### V7: C6 — Zero-build boundary
- **Accepted claim / authority:** No package.json, no node_modules in project
- **Subject tuple:** {project root, b6edc95, filesystem, TS AC-3 / NS2 / HL §7 P2}
- **Action or evidence:** Ran `Test-Path package.json` → False; `Test-Path node_modules` → False
- **Observed:** Neither exists
- **Limit:** none
- **Result:** HOLDS

### V8: C9 — RunnerService timeout safety
- **Accepted claim / authority:** Student code execution bounded by timeout
- **Subject tuple:** {app/api/week2.py:138, b6edc95, RunnerService, TS M4 / HL §6 DoF-4}
- **Action or evidence:** Inspected `run_practice_check` call: `timeout=settings.runner_timeout`. RunnerService `test_runner_timeout_infinite_loop` PASSED at Candidate. Default runner_timeout = 5s per config.
- **Observed:** Timeout correctly propagated. Infinite loop test confirms enforcement.
- **Limit:** Production timeout value from settings, not hardcoded — depends on config correctness
- **Result:** HOLDS

### V9: C10 — W1 isolation
- **Accepted claim / authority:** W2 isolated from W1 — separate service, router, JS module
- **Subject tuple:** {git diff a932abbe b6edc95, file list, TS §3 P3}
- **Action or evidence:** `git diff --name-status`: 11 files changed. New W2 files: 7 (content/week2/*, week2_content_service.py, week2.py, week2.js). Modified shared files: app/main.py (2 lines: import + include_router), app/api/course.py (metadata), frontend/index.html (new section), frontend/js/api.js (new functions), frontend/js/app.js (navigation). No W1-specific files modified. All 7 W1 tests pass.
- **Observed:** Isolation maintained. Shared file changes are additive (new router, new HTML section, new JS functions). No W1 logic touched.
- **Limit:** none
- **Result:** HOLDS

### V10: C11, C12 — Accounting replay
- **Accepted claim / authority:** 11 VALUE files, 1429 LOC (1413+16), Candidate b6edc95 is first tested impl commit
- **Subject tuple:** {git diff/log, a932abbe..b6edc95..477e3aa, TS §4}
- **Action or evidence:** `git diff --numstat a932abbe b6edc95 -- content/week2 app frontend`: 11 files, 1413 additions + 16 deletions = 1429 touched LOC. `git log a932abbe..477e3aa`: commits 0141bd1 (backend), ddd4847 (frontend), b6edc95 (tests) — b6edc95 is the last VALUE+ASSURANCE commit before 477e3aa (RF/EV/state). Plan: 12 files / 1500 LOC. Actual: 11 files / 1429 LOC — within bounds. Multiplier 2 → upper 24 files / 3000 LOC; no trigger.
- **Observed:** RF accounting matches independent replay exactly. Candidate identity correct.
- **Limit:** none
- **Result:** HOLDS

## Commands Executed

| # | Command | Claim IDs | Result |
|---|---|---|---|
| 1 | `git checkout b6edc95 --detach` | all | Candidate checkout successful |
| 2 | `python -m pytest tests/ -v` | C1–C5, C7–C10 | 36 passed in 15.31s |
| 3 | `ruff check .` | C5 | All checks passed! |
| 4 | `git diff --name-status a932abbe b6edc95 -- content/week2 app frontend` | C10, C11 | 11 files (7A + 4M) |
| 5 | `git diff --numstat a932abbe b6edc95 -- content/week2 app frontend` | C11 | 1413+16=1429 LOC |
| 6 | `git log --oneline a932abbe..477e3aa` | C12 | 8 commits; b6edc95 is last impl |
| 7 | `git diff --stat b6edc95 477e3aa` | C12 | 4 files (EV, RF, journal, status) — trace only |
| 8 | `Test-Path package.json; Test-Path node_modules` | C6 | False; False |
| 9 | `python -c "quiz: 8 questions, 10 pts"` | C1 | Confirmed |
| 10 | `python -c "lecture: 5 sections, 3 diagrams"` | C1 | Confirmed |
| 11 | `git show --stat 0141bd1; git show --stat ddd4847; git show --stat b6edc95` | C12 | Clean staging: each commit contains its logical slice |

No added TODO, FIXME, legacy, temp or other channel words found in VALUE diff content.

## Claim and Source Checks

| # | Claim / citation | Where | Primary artifact / source | Holds? |
|---|---|---|---|---|
| C1 | "5 sections, 3 diagrams" | RF §1, §3 AC-1 | `content/week2/lecture.json` — 5 sections, 3 diagrams confirmed | ✅ |
| C2 | "8 questions, 10 pts" | RF §3 AC-1 | `content/week2/quiz.json` — 8 questions, sum=10 confirmed | ✅ |
| C3 | "monolith 73 lines" | RF §1 new files | `practice.json monolith_code` — 73 lines confirmed | ✅ |
| C4 | "10 tests in test_code" | RF §1 new files | `practice.json test_code` — 10 test functions confirmed | ✅ |
| C5 | "36 passed in 12.56s" | RF §4 | `pytest tests/ -v` — 36 passed in 15.31s (duration varies, count matches) | ✅ |
| C6 | "6/6 VERIFIED" | RF §5 | EV file lists 6 rows, all VERIFIED | ✅ |

## Guard and Check Admission

| # | Kind | Protected behavior / invariant | Failure consequence | Counterfactual detection | Admission |
|---|---|---|---|---|---|
| G1 | permanent guard | ABC cannot be instantiated (test_srp_fare_calculator_is_abstract) | Students bypass interface contracts | `pytest.raises(TypeError)` on ABC() — demonstrates red on violation | admitted |
| G2 | permanent guard | Flawed solution rejected (test_content_flawed_solution_runner) | Platform accepts broken solutions | Flawed code missing transfer discount → tests fail → passed=False | admitted |
| G3 | permanent guard | Infinite loop timeout (test_runner_timeout_infinite_loop) | Server hangs | `while True: pass` code times out after 5s | admitted |
| G4 | positive control | Reference solution passes (test_content_reference_solution_runner) | Confirms test suite validity | 10/10 tests pass on known-good code | labelled control |

## Candidate Findings

No findings.

## Evidence Verification

| # | EV row | Subject tuple | Repeated or opened? | Establishes the claim? | Limit |
|---|---|---|---|---|---|
| E1 | AC-1 content | {content/week2/*.json, b6edc95, local, TS AC-1} | ✅ repeated (V2) | ✅ | none |
| E2 | AC-2 API | {app/api/week2.py, b6edc95, local, TS AC-2} | ✅ repeated (V4) | ✅ | none |
| E3 | AC-3 SPA | {frontend/*, b6edc95, local, TS AC-3} | ✅ repeated (V5) | ✅ | visual gap accepted |
| E4 | AC-4 overview | {course.py, b6edc95, local, TS AC-4} | ✅ repeated (V6) | ✅ | none |
| E5 | AC-5 regression | {tests/*, b6edc95, local, TS AC-5} | ✅ repeated (V1) | ✅ | none |
| E-accounting | TS §4 | {git diff, a932abbe→b6edc95, local, TS §4} | ✅ repeated (V10) | ✅ | none |

## Knowledge Citations Verified

| # | Artifact | Priority + exact citation | Resolves? | Item exists? | Meaning matches? | Relevant? |
|---|---|---|---|---|---|---|
| 1 | HL §7.2 #1 | P0: README.md NS1 — interactive mini-course 2–3 weeks | ✅ | ✅ | ✅ — W2 extends to 2 weeks | ✅ — directly served |
| 2 | HL §7.2 #2 | P0: README.md NS2 — AI-friendly, Zero-build, Local-first | ✅ | ✅ | ✅ — no npm, CDN only | ✅ — Zero-build verified |
| 3 | HL §7.2 #3 | P0: README.md NS3 — Non-goals | ✅ | ✅ | ✅ — no microservices | ✅ — scope respected |
| 4 | HL §7.2 #4 | P1: .tfw/README.md Methodology values | ✅ | ✅ | ✅ — strict TFW roles | ✅ |
| 5 | HL §7.2 #5 | P3: KNOWLEDGE.md §1 D1 (Stack) | ✅ | ✅ | ✅ — FastAPI, Tailwind, Vanilla JS, Mermaid | ✅ |
| 6 | HL §7.2 #6 | P3: KNOWLEDGE.md §1 D4 (Persistence) | ✅ | ✅ | ✅ — TopicProgress/Submission used with week_number=2 | ✅ |
| 7 | HL §7.2 #7 | P3: KNOWLEDGE.md §1 D6 (RunnerService) | ✅ | ✅ | ✅ — test_solid_w2.py via RunnerService timeout 5s | ✅ |
| 8 | HL §7.2 #8 | P3: KNOWLEDGE.md §1 D7 (W1 module) | ✅ | ✅ | ✅ — pattern replicated for W2 | ✅ |
| 9 | HL §7.2 #9 | P7: REC-20261014-01 W1 architecture | ✅ | ✅ | ✅ — isolated service/router/JS pattern | ✅ |

## Accounting Replay

| Approval / authority | Baseline | Candidate | Literal VALUE membership / actions / classes / reasons | Adds | Deletes | Touched LOC | Binary | Trigger disposition | Exact NUL-safe command | Verdict |
|---|---|---|---|---:|---:|---:|---|---|---|---|
| TS @ a932abbe approved pre-work | a932abbe108d | b6edc95 | content/week2/lecture.json (A, VALUE, lecture); content/week2/quiz.json (A, VALUE, quiz); content/week2/practice.json (A, VALUE, practice); app/services/week2_content_service.py (A, VALUE, service); app/api/week2.py (A, VALUE, router); app/main.py (M, VALUE, registration); app/api/course.py (M, VALUE, metadata); frontend/index.html (M, VALUE, HTML); frontend/js/api.js (M, VALUE, API functions); frontend/js/week2.js (A, VALUE, JS module); frontend/js/app.js (M, VALUE, navigation) | 1413 | 16 | 1429 | N/A | 11 files < 50 trigger; 1429 LOC < 5000 trigger; terminal | `git diff --numstat --find-renames=50% -z a932abbe b6edc95 -- content/week2 app frontend` | VERIFIED |

## Selected Knowledge Evidence

Dispatch: journal/20261021-132000__dispatch__i9j0.md → Executor subagent 690fe91d dispatched by task Coordinator 822e3e77. Governing: HL @ a932abb, TS @ 72317bb. Source: owner-direct. Continuation: Executor subagent completed at b6edc95; RF written at 477e3aa.

## Checkpoint

**Self-check:**
- [x] Replayed the Map selection and verified all mandatory safety/security, authority and identity floors?
- [x] Established evidence applicability and ran every TS-required or dependency-affected check?
- [x] Recorded explicit limits instead of substituting file, discrepancy, test, commit or artifact counts?
- [x] Classified guards and controls by protected behavior, consequence and counterfactual detection?
- [x] Recorded every candidate finding with the complete item contract and material consequence test?
- [x] Verified RF AC claims, evidence references, citations and immutable accounting against actual artifacts?

Stage complete: YES
