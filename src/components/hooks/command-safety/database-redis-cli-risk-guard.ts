import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

export const databaseRedisCliRiskGuardHook = defineHook({
  id: "database-redis-cli-risk-guard",
  description: "拦截 FLUSHALL、KEYS 等高危 redis-cli 命令，防止拖垮实例。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./database-redis-cli-risk-guard.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * redis-cli-risk-guard（PreToolUse — Bash）
 *
 * 拦截或提示当前 agent 直接执行的高风险 redis-cli 命令。
 * 这只约束工具执行行为，不扫描业务源码。
 */

const OPTION_VALUE_FLAGS = new Set([
  "-h",
  "-p",
  "-s",
  "-a",
  "-u",
  "-n",
  "-r",
  "-i",
  "--host",
  "--port",
  "--socket",
  "--pass",
  "--user",
  "--db",
  "--repeat",
  "--interval",
  "--cluster",
  "--pattern",
]);

const BOOLEAN_FLAGS = new Set([
  "--raw",
  "--no-raw",
  "--csv",
  "--stat",
  "--latency",
  "--latency-history",
  "--latency-dist",
  "--bigkeys",
  "--memkeys",
  "--scan",
  "--pipe",
  "-c",
  "--no-auth-warning",
  "--tls",
]);

const BLOCK_REASONS = new Map([
  ["KEYS", "`KEYS` 会遍历整个 keyspace，Redis 官方标记为 @dangerous，生产大库可能拖垮性能"],
  ["MONITOR", "`MONITOR` 会持续输出所有命令，可能显著降低吞吐并造成输出缓冲增长"],
  ["FLUSHALL", "`FLUSHALL` 会清空实例全部数据库"],
  ["FLUSHDB", "`FLUSHDB` 会清空当前数据库"],
]);

const REPORT_REASONS = new Map([
  ["DEL", "`DEL` 删除集合类或 big key 可能阻塞主线程；先用 TYPE/MEMORY USAGE/元素数确认，big key 优先 UNLINK"],
  ["RANDOMKEY", "`RANDOMKEY` 在线上排障价值有限，且可能受大量过期 key 影响；优先用 SCAN/INFO/SLOWLOG"],
  ["SETBIT", "`SETBIT` 大 offset 会触发中间内存分配；执行前确认 offset 上限和 key 当前大小"],
  ["BGSAVE", "`BGSAVE` 会 fork，写多场景需要 COW 内存余量"],
  ["BGREWRITEAOF", "`BGREWRITEAOF` 会 fork，写多场景需要 COW 内存余量和磁盘 IO 余量"],
]);

function splitShellWords(input: string) {
  const words = [];
  const pattern = /"((?:\\.|[^"\\])*)"|'([^']*)'|[^\s]+/g;
  let match;
  while ((match = pattern.exec(input)) !== null) {
    words.push((match[1] ?? match[2] ?? match[0]).replace(/\\(["\\])/g, "$1"));
  }
  return words;
}

function redisCliSegments(command: string) {
  return command
    .split(/[;&|\n]/)
    .map((segment: string) => segment.trim())
    .filter(Boolean);
}

function firstRedisCommand(segment: string) {
  const words = splitShellWords(segment);
  if (words.length === 0) return null;

  let cliIndex = 0;
  while (/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[cliIndex] ?? "")) cliIndex += 1;
  const executable = words[cliIndex];
  if (executable !== "redis-cli" && !executable?.endsWith("/redis-cli")) return null;

  const clusterIndex = words.indexOf("--cluster", cliIndex + 1);
  if (clusterIndex >= 0 && words[clusterIndex + 1]?.toLowerCase() === "call") {
    return words[clusterIndex + 3]?.toUpperCase() ?? null;
  }

  for (let i = cliIndex + 1; i < words.length; i += 1) {
    const word = words[i];
    if (word === "--") continue;
    if (BOOLEAN_FLAGS.has(word)) continue;
    if (word.startsWith("--") && word.includes("=")) continue;
    if (OPTION_VALUE_FLAGS.has(word)) {
      i += 1;
      continue;
    }
    if (word.startsWith("-")) continue;
    return word.toUpperCase();
  }
  return null;
}

export async function run(payload: NormalizedHookPayload) {
  const command = payload?.tool?.input?.command || "";
  const segments = redisCliSegments(command);

  for (const segment of segments) {
    const redisCommand = firstRedisCommand(segment);
    if (!redisCommand) continue;

    const blockReason = BLOCK_REASONS.get(redisCommand);
    if (blockReason) {
      return {
        decision: "block",
        reason: [
          "[Redis CLI Risk] 已拦截高风险 redis-cli 命令",
          "",
          `原因：${blockReason}。`,
          `命令：${command}`,
          "",
          "如确需执行，必须先得到用户明确授权，并说明目标实例、数据范围和回滚/替代方案。",
        ].join("\n"),
      };
    }

    const reportReason = REPORT_REASONS.get(redisCommand);
    if (reportReason) {
      return {
        decision: "report",
        reason: `[Redis CLI Notice] ${reportReason}。\n命令：${command}`,
      };
    }
  }

  return null;
}
