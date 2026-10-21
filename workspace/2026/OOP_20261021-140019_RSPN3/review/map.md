# Map — OOP_20261021-140019_RSPN3

> **Mindset:** Experienced newcomer. Understand the accepted result before judging it.
> **Test:** "Can I name the material claims, harms, boundaries, evidence identities and limits?"
> RF: [RF](../RF__OOP_20261021-140019_RSPN3.md)
> TS: [TS](../TS__OOP_20261021-140019_RSPN3.md)

## Understanding

The accepted result stabilizes the Web OOP platform before Week 3 by fixing the practice score desync (P1-bug), adding three features (progress summary, lecture read marks, grade export), refactoring duplicated ContentService and shared code, and adding diagnostic logging middleware. The implementation is a single commit (`245bcdd`) affecting 17 files (13 VALUE, 4 ASSURANCE).

## Accepted Claims and Boundaries

| ID | Layer | Accepted claim / authority boundary | Risk or concrete harm | Affected behavior / dependencies | Relevant environment | Oracle / authority | Evidence identity | Required? |
|---|---|---|---|---|---|---|---|---|
| C1 | VALUE | Practice submit API returns `current_score` and `best_score` separately; UI shows both | Students see contradictory score (failed + 10/10) | `week1.py`, `week2.py` submit_practice; `app.js`, `week2.js` | Python 3.13, SQLite, TestClient | TS AC-1; HL §1 §3.1 | `tests/test_api_week1.py`, `test_api_week2.py` @ 245bcdd | yes |
| C2 | VALUE | `GET /api/progress/summary` returns aggregated per-week data | No visibility into overall course progress | `progress.py`, `app.js` | TestClient | TS AC-2; HL §3.1 | `tests/test_progress.py` @ 245bcdd | yes |
| C3 | VALUE | LectureRead model; mark-read/read-status endpoints; UI button | No lecture completion tracking | `course.py`, `week1.py`, `week2.py`, `app.js`, `week2.js` | SQLite, TestClient | TS AC-3; HL §3.1 | `tests/test_lecture_read.py` @ 245bcdd | yes |
| C4 | VALUE | `GET /api/progress/export` returns compact JSON; UI copy button | Cannot export grades to Telegram | `progress.py`, `api.js`, `app.js` | TestClient | TS AC-4; HL §3.1 | `tests/test_progress.py::test_export` @ 245bcdd | yes |
| C5 | VALUE | Single `ContentService(week_number)` replaces two services | 91% code duplication; maintenance burden | `content_service.py`, `week2_content_service.py` (deleted) | all week endpoints | TS AC-5; HL §3.1 | `pytest -v` full pass @ 245bcdd | yes |
| C6 | VALUE | Shared `deps.py` and `schemas.py`; no duplication | Duplicate `get_or_create_student` and models | `deps.py`, `schemas.py`, `week1.py`, `week2.py` | all endpoints | TS AC-6 | `ruff check .` + `pytest -v` @ 245bcdd | yes |
| C7 | VALUE | Logging middleware: request method/path, status, duration, exception traceback | Server crashes undiagnosed | `main.py` middleware | runtime | TS AC-7 | Code inspection; middleware present | yes |
| C8 | ASSURANCE | All existing + new tests pass; ruff clean | Regression risk | all test files | pytest 9.0.2, ruff | TS AC-8 | `pytest -v` 44/44, `ruff check .` clean @ 245bcdd | yes |
| C9 | VALUE | Backward compatibility: legacy `score` field preserved | Break existing consumers | `week1.py`, `week2.py` response dict | API contract | HL §7 P1 | Existing tests pass with `score` assertion | yes |
| C10 | ASSURANCE | Tests not dependent on external state (isolation) | Flaky tests on repeated runs | `test_lecture_read.py` | file-based SQLite `data/web_oop.db` | TS AC-8 reproducibility | pytest output + rerun after DB cleanup | selected |

## TS ↔ RF Alignment

| TS requirement | RF claim | Claim IDs | Aligned? |
|---|---|---|---|
| AC-1: Score desync fix | RF §2 AC-1 ✅ PASS | C1, C9 | ✅ |
| AC-2: Progress summary | RF §2 AC-2 ✅ PASS | C2 | ✅ |
| AC-3: Lecture read marks | RF §2 AC-3 ✅ PASS | C3 | ✅ |
| AC-4: Grade export | RF §2 AC-4 ✅ PASS | C4 | ✅ |
| AC-5: ContentService refactor | RF §2 AC-5 ✅ PASS | C5 | ✅ |
| AC-6: Shared code refactor | RF §2 AC-6 ✅ PASS | C6 | ✅ |
| AC-7: Logging middleware | RF §2 AC-7 ✅ PASS | C7 | ✅ |
| AC-8: Regression | RF §2 AC-8 ✅ PASS | C8, C10 | ⚠️ partial — flaky on stale DB |

## Verification Selection

| Claim IDs | Planned check or reusable evidence | Why this depth | Known gap or limit |
|---|---|---|---|
| C1, C9 | Code inspection of submit_practice logic + existing test assertions | P1-bug: highest domain risk | none |
| C2, C4 | `pytest tests/test_progress.py -v` + code inspection | New endpoints, no prior coverage | none |
| C3 | `pytest tests/test_lecture_read.py -v` + code inspection | New model + endpoints | C10: test isolation |
| C5 | `git diff --stat` confirms deletion + `pytest -v` full pass | Refactor risk to existing behavior | none |
| C6 | Code inspection: single definition of each function/model | Duplication elimination | none |
| C7 | Code inspection of middleware | Defensive measure; no functional test | No automated test for logging |
| C8, C10 | Independent `pytest -v` run (clean DB) | Regression gate | Tests not idempotent on stale DB |

## Deviations from TS

No deviations. RF §6 states "None." Verified: all 8 ACs addressed; no work outside TS scope.

## Checkpoint

**Self-check:**
- [x] Read RF §§1–5, governing TS AC/DoF, HL purpose/principles, ONB and referenced predecessors?
- [x] Mapped every material accepted claim and the mandatory safety/security, authority and result-identity boundaries?
- [x] Bound each claim to affected behavior/dependencies, environment, oracle/authority and exact evidence identity?
- [x] Recorded a replayable verification selection and every known gap or limit?
- [x] Avoided classifying by filename, discrepancy count or artifact volume?

Stage complete: YES
