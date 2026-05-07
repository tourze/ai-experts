# Skill Evaluation Loop

## Workspace Layout

Put eval results next to the skill directory in `<skill-name>-workspace/`.

Use iteration directories:

```text
<skill-name>-workspace/
  iteration-1/
    <eval-name>/
      with_skill/
      without_skill/ or old_skill/
      eval_metadata.json
```

Create directories as runs start, not all upfront. Use descriptive eval names rather than `eval-0`.

## Start With-Skill And Baseline Together

For every eval, start both runs in the same round:

- `with_skill`: points at the current skill.
- `without_skill`: for a newly created skill.
- `old_skill`: for improving an existing skill. Snapshot the old skill before editing.

Do not run with-skill first and baseline later. Same-round launch reduces timing and context skew.

Each `eval_metadata.json` starts with:

```json
{
  "eval_id": 0,
  "eval_name": "descriptive-name",
  "prompt": "The user's task prompt",
  "assertions": []
}
```

## Draft Assertions During Runs

Do not idle while runs execute. Draft objective assertions and explain to the user what they check. Good assertions are scriptable, clearly named, and understandable in the benchmark viewer.

Subjective skills may use qualitative review rather than forced numeric assertions.

Update both `eval_metadata.json` and `evals/evals.json` when assertions are ready.

## Record Timing Immediately

When a run completes, capture notification timing immediately:

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3
}
```

Write this to the run directory as `timing.json`. These values are not recoverable later.

## Grade And Aggregate

For every run, produce `grading.json`. The viewer expects exact fields:

- `text`
- `passed`
- `evidence`

Do not use `name`, `met`, `details`, or other variants. If an assertion can be checked by script, use a script rather than manual inspection.

Aggregate from the skill-creator directory:

```bash
procedure `skill-creator-aggregate-benchmark` <workspace>/iteration-N --skill-name <name>
```

This creates `benchmark.json` and `benchmark.md` with pass rate, time, tokens, mean/stddev, and deltas. When hand-writing or inspecting benchmark data, use `schemas.md`.

Run an analyst pass on the aggregate:

- Assertions that always pass and do not distinguish skill value.
- High-variance evals.
- Time/token tradeoffs.
- Cases where summary stats hide repeated qualitative failure.

## Review Viewer

Use the provided procedure instead of building custom HTML:

```bash
nohup npx tsx src/components/procedures/sources/skill-creator/generate_review.ts \
  <workspace>/iteration-N \
  --skill-name "my-skill" \
  --benchmark <workspace>/iteration-N/benchmark.json \
  > /dev/null 2>&1 &
```

For iteration 2+, also pass `--previous-workspace <workspace>/iteration-<N-1>`.

In headless or Cowork environments, use `--static <output_path>` and have the user export `feedback.json`.

Tell the user the viewer has two areas:

- Outputs for qualitative review.
- Benchmark for quantitative comparison.

When the user finishes review, read `feedback.json`. Empty feedback means the user accepted that run. Prioritize concrete feedback over vague preference.

## Improvement Loop

After feedback:

1. Generalize from failures. Do not patch only the example.
2. Remove instructions that wasted tokens or induced unhelpful actions.
3. Add scripts when repeated deterministic helper code appears across evals.
4. Explain why new constraints exist.
5. Re-run all evals into `iteration-N+1`, including the appropriate baseline.

Stop when the user is satisfied, feedback is empty, or additional iterations no longer produce meaningful improvement.

## Blind Comparison

For stricter A/B comparison, compare two outputs without revealing which skill produced them. Use this only when the user needs stronger evidence than normal review and benchmark results.
