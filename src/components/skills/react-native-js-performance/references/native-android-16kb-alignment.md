# Android 16KB Alignment

## Problem

Some Android devices require native libraries to support 16KB page sizes. Apps with incompatible `.so` files can fail Play checks or crash on affected devices.

## Check

```bash
zipalign -c -P 16 -v 4 app-release.apk
```

Inspect third-party native dependencies when the check fails.

## Fix Strategy

- Upgrade the dependency that ships the incompatible `.so`.
- Rebuild owned native libraries with compatible NDK/toolchain settings.
- Remove unused native libraries from packaging.
- Re-run release build and Play pre-launch checks.

## Release Gate

Do not treat debug APK checks as sufficient. Validate the exact release artifact being uploaded.
