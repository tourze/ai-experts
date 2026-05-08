# Native View Flattening

## Symptoms

- UI FPS drops while JS FPS remains stable.
- Navigation transition stutters on complex screens.
- Layout time increases with deeply nested wrappers.

## Fixes

- Remove decorative wrapper views.
- Combine adjacent layout containers.
- Avoid unnecessary shadows, clipping, opacity stacking, and nested scroll views.
- Use `collapsable` intentionally and verify native view output.
- Split very complex screens into simpler routes or lazy sections.

## Checklist

- Count native views on the problematic screen.
- Compare before/after UI FPS.
- Verify touch targets and accessibility after flattening.
- Keep semantic containers when they carry accessibility or layout meaning.
