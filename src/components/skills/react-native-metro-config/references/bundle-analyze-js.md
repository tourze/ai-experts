# Bundle Analyze JS

## Commands

```bash
npx react-native bundle \
  --entry-file index.js \
  --platform ios \
  --dev false \
  --minify true \
  --bundle-output /tmp/main.jsbundle \
  --sourcemap-output /tmp/main.jsbundle.map

npx source-map-explorer /tmp/main.jsbundle /tmp/main.jsbundle.map --no-border-checks
```

## What To Record

- Bundle size before and after.
- Top 10 modules by size.
- New dependencies introduced since the last known good build.
- Whether the build is release/minified.

## Rules

- Debug bundles are not valid for size conclusions.
- Compare the same platform and entry file.
- Keep the source map artifact when reporting a regression.
