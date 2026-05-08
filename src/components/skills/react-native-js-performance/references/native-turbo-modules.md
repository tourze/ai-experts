# Native TurboModules

## Use When

- Native module calls are frequent or latency-sensitive.
- Bridge serialization overhead is visible.
- A module needs typed interfaces and New Architecture compatibility.

## Risks

- Synchronous methods can block JS if misused.
- Migration adds native code maintenance on both platforms.
- Not every slow module becomes faster without reducing work itself.

## Checklist

- Measure current call frequency and latency.
- Identify whether overhead is bridge serialization or native work.
- Keep interaction-path methods asynchronous unless synchronous access is truly required.
- Validate both iOS and Android behavior under release builds.
