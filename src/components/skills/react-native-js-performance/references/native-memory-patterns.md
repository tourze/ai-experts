# Native Memory Patterns

## Classify Growth

| Pattern | Meaning |
| --- | --- |
| Rises then plateaus | Usually cache warmup. |
| Rises after every navigation loop | Likely leak. |
| Spikes then drops after GC/memory pressure | Temporary allocation. |
| Native grows while JS heap stays flat | Native objects, images, or platform caches. |

## Image Memory

- Prefer correctly sized images.
- Avoid decoding large source images for small views.
- Monitor cache settings for image libraries.
- Release or reuse large image resources on unmount.

## Output

Document whether growth is cache, leak, or expected allocation, with profiler evidence.
