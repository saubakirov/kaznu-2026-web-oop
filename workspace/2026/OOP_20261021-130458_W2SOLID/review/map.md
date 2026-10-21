# Map — "What must be true?"
> **Mindset:** Experienced newcomer. Understand the accepted result before judging it.
> **Test:** "Can I name the material claims, harms, boundaries, evidence identities and limits?"
> RF: [RF__OOP_20261021-130458_W2SOLID.md](../RF__OOP_20261021-130458_W2SOLID.md)
> TS: [TS__OOP_20261021-130458_W2SOLID.md](../TS__OOP_20261021-130458_W2SOLID.md)

## Understanding

The accepted result is a complete interactive Week 2 learning module ("SOLID & Dependency Injection") for the KazNU Web OOP mini-LMS platform. It adds structured lecture content (5 SOLID principles + DI with Mermaid diagrams), an 8-question quiz (10 pts), a refactoring practicum with monolith + test suite + reference solution (15 pts), a backend API (6 endpoints with SQLite persistence), and a frontend SPA section — all isolated from Week 1. The module extends the platform from 1/3 to 2/3 course coverage per NS1.

## Accepted Claims and Boundaries

| ID | Layer | Accepted claim / authority boundary | Risk or concrete harm | Affected behavior / dependencies | Relevant environment | Oracle / authority | Evidence identity (`subject@revision`, source) | Required? |
|---|---|---|---|---|---|---|---|---|
| C1 | VALUE | Content files `content/week2/{lecture,quiz,practice}.json` are complete, valid, no TODO/pass stubs | Students receive incomplete or placeholder material | Lecture rendering, quiz evaluation, practice validation | local filesystem, Python 3.13 | TS AC-1, HL §6 DoF-1 | `content/week2/*@b6edc95`, `pytest tests/test_content_week2.py` | yes |
| C2 | VALUE | 6 backend endpoints functional with SQLite persistence: quiz awards up to 10, practice up to 15, progress X/25 | Broken grading, lost scores | API routing, TopicProgress/Submission DB writes | FastAPI + SQLite, local | TS AC-2, HL §3.2 | `app/api/week2.py@b6edc95`, `pytest tests/test_api_week2.py` | yes |
| C3 | VALUE | Interactive SPA with tabs (Lecture, Quiz, Practice), Mermaid rendering, code editor, pytest output | Students cannot interact with Week 2 | Frontend navigation, JS modules, HTML elements | Browser + localhost:8000 | TS AC-3, HL §3.3 | `frontend/*@b6edc95`, `test_static_integration_week2` | yes |
| C4 | VALUE | Course overview updated: W2 subtitle correct, w2-t1/t2/t3 is_ready=True | Week 2 invisible in course overview | `GET /api/course/overview` | FastAPI | TS AC-4 | `app/api/course.py@b6edc95`, `test_api_course_overview_week2_ready` | yes |
| C5 | ASSURANCE | 36/36 tests pass, ruff clean, zero regressions (W1 + platform) | Hidden breakage in existing features | All test suites | pytest + ruff, Python 3.13, local | TS AC-5, HL §6 DoF-6 | `pytest tests/ -v@b6edc95`, `ruff check .@b6edc95` | yes |
| C6 | VALUE | Zero-build: no package.json, no node_modules | Violates NS2 and HL §7 P2 | Project dependency structure | filesystem | TS AC-3 M1, HL §7 P2, NS2 | `git ls-tree@b6edc95` | yes (mandatory) |
| C7 | VALUE | Monolith 50–80 lines with 3–4 SOLID violations; tests check contracts (isinstance/ABC), not names | Pedagogically flawed or fragile exercise | Student practice experience | RunnerService sandbox | TS AC-1, HL §7 P1, DoF-2/3 | `practice.json@b6edc95`, test_code in practice.json | yes |
| C8 | VALUE | Practice scoring: 15 pts all-or-nothing per TS AC-2 | Wrong grading scheme | TopicProgress score writes | SQLite | TS §6 guidance | `week2.py:161@b6edc95` | yes |
| C9 | VALUE | RunnerService timeout 5s for student code | Server hang on infinite loops | Backend stability | RunnerService sandbox | TS M4, HL §6 DoF-4 | `week2.py:138@b6edc95` | yes (safety) |
| C10 | VALUE | W2 isolated from W1: separate service, router, JS module | Regression risk to working W1 | W1 tests, frontend | codebase coupling | TS §3 P3, HL §7 P3 | `git diff@b6edc95` file list | yes |
| C11 | TRACE | Accounting: 11 VALUE files, 1429 LOC, within 12/1500 plan | Denominator breach | Trigger/escalation | git diff | TS §4 contract | `git diff --numstat a932abbe b6edc95` | yes |
| C12 | TRACE | Candidate b6edc95 is first tested impl commit before EV/RF | Wrong Candidate identity | Accepted-result identity | git log | TS §4 Candidate rule | `git log a932abbe..477e3aa` | yes |

## TS ↔ RF Alignment

| TS requirement | RF claim | Claim IDs | Aligned? |
|---|---|---|---|
| AC-1: Structured content in content/week2/ | RF §3 AC-1 ✓: lecture 5 sections + 3 diagrams, quiz 8q 10pts, practice with monolith/tests/reference | C1, C7 | ✅ |
| AC-2: Backend API 6 endpoints with persistence | RF §3 AC-2 ✓: all 6 endpoints, quiz 10pts, practice 15pts, progress X/25 | C2, C8, C9 | ✅ |
| AC-3: Interactive SPA Zero-build | RF §3 AC-3 ✓: W2 card clickable, tabs, Mermaid, code editor, Tab, pytest output | C3, C6 | ✅ |
| AC-4: Course overview updated | RF §3 AC-4 ✓: subtitle updated, w2-t1/t2/t3 is_ready=True | C4 | ✅ |
| AC-5: 36/36 tests, ruff clean, zero regressions | RF §3 AC-5 ✓: 36 passed in 12.56s, ruff clean | C5, C10 | ✅ |
| TS §4 Accounting contract | RF §1 accounting: 11 files, 1429 LOC, within bounds | C11, C12 | ✅ |

## Verification Selection

| Claim IDs | Planned check or reusable evidence | Why this depth | Known gap or limit |
|---|---|---|---|
| C1 | Run `pytest tests/test_content_week2.py -v` at Candidate; inspect JSON structure | Content completeness is core VALUE | none |
| C2, C8 | Run `pytest tests/test_api_week2.py -v` at Candidate; inspect scoring logic in week2.py | Grading correctness affects students | none |
| C3 | Inspect `test_static_integration_week2` result; read index.html for W2 section | SPA structure verified through static check | Visual rendering not independently tested (API-level only) |
| C4 | Inspect `test_api_course_overview_week2_ready` result | Low risk; single assertion | none |
| C5 | Run full `pytest tests/ -v` and `ruff check .` at Candidate b6edc95 | Regression gate | none |
| C6 | Check `Test-Path package.json` and `Test-Path node_modules` | Mandatory Zero-build boundary | none |
| C7 | Inspect monolith_code length and test_code for isinstance/ABC checks | Pedagogical quality + TS DoF-2/3 | Subjective pedagogical adequacy not machine-testable |
| C9 | Inspect `run_practice_check` call with `timeout=settings.runner_timeout` | Safety boundary | Default value inspection only; not stress-tested |
| C10 | Inspect git diff file list for W1 file modifications | Isolation | none |
| C11, C12 | Replay `git diff --numstat` and `git log` | Accounting integrity | none |

## Deviations from TS

1. **`frontend/css/styles.css` not modified:** TS planned 12 VALUE files; actual 11. RF §1 explains TS said "при необходимости" and existing styles are week-agnostic. This is an acknowledged minor deviation within TS allowance.

## Checkpoint

**Self-check:**
- [x] Read RF §§1–5, governing TS AC/DoF, HL purpose/principles, ONB and referenced predecessors?
- [x] Mapped every material accepted claim and the mandatory safety/security, authority and result-identity boundaries?
- [x] Bound each claim to affected behavior/dependencies, environment, oracle/authority and exact evidence identity?
- [x] Recorded a replayable verification selection and every known gap or limit?
- [x] Avoided classifying by filename, discrepancy count or artifact volume?

Stage complete: YES
