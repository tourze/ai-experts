# Native Threading Model

## Threads

| Thread | Work |
| --- | --- |
| JS thread | React render, JS business logic, event handling. |
| UI/main thread | Native layout, drawing, touch processing. |
| Native Modules | Platform module work and bridge/native calls. |
| Render/background threads | Image decode, animations, platform internals. |

## Diagnosis

- JS FPS drops, UI FPS stable: optimize React render, lists, JS work.
- UI FPS drops, JS FPS stable: inspect native view hierarchy, main-thread work, gestures.
- Both drop: suspect bridge pressure, heavy JS triggering layout, or synchronized native calls.

## Rules

- Do not optimize `useMemo` when UI FPS is the only failing signal.
- Avoid synchronous native methods on interaction paths.
- Move high-frequency animation and gesture work to UI thread when possible.
