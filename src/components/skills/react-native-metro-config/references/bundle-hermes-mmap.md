# Bundle Hermes Mmap

## Context

Hermes bytecode can reduce startup parse/compile cost compared with plain JS parsing. On supported setups, bytecode can be memory mapped so startup does less work on the critical path.

## Verify

- Hermes is enabled for the target platform.
- Release build uses bytecode output.
- Startup traces show JS parse/compile cost before optimization.
- TTI or startup metrics improve after the change.

## Caveats

- Hermes does not fix large dependency graphs by itself.
- It may shift cost rather than remove all cost.
- Always compare release builds on real devices.

## Output

Report bundle format, startup metric, device, and before/after TTI.
