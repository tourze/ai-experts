# Repository Research Report: {{REPOSITORY_NAME}}

## Scope

- Repository: {{REPOSITORY_URL_OR_PATH}}
- Version: {{COMMIT_OR_TAG}}
- Analysis mode: {{quick | deep | comparative}}
- Evidence boundary: {{readme | source | git history | releases | issues | external docs}}

## Executive Summary

{{2-4 paragraphs separating facts, inferences, and adoption recommendation.}}

## Project Health

| Signal | Evidence | Assessment |
| --- | --- | --- |
| Maintenance cadence | {{git log / release evidence}} | {{strong / watch / risk}} |
| Contributor concentration | {{shortlog evidence}} | {{strong / watch / risk}} |
| Issue and PR flow | {{issue / PR evidence}} | {{strong / watch / risk}} |
| License | {{license evidence}} | {{compatible / needs review / incompatible}} |

## Architecture Map

{{Describe the main modules, runtime boundaries, data flow, and integration points. Reference concrete files.}}

## Code Reading Evidence

| Area | Files Read | Findings |
| --- | --- | --- |
| Core path | {{files}} | {{behavior and risk}} |
| Data path | {{files}} | {{behavior and risk}} |
| Error path | {{files}} | {{behavior and risk}} |
| Tests | {{files}} | {{coverage signal}} |

## Adoption Risks

| Risk | Severity | Evidence | Mitigation |
| --- | --- | --- | --- |
| {{risk}} | {{S1-S5}} | {{source or project evidence}} | {{action}} |

## Recommendation

{{Adopt / trial / avoid / defer}} because {{evidence-backed reason}}.

## Appendix

- Commands run: {{commands}}
- External sources: {{links and access date}}
- Open questions: {{unknowns requiring maintainer or user confirmation}}
