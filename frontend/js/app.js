/**
 * Main application script for Web OOP Platform.
 * Supports course syllabus view and interactive Week 1 module.
 */

import {
  fetchHealth,
  fetchCourseOverview,
  runCodeCheck,
  fetchWeek1Lecture,
  fetchWeek1Quiz,
  submitWeek1Quiz,
  fetchWeek1Practice,
  submitWeek1Practice,
  fetchWeek1Progress,
} from "./api.js";

// Initialize Mermaid.js if present
if (window.mermaid) {
  window.mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose",
  });
}

let cachedPracticeStarterCode = "";
let cachedDiagrams = null;

/**
 * Update system status badges in header.
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
 * Render course syllabus cards on overview screen.
 */
async function renderCourseModules() {
  const container = document.getElementById("course-modules-container");
  if (!container) return;

  try {
    const overview = await fetchCourseOverview();
    container.innerHTML = overview.weeks
      .map((week) => {
        const isReady = week.week_number === 1;
        return `
        <div class="border border-slate-200/90 rounded-2xl p-5 sm:p-6 bg-white shadow-xs hover:shadow-md transition ${
          isReady ? "cursor-pointer border-blue-400 ring-2 ring-blue-100/80 hover:border-blue-500" : "opacity-90"
        }" data-week="${week.week_number}">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
              isReady
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-100 text-slate-600"
            }">
              ${week.title}
            </span>
            <span class="text-xs font-medium ${isReady ? "text-emerald-700 font-bold" : "text-slate-400"}">
              ${isReady ? "Готов к изучению 🚀" : "В разработке"}
            </span>
          </div>
          <h3 class="font-extrabold text-slate-800 text-base sm:text-lg mb-2">${week.subtitle}</h3>
          <ul class="space-y-2.5 mt-4 text-sm text-slate-600">
            ${week.topics
              .map(
                (topic) => `
              <li class="flex items-start gap-2.5">
                <span class="${topic.is_ready ? "text-emerald-500 font-bold" : "text-slate-300"} mt-0.5">✓</span>
                <div>
                  <div class="font-semibold text-slate-700">${topic.title}</div>
                  <div class="text-xs text-slate-500 leading-relaxed">${topic.description}</div>
                </div>
              </li>
            `
              )
              .join("")}
          </ul>
          ${
            isReady
              ? `<div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                   <span>Нажмите, чтобы открыть Неделю 1</span>
                   <span>→</span>
                 </div>`
              : ""
          }
        </div>
      `;
      })
      .join("");

    // Add click handler to week 1 card
    const week1Card = container.querySelector('[data-week="1"]');
    if (week1Card) {
      week1Card.addEventListener("click", () => showView("week1"));
    }
  } catch (err) {
    container.innerHTML = '<p class="text-rose-500 text-sm">Не удалось загрузить модули курса.</p>';
  }
}

/**
 * Render sample overview Mermaid UML diagram.
 */
async function renderOverviewMermaidDiagram() {
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
 * Setup smoke test button handler on overview.
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

/**
 * View navigation: switch between 'course' and 'week1'.
 */
export function showView(viewName) {
  const viewOverview = document.getElementById("view-course-overview");
  const viewWeek1 = document.getElementById("view-week1");

  if (viewName === "week1") {
    if (viewOverview) viewOverview.classList.add("hidden");
    if (viewWeek1) viewWeek1.classList.remove("hidden");
    loadWeek1Module();
  } else {
    if (viewOverview) viewOverview.classList.remove("hidden");
    if (viewWeek1) viewWeek1.classList.add("hidden");
  }
  updateWeek1Progress();
}

/**
 * Switch tabs inside Week 1 module.
 */
function switchWeek1Tab(tabName) {
  const tabBtnLecture = document.getElementById("tab-btn-lecture");
  const tabBtnQuiz = document.getElementById("tab-btn-quiz");
  const tabBtnPractice = document.getElementById("tab-btn-practice");

  const tabContentLecture = document.getElementById("tab-content-lecture");
  const tabContentQuiz = document.getElementById("tab-content-quiz");
  const tabContentPractice = document.getElementById("tab-content-practice");

  // Deactivate all
  [tabBtnLecture, tabBtnQuiz, tabBtnPractice].forEach((btn) => {
    if (btn) {
      btn.classList.remove("active", "border-blue-600", "text-blue-700", "bg-blue-50/60");
      btn.classList.add("border-transparent", "text-slate-500");
    }
  });
  [tabContentLecture, tabContentQuiz, tabContentPractice].forEach((tab) => {
    if (tab) tab.classList.add("hidden");
  });

  if (tabName === "lecture") {
    tabBtnLecture.classList.add("active", "border-blue-600", "text-blue-700", "bg-blue-50/60");
    tabBtnLecture.classList.remove("border-transparent", "text-slate-500");
    tabContentLecture.classList.remove("hidden");
    renderLectureDiagrams();
  } else if (tabName === "quiz") {
    tabBtnQuiz.classList.add("active", "border-blue-600", "text-blue-700", "bg-blue-50/60");
    tabBtnQuiz.classList.remove("border-transparent", "text-slate-500");
    tabContentQuiz.classList.remove("hidden");
  } else if (tabName === "practice") {
    tabBtnPractice.classList.add("active", "border-blue-600", "text-blue-700", "bg-blue-50/60");
    tabBtnPractice.classList.remove("border-transparent", "text-slate-500");
    tabContentPractice.classList.remove("hidden");
  }
}

/**
 * Fetch and refresh cumulative progress badges for Week 1.
 */
async function updateWeek1Progress() {
  try {
    const progress = await fetchWeek1Progress();
    const navBadge = document.getElementById("nav-w1-badge");
    const totalScoreSpan = document.getElementById("w1-total-score");
    const quizScoreBadge = document.getElementById("w1-quiz-score-badge");
    const practiceScoreBadge = document.getElementById("w1-practice-score-badge");

    const totalText = `${progress.total_score}/${progress.total_max}`;
    if (navBadge) navBadge.textContent = totalText;
    if (totalScoreSpan) totalScoreSpan.textContent = progress.total_score;
    if (quizScoreBadge) quizScoreBadge.textContent = `${progress.quiz_score}/${progress.quiz_max}`;
    if (practiceScoreBadge) practiceScoreBadge.textContent = `${progress.practice_score}/${progress.practice_max}`;
  } catch (err) {
    console.error("Failed to update progress:", err);
  }
}

/**
 * Robust line-by-line markdown parser for lecture content.
 * Perfectly formats code blocks, bold text, lists, and inline tags.
 */
function formatLectureContent(rawText) {
  // 1. Isolate code blocks
  const codeBlocks = [];
  let text = rawText.replace(/```python([\s\S]*?)```/g, (_, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(escapeHtml(code.trim()));
    return `\n\n%%CODEBLOCK_${idx}%%\n\n`;
  });

  // 2. Bold and Italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em class="italic text-slate-800">$1</em>');

  // 3. Inline code badges
  text = text.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs font-semibold border border-blue-100">$1</code>'
  );

  // 4. Line by line parser to handle lists and paragraphs cleanly
  const lines = text.split("\n");
  const result = [];
  let currentList = null; // { type: 'ol' | 'ul', items: [] }

  function flushList() {
    if (!currentList) return;
    if (currentList.type === "ol") {
      const lis = currentList.items
        .map(
          (it, idx) => `
        <li class="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
          <span class="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center mt-0.5">${idx + 1}</span>
          <div class="flex-1">${it}</div>
        </li>
      `
        )
        .join("");
      result.push(`<ul class="space-y-3 my-4 p-4 bg-slate-50/90 rounded-xl border border-slate-200/80">${lis}</ul>`);
    } else {
      const lis = currentList.items
        .map(
          (it) => `
        <li class="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
          <span class="text-blue-600 font-bold mt-0.5">•</span>
          <div class="flex-1">${it}</div>
        </li>
      `
        )
        .join("");
      result.push(`<ul class="space-y-2.5 my-3 pl-2">${lis}</ul>`);
    }
    currentList = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      flushList();
      continue;
    }

    // Code block placeholder
    const codeMatch = line.match(/^%%CODEBLOCK_(\d+)%%$/);
    if (codeMatch) {
      flushList();
      const codeIndex = parseInt(codeMatch[1], 10);
      const code = codeBlocks[codeIndex];
      result.push(`
        <div class="my-4 rounded-xl overflow-hidden border border-slate-800 shadow-md">
          <div class="bg-slate-800/90 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span class="ml-2 text-slate-200 font-semibold">Python 3.12</span>
            </span>
            <span class="text-slate-400">code_example.py</span>
          </div>
          <pre class="code-box text-xs p-4 overflow-x-auto m-0 rounded-none bg-slate-950 text-emerald-300 leading-relaxed font-mono"><code>${code}</code></pre>
        </div>
      `);
      continue;
    }

    // Numbered list item: 1. Item
    const olMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    // Bulleted list item: - Item
    const ulMatch = line.match(/^[-*•]\s+(.*)$/);
    if (ulMatch) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // Ordinary paragraph
    flushList();
    result.push(`<p class="text-sm text-slate-700 leading-relaxed my-2">${line}</p>`);
  }

  flushList();
  return result.join("\n");
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Load Week 1 lecture content.
 */
async function loadLecture() {
  const container = document.getElementById("lecture-container");
  if (!container) return;

  try {
    const lecture = await fetchWeek1Lecture();
    container.innerHTML = `
      <div class="space-y-6">
        <!-- Hero Header -->
        <div class="bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-800/80 text-blue-200 uppercase tracking-wider mb-3">
            <span>📚</span> Лекционный курс
          </div>
          <h3 class="text-xl sm:text-2xl font-extrabold mb-2">${lecture.title}</h3>
          <p class="text-sm text-blue-100">${lecture.subtitle}</p>
        </div>

        <!-- Sections Cards -->
        <div class="space-y-6">
          ${lecture.sections
            .map(
              (sec, sIdx) => `
            <div class="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
              <div class="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span class="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center justify-center">
                  ${sIdx + 1}
                </span>
                <h4 class="text-base sm:text-lg font-bold text-slate-800">
                  ${sec.title.replace(/^\d+\.\s*/, "")}
                </h4>
              </div>
              <div class="space-y-2">
                ${formatLectureContent(sec.content)}
              </div>
            </div>
          `
            )
            .join("")}
        </div>

        <!-- UML Diagrams Section -->
        <div class="space-y-6 mt-8">
          <div class="flex items-center gap-2 text-slate-800">
            <span class="text-xl">📊</span>
            <h3 class="text-lg font-bold">Архитектурные диаграммы предметной области</h3>
          </div>

          ${lecture.diagrams
            .map(
              (diag, idx) => `
            <div class="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>📐</span> ${diag.title}
                </h4>
                <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold border border-blue-100">
                  ${diag.type}
                </span>
              </div>
              <div id="lecture-diagram-${idx}" class="min-h-[240px] flex items-center justify-center overflow-x-auto bg-slate-50/70 p-6 rounded-xl border border-slate-100">
                <span class="text-xs text-slate-400">Отрисовка UML-диаграммы...</span>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    renderLectureDiagrams(lecture.diagrams);
  } catch (err) {
    container.innerHTML = `<div class="p-6 bg-rose-50 text-rose-700 rounded-xl">Ошибка загрузки лекции: ${err.message}</div>`;
  }
}

async function renderLectureDiagrams(diagrams = null) {
  if (diagrams) cachedDiagrams = diagrams;
  if (!cachedDiagrams || !window.mermaid) return;

  for (let idx = 0; idx < cachedDiagrams.length; idx++) {
    const diag = cachedDiagrams[idx];
    const container = document.getElementById(`lecture-diagram-${idx}`);
    if (container) {
      try {
        const { svg } = await window.mermaid.render(`mermaid-lecture-${idx}`, diag.definition);
        container.innerHTML = svg;
      } catch (err) {
        container.innerHTML = `<pre class="text-xs text-slate-600 font-mono">${escapeHtml(diag.definition)}</pre>`;
      }
    }
  }
}

/**
 * Load and render Week 1 Quiz questions.
 */
async function loadQuiz() {
  const container = document.getElementById("quiz-questions-list");
  if (!container) return;

  try {
    const quiz = await fetchWeek1Quiz();
    container.innerHTML = quiz.questions
      .map(
        (q, qIdx) => `
        <div class="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4" id="quiz-card-${q.id}">
          <div class="flex items-start justify-between gap-4">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Вопрос ${qIdx + 1} из ${quiz.questions.length}</span>
            <span class="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-mono">${q.points} б.</span>
          </div>
          <p class="text-sm sm:text-base font-bold text-slate-800 leading-snug">${q.question}</p>
          <div class="space-y-2.5 mt-3 options-group" data-qid="${q.id}">
            ${q.options
              .map(
                (opt, oIdx) => `
              <label class="quiz-option-label" for="${q.id}-opt-${oIdx}" data-opt="${oIdx}">
                <input type="radio" name="${q.id}" id="${q.id}-opt-${oIdx}" value="${oIdx}" class="mt-1 text-blue-600 focus:ring-blue-500">
                <span class="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">${opt}</span>
              </label>
            `
              )
              .join("")}
          </div>
          <div id="quiz-feedback-${q.id}" class="hidden text-xs sm:text-sm mt-3 p-3.5 rounded-xl leading-relaxed"></div>
        </div>
      `
      )
      .join("");

    // Bind option click visual state
    container.querySelectorAll(".options-group").forEach((group) => {
      const labels = group.querySelectorAll(".quiz-option-label");
      labels.forEach((label) => {
        label.addEventListener("click", () => {
          labels.forEach((l) => l.classList.remove("selected"));
          label.classList.add("selected");
        });
      });
    });
  } catch (err) {
    container.innerHTML = `<div class="p-4 bg-rose-50 text-rose-700 rounded-lg">Ошибка загрузки квиза: ${err.message}</div>`;
  }
}

/**
 * Handle Quiz Submission.
 */
function setupQuizSubmission() {
  const form = document.getElementById("quiz-form");
  const resultBanner = document.getElementById("quiz-result-banner");
  const statusMsg = document.getElementById("quiz-status-msg");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const answers = {};

    for (const [key, value] of formData.entries()) {
      answers[key] = parseInt(value, 10);
    }

    if (Object.keys(answers).length === 0) {
      if (statusMsg) statusMsg.textContent = "Пожалуйста, выберите ответы перед проверкой.";
      return;
    }

    if (statusMsg) statusMsg.textContent = "Проверка ответов...";

    try {
      const resp = await submitWeek1Quiz(answers);
      const evalData = resp.evaluation;

      // Update per-question visual state and feedback
      evalData.details.forEach((det) => {
        const feedbackDiv = document.getElementById(`quiz-feedback-${det.id}`);
        const cardDiv = document.getElementById(`quiz-card-${det.id}`);

        if (cardDiv) {
          const labels = cardDiv.querySelectorAll(".quiz-option-label");
          labels.forEach((lbl) => {
            lbl.classList.remove("correct", "incorrect");
            const optIdx = parseInt(lbl.getAttribute("data-opt"), 10);
            if (optIdx === det.correct_index) {
              lbl.classList.add("correct");
            } else if (optIdx === det.chosen_index && !det.is_correct) {
              lbl.classList.add("incorrect");
            }
          });
        }

        if (feedbackDiv) {
          feedbackDiv.classList.remove("hidden", "bg-emerald-50", "text-emerald-900", "bg-rose-50", "text-rose-900");
          if (det.is_correct) {
            feedbackDiv.classList.add("bg-emerald-50", "text-emerald-900", "border", "border-emerald-200");
            feedbackDiv.innerHTML = `<strong>✅ Верно! (+${det.points_awarded} б.)</strong> ${det.explanation}`;
          } else {
            feedbackDiv.classList.add("bg-rose-50", "text-rose-900", "border", "border-rose-200");
            feedbackDiv.innerHTML = `<strong>❌ Неверно (0 б.).</strong> Правильный ответ: вариант ${det.correct_index + 1}.<br>${det.explanation}`;
          }
        }
      });

      if (resultBanner) {
        resultBanner.classList.remove(
          "hidden",
          "bg-emerald-50",
          "border-emerald-300",
          "text-emerald-900",
          "bg-amber-50",
          "border-amber-300",
          "text-amber-900"
        );
        if (evalData.passed) {
          resultBanner.classList.add("bg-emerald-50", "border-emerald-300", "text-emerald-900");
          resultBanner.innerHTML = `
            <div class="flex items-center gap-3">
              <span class="text-3xl">🎉</span>
              <div>
                <h4 class="font-extrabold text-sm sm:text-base">Квиз успешно сдан!</h4>
                <p class="text-xs sm:text-sm mt-0.5">Вы набрали <strong>${evalData.earned_points} из ${evalData.total_points} баллов</strong>. Прогресс сохранен в SQLite.</p>
              </div>
            </div>
          `;
        } else {
          resultBanner.classList.add("bg-amber-50", "border-amber-300", "text-amber-900");
          resultBanner.innerHTML = `
            <div class="flex items-center gap-3">
              <span class="text-3xl">⚠️</span>
              <div>
                <h4 class="font-extrabold text-sm sm:text-base">Попробуйте еще раз</h4>
                <p class="text-xs sm:text-sm mt-0.5">Вы набрали <strong>${evalData.earned_points} из ${evalData.total_points} баллов</strong> (проходной балл: 7). Изучите объяснения к ошибкам и пересдайте квиз.</p>
              </div>
            </div>
          `;
        }
      }

      if (statusMsg) statusMsg.textContent = "Проверка завершена.";
      updateWeek1Progress();
    } catch (err) {
      if (statusMsg) statusMsg.textContent = `Ошибка проверки: ${err.message}`;
    }
  });
}

/**
 * Load and configure Week 1 practice.
 */
async function loadPractice() {
  const descEl = document.getElementById("practice-description");
  const invList = document.getElementById("practice-invariants-list");
  const editor = document.getElementById("practice-code-editor");

  if (!editor) return;

  try {
    const practice = await fetchWeek1Practice();
    cachedPracticeStarterCode = practice.starter_code;

    if (descEl) descEl.textContent = practice.description;
    if (invList) {
      invList.innerHTML = practice.invariants
        .map(
          (inv) => `
          <li class="flex items-start gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200/70 shadow-2xs">
            <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">✓</span>
            <span class="text-xs text-slate-700 leading-relaxed font-medium">${inv}</span>
          </li>
        `
        )
        .join("");
    }

    if (!editor.value || editor.value.trim() === "") {
      editor.value = practice.starter_code;
    }
  } catch (err) {
    if (descEl) descEl.textContent = `Ошибка загрузки практикума: ${err.message}`;
  }
}

/**
 * Format raw pytest console text with colored tokens.
 */
function formatTerminalOutput(rawText) {
  let safe = escapeHtml(rawText);
  // Highlight PASSED / FAILED
  safe = safe.replace(/\bPASSED\b/g, '<span class="terminal-pass">PASSED</span>');
  safe = safe.replace(/\bFAILED\b/g, '<span class="terminal-fail">FAILED</span>');
  safe = safe.replace(/\bERROR\b/g, '<span class="terminal-fail">ERROR</span>');
  safe = safe.replace(/(=+ [^=]+ =+)/g, '<span class="text-slate-400 font-bold">$1</span>');
  return safe;
}

/**
 * Setup code editor Tab-indentation and actions.
 */
function setupPracticeEditor() {
  const editor = document.getElementById("practice-code-editor");
  const resetBtn = document.getElementById("btn-reset-practice");
  const submitBtn = document.getElementById("btn-submit-practice");
  const terminal = document.getElementById("practice-terminal-output");
  const statusBadge = document.getElementById("practice-status-badge");
  const durationBadge = document.getElementById("practice-duration-badge");

  if (!editor) return;

  // Tab key indents 4 spaces
  editor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.substring(0, start) + "    " + editor.value.substring(end);
      editor.selectionStart = editor.selectionEnd = start + 4;
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Сбросить редактор к исходному шаблону? Текущие изменения будут удалены.")) {
        editor.value = cachedPracticeStarterCode;
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      const code = editor.value;
      if (!code || code.trim() === "") {
        alert("Пожалуйста, напишите код перед отправкой на проверку.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = "<span>⏳ Исполнение в RunnerService...</span>";
      if (statusBadge) {
        statusBadge.className = "status-badge loading";
        statusBadge.textContent = "Тестирование...";
      }
      if (terminal) {
        terminal.innerHTML =
          "Отправка кода в изолированную песочницу RunnerService...\nЗапуск эталонного сьюта test_domain_w1.py через pytest...";
      }

      try {
        const result = await submitWeek1Practice(code);
        if (durationBadge) durationBadge.textContent = `${result.duration}s`;

        if (statusBadge) {
          if (result.passed) {
            statusBadge.className = "status-badge online";
            statusBadge.textContent = "✅ 100% Passed (10/10 б.)";
          } else {
            statusBadge.className = "status-badge offline";
            statusBadge.textContent = `❌ ${result.status}`;
          }
        }

        if (terminal) {
          const header = `Статус проверки: ${result.status}\nУспех: ${result.passed}\nБаллы за практику: ${result.score}/${result.max_score}\n\n=== Консольный вывод Pytest ===\n`;
          terminal.innerHTML = header + formatTerminalOutput(result.output);
        }

        updateWeek1Progress();
      } catch (err) {
        if (statusBadge) {
          statusBadge.className = "status-badge offline";
          statusBadge.textContent = "Ошибка сети/бэкенда";
        }
        if (terminal) {
          terminal.textContent = `Ошибка выполнения запроса: ${err.message}`;
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "<span>▶ Проверить решение</span>";
      }
    });
  }
}

/**
 * Initialize Week 1 Module materials and listeners.
 */
function loadWeek1Module() {
  loadLecture();
  loadQuiz();
  loadPractice();
}

/**
 * Bind global UI buttons and navigation listeners.
 */
function bindGlobalEvents() {
  // Navigation
  const btnHeroStart = document.getElementById("btn-hero-start-week1");
  const navBtnWeek1 = document.getElementById("nav-btn-week1");
  const navBtnCourse = document.getElementById("nav-btn-course");
  const navBrand = document.getElementById("nav-brand");
  const btnBack = document.getElementById("btn-back-to-course");

  if (btnHeroStart) btnHeroStart.addEventListener("click", () => showView("week1"));
  if (navBtnWeek1) navBtnWeek1.addEventListener("click", () => showView("week1"));
  if (navBtnCourse) navBtnCourse.addEventListener("click", () => showView("course"));
  if (navBrand) navBrand.addEventListener("click", () => showView("course"));
  if (btnBack) btnBack.addEventListener("click", () => showView("course"));

  // Week 1 Tabs
  const tabBtnLecture = document.getElementById("tab-btn-lecture");
  const tabBtnQuiz = document.getElementById("tab-btn-quiz");
  const tabBtnPractice = document.getElementById("tab-btn-practice");

  if (tabBtnLecture) tabBtnLecture.addEventListener("click", () => switchWeek1Tab("lecture"));
  if (tabBtnQuiz) tabBtnQuiz.addEventListener("click", () => switchWeek1Tab("quiz"));
  if (tabBtnPractice) tabBtnPractice.addEventListener("click", () => switchWeek1Tab("practice"));

  setupQuizSubmission();
  setupPracticeEditor();
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  updateSystemStatus();
  renderCourseModules();
  renderOverviewMermaidDiagram();
  setupRunnerSmokeTest();
  bindGlobalEvents();
  updateWeek1Progress();
});
