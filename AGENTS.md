# AGENTS.md — Инструкции для ИИ-агентов проекта Web OOP

Проект представляет собой интерактивную веб-платформу (мини-LMS) для изучения Объектно-Ориентированного Программирования (ООП) на 2 курсе КазНУ.
Разработка ведется по методологии Trace-First Workflow (TFW Full).

<!-- TFW:CODEX:START -->
## Trace-First Workflow Commands

`.tfw/` traces are truth/memory. For `/tfw-*`, invoke its skill or read the canonical workflow completely. Root instructions are active; the workflow's read contract selects all further inputs and owns Role Lock, gates, templates, evidence, stop and route. The command must work without a wrapper.

**Working material and comments.** Keep raw output, logs, exports, screenshots and scratch
scripts in the system temporary directory under `tfw/<task or record ID>/`, never in the project,
and remove them when your work ends. A comment exists only when it carries value for its file's
reader or a program reads it, never as a note to agents, deferred work, history or an excuse
(`conventions.md` → `Working material`, `Comments`).

| Command | Canonical workflow |
|---------|--------------------|
| `/tfw-plan` | `.tfw/workflows/plan.md` |
| `/tfw-research` | `.tfw/workflows/research/base.md` |
| `/tfw-handoff` | `.tfw/workflows/handoff.md` |
| `/tfw-review` | `.tfw/workflows/review.md` |
| `/tfw-docs` | `.tfw/workflows/docs.md` |
| `/tfw-knowledge` | `.tfw/workflows/knowledge.md` |
| `/tfw-release` | `.tfw/workflows/release.md` |
| `/tfw-update` | `.tfw/workflows/update.md` |
| `/tfw-config` | `.tfw/workflows/config.md` |
| `/tfw-init` | `.tfw/workflows/init.md` |
| `/tfw-economics` | `.tfw/workflows/economics.md` |

At new-task Plan entry, after identifying the request and active platform and completing the
workflow's task-control and shared-rule reads, read exactly
`.tfw/adapters/antigravity/coordinator.md` for the owner-facing startup card and initial mode choice.
At Plan Step 5 validate that choice and current capability; re-read this selected profile only
when the active surface or relevant capability materially changes. The task Coordinator uses the selected profile for new work. Do not preload other profiles or the tooling
manifest, and do not load this profile for every role command. A missing or ambiguous selected
pointer refuses a provider-specific offer and is reported without guessing.
For new work, one task Coordinator handles a one-phase task; long work uses distinct phase
Coordinators with bounded upward returns. Historical GATEWAY/LEAD carriers remain readable,
but a principal, title or host never supplies a route or mandate.
<!-- TFW:CODEX:END -->
