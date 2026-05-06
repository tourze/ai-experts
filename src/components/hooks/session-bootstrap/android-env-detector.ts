import { defineHook, HookEvent, KnownTool, Platform, type LegacyHookPayload } from "../../sdk";

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, parse } from "node:path";

export const androidEnvDetectorHook = defineHook({
  id: "android-env-detector",
  description: "检测 Android 项目的 SDK 版本、AGP、Kotlin 与 Gradle 配置。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./android-env-detector.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * env-detector (SessionStart) — Android 项目环境探测
 *
 * 检测 build.gradle(.kts) 中的 compileSdk / minSdk / targetSdk、
 * AGP 版本、Kotlin 版本与关键依赖，
 * 帮助 Claude 从第一条消息起就使用正确的 API Level 和构建约定。
 */


function findUp(name: string, from: string) {
  let dir = from;
  const { root } = parse(dir);
  while (dir !== root) {
    if (existsSync(join(dir, name))) return join(dir, name);
    dir = dirname(dir);
  }
  return null;
}

function readText(p: string) {
  try {
    return readFileSync(p, "utf-8").trim();
  } catch {
    return "";
  }
}

function findGradle(dir: string, base: string) {
  const kts = join(dir, `${base}.kts`);
  if (existsSync(kts)) return kts;
  const groovy = join(dir, base);
  if (existsSync(groovy)) return groovy;
  return null;
}

export async function run(payload: LegacyHookPayload) {
  const cwd = payload?.cwd;
  if (typeof cwd !== "string" || !cwd) return null;

  // 定位项目根（含 settings.gradle）
  const settingsPath =
    findUp("settings.gradle.kts", cwd) || findUp("settings.gradle", cwd);
  if (!settingsPath) return null;

  const projectRoot = dirname(settingsPath);
  const facts = [];

  // ── 根 build.gradle ──
  const rootGradle = findGradle(projectRoot, "build.gradle");
  if (rootGradle) {
    const content = readText(rootGradle);

    // AGP 版本
    const agpMatch =
      content.match(/com\.android\.application['"]\s*version\s*['"]([^'"]+)/) ||
      content.match(/com\.android\.tools\.build:gradle:([^'"]+)/);
    if (agpMatch) facts.push(`AGP: ${agpMatch[1]}`);

    // Kotlin 版本
    const ktMatch =
      content.match(/org\.jetbrains\.kotlin\.android['"]\s*version\s*['"]([^'"]+)/) ||
      content.match(/kotlin[_-]version\s*=\s*['"]([^'"]+)/);
    if (ktMatch) facts.push(`Kotlin: ${ktMatch[1]}`);
  }

  // ── app 模块 build.gradle ──
  const appGradle = findGradle(join(projectRoot, "app"), "build.gradle");
  if (appGradle) {
    const content = readText(appGradle);

    const compileSdk = content.match(/compileSdk(?:Version)?\s*[=:]?\s*(\d+)/);
    if (compileSdk) facts.push(`compileSdk: ${compileSdk[1]}`);

    const minSdk = content.match(/minSdk(?:Version)?\s*[=:]?\s*(\d+)/);
    if (minSdk) facts.push(`minSdk: ${minSdk[1]}`);

    const targetSdk = content.match(/targetSdk(?:Version)?\s*[=:]?\s*(\d+)/);
    if (targetSdk) facts.push(`targetSdk: ${targetSdk[1]}`);

    // Compose
    if (content.includes("compose") || content.includes("Compose")) {
      facts.push("Jetpack Compose: 有");
    }
  }

  // ── gradle/libs.versions.toml（Version Catalog）──
  const catalogPath = join(projectRoot, "gradle/libs.versions.toml");
  if (existsSync(catalogPath) && facts.length <= 1) {
    const catalog = readText(catalogPath);
    if (!facts.some((f) => f.startsWith("AGP"))) {
      const agp = catalog.match(/agp\s*=\s*"([^"]+)"/);
      if (agp) facts.push(`AGP: ${agp[1]}`);
    }
    if (!facts.some((f) => f.startsWith("Kotlin"))) {
      const kt = catalog.match(/kotlin\s*=\s*"([^"]+)"/);
      if (kt) facts.push(`Kotlin: ${kt[1]}`);
    }
  }

  // ── gradle-wrapper.properties ──
  const wrapperProps = join(projectRoot, "gradle/wrapper/gradle-wrapper.properties");
  if (existsSync(wrapperProps)) {
    const content = readText(wrapperProps);
    const gradleVer = content.match(/gradle-(\d+\.\d+(?:\.\d+)?)/);
    if (gradleVer) facts.push(`Gradle: ${gradleVer[1]}`);
  }

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[Android Env] 项目环境探测",
      "",
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
