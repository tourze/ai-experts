# Native SDKs Over Polyfills

## Use Native SDK When

- JS polyfill does heavy CPU work on the interaction path.
- Platform APIs already provide optimized native behavior.
- The operation needs background execution, hardware acceleration, or OS integration.
- Performance matters more than single-codepath simplicity.

## Keep JS When

- The work is low frequency.
- Platform behavior must be identical and simple.
- Native maintenance cost exceeds measured benefit.

## Decision Record

```text
Current JS implementation:
Measured bottleneck:
Native SDK option:
iOS maintenance:
Android maintenance:
Expected gain:
Fallback:
```
