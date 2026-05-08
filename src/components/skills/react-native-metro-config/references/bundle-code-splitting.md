# Bundle Code Splitting

## Constraint

React Native Metro does not support arbitrary computed dynamic import paths for general app code. Treat dynamic loading as a constrained optimization, not a web-style free split.

## Useful Cases

- Optional screens not needed at startup.
- Heavy admin/debug/dev-only modules excluded from production flows.
- Feature-flagged modules with static import boundaries.

## Rules

- Keep import paths static strings.
- Measure startup and interaction impact.
- Do not split tiny modules.
- Provide loading, error, and fallback states.
- Verify offline and deep-link behavior.

## Pattern

```tsx
const HeavyScreen = React.lazy(() => import("./screens/HeavyScreen"));
```
