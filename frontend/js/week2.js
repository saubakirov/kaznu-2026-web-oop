/**
 * Week 2 interactive module: SOLID & Dependency Injection.
 * Handles lecture rendering, quiz, and practice editor for Week 2.
 */

import {
  fetchWeek2Lecture,
  fetchWeek2Quiz,
  submitWeek2Quiz,
  fetchWeek2Practice,
  submitWeek2Practice,
  fetchWeek2Progress,
  markLectureRead,
  fetchLectureReadStatus,
} from "./api.js";

let w2CachedStarterCode = "";
let w2CachedDiagrams = null;

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Format lecture markdown content into styled HTML.
 */
function formatW2LectureContent(rawText) {
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
    '<code class="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs font-semibold border border-blue-100">$1</code>'
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

    const olMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    const ulMatch = line.match(/^[-*•]\s+(.*)$/);
    if (ulMatch) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    flushList();
    result.push(`<p class="text-sm text-slate-700 leading-relaxed my-2">${line}</p>`);
  }

  flushList();
  return result.join("\n");
}

function formatTerminalOutput(rawText) {
  let safe = escapeHtml(rawText);
  safe = safe.replace(/\bPASSED\b/g, '<span class="terminal-pass">PASSED</span>');
  safe = safe.replace(/\bFAILED\b/g, '<span class="terminal-fail">FAILED</span>');
  safe = safe.replace(/\bERROR\b/g, '<span class="terminal-fail">ERROR</span>');
  safe = safe.replace(/(=+ [^=]+ =+)/g, '<span class="text-slate-400 font-bold">$1</span>');
  return safe;
}

/**
 * Load Week 2 lecture content into the DOM.
 */
async function loadW2Lecture() {
  const container = document.getElementById("w2-lecture-container");
  if (!container) return;

  try {
    const lecture = await fetchWeek2Lecture();
    container.innerHTML = `
      <div class="space-y-6">
        <div class="bg-gradient-to-br from-violet-900 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-800/80 text-violet-200 uppercase tracking-wider mb-3">
            <span>📚</span> Лекционный курс
          </div>
          <h3 class="text-xl sm:text-2xl font-extrabold mb-2">${lecture.title}</h3>
          <p class="text-sm text-violet-100">${lecture.subtitle}</p>
        </div>

        <div class="space-y-6">
          ${lecture.sections
            .map(
              (sec, sIdx) => `
            <div class="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
              <div class="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span class="w-7 h-7 rounded-lg bg-violet-100 text-violet-800 font-extrabold text-xs flex items-center justify-center">
                  ${sIdx + 1}
                </span>
                <h4 class="text-base sm:text-lg font-bold text-slate-800">
                  ${sec.title.replace(/^\d+\.\s*/, "")}
                </h4>
              </div>
              <div class="space-y-2">
                ${formatW2LectureContent(sec.content)}
              </div>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="space-y-6 mt-8">
          <div class="flex items-center gap-2 text-slate-800">
            <span class="text-xl">📊</span>
            <h3 class="text-lg font-bold">UML-диаграммы: декомпозиция монолита и DI</h3>
          </div>

          ${lecture.diagrams
            .map(
              (diag, idx) => `
            <div class="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>📐</span> ${diag.title}
                </h4>
                <span class="text-xs font-mono bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full font-semibold border border-violet-100">
                  ${diag.type}
                </span>
              </div>
              <div id="w2-lecture-diagram-${idx}" class="min-h-[240px] flex items-center justify-center overflow-x-auto bg-slate-50/70 p-6 rounded-xl border border-slate-100">
                <span class="text-xs text-slate-400">Отрисовка UML-диаграммы...</span>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    renderW2LectureDiagrams(lecture.diagrams);
  } catch (err) {
    container.innerHTML = `<div class="p-6 bg-rose-50 text-rose-700 rounded-xl">Ошибка загрузки лекции: ${err.message}</div>`;
  }
}

async function renderW2LectureDiagrams(diagrams = null) {
  if (diagrams) w2CachedDiagrams = diagrams;
  if (!w2CachedDiagrams || !window.mermaid) return;

  for (let idx = 0; idx < w2CachedDiagrams.length; idx++) {
    const diag = w2CachedDiagrams[idx];
    const container = document.getElementById(`w2-lecture-diagram-${idx}`);
    if (container) {
      try {
        const { svg } = await window.mermaid.render(`mermaid-w2-lecture-${idx}`, diag.definition);
        container.innerHTML = svg;
      } catch (err) {
        container.innerHTML = `<pre class="text-xs text-slate-600 font-mono">${escapeHtml(diag.definition)}</pre>`;
      }
    }
  }
}

/**
 * Load and render Week 2 Quiz questions.
 */
async function loadW2Quiz() {
  const container = document.getElementById("w2-quiz-questions-list");
  if (!container) return;

  try {
    const quiz = await fetchWeek2Quiz();
    container.innerHTML = quiz.questions
      .map(
        (q, qIdx) => `
        <div class="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4" id="w2-quiz-card-${q.id}">
          <div class="flex items-start justify-between gap-4">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Вопрос ${qIdx + 1} из ${quiz.questions.length}</span>
            <span class="text-xs font-bold px-2.5 py-1 bg-violet-100 text-violet-800 rounded-full font-mono">${q.points} б.</span>
          </div>
          <p class="text-sm sm:text-base font-bold text-slate-800 leading-snug">${q.question}</p>
          <div class="space-y-2.5 mt-3 w2-options-group" data-qid="${q.id}">
            ${q.options
              .map(
                (opt, oIdx) => `
              <label class="quiz-option-label" for="w2-${q.id}-opt-${oIdx}" data-opt="${oIdx}">
                <input type="radio" name="w2-${q.id}" id="w2-${q.id}-opt-${oIdx}" value="${oIdx}" class="mt-1 text-violet-600 focus:ring-violet-500">
                <span class="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">${opt}</span>
              </label>
            `
              )
              .join("")}
          </div>
          <div id="w2-quiz-feedback-${q.id}" class="hidden text-xs sm:text-sm mt-3 p-3.5 rounded-xl leading-relaxed"></div>
        </div>
      `
      )
      .join("");

    container.querySelectorAll(".w2-options-group").forEach((group) => {
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
 * Setup Week 2 Quiz Submission.
 */
function setupW2QuizSubmission() {
  const form = document.getElementById("w2-quiz-form");
  const resultBanner = document.getElementById("w2-quiz-result-banner");
  const statusMsg = document.getElementById("w2-quiz-status-msg");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const answers = {};

    for (const [key, value] of formData.entries()) {
      const realKey = key.replace(/^w2-/, "");
      answers[realKey] = parseInt(value, 10);
    }

    if (Object.keys(answers).length === 0) {
      if (statusMsg) statusMsg.textContent = "Пожалуйста, выберите ответы перед проверкой.";
      return;
    }

    if (statusMsg) statusMsg.textContent = "Проверка ответов...";

    try {
      const resp = await submitWeek2Quiz(answers);
      const evalData = resp.evaluation;

      evalData.details.forEach((det) => {
        const feedbackDiv = document.getElementById(`w2-quiz-feedback-${det.id}`);
        const cardDiv = document.getElementById(`w2-quiz-card-${det.id}`);

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
          "bg-emerald-50", "border-emerald-300", "text-emerald-900",
          "bg-amber-50", "border-amber-300", "text-amber-900"
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
      updateW2Progress();
    } catch (err) {
      if (statusMsg) statusMsg.textContent = `Ошибка проверки: ${err.message}`;
    }
  });
}

/**
 * Load Week 2 practice content.
 */
async function loadW2Practice() {
  const descEl = document.getElementById("w2-practice-description");
  const reqList = document.getElementById("w2-practice-requirements-list");
  const monolithPre = document.getElementById("w2-monolith-code");
  const editor = document.getElementById("w2-practice-code-editor");

  if (!editor) return;

  try {
    const practice = await fetchWeek2Practice();
    w2CachedStarterCode = practice.starter_code;

    if (descEl) descEl.textContent = practice.description;
    if (reqList) {
      reqList.innerHTML = practice.requirements
        .map(
          (req) => `
          <li class="flex items-start gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200/70 shadow-2xs">
            <span class="w-5 h-5 rounded-full bg-violet-100 text-violet-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">✓</span>
            <span class="text-xs text-slate-700 leading-relaxed font-medium">${req}</span>
          </li>
        `
        )
        .join("");
    }
    if (monolithPre) {
      monolithPre.textContent = practice.monolith_code;
    }

    if (!editor.value || editor.value.trim() === "") {
      editor.value = practice.starter_code;
    }
  } catch (err) {
    if (descEl) descEl.textContent = `Ошибка загрузки практикума: ${err.message}`;
  }
}

/**
 * Setup Week 2 practice editor.
 */
function setupW2PracticeEditor() {
  const editor = document.getElementById("w2-practice-code-editor");
  const resetBtn = document.getElementById("w2-btn-reset-practice");
  const submitBtn = document.getElementById("w2-btn-submit-practice");
  const terminal = document.getElementById("w2-practice-terminal-output");
  const statusBadge = document.getElementById("w2-practice-status-badge");
  const durationBadge = document.getElementById("w2-practice-duration-badge");

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
        editor.value = w2CachedStarterCode;
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
          "Отправка кода в изолированную песочницу RunnerService...\nЗапуск эталонного сьюта test_solid_w2.py через pytest...";
      }

      try {
        const result = await submitWeek2Practice(code);
        if (durationBadge) durationBadge.textContent = `${result.duration}s`;

        if (statusBadge) {
          if (result.passed) {
            statusBadge.className = "status-badge online";
            statusBadge.textContent = `✅ Passed (${result.current_score}/${result.max_score} б.)`;
          } else {
            statusBadge.className = "status-badge offline";
            statusBadge.textContent = `❌ ${result.status}`;
          }
        }

        if (terminal) {
          const currentLabel = result.passed
            ? `Текущий результат: ✅ ${result.current_score}/${result.max_score}`
            : `Текущий результат: ❌ ${result.current_score}/${result.max_score}`;
          const bestLabel = `Лучший балл: ${result.best_score}/${result.max_score}`;
          const header = `Статус проверки: ${result.status}\nУспех: ${result.passed}\n${currentLabel}\n${bestLabel}\n\n=== Консольный вывод Pytest ===\n`;
          terminal.innerHTML = header + formatTerminalOutput(result.output);
        }

        updateW2Progress();
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
 * Switch tabs inside Week 2 module.
 */
function switchW2Tab(tabName) {
  const tabBtnLecture = document.getElementById("w2-tab-btn-lecture");
  const tabBtnQuiz = document.getElementById("w2-tab-btn-quiz");
  const tabBtnPractice = document.getElementById("w2-tab-btn-practice");

  const tabContentLecture = document.getElementById("w2-tab-content-lecture");
  const tabContentQuiz = document.getElementById("w2-tab-content-quiz");
  const tabContentPractice = document.getElementById("w2-tab-content-practice");

  [tabBtnLecture, tabBtnQuiz, tabBtnPractice].forEach((btn) => {
    if (btn) {
      btn.classList.remove("active", "border-violet-600", "text-violet-700", "bg-violet-50/60");
      btn.classList.add("border-transparent", "text-slate-500");
    }
  });
  [tabContentLecture, tabContentQuiz, tabContentPractice].forEach((tab) => {
    if (tab) tab.classList.add("hidden");
  });

  if (tabName === "lecture") {
    tabBtnLecture.classList.add("active", "border-violet-600", "text-violet-700", "bg-violet-50/60");
    tabBtnLecture.classList.remove("border-transparent", "text-slate-500");
    tabContentLecture.classList.remove("hidden");
    renderW2LectureDiagrams();
  } else if (tabName === "quiz") {
    tabBtnQuiz.classList.add("active", "border-violet-600", "text-violet-700", "bg-violet-50/60");
    tabBtnQuiz.classList.remove("border-transparent", "text-slate-500");
    tabContentQuiz.classList.remove("hidden");
  } else if (tabName === "practice") {
    tabBtnPractice.classList.add("active", "border-violet-600", "text-violet-700", "bg-violet-50/60");
    tabBtnPractice.classList.remove("border-transparent", "text-slate-500");
    tabContentPractice.classList.remove("hidden");
  }
}

/**
 * Update Week 2 progress badges.
 */
export async function updateW2Progress() {
  try {
    const progress = await fetchWeek2Progress();
    const navBadge = document.getElementById("nav-w2-badge");
    const totalScoreSpan = document.getElementById("w2-total-score");
    const quizScoreBadge = document.getElementById("w2-quiz-score-badge");
    const practiceScoreBadge = document.getElementById("w2-practice-score-badge");

    const totalText = `${progress.total_score}/${progress.total_max}`;
    if (navBadge) navBadge.textContent = totalText;
    if (totalScoreSpan) totalScoreSpan.textContent = progress.total_score;
    if (quizScoreBadge) quizScoreBadge.textContent = `${progress.quiz_score}/${progress.quiz_max}`;
    if (practiceScoreBadge) practiceScoreBadge.textContent = `${progress.practice_score}/${progress.practice_max}`;
  } catch (err) {
    console.error("Failed to update W2 progress:", err);
  }
}

/**
 * Setup Week 2 lecture mark-read button.
 */
function setupW2LectureReadButton() {
  const btn = document.getElementById("btn-mark-lecture-read-w2");
  if (!btn) return;

  fetchLectureReadStatus(2).then((data) => {
    if (data.lecture_read) {
      btn.textContent = "✓ Прочитано ✔";
      btn.classList.add("bg-emerald-100", "text-emerald-800", "border-emerald-300");
      btn.classList.remove("bg-violet-600", "text-white", "hover:bg-violet-700");
      btn.disabled = true;
    }
  }).catch(() => {});

  btn.addEventListener("click", async () => {
    try {
      await markLectureRead(2);
      btn.textContent = "✓ Прочитано ✔";
      btn.classList.add("bg-emerald-100", "text-emerald-800", "border-emerald-300");
      btn.classList.remove("bg-violet-600", "text-white", "hover:bg-violet-700");
      btn.disabled = true;
    } catch (err) {
      console.error("Failed to mark lecture read:", err);
    }
  });
}

/**
 * Initialize Week 2 Module and bind events.
 */
export function loadWeek2Module() {
  loadW2Lecture();
  loadW2Quiz();
  loadW2Practice();

  const tabBtnLecture = document.getElementById("w2-tab-btn-lecture");
  const tabBtnQuiz = document.getElementById("w2-tab-btn-quiz");
  const tabBtnPractice = document.getElementById("w2-tab-btn-practice");

  if (tabBtnLecture) tabBtnLecture.addEventListener("click", () => switchW2Tab("lecture"));
  if (tabBtnQuiz) tabBtnQuiz.addEventListener("click", () => switchW2Tab("quiz"));
  if (tabBtnPractice) tabBtnPractice.addEventListener("click", () => switchW2Tab("practice"));

  setupW2QuizSubmission();
  setupW2PracticeEditor();
  setupW2LectureReadButton();
}
