/**
 * Microsoft Learn CLI 回退链路检查 hook（SessionStart）
 *
 * 目标：
 *   - 校验 `@microsoft/learn-cli` 是否可执行
 *   - 校验 doctor 返回的工具映射是否仍与 skill 文档一致
 *
 * 设计决策：
 *   - 仅 report，不 block
 *   - 优先 MCP，CLI 只是回退链路；回退失败不应阻塞插件使用
 *   - fail-open：异常只汇报，不抛出到 dispatch 外层
 */

import { execFileSync } from "child_process";

const EXPECTED_TOOLS = {
  docsSearch: "microsoft_docs_search",
  docsFetch: "microsoft_docs_fetch",
  codeSearch: "microsoft_code_sample_search",
};

function runDoctor() {
  try {
    const stdout = execFileSync(
      "npx",
      ["-y", "@microsoft/learn-cli", "doctor", "--format", "json"],
      {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 8000,
        maxBuffer: 1024 * 1024,
      }
    ).trim();

    if (!stdout) {
      return { ok: false, reason: "doctor 未返回输出" };
    }

    return { ok: true, payload: JSON.parse(stdout) };
  } catch (error) {
    const stderr = error?.stderr?.toString?.().trim();
    const reason = stderr || error.message || String(error);
    return { ok: false, reason };
  }
}

function collectIssues(payload) {
  const issues = [];

  if (!payload?.ok) {
    issues.push("doctor 返回 ok=false");
  }

  if (payload?.runtime?.supported === false) {
    issues.push(`Node 运行时不受支持：${payload?.runtime?.version || "unknown"}`);
  }

  if (payload?.reachability?.ok === false) {
    issues.push(
      `Learn API 不可达：${payload?.reachability?.status || "unknown"} ${payload?.reachability?.detail || ""}`.trim()
    );
  }

  if (payload?.mcp?.connected === false || payload?.mcp?.discovered === false) {
    issues.push("Learn MCP 连接或工具发现失败");
  }

  for (const [key, expected] of Object.entries(EXPECTED_TOOLS)) {
    const actual = payload?.tools?.[key];
    if (actual !== expected) {
      issues.push(`工具映射异常：${key}=${JSON.stringify(actual)}，期望 ${expected}`);
    }
  }

  for (const error of payload?.errors || []) {
    issues.push(`doctor 错误：${error}`);
  }

  return issues;
}

export async function run() {
  const result = runDoctor();
  if (!result.ok) {
    return {
      decision: "report",
      reason: [
        "[microsoft-expert] Microsoft Learn CLI 回退链路校验失败：",
        `  • ${result.reason}`,
        "  MCP 工具仍可继续使用；如需排查 CLI，请执行：",
        "  npx -y @microsoft/learn-cli doctor --format json",
      ].join("\n"),
    };
  }

  const issues = collectIssues(result.payload);
  if (issues.length === 0) {
    return null;
  }

  return {
    decision: "report",
    reason: [
      "[microsoft-expert] Microsoft Learn CLI 回退链路发现异常：",
      ...issues.map((issue) => `  • ${issue}`),
      "  建议执行：npx -y @microsoft/learn-cli doctor --format json",
    ].join("\n"),
  };
}
