# Map — "What must be true?"
> **Mindset:** Experienced newcomer. Understand the accepted result before judging it.  
> **Test:** "Can I name the material claims, harms, boundaries, evidence identities and limits?"  
> RF: [RF__OOP_20261014-133501_W1MAT.md](../RF__OOP_20261014-133501_W1MAT.md)  
> TS: [TS__OOP_20261014-133501_W1MAT.md](../TS__OOP_20261014-133501_W1MAT.md)  

## Understanding

В рамках задачи `OOP_20261014-133501_W1MAT` реализован полноценный интерактивный учебный модуль Недели 1 («Основы ООП, инкапсуляция и защита инвариантов») на сквозном кейсе платежных инструментов транспортной системы Алматы (`Avtobys`). Модуль включает валидный методический контент (`content/week1/`), REST API FastAPI с сохранением баллов в SQLite (`TopicProgress`, `Submission`), Zero-build SPA интерфейс на Vanilla JS + Tailwind/Mermaid CDN с встроенным редактором кода и консолью автопроверки `pytest` в песочнице `RunnerService`. Ключевые решения: маскирование ответов квиза на сервере (D1), фиксация максимального балла (D2), отложенный рендеринг Mermaid при активации таба (D3), поддержка отступов Tab в редакторе (D4).

## Accepted Claims and Boundaries

| ID | Layer | Accepted claim / authority boundary | Risk or concrete harm | Affected behavior / dependencies | Relevant environment | Oracle / authority | Evidence identity (`subject@revision`, source) | Required? |
|---|---|---|---|---|---|---|---|---|
| B1 | TRACE | Accepted-result identity: Baseline `79ad355e` / Candidate `71528f65` | Подмена ревизии, потеря воспроизводимости | Git tree, DAG commits | Local git CLI | Git object store / TS §4 | `71528f6509b65f47bc6d0f072ca92fb1a7bd49e3` | yes |
| B2 | TRACE | Human acceptance authority: Владелец `saubakirov` утвердил HL и TS | Нелегитимность скоупа и требований | Статус-файл, журнал | TFW governance | `saubakirov` / HL-OOP & TS-OOP | `da5cdd8d72bce2c6c4d9fea3c38b4be096b4ce42` | yes |
| B3 | VALUE | Safety & Security: AST-фильтрация и таймаут 5с в RunnerService | Выполнение деструктивного кода студента, зависание сервера | `RunnerService`, subprocess, AST validator | Python 3.13 sandbox | TS §4 Hard Constraints M5 / Owner | `tests/test_runner_service.py` @ `71528f65` | yes |
| C1 | VALUE | AC-1: Структурированный контент Недели 1 (`content/week1/`) | Неполный контент, плейсхолдеры TODO, срыв обучения | `lecture.json`, `quiz.json`, `practice.json` | JSON parser, pytest | TS §5 AC-1 | `content/week1/*` @ `71528f65` | yes |
| C2 | VALUE | AC-2: Бэкенд API и сохранение прогресса (`/api/week1/*`, SQLite) | Потеря баллов студентов, сбои при отправке квиза/практики | FastAPI, SQLAlchemy, SQLite, `TopicProgress`, `Submission` | Uvicorn / SQLite 3 | TS §5 AC-2 | `app/api/week1.py`, `content_service.py` @ `71528f65` | yes |
| C3 | VALUE | AC-3: Интерактивный Zero-build SPA интерфейс | Неработающие табы, отсутствие схем Mermaid, сбой редактора | `frontend/index.html`, `js/app.js`, `js/api.js`, `css/styles.css` | Browser / Static server / Chromium | TS §5 AC-3 | `frontend/**` @ `71528f65` | yes |
| C4 | ASSURANCE | AC-4: Интеграционное тестирование и отсутствие регрессий (100% pass) | Регрессия платформы, неработающие тесты | `tests/`, `pytest`, `ruff` | Windows CLI / pytest 9.0.2 / ruff 0.8.4 | TS §5 AC-4 / EV §2 E4 | `tests/**` @ `71528f65` | yes |
| C5 | TRACE | Accounting: 11 файлов VALUE, 1702 LOC, точное соответствие плану | Нарушение лимитов скоупа, незамеченная декомпозиция | `git diff --numstat` | Local git CLI | TS §4 prospective contract | `71528f65` vs `79ad355e` | yes |

## TS ↔ RF Alignment

| TS requirement | RF claim | Claim IDs | Aligned? |
|---|---|---|---|
| AC-1: Структурированный контент Недели 1 | RF §1 (п.1), §3 (AC-1) | C1 | ✅ Aligned |
| AC-2: Бэкенд API и сохранение прогресса | RF §1 (п.2), §3 (AC-2) | C2 | ✅ Aligned |
| AC-3: Интерактивный SPA-интерфейс Недели 1 | RF §1 (п.3), §3 (AC-3) | C3 | ✅ Aligned |
| AC-4: Тестирование и отсутствие регрессий | RF §1 (п.4), §3 (AC-4), §4 | C4 | ✅ Aligned |
| Accounting contract: 11 файлов VALUE, до 2400 LOC (с множителем 2x) | RF §1 Accounting table | C5 | ✅ Aligned |
| Zero-build constraint (отсутствие `package.json`, `node_modules`) | RF §1 (п.3), §3 (AC-3) | C3, B3 | ✅ Aligned |
| DoF items (отсутствие TODO, сохранение баллов, таймаут) | RF §1, §3, §5 | B3, C1, C2 | ✅ Aligned |

## Verification Selection

| Claim IDs | Planned check or reusable evidence | Why this depth | Known gap or limit |
|---|---|---|---|
| B1, C5 | Независимый пересчет `git diff` NUL-safe / numstat между Baseline `79ad355e` и Candidate `71528f65` | Подтверждение границ и неизменяемости Candidate | none |
| B2 | Проверка статуса, журнала и координационных полномочий | Гарантия легитимности гейта | none |
| B3 | Анализ AST-проверок и таймаутов песочницы | Критичность безопасности изолированного исполнения | subprocess execution on Windows |
| C1 | Независимый аудит файлов `content/week1/*`, проверка на отсутствие TODO/FIXME и соответствие схемам | Качество и полнота образовательного материала | none |
| C2 | Независимый аудит роутов `app/api/week1.py` и сервиса `content_service.py`, проверка сессий БД | Корректность персистентности и защиты от списасывания | SQLite in-memory / local file |
| C3 | Проверка статики фронтенда, разметки табов, редактора кода, визуальной верификации в браузере | Доступность интерфейса без node_modules | Zero-build HTML5/JS |
| C4 | Независимый запуск `pytest -v` (24 теста) и `ruff check .` | Подтверждение фактической работоспособности | All passed in 6.78s |

## Deviations from TS

No deviations.
- Все 11 плановых файлов VALUE созданы или модифицированы в строгом соответствии с TS §4.
- Объем 1702 LOC укладывается в утвержденный предел (до 2400 LOC с множителем).
- Candidate commit `71528f65` содержит полную законченную реализацию, включая улучшенное форматирование UI и цветовой вывод консоли автопроверки.

## Checkpoint

**Self-check:**
- [x] Read RF §§1–5, governing TS AC/DoF, HL purpose/principles, ONB and referenced predecessors?
- [x] Mapped every material accepted claim and the mandatory safety/security, authority and result-identity boundaries?
- [x] Bound each claim to affected behavior/dependencies, environment, oracle/authority and exact evidence identity?
- [x] Recorded a replayable verification selection and every known gap or limit?
- [x] Avoided classifying by filename, discrepancy count or artifact volume?

Stage complete: YES
