# Description Optimization And Packaging

## Trigger Eval Queries

The `description` field is the primary trigger surface. After creating or improving a skill, offer description optimization when trigger accuracy matters.

Create about 20 eval queries:

- 8-10 `should_trigger`
- 8-10 `should_not_trigger`

Queries must look like real user prompts. Include concrete files, context, URLs, data columns, task wording, abbreviations, typos, and casual phrasing. Avoid obvious toy prompts.

Good negative examples are near-misses: shared keywords or concepts that should route to another skill. Avoid unrelated negatives that are too easy.

## User Review Of Eval Set

Use `assets/eval_review.html`:

1. Replace `__EVAL_DATA_PLACEHOLDER__` with the JSON array, not as a quoted string.
2. Replace `__SKILL_NAME_PLACEHOLDER__`.
3. Replace `__SKILL_DESCRIPTION_PLACEHOLDER__`.
4. Write a temporary HTML file and open it when a browser is available.
5. After export, read the newest `eval_set.json` from Downloads if needed.

Bad eval queries directly damage optimization quality, so let the user review before running the loop.

## Run Optimization

Save the reviewed eval set. If the generated Procedure table includes an automatic optimization loop, use that generated command with the eval set, skill path, current model, five max iterations, and verbose progress.

Use the actual model powering the current session so trigger behavior matches user experience.

The loop splits data into train and held-out test, runs each query multiple times for stability, proposes improved descriptions, and picks `best_description` by held-out test score rather than train score.

When no automatic loop procedure is available in the current platform, call `skill-creator-improve-description` for a candidate description and manually verify the held-out queries before applying it. Report whether the result came from the automatic loop or a manual held-out verification.

## Apply Result

Read the JSON output, extract `best_description`, update the skill frontmatter or structured source field, and show before/after plus score changes.

Remember the trigger mechanism: the model sees available skill names and descriptions, and asks for a skill only when the task appears to require extra capability. Very simple one-step prompts may not trigger any skill even if keywords match.

## Packaging

If file presentation tooling is available, package with:

```bash
procedure `skill-creator-package-skill` <path/to/skill-folder>
```

Report the generated `.skill` path and installation instructions appropriate to the environment.

## Environment Adaptation

Claude.ai:

- No subagents.
- Run eval cases sequentially yourself.
- Skip baselines, blind comparison, and CLI-based description optimization.
- Show results inline.

Cowork/headless:

- Use static viewer output.
- Ask the user to export `feedback.json`.
- Generate the viewer before self-grading when the workflow expects user review.

Updating installed skills:

- Preserve the existing name.
- Copy to `/tmp/<skill-name>/` before editing if the install path is read-only.
- Package from the temporary editable copy.
