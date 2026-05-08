# Bundle R8 Android

## Gradle Flags

```gradle
android {
  buildTypes {
    release {
      minifyEnabled true
      shrinkResources true
      proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
    }
  }
}
```

## Risks

- Reflection-heavy SDKs may need keep rules.
- Native modules can break if classes are stripped.
- Crash reporting mapping files must be uploaded.

## Checklist

- Compare APK/AAB size before and after.
- Run release smoke tests.
- Verify login, navigation, push, analytics, payments, and any reflection-based SDK.
- Keep generated mapping files for symbolication.
