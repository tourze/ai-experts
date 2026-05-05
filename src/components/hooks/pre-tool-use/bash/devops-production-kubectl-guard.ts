import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const devopsProductionKubectlGuardHook = defineHook({
  id: "devops-production-kubectl-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./devops-production-kubectl-guard.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * 生产集群高危操作守卫（PreToolUse — Bash）
 *
 * 与 dangerous-infra-guard.mjs 互补：
 *   dangerous-infra-guard → 拦截"明确的毁灭性命令"（delete ns, destroy, prune -a）
 *   production-kubectl-guard → 拦截"在生产上下文中有严重副作用的操作性命令"
 *
 * 覆盖场景：
 *   - kubectl drain / cordon（节点下线，Pod 驱逐）
 *   - kubectl scale … --replicas=0（服务停机）
 *   - kubectl apply -f <URL>（不可审计的远程清单）
 *   - kubectl exec -it（进入生产容器）
 *   - kubectl rollout undo（不受控回滚）
 *   - kubectl label/annotate --overwrite（覆盖关键元数据）
 *   - kubectl patch … '{"spec":{"replicas":0}}'（绕过 scale 的停机）
 *
 * 生产上下文判断：
 *   命令中出现 prod/production/prd/live 命名空间、上下文或集群名时视为生产。
 *   无法判断上下文时，对 drain/cordon 等高风险操作一律拦截。
 */

// ── 生产上下文检测 ──
const PROD_INDICATORS = /(?:^|[\s=/"'-])(?:prod(?:uction)?|prd|live|主线)(?:[\s=/"'-]|$)/i;

function looksLikeProduction(cmd) {
  return PROD_INDICATORS.test(cmd);
}

// ── 无论是否生产都必须 block 的规则 ──
const ALWAYS_BLOCK = [
  [
    /\bkubectl\s+drain\b/,
    "kubectl drain 会驱逐节点上全部 Pod，可能导致服务中断",
  ],
  [
    /\bkubectl\s+cordon\b/,
    "kubectl cordon 会禁止新 Pod 调度到节点，需确认是否在维护窗口",
  ],
  [
    /\bkubectl\s+apply\s+-f\s+https?:\/\//,
    "kubectl apply -f <URL> 从远程拉取清单，无法预审内容，可能引入不可控资源",
  ],
];

// ── 仅在生产上下文中 block 的规则 ──
// 注意：kubectl 子命令前可能有 -n namespace 等 flags，
// 所以用 kubectl\b.*\bsubcmd 而非 kubectl\s+subcmd。
const PROD_BLOCK = [
  [
    /\bkubectl\b.*\bexec\b.*\s-(?:it|ti)\b/,
    "kubectl exec -it 进入生产容器可能影响运行中的服务",
  ],
  [
    /\bkubectl\b.*\brollout\s+undo\b/,
    "kubectl rollout undo 会回滚生产部署，请确认目标版本",
  ],
  [
    /\bkubectl\b.*\bscale\b[^;|&]*--replicas\s*=?\s*0\b/,
    "kubectl scale --replicas=0 会停止全部 Pod，等效于服务下线",
  ],
  [
    /\bkubectl\b.*\bpatch\b[^;|&]*"replicas"\s*:\s*0\b/,
    "kubectl patch replicas:0 会停止全部 Pod，等效于服务下线",
  ],
  [
    /\bkubectl\b.*\b(?:label|annotate)\b[^;|&]*--overwrite\b/,
    "--overwrite 会覆盖已有标签/注解，生产上可能影响选择器匹配",
  ],
  [
    /\bkubectl\b.*\bdelete\s+pod\b/,
    "删除生产 Pod 会中断正在处理的请求，请确认是否有就绪副本接管",
  ],
  [
    /\bkubectl\b.*\breplace\s+--force\b/,
    "kubectl replace --force 会先删后建，期间服务不可用",
  ],
];

// ── 仅在生产上下文中 report 的规则 ──
const PROD_REPORT = [
  [
    /\bkubectl\b.*\bedit\b/,
    "kubectl edit 直接修改生产资源，变更不受版本控制",
  ],
  [
    /\bkubectl\b.*\bset\s+image\b/,
    "kubectl set image 直接变更生产镜像，建议通过 CI/CD 管理",
  ],
];

export async function run(payload) {
  const command = payload?.tool_input?.command || "";
  const isProd = looksLikeProduction(command);

  // 1. 无条件 block
  for (const [pattern, reason] of ALWAYS_BLOCK) {
    if (pattern.test(command)) {
      return {
        decision: "block",
        reason: [
          "[Production K8s Guard] 已拦截高风险 kubectl 操作",
          "",
          `原因：${reason}`,
          `命令：${command}`,
          "",
          "如确需执行，必须先得到用户明确授权。",
        ].join("\n"),
      };
    }
  }

  // 2. 生产上下文 block
  if (isProd) {
    for (const [pattern, reason] of PROD_BLOCK) {
      if (pattern.test(command)) {
        return {
          decision: "block",
          reason: [
            "[Production K8s Guard] 已拦截生产环境高风险操作",
            "",
            `原因：${reason}`,
            `命令：${command}`,
            "检测到生产上下文标识（prod/production/prd/live）",
            "",
            "如确需执行，必须先得到用户明确授权。",
          ].join("\n"),
        };
      }
    }

    // 3. 生产上下文 report
    for (const [pattern, reason] of PROD_REPORT) {
      if (pattern.test(command)) {
        return {
          decision: "report",
          reason: `[Production K8s Notice] ${reason}\n命令：${command}`,
        };
      }
    }
  }

  return null;
}
