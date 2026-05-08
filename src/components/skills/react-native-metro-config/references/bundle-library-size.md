# Bundle Library Size

## Evaluation Steps

1. Build baseline release bundle.
2. Add or upgrade the library.
3. Build the same bundle and compare source-map output.
4. Check transitive dependencies.
5. Test direct-path imports or lighter alternatives.

## Questions

- Does the library run on the critical startup path?
- Does it ship ESM or only CommonJS?
- Can the app import a submodule instead of the root?
- Is a native SDK larger but faster or smaller but harder to maintain?
- Is the dependency maintained and safe enough for the size cost?

## Output

```text
Library:
Added JS KB:
Added native KB:
Alternatives:
Recommendation:
```
