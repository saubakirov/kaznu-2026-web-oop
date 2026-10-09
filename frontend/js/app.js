/**
 * Main application script for Web OOP Platform.
 */

import { fetchHealth, fetchCourseOverview, runCodeCheck } from "./api.js";

// Initialize Mermaid.js if present
if (window.mermaid) {
  window.mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose",
  });
}

/**
 * Update system status badges.
 */
async function updateSystemStatus() {
  const backendBadge = document.getElementById("status-backend");
  const dbBadge = document.getElementById("status-db");
  const runnerBadge = document.getElementById("status-runner");

  try {
    const health = await fetchHealth();
    if (backendBadge) {
      backendBadge.className = "status-badge online";
      backendBadge.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>Бэкенд: Активен (v${health.version})`;
    }
    if (dbBadge) {
      const isDbOk = health.database === "connected";
      dbBadge.className = `status-badge ${isDbOk ? "online" : "offline"}`;
      dbBadge.innerHTML = `<span class="inline-block w-2 h-2 rounded-full ${isDbOk ? "bg-emerald-500" : "bg-rose-500"} mr-1.5"></span>SQLite: ${health.database}`;
    }
    if (runnerBadge) {
      runnerBadge.className = "status-badge online";
      runnerBadge.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>Раннер: Готов';
    }
  } catch (err) {
    if (backendBadge) {
      backendBadge.className = "status-badge offline";
      backendBadge.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1.5"></span>Бэкенд: Недоступен';
    }
    if (dbBadge) {
      dbBadge.className = "status-badge offline";
      dbBadge.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1.5"></span>SQLite: Отключен';
    }
    if (runnerBadge) {
      runnerBadge.className = "status-badge offline";
      runnerBadge.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1.5"></span>Раннер: Недоступен';
    }
  }
}

/**
 * Render course syllabus cards.
 */
async function renderCourseModules() {
  const container = document.getElementById("course-modules-container");
  if (!container) return;

  try {
    const overview = await fetchCourseOverview();
    container.innerHTML = overview.weeks
      .map(
        (week) => `
        <div class="border border-slate-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              week.status === "ready_for_content"
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600"
            }">
              ${week.title}
            </span>
            <span class="text-xs text-slate-500 font-medium">${
              week.status === "ready_for_content" ? "Готов к наполнению" : "В разработке"
            }</span>
          </div>
          <h3 class="font-bold text-slate-800 text-base mb-2">${week.subtitle}</h3>
          <ul class="space-y-2 mt-4 text-sm text-slate-600">
            ${week.topics
              .map(
                (topic) => `
              <li class="flex items-start gap-2">
                <span class="text-slate-400 mt-0.5">•</span>
                <div>
                  <div class="font-medium text-slate-700">${topic.title}</div>
                  <div class="text-xs text-slate-500">${topic.description}</div>
                </div>
              </li>
            `
              )
              .join("")}
          </ul>
        </div>
      `
      )
      .join("");
  } catch (err) {
    container.innerHTML = '<p class="text-rose-500 text-sm">Не удалось загрузить модули курса.</p>';
  }
}

/**
 * Render sample Mermaid UML diagram.
 */
async function renderMermaidDiagram() {
  const container = document.getElementById("uml-diagram");
  if (!container || !window.mermaid) return;

  const graphDefinition = `
classDiagram
    direction TB
    class Passenger {
        +str name
        +float balance
        +pay(float amount) bool
        +deposit(float amount) void
    }
    class Validator {
        +str bus_id
        +float base_fare
        +scan(Passenger passenger) bool
    }
    Validator ..> Passenger : scans & charges
  `;

  try {
    const { svg } = await window.mermaid.render("mermaid-svg-passenger", graphDefinition);
    container.innerHTML = svg;
  } catch (err) {
    container.innerHTML = `<pre class="text-xs text-slate-500">${graphDefinition}</pre>`;
  }
}

/**
 * Setup smoke test button handler.
 */
function setupRunnerSmokeTest() {
  const btn = document.getElementById("btn-run-smoke");
  const resultBox = document.getElementById("runner-result");
  const outputPre = document.getElementById("runner-output");
  const timeSpan = document.getElementById("runner-duration");

  if (!btn || !resultBox || !outputPre) return;

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.innerText = "Выполняется проверка...";
    resultBox.classList.remove("hidden");
    outputPre.textContent = "Запуск изолированного процесса pytest...";

    const sampleCode = `class Passenger:
    def __init__(self, name: str, balance: float = 0.0):
        self.name = name
        self.balance = balance

    def pay(self, amount: float) -> bool:
        if self.balance >= amount:
            self.balance -= amount
            return True
        return False
`;

    const sampleTest = `from solution import Passenger

def test_passenger_payment():
    p = Passenger("Алихан", 500.0)
    assert p.pay(100.0) is True
    assert p.balance == 400.0
    assert p.pay(1000.0) is False
`;

    try {
      const result = await runCodeCheck(sampleCode, sampleTest, 5);
      if (timeSpan) {
        timeSpan.textContent = `${result.duration}s`;
      }
      outputPre.textContent = `Статус: ${result.status}\nУспех: ${result.passed}\n\nВывод Pytest:\n${result.output}`;
    } catch (err) {
      outputPre.textContent = `Ошибка вызова: ${err.message}`;
    } finally {
      btn.disabled = false;
      btn.innerText = "Запустить Smoke-тест RunnerService";
    }
  });
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  updateSystemStatus();
  renderCourseModules();
  renderMermaidDiagram();
  setupRunnerSmokeTest();
});
