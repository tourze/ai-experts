/**
 * env-detector (SessionStart) — 探测 Apple 客户端项目环境
 *
 * 检测 Xcode 项目、SPM/CocoaPods、Swift 版本与 Apple 平台目标，
 * 帮助 Claude 从第一条消息起就使用正确的构建方式和平台约束。
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, parse } from "node:path";

function findUp(name, from) {
  let dir = from;
  const { root } = parse(dir);
  while (dir !== root) {
    if (existsSync(join(dir, name))) return join(dir, name);
    dir = dirname(dir);
  }
  return null;
}

function readText(p) {
  try {
    return readFileSync(p, "utf-8").trim();
  } catch {
    return "";
  }
}

function hasFileWithExt(dir, ext) {
  try {
    return readdirSync(dir).some((f) => f.endsWith(ext));
  } catch {
    return false;
  }
}

export async function run(payload) {
  const cwd = payload?.cwd;
  if (typeof cwd !== "string" || !cwd) return null;

  const spmPath = findUp("Package.swift", cwd);
  const podfile = findUp("Podfile", cwd);
  const hasXcodeproj = hasFileWithExt(cwd, ".xcodeproj");
  const hasXcworkspace = hasFileWithExt(cwd, ".xcworkspace");
  const swiftVer = findUp(".swift-version", cwd);

  if (!spmPath && !podfile && !hasXcodeproj && !hasXcworkspace && !swiftVer) {
    return null;
  }

  const facts = [];

  // Swift 版本
  if (swiftVer) {
    const ver = readText(swiftVer);
    if (ver) facts.push(`Swift 版本: ${ver}`);
  }

  // 项目类型
  if (spmPath) {
    facts.push("包管理: Swift Package Manager");
    const content = readText(spmPath);

    // Swift tools version
    const toolsMatch = content.match(/swift-tools-version:\s*(\S+)/);
    if (toolsMatch) facts.push(`swift-tools-version: ${toolsMatch[1]}`);

    // 项目名
    const nameMatch = content.match(/name:\s*"([^"]+)"/);
    if (nameMatch) facts.push(`项目名: ${nameMatch[1]}`);

    // 平台
    const platforms = [];
    if (content.includes(".iOS")) platforms.push("iOS");
    if (content.includes(".macOS")) platforms.push("macOS");
    if (content.includes(".watchOS")) platforms.push("watchOS");
    if (content.includes(".tvOS")) platforms.push("tvOS");
    if (content.includes(".visionOS")) platforms.push("visionOS");
    if (platforms.length > 0) facts.push(`平台: ${platforms.join(", ")}`);
  }

  if (hasXcworkspace) {
    facts.push("Xcode Workspace: 有");
  } else if (hasXcodeproj) {
    facts.push("Xcode Project: 有");
  }

  if (podfile) {
    facts.push("CocoaPods: 有 (Podfile)");
  }

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[Apple Env] 项目环境探测",
      "",
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
