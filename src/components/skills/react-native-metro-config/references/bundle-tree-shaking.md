# Bundle Tree Shaking

## Requirements

- Production build.
- ESM-friendly dependencies.
- No broad side effects at module top level.
- Imports are specific enough for Metro to see unused code.

## Common Blockers

- CommonJS packages.
- Barrel exports with side effects.
- Global registration at import time.
- Dynamic require or computed import paths.
- Libraries that ship one bundled entry.

## Verification

1. Build production bundle with source map.
2. Remove or narrow an import.
3. Rebuild and compare exact KB.
4. Confirm runtime behavior on affected screens.

Do not claim tree shaking worked without a bundle diff.
