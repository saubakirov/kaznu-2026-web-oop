# Map — "What must be true?"
> **Mindset:** Experienced newcomer. Understand the accepted result before judging it.
> **Test:** "Can I name the material claims, harms, boundaries, evidence identities and limits?"
> RF: [RF__OOP_20261009-123309_PFBZ.md](../RF__OOP_20261009-123309_PFBZ.md)
> TS: [TS__OOP_20261009-123309_PFBZ.md](../TS__OOP_20261009-123309_PFBZ.md)

## Understanding

В задаче `OOP_20261009-123309_PFBZ` реализован базовый технический фундамент веб-платформы Web OOP (CS2203): сервер FastAPI со служебными эндпоинтами, автоматическая раздача zero-build статического фронтенда (HTML5, Tailwind CDN, ES-модули, Mermaid.js CDN), слой хранения данных SQLite на SQLAlchemy 2.0 с автосозданием таблиц и изолированный сервис проверки кода `RunnerService` с синтаксической AST-валидацией и таймаутом процесса pytest.
Архитектура обеспечивает мгновенный локальный запуск одной командой без сборщиков (Node.js/npm) и внешних сервисов, подготавливая платформу к наполнению учебным контентом Недели 1.

## Accepted Claims and Boundaries

Map the result before selecting checks. Safety/security, human acceptance authority and
accepted-result identity are mandatory even when no ordinary claim sample selects them.

| ID | Layer | Accepted claim / authority boundary | Risk or concrete harm | Affected behavior / dependencies | Relevant environment | Oracle / authority | Evidence identity (`subject@revision`, source) | Required? |
|---|---|---|---|---|---|---|---|---|
| C1 | VALUE | FastAPI сервер и эндпоинты `/api/health`, `/api/course/overview` функционируют корректно | Недоступность платформы или курса в веб-клиенте | `app/main.py`, `app/api/health.py`, `app/api/course.py` | Windows 11 / Python 3.13 / FastAPI 0.115.0 | TS AC-1 / TestClient / OpenAPI body | `tests/test_api_health.py` @ `232328d965f9ef6fdab040252e516e5f755459d2` | yes |
| C2 | VALUE | Персистентность SQLite и SQLAlchemy 2.0 декларативные модели (`Student`, `TopicProgress`, `Submission`) с автоинициализацией `init_db()` | Потеря или повреждение учебного прогресса, ошибка запуска без БД | `app/db/session.py`, `app/models/course.py` | Windows 11 / SQLite 3 / SQLAlchemy 2.0 | TS AC-2 / SQLAlchemy ORM session | `tests/test_db_models.py` @ `232328d965f9ef6fdab040252e516e5f755459d2` | yes |
| C3 | VALUE | Zero-Build фронтенд смонтирован в корень `/` и работает автономно без сборщиков | Неработоспособность UI, нарушение запрета на Node.js/npm (NS2, D1) | `frontend/index.html`, `frontend/js/*`, `frontend/css/*`, `app/main.py` | Browser / FastAPI StaticFiles | TS AC-3, HL §7 P1 / отсутствие `package.json` | `tests/test_api_health.py:test_static_root` @ `232328d965f9ef6fdab040252e516e5f755459d2` | yes |
| C4 | VALUE / SAFETY | Песочница `RunnerService` с AST-валидацией, фильтрацией опасных вызовов и таймаутом pytest 5s | Зависание сервера при бесконечном цикле, RCE / несанкционированный доступ | `app/services/runner.py`, `app/api/runner.py` | Windows 11 / subprocess `sys.executable` | TS AC-4, HL §6 DoF-2 / TimeoutExpired | `tests/test_runner_service.py` @ `232328d965f9ef6fdab040252e516e5f755459d2` | yes |
| C5 | ASSURANCE | Полное прохождение тест-сьюта (14/14) и чистота линтера `ruff check .` | Скрытые дефекты реализации, регрессии, синтаксический мусор | `tests/*`, `app/*`, `frontend/*` | Local CLI (pytest 9.0.2, ruff 0.8.4) | TS AC-5, HL §5 DoD-6,7 | `EV__OOP_20261009-123309_PFBZ.md` E1–E5 @ `232328d965f9ef6fdab040252e516e5f755459d2` | yes |
| C6 | TRACE | Учет изменений (Accounting): селектор `pyproject.toml app/** frontend/**`, 19 файлов, 1012 LOC в рамках утвержденного лимита | Неконтролируемый расползающийся скоуп, подмена артефактов | Git репозиторий, рабочее дерево | Git CLI / NUL-safe diff check | TS §4 Accounting Contract / Baseline `900a1b0bebeeb3382bda9388321fa857b5360009` | `EV__OOP_20261009-123309_PFBZ.md` E-accounting @ `232328d965f9ef6fdab040252e516e5f755459d2` | yes |
| C7 | TRACE | Полномочия, ролевая дисциплина и целостность жизненного цикла | Нарушение контракта TFW, неавторизованные мутации | `status.md`, `journal/` | TFW Full / Antigravity | conventions.md / HL §4.1 / Mode A | `status.md`, `journal/20261009-125804__transition__f1d8.md` | yes |

## TS ↔ RF Alignment

| TS requirement | RF claim | Claim IDs | Aligned? |
|---|---|---|---|
| AC-1: Бэкенд и эндпоинты состояния | RF §1.1, §3 AC-1, §4, §5 E1 | C1 | ✅ |
| AC-2: Слой хранения данных SQLite | RF §1.2, §3 AC-2, §4, §5 E2 | C2 | ✅ |
| AC-3: Zero-Build фронтенд и статика | RF §1.3, §3 AC-3, §4, §5 E3 | C3 | ✅ |
| AC-4: Изолированный раннер кода | RF §1.4, §3 AC-4, §4, §5 E4 | C4 | ✅ |
| AC-5: Качество кода (pytest + ruff) | RF §1.5, §3 AC-5, §4, §5 E5 | C5 | ✅ |
| TS §4: Accounting & Selector | RF §1 Actual Value-Bearing Accounting, §5 E-accounting | C6 | ✅ |
| HL §6 / TS §7: DoF constraints | RF §1, §2 D1–D4 | C3, C4 | ✅ |

## Verification Selection

| Claim IDs | Planned check or reusable evidence | Why this depth | Known gap or limit |
|---|---|---|---|
| C1 | Независимый запуск `pytest tests/test_api_health.py -v` и инспекция ответов `/api/health`, `/api/course/overview` | Критический путь API; проверка структуры JSON и статус-кодов | Отсутствует продакшен-авторизация (out-of-scope согласно TS §2) |
| C2 | Независимый запуск `pytest tests/test_db_models.py -v` и проверка генерации `data/web_oop.db` | Гарантия сохранности прогресса и корректности внешних ключей | База SQLite локальная без репликации (by design) |
| C3 | Инспекция структуры `frontend/`, проверка отсутствия `package.json` и `node_modules`, валидация ссылок на CDN | Проверка архитектурного принципа Zero-Build (P1 / NS2) | Зависимость от доступности CDN для Tailwind/Mermaid (смягчено fallback-стилями) |
| C4 | Независимый запуск `pytest tests/test_runner_service.py -v` (включая тест с таймаутом 1s и синтаксическую блокировку) | Обязательный рубеж безопасности (DoF-2, subprocess isolation) | AST-фильтр блокирует только известный список опасных модулей/функций |
| C5 | Независимый запуск полного набора `pytest` и `ruff check .` | Проверка отсутствия регрессий и чистоты кодовой базы | Нет сквозных E2E-тестов в headless-браузере (не требовалось в TS) |
| C6 | Воспроизведение команд `git diff --stat` и `git diff --numstat` относительно baseline `900a1b0bebeeb3382bda9388321fa857b5360009` | Проверка соблюдения бюджета изменений и отсутствия чужих правок | Нет |
| C7 | Проверка статус-файла `status.md` и записей в `journal/` | Аудит ролевой дисциплины и цепочки переходов | Нет |

## Deviations from TS

No deviations. Все запланированные файлы, компоненты и критерии приемки полностью соответствуют контракту утвержденного TS.

## Checkpoint

**Self-check:**
- [x] Read RF §§1–5, governing TS AC/DoF, HL purpose/principles, ONB and referenced predecessors?
- [x] Mapped every material accepted claim and the mandatory safety/security, authority and result-identity boundaries?
- [x] Bound each claim to affected behavior/dependencies, environment, oracle/authority and exact evidence identity?
- [x] Recorded a replayable verification selection and every known gap or limit?
- [x] Avoided classifying by filename, discrepancy count or artifact volume?

Stage complete: YES
