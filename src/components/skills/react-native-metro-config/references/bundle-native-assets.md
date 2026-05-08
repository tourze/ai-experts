# Bundle Native Assets

## Asset Sources

- large PNG/JPEG/WebP images;
- bundled video/audio;
- custom fonts;
- Lottie files;
- duplicated density buckets;
- unused demo assets.

## Optimization

- Resize source images to displayed dimensions.
- Prefer WebP where supported and validated.
- Remove unused font weights.
- Move large optional media to remote delivery when appropriate.
- Deduplicate assets shared across packages.

## Checks

```bash
find android/app/src/main/res -type f -size +200k
find ios -type f \\( -name "*.png" -o -name "*.jpg" -o -name "*.ttf" \\) -size +200k
```

Record before/after bytes, not just file count.
