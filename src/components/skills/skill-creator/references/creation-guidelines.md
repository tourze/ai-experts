# Skill Creation Guidelines

## Intent Capture

When the user asks to create or improve a skill, first determine where they are in the flow:

- New skill idea
- Existing skill draft
- Existing skill with source material or failures
- Eval/benchmark iteration
- Description trigger optimization

If the current conversation already contains the workflow, extract tools used, step order, user corrections, input/output formats, and failure cases before asking new questions.

Ask only for missing decisions:

1. What should the skill let the agent do?
2. When should it trigger? Include user wording and context, not only a category label.
3. What output shape should it produce?
4. Should it have evals? Default to yes when outputs can be checked by diff, parser, script, command, or fixed workflow. Default to qualitative review for subjective writing, creative, or strategic tasks unless the user asks otherwise.

## Source-Based Improvement

Before editing an existing skill, do a short source check:

- Identify sources: official docs, code, telemetry, failed transcripts, user feedback, examples, Procedure output, helper code, or eval results.
- Write one acceptance target: "the agent should reliably do X and avoid Y."
- Separate source facts from inference.
- If testable, preserve the old skill as the baseline.

Do not transfer background wholesale. Keep only knowledge that changes agent behavior: triggers, workflow, constraints, examples, anti-patterns, references, assets, evals, and procedures.

## User Communication

Use clear, direct language. "Evaluation" and "benchmark" are acceptable, but define them briefly the first time if the user may not know them. Explain JSON, assertions, or schemas only as much as needed to move the task forward.

## Writing The Skill

The generated skill should have:

- `name`: stable skill id.
- `description`: what the skill does and when to use it. This is the main trigger surface; include trigger keywords and contexts here, not only in the body.
- Workflow: concrete process and decision rules.
- Constraints and anti-patterns: behavior-changing boundaries and common failure modes.
- Bundled resources: references for large context, assets for templates or output material, and procedures for deterministic repeated work.

Use progressive disclosure:

1. Metadata: name + description.
2. Main skill instructions: short, actionable, ideally under 500 lines.
3. Bundled resources: loaded only when needed.

When a skill supports variants, split references by variant, such as `aws.md`, `gcp.md`, and `azure.md`.

## Writing Style

Prefer imperative instructions and reasons over rigid MUST/NEVER walls. Explain why a rule exists so the model can adapt in new cases. Remove instructions that do not change behavior.

Security and surprise boundaries:

- Skill contents must match the description.
- Do not create skills for unauthorized access, data exfiltration, malware, or deceptive behavior.
- Role-play skills are acceptable only within normal safety and authorization boundaries.

## Initial Eval Prompts

Write 2-3 realistic prompts the user might actually send. Show them to the user before running if the user is collaborating on the skill.

For pressure-sensitive skills, include at least one prompt that tries to make the agent skip rules, such as time pressure, authority pressure, "just do it quickly," or "we already agreed."

Save initial evals in `evals/evals.json` with prompts first. Add assertions during the run once outputs and objective checks are clear. Refer to `schemas.md` for the exact schema.
