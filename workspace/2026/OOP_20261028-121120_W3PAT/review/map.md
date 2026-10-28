# Map — "What must be true?"
> **Mindset:** Experienced newcomer. Understand the accepted result before judging it.
> **Test:** "Can I name the material claims, harms, boundaries, evidence identities and limits?"
> RF: [RF__OOP_20261028-121120_W3PAT.md](../RF__OOP_20261028-121120_W3PAT.md)
> TS: [TS__OOP_20261028-121120_W3PAT.md](../TS__OOP_20261028-121120_W3PAT.md)

## Understanding

The accepted result delivers the complete educational module for Week 3: "GoF Design Patterns and Clean Architecture" for the 2nd year KazNU OOP course. It comprises educational JSON content (`lecture.json` with 4 topics and 2 Mermaid diagrams, `quiz.json` with 8 questions totaling 10 points, `practice.json` with 15-point automated lab), a dedicated FastAPI router (`app/api/week3.py`), integration into the global course progress (`WEEK_CONFIG` expanding total points to 70), updated course overview metadata, and a zero-build client interface (`frontend/js/week3.js` and `#view-week3` in `index.html`). The implementation is verified through comprehensive API and content test suites, with no regressions across existing Week 1 and Week 2 functionality.

## Accepted Claims and Boundaries

Map the result before selecting checks. Safety/security, human acceptance authority and
accepted-result identity are mandatory even when no ordinary claim sample selects them.

| ID | Layer | Accepted claim / authority boundary | Risk or concrete harm | Affected behavior / dependencies | Relevant environment | Oracle / authority | Evidence identity (`subject@revision`, source) | Required? |
|---|---|---|---|---|---|---|---|---|
| C1 | VALUE | `content/week3/` contains valid `lecture.json` (4 topics, 2 Mermaid diagrams), `quiz.json` (8 questions, 10 pts, explanations), and `practice.json` (Avtobys domain, skeleton, reference solution, 15 pt pytest suite) | Invalid course content, missing diagrams, or broken lab checks prevent student learning | Content loading, `ContentService`, lab evaluation | Python 3.13, local filesystem | TS §5 AC-1, HL §5 DoD 1-4 | `content/week3/*@ea558a7`, `tests/test_content_week3.py` | yes |
| C2 | VALUE | `app/api/week3.py` implements 8 REST endpoints for lecture, quiz, practice, and progress with high-watermark persistence in SQLite | Progress lost, high score overwritten, or endpoints fail under student submissions | FastAPI router, `TopicProgress`, `Submission`, `LectureRead` models | FastAPI, SQLite3, Uvicorn | TS §5 AC-2, HL §5 DoD 5 | `app/api/week3.py@ea558a7`, `tests/test_api_week3.py` | yes |
| C3 | VALUE | Global progress system in `app/api/progress.py` (`WEEK_CONFIG`) aggregates 3 weeks (total 70 pts); `app/api/course.py` marks Week 3 `ready_for_content` (`is_ready: True`) | Student progress reports cap at 45 pts, or course dashboard hides Week 3 | `/api/progress/summary`, `/api/progress/export`, `/api/course/overview` | FastAPI, SQLite3 | TS §5 AC-3, HL §5 DoD 6-7 | `app/api/progress.py@ea558a7`, `app/api/course.py@ea558a7` | yes |
| C4 | VALUE | Frontend zero-build SPA in `frontend/` provides `#view-week3` tabs, Mermaid rendering, quiz flow with feedback, code editor, and sandbox runner terminal | UI breaks, tabs fail to switch, diagrams do not render, or student cannot submit practice | `frontend/index.html`, `frontend/js/week3.js`, `frontend/js/api.js`, `frontend/js/app.js` | Browser DOM, Vanilla JS ES modules, Tailwind CDN, Mermaid CDN | TS §5 AC-4, HL §5 DoD 8, HL §7 P2 | `frontend/*@ea558a7`, `tests/test_api_week3.py::test_static_integration_week3` | yes |
| C5 | ASSURANCE | Test suites `tests/test_api_week3.py` (11 tests), `tests/test_content_week3.py` (3 tests), and full project suite pass 100%; `ruff check .` clean | Hidden regressions in existing modules (Week 1, Week 2, health) or code style defects | Full pytest suite, ruff linter | Local CLI (`pytest 9.0.2`, `ruff 0.8.4`) | TS §5 AC-5, HL §5 DoD 9-10 | `tests/*@ea558a7`, EV §2 E1-E5 | yes |
| C6 | TRACE | Candidate commit `ea558a7` reachable; exact path staging applied; VALUE accounting matches approved TS contract (11 files / 1322 LOC touched vs ~1200-1600 LOC plan) | Uncontrolled scope expansion, spurious files committed, or unreviewed changes | Git repository, commit history, branch main | Git CLI | TS §4, RF §1, conventions.md | Git commit `ea558a7ff24b5186df12212e9293ca593a9648ce`, EV §2 E-accounting | yes |
| C7 | Mandatory Safety / Boundary | Sandbox security in `RunnerService` prevents unsafe code execution; Zero-build boundary maintained without npm/Node.js dependencies | Server compromise via student code execution or node_modules pollution | `RunnerService`, AST `SecurityVisitor`, root project config | Python ast, subprocess sandbox | HL §6 DoF 4 & 6, TS §7 DoF 4 & 6 | `app/services/runner.py`, `pyproject.toml` | yes |

## TS ↔ RF Alignment

| TS requirement | RF claim | Claim IDs | Aligned? |
|---|---|---|---|
| AC-1: Учебный контент Недели 3 (`content/week3/`) | RF §1 (New Files), §3 (AC-1), §5 (EV: E1) | C1 | ✅ Aligned |
| AC-2: Сервисный слой и REST API (`app/api/week3.py`) | RF §1 (New/Modified Files), §3 (AC-2), §5 (EV: E2) | C2 | ✅ Aligned |
| AC-3: Интеграция в общую систему прогресса и курса | RF §1 (Modified Files), §3 (AC-3), §5 (EV: E3) | C3 | ✅ Aligned |
| AC-4: Интерактивный Zero-build интерфейс | RF §1 (Modified/New Files), §3 (AC-4), §5 (EV: E4) | C4 | ✅ Aligned |
| AC-5: Комплексное тестирование и контроль качества | RF §1 (Test Files), §3 (AC-5), §4 (Verification), §5 (EV: E5) | C5 | ✅ Aligned |
| Value-Bearing Accounting | RF §1 (Actual Value-Bearing Accounting), §5 (EV: E-accounting) | C6 | ✅ Aligned |
| Principles & DoF checks | RF §2 (Key Decisions), §5 (Task-owned resources) | C7 | ✅ Aligned |

## Verification Selection

| Claim IDs | Planned check or reusable evidence | Why this depth | Known gap or limit |
|---|---|---|---|
| C1 | Independent inspection of `content/week3/*.json` structure, questions, weights, Mermaid diagrams, and practice test suite | Direct verification of educational content validity and completeness | None |
| C2 | Independent execution of `pytest tests/test_api_week3.py` and code review of `app/api/week3.py` | Verify endpoint routing, parameter validation, high-watermark DB logic, and error handling | None |
| C3 | Execution of `pytest tests/test_progress.py` and `tests/test_api_week3.py::test_course_overview_week3` | Ensure course-wide progress aggregation and overview metadata integrity | None |
| C4 | Code review of `frontend/js/week3.js`, `frontend/index.html`, and `test_static_integration_week3` | Ensure zero-build adherence, DOM element bindings, event handling, and Mermaid integration | Automated browser rendering test not in headless CLI; verified via static DOM contract tests |
| C5 | Full test suite execution (`pytest`) and linter execution (`ruff check .`) | Verify absence of platform regressions across Week 1, Week 2, health, and runner | None |
| C6 | Independent diff calculation via `git diff --stat ff01b01a ea558a7 -- <VALUE paths>` | Verify strict adherence to prospective accounting contract | None |
| C7 | Review of `app/services/runner.py`, `content/week3/practice.json` test runner calls, and project root for npm artifacts | Enforce mandatory security and architectural boundaries | None |

## Deviations from TS

No deviations. All 11 VALUE files, 2 ASSURANCE test files, and EV artifact strictly correspond to the approved TS §4 specification.

## Checkpoint

**Self-check:**
- [x] Read RF §§1–5, governing TS AC/DoF, HL purpose/principles, ONB and referenced predecessors?
- [x] Mapped every material accepted claim and the mandatory safety/security, authority and result-identity boundaries?
- [x] Bound each claim to affected behavior/dependencies, environment, oracle/authority and exact evidence identity?
- [x] Recorded a replayable verification selection and every known gap or limit?
- [x] Avoided classifying by filename, discrepancy count or artifact volume?

Stage complete: YES
