# Verify — "Do the material claims hold?"
> **Mindset:** Auditor. RF is a declaration, not a fact. Open files, run necessary checks, compare
> accepted claims with reality, and state the limits.
> **Test:** "Would the evidence establish this claim for this subject, revision and environment without RF?"
> Map: [map.md](map.md)

## Selection Argument

| Claim IDs | Risk / criticality | Affected behavior / dependencies | Environment | Oracle / authority | Evidence gap / limit | Selected verification and why |
|---|---|---|---|---|---|---|
| C1 | High (core curriculum) | `content/week3/*.json`, `ContentService` | Python 3.13, local filesystem | TS §5 AC-1, HL §5 DoD 1-4 | None | Independent inspection of JSON files, schema structure, points sum (10 pts quiz, 15 pts practice), Mermaid diagrams, and reference solution execution via `RunnerService` |
| C2 | High (REST API & persistence) | `app/api/week3.py`, `TopicProgress`, `Submission`, `LectureRead` | FastAPI, SQLite3, TestClient | TS §5 AC-2, HL §5 DoD 5 | None | Execution of `pytest tests/test_api_week3.py -v` (11 tests), code review of endpoint routing, status codes, and high-watermark DB logic |
| C3 | Medium (course-wide progress) | `app/api/progress.py`, `app/api/course.py` | FastAPI, SQLite3 | TS §5 AC-3, HL §5 DoD 6-7 | None | Execution of `pytest tests/test_progress.py` and `tests/test_api_week3.py::test_api_progress_summary_total_max_70`, ensuring course max equals 70 |
| C4 | Medium (frontend UI) | `frontend/index.html`, `frontend/js/week3.js`, `frontend/js/api.js`, `frontend/js/app.js` | Browser DOM, Vanilla JS, Tailwind CDN, Mermaid | Automated browser rendering test not in headless CLI | Code review of event binding, tab management, Mermaid render fallback, and execution of `test_static_integration_week3` |
| C5 | High (quality & non-regression) | Full project test suite, codebase formatting | Local CLI (`pytest 9.0.2`, `ruff 0.8.4`) | TS §5 AC-5, HL §5 DoD 9-10 | None | Execution of clean-state `pytest` (58/58 passed) and `ruff check .` (0 errors) |
| C6 | High (accounting & authority) | Git commits, branch `main`, VALUE selector | Git CLI | TS §4, RF §1, conventions.md | None | Execution of NUL-safe diff `git diff --stat ff01b01a ea558a7 -- <VALUE paths>` verifying 11 files / 1322 touched LOC |
| C7 | Critical (mandatory security & architecture) | `RunnerService` AST sandbox, project root dependencies | Python ast, subprocess, `pyproject.toml` | HL §6 DoF 4 & 6, TS §7 DoF 4 & 6 | None | Verification of AST security visitor, timeout enforcement (5s), and absence of npm/Node.js files in project |

## Verification Log

### V1: Claim C1 — Educational Content Week 3 (`content/week3/`)
- **Accepted claim / authority:** `content/week3/` contains valid, complete JSON files for lecture, quiz, and practice without placeholders.
- **Subject tuple:** `{content/week3/*.json, Candidate ea558a7, Windows/Python 3.13, TS §5 AC-1, clean}`
- **Action or evidence:** Inspected `content/week3/lecture.json`, `quiz.json`, and `practice.json`. Ran `pytest tests/test_content_week3.py -v`.
- **Observed:**
  - `lecture.json` contains 4 complete sections (Creational: Factory Method & Builder; Structural: Adapter, Decorator, Facade; Behavioral: Chain of Responsibility, Strategy, Observer; Clean Architecture & Dependency Rule) and 2 interactive Mermaid diagrams (`classDiagram` and `sequenceDiagram`).
  - `quiz.json` contains 8 questions with weights summing to exactly 10 points (`1+1+1+1+2+1+1+2=10`) and comprehensive pedagogical explanations.
  - `practice.json` contains an Avtobys payment integration lab (`KaspiBankProtocol`, `PaymentProcessor`, `KaspiBankAdapter`, `TransactionDecorator`, `AuditLoggingDecorator`, `ValidationHandler`, `StopListHandler`, `LimitCheckHandler`, `build_payment_system`), starter code, 12 pytest assertions for 15 points, and a fully working reference solution.
  - All 3 tests in `tests/test_content_week3.py` passed in 2.21s.
- **Limit:** None.
- **Result:** HOLDS

### V2: Claim C2 — REST API Endpoints (`app/api/week3.py`)
- **Accepted claim / authority:** `app/api/week3.py` exposes 8 endpoints with high-watermark persistence in SQLite and is registered in `app/main.py`.
- **Subject tuple:** `{app/api/week3.py, Candidate ea558a7, FastAPI/SQLite3, TS §5 AC-2, clean}`
- **Action or evidence:** Executed `pytest tests/test_api_week3.py -v` (11 tests) and inspected `app/api/week3.py`.
- **Observed:**
  - Endpoints `GET /api/week3/lecture`, `GET /api/week3/quiz` (masked answers), `POST /api/week3/quiz/submit` (score up to 10), `GET /api/week3/practice`, `POST /api/week3/practice/submit` (RunnerService sandbox, submission record, score up to 15), `GET /api/week3/progress`, `POST /api/week3/lecture/mark-read`, `GET /api/week3/lecture/read-status` all function with correct HTTP 200 responses.
  - SQLite persistence correctly implements high watermark for `TopicProgress` (higher score overwrites, lower score preserves existing best score).
  - All 11 tests in `tests/test_api_week3.py` passed in 2.42s.
- **Limit:** None.
- **Result:** HOLDS

### V3: Claim C3 — Global Progress & Course Overview Integration
- **Accepted claim / authority:** Week 3 is integrated into `WEEK_CONFIG` (`app/api/progress.py`), raising max points to 70; `app/api/course.py` marks Week 3 `ready_for_content` (`is_ready: True`).
- **Subject tuple:** `{app/api/progress.py, app/api/course.py, Candidate ea558a7, FastAPI/SQLite3, TS §5 AC-3, clean}`
- **Action or evidence:** Executed `pytest tests/test_progress.py -v` and `pytest tests/test_api_week3.py -k "overview or summary" -v`.
- **Observed:**
  - `/api/progress/summary` returns 3 weeks with `total_max: 70`.
  - `/api/course/overview` reports `status: "ready_for_content"` and all 3 topics with `is_ready: True`.
  - Export endpoint `/api/progress/export` successfully formats Week 3 progress alongside Weeks 1 and 2.
- **Limit:** None.
- **Result:** HOLDS

### V4: Claim C4 — Zero-Build Frontend Interface
- **Accepted claim / authority:** Interactive client in `frontend/` provides tab navigation, Mermaid rendering, quiz flow, code editor, and sandbox runner without npm build steps.
- **Subject tuple:** `{frontend/*, Candidate ea558a7, Browser DOM/ES modules, TS §5 AC-4, clean}`
- **Action or evidence:** Inspected `frontend/index.html`, `frontend/js/week3.js`, `frontend/js/api.js`, and `frontend/js/app.js`. Executed `tests/test_api_week3.py::test_static_integration_week3`.
- **Observed:**
  - `#view-week3` contains tabs for Lecture, Quiz, and Practice.
  - Mermaid integration handles asynchronous rendering with fallback to styled code block on failure.
  - Practice code editor supports Tab indentation and streams results from the RunnerService into a terminal container.
  - Pure Vanilla JS ES modules and CDN scripts; no `node_modules`, `package.json`, or build tools.
- **Limit:** Headless CLI does not execute full WebKit/Blink render engine; static DOM elements and client logic audited.
- **Result:** HOLDS

### V5: Claim C5 — Quality & Absence of Regressions
- **Accepted claim / authority:** Full project test suite passes 100% on clean state; linter reports zero issues.
- **Subject tuple:** `{repository, Candidate ea558a7, pytest 9.0.2 / ruff 0.8.4, TS §5 AC-5, clean}`
- **Action or evidence:** Executed `ruff check .` and clean-state `python -m pytest`.
- **Observed:**
  - `ruff check .` -> `All checks passed!`
  - `pytest` -> `58 passed in 14.78s` (100% pass across all modules: health, week1, week2, week3, db, progress, runner, smoke).
  - Note: previous local SQLite database file `data/web_oop.db` had residual test student record from development, causing single collision in `test_lecture_read.py`; upon clean state reset, all 58 tests pass deterministically. Week 3 tests properly isolate usernames using UUIDs.
- **Limit:** None.
- **Result:** HOLDS

### V6: Claim C6 & C7 — Accounting, Authority & Mandatory Boundaries
- **Accepted claim / authority:** Commit `ea558a7` is reachable Candidate; VALUE diff matches TS §4; AST sandbox enforces security; zero-build boundary preserved.
- **Subject tuple:** `{git, Candidate ea558a7, pyproject.toml / runner.py, TS §4 & §7, clean}`
- **Action or evidence:** Inspected git history, ran VALUE diff stat, inspected `app/services/runner.py` and project root.
- **Observed:**
  - Git diff for VALUE selector yields exactly 11 files, 1311 additions, 11 deletions (1322 touched LOC), within planned ~1200–1600 LOC.
  - Candidate commit `ea558a7` was committed with exact paths and tested before EV/RF generation.
  - `RunnerService` enforces AST security via `SecurityVisitor`, banning dangerous modules and builtins; runs in temporary isolated directory with 5-second timeout.
  - No npm artifacts or foreign dependencies exist in workspace.
- **Limit:** None.
- **Result:** HOLDS

## Commands Executed

| # | Command | Claim IDs | Result |
|---|---|---|---|
| 1 | `git diff --stat ff01b01a ea558a7 -- content/week3 app/api/week3.py app/main.py app/api/progress.py app/api/course.py frontend` | C6 | Exit 0: 11 files changed, 1311 insertions(+), 11 deletions(-) = 1322 touched LOC |
| 2 | `python -m pytest` (clean DB state) | C5 | Exit 0: 58 passed in 14.78s (100% pass) |
| 3 | `ruff check .` | C5 | Exit 0: All checks passed! |
| 4 | `python -m pytest tests/test_content_week3.py tests/test_api_week3.py -v` | C1, C2, C4 | Exit 0: 14 passed in 4.63s |
| 5 | `python -m pytest tests/test_progress.py -v` | C3 | Exit 0: 3 passed in 1.16s |
| 6 | `git diff ff01b01a ea558a7 -- <VALUE paths> \| Select-String -Pattern "(?i)(todo\|legacy\|temp\|fixme)"` | C1 | Exit 0: Only valid `# TODO` instructions inside `starter_code` for students |

## Claim and Source Checks

| # | Claim / citation | Where | Primary artifact / source | Holds? |
|---|---|---|---|---|
| C1 | Lecture has 4 sections and 2 Mermaid diagrams | `content/week3/lecture.json` | `content/week3/lecture.json` | ✅ Holds |
| C2 | Quiz has 8 questions with total weight 10 points | `content/week3/quiz.json` | `content/week3/quiz.json` | ✅ Holds |
| C3 | Practice has 15 points, Avtobys scenario, reference solution | `content/week3/practice.json` | `content/week3/practice.json` | ✅ Holds |
| C4 | Reference solution passes practice tests in RunnerService | `tests/test_content_week3.py` | `RunnerService` execution | ✅ Holds |
| C5 | Flawed solution is rejected by practice test suite | `tests/test_content_week3.py` | `test_content_flawed_solution_runner` | ✅ Holds |
| C6 | API Week 3 has 8 working endpoints with high-watermark persistence | `app/api/week3.py` | `tests/test_api_week3.py` | ✅ Holds |
| C7 | Global progress reaches total_max = 70 across 3 weeks | `app/api/progress.py` | `tests/test_progress.py` | ✅ Holds |
| C8 | Course overview reports Week 3 as ready_for_content | `app/api/course.py` | `app/api/course.py` | ✅ Holds |

## Guard and Check Admission

| # | Kind | Protected behavior / invariant | Failure consequence | Counterfactual detection | Admission |
|---|---|---|---|---|---|
| G1 | Permanent guard | `test_content_flawed_solution_runner` | Accepting broken/incomplete student code in practice lab | Demonstrated: flawed code missing amount check, logging, and stop-list validation is rejected (`passed: False`, `status: 'failed'`) | Admitted |
| G2 | Permanent guard | `test_content_reference_solution_runner` | Valid student code fails in official test suite | Demonstrated: full reference solution passes 12/12 assertions in `RunnerService` sandbox | Admitted |
| G3 | Permanent guard | `test_api_week3_practice_submit_broken` | API reports success or awards points for failing code | Demonstrated: invalid code returns `passed: False`, `score: 0` | Admitted |
| G4 | Permanent guard | `test_api_week3_quiz_submit` | Incomplete/incorrect quiz answers awarded undeserved points | Demonstrated: full quiz evaluation validates score calculation and passes only on complete correct submission | Admitted |
| G5 | Governance assertion | VALUE accounting verification (11 files / 1322 LOC) | Undocumented or uncontrolled scope creep | Scope arithmetic check against TS denominator | Admitted (governance only) |

## Candidate Findings

No findings.

All material accepted claims are established by adequate, reproducible, and verifiable evidence.

## Evidence Verification

| # | EV row | Subject tuple | Repeated or opened? | Establishes the claim? | Limit |
|---|---|---|---|---|---|
| E1 | E1 (AC-1) | `{content/week3/*, Candidate ea558a7, Python 3.13, TS §5 AC-1, clean}` | Repeated (`pytest tests/test_content_week3.py -v`) | ✅ Yes (3/3 tests pass, reference solution verified in sandbox) | None |
| E2 | E2 (AC-2) | `{app/api/week3.py, Candidate ea558a7, FastAPI/SQLite3, TS §5 AC-2, clean}` | Repeated (`pytest tests/test_api_week3.py -v`) | ✅ Yes (11/11 tests pass, all 8 endpoints verified) | None |
| E3 | E3 (AC-3) | `{app/api/progress.py, app/api/course.py, Candidate ea558a7, FastAPI, TS §5 AC-3, clean}` | Repeated (`pytest tests/test_progress.py` + overview test) | ✅ Yes (70 max points verified) | None |
| E4 | E4 (AC-4) | `{frontend/*, Candidate ea558a7, DOM/Vanilla JS, TS §5 AC-4, clean}` | Repeated (`test_static_integration_week3` + inspection) | ✅ Yes (layout, tabs, api methods verified) | Headless DOM limit noted |
| E5 | E5 (AC-5) | `{repository, Candidate ea558a7, pytest/ruff, TS §5 AC-5, clean}` | Repeated (`ruff check .` && `pytest`) | ✅ Yes (58/58 passed, 0 lint errors) | None |
| E6 | E-accounting | `{git, Candidate ea558a7, Git CLI, TS §4, clean}` | Repeated (`git diff --stat`) | ✅ Yes (11 files, 1322 LOC touched) | None |

## Knowledge Citations Verified

| # | Artifact | Priority + exact citation | Resolves? | Item exists? | Meaning matches? | Relevant? |
|---|---|---|---|---|---|---|
| 1 | HL §7.2 #1 | P0: `README.md` NS1 | ✅ Yes | ✅ Yes (anchor `#ns1`) | ✅ Matches (2–3 week mini-course) | ✅ Directly relevant (completes Week 3 cycle) |
| 2 | HL §7.2 #2 | P0: `README.md` NS2 | ✅ Yes | ✅ Yes (anchor `#ns2`) | ✅ Matches (AI-friendly, zero-build, local-first) | ✅ Directly relevant (no npm, clean typed Python) |
| 3 | HL §7.2 #3 | P0: `README.md` NS3 | ✅ Yes | ✅ Yes (anchor `#ns3`) | ✅ Matches (Non-goals: no microservices/over-engineering) | ✅ Directly relevant (monolithic FastAPI + SQLite) |
| 4 | HL §7.2 #4 | P1: `.tfw/README.md` Methodology values | ✅ Yes | ✅ Yes (§ Methodology values) | ✅ Matches (Candor, Structural Enforcement, Portability) | ✅ Directly relevant (TFW gate compliance) |
| 5 | HL §7.2 #5 | P3: `KNOWLEDGE.md` §1 D1 | ✅ Yes | ✅ Yes (Decision D1) | ✅ Matches (FastAPI, Tailwind CDN, Vanilla JS, Mermaid) | ✅ Directly relevant (stack used for Week 3) |
| 6 | HL §7.2 #6 | P3: `KNOWLEDGE.md` §1 D4 | ✅ Yes | ✅ Yes (Decision D4) | ✅ Matches (SQLAlchemy SQLite persistence) | ✅ Directly relevant (`TopicProgress`, `Submission`, `LectureRead`) |
| 7 | HL §7.2 #7 | P3: `KNOWLEDGE.md` §1 D6 | ✅ Yes | ✅ Yes (Decision D6) | ✅ Matches (RunnerService sandbox AST security) | ✅ Directly relevant (practice runner check) |
| 8 | HL §7.2 #8 | P3: `KNOWLEDGE.md` §1 D7, D8 | ✅ Yes | ✅ Yes (Decisions D7, D8) | ✅ Matches (JSON storage pattern for weeks 1 and 2) | ✅ Directly relevant (reused for week 3) |
| 9 | HL §7.2 #9 | P3: `KNOWLEDGE.md` §1 D9 | ✅ Yes | ✅ Yes (Decision D9) | ✅ Matches (Parametric `ContentService(week_number)`) | ✅ Directly relevant (`get_content_service(3)` used) |
| 10 | HL §7.2 #10 | P4: `conventions.md` HL Contract, Design Rules | ✅ Yes | ✅ Yes (headings exist) | ✅ Matches (High Level contract & design rules) | ✅ Directly relevant (structural adherence) |

## Accounting Replay

| Approval / authority | Baseline | Candidate | Literal VALUE membership / actions / classes / reasons | Adds | Deletes | Touched LOC | Binary | Trigger disposition | Exact NUL-safe command | Verdict |
|---|---|---|---|---:|---:|---:|---|---|---|---|
| TS approval `66b0964` | `ff01b01a` | `ea558a7` | 11 files: `content/week3/lecture.json` (CREATE), `content/week3/quiz.json` (CREATE), `content/week3/practice.json` (CREATE), `app/api/week3.py` (CREATE), `app/main.py` (MODIFY), `app/api/progress.py` (MODIFY), `app/api/course.py` (MODIFY), `frontend/index.html` (MODIFY), `frontend/js/api.js` (MODIFY), `frontend/js/week3.js` (CREATE), `frontend/js/app.js` (MODIFY) | 1311 | 11 | 1322 | N/A (0) | Below triggers (11 < 50 files; 1322 < 5000 LOC); Denominator: 11 / 1400 LOC; Ceiling: 22 / 2800 LOC | `git diff --stat ff01b01a ea558a7 -- content/week3 app/api/week3.py app/main.py app/api/progress.py app/api/course.py frontend` | VERIFIED |

## Selected Knowledge Evidence

- Executor unit `antigravity:thread:local:38b7baa3-c494-4734-9d8b-db2e5b9a248b` delivered Candidate `ea558a7` under valid dispatch authority from Coordinator `antigravity:thread:local:702f85ed-f789-4634-9f51-44a6027572af`.
- Lineage is unbroken: Baseline `ff01b01a` -> TS approval `66b0964` -> ONB `9117d6b` -> Candidate `ea558a7` -> EV/RF `feee079` -> status transition `50399f9`.
- No out-of-band changes or unrecorded commits detected.

## Checkpoint

**Self-check:**
- [x] Replayed the Map selection and verified all mandatory safety/security, authority and identity floors?
- [x] Established evidence applicability and ran every TS-required or dependency-affected check?
- [x] Recorded explicit limits instead of substituting file, discrepancy, test, commit or artifact counts?
- [x] Classified guards and controls by protected behavior, consequence and counterfactual detection?
- [x] Recorded every candidate finding with the complete item contract and material consequence test?
- [x] Verified RF AC claims, evidence references, citations and immutable accounting against actual artifacts?

Stage complete: YES
