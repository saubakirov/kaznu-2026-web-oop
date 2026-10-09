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
