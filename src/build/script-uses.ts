import type {
  AgentDefinition,
  ProcedureUseReference,
  ScriptUseReference,
  SkillDefinition,
} from "../components/sdk";

export type ResolvedProcedureUse = {
  id: string;
  useId?: string;
  label?: string;
  when?: string;
  reason?: string;
  exampleArgs?: unknown;
  expectedOutput?: unknown;
};

function validateOptionalNonEmptyString(
  id: string,
  property: "useId" | "label" | "when" | "reason",
  value: unknown,
): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`procedure reference ${id} ${property} must be a non-empty string when provided`);
  }
  return value;
}

export function resolveProcedureUse(procedureUse: ProcedureUseReference): ResolvedProcedureUse {
  if (typeof procedureUse === "string") {
    return { id: procedureUse };
  }
  if (!procedureUse || typeof procedureUse !== "object" || Array.isArray(procedureUse)) {
    throw new Error("procedure reference must be a string or { id, useId?, label?, when?, reason?, exampleArgs?, expectedOutput? }");
  }
  const id = procedureUse.id;
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error("procedure reference id must be a non-empty string");
  }
  const useId = validateOptionalNonEmptyString(id, "useId", procedureUse.useId);
  if (useId !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(useId)) {
    throw new Error(`procedure reference ${id} useId must be a slug`);
  }
  const label = validateOptionalNonEmptyString(id, "label", procedureUse.label);
  const when = validateOptionalNonEmptyString(id, "when", procedureUse.when);
  const reason = validateOptionalNonEmptyString(id, "reason", procedureUse.reason);
  const exampleArgs = procedureUse.exampleArgs;
  if (
    exampleArgs !== undefined &&
    (exampleArgs === null || typeof exampleArgs !== "object" || Array.isArray(exampleArgs))
  ) {
    throw new Error(`procedure reference ${id} exampleArgs must be a JSON object when provided`);
  }
  const expectedOutput = procedureUse.expectedOutput;
  if (
    expectedOutput !== undefined &&
    (expectedOutput === null || typeof expectedOutput !== "object" || Array.isArray(expectedOutput))
  ) {
    throw new Error(`procedure reference ${id} expectedOutput must be a JSON object when provided`);
  }
  return {
    id,
    useId,
    label,
    when,
    reason,
    exampleArgs,
    expectedOutput,
  };
}

export function resolveProcedureUses(
  procedureUses: readonly ProcedureUseReference[] | undefined,
): ResolvedProcedureUse[] {
  return (procedureUses ?? []).map((procedureUse) => resolveProcedureUse(procedureUse));
}

export function listProcedureUses(component: Pick<SkillDefinition | AgentDefinition, "procedures" | "scripts">): ResolvedProcedureUse[] {
  if (component.procedures && component.procedures.length > 0) {
    return resolveProcedureUses(component.procedures);
  }
  return resolveProcedureUses(component.scripts as readonly ScriptUseReference[] | undefined);
}

export type ResolvedScriptUse = ResolvedProcedureUse;

export function resolveScriptUse(scriptUse: ScriptUseReference): ResolvedScriptUse {
  return resolveProcedureUse(scriptUse);
}

export function resolveScriptUses(scriptUses: readonly ScriptUseReference[] | undefined): ResolvedScriptUse[] {
  return resolveProcedureUses(scriptUses);
}
