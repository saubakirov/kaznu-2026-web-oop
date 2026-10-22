# Antigravity Adapter

Antigravity's current canonical workspace rule root is `.agents/rules/`, and its default skills
surface is `.agents/skills/`.

The exact manifest commands, canonical sources, and roles are declared once in `../manifest.yaml`.

## Install or Repair

1. Copy `tfw-rules.md.template` to `.agents/rules/tfw.md`.
2. Copy every manifest command skill to `.agents/skills/tfw-{command}/SKILL.md`.
3. Preserve foreign neighbors and customized/unowned content.
4. Repeating install must be a no-op. Verify the vendor root and literal manifest command/role set against
   the manifest; do not accept whatever files already exist as parity.

The persistent rule is a compact router. It does not preload full conventions, glossary, or KNOWLEDGE
and never treats the tooling manifest as runtime authority.

## Coordination Messaging

Under `tfw-gates-only`, TFW role units report gate transitions to their Coordinator via
`send_message`. The target UUID is extracted from the phase or task `status.md` field
`coordinator_route` by stripping the `antigravity:thread:local:` prefix.

| Role | Reports |
|---|---|
| Researcher | Completion of each research iteration; RES artifact delivery |
| Executor | ONB start; blockers requiring `gate_answer`; RF completion |
| Reviewer | REV start; REVIEW verdict (APPROVE / REVISE / REJECT) |

Cross-session addressed messaging between active Antigravity threads is fully supported by the
platform. Role units must send formal notifications directly upon completing gate work instead of
delegating status delivery to the human owner.

Economics is installed/updated by default from the manifest with selected adapters and resolves
`.tfw/workflows/economics.md`. Four formal roles remain; analysis retains an active Role Lock.
Daily opt-in is separate. Public tariff cache/used task copies follow the common economics README;
old optional/custom receivers follow `migrations/economics-core.md` before connected writes.

## Economics Collection on Antigravity IDE

Every role unit (Researcher, Executor, Reviewer, and Coordinator subagents) must collect its own
token economics before returning its gate artifact (RES, RF, REVIEW). This section describes the
concrete mechanism observed on Antigravity IDE 2.17+.

### Source: transcript JSONL

The primary economics source is the conversation transcript. Each agent's transcript is at:

```
~/.gemini/antigravity/brain/<conversation-id>/.system_generated/logs/transcript_full.jsonl
```

The agent's own `conversation-id` is in `<user_information>` → `Conversation ID`. Each line is a
JSON object. Lines with `"type": "PLANNER_RESPONSE"` contain three token counters:

| Field | Meaning |
|---|---|
| `input_tokens` | Fresh (uncached) input tokens for this step |
| `cache_read_tokens` | Cached input tokens for this step |
| `output_tokens` | Output tokens (including reasoning) for this step |

Sum all `PLANNER_RESPONSE` steps for the conversation total. `input_tokens + cache_read_tokens` =
total input. No model name is available in the transcript; model identity comes from the
Coordinator dispatch record or the Antigravity IDE settings.

### Collection procedure

At the return gate (before writing RF, REVIEW, or RES), the role unit:

1. Reads its own `Conversation ID` from `<user_information>`.
2. Reads `transcript_full.jsonl` (or `transcript.jsonl` if full is absent).
3. Sums `input_tokens`, `cache_read_tokens`, `output_tokens` across all `PLANNER_RESPONSE` lines.
4. Records the totals in its return artifact (RF §token_economics, REVIEW §token_economics,
   or RES footer) using this format:

```
### Token economics (self-reported)
- conversation_id: <uuid>
- fresh_input: <n>
- cached_input: <n>
- output: <n>
- total: <n>
- steps: <n>
- source: transcript_full.jsonl
```

5. Reports these totals in the gate notification to `coordinator_route`.

### Coordinator aggregation

The Coordinator collects economics from all role returns and aggregates them in the task
`economics.md`. For subagents whose returns lack self-reported economics, the Coordinator may
extract data post-hoc from subagent transcripts at:

```
~/.gemini/antigravity/brain/<subagent-conversation-id>/.system_generated/logs/transcript_full.jsonl
```

Subagent conversation IDs are recorded in the Coordinator's own transcript as `invoke_subagent`
tool call results containing `"conversationId"`.

### Alternate source: gen_metadata protobuf

The Antigravity IDE conversation SQLite database at
`~/.gemini/antigravity/conversations/<conversation-id>.db` table `gen_metadata` contains protobuf
usage rows. This is the source described in `.tfw/economics/README.md` §"Antigravity IDE numeric
database recipe". The transcript JSONL approach above is simpler and preferred; gen_metadata is a
fallback for richer data (generation duration, cache writes).

### Model identity

Antigravity IDE does not expose the model name in transcript JSONL or reliably in gen_metadata
field 19 (observed absent in 2.17+). The Coordinator must record the selected model at dispatch
time from the Antigravity IDE model selector and include it in the economics report. If unknown,
record `model: unknown (Antigravity IDE)` with the observation that Antigravity IDE uses Google
Gemini models.

### Pricing

Antigravity IDE uses Google Gemini models. The public rate cache at `~/.tfw/rates/` must include
a `google/` provider directory with Gemini model quotes. If only `openai/` exists, the agent must:

1. Fetch current Gemini API pricing from `https://ai.google.dev/pricing` or the applicable
   Google Cloud AI pricing page.
2. Store the observation via `quote-store` under provider `google`.
3. Use the actual model's rates, not OpenAI proxy rates.

If the exact model name is unknown, use the closest known Gemini model's Standard API rates as a
named conditional scenario and disclose the uncertainty. Do not silently apply OpenAI rates to
Gemini token counts.
