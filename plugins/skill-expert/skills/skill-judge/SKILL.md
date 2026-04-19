---
name: skill-judge
description: Use when reviewing, auditing, or scoring the design quality of SKILL.md files and skill packages against official specifications.
---

# Skill Judge

Evaluate Agent Skills against official specifications and patterns derived from 17+ official examples.

---

## Core Philosophy

### The Core Formula

> **Good Skill = Expert-only Knowledge − What Claude Already Knows**

A Skill's value is measured by its **knowledge delta** — the gap between what it provides and what the model already knows.

### Three Types of Knowledge in Skills

| Type | Definition | Treatment |
|------|------------|-----------|
| **Expert** | Claude genuinely doesn't know this | Must keep — this is the Skill's value |
| **Activation** | Claude knows but may not think of | Keep if brief — serves as reminder |
| **Redundant** | Claude definitely knows this | Should delete — wastes tokens |

The art of Skill design is maximizing Expert content, using Activation sparingly, and eliminating Redundant ruthlessly.

### Tool vs Skill

| Concept | Essence | Function | Example |
|---------|---------|----------|---------|
| **Tool** | What model CAN do | Execute actions | bash, read_file, write_file, WebSearch |
| **Skill** | What model KNOWS how to do | Guide decisions | PDF processing, MCP building, frontend design |

**The equation**: `General Agent + Excellent Skill = Domain Expert Agent`

---

## Evaluation Framework (120 points, 8 dimensions)

**MANDATORY — READ ENTIRE FILE**: Before scoring, you MUST read `references/evaluation-dimensions.md` for detailed rubrics, score criteria, and examples for all 8 dimensions.

| Dimension | Max | Core Question |
|-----------|-----|---------------|
| D1: Knowledge Delta | 20 | Does it add knowledge Claude doesn't have? |
| D2: Mindset + Procedures | 15 | Does it transfer thinking patterns + domain procedures? |
| D3: Anti-Pattern Quality | 15 | Does it have expert-grade NEVER lists with WHY? |
| D4: Specification Compliance | 15 | Is the description WHAT + WHEN + KEYWORDS? |
| D5: Progressive Disclosure | 15 | Is content layered (SKILL.md < 500 lines, refs on demand)? |
| D6: Freedom Calibration | 15 | Does constraint level match task fragility? |
| D7: Pattern Recognition | 10 | Does it follow Mindset/Navigation/Philosophy/Process/Tool? |
| D8: Practical Usability | 15 | Can Agent immediately act on it? |

---

## NEVER Do When Evaluating

- **NEVER** give high scores just because it "looks professional" or is well-formatted
- **NEVER** ignore token waste — every redundant paragraph should result in deduction
- **NEVER** let length impress you — a 43-line Skill can outperform a 500-line Skill
- **NEVER** skip mentally testing the decision trees — do they actually lead to correct choices?
- **NEVER** forgive explaining basics with "but it provides helpful context"
- **NEVER** overlook missing anti-patterns — if there's no NEVER list, that's a significant gap
- **NEVER** assume all procedures are valuable — distinguish domain-specific from generic
- **NEVER** undervalue the description field — poor description = skill never gets used
- **NEVER** put "when to use" info only in the body — Agent only sees description before loading

---

## Evaluation Protocol

**MANDATORY — READ ENTIRE FILE**: Before running the evaluation, you MUST read `references/evaluation-protocol.md` for the 5-step process and report template.

**Do NOT load** `references/failure-patterns.md` unless you need examples of common anti-patterns during scoring.

**Quick flow**:
1. Knowledge Delta Scan — mark each section as [E]xpert / [A]ctivation / [R]edundant
2. Structure Analysis — frontmatter, line count, references, pattern identification
3. Score Each Dimension — evidence-based, one-line justification per dimension
4. Calculate Total & Grade — A (90%+) / B (80-89%) / C (70-79%) / D (60-69%) / F (<60%)
5. Generate Report — use template from `references/evaluation-protocol.md`

---

## Quick Reference Checklist

```
KNOWLEDGE DELTA (most important):
  [ ] No "What is X" explanations for basic concepts
  [ ] Has decision trees for non-obvious choices
  [ ] Has trade-offs only experts would know

SPECIFICATION (description is critical!):
  [ ] description answers: WHAT does it do?
  [ ] description answers: WHEN should it be used?
  [ ] description contains trigger KEYWORDS

STRUCTURE:
  [ ] SKILL.md < 500 lines (ideal < 300)
  [ ] Heavy content in references/
  [ ] Loading triggers embedded in workflow

ANTI-PATTERNS:
  [ ] Has explicit NEVER list
  [ ] Anti-patterns are specific with WHY
```

---

## The Meta-Question

> **"Would an expert in this domain, looking at this Skill, say:**
> **'Yes, this captures knowledge that took me years to learn'?"**

If yes → the Skill has genuine value. If no → it's compressing what Claude already knows.
