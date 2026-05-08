# Bundle Barrel Exports

## Problem

Barrel files can cause Metro to include modules that the screen never uses.

```ts
// index.ts
export * from "./heavy-chart";
export * from "./small-button";
```

```ts
// pulls the barrel entry and may retain more code
import { SmallButton } from "@ui";
```

## Fix

```ts
import { SmallButton } from "@ui/small-button";
```

## Checklist

- Inspect large modules in source-map output.
- Replace broad package imports with direct path imports.
- Avoid `export *` from mixed heavy/light modules.
- Re-run bundle analysis after each import change.
