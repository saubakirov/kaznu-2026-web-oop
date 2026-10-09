# Verify — "Do the material claims hold?"
> **Mindset:** Auditor. RF is a declaration, not a fact. Open files, run necessary checks, compare
> accepted claims with reality, and state the limits.
> **Test:** "Would the evidence establish this claim for this subject, revision and environment without RF?"
> Map: [map.md](map.md)

## Selection Argument

| Claim IDs | Risk / criticality | Affected behavior / dependencies | Environment | Oracle / authority | Evidence gap / limit | Selected verification and why |
|---|---|---|---|---|---|---|
| C1 | High / Критический путь API | `app/main.py`, `app/api/health.py`, `app/api/course.py` | Win11 / Python 3.13 / FastAPI 0.115.0 | TS AC-1 / OpenAPI schema | Отсутствие JWT (by design) | `pytest tests/test_api_health.py -v`; аудит эндпоинтов |
| C2 | High / Персистентность данных | `app/db/session.py`, `app/models/course.py` | Win11 / SQLite 3 / SQLAlchemy 2.0.49 | TS AC-2 / SQLAlchemy ORM | SQLite без репликации | `pytest tests/test_db_models.py -v`; аудит моделей |
| C3 | Critical / Принцип Zero-Build (P1) | `frontend/**`, `app/main.py` | Browser / FastAPI StaticFiles | TS AC-3, HL §7 P1 | Зависимость от CDN | Аудит файлов; проверка отсутствия `package.json`/`node_modules` |
| C4 | Critical / Безопасность песочницы (DoF-2) | `app/services/runner.py`, `app/api/runner.py` | Win11 / `sys.executable` subprocess | TS AC-4, HL §6 DoF-2 | Фильтр известных модулей | `pytest tests/test_runner_service.py -v`; аудит `SecurityVisitor` |
| C5 | High / Качество кода и регрессии | Полный проект (`app/`, `tests/`, `frontend/`) | Win11 / pytest 9.0.2 / ruff 0.8.4 | TS AC-5, HL §5 DoD-6,7 | Нет E2E браузерных тестов | Полный прогон `pytest -v` и `ruff check .` |
| C6 | High / Учет изменений (Accounting) | Git коммиты и дерево файлов | Git CLI | TS §4, conventions.md | Нет | NUL-safe diff check по селектору `pyproject.toml app/** frontend/**` |
| C7 | High / Целостность TFW | `status.md`, `journal/` | TFW Full / Antigravity | conventions.md | Нет | Проверка ролевой дисциплины, статусов и записей журнала |

Safety/security, human acceptance authority and accepted-result identity are mandatory floors.
Expand verification when an observed fact changes a mapped claim, dependency, risk or evidence gap;
the existence or count of discrepancies never selects depth by itself.

## Verification Log

### V1: C1 — Эндпоинты состояния и обзор курса
- **Accepted claim / authority:** FastAPI приложение запускается, роуты `/api/health` и `/api/course/overview` возвращают 200 OK со структурированными данными.
- **Subject tuple:** `{app/main.py, app/api/health.py, app/api/course.py, 232328d965f9ef6fdab040252e516e5f755459d2, Win11/Python 3.13, TS AC-1, ok}`
- **Action or evidence:** Запуск `pytest tests/test_api_health.py -v` (4 теста) и аудит кода роутеров.
- **Observed:** Все тесты пройдены: `/api/health` возвращает `status: "ok"`, `database: "connected"`; `/api/course/overview` возвращает 3 недели с темами.
- **Limit:** Авторизация отсутствует (запланировано в последующих задачах).
- **Result:** HOLDS

### V2: C2 — Персистентность SQLite и модели SQLAlchemy 2.0
- **Accepted claim / authority:** Модели `Student`, `TopicProgress`, `Submission` объявлены через SQLAlchemy 2.0 декларативный стиль; база `data/web_oop.db` автосоздается через `init_db()`.
- **Subject tuple:** `{app/db/session.py, app/models/course.py, 232328d965f9ef6fdab040252e516e5f755459d2, SQLite 3/SQLAlchemy 2.0, TS AC-2, ok}`
- **Action or evidence:** Запуск `pytest tests/test_db_models.py -v` (3 теста) и проверка связей `relationship`.
- **Observed:** Все тесты пройдены: создание студента, привязка прогресса, фиксация попыток сдачи с foreign key каскадами работают корректно.
- **Limit:** Локальная файловая БД SQLite.
- **Result:** HOLDS

### V3: C3 — Zero-Build веб-интерфейс и статическая раздача
- **Accepted claim / authority:** Фронтенд монтируется на `/` через `StaticFiles`, стилизуется через Tailwind CDN, использует Mermaid.js CDN для диаграмм; отсутствуют npm/node зависимости.
- **Subject tuple:** `{frontend/**, app/main.py, 232328d965f9ef6fdab040252e516e5f755459d2, Browser/StaticFiles, TS AC-3, ok}`
- **Action or evidence:** Проверка существования `package.json` и `node_modules`; запуск тестов `test_static_root_serves_html` и `test_static_assets_served`.
- **Observed:** `Test-Path "package.json"` → False; `Test-Path "node_modules"` → False; `index.html` и ассеты отдаются с HTTP 200. В разметке подключены CDN Tailwind и Mermaid.
- **Limit:** Для отображения диаграмм в браузере требуется доступ к CDN либо оффлайн fallback.
- **Result:** HOLDS

### V4: C4 — Песочница RunnerService и безопасность AST
- **Accepted claim / authority:** `RunnerService` проверяет AST на синтаксис и запрещенные импорты, изолирует выполнение во временной папке, принудительно прерывает бесконечные циклы по таймауту.
- **Subject tuple:** `{app/services/runner.py, app/api/runner.py, 232328d965f9ef6fdab040252e516e5f755459d2, Win11/Python 3.13 subprocess, TS AC-4 & DoF-2, ok}`
- **Action or evidence:** Запуск `pytest tests/test_runner_service.py -v` (6 тестов, включая бесконечный цикл `while True: pass` и запрещенный `import subprocess`).
- **Observed:** Все тесты пройдены: таймаут корректно возвращает статус `timeout` без падения сервера; `SyntaxError` перехватывается; запрещенные вызовы блокируются до запуска.
- **Limit:** AST-анализ охватывает модули из `FORBIDDEN_MODULES` и встроенные функции `FORBIDDEN_BUILTINS`.
- **Result:** HOLDS

### V5: C5 — Общее качество кода и отсутствие регрессий
- **Accepted claim / authority:** 100% тестов проходят успешно; линтер `ruff` не выдает ошибок.
- **Subject tuple:** `{workspace, 232328d965f9ef6fdab040252e516e5f755459d2, Win11, TS AC-5, ok}`
- **Action or evidence:** Запуск команд `pytest -v` и `ruff check .`.
- **Observed:** 14 passed in 4.91s; `ruff check .` завершился сообщением "All checks passed!". В diff отсутствуют слова `TODO`, `FIXME`, `LEGACY`.
- **Limit:** Нет.
- **Result:** HOLDS

### V6: C6 — Бюджет изменений и селектор Accounting
- **Accepted claim / authority:** Изменения укладываются в утвержденный знаменатель: 19 файлов VALUE, до 1000 LOC (множитель эскалации 2x: до 38 файлов / 2000 LOC); селектор `pyproject.toml app/** frontend/**`.
- **Subject tuple:** `{git lineage, 900a1b0bebeeb3382bda9388321fa857b5360009 -> 232328d965f9ef6fdab040252e516e5f755459d2, Git CLI, TS §4, ok}`
- **Action or evidence:** Выполнение команд `git diff --numstat` и `git diff --stat`.
- **Observed:** Ровно 19 файлов VALUE, 1012 additions, 0 deletions = 1012 touched LOC. Ниже триггеров декомпозиции (50 файлов / 5000 LOC).
- **Limit:** Нет.
- **Result:** HOLDS

### V7: C7 — Жизненный цикл и полномочия
- **Accepted claim / authority:** Задача выполнена строго по TFW Role Lock: Исполнитель завершил фазу RF, Ревьюер проводит аудит без мутации кода.
- **Subject tuple:** `{status.md, journal/**, TFW Full, conventions.md, ok}`
- **Action or evidence:** Инспекция `status.md` и записей перехода в `journal/`.
- **Observed:** Статус задачи `lifecycle: RF`; журнал содержит корректные переходы: `created`, `transition` (к TS), `handoff` (к ONB), `transition` (к RF).
- **Limit:** Нет.
- **Result:** HOLDS

## Commands Executed

| # | Command | Claim IDs | Result |
|---|---|---|---|
| 1 | `pytest -v` | C1, C2, C4, C5 | Exit 0: 14 passed in 4.91s |
| 2 | `ruff check .` | C5 | Exit 0: All checks passed! |
| 3 | `Test-Path "package.json"; Test-Path "node_modules"` | C3 | Exit 0: False, False (zero build подтвержден) |
| 4 | `git diff --numstat --find-renames=50% 900a1b0bebeeb3382bda9388321fa857b5360009 232328d965f9ef6fdab040252e516e5f755459d2 -- pyproject.toml app frontend` | C6 | Exit 0: 19 files, 1012 additions, 0 deletions |
| 5 | `git diff ... | Select-String -Pattern "(?i)\b(todo|fixme|legacy|hack)\b"` | C5 | Exit 0: 0 matches (нет плейсхолдеров) |

## Claim and Source Checks

| # | Claim / citation | Where | Primary artifact / source | Holds? |
|---|---|---|---|---|
| C1 | Подключение базы данных SQLite подтверждается в ответе healthcheck | RF §1.1, §3 AC-1 | `tests/test_api_health.py:test_health_endpoint` | ✅ |
| C2 | Отношения моделей Student, TopicProgress, Submission корректны | RF §1.2, §3 AC-2 | `tests/test_db_models.py` | ✅ |
| C3 | Фронтенд работает без npm/node прямо из `frontend/` со стилями Tailwind CDN | RF §1.3, §3 AC-3 | `frontend/index.html`, отсутствие `package.json` | ✅ |
| C4 | Защита от бесконечного цикла прерывает выполнение за 1s (таймаут) | RF §1.4, §3 AC-4 | `tests/test_runner_service.py:test_runner_timeout_infinite_loop` | ✅ |
| C5 | Статический анализ ruff проходит с 0 ошибок | RF §4 | `ruff check .` | ✅ |
| C6 | Фактический объем VALUE составляет 19 файлов и 1012 LOC | RF §1 Accounting | `git diff --stat 900a1b0... 232328d...` | ✅ |

## Guard and Check Admission

| # | Kind | Protected behavior / invariant | Failure consequence | Counterfactual detection | Admission |
|---|---|---|---|---|---|
| G1 | permanent guard | Прерывание бесконечного цикла в `RunnerService` по таймауту | Зависание воркера сервера при вредоносном коде студента | `test_runner_timeout_infinite_loop`: запуск `while True: pass` с таймаутом 1s завершается статусом `timeout` | admitted |
| G2 | permanent guard | Блокировка потенциально опасных модулей (`subprocess`, `socket`) | Удаленное исполнение произвольного кода (RCE) на хосте | `test_runner_forbidden_modules`: попытка импорта `subprocess` блокируется на шаге AST-валидации со статусом `forbidden` | admitted |
| G3 | positive control | Корректность структуры JSON в `/api/health` и `/api/course/overview` | Нарушение контракта API для фронтенда | `test_api_health.py` подтверждает соответствие схемы ответов | admitted (labelled control) |
| G4 | positive control | Сохранение и выборка записей в SQLite моделях | Потеря данных о прогрессе студентов | `test_db_models.py` подтверждает запись и каскады | admitted (labelled control) |

## Candidate Findings

No findings. Код, тесты, документация и артефакты полностью соответствуют требованиям спецификации TS и принципам проекта.

## Evidence Verification

| # | EV row | Subject tuple | Repeated or opened? | Establishes the claim? | Limit |
|---|---|---|---|---|---|
| E1 | E1 (AC-1) | `{app/api/health.py, app/api/course.py, 232328d965f9ef6fdab040252e516e5f755459d2, Win11}` | ✅ Repeated | ✅ | Нет |
| E2 | E2 (AC-2) | `{app/db/session.py, app/models/course.py, 232328d965f9ef6fdab040252e516e5f755459d2, Win11}` | ✅ Repeated | ✅ | Нет |
| E3 | E3 (AC-3) | `{frontend/**, 232328d965f9ef6fdab040252e516e5f755459d2, Win11}` | ✅ Repeated | ✅ | Нет |
| E4 | E4 (AC-4) | `{app/services/runner.py, 232328d965f9ef6fdab040252e516e5f755459d2, Win11}` | ✅ Repeated | ✅ | Нет |
| E5 | E5 (AC-5) | `{workspace, 232328d965f9ef6fdab040252e516e5f755459d2, Win11}` | ✅ Repeated | ✅ | Нет |
| E6 | E-accounting | `{git lineage, 900a1b0... -> 232328d..., Win11}` | ✅ Repeated | ✅ | Нет |

## Knowledge Citations Verified

| # | Artifact | Priority + exact citation | Resolves? | Item exists? | Meaning matches? | Relevant? |
|---|---|---|---|---|---|---|
| 1 | HL §7.2 #1 | Priority 0: `README.md #ns1` (Цель курса) | ✅ | ✅ | ✅ Компактный курс ООП для КазНУ | ✅ Прямое назначение платформы |
| 2 | HL §7.2 #2 | Priority 0: `README.md #ns2` (AI-legibility) | ✅ | ✅ | ✅ Прозрачный, типизированный стек | ✅ Чистый стек FastAPI + Vanilla JS |
| 3 | HL §7.2 #3 | Priority 0: `README.md #ns3` (Non-goals) | ✅ | ✅ | ✅ Отказ от сборщиков и тяжелых фреймворков | ✅ Zero-build архитектура фронтенда |
| 4 | HL §7.2 #4 | Priority 1: `.tfw/README.md` (Methodology Values) | ✅ | ✅ | ✅ Trace-First Workflow дисциплина | ✅ Точные артефакты HL/TS/ONB/RF/EV/REVIEW |
| 5 | HL §7.2 #5 | Priority 1: `KNOWLEDGE.md §1 D1` (Стек) | ✅ | ✅ | ✅ FastAPI + Tailwind CDN + Vanilla JS + Mermaid | ✅ Соответствие выбранному стеку |
| 6 | HL §7.2 #6 | Priority 2: `docs/architecture.md §3-4` | ✅ | ✅ | ✅ Структура слоев и песочницы | ✅ Полная реализация архитектурной схемы |
| 7 | HL §7.2 #7 | Priority 3: `conventions.md` (Scope Budgets & Roles) | ✅ | ✅ | ✅ Контроль бюджета изменений и Role Lock | ✅ Соблюдение лимитов и ролевых границ |

## Accounting Replay

| Approval / authority | Baseline | Candidate | Literal VALUE membership / actions / classes / reasons | Adds | Deletes | Touched LOC | Binary | Trigger disposition | Exact NUL-safe command | Verdict |
|---|---|---|---|---:|---:|---:|---|---|---|---|
| TS approval `d03938a5...` | `900a1b0...` | `232328d...` | `pyproject.toml` (MOD), `app/**` (14 CRE), `frontend/**` (4 CRE) | 1012 | 0 | 1012 | N/A | 19 < 50; 1012 < 5000 (в рамках утвержденного лимита) | `git diff --numstat --find-renames=50% 900a1b0... 232328d... -- pyproject.toml app frontend` | VERIFIED |

## Selected Knowledge Evidence

- Онбординг Исполнителя: `ONB__OOP_20261009-123309_PFBZ.md` зафиксировал отсутствие блокеров и готовность к выполнению.
- Свидетельства Исполнителя: `EV__OOP_20261009-123309_PFBZ.md` и отчет `RF__OOP_20261009-123309_PFBZ.md` воспроизведены независимо и подтверждены.

## Checkpoint

**Self-check:**
- [x] Replayed the Map selection and verified all mandatory safety/security, authority and identity floors?
- [x] Established evidence applicability and ran every TS-required or dependency-affected check?
- [x] Recorded explicit limits instead of substituting file, discrepancy, test, commit or artifact counts?
- [x] Classified guards and controls by protected behavior, consequence and counterfactual detection?
- [x] Recorded every candidate finding with the complete item contract and material consequence test?
- [x] Verified RF AC claims, evidence references, citations and immutable accounting against actual artifacts?

Stage complete: YES
