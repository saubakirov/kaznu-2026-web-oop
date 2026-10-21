# Extract — "What do we NOT see?"
> **Mindset:** Analyst. You have the raw findings. Now build structure. Make combinations visible that nobody proposed.
> **Test:** "Does my configuration space reveal at least one combination that nobody proposed in the Briefing?"
> Parent: [HL-OOP_20261021-140019_RSPN3](../../HL-OOP_20261021-140019_RSPN3.md)
> Goal: Платформа полностью стабильна, корректна и готова к запуску Недели 3

## Configuration Space

_Gather used a comparison matrix (fewer than 3 dimensions). Using structured comparison of the issues._

### Приоритизированный список проблем

| # | Проблема | Приоритет | Категория | Файлы | DoD | Effort |
|---|---------|-----------|-----------|-------|-----|--------|
| P1 | Рассинхрон баллов: API возвращает `progress.score` (сохранённый best), UI показывает его рядом с `❌ failed` | **P1-bug** | баг | `week1.py` L175-188, `week2.py` L172-186, `app.js` L794-807 | DoD §3 | S |
| P2 | Дублирование ContentService: 91% идентичного кода между `content_service.py` и `week2_content_service.py` | **P2-debt** | тех.долг | `app/services/content_service.py`, `app/services/week2_content_service.py` | DoD §7 | M |
| P3 | Дублирование `get_or_create_student()` в `week1.py` и `week2.py` | **P2-debt** | тех.долг | `app/api/week1.py` L18-27, `app/api/week2.py` L18-27 | DoD §7 (implicit) | S |
| P4 | Дублирование Pydantic моделей `QuizSubmitRequest`, `PracticeSubmitRequest` | **P2-debt** | тех.долг | `app/api/week1.py` L30-41, `app/api/week2.py` L30-41 | DoD §7 (implicit) | S |
| P5 | Нет общей сводки прогресса | **P1-feature** | фича | новый эндпоинт, новый UI | DoD §4 | M |
| P6 | Нет отметки прочитанности лекций | **P1-feature** | фича | новая модель, эндпоинт, UI | DoD §5 | M |
| P7 | Нет экспорта оценок | **P1-feature** | фича | новый эндпоинт, UI кнопка | DoD §6 | M |
| P8 | Сервер «падает через ~2 мин» — не воспроизводимо | **P0-blocker?** | диагностика | `main.py`, logs | DoD §1 | ? |
| P9 | `/api/runner/check` без аутентификации | **P3-improve** | безопасность | `app/api/runner.py` | — | S |
| P10 | SQLite без WAL mode | **P3-improve** | производительность | `app/db/session.py` | — | S |
| P11 | Нет unique constraint на `(student_id, week_number, topic_id)` | **P3-improve** | целостность | `app/models/course.py` | — | S |

### Effort scale: S = <30 мин, M = 1-2ч

## Findings

### E1: Стратегия исправления score desync (P1)

API должен возвращать **два поля**: `current_score` (из текущей отправки) и `best_score` (из `progress.score`). UI должен различать «текущий результат» и «лучший сохранённый балл».

Изменения:
- `week1.py` / `week2.py`: `submit_practice` возвращает `"current_score": earned_score, "best_score": progress.score`
- `app.js` L805: показывает `Текущий: ${result.current_score}/${result.max_score}, Лучший: ${result.best_score}/${result.max_score}`
- Бейдж при `failed`: показывает `❌ Failed (лучший: 10/10)`

### E2: Стратегия объединения ContentService (P2)

Единый `ContentService(week_number: int)`:
- Конструктор принимает `week_number`, вычисляет `content_dir = Path("content") / f"week{week_number}"`
- Все методы идентичны, кроме `get_practice()` — различия в возвращаемых полях (`invariants` vs `monolith_code`/`requirements`). Решение: возвращать **все** поля из JSON, пусть фронтенд использует нужные.
- Глобальные синглтоны: `week1_service = ContentService(1)`, `week2_service = ContentService(2)`
- `get_or_create_student()` → вынести в `app/services/student.py` или `app/api/common.py`
- Общие Pydantic модели → `app/api/schemas.py`

### E3: Паттерн для новых фич (P5-P7)

Все три новые фичи требуют одного паттерна:
1. **Модель** (SQLAlchemy) — `LectureRead` для P6
2. **Эндпоинт** (FastAPI) — новый роутер `/api/progress/`
3. **UI** (JavaScript) — новые компоненты в `app.js`

Рекомендация: создать `app/api/progress.py` с:
- `GET /api/progress/summary` — агрегация по всем неделям
- `POST /api/progress/lecture-read` — отметка прочитанности
- `GET /api/progress/export` — JSON-экспорт

### E4: Проблема P8 (падение сервера) — анализ непроизводимости

Сервер стабилен при:
- `uvicorn app.main:app` (без reload) — >2 мин работы
- `uvicorn app.main:app --reload` — стабилен с watchfiles
- Все API-эндпоинты отвечают корректно
- DB доступна, StaticFiles не конфликтует

Возможные внешние причины (не входят в scope кодовой базы):
- Терминал/IDE закрывает процесс при переключении окон
- Антивирус блокирует subprocess в RunnerService
- Сетевой тайм-аут прокси/IDE-расширения

**Рекомендация для Executor:** добавить logging middleware, structured error handling. Если падение повторится у владельца — попросить traceback.

## Checkpoint

| Found | Remaining |
|-------|-----------|
| 11 проблем категоризированы с приоритетами P0–P3 | — |
| Стратегии исправления для P1, P2, P5-P7 | — |
| P8 не воспроизводимо, рекомендация: logging | — |

**Sufficiency:**
- [x] External source used? (web search results from Gather)
- [x] Briefing gap closed? (все гипотезы обработаны)
- [x] Configuration Space built from Gather dimensions? _(comparison matrix used — <3 dimensions)_

Stage complete: YES
→ User decision: N/A (Coordinator approved full pass)
