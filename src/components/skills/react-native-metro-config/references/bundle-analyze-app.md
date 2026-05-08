# Bundle Analyze App

## Android

```bash
./gradlew :app:assembleRelease
unzip -l app/build/outputs/apk/release/app-release.apk | sort -k1 -n
```

Inspect:

- `assets/index.android.bundle`
- `lib/**/*.so`
- image/video/font assets
- duplicated ABI outputs

## iOS

Build an archive and inspect the `.app` contents:

- JS bundle;
- embedded frameworks;
- images and fonts;
- dSYM is not part of app size but matters for upload artifacts.

## Rule

Separate JS, native binary, and resource size before choosing an optimization.
