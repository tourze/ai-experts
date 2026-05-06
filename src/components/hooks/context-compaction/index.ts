import type { HookDefinition } from "../../sdk";
import { compactionStrategyHook } from "./compaction-strategy";

export { compactionStrategyHook };

export const contextCompactionHooks: readonly HookDefinition[] = [
  compactionStrategyHook,
];
