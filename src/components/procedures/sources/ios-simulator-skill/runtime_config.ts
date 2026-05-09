import { join } from "node:path";

const IOS_SIMULATOR_SKILL_ID = "ios-simulator-skill";

function runtimeOwnerRoot(): string | null {
  const ownerRoot = (globalThis as Record<string, unknown>)
    .__aiExpertsOwnerRoot;
  return typeof ownerRoot === "string" && ownerRoot.length > 0
    ? ownerRoot
    : null;
}

export function iosSimulatorConfigPath(
  projectDir: any = process.cwd(),
  skillName: any = IOS_SIMULATOR_SKILL_ID,
): string {
  const ownerRoot = runtimeOwnerRoot();
  if (ownerRoot) return join(ownerRoot, "config.json");
  return join(
    projectDir,
    ".ai-experts",
    "skills",
    String(skillName || IOS_SIMULATOR_SKILL_ID),
    "config.json",
  );
}
