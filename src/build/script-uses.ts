import type { ScriptUseReference } from "../components/sdk";

export type ResolvedScriptUse = {
  id: string;
  reason?: string;
};

export function resolveScriptUse(scriptUse: ScriptUseReference): ResolvedScriptUse {
  if (typeof scriptUse === "string") {
    return { id: scriptUse };
  }
  if (!scriptUse || typeof scriptUse !== "object" || Array.isArray(scriptUse)) {
    throw new Error("script reference must be a string or { id, reason? }");
  }
  const id = scriptUse.id;
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error("script reference id must be a non-empty string");
  }
  const reason = scriptUse.reason;
  if (reason !== undefined && (typeof reason !== "string" || reason.trim() === "")) {
    throw new Error(`script reference ${id} reason must be a non-empty string when provided`);
  }
  return {
    id,
    reason,
  };
}

export function resolveScriptUses(scriptUses: readonly ScriptUseReference[] | undefined): ResolvedScriptUse[] {
  return (scriptUses ?? []).map((scriptUse) => resolveScriptUse(scriptUse));
}
