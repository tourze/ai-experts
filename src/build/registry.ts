import { cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";
import { collectFiles, rewriteCompiledJsImports, renderDiscoveredHooksIndex, sourceRoot, writeText } from "./core.ts";
import type { AgentDefinition, HookDefinition, InstructionDefinition, ProfileDefinition, SkillDefinition } from "../components/sdk";
import type { ComponentRegistry, ProfileSurface } from "./types.ts";

export function selectProfile(registry: ComponentRegistry): ProfileDefinition {
  const profiles = registry.profiles ?? [];
  const profile = profiles.find((item) => item.id === registry.defaultProfile) ?? profiles[0];
  if (!profile) {
    throw new Error("registry.profiles must include a default profile");
  }
  return profile;
}

export function byId<T extends { id: string }>(items: readonly T[] | undefined, kind: string): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items ?? []) {
    if (map.has(item.id)) throw new Error(`Duplicate ${kind} id: ${item.id}`);
    map.set(item.id, item);
  }
  return map;
}

function pickByIds<T extends { id: string }>(
  profileId: string,
  map: Map<string, T>,
  ids: readonly string[],
  kind: string,
): T[] {
  return ids.map((id) => {
    const value = map.get(id);
    if (!value) throw new Error(`Profile ${profileId} references missing ${kind}: ${id}`);
    return value;
  });
}

export function materializeProfile(registry: ComponentRegistry): ProfileSurface {
  const profile = selectProfile(registry);
  const instructions = byId<InstructionDefinition>(registry.instructions, "instruction");
  const skills = byId<SkillDefinition>(registry.skills, "skill");
  const agents = byId<AgentDefinition>(registry.agents, "agent");
  const hooks = byId<HookDefinition>(registry.hooks, "hook");

  return {
    profile,
    instructions: pickByIds(profile.id, instructions, profile.instructions, "instruction"),
    skills: pickByIds(profile.id, skills, profile.skills, "skill"),
    agents: pickByIds(profile.id, agents, profile.agents, "agent"),
    hooks: pickByIds(profile.id, hooks, profile.hooks, "hook"),
  };
}

export async function compileRegistry(): Promise<{ registry: ComponentRegistry; tempDir: string }> {
  const tempDir = join(tmpdir(), `ai-components-${process.pid}-${Date.now()}`);
  const tempComponentsRoot = join(tempDir, "components");
  cpSync(sourceRoot, tempComponentsRoot, { recursive: true, force: true });
  writeText(join(tempDir, "package.json"), JSON.stringify({ type: "module" }, null, 2) + "\n");
  writeText(join(tempComponentsRoot, "hooks", "index.ts"), renderDiscoveredHooksIndex(tempComponentsRoot));

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
  return typeof maybe.defaultProfile === "string" &&
    Array.isArray(maybe.instructions) &&
    Array.isArray(maybe.skills) &&
    Array.isArray(maybe.agents) &&
    Array.isArray(maybe.hooks) &&
    Array.isArray(maybe.profiles);
}
