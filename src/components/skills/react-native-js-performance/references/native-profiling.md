# Native Profiling

## iOS

- Use Xcode Instruments Time Profiler for CPU and main-thread work.
- Use Allocations and Leaks for memory growth.
- Capture release or profile builds on device.

## Android

- Use Android Studio Profiler for CPU, memory, and allocations.
- Use `systrace` or Perfetto when frame scheduling is unclear.
- Capture release builds where possible.

## Workflow

1. Reproduce the exact screen and interaction.
2. Capture baseline trace.
3. Mark the slow interval.
4. Identify main-thread hot functions or retained objects.
5. Apply one fix.
6. Re-profile the same scenario.

## Output

```text
Device:
Build:
Tool:
Scenario:
Hot path:
Evidence:
Change:
After metric:
```
