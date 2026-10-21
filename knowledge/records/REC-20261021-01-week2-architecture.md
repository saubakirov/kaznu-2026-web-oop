# Knowledge record — REC-20261021-01-week2-architecture: Архитектура интерактивного учебного модуля Недели 2

> One material claim/decision and its completed or explicitly unresolved disposition.
> Presence is not acceptance. Fill applicable fields; reasoned N/A only when inapplicable.

| Field | Value |
|---|---|
| Record identity | REC-20261021-01-week2-architecture |
| Publication intent | Фиксация архитектурных и методических решений внедрения учебного модуля Недели 2 |
| Kind | technical-reference decision |
| Statement | Учебный модуль Недели 2 объединяет JSON-контент (`content/week2/*.json`), изолированный `Week2ContentService` (по образцу W1), рефакторинг-практикум с 73-строчным монолитом и контрактными тестами через `isinstance`/ABC, оценивание quiz 10 + practice 15 = 25 баллов и Zero-build SPA секцию с отдельным `week2.js` |
| Applicability | Платформа Web OOP, модуль Недели 2 курса CS2203 |
| Grounds and uncertainty | Подтверждено 36 автотестами (pytest), проверкой линтера ruff, независимым REVIEW (APPROVE без замечаний) |
| Disposition | accepted |
| Source | `workspace/2026/OOP_20261021-130458_W2SOLID/REVIEW__OOP_20261021-130458_W2SOLID.md @ 9b89ba7` |
| Originating task and unit | `OOP_20261021-130458_W2SOLID` |
| Producer | coordinator:822e3e77 |
| Qualifier | coordinator:822e3e77 |
| Acceptance authority | saubakirov |
| Completed effect or missing decision: | Обновлены `KNOWLEDGE.md#D8`, `docs/course_curriculum.md` (Неделя 2 → 🟢 Реализовано) |
| Relations | extends `KNOWLEDGE.md#D7`, references `REC-20261014-01-week1-architecture` |

## Source and decision context

В рамках внедрения учебных материалов Недели 2 («Принципы SOLID и Dependency Injection») на сквозном кейсе `Avtobys` приняты ключевые технические решения:
1. **Изоляция модулей (D1):** Каждая неделя получает отдельный `ContentService`, роутер и JS-модуль. Общий рефакторинг на единый `ContentService` отложен как out-of-scope (HL §10).
2. **Рефакторинг-практикум (D2):** Практика — рефакторинг 73-строчного монолита `MonolithicPaymentProcessor` с 4 нарушениями SOLID, а не написание кода с нуля (отличие от W1).
3. **Контрактные тесты (D3):** Тесты практики проверяют контракты через `isinstance`/ABC, а не имена классов, что позволяет студентам использовать собственную декомпозицию.
4. **Балловая система (D4):** Quiz 10 баллов (8 вопросов), Practice 15 баллов (бинарно: 100% тестов = 15, иначе 0). Итого Неделя 2 = 25 баллов.
5. **Frontend-изоляция (D5):** Логика W2 вынесена в отдельный `frontend/js/week2.js` (~230 строк) для минимизации связности с `app.js`.

## Relations and current use

Рекорд фиксирует стандарт реализации W2 и подтверждает применимость шаблона W1 (REC-20261014-01-week1-architecture) к последующим модулям. Наблюдение RF §6 о ~70% дублирования JS-кода W1/W2 зафиксировано для рассмотрения при реализации W3.

**Scoped successor:** D1 («Изоляция модулей: каждая неделя получает отдельный ContentService») superseded by `REC-20261021-02-stabilization-architecture` — `week2_content_service.py` удалён, заменён параметрическим `ContentService(week_number)`. D2–D5 остаются applicable.
