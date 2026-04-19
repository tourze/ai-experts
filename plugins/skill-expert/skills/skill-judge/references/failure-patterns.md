# Common Failure Patterns

### FAIL: The Tutorial (Pattern 1)

```
"What is PDF?" / "How to write a for-loop" / basic library usage
→ Claude already knows this → token waste
```

### PASS: Expert knowledge only

```
Decision trees for non-obvious choices
Trade-offs only an expert would know
Edge cases from real-world experience
```

### FAIL: The Dump (Pattern 2)

```
SKILL.md 800+ lines with everything inline
→ Context window waste / key info diluted
```

### PASS: Progressive disclosure

```
SKILL.md < 300 lines (routing + decisions)
references/ for details, loaded on-demand
```

### FAIL: The Invisible Skill (Pattern 3)

```
description: "Helps with document tasks"
→ Agent never activates it
```

### PASS: WHAT + WHEN + KEYWORDS

```
description: "Create, edit, and analyze .docx files. Use when working with
Word documents, tracked changes, or professional document formatting."
```

### FAIL: The Freedom Mismatch (Pattern 4)

```
Symptom: Rigid scripts for creative tasks, vague guidance for fragile operations
Root cause: Not considering task fragility
Fix: High freedom for creative (principles, not steps)
     Low freedom for fragile (exact scripts, no parameters)
```
