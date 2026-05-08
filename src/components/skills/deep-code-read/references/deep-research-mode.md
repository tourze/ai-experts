# Deep Research Mode

## Trigger

Use deep research mode when the user asks for:

- project evolution or architecture history;
- adoption risk for production use;
- competitor or alternative comparison;
- maintainer/community health;
- release, issue, or PR trend analysis.

## Evidence Plan

1. Pin the repository, branch, tag, or commit.
2. Clone to `/tmp/` for source inspection.
3. Read README, license, package/build files, and architecture docs.
4. Use git history for cadence and contributor concentration.
5. Use `gh api` or equivalent only for public project metadata the user needs.
6. Cross-check releases, issues, and PRs against code reality.

## Output Rules

- Separate source evidence, project metadata, community signals, and inference.
- Use absolute dates for release and maintenance claims.
- Do not use star count as a quality proxy.
- State what could not be verified.

## Minimum Commands

```bash
git log --oneline --since='12 months ago' | wc -l
git shortlog -sn --no-merges | head
git tag --sort=-creatordate | head
```
