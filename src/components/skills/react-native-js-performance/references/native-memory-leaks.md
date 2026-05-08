# Native Memory Leaks

## Common Sources

- Observers or notifications not removed.
- Timers retained after screen unmount.
- Native module callbacks holding activity/view controller references.
- Image caches growing without bounds.
- Long-lived singletons retaining views or contexts.

## Diagnosis

- JS heap stable but process memory grows.
- Xcode Allocations or Android Profiler shows retained native objects.
- Memory rises after repeated navigation in and out of the same screen.

## Fix Rules

- Pair every subscribe/register with unsubscribe/unregister.
- Avoid retaining `Activity`, `Context`, or `ViewController` in static fields.
- Release native resources in lifecycle hooks.
- Add navigation loop tests for known leak screens.
