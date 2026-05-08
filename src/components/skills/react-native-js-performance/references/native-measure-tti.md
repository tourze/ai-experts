# Native Measure TTI

## Goal

Measure Time to Interactive on release builds and real devices.

## Signals

- Android `adb shell am start -W` `WaitTime`.
- App-side mark when the first critical screen can accept input.
- iOS Instruments launch timeline.
- Production telemetry for cold and warm starts.

## Pattern

```tsx
import performance from "react-native-performance";

useEffect(() => {
  performance.mark("screenInteractive");
}, []);
```

## Rules

- Measure debug and release separately, but only use release for conclusions.
- Record device, OS, architecture, build type, and network state.
- Separate app launch, JS bundle load, first render, and interactive mark.
- Compare the same route before and after optimization.
