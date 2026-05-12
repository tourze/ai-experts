import { cpSync, existsSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";
import { collectFiles, repoRoot, rewriteCompiledJsImports, sourceRoot, writeText } from "./core";
import { listProcedureUses } from "./procedure-uses";
import type {
  AgentDefinition,
  HookDefinition,
  InstructionDefinition,
  ProcedureDefinition,
  RuleDefinition,
  SkillDefinition,
} from "../components/sdk";
import type { ComponentRegistry, ComponentSurface } from "./types";

export function byId<T extends { id: string }>(items: readonly T[] | undefined, kind: string): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items ?? []) {
    if (map.has(item.id)) throw new Error(`Duplicate ${kind} id: ${item.id}`);
    map.set(item.id, item);
  }
  return map;
}

export function materializeRegistry(registry: ComponentRegistry): ComponentSurface {
  const instructions = byId<InstructionDefinition>(registry.instructions, "instruction");
  const skills = byId<SkillDefinition>(registry.skills, "skill");
  const agents = byId<AgentDefinition>(registry.agents, "agent");
  const hooks = byId<HookDefinition>(registry.hooks, "hook");
  const procedures = byId<ProcedureDefinition>(registry.procedures, "procedure");
  const rules = byId<RuleDefinition>(registry.rules, "rule");

  const procedureIds = new Set<string>();
  for (const skill of skills.values()) {
    for (const procedureUse of listProcedureUses(skill)) procedureIds.add(procedureUse.id);
  }
  for (const agent of agents.values()) {
    for (const procedureUse of listProcedureUses(agent)) procedureIds.add(procedureUse.id);
  }
  const surfaceProcedures = [...procedureIds]
    .sort((a, b) => a.localeCompare(b))
    .map((id) => {
      const value = procedures.get(id);
      if (!value) throw new Error(`Registry references missing procedure: ${id}`);
      return value;
    });

  return {
    instructions: [...instructions.values()],
    procedures: surfaceProcedures,
    skills: [...skills.values()],
    agents: [...agents.values()],
    hooks: [...hooks.values()],
    rules: [...rules.values()],
  };
}

export async function compileRegistry(): Promise<{ registry: ComponentRegistry; tempDir: string }> {
  const tempDir = join(tmpdir(), `ai-experts-registry-${process.pid}-${Date.now()}`);
  const tempComponentsRoot = join(tempDir, "components");
  cpSync(sourceRoot, tempComponentsRoot, { recursive: true, force: true });
  writeText(join(tempDir, "package.json"), JSON.stringify({ type: "module" }, null, 2) + "\n");
  const repoNodeModules = join(repoRoot, "node_modules");
  if (existsSync(repoNodeModules)) {
    symlinkSync(repoNodeModules, join(tempDir, "node_modules"), "junction");
  }

  const entryPoints = collectFiles(tempComponentsRoot, (file) => file.endsWith(".ts"));
  await esbuild.build({
    entryPoints,
    outdir: tempComponentsRoot,
    outbase: tempComponentsRoot,
    bundle: false,
    platform: "node",
    format: "esm",
    target: "node20",
    logLevel: "silent",
  });
  rewriteCompiledJsImports(tempComponentsRoot);

  const registryUrl = pathToFileURL(join(tempComponentsRoot, "registry.js"));
  const mod = await import(`${registryUrl.href}?t=${Date.now()}`) as { registry?: unknown };
  const registry = mod.registry;
  if (!isComponentRegistry(registry)) {
    throw new Error("Compiled registry did not export a valid registry object");
  }
  return { registry, tempDir };
}

function isComponentRegistry(value: unknown): value is ComponentRegistry {
  if (!value || typeof value !== "object") return false;
  const maybe = value as Partial<ComponentRegistry>;
  return Array.isArray(maybe.instructions) &&
    Array.isArray(maybe.procedures) &&
    Array.isArray(maybe.skills) &&
    Array.isArray(maybe.agents) &&
    Array.isArray(maybe.hooks) &&
    Array.isArray(maybe.rules);
}
