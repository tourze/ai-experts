import type { HookDefinition } from "../sdk";
import { commandSafetyHooks } from "./command-safety/index";
import { contextCompactionHooks } from "./context-compaction/index";
import { editSafetyHooks } from "./edit-safety/index";
import { promptGuidanceHooks } from "./prompt-guidance/index";
import { sessionBootstrapHooks } from "./session-bootstrap/index";
import { skillRoutingHooks } from "./skill-routing/index";

export const componentHooks: readonly HookDefinition[] = [
  ...commandSafetyHooks,
  ...editSafetyHooks,
  ...promptGuidanceHooks,
  ...skillRoutingHooks,
  ...sessionBootstrapHooks,
  ...contextCompactionHooks,
];
