import type {
  AgentDefinition,
  Platform as PlatformType,
  ProcedureUseReference,
  SkillDefinition,
} from "../components/sdk";

export type ResolvedProcedureUse = {
  id: string;
  platforms?: readonly PlatformType[];
  useId?: string;
  label?: string;
  when?: string;
  reason?: string;
  exampleArgs?: unknown;
  expectedOutput?: unknown;
  showParams?: boolean;
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

function validateJsonValue(id: string, property: "exampleArgs" | "expectedOutput", value: unknown, seen: WeakSet<object>): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`procedure reference ${id} ${property} must be JSON-serializable`);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) validateJsonValue(id, property, item, seen);
    return;
  }
  if (typeof value === "object") {
    if (seen.has(value)) {
      throw new Error(`procedure reference ${id} ${property} must be JSON-serializable`);
    }
    seen.add(value);
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(`procedure reference ${id} ${property} must be JSON-serializable`);
    }
    for (const item of Object.values(value)) validateJsonValue(id, property, item, seen);
    return;
  }
  throw new Error(`procedure reference ${id} ${property} must be JSON-serializable`);
}

function validateJsonObject(
  id: string,
  property: "exampleArgs" | "expectedOutput",
  value: unknown,
): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`procedure reference ${id} ${property} must be a JSON object when provided`);
  }
  validateJsonValue(id, property, value, new WeakSet<object>());
}

export function resolveProcedureUse(procedureUse: ProcedureUseReference): ResolvedProcedureUse {
  if (!procedureUse || typeof procedureUse !== "object" || Array.isArray(procedureUse)) {
    throw new Error("procedure reference must be { id, useId?, label?, when?, reason?, exampleArgs?, expectedOutput?, showParams? }");
  }
  const id = procedureUse.id;
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error("procedure reference id must be a non-empty string");
  }
  const platforms = procedureUse.platforms;
  if (
    platforms !== undefined &&
    (!Array.isArray(platforms) || platforms.length === 0 || platforms.some((platform) => typeof platform !== "string"))
  ) {
    throw new Error(`procedure reference ${id} platforms must be a non-empty platform array when provided`);
  }
  const useId = validateOptionalNonEmptyString(id, "useId", procedureUse.useId);
  if (useId !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(useId)) {
    throw new Error(`procedure reference ${id} useId must be a slug`);
  }
  const label = validateOptionalNonEmptyString(id, "label", procedureUse.label);
  const when = validateOptionalNonEmptyString(id, "when", procedureUse.when);
  const reason = validateOptionalNonEmptyString(id, "reason", procedureUse.reason);
  const exampleArgs = procedureUse.exampleArgs;
  if (exampleArgs !== undefined) validateJsonObject(id, "exampleArgs", exampleArgs);
  const expectedOutput = procedureUse.expectedOutput;
  if (expectedOutput !== undefined) validateJsonObject(id, "expectedOutput", expectedOutput);
  const showParams = procedureUse.showParams;
  if (showParams !== undefined && typeof showParams !== "boolean") {
    throw new Error(`procedure reference ${id} showParams must be a boolean when provided`);
  }
  return {
    id,
    platforms,
    useId,
    label,
    when,
    reason,
    exampleArgs,
    expectedOutput,
    showParams,
  };
}

export function resolveProcedureUses(
  procedureUses: readonly ProcedureUseReference[] | undefined,
): ResolvedProcedureUse[] {
  return (procedureUses ?? []).map((procedureUse) => resolveProcedureUse(procedureUse));
}

export function listProcedureUses(component: Pick<SkillDefinition | AgentDefinition, "procedures">): ResolvedProcedureUse[] {
  return resolveProcedureUses(component.procedures);
}

export function procedureUseAppliesToPlatform(procedureUse: ResolvedProcedureUse, platform: PlatformType): boolean {
  return !procedureUse.platforms || procedureUse.platforms.includes(platform);
}
