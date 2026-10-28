# Knowledge record — REC-20261028-01-week3-architecture: Архитектура интерактивного учебного модуля Недели 3

> One material claim/decision and its completed or explicitly unresolved disposition.
> Presence is not acceptance. Fill applicable fields; reasoned N/A only when inapplicable.

| Field | Value |
|---|---|
| Record identity | REC-20261028-01-week3-architecture |
| Publication intent | Фиксация архитектурных и методических решений внедрения учебного модуля Недели 3 |
| Kind | technical-reference decision |
| Statement | Учебный модуль Недели 3 объединяет структурированный JSON-контент (`content/week3/*.json`: 4 темы лекции по GoF и Clean Architecture с 2 диаграммами Mermaid, квиз на 10 баллов, лабораторная на 15 баллов по архитектурному конвейеру Avtobys с паттернами `BankAdapter`, `TransactionDecorator`, `Chain of Responsibility`), REST API роутер `app/api/week3.py` на базе параметрического `ContentService(3)`, интеграцию в `app/api/progress.py` (`WEEK_CONFIG` расширен до 70 баллов), обновление статуса курса (`is_ready: True`), и Zero-build SPA дашборд `frontend/js/week3.js` |
| Applicability | Платформа Web OOP, модуль Недели 3 курса CS2203 |
| Grounds and uncertainty | Подтверждено 58 автотестами (pytest 100% pass), проверкой линтера ruff, независимым REVIEW (APPROVE без замечаний) |
| Disposition | accepted |
| Source | `workspace/2026/OOP_20261028-121120_W3PAT/REVIEW__OOP_20261028-121120_W3PAT.md @ 95ed38c116c1aa4a8f936f455c163013d706eebf` |
| Originating task and unit | `OOP_20261028-121120_W3PAT` |
| Producer | coordinator:702f85ed-f789-4634-9f51-44a6027572af |
| Qualifier | coordinator:702f85ed-f789-4634-9f51-44a6027572af |
| Acceptance authority | saubakirov |
| Completed effect or missing decision: | Обновлены `KNOWLEDGE.md#D10`, `docs/course_curriculum.md` (Неделя 3 → 🟢 Реализовано), `docs/architecture.md`, `README.md` |
| Relations | extends `KNOWLEDGE.md#D9`, references `REC-20261021-01-week2-architecture`, `REC-20261021-02-stabilization-architecture` |

## Source and decision context

В рамках внедрения учебных материалов Недели 3 («Паттерны проектирования GoF и основы чистой архитектуры») на сквозном кейсе `Avtobys` приняты ключевые технические решения:
1. **Использование параметрического ContentService (D1):** Модуль Недели 3 использует общий `ContentService(3)` без создания дублирующих классов сервиса, что валидирует решение стабилизации RSPN3.
2. **Архитектурный конвейер в лабораторной работе (D2):** Практика объединяет три классических паттерна GoF в единый связный бизнес-сценарий:
   - `KaspiBankAdapter` — структурный адаптер внешнего API Kaspi к доменному интерфейсу `PaymentProcessor`.
   - `AuditLoggingDecorator` — структурный декоратор для прозрачного логирования и аудита транзакций.
   - `Chain of Responsibility` (`StopListHandler` -> `LimitCheckHandler`) — поведенческая цепочка валидации перед списанием.
3. **Балловая система и кумулятивный прогресс (D3):** Quiz 10 баллов + Practice 15 баллов = 25 баллов за Неделю 3. Кумулятивный максимум платформы повышен до 70 баллов (20 за W1 + 25 за W2 + 25 за W3), закрывая полный аудиторный цикл перед экзаменом.
4. **Zero-Build SPA расширение (D4):** Логика дашборда Недели 3 инкапсулирована в `frontend/js/week3.js` с поддержкой динамического рендеринга Mermaid, отметки прочтения лекций и песочницы RunnerService.
5. **Вынесение Финального экзамена (D5):** Экзаменационный модуль (30 баллов: 15 квиз + 15 архитектурный квест) отделён от Недели 3 для защиты контекста и поддержания качества разработки.

## Relations and current use

Рекорд фиксирует завершение 3-недельного ядра курса ООП. Все компоненты 3 недель полностью функциональны и интегрированы в сводный прогресс студента. Следующий логический этап — разработка финального экзаменационного модуля `OOP_..._EXAM`.
