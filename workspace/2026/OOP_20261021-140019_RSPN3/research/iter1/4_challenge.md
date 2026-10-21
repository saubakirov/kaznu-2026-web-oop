# Challenge — "What do we NOT expect?"
> **Mindset:** Critic. You built the configurations. Now attack them. Every survivor needs evidence. Every elimination needs a reason.
> **Test:** "Would my surviving configurations hold if a different researcher attacked them?"
> Parent: [HL-OOP_20261021-140019_RSPN3](../../HL-OOP_20261021-140019_RSPN3.md)
> Goal: Платформа полностью стабильна, корректна и готова к запуску Недели 3

## Consistency Check

_Gather used a comparison matrix. Stress-testing each proposed fix against edge cases._

### C1: Рефакторинг ContentService — риск регрессии

**Атака:** Объединение двух сервисов в один может сломать Week 1 или Week 2, если `get_practice()` возвращает разные поля.

**Проверка:**
- Week 1 `get_practice()` возвращает: `week_number`, `title`, `max_points`, `description`, `invariants`, `starter_code`
- Week 2 `get_practice()` возвращает: `week_number`, `title`, `max_points`, `description`, `monolith_code`, `requirements`, `starter_code`
- Фронтенд Week 1 (`app.js`) использует: `description`, `starter_code`, `invariants`
- Фронтенд Week 2 (`week2.js`) использует: `description`, `monolith_code`, `requirements`, `starter_code`

**Решение:** Единый `get_practice()` возвращает ВСЕ поля из JSON `practice.json` (кроме `reference_solution` и `test_code`). Фронтенд берёт нужные поля. Поля-уникумы (`invariants`, `monolith_code`, `requirements`) присутствуют только в соответствующих JSON — фронтенд, не получивший поле, просто не рендерит секцию.

**Вердикт:** Безопасно. Обратная совместимость сохраняется. Тесты `test_content_week1.py` и `test_content_week2.py` верифицируют.

### C2: Score desync fix — edge case

**Атака:** Что если студент впервые отправляет код и получает `failed`? `current_score=0`, `best_score=0` — корректно. Потом отправляет `passed` — `current_score=10`, `best_score=10` — корректно. Потом отправляет `failed` снова — `current_score=0`, `best_score=10` — корректно, UI покажет `❌ Failed (лучший: 10/10)`.

**Вердикт:** Все edge cases покрыты. Поле `best_score` всегда ≥ `current_score`.

### C3: Непроизводимое падение сервера — DoD §1 риск

**Атака:** DoD §1 требует «сервер работает стабильно минимум 10 минут». Если причина внешняя и не в коде — Executor не может её исправить.

**Проверка:** Сервер стабилен в контролируемых условиях. Если после всех исправлений владелец подтвердит стабильность — DoD §1 выполнен. Если падение повторится — нужен traceback для диагностики.

**Рекомендация:** Executor добавляет:
1. `logging` middleware для request/response
2. `try/except` в lifespan для graceful shutdown logging
3. Инструкция владельцу: запускать с `--log-level debug` при повторении проблемы

**Вердикт:** P8 не блокирует Phase B. Executor адресует через defensive logging.

### C4: Новые фичи — совместимость с существующей архитектурой

**Атака:** Новый роутер `/api/progress/` и модель `LectureRead` — не сломают ли существующие маршруты?

**Проверка:**
- Новый роутер не конфликтует с `/api/week1/progress` и `/api/week2/progress` — разные prefix
- `LectureRead` модель — новая таблица через SQLAlchemy `create_all`, не затрагивает существующие
- `mount("/")` остаётся последним — новые маршруты регистрируются до него

**Вердикт:** Безопасно.

### C5: Unique constraint на TopicProgress — миграция

**Атака:** Добавление unique constraint может упасть, если в БД уже есть дубликаты.

**Проверка:** SQLAlchemy `create_all` не модифицирует существующие таблицы — constraint применится только к новым БД. Для существующих нужен `ALTER TABLE` или пересоздание.

**Вердикт:** P3 — откладывается или применяется только к новым установкам. Не блокирует.

## Findings

### C6: Неожиданная находка — `get_practice()` в ContentService как единственное реальное различие

При детальном сравнении двух ContentService единственное _содержательное_ различие — набор полей в `get_practice()`. Все остальные методы (`get_lecture`, `get_quiz`, `evaluate_quiz`, `get_reference_solution`, `get_test_code`, `run_practice_check`) — **побайтово идентичны** (за исключением `week_number` default). Это подтверждает, что рефакторинг тривиален.

### C7: `week1.py` и `week2.py` — ~85% структурного дублирования

Помимо ContentService, сами API-модули дублируют:
- `get_or_create_student()` — идентичен
- `QuizSubmitRequest`, `PracticeSubmitRequest` — идентичны
- `submit_quiz()`, `submit_practice()` — структурно идентичны, различаются только `week_number`, `topic_id`, `max_score`
- `get_progress()` — различается `ProgressResponse` моделью (разные `max` значения)

Это объём, который параметрический подход сокращает значительно, но выходит за scope «минимальных изменений» (HL §7 принцип 3). Рекомендация: объединить только ContentService и `get_or_create_student()`, оставить API-модули раздельными.

## Checkpoint

| Found | Remaining |
|-------|-----------|
| ContentService рефакторинг безопасен — подтверждено | — |
| Score desync fix корректен для всех edge cases | — |
| P8 не блокирует Phase B | — |
| Новые фичи совместимы с архитектурой | — |
| Unique constraint — отложить | — |

**Sufficiency:**
- [x] External source used? (web search from Gather, code inspection)
- [x] Briefing gap closed?
- [x] Pairwise incompatibility checked? Surviving configurations listed?

Stage complete: YES
→ User decision: N/A (Coordinator approved full pass)
