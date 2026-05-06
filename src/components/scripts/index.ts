import { defineScriptUse, type ScriptUseDefinition } from "../sdk";
import { componentScripts } from "./registry";

const componentScriptIds = new Set(componentScripts.map((script) => script.id));

export function scriptUse(id: string, reason?: string): ScriptUseDefinition {
  if (!componentScriptIds.has(id)) {
    throw new Error(`Unknown component script id: ${id}`);
  }
  return defineScriptUse({ id, reason });
}

export { componentScripts };
