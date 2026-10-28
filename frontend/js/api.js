/**
 * API client module for Web OOP Platform.
 */

const API_BASE = "";

/**
 * Fetch health status of backend and database.
 * @returns {Promise<{status: string, app: string, version: string, database: string}>}
 */
export async function fetchHealth() {
  const response = await fetch(`${API_BASE}/api/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch course structure and syllabus overview.
 * @returns {Promise<any>}
 */
export async function fetchCourseOverview() {
  const response = await fetch(`${API_BASE}/api/course/overview`);
  if (!response.ok) {
    throw new Error(`Course overview failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Run code and test suite in sandbox.
 * @param {string} code
 * @param {string} testCode
 * @param {number} [timeout]
 * @returns {Promise<{passed: boolean, status: string, output: string, duration: number}>}
 */
export async function runCodeCheck(code, testCode, timeout = 5) {
  const response = await fetch(`${API_BASE}/api/runner/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      test_code: testCode,
      timeout,
    }),
  });

  if (!response.ok) {
    throw new Error(`Runner check failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch Week 1 lecture content and diagrams.
 * @returns {Promise<any>}
 */
export async function fetchWeek1Lecture() {
  const response = await fetch(`${API_BASE}/api/week1/lecture`);
  if (!response.ok) {
    throw new Error(`Week 1 lecture failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch Week 1 quiz questions.
 * @returns {Promise<any>}
 */
export async function fetchWeek1Quiz() {
  const response = await fetch(`${API_BASE}/api/week1/quiz`);
  if (!response.ok) {
    throw new Error(`Week 1 quiz failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Submit answers for Week 1 quiz.
 * @param {Record<string, number>} answers
 * @param {string} [username]
 * @returns {Promise<any>}
 */
export async function submitWeek1Quiz(answers, username = "default_student") {
  const response = await fetch(`${API_BASE}/api/week1/quiz/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      answers,
    }),
  });
  if (!response.ok) {
    throw new Error(`Quiz submission failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch Week 1 practice statement, invariants, and starter template.
 * @returns {Promise<any>}
 */
export async function fetchWeek1Practice() {
  const response = await fetch(`${API_BASE}/api/week1/practice`);
  if (!response.ok) {
    throw new Error(`Week 1 practice failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Submit solution for Week 1 practice.
 * @param {string} code
 * @param {string} [username]
 * @returns {Promise<any>}
 */
export async function submitWeek1Practice(code, username = "default_student") {
  const response = await fetch(`${API_BASE}/api/week1/practice/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      code,
    }),
  });
  if (!response.ok) {
    throw new Error(`Practice submission failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch student cumulative progress for Week 1.
 * @param {string} [username]
 * @returns {Promise<{username: string, quiz_score: number, quiz_max: number, practice_score: number, practice_max: number, total_score: number, total_max: number, is_completed: boolean}>}
 */
export async function fetchWeek1Progress(username = "default_student") {
  const response = await fetch(`${API_BASE}/api/week1/progress?username=${encodeURIComponent(username)}`);
  if (!response.ok) {
    throw new Error(`Week 1 progress failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch Week 2 lecture content and diagrams.
 * @returns {Promise<any>}
 */
export async function fetchWeek2Lecture() {
  const response = await fetch(`${API_BASE}/api/week2/lecture`);
  if (!response.ok) {
    throw new Error(`Week 2 lecture failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch Week 2 quiz questions.
 * @returns {Promise<any>}
 */
export async function fetchWeek2Quiz() {
  const response = await fetch(`${API_BASE}/api/week2/quiz`);
  if (!response.ok) {
    throw new Error(`Week 2 quiz failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Submit answers for Week 2 quiz.
 * @param {Record<string, number>} answers
 * @param {string} [username]
 * @returns {Promise<any>}
 */
export async function submitWeek2Quiz(answers, username = "default_student") {
  const response = await fetch(`${API_BASE}/api/week2/quiz/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      answers,
    }),
  });
  if (!response.ok) {
    throw new Error(`Week 2 quiz submission failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch Week 2 practice statement, monolith code, and starter template.
 * @returns {Promise<any>}
 */
export async function fetchWeek2Practice() {
  const response = await fetch(`${API_BASE}/api/week2/practice`);
  if (!response.ok) {
    throw new Error(`Week 2 practice failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Submit solution for Week 2 practice.
 * @param {string} code
 * @param {string} [username]
 * @returns {Promise<any>}
 */
export async function submitWeek2Practice(code, username = "default_student") {
  const response = await fetch(`${API_BASE}/api/week2/practice/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      code,
    }),
  });
  if (!response.ok) {
    throw new Error(`Week 2 practice submission failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch student cumulative progress for Week 2.
 * @param {string} [username]
 * @returns {Promise<{username: string, quiz_score: number, quiz_max: number, practice_score: number, practice_max: number, total_score: number, total_max: number, is_completed: boolean}>}
 */
export async function fetchWeek2Progress(username = "default_student") {
  const response = await fetch(`${API_BASE}/api/week2/progress?username=${encodeURIComponent(username)}`);
  if (!response.ok) {
    throw new Error(`Week 2 progress failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch aggregate progress summary across all weeks.
 * @param {string} [username]
 * @returns {Promise<any>}
 */
export async function fetchProgressSummary(username = "default_student") {
  const response = await fetch(`${API_BASE}/api/progress/summary?username=${encodeURIComponent(username)}`);
  if (!response.ok) {
    throw new Error(`Progress summary failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch grade export JSON for copy-paste.
 * @param {string} [username]
 * @returns {Promise<any>}
 */
export async function fetchProgressExport(username = "default_student") {
  const response = await fetch(`${API_BASE}/api/progress/export?username=${encodeURIComponent(username)}`);
  if (!response.ok) {
    throw new Error(`Progress export failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Mark lecture as read for a given week.
 * @param {number} weekNumber
 * @param {string} [username]
 * @returns {Promise<any>}
 */
export async function markLectureRead(weekNumber, username = "default_student") {
  const response = await fetch(`${API_BASE}/api/week${weekNumber}/lecture/mark-read?username=${encodeURIComponent(username)}`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Mark lecture read failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch lecture read status for a given week.
 * @param {number} weekNumber
 * @param {string} [username]
 * @returns {Promise<any>}
 */
export async function fetchLectureReadStatus(weekNumber, username = "default_student") {
  const response = await fetch(`${API_BASE}/api/week${weekNumber}/lecture/read-status?username=${encodeURIComponent(username)}`);
  if (!response.ok) {
    throw new Error(`Lecture read status failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch Week 3 lecture content and diagrams.
 * @returns {Promise<any>}
 */
export async function fetchWeek3Lecture() {
  const response = await fetch(`${API_BASE}/api/week3/lecture`);
  if (!response.ok) {
    throw new Error(`Week 3 lecture failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch Week 3 quiz questions.
 * @returns {Promise<any>}
 */
export async function fetchWeek3Quiz() {
  const response = await fetch(`${API_BASE}/api/week3/quiz`);
  if (!response.ok) {
    throw new Error(`Week 3 quiz failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Submit answers for Week 3 quiz.
 * @param {Record<string, number>} answers
 * @param {string} [username]
 * @returns {Promise<any>}
 */
export async function submitWeek3Quiz(answers, username = "default_student") {
  const response = await fetch(`${API_BASE}/api/week3/quiz/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      answers,
    }),
  });
  if (!response.ok) {
    throw new Error(`Week 3 quiz submission failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch Week 3 practice statement, invariants, and starter template.
 * @returns {Promise<any>}
 */
export async function fetchWeek3Practice() {
  const response = await fetch(`${API_BASE}/api/week3/practice`);
  if (!response.ok) {
    throw new Error(`Week 3 practice failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Submit solution for Week 3 practice.
 * @param {string} code
 * @param {string} [username]
 * @returns {Promise<any>}
 */
export async function submitWeek3Practice(code, username = "default_student") {
  const response = await fetch(`${API_BASE}/api/week3/practice/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      code,
    }),
  });
  if (!response.ok) {
    throw new Error(`Week 3 practice submission failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch student cumulative progress for Week 3.
 * @param {string} [username]
 * @returns {Promise<{username: string, quiz_score: number, quiz_max: number, practice_score: number, practice_max: number, total_score: number, total_max: number, is_completed: boolean}>}
 */
export async function fetchWeek3Progress(username = "default_student") {
  const response = await fetch(`${API_BASE}/api/week3/progress?username=${encodeURIComponent(username)}`);
  if (!response.ok) {
    throw new Error(`Week 3 progress failed with HTTP ${response.status}`);
  }
  return response.json();
}

