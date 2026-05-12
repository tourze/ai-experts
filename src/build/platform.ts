import { createHash } from "node:crypto";
import { readFileSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import {
  collectFiles,
  ensureDir,
  InvocationPolicy,
  Platform,
  readComponentText,
  writeText,
} from "./core";
import { emitAgent } from "./agents";
import { compileHookModules, renderCodexConfig, renderHookConfig } from "./hooks";
import { emitProcedureRuntime } from "./procedures";
import { collectPlatformRules, emitRules, renderCodexRuleRouteSupplement } from "./rules";
import { emitSkill } from "./skills";
import type { ComponentSurface } from "./types";

export { codexSystemSkillIds, validateId, validateRegistry } from "./platform-validation";

const manifestSchemaVersion = 6;

export function renderInstruction(componentSurface: ComponentSurface, platform: Platform): string {
  const instructions = componentSurface.instructions
    .filter((instruction) => instruction.platforms.includes(platform))
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100) || a.id.localeCompare(b.id));
  const body = instructions
    .map((instruction) => readComponentText(instruction.body).trimEnd())
    .join("\n\n");

  if (platform === Platform.Claude) {
    return `${body}\n`;
  }

  const platformAgents = componentSurface.agents.filter((item) => item.platforms.includes(platform));
  const agentRows = platformAgents.length > 0
    ? platformAgents.map((item) => `- ${item.id}: ${item.description}`)
    : ["- none"];
  const ruleSupplement = renderCodexRuleRouteSupplement(collectPlatformRules(componentSurface.rules, platform));

  return [
    body,
    "",
    "## Codex Skill 路由补充",
    "",
    "当可用 skill 数量很大时，Codex 可能只在 `skills_instructions` 中注入 skill 名称和路径，省略 description。若无法仅凭注入列表判断是否命中 skill，先用 `rg -n \"description: .*<关键词>|<关键词>\" ~/.agents/skills/*/SKILL.md` 定位候选，再读取候选 `SKILL.md`；在仓库内审计生成物时搜索 `dist/codex/skills/*/SKILL.md`。不要因为列表缺 description 就跳过本地 skill。",
    "",
    ruleSupplement.trimEnd(),
    "",
    "## Agent 索引",
    "",
    "Codex 原生 Skill discovery 会注入可用 Skill 列表；本节只补充当前安装的自定义 Agent，用于需要隔离上下文时选择角色。",
    "",
    ...agentRows,
    "",
  ].join("\n");
}

export function checksumFiles(root: string): Record<string, string> {
  return Object.fromEntries(
    collectFiles(root).map((file) => {
      const hash = createHash("sha256").update(readFileSync(file)).digest("hex");
      return [relative(root, file), hash];
    }),
  );
}

function renderInstallManifest(
  platform: Platform,
  skillIds: readonly string[],
): {
  configRoot: string;
  skillSourceRoot: string;
  skillRoot: string;
  rootEntries: string[];
  skillEntries: string[];
  forbiddenRootEntries: string[];
  forbiddenSkillEntries: string[];
} {
  const isClaude = platform === Platform.Claude;
  return {
    configRoot: isClaude ? "~/.claude" : "~/.codex",
    skillSourceRoot: "skills/",
    skillRoot: isClaude ? "~/.claude/skills" : "~/.agents/skills",
    rootEntries: isClaude
      ? ["CLAUDE.md", "settings.json", "rules/", "agents/", "hooks/", "procedures.js", "manifest.json"]
      : ["AGENTS.md", "config.toml", "hooks.json", "context-rules/", "agents/", "hooks/", "procedures.js", "manifest.json"],
    skillEntries: skillIds.map((skillId) => `${skillId}/`),
    forbiddenRootEntries: isClaude ? [] : ["skills/", "installation_id", "rules/"],
    forbiddenSkillEntries: isClaude ? [] : [".system/"],
  };
}

export async function emitPlatform(
  componentSurface: ComponentSurface,
  outDir: string,
  platform: Platform,
): Promise<void> {
  const root = join(outDir, platform === Platform.Claude ? "claude" : "codex");
  rmSync(root, { recursive: true, force: true });
  ensureDir(root);
  ensureDir(join(root, "skills"));
  ensureDir(join(root, "agents"));
  ensureDir(join(root, "hooks"));

  const ruleIds = emitRules(componentSurface.rules, root, platform);

  const instructionName = platform === Platform.Claude ? "CLAUDE.md" : "AGENTS.md";
  writeText(join(root, instructionName), renderInstruction(componentSurface, platform));

  const platformHooks = componentSurface.hooks.filter((hook) => hook.platforms.includes(platform));
  await compileHookModules(platformHooks, join(root, "hooks"), platform);

  if (platform === Platform.Claude) {
    writeText(join(root, "settings.json"), JSON.stringify(renderHookConfig(platformHooks, platform), null, 2) + "\n");
  } else {
    writeText(join(root, "hooks.json"), JSON.stringify(renderHookConfig(platformHooks, platform), null, 2) + "\n");
    writeText(join(root, "config.toml"), renderCodexConfig());
  }

  const procedureRuntime = await emitProcedureRuntime(componentSurface, root, platform);
  const platformProcedureIds = new Set(procedureRuntime.procedures.map((procedure) => procedure.id));
  const proceduresById = new Map(
    componentSurface.procedures
      .filter((procedure) => platformProcedureIds.has(procedure.id))
      .map((procedure) => [procedure.id, procedure]),
  );

  const platformSkillIds = new Set(
    componentSurface.skills
      .filter((skill) => skill.platforms.includes(platform))
      .map((skill) => skill.id),
  );
  const claudePreloadableSkillIds = new Set(
    componentSurface.skills
      .filter((skill) => skill.platforms.includes(platform))
      .filter((skill) => platform !== Platform.Claude || skill.invocation !== InvocationPolicy.ExplicitOnly)
      .map((skill) => skill.id),
  );
  for (const skill of componentSurface.skills) {
    if (skill.platforms.includes(platform)) await emitSkill(skill, root, platform, proceduresById, platformSkillIds);
  }
  for (const agent of componentSurface.agents) {
    if (agent.platforms.includes(platform)) {
      await emitAgent(agent, root, platform, platformSkillIds, claudePreloadableSkillIds);
    }
  }

  const files = checksumFiles(root);
  const skillIds = componentSurface.skills
    .filter((item) => item.platforms.includes(platform))
    .map((item) => item.id)
    .sort();
  writeText(join(root, "manifest.json"), JSON.stringify({
    schema: manifestSchemaVersion,
    platform,
    instructions: componentSurface.instructions
      .filter((item) => item.platforms.includes(platform))
      .map((item) => item.id)
      .sort(),
    skills: skillIds,
    agents: componentSurface.agents
      .filter((item) => item.platforms.includes(platform))
      .map((item) => item.id)
      .sort(),
    hooks: componentSurface.hooks
      .filter((item) => item.platforms.includes(platform))
      .map((item) => item.id)
      .sort(),
    rules: [...ruleIds].sort(),
    procedures: {
      proceduresFile: procedureRuntime.proceduresFile,
      bundleChecksum: procedureRuntime.bundleChecksum,
      items: procedureRuntime.procedures.map((procedure) => ({
        id: procedure.id,
        target: procedure.target,
        bundled: procedure.bundled,
        runtime: procedure.runtime,
        description: procedure.description,
        owners: procedure.owners,
        argsSchema: procedure.argsSchema,
        outputSchema: procedure.outputSchema,
      })),
    },
    install: renderInstallManifest(platform, skillIds),
    files,
  }, null, 2) + "\n");
}
