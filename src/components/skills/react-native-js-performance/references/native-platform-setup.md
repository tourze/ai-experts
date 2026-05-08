# Native Platform Setup

## Release Measurement

### iOS

```bash
xcodebuild -workspace ios/App.xcworkspace -scheme App -configuration Release
```

Use a physical device and Instruments.

### Android

```bash
./gradlew :app:assembleRelease
adb install app-release.apk
adb shell am start -W com.example/.MainActivity
```

## Checklist

- Disable remote debugging.
- Use production JS bundle.
- Record device model, OS, architecture, and app version.
- Clear or preserve cache intentionally.
- Repeat each scenario at least three times when comparing startup.
