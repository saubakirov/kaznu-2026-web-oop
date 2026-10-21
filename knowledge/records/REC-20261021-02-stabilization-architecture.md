# Knowledge record — REC-20261021-02-stabilization-architecture: Стабилизация платформы и параметрический ContentService

> One material claim/decision and its completed or explicitly unresolved disposition.
> Presence is not acceptance. Fill applicable fields; reasoned N/A only when inapplicable.

| Field | Value |
|---|---|
| Record identity | REC-20261021-02-stabilization-architecture |
| Publication intent | Фиксация архитектурных решений стабилизации платформы перед Неделей 3 |
| Kind | technical-reference decision |
| Statement | Платформа стабилизирована: (1) параметрический `ContentService(week_number)` с `@lru_cache` заменяет изолированные per-week сервисы; (2) shared-модули `app/api/deps.py` и `app/api/schemas.py` устраняют дублирование; (3) подсистема прогресса (`GET /api/progress/summary`, `GET /api/progress/export`); (4) отметка прочитанности лекций через модель `LectureRead` и эндпоинты `POST /api/week{N}/lecture/mark-read`, `GET /api/week{N}/lecture/read-status`; (5) dual-field score API (`current_score` + `best_score` + legacy `score`); (6) logging middleware для диагностики |
| Applicability | Платформа Web OOP, все текущие и будущие учебные недели |
| Grounds and uncertainty | Подтверждено 44 автотестами (pytest), ruff clean, независимым REVIEW (APPROVE). Лимиты: AC-1 новые поля проверены инспекцией кода; AC-7 logging — ручная проверка; test isolation — pre-existing |
| Disposition | accepted |
| Source | `workspace/2026/OOP_20261021-140019_RSPN3/REVIEW__OOP_20261021-140019_RSPN3.md @ aa405b2` |
| Originating task and unit | `OOP_20261021-140019_RSPN3` |
| Producer | docs-coordinator (this session) |
| Qualifier | docs-coordinator (this session) |
| Acceptance authority | saubakirov (via REVIEW APPROVE and Coordinator DONE) |
| Completed effect or missing decision | Обновлены `KNOWLEDGE.md#D4`, `KNOWLEDGE.md#D8`, `KNOWLEDGE.md#D9`, `KNOWLEDGE.md` §2 Key Artifacts, `KNOWLEDGE.md` §3 Legacy, `docs/architecture.md` §3+§5, `README.md` |
| Relations | scoped-successor of `REC-20261021-01-week2-architecture#D1` (isolated per-week ContentService → parametric ContentService); extends `KNOWLEDGE.md#D4` (adds LectureRead model) |

## Source and decision context

В рамках задачи OOP_20261021-140019_RSPN3 (Рефакторинг и стабилизация платформы перед Неделей 3) приняты ключевые решения:
1. **Единый ContentService (supersedes REC-20261021-01-week2-architecture#D1):** `ContentService(week_number)` с `@lru_cache` вместо изолированных `Week1ContentService` / `Week2ContentService`. Файл `app/services/week2_content_service.py` удалён.
2. **Shared dependencies:** `get_or_create_student()` вынесен в `app/api/deps.py`; shared Pydantic-модели — в `app/api/schemas.py`.
3. **Dual-field score API:** Эндпоинты practice submit возвращают `current_score` + `best_score` для устранения десинхронизации баллов. Legacy-поле `score` сохранено для обратной совместимости.
4. **Подсистема прогресса:** `WEEK_CONFIG` определяет параметры каждой недели; summary агрегирует quiz + practice + lecture_read; export — компактный JSON.
5. **LectureRead:** Минимальная модель `(id, student_id, week_number, read_at)`. Идемпотентный `mark-read` endpoint.
6. **Logging middleware:** `@app.middleware("http")` для request/response/exception диагностики.

## Relations and current use

Рекорд фиксирует переход от изолированных per-week сервисов к единому параметрическому `ContentService`. REC-20261021-01-week2-architecture#D1 («Изоляция модулей: каждая неделя получает отдельный ContentService») superseded в этом scope — теперь все недели обслуживаются одним сервисом. Остальные пункты REC-20261021-01-week2-architecture (D2–D5) остаются applicable.
