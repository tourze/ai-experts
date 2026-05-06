import type {
  AgentDefinition,
  ProcedureUseReference,
  ScriptUseReference,
  SkillDefinition,
} from "../components/sdk";

export type ResolvedProcedureUse = {
  id: string;
  when?: string;
  reason?: string;
  requestJsonTemplate?: string;
};

export function resolveProcedureUse(procedureUse: ProcedureUseReference): ResolvedProcedureUse {
  if (typeof procedureUse === "string") {
    return { id: procedureUse };
  }
  if (!procedureUse || typeof procedureUse !== "object" || Array.isArray(procedureUse)) {
    throw new Error("procedure reference must be a string or { id, when?, reason?, requestJsonTemplate? }");
  }
  const id = procedureUse.id;
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error("procedure reference id must be a non-empty string");
  }
  const when = procedureUse.when;
  if (when !== undefined && (typeof when !== "string" || when.trim() === "")) {
    throw new Error(`procedure reference ${id} when must be a non-empty string when provided`);
  }
  const reason = procedureUse.reason;
  if (reason !== undefined && (typeof reason !== "string" || reason.trim() === "")) {
    throw new Error(`procedure reference ${id} reason must be a non-empty string when provided`);
  }
  const requestJsonTemplate = procedureUse.requestJsonTemplate;
  if (requestJsonTemplate !== undefined && (typeof requestJsonTemplate !== "string" || requestJsonTemplate.trim() === "")) {
    throw new Error(`procedure reference ${id} requestJsonTemplate must be a non-empty string when provided`);
  }
  return {
    id,
    when,
    reason,
    requestJsonTemplate,
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
