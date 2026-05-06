import {
  defineProcedureUse,
  defineScriptUse,
  type ProcedureUseDefinition,
  type ScriptUseDefinition,
} from "../sdk";
import { componentProcedures } from "./registry";

const componentProcedureIds = new Set(componentProcedures.map((procedure) => procedure.id));

export type ProcedureUseOptions = Omit<ProcedureUseDefinition, "id"> | string;

export function procedureUse(id: string, options?: ProcedureUseOptions): ProcedureUseDefinition {
  if (!componentProcedureIds.has(id)) {
    throw new Error(`Unknown component procedure id: ${id}`);
  }
  if (typeof options === "string") {
    return defineProcedureUse({ id, reason: options });
  }
  return defineProcedureUse({ id, ...(options ?? {}) });
}

export function scriptUse(id: string, reason?: string): ScriptUseDefinition {
  return defineScriptUse(procedureUse(id, reason));
}

export const componentScripts = componentProcedures;
export { componentProcedures };
export * from "./registry";
