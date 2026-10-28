/**
 * Week 3 interactive module: GoF Patterns & Clean Architecture.
 * Handles lecture rendering, Mermaid diagrams, quiz, and practice editor for Week 3.
 */

import {
  fetchWeek3Lecture,
  fetchWeek3Quiz,
  submitWeek3Quiz,
  fetchWeek3Practice,
  submitWeek3Practice,
  fetchWeek3Progress,
  markLectureRead,
  fetchLectureReadStatus,
} from "./api.js";

let w3CachedStarterCode = "";
let w3CachedDiagrams = null;

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Format lecture markdown content into styled HTML.
 */
function formatW3LectureContent(rawText) {
  const codeBlocks = [];
  let text = rawText.replace(/```python([\s\S]*?)```/g, (_, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(escapeHtml(code.trim()));
    return `\n\n%%CODEBLOCK_${idx}%%\n\n`;
  });

  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em class="italic text-slate-800">$1</em>');
  text = text.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-xs font-semibold border border-indigo-100">$1</code>'
  );

  const lines = text.split("\n");
  const result = [];
  let currentList = null;

  function flushList() {
    if (!currentList) return;
    if (currentList.type === "ol") {
      const lis = currentList.items
        .map(
          (it, idx) => `
        <li class="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
          <span class="shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center mt-0.5">${idx + 1}</span>
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
          <span class="text-indigo-600 font-bold mt-0.5">•</span>
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

    if (line.startsWith("### ")) {
      flushList();
      const heading = line.replace("### ", "");
      result.push(`
        <h4 class="text-base font-bold text-slate-800 mt-6 mb-2.5 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
          ${heading}
        </h4>
      `);
      continue;
    }

    if (line.startsWith("> ")) {
      flushList();
      const quote = line.replace(/^>\s*/, "");
      result.push(`
        <div class="my-4 p-4 rounded-xl border-l-4 border-indigo-500 bg-indigo-50/50 text-indigo-950 text-sm leading-relaxed">
          ${quote}
        </div>
      `);
      continue;
    }

    const olMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(line.substring(2));
      continue;
    }

    flushList();
    result.push(`<p class="text-sm text-slate-700 leading-relaxed my-2.5">${line}</p>`);
  }
  flushList();

  let html = result.join("");
  codeBlocks.forEach((code, idx) => {
    const placeholder = `%%CODEBLOCK_${idx}%%`;
    const snippetHtml = `
      <div class="my-4 rounded-xl overflow-hidden border border-slate-700/80 shadow-md">
        <div class="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between text-xs text-slate-400">
          <span class="font-mono text-indigo-400 font-semibold flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-indigo-400 inline-block"></span>
            Python 3
          </span>
          <span class="text-slate-400">Паттерны проектирования</span>
        </div>
        <pre class="bg-slate-900 p-4 overflow-x-auto text-xs font-mono text-emerald-300 leading-relaxed"><code>${code}</code></pre>
      </div>
    `;
    html = html.replace(new RegExp(`<p>\\s*${placeholder}\\s*<\\/p>|${placeholder}`, "g"), snippetHtml);
  });

  return html;
}

/**
 * Switch active tab in Week 3 module.
 * @param {'lecture' | 'quiz' | 'practice'} tabName
 */
function switchW3Tab(tabName) {
  const tabBtnLecture = document.getElementById("w3-tab-btn-lecture");
  const tabBtnQuiz = document.getElementById("w3-tab-btn-quiz");
  const tabBtnPractice = document.getElementById("w3-tab-btn-practice");

  const tabContentLecture = document.getElementById("w3-tab-content-lecture");
  const tabContentQuiz = document.getElementById("w3-tab-content-quiz");
  const tabContentPractice = document.getElementById("w3-tab-content-practice");

  [tabBtnLecture, tabBtnQuiz, tabBtnPractice].forEach((btn) => {
    if (btn) {
      btn.classList.remove("active", "border-indigo-600", "text-indigo-700", "bg-indigo-50/60");
      btn.classList.add("border-transparent", "text-slate-500");
    }
  });
  [tabContentLecture, tabContentQuiz, tabContentPractice].forEach((tab) => {
    if (tab) tab.classList.add("hidden");
  });

  if (tabName === "lecture") {
    if (tabBtnLecture) tabBtnLecture.classList.add("active", "border-indigo-600", "text-indigo-700", "bg-indigo-50/60");
    if (tabContentLecture) tabContentLecture.classList.remove("hidden");
    if (w3CachedDiagrams) renderW3LectureDiagrams();
  } else if (tabName === "quiz") {
    if (tabBtnQuiz) tabBtnQuiz.classList.add("active", "border-indigo-600", "text-indigo-700", "bg-indigo-50/60");
    if (tabContentQuiz) tabContentQuiz.classList.remove("hidden");
  } else if (tabName === "practice") {
    if (tabBtnPractice) tabBtnPractice.classList.add("active", "border-indigo-600", "text-indigo-700", "bg-indigo-50/60");
    if (tabContentPractice) tabContentPractice.classList.remove("hidden");
  }
}

/**
 * Load and render Week 3 lecture content.
 */
async function loadW3Lecture() {
  const container = document.getElementById("w3-lecture-container");
  if (!container) return;

  try {
    const lecture = await fetchWeek3Lecture();
    container.innerHTML = `
      <div class="space-y-8">
        <div class="space-y-4">
          ${lecture.sections
            .map(
              (sec, idx) => `
            <div class="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <span class="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center font-mono">3.${idx + 1}</span>
                <h3 class="text-base sm:text-lg font-bold text-slate-900">${sec.title}</h3>
              </div>
              <div class="text-slate-700 leading-relaxed text-sm">
                ${formatW3LectureContent(sec.content)}
              </div>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="space-y-6 mt-8">
          <div class="flex items-center gap-2 text-slate-800">
            <span class="text-xl">📊</span>
            <h3 class="text-lg font-bold">UML-диаграммы: архитектура эквайринга Avtobys</h3>
          </div>

          ${lecture.diagrams
            .map(
              (diag, idx) => `
            <div class="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>📐</span> ${diag.title}
                </h4>
                <span class="text-xs font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-semibold border border-indigo-100">
                  ${diag.type}
                </span>
              </div>
              <div id="w3-lecture-diagram-${idx}" class="min-h-[240px] flex items-center justify-center overflow-x-auto bg-slate-50/70 p-6 rounded-xl border border-slate-100">
                <span class="text-xs text-slate-400">Отрисовка UML-диаграммы...</span>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    renderW3LectureDiagrams(lecture.diagrams);
  } catch (err) {
    container.innerHTML = `<div class="p-6 bg-rose-50 text-rose-700 rounded-xl">Ошибка загрузки лекции: ${err.message}</div>`;
  }
}

async function renderW3LectureDiagrams(diagrams = null) {
  if (diagrams) w3CachedDiagrams = diagrams;
  if (!w3CachedDiagrams || !window.mermaid) return;

  for (let idx = 0; idx < w3CachedDiagrams.length; idx++) {
    const diag = w3CachedDiagrams[idx];
    const container = document.getElementById(`w3-lecture-diagram-${idx}`);
    if (container) {
      try {
        const { svg } = await window.mermaid.render(`mermaid-w3-lecture-${idx}`, diag.definition);
        container.innerHTML = svg;
      } catch (err) {
        container.innerHTML = `<pre class="text-xs text-slate-600 font-mono">${escapeHtml(diag.definition)}</pre>`;
      }
    }
  }
}

/**
 * Load and render Week 3 Quiz questions.
 */
async function loadW3Quiz() {
  const container = document.getElementById("w3-quiz-questions-list");
  if (!container) return;

  try {
    const quiz = await fetchWeek3Quiz();
    container.innerHTML = quiz.questions
      .map(
        (q, qIdx) => `
        <div class="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4" id="w3-quiz-card-${q.id}">
          <div class="flex items-start justify-between gap-4">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Вопрос ${qIdx + 1} из ${quiz.questions.length}</span>
            <span class="text-xs font-bold px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full font-mono">${q.points} б.</span>
          </div>
          <p class="text-sm sm:text-base font-bold text-slate-800 leading-snug">${q.question}</p>
          <div class="space-y-2.5 mt-3 w3-options-group" data-qid="${q.id}">
            ${q.options
              .map(
                (opt, oIdx) => `
              <label class="quiz-option-label" for="w3-${q.id}-opt-${oIdx}" data-opt="${oIdx}">
                <input type="radio" name="w3-${q.id}" id="w3-${q.id}-opt-${oIdx}" value="${oIdx}" class="mt-1 text-indigo-600 focus:ring-indigo-500">
                <span class="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">${opt}</span>
              </label>
            `
              )
              .join("")}
          </div>
          <div id="w3-quiz-feedback-${q.id}" class="hidden text-xs sm:text-sm mt-3 p-3.5 rounded-xl leading-relaxed"></div>
        </div>
      `
      )
      .join("");

    container.querySelectorAll(".w3-options-group").forEach((group) => {
      const labels = group.querySelectorAll(".quiz-option-label");
      labels.forEach((label) => {
        label.addEventListener("click", () => {
          labels.forEach((l) => l.classList.remove("selected"));
          label.classList.add("selected");
        });
      });
    });
  } catch (err) {
    container.innerHTML = `<div class="p-6 bg-rose-50 text-rose-700 rounded-xl">Ошибка загрузки квиза: ${err.message}</div>`;
  }
}

/**
 * Handle Week 3 Quiz form submission.
 */
function setupW3QuizSubmission() {
  const form = document.getElementById("w3-quiz-form");
  const resultBanner = document.getElementById("w3-quiz-result-banner");
  const statusMsg = document.getElementById("w3-quiz-status-msg");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const answers = {};

    for (const [key, value] of formData.entries()) {
      const realKey = key.replace(/^w3-/, "");
      answers[realKey] = parseInt(value, 10);
    }

    if (Object.keys(answers).length === 0) {
      if (statusMsg) statusMsg.textContent = "Пожалуйста, выберите ответы перед проверкой.";
      return;
    }

    if (statusMsg) statusMsg.textContent = "Проверка ответов...";

    try {
      const resp = await submitWeek3Quiz(answers);
      const evalData = resp.evaluation;

      evalData.details.forEach((item) => {
        const feedback = document.getElementById(`w3-quiz-feedback-${item.id}`);
        const card = document.getElementById(`w3-quiz-card-${item.id}`);
        if (!feedback) return;

        feedback.classList.remove("hidden", "bg-emerald-50", "text-emerald-800", "border-emerald-200", "bg-rose-50", "text-rose-800", "border-rose-200");
        feedback.classList.add("border");

        if (item.is_correct) {
          feedback.classList.add("bg-emerald-50", "text-emerald-800", "border-emerald-200");
          feedback.innerHTML = `
            <div class="font-bold flex items-center gap-1.5 mb-1">
              <span>✓ Верно!</span>
              <span class="font-mono text-xs">(+${item.points_awarded} б.)</span>
            </div>
            <p class="text-slate-600">${item.explanation}</p>
          `;
          if (card) {
            card.classList.remove("border-rose-300");
            card.classList.add("border-emerald-300");
          }
        } else {
          feedback.classList.add("bg-rose-50", "text-rose-800", "border-rose-200");
          feedback.innerHTML = `
            <div class="font-bold flex items-center gap-1.5 mb-1">
              <span>✗ Неверно</span>
              <span class="font-mono text-xs">(0 из ${item.max_points} б.)</span>
            </div>
            <p class="text-slate-600">${item.explanation}</p>
          `;
          if (card) {
            card.classList.remove("border-emerald-300");
            card.classList.add("border-rose-300");
          }
        }
      });

      if (resultBanner) {
        resultBanner.classList.remove("hidden", "bg-emerald-50", "border-emerald-300", "text-emerald-900", "bg-amber-50", "border-amber-300", "text-amber-900");
        if (evalData.passed) {
          resultBanner.classList.add("bg-emerald-50", "border-emerald-300", "text-emerald-900");
          resultBanner.innerHTML = `
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-bold text-sm sm:text-base text-emerald-800">Поздравляем! Квиз Недели 3 успешно сдан!</h4>
                <p class="text-xs text-emerald-700 mt-0.5">Набрано <strong>${resp.recorded_score}</strong> из ${resp.max_score} баллов. Результат сохранён в системе прогресса.</p>
              </div>
              <span class="text-2xl">🎉</span>
            </div>
          `;
        } else {
          resultBanner.classList.add("bg-amber-50", "border-amber-300", "text-amber-900");
          resultBanner.innerHTML = `
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-bold text-sm sm:text-base text-amber-800">Квиз не пройден (проходной балл 7)</h4>
                <p class="text-xs text-amber-700 mt-0.5">Набрано <strong>${resp.recorded_score}</strong> из ${resp.max_score} баллов. Изучите пояснения к ошибкам и попробуйте снова.</p>
              </div>
              <span class="text-2xl">⚠️</span>
            </div>
          `;
        }
      }

      if (statusMsg) statusMsg.textContent = "";
      await updateW3Progress();
    } catch (err) {
      if (statusMsg) statusMsg.textContent = `Ошибка: ${err.message}`;
    }
  });
}

/**
 * Load and render Week 3 Practice assignment and template.
 */
async function loadW3Practice() {
  const descEl = document.getElementById("w3-practice-description");
  const reqList = document.getElementById("w3-practice-requirements-list");
  const invList = document.getElementById("w3-practice-invariants-list");
  const editor = document.getElementById("w3-practice-code-editor");

  try {
    const practice = await fetchWeek3Practice();
    w3CachedStarterCode = practice.starter_code || "";

    if (descEl) descEl.textContent = practice.description;
    if (editor && (!editor.value || editor.value.trim() === "")) {
      editor.value = w3CachedStarterCode;
    }

    if (reqList && practice.requirements) {
      reqList.innerHTML = practice.requirements
        .map((r, idx) => `
          <li class="flex items-start gap-2">
            <span class="w-4 h-4 rounded bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">${idx + 1}</span>
            <span>${r}</span>
          </li>
        `)
        .join("");
    }

    if (invList && practice.invariants) {
      invList.innerHTML = practice.invariants
        .map((inv) => `
          <li class="flex items-start gap-2">
            <span class="text-indigo-600 font-bold shrink-0 mt-0.5">•</span>
            <span>${inv}</span>
          </li>
        `)
        .join("");
    }
  } catch (err) {
    if (descEl) descEl.textContent = `Ошибка загрузки практикума: ${err.message}`;
  }
}

/**
 * Setup Week 3 Practice Code Editor and Sandbox execution.
 */
function setupW3PracticeEditor() {
  const editor = document.getElementById("w3-practice-code-editor");
  const resetBtn = document.getElementById("w3-btn-reset-practice");
  const submitBtn = document.getElementById("w3-btn-submit-practice");
  const terminal = document.getElementById("w3-practice-terminal-output");
  const statusBadge = document.getElementById("w3-practice-status-badge");
  const durationBadge = document.getElementById("w3-practice-duration-badge");

  if (!editor) return;

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
        editor.value = w3CachedStarterCode;
      }
    });
  }

  if (submitBtn && terminal) {
    submitBtn.addEventListener("click", async () => {
      const code = editor.value;
      if (!code.trim()) {
        alert("Пожалуйста, напишите код перед отправкой на проверку.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.classList.add("opacity-60", "cursor-not-allowed");
      if (statusBadge) {
        statusBadge.className = "status-badge loading";
        statusBadge.textContent = "Запуск pytest...";
      }
      terminal.textContent = "Запуск изолированной песочницы RunnerService...\nВыполняется тестовый сьют test_patterns_w3.py...\n";

      try {
        const result = await submitWeek3Practice(code);
        terminal.textContent = result.output || "(вывод пуст)";

        if (durationBadge) {
          durationBadge.textContent = `${(result.duration || 0).toFixed(2)}s`;
        }

        if (result.passed) {
          if (statusBadge) {
            statusBadge.className = "status-badge pass";
            statusBadge.textContent = "15/15 б. • Все тесты пройдены!";
          }
        } else {
          if (statusBadge) {
            statusBadge.className = "status-badge fail";
            statusBadge.textContent = "Тесты не пройдены (0/15 б.)";
          }
        }

        await updateW3Progress();
      } catch (err) {
        terminal.textContent = `Ошибка сервиса Runner: ${err.message}`;
        if (statusBadge) {
          statusBadge.className = "status-badge fail";
          statusBadge.textContent = "Сбой песочницы";
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove("opacity-60", "cursor-not-allowed");
      }
    });
  }
}

/**
 * Update Week 3 progress badges.
 */
export async function updateW3Progress() {
  try {
    const progress = await fetchWeek3Progress();
    const navBadge = document.getElementById("nav-w3-badge");
    const totalScoreSpan = document.getElementById("w3-total-score");
    const quizScoreBadge = document.getElementById("w3-quiz-score-badge");
    const practiceScoreBadge = document.getElementById("w3-practice-score-badge");

    const totalText = `${progress.total_score}/${progress.total_max}`;
    if (navBadge) navBadge.textContent = totalText;
    if (totalScoreSpan) totalScoreSpan.textContent = progress.total_score;
    if (quizScoreBadge) quizScoreBadge.textContent = `${progress.quiz_score}/${progress.quiz_max}`;
    if (practiceScoreBadge) practiceScoreBadge.textContent = `${progress.practice_score}/${progress.practice_max}`;
  } catch (err) {
    console.error("Failed to update W3 progress:", err);
  }
}

/**
 * Setup Week 3 lecture mark-read button.
 */
function setupW3LectureReadButton() {
  const btn = document.getElementById("btn-mark-lecture-read-w3");
  if (!btn) return;

  fetchLectureReadStatus(3).then((data) => {
    if (data.lecture_read) {
      btn.textContent = "✓ Прочитано ✔";
      btn.classList.add("bg-emerald-100", "text-emerald-800", "border-emerald-300");
      btn.classList.remove("bg-indigo-600", "text-white", "hover:bg-indigo-700");
      btn.disabled = true;
    }
  }).catch(() => {});

  btn.addEventListener("click", async () => {
    try {
      await markLectureRead(3);
      btn.textContent = "✓ Прочитано ✔";
      btn.classList.add("bg-emerald-100", "text-emerald-800", "border-emerald-300");
      btn.classList.remove("bg-indigo-600", "text-white", "hover:bg-indigo-700");
      btn.disabled = true;
    } catch (err) {
      console.error("Failed to mark lecture read:", err);
    }
  });
}

/**
 * Initialize Week 3 Module and bind events.
 */
export function loadWeek3Module() {
  loadW3Lecture();
  loadW3Quiz();
  loadW3Practice();

  const tabBtnLecture = document.getElementById("w3-tab-btn-lecture");
  const tabBtnQuiz = document.getElementById("w3-tab-btn-quiz");
  const tabBtnPractice = document.getElementById("w3-tab-btn-practice");

  if (tabBtnLecture) tabBtnLecture.addEventListener("click", () => switchW3Tab("lecture"));
  if (tabBtnQuiz) tabBtnQuiz.addEventListener("click", () => switchW3Tab("quiz"));
  if (tabBtnPractice) tabBtnPractice.addEventListener("click", () => switchW3Tab("practice"));

  setupW3QuizSubmission();
  setupW3PracticeEditor();
  setupW3LectureReadButton();
}
