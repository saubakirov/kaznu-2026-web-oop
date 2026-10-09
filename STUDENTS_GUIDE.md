# Инструкция для студентов: Локальный запуск Web OOP

Привет, команда! Мы заложили технический фундамент нашей образовательной платформы **Web OOP** (мини-LMS для изучения ООП на 2 курсе КазНУ). 

### Что сделано
- **Бэкенд:** FastAPI 0.115+ с автодокументацией OpenAPI (`/docs`).
- **База данных:** SQLite + SQLAlchemy 2.0 (`data/web_oop.db`, автосоздание схемы при старте).
- **Фронтенд:** Zero-build (HTML5 + Tailwind CDN + Vanilla JS ES-модули + Mermaid.js для UML-диаграмм). Никаких `node_modules` и `npm` — работает сразу в браузере!
- **Песочница кода:** `RunnerService` на базе изолированного `pytest` с таймаутом 5 сек и AST-проверкой безопасности.

---

### Пошаговая инструкция для повторения у себя

#### 1. Клонирование репозитория
```bash
git clone https://github.com/saubakirov/kaznu-2026-web-oop.git
cd kaznu-2026-web-oop
```

#### 2. Создание и активация виртуального окружения
- **Windows (PowerShell):**
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
- **macOS / Linux:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

#### 3. Установка зависимостей
```bash
pip install -e .
# или вручную:
pip install fastapi uvicorn pydantic sqlalchemy pytest ruff
```

#### 4. Проверка тестов и линтера
Убедитесь, что все тесты проходят без ошибок:
```bash
pytest
ruff check .
```
*(Должно пройти 14 тестов: API, модели SQLite и песочница кода).*

#### 5. Запуск платформы
```bash
python -m uvicorn app.main:app --reload --port 8000
```

#### 6. Проверка в браузере
- Главная страница: [http://localhost:8000](http://localhost:8000)
  - Должны гореть зеленые индикаторы: **Бэкенд: Active**, **SQLite: Connected**, **Runner: Ready**.
  - Отрендерится UML-диаграмма классов `Avtobys` (`Passenger`, `Validator`).
  - Нажмите кнопку проверки раннера — smoke-тест выполнится за доли секунды.
- Документация API (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
