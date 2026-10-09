"""Isolated pytest code execution sandbox with AST security validation."""

import ast
import os
import subprocess
import sys
import tempfile
import time
from typing import Any

from app.core.config import settings

FORBIDDEN_MODULES = {
    "subprocess",
    "shutil",
    "socket",
    "pty",
    "posix",
    "resource",
    "telnetlib",
    "ctypes",
}

FORBIDDEN_BUILTINS = {
    "eval",
    "exec",
    "__import__",
}


class SecurityVisitor(ast.NodeVisitor):
    """AST visitor inspecting code for unsafe imports and calls."""

    def __init__(self) -> None:
        self.violations: list[str] = []

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            root_mod = alias.name.split(".")[0]
            if root_mod in FORBIDDEN_MODULES:
                self.violations.append(f"Forbidden module import: '{alias.name}'")
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        if node.module:
            root_mod = node.module.split(".")[0]
            if root_mod in FORBIDDEN_MODULES:
                self.violations.append(f"Forbidden module import: '{node.module}'")
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> None:
        if isinstance(node.func, ast.Name) and node.func.id in FORBIDDEN_BUILTINS:
            self.violations.append(f"Forbidden call to builtin: '{node.func.id}'")
        elif (
            isinstance(node.func, ast.Attribute)
            and isinstance(node.func.value, ast.Name)
            and node.func.value.id == "os"
            and node.func.attr in {"system", "popen", "spawn", "execl", "execv"}
        ):
            self.violations.append(f"Forbidden destructive system call: 'os.{node.func.attr}'")
        self.generic_visit(node)


class RunnerService:
    """Service executing student code against test suites in an isolated temporary environment."""

    def __init__(self, default_timeout: int | None = None) -> None:
        self.default_timeout = default_timeout or settings.runner_timeout

    def validate_ast(self, code: str) -> tuple[bool, str]:
        """Validate Python code syntax and safety via AST inspection."""
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return False, f"SyntaxError: {e.msg} (line {e.lineno})"
        except Exception as e:
            return False, f"ParseError: {e}"

        visitor = SecurityVisitor()
        visitor.visit(tree)
        if visitor.violations:
            return False, "; ".join(visitor.violations)

        return True, ""

    def run_code(
        self,
        code: str,
        test_code: str,
        timeout: int | None = None,
    ) -> dict[str, Any]:
        """Execute Python code against test_code using pytest inside a temporary directory."""
        effective_timeout = timeout if timeout is not None else self.default_timeout

        # Step 1: Validate code AST
        valid, error = self.validate_ast(code)
        if not valid:
            return {
                "passed": False,
                "status": "syntax_error" if "SyntaxError" in error else "forbidden",
                "output": error,
                "duration": 0.0,
            }

        # Step 2: Validate test_code AST
        test_valid, test_error = self.validate_ast(test_code)
        if not test_valid:
            return {
                "passed": False,
                "status": "test_syntax_error",
                "output": f"Test suite syntax error: {test_error}",
                "duration": 0.0,
            }

        start_time = time.perf_counter()
        with tempfile.TemporaryDirectory(prefix="web_oop_run_") as tmp_dir:
            solution_file = os.path.join(tmp_dir, "solution.py")
            test_file = os.path.join(tmp_dir, "test_solution.py")

            with open(solution_file, "w", encoding="utf-8") as f:
                f.write(code)

            with open(test_file, "w", encoding="utf-8") as f:
                f.write(test_code)

            cmd = [
                sys.executable,
                "-m",
                "pytest",
                "-v",
                "--tb=short",
                "test_solution.py",
            ]

            env = os.environ.copy()
            env["PYTHONPATH"] = tmp_dir

            try:
                proc = subprocess.run(
                    cmd,
                    cwd=tmp_dir,
                    capture_output=True,
                    text=True,
                    timeout=effective_timeout,
                    env=env,
                )
                duration = time.perf_counter() - start_time
                output = proc.stdout
                if proc.stderr:
                    output = f"{output}\n{proc.stderr}".strip()

                passed = proc.returncode == 0
                return {
                    "passed": passed,
                    "status": "passed" if passed else "failed",
                    "output": output,
                    "duration": round(duration, 3),
                }
            except subprocess.TimeoutExpired:
                duration = time.perf_counter() - start_time
                return {
                    "passed": False,
                    "status": "timeout",
                    "output": f"Execution timed out after {effective_timeout}s.",
                    "duration": round(duration, 3),
                }
            except Exception as exc:
                duration = time.perf_counter() - start_time
                return {
                    "passed": False,
                    "status": "error",
                    "output": f"Runner execution failed: {exc}",
                    "duration": round(duration, 3),
                }
