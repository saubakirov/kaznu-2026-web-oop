# Knowledge record — REC-20261014-01-week1-architecture: Архитектура интерактивного учебного модуля Недели 1

> One material claim/decision and its completed or explicitly unresolved disposition.
> Presence is not acceptance. Fill applicable fields; reasoned N/A only when inapplicable.

| Field | Value |
|---|---|
| Record identity | REC-20261014-01-week1-architecture |
| Publication intent | Фиксация архитектурных и методических решений внедрения учебного модуля Недели 1 |
| Kind | technical-reference decision |
| Statement | Учебный модуль Недели 1 объединяет JSON-контент (`content/week1/*.json`), маскирование ответов квиза на бэкенде (`ContentService`), вычисления строго в `decimal.Decimal`, автопроверку в песочнице `RunnerService` (AST + таймаут 5с) и Zero-build SPA интерфейс с живым рендерингом Mermaid.js |
| Applicability | Платформа Web OOP, модуль Недели 1 и шаблон последующих недель курса CS2203 |
| Grounds and uncertainty | Подтверждено 24 автотестами платформы (pytest), проверкой линтера ruff и живой верификацией в браузере (Playwright) |
| Disposition | accepted |
| Source | `workspace/2026/OOP_20261014-133501_W1MAT/REVIEW__OOP_20261014-133501_W1MAT.md @ 4e2125a` |
| Originating task and unit | `OOP_20261014-133501_W1MAT` |
| Producer | saubakirov |
| Qualifier | coordinator:saubakirov |
| Acceptance authority | saubakirov |
| Completed effect or missing decision: | Обновлены `docs/architecture.md`, `docs/course_curriculum.md` и `KNOWLEDGE.md` |
| Relations | references `KNOWLEDGE.md#D7` |

## Source and decision context

В рамках внедрения учебных материалов Недели 1 («Основы ООП, инкапсуляция и защита инвариантов») на сквозном кейсе `Avtobys` приняты ключевые технические решения:
1. **Маскирование квиза (D1):** `GET /api/week1/quiz` исключает `correct_index` и `explanation` для предотвращения списывания через браузерный DevTools. Проверка и разбор производятся на сервере при `POST /api/week1/quiz/submit`.
2. **Финансовая точность (D2):** В доменной модели `TransitCard` и `SingleTripTicket` баланс и тарифы обрабатываются строго в `decimal.Decimal`. Использование `float` признано архитектурной ошибкой в биллинговых системах.
3. **Безопасная автопроверка (D3):** Студенческий код проверяется через AST-анализ (`SecurityVisitor`) и запускается в изолированном временном каталоге с таймаутом 5 секунд.
4. **Zero-build фронтенд (D4):** Рендеринг UML-диаграмм на Mermaid.js и стилизация на Tailwind CDN без привлечения Node.js/npm.

## Relations and current use

Рекорд служит стандартом реализации последующих модулей (Неделя 2: SOLID, Неделя 3: Паттерны GoF). Ссылается на решение D7 в [KNOWLEDGE.md](../../KNOWLEDGE.md).
