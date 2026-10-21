# Gather — "What do we NOT know?"
> **Mindset:** Explorer. You're mapping unknown territory. Widen before you narrow. Every assumption is a question.
> **Test:** "Can I name every dimension and its alternatives without checking my sources?"
> Parent: [HL-OOP_20261021-140019_RSPN3](../../HL-OOP_20261021-140019_RSPN3.md)
> Goal: Платформа полностью стабильна, корректна и готова к запуску Недели 3

## Dimensions

_Fewer than 3 independent decision dimensions — using comparison matrix in Findings instead._

Задача — аудит с приоритизированным списком исправлений. Нет архитектурных альтернатив для сравнения. Ниже — перечень найденных проблем с категоризацией.

## Findings

### G1: Причина падения сервера — H1 (StaticFiles mount)

**Гипотеза H1 проверена эмпирически и через анализ кода:**

1. **Запуск без `--reload`:** сервер работает стабильно >2 минут, все API-эндпоинты отвечают корректно, StaticFiles отдаёт `index.html` на `/`, `/docs` работает.
2. **Запуск с `--reload`:** сервер работает стабильно, watchfiles следит только за `*.py` файлами (PythonFilter), `.db` и `.json` изменения reload не вызывают.
3. **Порядок маршрутов:** FastAPI регистрирует API routes (L44-48) ДО `app.mount("/")` (L53). Starlette проверяет маршруты по порядку — API-маршруты матчатся первыми, mount `/` — catch-all для статики. Конфликта нет.
4. **Async I/O:** Starlette использует `anyio.open_file` для FileResponse — нет блокирующего I/O. `aiofiles` не нужен.
5. **SQLite:** `check_same_thread=False` установлен. Журнал `delete` (не WAL), `busy_timeout=5000`.

**Вердикт:** H1 **не подтверждена**. StaticFiles mount на `/` не вызывает падение. Сервер стабилен в контролируемых условиях. Вероятные внешние причины: терминал закрывает процесс, IDE перезапускает, или нагрузка от браузерных расширений. Точная причина **не воспроизводима** без логов владельца.

**Внешний источник:** Web search: uvicorn с `watchfiles` по умолчанию следит только за `.py` (PythonFilter, extensions: `.py`, `.pyx`, `.pyd`). StaticFiles в современном Starlette (0.45+) использует `anyio`, не `aiofiles`.

### G2: Рассинхрон баллов практики Week 1 — H2

**Подтверждена. Цепочка:**

1. `week1.py` L164: `earned_score = 10 if passed else 0` — вычисляет текущий результат.
2. L166-174: При **первой** отправке создаёт `TopicProgress(score=earned_score)`. Если `passed=False`, `score=0`.
3. L175-178: При **повторной** отправке — `if passed: progress.score = 10` — **обновляет только при успехе**. При `passed=False` код **не трогает** `progress.score`, сохраняя предыдущее значение (10 если ранее был success).
4. L187: API возвращает `"score": progress.score` — сохранённый лучший балл (10), не текущий (0).
5. `app.js` L805: Терминал показывает `Баллы за практику: ${result.score}/${result.max_score}` → `10/10`.
6. `app.js` L799-800: Бейдж показывает `❌ ${result.status}` → `❌ failed`.

**Результат:** Студент видит `❌ failed` и `10/10` одновременно. Логика keep-best правильна семантически, но API не различает «текущий результат» и «лучший сохранённый».

**Та же проблема в `week2.py`** L161-175 — идентичная логика.

### G3: HL §2 п.3 — Week 2 роутер

**Уже исправлено** в W2SOLID. `main.py` L48: `app.include_router(week2_router)`. Все эндпоинты Week 2 работают — подтверждено эмпирически (`/api/week2/progress` → 200 OK).

### G4: Дублирование кода

1. **`content_service.py` vs `week2_content_service.py`:** 91% идентичного кода (100 из 110 строк). Различия: имя класса, `CONTENT_DIR`, `week_number` default, `get_practice()` возвращает `monolith_code`/`requirements` (W2) vs `invariants` (W1). Легко параметризуется через `ContentService(week_number)`.

2. **`get_or_create_student()`:** Дублирована в `week1.py` и `week2.py` — идентичная логика. Должна быть вынесена в общий модуль.

3. **Pydantic модели:** `QuizSubmitRequest` и `PracticeSubmitRequest` дублированы в обоих API-модулях — идентичные классы.

### G5: Отсутствующие фичи (из HL §2)

| # | Фича | Статус в коде |
|---|------|--------------|
| 4 | Общая сводка прогресса | Нет. Только `/api/week1/progress` и `/api/week2/progress` отдельно |
| 5 | Отметка прочитанности лекций | Нет. Ни модели, ни эндпоинта, ни UI |
| 6 | Экспорт оценок | Нет. Ни эндпоинта, ни кнопки в UI |

### G6: Дополнительные находки (H3)

1. **`/api/runner/check`** — raw code execution endpoint без аутентификации. Любой может POST произвольный Python-код. AST-валидация ловит базовые атаки, но не все (например, `open()` для чтения файлов, рекурсия, memory exhaustion). **Риск: P3** для учебной платформы на localhost.

2. **SQLite не использует WAL mode** — journal_mode=delete. При конкурентных запросах (маловероятно для localhost) возможны SQLITE_BUSY. **Риск: P3.**

3. **Content JSON перечитывается при каждом запросе** — нет кеширования в `ContentService`. `practice.json` читается дважды при submit (один раз в `run_practice_check` → `get_test_code`). **Влияние: минимальное** при localhost.

4. **Нет unique constraint на `(student_id, week_number, topic_id)` в `TopicProgress`** — теоретически возможны дубликаты при race condition (два одновременных запроса для нового студента). На практике крайне маловероятно.

5. **36 тестов проходят.** `ruff check .` без ошибок. Кодовая база в хорошем состоянии линтинга.

## Checkpoint

| Found | Remaining |
|-------|-----------|
| H1 не подтверждена — сервер стабилен, причина не воспроизводима | Точная причина падения (нужен лог от владельца) |
| H2 подтверждена — score desync в API и UI | — |
| H3 подтверждена — 4 доп. находки (runner security, WAL, caching, unique constraint) | — |
| Week 2 router уже исправлен | — |
| 91% дублирование content services | — |
| 3 отсутствующие фичи (сводка, прочитанность, экспорт) | — |

**Sufficiency:**
- [x] External source used? (web search: uvicorn watchfiles behavior, Starlette StaticFiles async I/O)
- [x] Briefing gap closed? (все 3 гипотезы проверены, все 7 проблем из HL §2 проинспектированы)
- [x] Dimensions identified? _(skip — <3 independent factors, used comparison matrix)_

Stage complete: YES
→ User decision: N/A (Coordinator approved full pass)
