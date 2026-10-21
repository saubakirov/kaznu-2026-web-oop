# Briefing — "What should we investigate?"
> **Mindset:** Strategist. You're planning an investigation, not doing it. Frame what matters. Resist solving.
> **Test:** "Can I explain WHY we're investigating this and what would change our approach?"
> Parent: [HL-OOP_20261021-140019_RSPN3](../../HL-OOP_20261021-140019_RSPN3.md)
> Goal: Платформа полностью стабильна, корректна и готова к запуску Недели 3
> Producer unit: Researcher subagent (Antigravity subagent of 9acfb628-dc99-4483-ac36-00c9a4e3c115)
> Parent Coordinator: antigravity:thread:local:9acfb628-dc99-4483-ac36-00c9a4e3c115
> Activation / dispatch source: Coordinator dispatch `/tfw-research OOP_20261021-140019_RSPN3`
> Coordination authority: HL-OOP_20261021-140019_RSPN3.md @ 05d0771dc9fb9872eb98aaeb3a6ba415e3b63060
> Originating proposer: none

## Research Plan

### Gather
- Проанализировать `main.py` на порядок регистрации роутеров и mount StaticFiles — выявить конфликты маршрутов
- Проверить `session.py` на SQLite thread-safety (`check_same_thread`, WAL mode, connection pooling)
- Инспектировать практику Week 1 (`week1.py` L130-189): поток данных score/status при `passed=False` vs `passed=True`
- Сравнить `content_service.py` и `week2_content_service.py` — детализировать масштаб дублирования
- Просканировать все эндпоинты (`health.py`, `course.py`, `runner.py`, `week1.py`, `week2.py`) на незащищённые операции и мёртвый код

### Extract
- Категоризировать все проблемы по P0–P3 (P0=блокирует работу, P1=баг, P2=долг, P3=улучшение)
- Сопоставить каждую проблему с конкретной строкой кода и DoD-критерием
- Оценить масштаб дублирования (LOC, % идентичного кода)

### Challenge
- Проверить гипотезу H1 (StaticFiles mount) через анализ порядка маршрутов в Starlette
- Проверить, не создаёт ли `RunnerService` утечку ресурсов (subprocess, tmpfiles)
- Оценить риски рефакторинга ContentService для обратной совместимости

## Hypotheses (from HL §10)

| # | Hypothesis | HL Status |
|---|-----------|-----------|
| H1 | Сервер падает из-за конфликта StaticFiles mount на `/` с API-маршрутами | open |
| H2 | Рассинхрон баллов вызван только логикой «keep best» без отображения текущего результата | open |
| H3 | В кодовой базе есть дополнительные незамеченные архитектурные долги помимо известных 7 проблем | open |

## Scope Intent
- **In scope:** Все файлы `app/`, `frontend/js/`, `app/models/`, `app/db/`, `app/services/`, `tests/`, `content/`; маршрутизация, DB, score flow, code duplication, security, dead code
- **Out of scope:** Содержимое JSON-контента (лекции, квизы); UX-дизайн фронтенда; Week 3 контент; CI/CD; деплой

## Guiding Questions
1. Владелец сообщил «сервер падает через ~2 минуты» — есть ли лог ошибки или traceback? Или это наблюдение без данных?
2. Замечание о рассинхроне баллов (failed + 10/10) — было ли это именно для Week 1 practice, или для обоих Week?
3. Есть ли другие замечания от студентов, помимо перечисленных в HL §2?

## User Direction

1. **Падение сервера:** Только визуальное наблюдение («запускаю, через пару минут отключается»). Traceback нет. Нужна эмпирическая проверка.
2. **Рассинхрон баллов:** Конкретно Week 1 practice. Владелец: «нажал проверить, failed все тесты, но баллы 10/10». Подтверждает keep-best гипотезу.
3. **Других замечаний нет.** Все проблемы в HL §2.
4. **HL §2 п.3 (week2_router):** Уже исправлено в W2SOLID. Зафиксировать в Gather как resolved.

Coordinator: продолжать без WAIT, вернуть финальный RES или критический блокер.

---
Stage complete: YES
