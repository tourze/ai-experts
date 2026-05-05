import { cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";
import { collectFiles, rewriteCompiledJsImports, renderDiscoveredHooksIndex, sourceRoot, writeText } from "./core.ts";

export function selectProfile(registry) {
  const profiles = registry.profiles ?? [];
  const profile = profiles.find((item) => item.id === registry.defaultProfile) ?? profiles[0];
  if (!profile) {
    throw new Error("registry.profiles must include a default profile");
  }
  return profile;
}

export function byId(items, kind) {
  const map = new Map();
  for (const item of items ?? []) {
    if (map.has(item.id)) throw new Error(`Duplicate ${kind} id: ${item.id}`);
    map.set(item.id, item);
  }
  return map;
}

export function materializeProfile(registry) {
  const profile = selectProfile(registry);
  const instructions = byId(registry.instructions, "instruction");
  const skills = byId(registry.skills, "skill");
  const agents = byId(registry.agents, "agent");
  const hooks = byId(registry.hooks, "hook");

  const pick = (map, ids, kind) => ids.map((id) => {
    const value = map.get(id);
    if (!value) throw new Error(`Profile ${profile.id} references missing ${kind}: ${id}`);
    return value;
  });

  return {
    profile,
    instructions: pick(instructions, profile.instructions, "instruction"),
    skills: pick(skills, profile.skills, "skill"),
    agents: pick(agents, profile.agents, "agent"),
    hooks: pick(hooks, profile.hooks, "hook"),
  };
}

export async function compileRegistry() {
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
  const mod = await import(`${registryUrl.href}?t=${Date.now()}`);
  return { registry: mod.registry, tempDir };
}
